import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiDataListWrapper, TuiSelect, TuiChevron, TuiInputDate } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendance.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { DashboardService } from '../../../dashboard/service/dashboard.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Shift } from '../../model/attendance.model';
import { toIsoDate } from '../../../../../shared/utils/date-format.util';

@Component({
  selector: 'app-schedule-shift',
  standalone: true,
  imports: [
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiCardLarge,
    TuiTextfield,
    TuiSelect,
    TuiDataListWrapper,
    TuiChevron,
    TuiInputDate,
    MainHeading,
  ],
  templateUrl: './schedule-shifts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleShift implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);

  protected activeTabIndex = signal<number>(0);

  protected shifts = signal<Shift[]>([]);
  protected isLoadingShifts = signal(false);

  // Admin/HR can assign to any employee via the full directory (GET /api/Employees, gated by
  // the "users:read" permission neither Manager nor plain User roles have). A manager only ever
  // needs their own direct reports, which are already fetched - correctly scoped server-side -
  // for the dashboard's "Team Members" card, so reuse that instead of calling the Admin/HR-only
  // endpoint (which would 403 for them and leave this picker empty).
  protected isPrivileged = computed(() => this.authService.hasRole(['Admin', 'HR']));

  protected assignableEmployees = computed(() => {
    if (this.isPrivileged()) return this.employeeService.allEmployees() ?? [];
    return (this.dashboardService.data()?.teamMembers ?? []).map((m) => ({
      id: m.employeeId,
      fullName: m.fullName,
      staffNo: m.staffNo,
    }));
  });

  protected employeeOptions = computed(() =>
    this.assignableEmployees().map((emp) => ({
      id: emp.id,
      toString: () => `${emp.fullName} (${emp.staffNo})`,
    })),
  );

  protected shiftOptions = computed(() =>
    this.shifts().map((s) => ({
      id: s.id,
      toString: () => `${s.name} (${s.startTime} - ${s.endTime})`,
    })),
  );

  // Assign-shift form state
  protected selectedEmployeeOption = signal<{ id: string } | null>(null);
  protected selectedShiftOption = signal<{ id: string } | null>(null);
  protected effectiveFrom = signal<string>('');
  protected effectiveTo = signal<string>('');
  protected isAssigning = signal(false);

  ngOnInit(): void {
    this.loadShifts();
    if (this.isPrivileged()) {
      this.employeeService.getAllEmployees().subscribe();
    } else {
      this.dashboardService.load().subscribe();
    }
  }

  private loadShifts(): void {
    this.isLoadingShifts.set(true);
    this.attendanceService.getShifts().subscribe({
      next: (response) => {
        this.shifts.set(response.isSuccess && response.data ? response.data : []);
        this.isLoadingShifts.set(false);
      },
      error: () => this.isLoadingShifts.set(false),
    });
  }

  protected onEffectiveFromChange(value: string): void {
    this.effectiveFrom.set(toIsoDate(value));
  }

  protected onEffectiveToChange(value: string): void {
    this.effectiveTo.set(toIsoDate(value));
  }

  protected assignShift(): void {
    const employeeId = this.selectedEmployeeOption()?.id;
    const shiftId = this.selectedShiftOption()?.id;
    const effectiveFrom = this.effectiveFrom();

    if (!employeeId || !shiftId || !effectiveFrom) {
      this.toast.error('Select an employee, a shift, and an effective from date.', 'Missing Information');
      return;
    }

    this.isAssigning.set(true);
    this.attendanceService
      .assignShift({
        employeeId,
        shiftId,
        effectiveFrom,
        effectiveTo: this.effectiveTo() || null,
      })
      .subscribe({
        next: (response) => {
          this.isAssigning.set(false);
          if (response.isSuccess) {
            this.toast.success('Shift assigned successfully.', 'Saved');
            this.selectedEmployeeOption.set(null);
            this.selectedShiftOption.set(null);
            this.effectiveFrom.set('');
            this.effectiveTo.set('');
          } else {
            this.toast.error(response.message || 'Could not assign shift.', 'Save Failed');
          }
        },
        error: (err) => {
          this.isAssigning.set(false);
          this.toast.error(err?.error?.message || 'Could not assign shift.', 'Save Failed');
        },
      });
  }
}
