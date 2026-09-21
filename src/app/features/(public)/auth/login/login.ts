import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AutoSlideshowComponent } from '../components/auto-slideshow/auto-slideshow';
import { MatIconModule } from '@angular/material/icon';
import { PasswordValidator } from '../components/password-validator/password-validator';
import { ToastService } from '../../../../core/services/toast.service';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {  FormGroup, AbstractControl } from '@angular/forms';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, PasswordValidator, RouterLink],
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

  // Stepper state — only relevant while isSignUp() is true
  currentStep = signal<1 | 2>(1);
  employeeDetailsValid = signal<boolean>(false);

  loginForm = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['' ],
    },
    { updateOn: 'submit' }
  );

  // Nested groups so step-by-step validation and payload flattening stay clean
  signUpForm = this.fb.group({
    employeeDetails: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', ],
    }),
    employmentDetails: this.fb.group({
      designationId: ['', Validators.required],
      departmentId: ['', Validators.required],
      branchId: ['', Validators.required],
      managerId: [null],
    }),
  });

  constructor() {
    // Keep employeeDetailsValid in sync so the template can gate the "Next" button
    const employeeDetailsGroup = this.signUpForm.get('employeeDetails')!;
    employeeDetailsGroup.statusChanges.subscribe(() => {
      this.employeeDetailsValid.set(employeeDetailsGroup.valid);
    });
    // Initialize on load
    this.employeeDetailsValid.set(employeeDetailsGroup.valid);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  toggleSignUp(): void {
    this.isSignUp.update((val) => !val);
    this.errorMessage.set(null);
    this.currentStep.set(1);
    this.loginForm.reset();
    this.signUpForm.reset();
  }

  goToEmploymentStep(): void {
    const employeeDetailsGroup = this.signUpForm.get('employeeDetails')!;
    employeeDetailsGroup.markAllAsTouched();
    employeeDetailsGroup.updateValueAndValidity();

    if (employeeDetailsGroup.valid) {
      this.currentStep.set(2);
    }
  }

  goToEmployeeStep(): void {
    this.currentStep.set(1);
  }

  // Helper method to check if a field is invalid & touched
  hasError(controlName: string, groupName?: 'employeeDetails' | 'employmentDetails'): boolean {
  const form = (this.isSignUp() ? this.signUpForm : this.loginForm) as unknown as FormGroup;
  const control: AbstractControl | null = groupName
    ? form.get(groupName)?.get(controlName) ?? null
    : form.get(controlName);

  return !!(control && control.invalid && (control.touched || control.dirty));
}

// Helper method to retrieve user-friendly error messages
getErrorMessage(controlName: string, groupName?: 'employeeDetails' | 'employmentDetails'): string {
  const form = (this.isSignUp() ? this.signUpForm : this.loginForm) as unknown as FormGroup;
  const control: AbstractControl | null = groupName
    ? form.get(groupName)?.get(controlName) ?? null
    : form.get(controlName);

  if (!control || !control.errors) return '';

  if (control.errors['required']) return 'This field is required';
  if (control.errors['email']) return 'Please enter a valid email address';
  return 'Invalid field';
}

  onSubmit(): void {
    if (this.isLoading()) return;

    this.errorMessage.set(null);

    if (this.isSignUp()) {
      // Sign Up button only submits from step 2 — guard anyway in case of a stray submit event
      if (this.currentStep() !== 2 || this.signUpForm.invalid) {
        this.signUpForm.markAllAsTouched();
        return;
      }

      this.isLoading.set(true);

      const raw = this.signUpForm.getRawValue();
      const registerPayload = {
        email: raw.employeeDetails?.email ?? '',
        password: raw.employeeDetails?.password ?? '',
        firstName: raw.employeeDetails?.firstName ?? '',
        lastName: raw.employeeDetails?.lastName ?? '',
        designationId: raw.employmentDetails?.designationId ?? '',
        departmentId: raw.employmentDetails?.departmentId ?? '',
        branchId: raw.employmentDetails?.branchId ?? '',
        managerId: raw.employmentDetails?.managerId ?? null,
      };

      this.authService
        .register(registerPayload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.toast.success('User created successfully!', 'Registration Successful!');
            this.isSignUp.set(false);
            this.currentStep.set(1);
            this.signUpForm.reset();
          },
          error: (error) => {
            const msg = error.error?.message || 'Registration failed. Please try again.';
            this.errorMessage.set(msg);
            this.toast.error(msg, 'Registration Unsuccessful!');
          },
        });
    } else {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        return;
      }

      this.isLoading.set(true);
      const loginPayload = this.loginForm.getRawValue();

      this.authService
        .login({ email: loginPayload.email ?? '', password: loginPayload.password ?? '' })
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.toast.success('Login Successful!');
            this.loginForm.reset();
            // The forced default-password change modal (if needed) is shown from MainLayout once
            // the user is actually inside the app, not here on top of the login page.
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            // Backend returns a specific reason (e.g. "User is inactive") in the response body -
            // show that instead of a generic message whenever it's actually present.
            const msg = error.error?.message || 'Invalid email or password';
            this.toast.error(msg, 'Login Unsuccessful!');
            this.errorMessage.set(msg);
          },
        });
    }
  }
}