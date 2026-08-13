import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  output,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { EmployeeDetailsForm } from '../../../model/employee.model';
import { TuiCardLarge } from '@taiga-ui/layout';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TuiCardLarge,
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
  @Input({ required: true }) form!: FormGroup;
  @Output() next = new EventEmitter<void>();
  protected readonly departments = [
    'Engineering',
    'Human Resources',
    'Product & Design',
    'Sales & Marketing',
    'Finance',
  ];

  protected isRequired(controlPath: string): boolean {
    const control = this.form.get(controlPath);
    if (!control?.validator) return false;

    const validator = control.validator({} as AbstractControl);
    return !!validator?.['required'];
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    this.next.emit();
  }
}
