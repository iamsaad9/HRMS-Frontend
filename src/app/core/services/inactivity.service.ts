import { Injectable, inject, signal, NgZone, OnDestroy } from '@angular/core';
import { Subject, Subscription, timer, fromEvent, merge } from 'rxjs';
import { takeUntil, switchMap, filter, takeWhile, startWith } from 'rxjs/operators';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class InactivityService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);

  // Configuration (In Seconds)
  private readonly IDLE_TIMEOUT_SEC = 300; // 5 mins idle
  private readonly WARNING_COUNTDOWN_SEC = 15; // 15s modal timer

  readonly countdown = signal<number>(this.WARNING_COUNTDOWN_SEC);
  readonly isWarningOpen = signal<boolean>(false);

  private readonly destroy$ = new Subject<void>();
  private activitySub?: Subscription;
  private countdownSub?: Subscription;

  startMonitoring(): void {
    this.stopMonitoring();

    this.ngZone.runOutsideAngular(() => {
      const userActivity$ = merge(
        fromEvent(window, 'mousemove'),
        fromEvent(window, 'keydown'),
        fromEvent(window, 'click'),
        fromEvent(window, 'scroll'),
        fromEvent(window, 'touchstart'),
      );

      this.activitySub = userActivity$
        .pipe(
          filter(() => !this.isWarningOpen()),
          startWith(null),
          switchMap(() => timer(this.IDLE_TIMEOUT_SEC * 1000)),
          takeUntil(this.destroy$),
        )
        .subscribe(() => {
          this.ngZone.run(() => this.triggerWarningDialog());
        });
    });
  }

  private triggerWarningDialog(): void {
    this.isWarningOpen.set(true);
    this.countdown.set(this.WARNING_COUNTDOWN_SEC);

    // Cancel any previous ticking timer
    this.countdownSub?.unsubscribe();

    this.ngZone.runOutsideAngular(() => {
      this.countdownSub = timer(0, 1000)
        .pipe(
          takeUntil(this.destroy$),
          // Automatically un-subscribe when timer completes past 0
          takeWhile((elapsed) => this.WARNING_COUNTDOWN_SEC - elapsed >= 0),
        )
        .subscribe({
          next: (elapsed) => {
            const remaining = this.WARNING_COUNTDOWN_SEC - elapsed;

            this.ngZone.run(() => {
              this.countdown.set(remaining);
              if (remaining === 0) {
                this.handleAutoLogout();
              }
            });
          },
        });
    });
  }

  extendSession(): void {
    this.countdownSub?.unsubscribe();
    this.isWarningOpen.set(false);

    this.authService.refreshToken().subscribe({
      next: (res) => {
        if (res?.isSuccess && res?.data) {
          this.startMonitoring();
        } else {
          this.handleAutoLogout();
        }
      },
      error: () => this.handleAutoLogout(),
    });
  }

  handleAutoLogout(): void {
    this.stopMonitoring();
    this.isWarningOpen.set(false);
    this.authService.logout().subscribe();
  }

  stopMonitoring(): void {
    this.activitySub?.unsubscribe();
    this.countdownSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
