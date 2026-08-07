import { Component, inject } from '@angular/core';
import { TuiButton, TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { InactivityService } from '../../../core/services/inactivity.service';
import { AuthService } from '../../../features/(public)/auth/services/auth.service';

@Component({
  selector: 'app-inactivity-dialog',
  standalone: true,
  imports: [TuiButton],
  template: `
    <div class="p-4 text-center">
      <h3 class="text-xl font-bold mb-2">Are you still there?</h3>
      <p class="mb-6 text-gray-600">
        You have been inactive for a while. For security reasons, your session will expire in:
      </p>

      <div class="text-4xl font-extrabold text-red-500 mb-6">
        {{ inactivityService.countdown() }}s
      </div>

      <div class="flex justify-center gap-3">
        <button tuiButton type="button" appearance="accent" size="m" (click)="keepAlive()">
          Keep Me Logged In
        </button>
        <button tuiButton type="button" appearance="secondary" size="m" (click)="logout()">
          Log Out Now
        </button>
      </div>
    </div>
  `,
})
export class InactivityDialogComponent {
  protected readonly inactivityService = inject(InactivityService);
  private readonly context = inject<TuiDialogContext<boolean>>(POLYMORPHEUS_CONTEXT);

  keepAlive(): void {
    this.inactivityService.extendSession();
    this.context.completeWith(true);
  }

  logout(): void {
    this.inactivityService.handleAutoLogout();
    this.context.completeWith(false);
  }
}
