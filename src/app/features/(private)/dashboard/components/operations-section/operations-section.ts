import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLineChart, TuiAxes } from '@taiga-ui/addon-charts';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiButton, TuiPoint, TuiIcon } from '@taiga-ui/core';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';
import { AdjustmentActionCommand, AttendanceAdjustmentResponseDto } from '../../../attendance/model/attendance.model';
import { Employee } from '../../../employees/model/employee.model';
import { AttendanceService } from '../../../attendance/service/attendance.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import { ApproveRejectLeaveRequest, LeaveRequestResponse } from '../../../leave-management/model/leave-request.model';
import { DashboardService } from '../../service/dashboard.service';

@Component({
  selector: 'app-operations-section',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiAvatar, TuiCardLarge, MatIcon, TuiIcon],
  templateUrl: './operations-section.html',
})
export class OperationsSection implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly leaveService = inject(LeaveRequestsService);
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dashboardService = inject(DashboardService);
  protected readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  /** Cap how many show on each dashboard card */
  private readonly maxVisible = 4;

  /** Shared across both attendance & leave lookups — keyed by employeeId */
  protected employeeMap = signal<Record<string, Employee>>({});

  // ===================== ATTENDANCE =====================

  protected isLoading = signal(false);
  protected approvingId = signal<string | null>(null);

  protected pendingRequests = computed(() =>
    (this.attendanceService.allAdjustments() ?? [])
      .filter((r) => r.status === 'Pending')
      .sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc))
      .slice(0, this.maxVisible),
  );

  protected totalPending = computed(
    () => (this.attendanceService.allAdjustments() ?? []).filter((r) => r.status === 'Pending').length,
  );

  private loadRequests(): void {
    this.isLoading.set(true);
    this.attendanceService
      .getAdjustments({})
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.loadEmployeesForRecords(this.pendingRequests());
          }
        },
      });
  }

  protected quickApprove(record: AttendanceAdjustmentResponseDto): void {
    this.approvingId.set(record.id);

    const command: AdjustmentActionCommand = {
      actionByUserId: this.currentUser()?.employeeInfo.id ?? '',
      remarks: null,
    };

    const employeeName = this.employeeMap()[record.employeeId]?.fullName ?? record.employeeId;

    this.attendanceService
      .approveAdjustment(record.id, command)
      .pipe(finalize(() => this.approvingId.set(null)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadRequests();
            this.toast.success(`Approved adjustment for ${employeeName}`, 'Attendance Updated');
          }
        },
        error: () => this.toast.error('Unable to approve this request', 'Attendance Updated'),
      });
  }

  protected viewAll(): void {
    this.router.navigate(['/attendance/adjustments-approval/all']); // adjust to your real route
  }

  // ===================== LEAVE =====================

  protected leaveIsLoading = signal(false);
  protected allLeaveRequests = signal<LeaveRequestResponse[]>([]);
  protected leaveApprovingId = signal<string | null>(null);

  protected pendingLeaveRequests = computed(() =>
    this.allLeaveRequests()
      .filter((r) => r.status === 'Pending')
      .sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc))
      .slice(0, this.maxVisible),
  );

  protected totalLeavePending = computed(
    () => this.allLeaveRequests().filter((r) => r.status === 'Pending').length,
  );

  private loadLeaveRequests(): void {
    this.leaveIsLoading.set(true);
    this.leaveService
      .getAllLeaves()
      .pipe(finalize(() => this.leaveIsLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.allLeaveRequests.set(response.data);
            this.loadEmployeesForRecords(this.pendingLeaveRequests());
          }
        },
      });
  }

  protected daysLabel(totalDays: number): string {
    return totalDays === 1 ? '1 Day' : `${totalDays} Days`;
  }

  protected quickApproveLeave(record: LeaveRequestResponse): void {
    this.leaveApprovingId.set(record.id);

    const payload: ApproveRejectLeaveRequest = {
      approvedByEmployeeId: this.currentUser()?.employeeInfo.id ?? '',
      remarks: null,
    };

    const employeeName = this.employeeMap()[record.employeeId]?.fullName ?? record.employeeId;

    this.leaveService
      .approveLeave(record.id, payload)
      .pipe(finalize(() => this.leaveApprovingId.set(null)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.loadLeaveRequests();
            this.toast.success(`Approved leave for ${employeeName}`, 'Leave Updated');
          }
        },
        error: () => this.toast.error('Unable to approve this leave request', 'Leave Updated'),
      });
  }

  protected viewAllLeaves(): void {
    this.router.navigate(['/leave-requests/all']); // adjust to your real route
  }

  // ===================== SHARED =====================

  protected employeeInitials(employee: Employee): string {
    return `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase();
  }

  /** Fetches each unique employeeId referenced by a set of records (attendance or leave), in parallel. */
  private loadEmployeesForRecords(records: Array<{ employeeId: string }>): void {
    const uniqueIds = Array.from(new Set(records.map((r) => r.employeeId))).filter(
      (id) => !this.employeeMap()[id],
    );
    if (uniqueIds.length === 0) return;

    const lookups = uniqueIds.reduce<Record<string, ReturnType<typeof this.employeeService.getEmployeeById>>>(
      (acc, id) => {
        acc[id] = this.employeeService.getEmployeeById(id).pipe(
          map((res) => (res.isSuccess && res.data ? res.data : null)),
          catchError(() => of(null)),
        ) as any;
        return acc;
      },
      {},
    );

    forkJoin(lookups).subscribe((results) => {
      const map: Record<string, Employee> = { ...this.employeeMap() };
      for (const [id, employee] of Object.entries(results)) {
        if (employee) map[id] = employee as unknown as Employee;
      }
      this.employeeMap.set(map);
    });
  }

  ngOnInit(): void {
    this.loadRequests();
    this.loadLeaveRequests();
  }

  protected readonly teamMembers = computed(() => this.dashboardService.data()?.teamMembers ?? []);
}

