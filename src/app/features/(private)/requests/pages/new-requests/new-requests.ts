import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  TuiInput,
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
import { ActivatedRoute, Router } from '@angular/router';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import { HalfDayType, NewRequestPayload, RequestType } from '../../model/request.model';
import { RequestsService } from '../../service/request.service';
import { AttendanceService } from '../../../attendance/service/attendance.service';

interface ActualDayAttendance {
  clockIn: string | null;
  clockOut: string | null;
  breakIn: string | null;
  breakOut: string | null;
}

@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [
    ReactiveFormsModule, TuiCardLarge, TuiBlock, TuiButton, TuiCalendar,
    TuiChevron, TuiDataListWrapper, TuiError, TuiGroup, TuiInputDate,
    TuiInputTime, TuiLabel, TuiRadio, TuiSelect, TuiTextarea, TuiTextfield,
    TuiTitle, TuiIcon,TuiInput, TuiCheckbox, MainHeading, DatePipe,
  ],
  templateUrl: './new-requests.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewRequest implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leaveService = inject(LeaveRequestsService);
  private readonly requestService = inject(RequestsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly attendanceService = inject(AttendanceService);

  /** Actual clock in/out + break times for each regularization date, keyed by yyyy-MM-dd. */
  protected actualAttendanceByDate = signal<Map<string, ActualDayAttendance>>(new Map());

  protected readonly minDate = TuiDay.currentLocal();
  protected get minEndDate(): TuiDay {
    const start = this.form.get('startDate')?.value;
    return start instanceof TuiDay ? start : this.minDate;
  }

  currentUser = this.authService.currentUser;
  isSubmitting = signal(false);

protected leaveTypesOptions = computed(() => 
    this.leaveService.leaveTypes()?.map((t) => t.name) ?? []
  );

  protected selectedType = signal<RequestType>('leave');
  protected manualBreakdown = signal(false);
  protected form!: FormGroup;

  ngOnInit(): void {
    this.leaveService.getAllLeaveTypes().subscribe();
    this.buildForm();
    this.applyQueryPreset();
  }

  /** Pre-fills the form when navigated here with `?type=&date=` (e.g. clicking a Shift History row). */
  private applyQueryPreset(): void {
    const params = this.route.snapshot.queryParamMap;
    const type = params.get('type');
    const date = params.get('date');

    if (type) {
      const normalized: RequestType | null =
        type === 'regularization' || type === 'AttendanceRegularization'
          ? 'regularization'
          : type === 'wfh' || type === 'WorkFromHome'
            ? 'wfh'
            : type === 'leave' || type === 'Leave'
              ? 'leave'
              : null;

      if (normalized) {
        this.form.get('requestType')?.setValue(normalized);
      }
    }

    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        const tuiDay = TuiDay.fromLocalNativeDate(parsed);
        this.form.get('startDate')?.setValue(tuiDay);
        this.form.get('endDate')?.setValue(tuiDay);
      }
    }
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

    if (type === 'regularization') {
      dates.forEach((date) => this.loadActualAttendance(date));
    }
  }

  private toDateStr(date: TuiDay): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.year}-${pad(date.month + 1)}-${pad(date.day)}`;
  }

  /** Fetches that day's real punches so the requester can see what actually happened before adjusting it. */
  private loadActualAttendance(date: TuiDay): void {
    const employeeId = this.currentUser()?.employeeInfo.id;
    const dateStr = this.toDateStr(date);
    if (!employeeId || this.actualAttendanceByDate().has(dateStr)) return;

    this.attendanceService.getDailyAttendance(employeeId, dateStr).subscribe({
      next: (response) => {
        if (!response.isSuccess || !response.data) return;
        const punches = response.data.punches ?? [];
        const findTime = (type: string) => punches.find((p) => p.punchType === type)?.punchTime ?? null;

        const actual: ActualDayAttendance = {
          clockIn: response.data.firstIn,
          clockOut: response.data.lastOut,
          breakIn: findTime('BreakStart'),
          breakOut: findTime('BreakEnd'),
        };
        this.actualAttendanceByDate.update((map) => new Map(map).set(dateStr, actual));
      },
    });
  }

  /** Actual attendance for a line item's date, for the read-only reference display. */
  protected actualFor(date: TuiDay): ActualDayAttendance | null {
    return this.actualAttendanceByDate().get(this.toDateStr(date)) ?? null;
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
      requestedClockIn: ['', Validators.required],
      requestedClockOut: ['', Validators.required],
      requestedBreakIn: [''],
      requestedBreakOut: [''],
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
    return `${String(date.day).padStart(2, '0')}/${String(date.month + 1).padStart(2, '0')}/${date.year}`;
  }

  private formatTime(value: { hours: number; minutes: number; seconds?: number } | null | undefined): string {
  if (!value) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(value.hours)}:${pad(value.minutes)}:${pad(value.seconds ?? 0)}`;
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
  ...(raw.lineItems?.length
    ? {
        lineItems: raw.lineItems.map((item: any) => ({
          ...item,
          requestedClockIn: this.formatTime(item.requestedClockIn),
          requestedClockOut: this.formatTime(item.requestedClockOut),
          halfDayType: item.halfDayType === 'First Half' ? 'first_half' : item.halfDayType === 'Second Half' ? 'second_half' : null,
        })),
      }
    : {}),
};
  console.log("Payload to submit:", payload);

  const request$ =
    type === 'leave'
      ? this.requestService.addLeave(payload)
      : type === 'wfh'
      ? this.requestService.addWorkFromHome(payload)
      : this.requestService.addAttendanceRegularization(payload);

  request$
    .pipe(finalize(() => this.isSubmitting.set(false)))
    .subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Request sent for approval.', 'Created Successfully!');
          this.router.navigate(['/leave-requests/my']);
        }
      },
      error: (error) => {
        const msg = error.error?.message || 'Request creation failed. Please try again.';
        this.toast.error(msg, 'Creation Unsuccessful!');
      },
    });
}
}