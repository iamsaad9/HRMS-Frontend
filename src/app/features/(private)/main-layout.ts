import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ButtonDirective } from 'primeng/button';
import { TuiTextfieldComponent, TuiRoot, TuiDialogService } from '@taiga-ui/core';
import { Loader } from '../../shared/components/loader/loader';
import { AuthService } from '../(public)/auth/services/auth.service';
import { AttendanceService } from './attendance/service/attendance.service';
import { firstValueFrom, forkJoin, finalize } from 'rxjs';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import {
  ChangePasswordModal,
  ChangePasswordPayload,
} from '../(public)/auth/components/change-password-modal/change-password-modal';
import { ToastService } from '../../core/services/toast.service';


@Component({
  imports: [RouterOutlet, NavbarComponent, Loader],
  selector: 'main-layout-root',
  standalone: true,
  templateUrl: './main-layout.html',
})
export default class MainLayout implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    if (this.authService.currentUser()?.isDefaultPassword) {
      this.showChangePasswordModal();
    }
  }

  private showChangePasswordModal(): void {
    this.dialogs
      .open<ChangePasswordPayload | null>(new PolymorpheusComponent(ChangePasswordModal), {
        size: 'l',
        closable: false,
        dismissible: false,
      })
      .subscribe((payload) => {
        if (payload) {
          this.authService
            .changePasswordFirstLogin(payload)
            .subscribe({
              // changePasswordFirstLogin() already logs out (and redirects to /login) on success.
              next: () => {
                this.toast.success('Password changed successfully. Please login again.', 'Password Updated');
              },
              error: (err) => {
                const msg = err?.error?.message || 'Failed to change password';
                this.toast.error(msg, 'Update Failed');
                // Non-dismissible by design - re-prompt rather than leave the user stuck on a
                // dashboard they can't otherwise get off of with a default password.
                this.showChangePasswordModal();
              },
            });
        }
      });
  }
}
