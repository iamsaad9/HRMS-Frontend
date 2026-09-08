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
  TuiDataList,
} from '@taiga-ui/core';
import {
  TuiAutoColorPipe,
  TuiAvatar,
  TuiBadge,
  TuiChevron,
  TuiInitialsPipe,
  TuiItemsWithMore,
  TuiPagination,
  TuiProgressBar,
  TuiStatus,
} from '@taiga-ui/kit';
import { TuiItemGroup, TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable, TuiTableControl } from '@taiga-ui/addon-table';

import {
  EmployeeFilter,
  EMPTY_EMPLOYEE_FILTER,
  filterEmployees,
  type Employee,
} from '../../model/employee.model';
import { EmployeeFilterBarComponent } from '../../components/employee-filter-bar/employee-filter-bar';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { LoadingService } from '../../../../../core/services/loading.service';
import { EmployeeService } from '../../services/employee.service';
import { RouterLink } from '@angular/router';
import { DropdownSelectorComponent } from '../../../../../shared/components/dropdown-selector/dropdown-selector';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-employee-table',
  standalone: true,
  imports: [
    FormsModule,
    TuiAutoColorPipe,
    TuiAvatar,
    TuiButton,
    TuiCell,
    TuiCheckbox,
    TuiInitialsPipe,
    TuiItemsWithMore,
    TuiPagination,
    TuiTable,
    TuiTableControl,
    TuiTitle,
    TuiStatus,
    EmployeeFilterBarComponent,
    MainHeading,
    TuiAppearance,
    TuiCardLarge,
    RouterLink,
    TuiDataList,
    DatePipe
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
  protected openMoreOptions = signal(false);

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

 
  protected onObscured(obscured: boolean): void {
    if (obscured) {
      this.openMoreOptions.set(false)
    }
  }

  protected onActiveZone(active: boolean): void {
    if (!active) {
     this.openMoreOptions.set(false)
    }
  }

  protected onFilterChange(updatedFilter: EmployeeFilter): void {
    this.filter.set(updatedFilter);
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
  }

  protected filteredEmployees = computed(() =>
    filterEmployees(this.employees() || [], this.filter()),
  );

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEmployees().length / this.pageSize)),
  );

  protected readonly paginatedEmployees = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filteredEmployees().slice(start, start + this.pageSize);
  });

  exportToCsv(): void {
    const data = this.employees();
    if (!data || data.length === 0) {
      alert('No employee data available to export.');
      return;
    }

    // 1. Define CSV headers and corresponding object keys
    const columns: { label: string; key: keyof Employee }[] = [
      { label: 'Title', key: 'title' },
      { label: 'FirstName', key: 'firstName' },
      { label: 'LastName', key: 'lastName' },
      { label: 'WorkEmail', key: 'workEmail' },
      { label: 'Gender', key: 'gender' },
      { label: 'DateOfBirth', key: 'dateOfBirth' },
      { label: 'Mobile', key: 'mobile' },
      { label: 'NINumber', key: 'niNumber' },
      { label: 'StartDate', key: 'startDate' },
      { label: 'EmploymentType', key: 'employmentType' },
      { label: 'ShiftCode', key: 'shiftCode' },
      { label: 'DepartmentName', key: 'departmentName' },
      { label: 'BranchName', key: 'branchName' },
      { label: 'DesignationName', key: 'designationTitle' },
      { label: 'ManagerEmail', key: 'managerEmail' },
      { label: 'IsActive', key: 'isActive' },
      { label: 'CreatedAtUTC', key: 'createdAtUtc' },
    ];

    // 2. Build CSV header row
    const headers = columns.map((col) => this.escapeCsvField(col.label)).join(',');

    // 3. Map employee records to CSV rows
    const rows = data.map((emp) =>
      columns
        .map((col) => {
          const val = emp[col.key];
          
          if (val === null || val === undefined) return '""';
          if (val instanceof Date) return this.escapeCsvField(val.toISOString());
          
          return this.escapeCsvField(String(val));
        })
        .join(',')
    );

    // 4. Combine headers and rows with UTF-8 BOM so Excel opens special characters correctly
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');

    // 5. Create downloadable Blob link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `employees_${timestamp}.csv`);
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeCsvField(field: string): string {
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}
