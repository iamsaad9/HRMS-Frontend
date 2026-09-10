import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiDropdown, TuiLabel, TuiTextfield, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiBadge, TuiChevron, TuiDataListWrapperComponent, TuiSelect } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendance.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { ShiftHistoryEntry } from '../../model/attendance.model';
import { ToastService } from '../../../../../core/services/toast.service';
import { Employee } from '../../../employees/model/employee.model';

@Component({
  selector: 'app-employee-shift-history',
  standalone: true,
  imports: [
    FormsModule, 
    DatePipe, 
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
  private readonly toast = inject(ToastService);

  // Return full Employee objects instead of string names
  protected employees = computed(() => this.employeeService.allEmployees() ?? []);
  
  // Stores the selected Employee object
  protected selectedEmployee = signal<Employee | null>(null);
  
  protected history = signal<ShiftHistoryEntry[]>([]);
  protected isLoading = signal(false);
  protected hasSearched = signal(false);

  // Taiga UI Helper to format employee option labels in the dropdown
  readonly stringifyEmployee = (emp: Employee): string =>
    emp ? `${emp.fullName} (${emp.staffNo})` : '';

  ngOnInit(): void {
    this.employeeService.getAllEmployees().subscribe();
  }

  protected employeeOptions = computed(() => 
  this.employeeService.allEmployees()?.map(emp => ({
    id: emp.id,
    toString: () => `${emp.fullName} (${emp.staffNo})`
  })) ?? []
);

  protected search(): void {
    // Extract employeeId from the selected object
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