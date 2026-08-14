import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { AutoSlideshowComponent } from '../components/auto-slideshow/auto-slideshow';
import { MatIconModule } from '@angular/material/icon';
import { PasswordValidator } from '../components/password-validator/password-validator';
import { ToastService } from '../../../../core/services/toast.service';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    PasswordValidator,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})

export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly toast = inject(ToastService);

  isSignUp = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  showValidator = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
}, { 
  updateOn: 'submit' // Options: 'change' (default), 'blur', or 'submit'
});

  signUpForm = this.fb.group({
  firstName: ['', Validators.required],
  lastName: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.required],
}, { 
  updateOn: 'submit' // Options: 'change' (default), 'blur', or 'submit'
});

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  toggleSignUp(): void {
    this.isSignUp.update((val) => !val);
    this.errorMessage.set(null); // Clear previous backend errors
    this.loginForm.reset();
    this.signUpForm.reset();
  }

  // Helper method to check if a field is invalid & touched
hasError(controlName: string): boolean {
    const control = this.isSignUp()
      ? this.signUpForm.get(controlName as keyof typeof this.signUpForm.controls)
      : this.loginForm.get(controlName as keyof typeof this.loginForm.controls);

    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  // Helper method to retrieve user-friendly error messages
  getErrorMessage(controlName: string): string {
    const control = this.isSignUp()
      ? this.signUpForm.get(controlName as keyof typeof this.signUpForm.controls)
      : this.loginForm.get(controlName as keyof typeof this.loginForm.controls);

    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }
    return 'Invalid field';
  }

  onSubmit(): void {
    if (this.isLoading()) return;

    this.errorMessage.set(null);
    const activeForm = this.isSignUp() ? this.signUpForm : this.loginForm;

    if (activeForm.invalid) {
      activeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    if (this.isSignUp()) {
      const registerPayload = this.signUpForm.getRawValue();

      this.authService
        .register({
          firstName: registerPayload.firstName ?? '',
          lastName: registerPayload.lastName ?? '',
          email: registerPayload.email ?? '',
          password: registerPayload.password ?? '',
        })
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            this.toast.success('User created successfully!', 'Registration Successful!');
            this.isSignUp.set(false);
            this.signUpForm.reset();
          },
          error: (error) => {
            const msg = error.error?.message || 'Registration failed. Please try again.';
            this.errorMessage.set(msg);
            this.toast.error(msg, 'Registration Unsuccessful!');
          },
        });
    } else {
      const loginPayload = this.loginForm.getRawValue();

      this.authService
        .login({
          email: loginPayload.email ?? '',
          password: loginPayload.password ?? '',
        })
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            this.toast.success('Login Successful!');
            this.loginForm.reset();
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            const msg = 'Invalid email or password';
            this.toast.error(msg, 'Login Unsuccessful!');
            this.errorMessage.set(msg);
          },
        });
    }
  }
}
