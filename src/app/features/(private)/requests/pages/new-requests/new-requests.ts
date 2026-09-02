import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import {
  TuiButton, TuiCalendar, TuiError, TuiGroup, TuiLabel, TuiRadio,
  TuiTextfield, TuiTitle, TuiIcon,
  TuiCheckbox,
} from '@taiga-ui/core';
import {
  TuiBlock, TuiChevron, TuiDataListWrapper, TuiInputDate, TuiInputTime,
  TuiSelect, TuiTextarea, 
} from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiDay } from '@taiga-ui/cdk';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import { HalfDayType, NewRequestPayload, RequestType } from '../../model/request.model';

@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [
    ReactiveFormsModule, TuiCardLarge, TuiBlock, TuiButton, TuiCalendar,
    TuiChevron, TuiDataListWrapper, TuiError, TuiGroup, TuiInputDate,
    TuiInputTime, TuiLabel, TuiRadio, TuiSelect, TuiTextarea, TuiTextfield,
    TuiTitle, TuiIcon, TuiCheckbox, MainHeading,
  ],
  templateUrl: './new-requests.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewRequest implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leaveService = inject(LeaveRequestsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly minDate = TuiDay.currentLocal();
  protected get minEndDate(): TuiDay {
    const start = this.form.get('startDate')?.value;
    return start instanceof TuiDay ? start : this.minDate;
  }

  currentUser = this.authService.currentUser;
  isSubmitting = signal(false);

  protected leaveTypesOptions = this.leaveService?.leaveTypes;

  // Mirrors form controls as signals so the template can @switch/@if on them
  protected selectedType = signal<RequestType>('leave');
  protected manualBreakdown = signal(false);

  protected form!: FormGroup;

  ngOnInit(): void {
    this.leaveService.getAllLeaveTypes().subscribe();
    this.buildForm();
  }

  protected get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  private buildForm(): void {
    this.form = this.fb.group(
      {
        requestType: this.fb.control<RequestType>('leave', Validators.required),
        leaveType: this.fb.control(''),
        startDate: this.fb.control('', Validators.required),
        endDate: this.fb.control('', Validators.required),
        manualBreakdown: this.fb.control(false),
        reason: this.fb.control('', [Validators.required, Validators.minLength(10)]),
        lineItems: this.fb.array([]),
      },
      { validators: this.dateRangeValidator },
    );

    this.form.get('requestType')!.valueChanges.subscribe((type: RequestType) => {
      this.selectedType.set(type);
      const leaveType = this.form.get('leaveType');
      if (type === 'leave') {
        leaveType?.setValidators(Validators.required);
      } else {
        leaveType?.clearValidators();
        leaveType?.setValue('', { emitEvent: false });
      }
      leaveType?.updateValueAndValidity({ emitEvent: false });
      this.regenerateLineItems();
    });

    this.form.get('manualBreakdown')!.valueChanges.subscribe((val: boolean) => {
      this.manualBreakdown.set(val);
      this.regenerateLineItems();
    });

    this.form.get('startDate')!.valueChanges.subscribe(() => this.regenerateLineItems());
    this.form.get('endDate')!.valueChanges.subscribe(() => this.regenerateLineItems());
  }

  /** Rebuilds the per-date line items whenever type / range / toggle changes */
  private regenerateLineItems(): void {
    const type = this.selectedType();
    const start = this.form.get('startDate')?.value;
    const end = this.form.get('endDate')?.value;
    this.lineItems.clear();

    if (!(start instanceof TuiDay) || !(end instanceof TuiDay)) return;

    const showBreakdown = type === 'regularization' || this.manualBreakdown();
    if (!showBreakdown) return;

    const dates = this.getDateRange(start, end);
    dates.forEach((date) => {
      this.lineItems.push(
        type === 'regularization' ? this.buildRegularizationRow(date) : this.buildHalfDayRow(date),
      );
    });
  }

  private buildHalfDayRow(date: TuiDay): FormGroup {
    const row = this.fb.group({
      date: [date],
      isHalfDay: [false],
      halfDayType: this.fb.control<HalfDayType | null>(null),
    });
    row.get('isHalfDay')!.valueChanges.subscribe((checked: boolean | null) => {
      const halfDayType = row.get('halfDayType');
      if (checked) {
        halfDayType?.setValidators(Validators.required);
      } else {
        halfDayType?.clearValidators();
        halfDayType?.setValue(null, { emitEvent: false });
      }
      halfDayType?.updateValueAndValidity({ emitEvent: false });
    });
    return row;
  }

  private buildRegularizationRow(date: TuiDay): FormGroup {
    return this.fb.group({
      date: [date],
      clockIn: ['', Validators.required],
      clockOut: ['', Validators.required],
      breakIn: [''],
      breakOut: [''],
      remarks: [''],
    });
  }

  private getDateRange(start: TuiDay, end: TuiDay): TuiDay[] {
    const dates: TuiDay[] = [];
    const cursor = start.toLocalNativeDate();
    const last = end.toLocalNativeDate();
    while (cursor <= last) {
      dates.push(TuiDay.fromLocalNativeDate(new Date(cursor)));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  private dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (!start || !end) return null;
    return new Date(end) < new Date(start) ? { dateRange: true } : null;
  };

  protected isRequired(control: AbstractControl | null): boolean {
    return control?.hasValidator(Validators.required) ?? false;
  }

  protected formatDate(date: TuiDay): string {
    return `${String(date.day).padStart(2, '0')}.${String(date.month + 1).padStart(2, '0')}.${date.year}`;
  }

  protected onSubmit(): void {
  

    const raw = this.form.getRawValue();
    const type: RequestType = raw.requestType;
    const selectedLeaveType = this.leaveService.leaveTypes().find((t) => t.name === raw.leaveType);

    const payload: NewRequestPayload = {
      requestType: type,
      employeeId: this.currentUser()?.employeeInfo.id ?? '',
      reason: raw.reason,
      startDate: raw.startDate,
      endDate: raw.endDate,
      ...(type === 'leave' ? { leaveTypeId: selectedLeaveType?.id ?? '' } : {}),
      ...(raw.lineItems?.length ? { lineItems: raw.lineItems } : {}),
    };

    console.log("Payload to submit:", payload);

    // this.leaveService
    //   .createRequest(payload) // wire to the right endpoint per requestType server-side, or branch here
    //   .pipe(finalize(() => this.isSubmitting.set(false)))
    //   .subscribe({
    //     next: (response) => {
    //       if (response.isSuccess) {
    //         this.toast.success('Request sent for approval.', 'Created Successfully!');
    //         this.router.navigate(['/leave-requests/my']);
    //       }
    //     },
    //     error: (error) => {
    //       const msg = error.error?.message || 'Request creation failed. Please try again.';
    //       this.toast.error(msg, 'Creation Unsuccessful!');
    //     },
    //   });
  }
}