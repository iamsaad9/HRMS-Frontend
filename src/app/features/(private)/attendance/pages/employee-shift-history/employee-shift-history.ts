import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiDropdown, TuiInput, TuiLabel, TuiTextfield, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiBadge, TuiChevron, TuiDataListWrapperComponent, TuiSelect } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendance.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ShiftHistoryEntry } from '../../model/attendance.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { DashboardService } from '../../../dashboard/service/dashboard.service';

/** Only what the picker/search actually need - lets a manager's team come straight from the
 * already-loaded, correctly-scoped dashboard team list instead of the Admin/HR-only full
 * employee directory (see the ngOnInit/employees comments below). */
interface ShiftHistoryPickerEmployee {
  id: string;
  fullName: string;
  staffNo: string;
}

@Component({
  selector: 'app-employee-shift-history',
  standalone: true,
  imports: [
    FormsModule, 
    DatePipe, 
    TuiInput,
    TuiButton, 
    TuiTable, 
    TuiBadge, 
    TuiCardLarge, 
    MainHeading, 
    TuiTextfieldComponent, 
    TuiDataListWrapperComponent,
    TuiChevron,
    TuiLabel,
    TuiSelect,
    TuiDropdown,
    TuiTextfield
  ],
  templateUrl: './employee-shift-history.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeShiftHistory implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  protected readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);

  protected isPrivileged = computed(() => this.authService.hasRole(['Admin', 'HR']));

  protected employees = computed<ShiftHistoryPickerEmployee[]>(() => {
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

  // Filters the left-hand list by name or staff no.
  protected employeeSearch = signal('');
  protected filteredEmployees = computed(() => {
    const q = this.employeeSearch().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter(
      (e) => e.fullName.toLowerCase().includes(q) || e.staffNo.toLowerCase().includes(q),
    );
  });

  // Stores the selected employee
  protected selectedEmployee = signal<ShiftHistoryPickerEmployee | null>(null);
  protected selectedEmployeeId = computed(() => this.selectedEmployee()?.id ?? null);

  protected history = signal<ShiftHistoryEntry[]>([]);
  protected isLoading = signal(false);
  protected hasSearched = signal(false);

  readonly stringifyEmployee = (emp: ShiftHistoryPickerEmployee): string =>
    emp ? `${emp.fullName} (${emp.staffNo})` : '';

  ngOnInit(): void {
    if (this.isPrivileged()) {
      this.employeeService.getAllEmployees().subscribe();
    } else {
      this.dashboardService.load().subscribe();
    }
  }

  protected employeeOptions = computed(() =>
    this.employees().map((emp) => ({
      id: emp.id,
      toString: () => `${emp.fullName} (${emp.staffNo})`,
    })),
  );

  // Called when a row in the left list is clicked. Selects the employee and fetches immediately.
  protected selectEmployee(id: string): void {
    const emp = this.employees().find((e) => e.id === id) ?? null;
    this.selectedEmployee.set(emp);
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

  protected formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }
}