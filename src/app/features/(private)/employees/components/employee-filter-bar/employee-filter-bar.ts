import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiButton, TuiIcon, TuiInput, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';

import {
  EMPTY_EMPLOYEE_FILTER,
  type Employee,
  type EmployeeFilter,
} from '../../model/employee.model';

@Component({
  selector: 'app-employee-filter-bar',
  standalone: true,
  imports: [
    FormsModule,
    TuiCardLarge,
    TuiTextfieldComponent,
    TuiInput,
    TuiChevron,
    TuiDataListWrapper,
    TuiSelect,
    TuiButton,
  ],
  templateUrl: './employee-filter-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeFilterBarComponent implements OnChanges {
  @Input({ required: true })
  employees: readonly Employee[] = [];

  @Output()
  readonly filterChange = new EventEmitter<EmployeeFilter>();

  // Filter lists dynamically computed from inputs
  protected departments: string[] = [];
  protected roles: string[] = [];
  protected statuses: string[] = [];

  // Local draft filter values before apply
  protected searchQuery = signal('');
  protected selectedDepartment = signal<string | null>(null);
  protected selectedRole = signal<string | null>(null);
  protected selectedStatus = signal<string | null>(null);

  // Active filter state emitted to parent
  protected activeFilter: EmployeeFilter = { ...EMPTY_EMPLOYEE_FILTER };

  ngOnChanges(): void {
    if (this.employees?.length) {
      this.departments = [
        ...new Set(
          this.employees
            .map((e) => e.departmentName)
            .filter((department): department is string => Boolean(department)),
        ),
      ].sort();

      this.roles = [
        ...new Set(
          this.employees
            .map((e) => (e as any).role || (e as any).designation)
            .filter((role): role is string => Boolean(role)),
        ),
      ].sort();

      this.statuses = [
        ...new Set(
          this.employees.map((e) => e.status).filter((status): status is string => Boolean(status)),
        ),
      ].sort();
    }
  }

  protected applyFilter(): void {
    this.activeFilter = {
      ...this.activeFilter,
      search: this.searchQuery().trim(),
      departmentId: this.selectedDepartment() || null,
      role: (this.selectedRole() || null) as any,
      status: (this.selectedStatus() || null) as string | null,
    };
    this.filterChange.emit(this.activeFilter);
  }

  protected clear(): void {
    this.searchQuery.set('');
    this.selectedDepartment.set(null);
    this.selectedRole.set(null);
    this.selectedStatus.set(null);

    this.activeFilter = { ...EMPTY_EMPLOYEE_FILTER };
    this.filterChange.emit(this.activeFilter);
  }

  protected get hasActiveFilters(): boolean {
    return Boolean(
      this.searchQuery() ||
      this.selectedDepartment() ||
      this.selectedRole() ||
      this.selectedStatus() ||
      this.activeFilter.search ||
      this.activeFilter.departmentId ||
      this.activeFilter.status,
    );
  }
}
