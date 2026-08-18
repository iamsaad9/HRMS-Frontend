import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiDialogContext, TuiErrorPipe, TuiInput } from '@taiga-ui/core';
import {
  TuiButton,
  TuiCheckbox,
  TuiError,
  TuiLabel,
  TuiTextfieldComponent,
  TuiErrorComponent,
} from '@taiga-ui/core';
import { TuiInputNumber, TuiInputTime } from '@taiga-ui/kit';
import { TuiTime } from '@taiga-ui/cdk';

export interface ShiftFormValue {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodLateMinutes: number | null;
  gracePeriodEarlyExitMinutes: number | null;
  isDefault: boolean;
}

@Component({
  selector: 'app-add-shift-modal',
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiCheckbox,
    TuiError,
    TuiErrorComponent,
    TuiLabel,
    TuiTextfieldComponent,
    TuiInputNumber,
    TuiInputTime,
    TuiInput,
  ],
  templateUrl: './add-shift-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddShiftModal {
  protected readonly context =
    inject<TuiDialogContext<ShiftFormValue | null, ShiftFormValue | null>>(POLYMORPHEUS_CONTEXT);

  protected form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startTime: new FormControl<TuiTime | null>(null, { validators: [Validators.required] }),
    endTime: new FormControl<TuiTime | null>(null, { validators: [Validators.required] }),
    gracePeriodLateMinutes: new FormControl<number | null>(null),
    gracePeriodEarlyExitMinutes: new FormControl<number | null>(null),
    isDefault: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    const initial = this.context.data;
    if (initial) {
      this.form.patchValue({
        code: initial.code,
        name: initial.name,
        gracePeriodLateMinutes: initial.gracePeriodLateMinutes,
        gracePeriodEarlyExitMinutes: initial.gracePeriodEarlyExitMinutes,
        isDefault: initial.isDefault,
        // startTime/endTime: parse from string into TuiTime here later if editing
      });
    }
  }

  protected isRequired(controlPath: string): boolean {
    const control = this.form.get(controlPath);
    if (!control?.validator) return false;
    const validator = control.validator({} as any);
    return !!validator?.['required'];
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      return;
    }

    const raw = this.form.getRawValue();

    const payload: ShiftFormValue = {
      code: raw.code,
      name: raw.name,
      startTime: raw.startTime ? raw.startTime.toString() : '',
      endTime: raw.endTime ? raw.endTime.toString() : '',
      gracePeriodLateMinutes: raw.gracePeriodLateMinutes,
      gracePeriodEarlyExitMinutes: raw.gracePeriodEarlyExitMinutes,
      isDefault: raw.isDefault,
    };

    // TODO: call ShiftService.addShift(payload) here later, then complete on success
    this.context.completeWith(payload);
  }

  protected cancel(): void {
    this.context.completeWith(null);
  }
}