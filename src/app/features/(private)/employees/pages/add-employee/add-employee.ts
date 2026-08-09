import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiTabs, TuiToast, TuiToastService } from '@taiga-ui/kit';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import { EmployeeDetails } from '../../components/employee-form/employee-details/employee-details';
import { EmployeeExperience } from '../../components/employee-form/employee-experience/employee-experience';
import { EmployeeDocuments } from '../../components/employee-form/employee-documents/employee-documents';
import { EmployeeService } from '../../services/employee.service';
import { AdditionalDetails } from '../../components/employee-form/additional-details/additional-details';
import { MatIcon } from '@angular/material/icon';
import { DynamicToast } from '../../../../../shared/components/toast/DynamicToast';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { finalize } from 'rxjs';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { Router } from '@angular/router';

interface StepConfig {
  id: number;
  title: string;
}

@Component({
  selector: 'app-add-employee',
  imports: [
    TuiIcon,
    TuiTabs,
    EmployeeDetails,
    EmployeeExperience,
    EmployeeDocuments,
    AdditionalDetails,
    MatIcon,
    TuiToast,
    TuiButton,
    MainHeading,
    TuiButton,
  ],
  templateUrl: './add-employee.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEmployee {
  private readonly employeeService = inject(EmployeeService);
  protected readonly router = inject(Router);
  private readonly toast = inject(TuiToastService);
  protected isSubmiting = signal<Boolean>(false);
  protected readonly steps: StepConfig[] = [
    { id: 0, title: 'Employee Details' },
    { id: 1, title: 'Work Experience' },
    { id: 2, title: 'Related Documents' },
    { id: 3, title: 'Additional Details' },
  ];

  protected form = new FormGroup({
    employeeDetails: new FormGroup({
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      phone: new FormControl(''),
      dob: new FormControl<TuiDay | null>(null),
      department: new FormControl(''),
      employmentType: new FormControl(''),
      isRemote: new FormControl(false),
      requireVisa: new FormControl(false),
    }),

    experiences: new FormArray<FormGroup>([
      new FormGroup({
        companyName: new FormControl(''),
        jobTitle: new FormControl(''),
        isCurrent: new FormControl(false),
        employmentPeriod: new FormControl<TuiDayRange | null>(null),
        startDate: new FormControl<TuiDay | null>(null),
        responsibilities: new FormControl(''),
      }),
    ]),

    educations: new FormArray<FormGroup>([
      new FormGroup({
        institution: new FormControl(''),
        degree: new FormControl(''),
        period: new FormControl<TuiDayRange | null>(null),
      }),
    ]),

    documents: new FormGroup({
      educationFiles: new FormControl<File[]>([], {
        nonNullable: true,
        validators: [maxFilesLength(5)],
      }),
      experienceFiles: new FormControl<File[]>([], {
        nonNullable: true,
        validators: [maxFilesLength(5)],
      }),
      identityFiles: new FormControl<File[]>([], {
        nonNullable: true,
        validators: [maxFilesLength(5)],
      }),
      otherFiles: new FormControl<File[]>([], {
        nonNullable: true,
        validators: [maxFilesLength(5)],
      }),
    }),

    additionalDetails: new FormGroup({
      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/(?=.*[a-z])/), // At least one lowercase letter
          Validators.pattern(/(?=.*[A-Z])/), // At least one uppercase letter
          Validators.pattern(/(?=.*\d)/), // At least one digit
          Validators.pattern(/(?=.*[@$!%*?&])/), // At least one special character
        ],
      }),
    }),
  });

  protected activeStepIndex = signal<number>(0);
  protected unlockedSteps = signal<Set<number>>(new Set([0, 1, 2, 3]));

  private readonly stepSectionKeys: Record<number, string> = {
    0: 'employeeDetails',
    1: 'experiences',
    2: 'documents',
    3: 'additionalDetails',
  };

  protected isStepDisabled(stepId: number): boolean {
    return !this.unlockedSteps().has(stepId);
  }

  protected selectStep(stepId: number): void {
    if (this.unlockedSteps().has(stepId)) {
      this.activeStepIndex.set(stepId);
    }
  }

  protected goToStep(stepId: number): void {
    this.unlockedSteps.update((current) => new Set(current).add(stepId));
    this.activeStepIndex.set(stepId);
  }

  protected previousStep(): void {
    this.activeStepIndex.update((curr) => Math.max(0, curr - 1));
  }

  protected getStepColor(stepId: number): string {
    const controlKey = this.stepSectionKeys[stepId];
    const control = controlKey ? this.form.get(controlKey) : null;

    if (!control || (!control.touched && !control.dirty)) {
      return 'inherit';
    }

    return control.valid ? 'var(--tui-status-positive, green) !important' : '';
  }

  protected showDynamicToast(appearance: 'positive' | 'negative', message: string): void {
    this.toast
      .open(new PolymorpheusComponent(DynamicToast), {
        data: {
          message,
          appearance,
        },
        autoClose: 3000,
      })
      .subscribe();
  }

  protected submitFullPayload(): void {
    if (this.isSubmiting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();

      const firstInvalidStep = Object.entries(this.stepSectionKeys).find(
        ([, key]) => this.form.get(key)?.invalid,
      );

      if (firstInvalidStep) {
        this.showDynamicToast('negative', 'Please fill required fields');
        this.goToStep(Number(firstInvalidStep[0]));
      }
      return;
    }

    this.isSubmiting.set(true);
    const value = this.form.getRawValue();
    const payload = {
      ...value.employeeDetails,
      dob: value.employeeDetails.dob?.toLocalNativeDate() ?? null,
      experiences: value.experiences,
      educations: value.educations,
      documents: value.documents,
      ...value.additionalDetails,
    };

    this.employeeService
      .addEmployee(payload)
      .pipe(finalize(() => this.isSubmiting.set(false)))
      .subscribe({
        next: () => {
          this.showDynamicToast('positive', 'Employee Created');
        },
        error: () => {
          this.showDynamicToast('negative', 'Failed to create employee');
        },
      });
  }
}

function maxFilesLength(maxLength: number) {
  return ({ value }: { value: File[] }) =>
    value && value.length > maxLength
      ? { maxLength: `Error: maximum limit - ${maxLength} files for upload` }
      : null;
}
