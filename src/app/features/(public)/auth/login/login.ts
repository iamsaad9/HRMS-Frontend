import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { AutoSlideshowComponent } from '../components/auto-slideshow/auto-slideshow';
import { MatIconModule } from '@angular/material/icon';
import { PasswordValidator } from '../components/password-validator/password-validator';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    AutoSlideshowComponent,
    PasswordValidator,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isSignUp = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  showValidator = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  signInForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  onSubmit(): void {
    this.isLoading.set(true);
    if (this.isSignUp()) {
      const registerPayload = this.signInForm.getRawValue();
      console.log('🔐 Registering user with payload:', registerPayload);
      this.authService
        .register({
          Email: registerPayload.email ?? '',
          Password: registerPayload.password ?? '',
        })
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (response) => {
            console.log('✅ Registration successful:', response);
            this.isSignUp.set(false);
            this.signInForm.reset();
          },
          error: (error) => {
            console.error('❌ Registration failed:', error);
            this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
          },
        });
    } else {
      // this.login();
    }
  }
}
