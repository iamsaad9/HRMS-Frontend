import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import {
  TuiButton,
  TuiError,
  TuiIcon,
  TuiInput,
  TuiLabel,
  TuiTextfield,
  TuiTextfieldComponent,
} from '@taiga-ui/core';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../model/employee.model';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { TuiCardLarge } from '@taiga-ui/layout';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup,
} from '@angular/forms';
import { AuthService } from '../../../../(public)/auth/services/auth.service';

@Component({
  selector: 'app-employee-view',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    TuiIcon,
    MainHeading,
    TuiCardLarge,
    TuiButton,
    RouterLink,
    ReactiveFormsModule,
    TuiTextfieldComponent,
    TuiLabel,
    TuiError,
    TuiInput,
  ],
  templateUrl: './view-employee.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeView {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authSerivce = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;;

  // Editing (even your own record) goes through Admin/HR - this page is otherwise self-servable
  // (any employee can view their own profile), but the Edit button should only ever show for
  // whoever the /employee/:id/edit route actually lets in.
  protected canEdit = computed(() => this.authSerivce.hasRole(['Admin', 'HR']));

  protected employee = signal<Employee | null>(null);
  protected isLoading = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected isSubmittingPassword = signal(false);
  protected passwordSuccessMessage = signal<string | null>(null);
  protected passwordErrorMessage = signal<string | null>(null);

  protected initials = computed(() => {
    const emp = this.employee();
    if (!emp) return '';
    const parts = emp.fullName.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.errorMessage.set('No employee ID provided.');
        this.isLoading.set(false);
        return;
      }
      this.fetchEmployee(id);
    });
  }

  private fetchEmployee(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.employee.set(null);

    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.employee.set(response.data);
        } else {
          this.errorMessage.set(response.message || 'Employee not found.');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load this employee. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  protected goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  protected navigateToManager(managerId: string | undefined): void {
    if (!managerId) return;
    this.router.navigate(['/employee', managerId, 'view']);
  }

  protected passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required,Validators.minLength(8)]],
    },
  );

  protected submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const emp = this.employee();
    if (!emp) return;

    this.isSubmittingPassword.set(true);
    this.passwordSuccessMessage.set(null);
    this.passwordErrorMessage.set(null);

    const payload = this.passwordForm.getRawValue();

    this.authSerivce.changePassword(payload).subscribe({
      next: () => {
        this.passwordSuccessMessage.set('Password updated successfully.');
        this.passwordForm.reset();
        this.isSubmittingPassword.set(false);
      },
      error: () => {
        this.passwordErrorMessage.set('Could not update password. Please try again.');
        this.isSubmittingPassword.set(false);
      },
    });
  }
}
