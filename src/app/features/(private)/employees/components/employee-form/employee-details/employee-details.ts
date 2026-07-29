import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TuiDay } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiCheckbox,
  TuiError,
  TuiGroup,
  TuiInput,
  TuiLabel,
  TuiRadio,
  TuiTitle,
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
import { MatIcon } from '@angular/material/icon';
import { EmployeeDetailsForm } from '../../../model/employee-model';
@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
    TuiTitle,
    MatIcon,
  ],
  templateUrl: './employee-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDetails {
  readonly formSubmitted = output<EmployeeDetailsForm>();

  protected readonly departments = [
    'Engineering',
    'Human Resources',
    'Product & Design',
    'Sales & Marketing',
    'Finance',
  ];

  protected form = new FormGroup({
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dob: new FormControl<TuiDay | null>(null, [Validators.required]),
    department: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    employmentType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    isRemote: new FormControl(false, { nonNullable: true }),
    requireVisa: new FormControl(false, { nonNullable: true }),
  });

  protected onSubmit(data: EmployeeDetailsForm): void {
    if (this.form.valid) {
      const value = this.form.getRawValue();

      this.formSubmitted.emit({
        ...value,
        dob: value.dob?.toLocalNativeDate() ?? null,
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
