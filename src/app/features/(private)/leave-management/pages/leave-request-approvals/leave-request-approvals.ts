import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiError, TuiIcon, TuiLabel, TuiTextfield, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiBadge, TuiTextarea } from '@taiga-ui/kit';
import { MatIcon } from '@angular/material/icon';
import { LeaveRequestsService } from '../../service/leave-requests.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ApproveRejectLeaveRequest, LeaveRequestResponse } from '../../model/leave-request.model';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ToastService } from '../../../../../core/services/toast.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Employee } from '../../../employees/model/employee.model';

type StatusFilter = 'all' | 'Pending' | 'Approved' | 'Rejected';
type ActionType = 'approve' | 'reject';

@Component({
  selector: 'app-requests-approvals',
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
  templateUrl: './leave-request-approvals.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveRequestApprovals implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leaveService = inject(LeaveRequestsService);
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  currentUser = this.authService.currentUser;

  protected requests = signal<LeaveRequestResponse[]>([]);
  protected isLoading = signal(false);
  protected loadError = signal<string | null>(null);
  protected statusFilter = signal<StatusFilter>('Pending');

  /** employeeId -> Employee, populated after leave requests load. */
  protected employeeMap = signal<Record<string, Employee>>({});
  protected isLoadingEmployees = signal(false);

  /** Id of the card currently showing the approve/reject remarks form. Only one at a time. */
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

  private loadRequests(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.leaveService
      .getAllLeaves()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.requests.set(response.data);
            this.loadEmployeesForRequests(response.data);
          } else {
            this.loadError.set('Unable to load leave requests.');
          }
        },
        error: () => this.loadError.set('Unable to load leave requests.'),
      });
  }

  /** Fetches each unique employeeId referenced by the leave requests, in parallel. */
private loadEmployeesForRequests(records: LeaveRequestResponse[]): void {
  const uniqueIds = Array.from(new Set(records.map((r) => r.employeeId)));
  if (uniqueIds.length === 0) return;

  this.isLoadingEmployees.set(true);

  const lookups = uniqueIds.reduce<Record<string, import('rxjs').Observable<Employee | null>>>(
    (acc, id) => {
      acc[id] = this.employeeService.getEmployeeById(id).pipe(
        map((res) => (res.isSuccess && res.data ? res.data : null)),
        catchError(() => of(null)),
      );
      return acc;
    },
    {},
  );

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

  // Type helper only — not called directly, keeps the forkJoin dictionary typed cleanly.
  private buildEmployeeLookup() {
    return this.employeeService.getEmployeeById('').pipe(map((res) => res.data ?? null));
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

  protected daysLabel(totalDays: number): string {
    return totalDays === 1 ? '1 Day' : `${totalDays} Days`;
  }

  protected isActioning(record: LeaveRequestResponse): boolean {
    return this.actioningId() === record.id;
  }

  /** Disable a card's trigger buttons while a different card has an action open. */
  protected isBlockedByOtherAction(record: LeaveRequestResponse): boolean {
    const activeId = this.actioningId();
    return activeId !== null && activeId !== record.id;
  }

  protected startAction(record: LeaveRequestResponse, type: ActionType): void {
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

  protected confirmAction(record: LeaveRequestResponse): void {
    const type = this.actionType();
    if (!type) return;

    this.actionForm.markAllAsTouched();
    if (this.actionForm.invalid) return;

    const payload: ApproveRejectLeaveRequest = {
      approvedByEmployeeId: this.currentUser()?.employeeInfo.employeeId ?? '', // ASSUMPTION: confirm this field name
      remarks: this.actionForm.get('remarks')?.value || null,
    };

    const request$ =
      type === 'approve'
        ? this.leaveService.approveLeave(record.id, payload)
        : this.leaveService.rejectLeave(record.id, payload);

    const employeeName = this.employeeMap()[record.employeeId]?.fullName ?? record.employeeId;
    const actionLabel = type === 'approve' ? 'approved' : 'rejected';

    this.isSubmittingAction.set(true);
    request$.pipe(finalize(() => this.isSubmittingAction.set(false))).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const updated = response.data;
          this.requests.update((all) => all.map((r) => (r.id === record.id ? updated : r)));
          this.actioningId.set(null);
          this.actionType.set(null);
          this.toast.success(`Successfully ${actionLabel} leave for ${employeeName}`, 'Attendance Updated');
        }
      },
      error: () => {
        this.toast.error('Employee ID not found', 'Attendance Updated');
      },
    });
  }
}