import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { TuiButton, TuiError, TuiLabel, TuiTextfieldComponent, TuiIcon } from '@taiga-ui/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface ChangePasswordPayload {
  newPassword: string;
}

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TuiButton, TuiError, TuiLabel, TuiTextfieldComponent, TuiIcon, MatIconModule],
  templateUrl: './change-password-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordModal {
  protected readonly context = inject<TuiDialogContext<ChangePasswordPayload | null, void>>(POLYMORPHEUS_CONTEXT);
  private readonly fb = inject(FormBuilder);

  protected form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  protected showPassword = false;

  private passwordMatchValidator(form: any): any {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ 'mismatch': true });
      return { 'mismatch': true };
    }
    return null;
  }

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      return;
    }

    const newPassword = this.form.get('newPassword')?.value;
    this.context.completeWith({ newPassword });
  }

  protected cancel(): void {
    this.context.completeWith(null);
  }

  protected hasError(controlName: string, errorType: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched));
  }
}
