import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  computed,
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

/** How long to wait after the last keystroke in the search box before auto-applying. */
const SEARCH_DEBOUNCE_MS = 400;

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

  protected readonly statuses: string[] = ['Active', 'Inactive'];
  protected readonly categories: string[] = ['Academic', 'Administrative'];

  // Local draft filter values - every change below auto-applies, there is no separate "Apply" step.
  protected searchQuery = signal('');
  protected selectedDepartment = signal<string | null>(null);
  protected selectedBranch = signal<string | null>(null);
  protected selectedCategory = signal<string | null>(null);
  protected selectedRole = signal<string | null>(null);
  protected selectedStatus = signal<string | null>(null);

  private readonly employeesSig = signal<readonly Employee[]>([]);

  // Cascading options: once a Department is picked, Branch/Designation option lists narrow to
  // only the values that actually occur within that department, instead of always listing every
  // value across the whole company.
  private readonly scopedEmployees = computed(() => {
    const deptId = this.toId(this.departmentIdByName(), this.selectedDepartment());
    const all = this.employeesSig();
    return deptId ? all.filter((e) => e.departmentId === deptId) : all;
  });

  protected readonly departments = computed(() => this.distinctSorted(this.employeesSig(), (e) => e.departmentName));
  protected readonly branches = computed(() => this.distinctSorted(this.scopedEmployees(), (e) => e.branchName));
  protected readonly roles = computed(() => this.distinctSorted(this.scopedEmployees(), (e) => e.designationTitle));

  private readonly departmentIdByName = computed(() =>
    this.buildNameIdMap(this.employeesSig(), (e) => e.departmentName, (e) => e.departmentId),
  );
  private readonly branchIdByName = computed(() =>
    this.buildNameIdMap(this.employeesSig(), (e) => e.branchName, (e) => e.branchId),
  );
  private readonly designationIdByName = computed(() =>
    this.buildNameIdMap(this.employeesSig(), (e) => e.designationTitle, (e) => e.designationId),
  );

  private searchDebounceHandle?: ReturnType<typeof setTimeout>;

  ngOnChanges(): void {
    this.employeesSig.set(this.employees ?? []);
  }

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
    clearTimeout(this.searchDebounceHandle);
    this.searchDebounceHandle = setTimeout(() => this.applyFilter(), SEARCH_DEBOUNCE_MS);
  }

  protected onDepartmentChange(value: string | null): void {
    this.selectedDepartment.set(value);
    // Previously-picked Branch/Designation may no longer belong to the new department.
    this.selectedBranch.set(null);
    this.selectedRole.set(null);
    this.applyFilter();
  }

  protected onBranchChange(value: string | null): void {
    this.selectedBranch.set(value);
    this.applyFilter();
  }

  protected onCategoryChange(value: string | null): void {
    this.selectedCategory.set(value);
    this.applyFilter();
  }

  protected onRoleChange(value: string | null): void {
    this.selectedRole.set(value);
    this.applyFilter();
  }

  protected onStatusChange(value: string | null): void {
    this.selectedStatus.set(value);
    this.applyFilter();
  }

  protected applyFilter(): void {
    const status = this.selectedStatus();
    const filter: EmployeeFilter = {
      search: this.searchQuery().trim(),
      departmentId: this.toId(this.departmentIdByName(), this.selectedDepartment()),
      branchId: this.toId(this.branchIdByName(), this.selectedBranch()),
      managerId: null,
      designationId: this.toId(this.designationIdByName(), this.selectedRole()),
      category: this.selectedCategory(),
      role: this.selectedRole() || null,
      status,
      isActive: status === 'Active' ? true : status === 'Inactive' ? false : null,
    };
    this.filterChange.emit(filter);
  }

  protected clear(): void {
    clearTimeout(this.searchDebounceHandle);
    this.searchQuery.set('');
    this.selectedDepartment.set(null);
    this.selectedBranch.set(null);
    this.selectedCategory.set(null);
    this.selectedRole.set(null);
    this.selectedStatus.set(null);
    this.filterChange.emit({ ...EMPTY_EMPLOYEE_FILTER });
  }

  private toId(map: Map<string, string>, name: string | null): string | null {
    return name ? (map.get(name) ?? null) : null;
  }

  private distinctSorted(
    list: readonly Employee[],
    pick: (e: Employee) => string | null | undefined,
  ): string[] {
    return [...new Set(list.map(pick).filter((v): v is string => !!v))].sort();
  }

  private buildNameIdMap(
    list: readonly Employee[],
    name: (e: Employee) => string | null | undefined,
    id: (e: Employee) => string | null | undefined,
  ): Map<string, string> {
    const map = new Map<string, string>();
    for (const e of list) {
      const n = name(e);
      const i = id(e);
      if (n && i) map.set(n, i);
    }
    return map;
  }

  protected get hasActiveFilters(): boolean {
    return Boolean(
      this.searchQuery() ||
      this.selectedDepartment() ||
      this.selectedBranch() ||
      this.selectedCategory() ||
      this.selectedRole() ||
      this.selectedStatus(),
    );
  }
}
