import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, catchError, finalize, forkJoin, map, of } from 'rxjs';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiError, TuiIcon, TuiLabel, TuiTextfield, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiBadge, TuiTextarea } from '@taiga-ui/kit';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../../(public)/auth/services/auth.service';

import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ToastService } from '../../../../../core/services/toast.service';
import { AttendanceService } from '../../service/attendance.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { AttendanceAdjustment, punchTypeToLabel } from '../attendance-adjustment/attendance-adjustment';
import { Employee } from '../../../employees/model/employee.model';
import { AdjustmentActionCommand, AttendanceAdjustmentResponseDto } from '../../model/attendance.model';

type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Rejected';
type ActionType = 'approve' | 'reject';

@Component({
  selector: 'app-attendance-adjustment-approvals',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiCardLarge,
    TuiBadge,
    TuiButton,
    TuiError,
    TuiIcon,
    TuiLabel,
    TuiTextarea,
    TuiTextfield,
    TuiTitle,
    MatIcon,
    DatePipe,
    MainHeading,
  ],
  templateUrl: './attendance-adjustment-approvals.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceAdjustmentApprovals implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly attendanceService = inject(AttendanceService);
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  currentUser = this.authService.currentUser;
  protected readonly punchTypeToLabel = punchTypeToLabel;

  protected readonly requests = computed(() => this.attendanceService.allAdjustments() ?? []);

  protected isLoading = signal(false);
  protected loadError = signal<string | null>(null);
  protected statusFilter = signal<StatusFilter>('Pending');

  protected employeeMap = signal<Record<string, Employee>>({});
  protected isLoadingEmployees = signal(false);

  protected actioningId = signal<string | null>(null);
  protected actionType = signal<ActionType | null>(null);
  protected isSubmittingAction = signal(false);

  protected actionForm: FormGroup = this.fb.group({
    remarks: [''],
  });

  protected stats = computed(() => {
    const all = this.requests();
    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'Pending').length,
      approved: all.filter((r) => r.status === 'Approved').length,
      rejected: all.filter((r) => r.status === 'Rejected').length,
    };
  });

  protected filteredRequests = computed(() => {
    const filter = this.statusFilter();
    const sorted = [...this.requests()].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc));
    return filter === 'all' ? sorted : sorted.filter((r) => r.status === filter);
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  // 2. Fetch requests and trigger employee detail load on success
  private loadRequests(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.attendanceService
      .getAdjustments({}) // Pass empty params object to fix the parameter requirement
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            // Service updates its signal internally during tap()
            // Now load employee information for the retrieved adjustments
            this.loadEmployeesForRequests(this.requests());
          } else {
            this.loadError.set('Unable to load adjustment requests.');
          }
        },
        error: () => this.loadError.set('Unable to load adjustment requests.'),
      });
  }

  /** Fetches each unique employeeId referenced by the adjustment requests, in parallel. */
  private loadEmployeesForRequests(records: AttendanceAdjustmentResponseDto[]): void {
    const uniqueIds = Array.from(new Set(records.map((r) => r.employeeId)));
    if (uniqueIds.length === 0) return;

    this.isLoadingEmployees.set(true);

    const lookups = uniqueIds.reduce<Record<string, Observable<Employee | null>>>((acc, id) => {
      acc[id] = this.employeeService.getEmployeeById(id).pipe(
        map((res) => (res.isSuccess && res.data ? res.data : null)),
        catchError(() => of(null)),
      );
      return acc;
    }, {});

    forkJoin(lookups)
      .pipe(finalize(() => this.isLoadingEmployees.set(false)))
      .subscribe((results) => {
        const map: Record<string, Employee> = { ...this.employeeMap() };
        for (const [id, employee] of Object.entries(results)) {
          if (employee) map[id] = employee;
        }
        this.employeeMap.set(map);
      });
  }

  protected employeeInitials(employee: Employee): string {
    return `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase();
  }

  protected setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  protected statusAppearance(status: string): string {
    switch (status) {
      case 'Approved':
        return 'positive';
      case 'Rejected':
        return 'negative';
      default:
        return 'warning';
    }
  }

  protected isActioning(record: AttendanceAdjustmentResponseDto): boolean {
    return this.actioningId() === record.id;
  }

  /** Disable a card's trigger buttons while a different card has an action open. */
  protected isBlockedByOtherAction(record: AttendanceAdjustmentResponseDto): boolean {
    const activeId = this.actioningId();
    return activeId !== null && activeId !== record.id;
  }

  protected startAction(record: AttendanceAdjustmentResponseDto, type: ActionType): void {
    this.actioningId.set(record.id);
    this.actionType.set(type);
    this.actionForm.reset({ remarks: '' });

    const remarksControl = this.actionForm.get('remarks');
    if (type === 'reject') {
      remarksControl?.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      remarksControl?.clearValidators();
    }
    remarksControl?.updateValueAndValidity();
  }

  protected cancelAction(): void {
    if (this.isSubmittingAction()) return;
    this.actioningId.set(null);
    this.actionType.set(null);
  }

  protected confirmAction(record: AttendanceAdjustmentResponseDto): void {
    const type = this.actionType();
    if (!type) return;

    this.actionForm.markAllAsTouched();
    if (this.actionForm.invalid) return;

    const command: AdjustmentActionCommand = {
      actionByUserId: this.currentUser()?.employeeInfo.employeeId ?? '',
      remarks: this.actionForm.get('remarks')?.value || null,
    };

    const request$ =
      type === 'approve'
        ? this.attendanceService.approveAdjustment(record.id, command)
        : this.attendanceService.rejectAdjustment(record.id, command);

    const employeeName = this.employeeMap()[record.employeeId]?.fullName ?? record.employeeId;
    const actionLabel = type === 'approve' ? 'approved' : 'rejected';

    this.isSubmittingAction.set(true);
    request$.pipe(finalize(() => this.isSubmittingAction.set(false))).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          // Re-fetch adjustments from the service to refresh service signal state
          this.loadRequests();
          this.actioningId.set(null);
          this.actionType.set(null);
          this.toast.success(`Successfully ${actionLabel} adjustment for ${employeeName}`, 'Attendance Updated');
        }
      },
      error: () => {
        this.toast.error('Unable to process this adjustment request', 'Attendance Updated');
      },
    });
  }
}