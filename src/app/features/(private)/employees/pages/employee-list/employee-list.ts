import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  TuiButton,
  TuiCell,
  TuiCheckbox,
  TuiDropdown,
  TuiIcon,
  TuiLink,
  TuiTitle,
  TuiAppearance,
} from '@taiga-ui/core';
import {
  TuiAutoColorPipe,
  TuiAvatar,
  TuiBadge,
  TuiInitialsPipe,
  TuiItemsWithMore,
  TuiPagination,
  TuiProgressBar,
  TuiStatus,
} from '@taiga-ui/kit';
import { TuiItemGroup, TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable, TuiTableControl } from '@taiga-ui/addon-table';

import { EmployeeFilter, EMPTY_EMPLOYEE_FILTER, type Employee } from '../../model/employee.model';
import { EmployeeFilterBarComponent } from '../../components/employee-filter-bar/employee-filter-bar';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { LoadingService } from '../../../../../core/services/loading.service';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [
    FormsModule,
    TuiAutoColorPipe,
    TuiAvatar,
    TuiBadge,
    TuiButton,
    TuiCell,
    TuiCheckbox,
    TuiDropdown,
    TuiInitialsPipe,
    TuiItemGroup,
    TuiItemsWithMore,
    TuiLink,
    TuiPagination,
    TuiProgressBar,
    TuiTable,
    TuiTableControl,
    TuiTitle,
    TuiStatus,
    EmployeeFilterBarComponent,
    MainHeading,
    TuiAppearance,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeList implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  protected employees = this.employeeService.allEmployees;
  protected filter = signal<EmployeeFilter>({ ...EMPTY_EMPLOYEE_FILTER });
  private loadingService = inject(LoadingService);

  @Output()
  readonly edit = new EventEmitter<Employee>();

  @Output()
  readonly more = new EventEmitter<Employee>();

  protected readonly sizes = ['l', 'm', 's'] as const;
  protected size: (typeof this.sizes)[number] = 'm';
  protected selected: Employee[] = [];

  // Pagination state
  protected readonly pageSize = 10;
  protected page = signal(0);

  constructor() {
    // Reset to first page whenever the filter changes, so the user
    // never lands on a page that's empty because filtering shrank the list.
    effect(() => {
      this.filter();
      this.page.set(0);
    });
  }

  ngOnInit(): void {
    this.employeeService.getAllEmployees().subscribe({});
  }

  protected onEdit(employee: Employee): void {
    this.edit.emit(employee);
  }

  protected onMore(employee: Employee): void {
    this.more.emit(employee);
  }

  protected onFilterChange(updatedFilter: EmployeeFilter): void {
    this.filter.set(updatedFilter);
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
  }

  protected filteredEmployees = computed(() => {
    const list = this.employees() || [];
    const currentFilter = this.filter();

    return list.filter((emp: Employee) => {
      const matchesSearch =
        !currentFilter.search ||
        emp.fullName?.toLowerCase().includes(currentFilter.search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(currentFilter.search.toLowerCase());

      const matchesDept =
        !currentFilter.departmentId || emp.departmentId === currentFilter.departmentId;

      const matchesRole =
        !currentFilter.role ||
        (emp as any).role === currentFilter.role ||
        (emp as any).designation === currentFilter.role;

      const matchesStatus = !currentFilter.status || emp.status === currentFilter.status;
      const matchIsActive = !currentFilter.isActive || emp.isActive === currentFilter.isActive;

      return matchesSearch && matchesDept && matchesRole && matchesStatus && matchIsActive;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEmployees().length / this.pageSize)),
  );

  protected readonly paginatedEmployees = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filteredEmployees().slice(start, start + this.pageSize);
  });
}
