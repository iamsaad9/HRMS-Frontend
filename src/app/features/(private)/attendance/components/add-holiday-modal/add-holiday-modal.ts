import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import {
  TuiButton,
  TuiCheckbox,
  TuiDialogContext,
  TuiError,
  TuiErrorComponent,
  TuiInput,
  TuiLabel,
  TuiTextfieldComponent,
} from '@taiga-ui/core';
import { HOLIDAY_TYPE_OPTIONS, HolidayType } from '../../service/holiday.service';

export interface HolidayFormValue {
  title: string;
  startDate: string;
  endDate: string;
  type: HolidayType;
  isOptional: boolean;
}

@Component({
  selector: 'app-add-holiday-modal',
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiCheckbox,
    TuiError,
    TuiErrorComponent,
    TuiLabel,
    TuiTextfieldComponent,
    TuiInput,
  ],
  templateUrl: './add-holiday-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHolidayModal {
  protected readonly context =
    inject<TuiDialogContext<HolidayFormValue | null, void>>(POLYMORPHEUS_CONTEXT);

  protected readonly typeOptions = HOLIDAY_TYPE_OPTIONS;

  protected form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<HolidayType>(HolidayType.PublicHoliday, { nonNullable: true }),
    isOptional: new FormControl(false, { nonNullable: true }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      return;
    }

    const raw = this.form.getRawValue();

    if (raw.endDate < raw.startDate) {
      this.form.get('endDate')?.setErrors({ dateRange: true });
      return;
    }

    this.context.completeWith({
      title: raw.title,
      startDate: raw.startDate,
      endDate: raw.endDate,
      type: Number(raw.type) as HolidayType,
      isOptional: raw.isOptional,
    });
  }

  protected cancel(): void {
    this.context.completeWith(null);
  }
}
