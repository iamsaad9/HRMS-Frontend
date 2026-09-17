import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiDialogContext, TuiButton, TuiError, TuiLabel, TuiTextfieldComponent, TuiCalendar } from '@taiga-ui/core';
import { TuiDataListWrapper, TuiSelect, TuiChevron, TuiInputDate } from '@taiga-ui/kit';
import { TuiDay } from '@taiga-ui/cdk';
import { HolidayType, HOLIDAY_TYPE_OPTIONS, HOLIDAY_TYPES_BY_CATEGORY } from '../../service/holiday.service';
import { CategoryType } from '../../../employees/model/employee.model';

export interface HolidayFormValue {
  title: string;
  startDate: string;
  endDate: string;
  type: HolidayType;
}

export interface HolidayFormData {
  startDate: string;
  category: CategoryType;
  title?: string;
  type?: HolidayType;
}

@Component({
  selector: 'app-add-calendar-event-modal',
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiError,
    TuiLabel,
    TuiTextfieldComponent,
    TuiDataListWrapper,
    TuiSelect,
    TuiChevron,
    TuiInputDate,
    TuiCalendar,
  ],
  templateUrl: './add-calendar-event-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCalendarEventModal {
  protected readonly context =
    inject<TuiDialogContext<HolidayFormValue | null, HolidayFormData>>(POLYMORPHEUS_CONTEXT);

  /** Only the types that make sense for the category being managed (e.g. no Term Break for
   * Administrative staff) - see HOLIDAY_TYPES_BY_CATEGORY for why this is a fixed mapping rather
   * than something read from the database. */
  protected readonly typeOptions = HOLIDAY_TYPES_BY_CATEGORY[this.context.data.category]
    .map((value) => HOLIDAY_TYPE_OPTIONS.find((o) => o.value === value)!.label);

  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value as TuiDay | null;
    const end = group.get('endDate')?.value as TuiDay | null;
    if (!start || !end) return null;
    return end.toLocalNativeDate() < start.toLocalNativeDate() ? { dateRange: true } : null;
  }

  protected form = new FormGroup(
    {
      title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      startDate: new FormControl<TuiDay | null>(null, { validators: [Validators.required] }),
      endDate: new FormControl<TuiDay | null>(null, { validators: [Validators.required] }),
      type: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: this.dateRangeValidator },
  );

  constructor() {
    const data = this.context.data;
    const startDay = this.isoToTuiDay(data.startDate) ?? TuiDay.currentLocal();
    const requestedLabel = data.type != null
      ? HOLIDAY_TYPE_OPTIONS.find((o) => o.value === data.type)?.label
      : undefined;
    const defaultType = requestedLabel && this.typeOptions.includes(requestedLabel)
      ? requestedLabel
      : this.typeOptions[0] ?? '';
    this.form.patchValue({
      title: data.title ?? '',
      startDate: startDay,
      endDate: startDay,
      type: defaultType,
    });
  }

  private isoToTuiDay(iso: string | null | undefined): TuiDay | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    return TuiDay.fromLocalNativeDate(date);
  }

  /** yyyy-MM-dd from local date parts - avoids the UTC day-shift `toISOString()` would introduce. */
  private tuiDayToIso(day: TuiDay): string {
    return `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
  }

  protected hasError(controlName: string, errorType: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const type = HOLIDAY_TYPE_OPTIONS.find((o) => o.label === raw.type)?.value ?? HolidayType.BankHoliday;
    this.context.completeWith({
      title: raw.title,
      startDate: this.tuiDayToIso(raw.startDate!),
      endDate: this.tuiDayToIso(raw.endDate!),
      type,
    });
  }

  protected cancel(): void {
    this.context.completeWith(null);
  }
}
