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
import { DashboardService } from '../../../dashboard/service/dashboard.service';

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
    TuiTitle, TuiIcon,TuiInput, TuiCheckbox, MainHeading, DatePipe
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
  private readonly dashboardService = inject(DashboardService);

  /** Actual clock in/out + break times for each regularization date, keyed by yyyy-MM-dd. */
  protected actualAttendanceByDate = signal<Map<string, ActualDayAttendance>>(new Map());

  /** Tracks the leave-type control's raw value reactively, since form controls aren't signals. */
  protected selectedLeaveTypeName = signal<string>('');

  /** Remaining balance for whichever leave type is currently selected, shown as a hint under the field. */
  protected selectedLeaveBalance = computed(() => {
    const name = this.selectedLeaveTypeName();
    if (!name) return null;
    return this.dashboardService.data()?.leaveBalances.find((b) => b.leaveTypeName === name) ?? null;
  });

  currentUser = this.authService.currentUser;
  isSubmitting = signal(false);

protected leaveTypesOptions = computed(() =>
    this.leaveService.leaveTypes()?.map((t) => t.name) ?? []
  );

  /** Academic staff can't apply for leave (enforced server-side too), so that request type isn't offered to them. */
  protected isAcademic = computed(() => this.currentUser()?.employeeInfo?.category === 'Academic');

  protected selectedType = signal<RequestType>('leave');
  protected manualBreakdown = signal(false);
  protected form!: FormGroup;

  ngOnInit(): void {
    this.leaveService.getAllLeaveTypes().subscribe();
    this.dashboardService.load().subscribe();
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

      if (normalized && !(normalized === 'leave' && this.isAcademic())) {
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
    const defaultType: RequestType = this.isAcademic() ? 'wfh' : 'leave';
    this.selectedType.set(defaultType);

    this.form = this.fb.group(
      {
        requestType: this.fb.control<RequestType>(defaultType, Validators.required),
        leaveType: this.fb.control(''),
        startDate: this.fb.control('', Validators.required),
        endDate: this.fb.control('', Validators.required),
        manualBreakdown: this.fb.control(false),
        reason: this.fb.control(''),
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

    this.form.get('leaveType')!.valueChanges.subscribe((val: string) => this.selectedLeaveTypeName.set(val ?? ''));
  }

  /**
   * Native `type="reset"` only resets the underlying DOM form controls - the Taiga UI inputs
   * are ControlValueAccessors bound to a reactive FormGroup, so a native reset never goes
   * through Angular's form APIs and leaves selectedType/manualBreakdown/lineItems (and their
   * signals) exactly as they were. Reset the FormGroup itself instead.
   */
  protected onReset(): void {
    const defaultType: RequestType = this.isAcademic() ? 'wfh' : 'leave';
    this.lineItems.clear();
    this.actualAttendanceByDate.set(new Map());
    this.form.reset({
      requestType: defaultType,
      leaveType: '',
      startDate: '',
      endDate: '',
      manualBreakdown: false,
      reason: '',
      lineItems: [],
    });
    this.selectedType.set(defaultType);
    this.manualBreakdown.set(false);
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

        // The row's clock-out-before-clock-in validator falls back to this actual clock-in when
        // requestedClockIn is blank - re-run it now that the actual has arrived (async, after
        // the row was already built), otherwise form.invalid would stay stale until some field
        // on the row is touched.
        const row = this.lineItems.controls.find((r) => this.toDateStr(r.get('date')?.value) === dateStr);
        row?.updateValueAndValidity();
      },
    });
  }

  /** Actual attendance for a line item's date, for the read-only reference display. */
  protected actualFor(date: TuiDay): ActualDayAttendance | null {
    return this.actualAttendanceByDate().get(this.toDateStr(date)) ?? null;
  }

  /**
   * Formats an actual punch instant in UK time for the "Actual (at time of request)" reference -
   * requestedClockIn/Out are plain hours:minutes with no timezone of their own, and the backend
   * interprets them as UK wall-clock time (the same convention shifts use, since this project is
   * built for a UK-based operation - the "+5" a viewer sees elsewhere is just their own browser's
   * local timezone, not a stored-value issue). Using the browser's own locale here instead could
   * show a different clock than the one the requester's typed correction gets interpreted against.
   */
  protected formatActualUk(iso: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '—';
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('day')}/${get('month')}/${get('year')}, ${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
  }

  /**
   * True when Clock Out's time-of-day is at or before Clock In's and "Next day" isn't checked -
   * that combination can only mean the shift actually ran past midnight and the checkbox was
   * simply forgotten, so the requester is warned/blocked here rather than unknowingly submitting
   * a regularization that (without the flag) would compute negative worked hours. When the row
   * leaves Clock In blank (only adjusting Clock Out), the actual punch's clock-in time is used
   * as the effective reference instead, since that's what the approval will fall back to.
   */
  protected clockOutBeforeClockIn(row: AbstractControl): boolean {
    const outVal = row.get('requestedClockOut')?.value;
    const nextDay = row.get('clockOutNextDay')?.value;
    if (!outVal || nextDay) return false;

    const inVal = row.get('requestedClockIn')?.value;
    let inHours: number, inMinutes: number;
    if (inVal) {
      inHours = inVal.hours;
      inMinutes = inVal.minutes;
    } else {
      const actual = this.actualFor(row.get('date')?.value);
      if (!actual?.clockIn) return false;
      const ukTime = this.toUkHm(actual.clockIn);
      if (!ukTime) return false;
      inHours = ukTime.hours;
      inMinutes = ukTime.minutes;
    }

    const inMinutesTotal = inHours * 60 + inMinutes;
    const outMinutesTotal = outVal.hours * 60 + outVal.minutes;
    return outMinutesTotal <= inMinutesTotal;
  }

  private clockOutRowValidator = (row: AbstractControl): ValidationErrors | null => {
    return this.clockOutBeforeClockIn(row) ? { clockOutBeforeClockIn: true } : null;
  };

  /**
   * Mirrors the backend rule: a regularization row doesn't need every field filled in - only
   * one of Clock In / Clock Out / Break In / Break Out needs to be provided (e.g. just fixing a
   * forgotten Clock Out while leaving the real Clock In punch untouched).
   */
  private atLeastOnePunchValidator = (row: AbstractControl): ValidationErrors | null => {
    const hasAny =
      !!row.get('requestedClockIn')?.value ||
      !!row.get('requestedClockOut')?.value ||
      !!row.get('requestedBreakIn')?.value ||
      !!row.get('requestedBreakOut')?.value;
    return hasAny ? null : { noPunchProvided: true };
  };

  protected noPunchProvided(row: AbstractControl): boolean {
    return row.hasError('noPunchProvided');
  }

  // Shifts/punches are read in UK time (see performance-section.ts's toHm()), not the browser's
  // local timezone, so the actual-clock-in fallback above must be read the same way.
  private toUkHm(iso: string): { hours: number; minutes: number } | null {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hours = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const minutes = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return { hours, minutes };
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
    return this.fb.group(
      {
        date: [date],
        requestedClockIn: [''],
        requestedClockOut: [''],
        // Clock-in is always on this row's date, but for an overnight shift the clock-out can be
        // on the next calendar day - capped at +1 day (a checkbox, not a free date picker) so a
        // regularization can never silently drift the record onto some distant future date.
        clockOutNextDay: [false],
        requestedBreakIn: [''],
        requestedBreakOut: [''],
        remarks: [''],
      },
      { validators: [this.atLeastOnePunchValidator, this.clockOutRowValidator] },
    );
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
  if (this.selectedType() === 'regularization') {
    const hasEmptyRow = this.lineItems.controls.some((row) => this.noPunchProvided(row));
    if (hasEmptyRow) {
      this.toast.error(
        'Provide at least one of Clock In, Clock Out, Break In or Break Out for each date.',
        'Missing Timings',
      );
      return;
    }

    const hasBadClockOut = this.lineItems.controls.some((row) => this.clockOutBeforeClockIn(row));
    if (hasBadClockOut) {
      this.toast.error(
        'Clock Out is before Clock In on one or more dates. Check "Next day" if the shift ran past midnight.',
        'Invalid Timings',
      );
      return;
    }
  }

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.toast.error('Please fill all required fields correctly.', 'Incomplete Request');
    return;
  }

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
          // requestedBreakIn/Out come from the same tuiInputTime widget (a TuiTime object once
          // touched), not a plain string - sending it unformatted fails backend JSON binding
          // (the DTO field is a plain string).
          requestedBreakIn: item.requestedBreakIn ? this.formatTime(item.requestedBreakIn) : null,
          requestedBreakOut: item.requestedBreakOut ? this.formatTime(item.requestedBreakOut) : null,
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
          this.router.navigate(['/requests/my']);
        } else {
          // The backend can report a business-rule failure (e.g. an overlapping leave) with a
          // 200 OK and isSuccess:false rather than an HTTP error - without this branch that
          // message never reached the user at all.
          this.toast.error(response.message || 'Request creation failed. Please try again.', 'Creation Unsuccessful!');
        }
      },
      error: (error) => {
        const msg = error.error?.message || 'Request creation failed. Please try again.';
        this.toast.error(msg, 'Creation Unsuccessful!');
      },
    });
}
}