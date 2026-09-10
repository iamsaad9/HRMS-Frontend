import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import {
  TuiButton,
  TuiDataList,
  TuiDialogContext,
  TuiDropdown,
  TuiError,
  TuiErrorComponent,
  TuiInput,
  TuiLabel,
  TuiOption,
  TuiTextfield,
  TuiTextfieldComponent,
} from '@taiga-ui/core';
import { TuiChevron, TuiInputNumber, TuiSelect, TuiTextarea } from '@taiga-ui/kit';
import { LeaveTypeResponse } from '../../../leave-management/model/leave-request.model';

export interface AdjustBalanceFormValue {
  leaveTypeId: string;
  adjustmentDays: number;
  reason: string;
}

export interface AdjustBalanceModalData {
  employeeName: string;
  leaveTypes: LeaveTypeResponse[];
}
@Component({
  selector: 'app-adjust-balance-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiError,
    TuiErrorComponent,
    TuiLabel,
    TuiTextfieldComponent,
    TuiInput,
    TuiInputNumber,
    TuiTextarea,
    TuiChevron,
    TuiDataList,
    TuiDropdown,
    TuiOption,
    TuiSelect,
    TuiTextfield
  ],
  templateUrl: './adjust-balance-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdjustBalanceModal {
  protected readonly context =
    inject<TuiDialogContext<AdjustBalanceFormValue | null, AdjustBalanceModalData>>(POLYMORPHEUS_CONTEXT);

  protected readonly leaveTypes = this.context.data.leaveTypes;
  protected readonly employeeName = this.context.data.employeeName;

  protected form = new FormGroup({
    leaveTypeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adjustmentDays: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      return;
    }

    const raw = this.form.getRawValue();
    this.context.completeWith({
      leaveTypeId: raw.leaveTypeId,
      adjustmentDays: raw.adjustmentDays!,
      reason: raw.reason,
    });
  }

  protected cancel(): void {
    this.context.completeWith(null);
  }
}