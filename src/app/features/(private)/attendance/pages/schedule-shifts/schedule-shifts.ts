import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
// NOTE: merge with the imports your old ScheduleShift already had (TuiIcon, TuiTitle, TuiInputDate, TuiCalendar, ...).
import {
  TuiButton,
  TuiCalendar,
  TuiDropdown,
  TuiIcon,
  TuiInput,
  TuiLabel,
  TuiTextfield,
  TuiTextfieldComponent,
  TuiTitle,
} from '@taiga-ui/core';
import {
  TuiBadge,
  TuiChevron,
  TuiDataListWrapperComponent,
  TuiInputDate,
  TuiSelect,
} from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendance.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Shift, ShiftHistoryEntry } from '../../model/attendance.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { DashboardService } from '../../../dashboard/service/dashboard.service';
import { toIsoDate } from '../../../../../shared/utils/date-format.util';
// import { toIsoDate } from '...';  // keep the same import your old ScheduleShift used

interface PickerEmployee {
  id: string;
  fullName: string;
  staffNo: string;
}

@Component({
  selector: 'app-schedule-shift',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TuiButton,
    TuiBadge,
    TuiCardLarge,
    TuiCalendar,
    TuiChevron,
    TuiDropdown,
    TuiIcon,
    TuiInput,
    TuiInputDate,
    TuiLabel,
    TuiSelect,
    TuiTextfield,
    TuiTextfieldComponent,
    TuiTitle,
    TuiDataListWrapperComponent,
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

  protected isPrivileged = computed(() => this.authService.hasRole(['Admin', 'HR']));

  // ---------- All shifts (top section) ----------
  protected shifts = signal<Shift[]>([]);
  protected isLoadingShifts = signal(false);

  protected shiftOptions = computed(() =>
    this.shifts().map((s) => ({
      id: s.id,
      toString: () => `${s.name} (${s.startTime} - ${s.endTime})`,
    })),
  );

  // ---------- Employee list ----------
  protected employees = computed<PickerEmployee[]>(() => {
    if (this.isPrivileged()) {
      return (this.employeeService.allEmployees() ?? []).map((e) => ({
        id: e.id,
        fullName: e.fullName,
        staffNo: e.staffNo,
      }));
    }
    return (this.dashboardService.data()?.teamMembers ?? []).map((m) => ({
      id: m.employeeId,
      fullName: m.fullName,
      staffNo: m.staffNo,
    }));
  });

  protected employeeSearch = signal('');
  protected filteredEmployees = computed(() => {
    const q = this.employeeSearch().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter(
      (e) => e.fullName.toLowerCase().includes(q) || e.staffNo.toLowerCase().includes(q),
    );
  });

  protected selectedEmployee = signal<PickerEmployee | null>(null);
  protected selectedEmployeeId = computed(() => this.selectedEmployee()?.id ?? null);

  // ---------- Shift history (right panel) ----------
  protected history = signal<ShiftHistoryEntry[]>([]);
  protected isLoading = signal(false);
  protected hasSearched = signal(false);

  // ---------- Inline assign form ----------
  protected showAssignForm = signal(false);
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

  protected selectEmployee(id: string): void {
    const emp = this.employees().find((e) => e.id === id) ?? null;
    this.selectedEmployee.set(emp);
    this.resetAssignForm(); // don't carry a half-filled form over to another employee
    this.showAssignForm.set(false);
    this.search();
  }

  protected search(): void {
    const employeeId = this.selectedEmployee()?.id;
    if (!employeeId) return;

    this.isLoading.set(true);
    this.attendanceService.getShiftHistory(employeeId).subscribe({
      next: (response) => {
        this.history.set(response.isSuccess && response.data ? response.data : []);
        this.hasSearched.set(true);
        this.isLoading.set(false);
        if (!response.isSuccess) {
          this.toast.error(response.message || 'Could not load shift history.', 'Load Failed');
        }
      },
      error: (err) => {
        this.hasSearched.set(true);
        this.isLoading.set(false);
        this.toast.error(err?.error?.message || 'Could not load shift history.', 'Load Failed');
      },
    });
  }

  protected toggleAssignForm(): void {
    if (this.showAssignForm()) this.resetAssignForm();
    this.showAssignForm.update((open) => !open);
  }

  protected onEffectiveFromChange(value: string): void {
    this.effectiveFrom.set(toIsoDate(value));
  }

  protected onEffectiveToChange(value: string): void {
    this.effectiveTo.set(toIsoDate(value));
  }

  protected assignShift(): void {
    const employeeId = this.selectedEmployee()?.id;
    const shiftId = this.selectedShiftOption()?.id;
    const effectiveFrom = this.effectiveFrom();

    if (!employeeId || !shiftId || !effectiveFrom) {
      this.toast.error('Select a shift and an effective from date.', 'Missing Information');
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
            this.resetAssignForm();
            this.showAssignForm.set(false);
            this.search(); // refresh the history so the new assignment shows up
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

  private resetAssignForm(): void {
    this.selectedShiftOption.set(null);
    this.effectiveFrom.set('');
    this.effectiveTo.set('');
  }

  protected formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }
}
