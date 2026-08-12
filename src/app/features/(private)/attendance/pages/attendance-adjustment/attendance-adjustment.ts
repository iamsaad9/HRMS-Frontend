import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { TuiButton, TuiError, TuiLabel, TuiTextfield, TuiTitle, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiBadge, TuiChevron, TuiDataListWrapper, TuiInputTime, TuiSelect, TuiTextarea } from '@taiga-ui/kit';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { AttendanceService } from '../../service/attendanceService';
import {
  DailyAttendance,
  AttendanceAdjustmentForm,
  PUNCH_TYPE_LABELS,
  PunchType,
  punchTypeToLabel,
  labelToPunchType,
} from '../../model/attendance-model';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { TuiTime } from '@taiga-ui/cdk';



@Component({
  selector: 'app-attendance-adjustment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiCardLarge,
    TuiBadge,
    TuiButton,
    TuiChevron,
    TuiDataListWrapper,
    TuiError,
    TuiInputTime,
    TuiLabel,
    TuiSelect,
    TuiTextarea,
    TuiTextfield,
    TuiTitle,
    MatIcon,
    DatePipe,
    MainHeading,
    TuiIcon,
  ],
  templateUrl: './attendance-adjustment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})


export class AttendanceAdjustment implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  protected readonly punchTypeOptions = PUNCH_TYPE_LABELS;
  protected readonly punchTypeToLabel = punchTypeToLabel;

  protected record = signal<DailyAttendance | null>(null);
  protected isLoading = signal(false);
  protected isSaving = signal(false);
  protected loadError = signal<string | null>(null);

  /** Whether the card is currently showing the edit form. Starts in view mode. */
  protected isEditing = signal(false);

  protected form!: FormGroup;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError.set('Missing attendance record id.');
      return;
    }
    this.loadRecord(id);
  }

  private loadRecord(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.attendanceService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.record.set(response.data);
          } else {
            this.loadError.set('Unable to load this attendance record.');
          }
        },
        error: () => this.loadError.set('Unable to load this attendance record.'),
      });
  }

  protected statusAppearance(status?: string): string {
    switch (status) {
      case 'Present':
        return 'positive';
      case 'Absent':
        return 'negative';
      case 'Late':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  protected isRequired(control: AbstractControl | null): boolean {
    if (!control?.validator) return false;
    const validator = control.validator({} as AbstractControl);
    return !!validator?.['required'];
  }

  protected get punches(): FormArray {
    return this.form?.get('punches') as FormArray;
  }

  /** Enter edit mode and build the form seeded from the current record. */
  protected startEdit(record: DailyAttendance): void {
    this.form = this.fb.group({
      reason: this.fb.control('', [Validators.required, Validators.minLength(10)]),
      punches: this.fb.array([
        this.buildPunchGroup(PunchType.ClockIn, record.firstIn),
        this.buildPunchGroup(PunchType.ClockOut, record.lastOut),
      ]),
    });
    this.isEditing.set(true);
  }

  private buildPunchGroup(type: PunchType | null, time: string | null): FormGroup {
  let requestedPunchTime: TuiTime | null = null;

  if (time) {
    const date = new Date(time);

    requestedPunchTime = new TuiTime(
      date.getHours(),      // or getUTCHours()
      date.getMinutes(),    // or getUTCMinutes()
      date.getSeconds(),    // or getUTCSeconds()
    );
  }

  return this.fb.group({
    requestedPunchType: this.fb.control(
      type ? punchTypeToLabel(type) : '',
      Validators.required,
    ),
    requestedPunchTime: this.fb.control<TuiTime | null>(
      requestedPunchTime,
      Validators.required,
    ),
  });
}

  protected cancelEdit(): void {
    this.isEditing.set(false);
    this.form = null as unknown as FormGroup;
  }

  protected addPunch(): void {
    this.punches.push(this.buildPunchGroup(null, null));
  }

  protected removePunch(index: number): void {
    if (this.punches.length <= 1) return;
    this.punches.removeAt(index);
  }

  private toIsoDateTime(date: string, time: TuiTime): string {
  const dateTime = new Date(date);

  dateTime.setHours(
    time.hours,
    time.minutes,
    time.seconds,
    time.ms
  );

  return dateTime.toISOString();
}
  
  protected saveEdit(record: DailyAttendance): void {
    const raw = this.form.getRawValue();
   const payload: AttendanceAdjustmentForm = {
  employeeId: record.employeeId,
  attendanceDate: record.date,
  reason: raw.reason,
  punches: raw.punches.map(
    (punch: {
      requestedPunchType: string;
      requestedPunchTime: TuiTime | null;
    }) => ({
      requestedPunchType: labelToPunchType(punch.requestedPunchType),
      requestedPunchTime: this.toIsoDateTime(
        record.date,
        punch.requestedPunchTime!,
      ),
    }),
  ),
};
    console.log("Submitting...",payload)

    this.isSaving.set(true);
    this.attendanceService
      .createAdjustment(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.cancelEdit();
            // Optionally re-fetch or navigate away once adjustment is submitted:
            // this.router.navigate(['/attendance']);
          }
        },
      });
  }
}