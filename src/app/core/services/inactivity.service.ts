import { Injectable, inject, signal, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

type BroadcastMessage =
  | { type: 'ACTIVITY_DETECTED'; expiresAt: number }
  | { type: 'SESSION_EXTENDED'; expiresAt: number }
  | { type: 'LOGOUT' };

const STORAGE_KEY = 'hcm_inactivity_expires_at';
const CHANNEL_NAME = 'hcm_inactivity_channel';
const TICK_MS = 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

/**
 * Tracks user idle time and logs out after a period of inactivity, with a warning countdown
 * before the actual logout, kept in sync across every open tab.
 *
 * Two things that broke the previous RxJS-`timer()`-based version, and how this one avoids them:
 *
 * 1. Background tabs throttle/suspend JS timers (RxJS `timer()` included) - a tab left in the
 *    background for a while would resume with the countdown having silently jumped, because the
 *    timer was counting *ticks*, not wall-clock time. This version never counts ticks: it persists
 *    an absolute `expiresAt` timestamp (`Date.now() + timeout`) and every recomputation - a tick,
 *    a `visibilitychange`, a broadcast message - derives `remaining = expiresAt - Date.now()` fresh
 *    from wall-clock time. A throttled tab just recomputes a smaller (correct) number the next time
 *    it runs; there's no drift to correct because nothing was ever counted incrementally.
 * 2. There was no cross-tab awareness at all, so activity in one tab never stopped a different,
 *    idle tab from warning/logging out. `expiresAt` is mirrored to `localStorage` and every
 *    extension is announced over a `BroadcastChannel` so every open tab converges on the same
 *    deadline.
 */
@Injectable({
  providedIn: 'root',
})
export class InactivityService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);

  // Configuration (seconds). Total time-to-logout from the last activity is
  // IDLE_TIMEOUT_SEC + WARNING_COUNTDOWN_SEC; the warning shows for the final WARNING_COUNTDOWN_SEC.
  private readonly IDLE_TIMEOUT_SEC = 600; // 10 min idle before the warning
  private readonly WARNING_COUNTDOWN_SEC = 15; // 15s warning modal before auto-logout

  readonly countdown = signal<number>(this.WARNING_COUNTDOWN_SEC);
  readonly isWarningOpen = signal<boolean>(false);

  private channel: BroadcastChannel | null = null;
  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private lastActivityAt = 0;
  private readonly activityThrottleMs = 2000;
  private loggingOut = false;
  private monitoring = false;

  // Stable references so add/removeEventListener target the exact same listener.
  private readonly boundOnActivity = this.onDomActivity.bind(this);
  private readonly boundOnVisibility = this.onVisibilityChange.bind(this);
  private readonly boundOnMessage = this.onBroadcastMessage.bind(this);

  startMonitoring(): void {
    this.stopMonitoring();
    this.loggingOut = false;
    this.monitoring = true;

    this.openChannel();
    this.resetExpiry({ broadcast: false, type: 'SESSION_EXTENDED' }); // establishes the initial deadline

    this.ngZone.runOutsideAngular(() => {
      for (const eventName of ACTIVITY_EVENTS) {
        document.addEventListener(eventName, this.boundOnActivity, { passive: true, capture: true });
      }
      document.addEventListener('visibilitychange', this.boundOnVisibility);
      this.tickHandle = setInterval(() => this.tick(), TICK_MS);
    });
  }

  stopMonitoring(): void {
    this.monitoring = false;

    for (const eventName of ACTIVITY_EVENTS) {
      document.removeEventListener(eventName, this.boundOnActivity, { capture: true });
    }
    document.removeEventListener('visibilitychange', this.boundOnVisibility);

    if (this.tickHandle !== null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }

    this.channel?.close();
    this.channel = null;

    localStorage.removeItem(STORAGE_KEY);
    this.isWarningOpen.set(false);
    this.countdown.set(this.WARNING_COUNTDOWN_SEC);
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  /** "Keep me logged in" - also refreshes the access token, since the warning can fire long after
   * it expired, not just the idle window. */
  extendSession(): void {
    this.authService.refreshToken().subscribe({
      next: (res) => {
        if (res?.isSuccess && res?.data) {
          this.resetExpiry({ broadcast: true, type: 'SESSION_EXTENDED' });
        } else {
          this.handleAutoLogout();
        }
      },
      error: () => this.handleAutoLogout(),
    });
  }

  /** Auto-logout (deadline reached) or explicit "Log out now" from the warning dialog. */
  handleAutoLogout(broadcast = true): void {
    if (this.loggingOut) return;
    this.loggingOut = true;

    if (broadcast) {
      this.channel?.postMessage({ type: 'LOGOUT' } satisfies BroadcastMessage);
    }

    this.stopMonitoring();
    this.authService.logout().subscribe();
  }

  // ---- internals ----

  private openChannel(): void {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    // Listener is attached outside the zone; individual handlers below re-enter the zone only
    // where they touch signals that drive the UI.
    this.ngZone.runOutsideAngular(() => {
      this.channel!.onmessage = this.boundOnMessage;
    });
  }

  private onBroadcastMessage(event: MessageEvent<BroadcastMessage>): void {
    if (!this.monitoring) return;
    const message = event.data;

    switch (message.type) {
      case 'ACTIVITY_DETECTED':
      case 'SESSION_EXTENDED':
        // Genuine activity elsewhere always wins, even if this tab's own warning is showing -
        // the user is demonstrably still there, just in a different tab.
        this.ngZone.run(() => this.applyExpiry(message.expiresAt));
        break;
      case 'LOGOUT':
        this.ngZone.run(() => this.handleAutoLogout(false));
        break;
    }
  }

  private onDomActivity(): void {
    if (!this.monitoring || this.loggingOut || this.isWarningOpen()) {
      // Once the warning is showing, plain mouse movement must NOT silently dismiss it - only an
      // explicit action (extendSession/handleAutoLogout) should.
      return;
    }

    const now = Date.now();
    if (now - this.lastActivityAt < this.activityThrottleMs) return;
    this.lastActivityAt = now;

    this.resetExpiry({ broadcast: true, type: 'ACTIVITY_DETECTED' });
  }

  private onVisibilityChange(): void {
    // The interval below may have been throttled or fully suspended for however long this tab
    // was backgrounded - re-derive state from wall-clock time the instant it's foregrounded
    // again, instead of waiting for the next (possibly still-throttled) tick.
    if (document.visibilityState === 'visible') {
      this.ngZone.run(() => this.tick());
    }
  }

  private tick(): void {
    if (!this.monitoring || this.loggingOut) return;

    const stored = Number(localStorage.getItem(STORAGE_KEY));
    const expiresAt = Number.isFinite(stored) && stored > 0 ? stored : this.deadlineFromNow();
    this.applyExpiry(expiresAt);
  }

  private resetExpiry(opts: { broadcast: boolean; type: 'ACTIVITY_DETECTED' | 'SESSION_EXTENDED' }): void {
    const expiresAt = this.deadlineFromNow();
    localStorage.setItem(STORAGE_KEY, String(expiresAt));

    if (opts.broadcast) {
      this.channel?.postMessage({ type: opts.type, expiresAt } satisfies BroadcastMessage);
    }

    this.applyExpiry(expiresAt);
  }

  private deadlineFromNow(): number {
    return Date.now() + (this.IDLE_TIMEOUT_SEC + this.WARNING_COUNTDOWN_SEC) * 1000;
  }

  /** Single source of truth for countdown/isWarningOpen - always recomputed fresh from wall-clock
   * time against a stored deadline, never from elapsed-ticks bookkeeping, so a throttled or
   * suspended background tab can't drift: the very next time this runs it converges on the
   * correct value immediately, with no gradual catch-up. */
  private applyExpiry(expiresAt: number): void {
    if (this.loggingOut) return;

    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      this.handleAutoLogout();
      return;
    }

    const warningWindowMs = this.WARNING_COUNTDOWN_SEC * 1000;
    this.isWarningOpen.set(remainingMs <= warningWindowMs);
    this.countdown.set(Math.min(this.WARNING_COUNTDOWN_SEC, Math.ceil(remainingMs / 1000)));
  }
}
