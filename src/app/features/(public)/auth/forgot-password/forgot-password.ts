import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly isLoading = signal(false);
  protected readonly isSubmitted = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected hasError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  protected onSubmit(): void {
    if (this.isLoading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const email = this.form.getRawValue().email ?? '';

    this.authService
      .forgotPassword(email)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        // Response message is intentionally the same whether the email exists or not, so it's
        // shown as-is rather than a generic client-side string.
        next: (response) => {
          this.isSubmitted.set(true);
          this.toast.success(response.message || 'If your email is registered, a new password has been sent.');
        },
        error: (error) => {
          const msg = error?.error?.message || 'Something went wrong. Please try again.';
          this.toast.error(msg);
        },
      });
  }
}
