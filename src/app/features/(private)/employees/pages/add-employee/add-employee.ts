import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiButton, TuiIcon, TuiTextfieldComponent, TuiErrorComponent, TuiCalendar } from '@taiga-ui/core';
import { TuiTabs, TuiToast, TuiToastService, TuiDataListWrapperComponent } from '@taiga-ui/kit';
import { TuiDay} from '@taiga-ui/cdk';
import { EmployeeService } from '../../services/employee.service';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  TuiCheckbox,
  TuiError,
  TuiGroup,
  TuiInput,
  TuiLabel,
  TuiRadio,
} from '@taiga-ui/core';
import {
  TuiBlock,
  TuiChevron,
  TuiDataListWrapper,
  TuiInputDate,
  TuiInputNumber,
  TuiInputPhone,
  TuiInputSlider,
  TuiSelect,
} from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { PasswordValidator } from "../../../../(public)/auth/components/password-validator/password-validator";
import { finalize } from 'rxjs';

@Component({
  selector: 'app-add-employee',
  imports: [
    TuiIcon,
    TuiTabs,
    TuiToast,
    TuiButton,
    MainHeading,
    TuiButton,
    TuiTextfieldComponent,
    TuiErrorComponent,
    TuiCalendar,
    TuiDataListWrapperComponent,
    FormsModule,
    TuiBlock,
    TuiButton,
    TuiCheckbox,
    TuiChevron,
    TuiDataListWrapper,
    TuiError,
    TuiGroup,
    TuiInput,
    TuiInputDate,
    TuiInputNumber,
    TuiInputPhone,
    TuiInputSlider,
    TuiLabel,
    TuiRadio,
    TuiSelect,
    ReactiveFormsModule,
    TuiCardLarge,
    PasswordValidator,
],

  templateUrl: './add-employee.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEmployee {
  private readonly employeeService = inject(EmployeeService);
  protected readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  
  protected isSubmiting = signal<boolean>(false);
  protected showValidator = signal<boolean>(false);

  protected form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dob: new FormControl<TuiDay | null>(null),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    gender: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl(''),
    niNumber: new FormControl(''),
    department: new FormControl(''),
    designation: new FormControl(''),
    branch: new FormControl(''),
    manager: new FormControl(''),
    startDate: new FormControl<TuiDay | null>(null),
    employmentType: new FormControl(''),
    status: new FormControl(''),
    password: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[a-z])/),
        Validators.pattern(/(?=.*[A-Z])/),
        Validators.pattern(/(?=.*\d)/),
        Validators.pattern(/(?=.*[@$!%*?&])/),
      ],
    }),
  });


protected readonly titles = ['Mr', 'Mrs', 'Ms', 'Dr', 'Miss'];
protected readonly genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
protected readonly branches = ['Head Office', 'Karachi', 'Lahore', 'Islamabad']; // replace with real data
protected readonly managers = ['Manager A', 'Manager B']; // replace with real data (likely a service call)
protected readonly statuses = ['Active', 'On Leave', 'Suspended', 'Terminated'];

  protected readonly departments = [
    'Engineering',
    'Human Resources',
    'Product & Design',
    'Sales & Marketing',
    'Finance',
  ];

protected isRequired(controlPath: string): boolean {
  const control = this.form.get(controlPath);
  if (!control) return false;
  return control.hasValidator(Validators.required);
}

  protected submitFullPayload(): void {
    if (this.isSubmiting()) return;

    if (this.form.invalid) {
      // Mark all controls as touched so <tui-error> triggers visually
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      return;
    }

    this.isSubmiting.set(true);

    const rawValue = this.form.getRawValue();

    const payload = {
      ...rawValue,
      dob: rawValue.dob ? rawValue.dob.toLocalNativeDate().toISOString() : null,
    };

    this.employeeService
      .addEmployee(payload)
      .pipe(finalize(() => this.isSubmiting.set(false)))
      .subscribe({
        next: () => {
          // Toast or Navigate
        },
        error: (err) => {
          // Handle error
        },
      });
  }

  
}

