import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiDialogContext, TuiButton, TuiError, TuiLabel, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiDataListWrapper, TuiSelect, TuiChevron } from '@taiga-ui/kit';

export type EventType = 'work-day' | 'weekend' | 'holiday' | 'optional-holiday' | 'training-day' | 'custom-event';

export interface CalendarEventFormValue {
  date: string;
  title: string;
  type: EventType;
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
  ],
  templateUrl: './add-calendar-event-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCalendarEventModal {
  protected readonly context =
    inject<TuiDialogContext<CalendarEventFormValue | null, CalendarEventFormValue>>(POLYMORPHEUS_CONTEXT);

  protected readonly typeOptions: { label: string; value: EventType }[] = [
    { label: 'Work Day', value: 'work-day' },
    { label: 'Weekend', value: 'weekend' },
    { label: 'Holiday', value: 'holiday' },
    { label: 'Optional Holiday', value: 'optional-holiday' },
    { label: 'Training Day', value: 'training-day' },
    { label: 'Custom Event', value: 'custom-event' },
  ];

  protected form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<EventType>('holiday', { nonNullable: true, validators: [Validators.required] }),
  });

  protected readonly date = this.context.data.date;

  constructor() {
    this.form.patchValue({
      title: this.context.data.title,
      type: this.context.data.type,
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.context.completeWith({
      date: this.date,
      title: raw.title,
      type: raw.type,
    });
  }

  protected cancel(): void {
    this.context.completeWith(null as any);
  }
}