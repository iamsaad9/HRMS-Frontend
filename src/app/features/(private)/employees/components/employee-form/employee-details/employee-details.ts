import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TuiDay, TuiTime } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiCheckbox,
  TuiDataList,
  TuiDropdown,
  TuiError,
  TuiGroup,
  TuiIcon,
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
  TuiPassword,
  TuiSelect,
  TuiTooltip,
  TuiInputColorComponent,
} from '@taiga-ui/kit';
import { TuiForm, TuiHeader } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
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
    TuiForm,
    TuiGroup,
    TuiHeader,
    TuiIcon,
    TuiInput,
    TuiInputDate,
    TuiInputNumber,
    TuiInputPhone,
    TuiInputSlider,
    TuiLabel,
    TuiPassword,
    TuiRadio,
    TuiSelect,
    TuiTitle,
    TuiTooltip,
    TuiInputColorComponent,
    MatIcon,
  ],
  templateUrl: './employee-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDetails {
  // Signal output to notify parent stepper to move forward
  readonly formSubmitted = output<typeof this.form.value>();

  protected readonly departments = [
    'Engineering',
    'Human Resources',
    'Product & Design',
    'Sales & Marketing',
    'Finance',
  ];

  protected form = new FormGroup({
    fullName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', Validators.required),
    dob: new FormControl<TuiDay | null>(null, Validators.required),
    department: new FormControl(this.departments[0], Validators.required),
    employmentType: new FormControl('full-time', Validators.required),
    isRemote: new FormControl(false),
    requiresVisa: new FormControl(false),
  });

  protected onSubmit(): void {
    if (this.form.valid) {
      this.formSubmitted.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
