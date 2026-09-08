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

  // Filter lists dynamically computed from inputs (dropdowns display names; the
  // maps below translate the selected name back to the id the filter actually needs)
  protected departments: string[] = [];
  protected branches: string[] = [];
  protected managers: string[] = [];
  protected roles: string[] = [];
  protected readonly statuses: string[] = ['Active', 'Inactive'];

  private departmentIdByName = new Map<string, string>();
  private branchIdByName = new Map<string, string>();
  private managerIdByName = new Map<string, string>();

  // Local draft filter values before apply
  protected searchQuery = signal('');
  protected selectedDepartment = signal<string | null>(null);
  protected selectedBranch = signal<string | null>(null);
  protected selectedManager = signal<string | null>(null);
  protected selectedRole = signal<string | null>(null);
  protected selectedStatus = signal<string | null>(null);

  // Active filter state emitted to parent
  protected activeFilter: EmployeeFilter = { ...EMPTY_EMPLOYEE_FILTER };

  ngOnChanges(): void {
    if (this.employees?.length) {
      this.departmentIdByName.clear();
      this.branchIdByName.clear();
      this.managerIdByName.clear();

      for (const e of this.employees) {
        if (e.departmentName && e.departmentId) {
          this.departmentIdByName.set(e.departmentName, e.departmentId);
        }
        if (e.branchName && e.branchId) {
          this.branchIdByName.set(e.branchName, e.branchId);
        }
        if (e.managerName && e.managerId) {
          this.managerIdByName.set(e.managerName, e.managerId);
        }
      }

      this.departments = [...this.departmentIdByName.keys()].sort();
      this.branches = [...this.branchIdByName.keys()].sort();
      this.managers = [...this.managerIdByName.keys()].sort();

      this.roles = [
        ...new Set(
          this.employees
            .map((e) => e.designationTitle)
            .filter((designation): designation is string => Boolean(designation)),
        ),
      ].sort();
    }
  }

  protected applyFilter(): void {
    const status = this.selectedStatus();
    this.activeFilter = {
      ...this.activeFilter,
      search: this.searchQuery().trim(),
      departmentId: this.toId(this.departmentIdByName, this.selectedDepartment()),
      branchId: this.toId(this.branchIdByName, this.selectedBranch()),
      managerId: this.toId(this.managerIdByName, this.selectedManager()),
      role: this.selectedRole() || null,
      status,
      isActive: status === 'Active' ? true : status === 'Inactive' ? false : null,
    };
    this.filterChange.emit(this.activeFilter);
  }

  protected clear(): void {
    this.searchQuery.set('');
    this.selectedDepartment.set(null);
    this.selectedBranch.set(null);
    this.selectedManager.set(null);
    this.selectedRole.set(null);
    this.selectedStatus.set(null);

    this.activeFilter = { ...EMPTY_EMPLOYEE_FILTER };
    this.filterChange.emit(this.activeFilter);
  }

  private toId(map: Map<string, string>, name: string | null): string | null {
    return name ? (map.get(name) ?? null) : null;
  }

  protected get hasActiveFilters(): boolean {
    return Boolean(
      this.searchQuery() ||
      this.selectedDepartment() ||
      this.selectedBranch() ||
      this.selectedManager() ||
      this.selectedRole() ||
      this.selectedStatus() ||
      this.activeFilter.search ||
      this.activeFilter.departmentId ||
      this.activeFilter.branchId ||
      this.activeFilter.managerId ||
      this.activeFilter.status,
    );
  }
}
