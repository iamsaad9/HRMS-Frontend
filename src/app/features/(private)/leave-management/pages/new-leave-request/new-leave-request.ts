import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { TuiButton, TuiCalendar, TuiError, TuiGroup, TuiLabel, TuiRadio, TuiTextfield, TuiTitle, TuiIcon } from '@taiga-ui/core';
import {
  TuiBlock,
  TuiChevron,
  TuiDataListWrapper,
  TuiInputDate,
  TuiInputTime,
  TuiSelect,
  TuiTextarea,
} from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { DurationType, HalfDayPeriod, LeaveRequestPayload, LeaveTypeResponse } from '../../../leave-management/model/leave-request.model';
import { LeaveRequestsService } from '../../service/leave-requests.service';
import { TuiDay, TuiStringHandler } from '@taiga-ui/cdk';
import { ToastService } from '../../../../../core/services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiCardLarge,
    TuiBlock,
    TuiButton,
    TuiCalendar,
    TuiChevron,
    TuiDataListWrapper,
    TuiError,
    TuiGroup,
    TuiInputDate,
    TuiInputTime,
    TuiLabel,
    TuiRadio,
    TuiSelect,
    TuiTextarea,
    TuiTextfield,
    TuiTitle,
    MainHeading,
    TuiIcon,
  ],
  templateUrl: './new-leave-request.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveRequest implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leaveService = inject(LeaveRequestsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly minDate = TuiDay.currentLocal();
  protected get minEndDate(): TuiDay {
    const startDateValue = this.form.get('startDate')?.value;
    return startDateValue instanceof TuiDay ? startDateValue : this.minDate;
  }

  currentUser = this.authService.currentUser;
  isSubmitting = signal(false);
  isLoading = signal(false);

  // --- New: mode handling ---
  protected leaveId = signal<string | null>(null);
  protected isEditMode = computed(() => !!this.leaveId());
  protected pageTitle = computed(() => (this.isEditMode() ? 'Edit Leave Request' : 'New Leave Request'));
  protected pageDescription = computed(() =>
    this.isEditMode() ? 'Update the details of your leave request' : 'Submit a leave or WFH request for approval',
  );
  protected submitLabel = computed(() => (this.isEditMode() ? 'Update Leave Request' : 'Create Leave Request'));

  protected leaveTypesOptions = computed(() => this.leaveService.leaveTypes().map((item) => item.name));
  protected selectedDuration = signal<DurationType>('full_day');
  protected readonly stringify: TuiStringHandler<LeaveTypeResponse> = (item) => item.name;
  protected form!: FormGroup;

  ngOnInit(): void {
    this.buildForm();

    this.leaveService.getAllLeaveTypes().subscribe(() => {
      this.checkRouteMode();
    });
  }

  private checkRouteMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.leaveId.set(id);
      console.log("Id Present");
      this.loadLeaveRequest(id);
    }
  }

  private loadLeaveRequest(id: string): void {
    this.isLoading.set(true);
    this.leaveService
      .getLeaveById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.patchForm(response.data);
          }
        },
        error: (error) => {
          const msg = error.error?.message || 'Failed to load leave request.';
          this.toast.error(msg, 'Load Failed');
          this.router.navigate(['/leave-requests/all']);
        },
      });
  }

  private patchForm(data: any): void {
    const leaveType = this.leaveService.leaveTypes().find((t) => t.id === data.leaveTypeId);

    this.form.patchValue({
      leaveType: leaveType?.name ?? '',
      startDate: data.startDate ? TuiDay.fromLocalNativeDate(new Date(data.startDate)) : null,
      endDate: data.endDate ? TuiDay.fromLocalNativeDate(new Date(data.endDate)) : null,
      reason: data.reason ?? '',
    });
  }

  private buildForm(): void {
    this.form = this.fb.group(
      {
        leaveType: this.fb.control('', Validators.required),
        startDate: this.fb.control('', Validators.required),
        endDate: this.fb.control('', Validators.required),
        durationType: this.fb.control<DurationType>('full_day', Validators.required),
        halfDayPeriod: this.fb.control<HalfDayPeriod | null>(null),
        customHours: this.fb.group({
          startTime: this.fb.control(''),
          endTime: this.fb.control(''),
        }),
        reason: this.fb.control('', [Validators.required, Validators.minLength(10)]),
      },
      { validators: this.dateRangeValidator },
    );

    this.form.get('durationType')!.valueChanges.subscribe((duration: DurationType) => {
      this.selectedDuration.set(duration);
      this.updateConditionalValidators(duration);
    });

    this.form.get('startDate')!.valueChanges.subscribe((value: string) => {
      if (this.selectedDuration() !== 'full_day') {
        this.form.get('endDate')?.setValue(value, { emitEvent: false });
      }
    });
  }

  private updateConditionalValidators(duration: DurationType): void {
    const halfDayPeriod = this.form.get('halfDayPeriod');
    const startTime = this.form.get('customHours.startTime');
    const endTime = this.form.get('customHours.endTime');

    halfDayPeriod?.clearValidators();
    startTime?.clearValidators();
    endTime?.clearValidators();

    if (duration === 'half_day') {
      halfDayPeriod?.setValidators(Validators.required);
      this.syncEndDateToStart();
    } else if (duration === 'custom_hours') {
      startTime?.setValidators(Validators.required);
      endTime?.setValidators(Validators.required);
      this.syncEndDateToStart();
    } else {
      halfDayPeriod?.setValue(null, { emitEvent: false });
      this.form.get('customHours')?.reset({ startTime: '', endTime: '' }, { emitEvent: false });
    }

    halfDayPeriod?.updateValueAndValidity({ emitEvent: false });
    startTime?.updateValueAndValidity({ emitEvent: false });
    endTime?.updateValueAndValidity({ emitEvent: false });
  }

  private syncEndDateToStart(): void {
    const start = this.form.get('startDate')?.value;
    this.form.get('endDate')?.setValue(start, { emitEvent: false });
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

  protected onSubmit(): void {
    if (!this.form) return;
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    const selectedType = this.leaveService.leaveTypes().find((i) => i.name === raw.leaveType);

    const payload: LeaveRequestPayload = {
      employeeId: this.currentUser()?.employeeInfo.id ?? '',
      leaveTypeId: selectedType?.id ?? '',
      startDate: raw.startDate,
      endDate: raw.endDate,
      reason: raw.reason,
    };

    const request$ = this.isEditMode()
      ? this.leaveService.updateLeave(this.leaveId()!, payload)
      : this.leaveService.addLeave(payload);

    request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(
            this.isEditMode() ? 'Leave request updated.' : 'Leave request sent for approval.',
            this.isEditMode() ? 'Updated Successfully!' : 'Created Successfully!',
          );
          if (!this.isEditMode()) {
            this.form.reset({ durationType: 'full_day' });
            this.selectedDuration.set('full_day');
          }
          this.router.navigate(['/leave-requests/my']);
        }
      },
      error: (error) => {
        const msg = error.error?.message || (this.isEditMode() ? 'Leave update failed. Please try again.' : 'Leave Creation failed. Please try again.');
        this.toast.error(msg, this.isEditMode() ? 'Update Unsuccessful!' : 'Creation Unsuccessful!');
      },
    });
  }
}