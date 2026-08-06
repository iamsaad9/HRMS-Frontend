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
} from '@taiga-ui/core';
import {
  TuiAutoColorPipe,
  TuiAvatar,
  TuiBadge,
  TuiInitialsPipe,
  TuiItemsWithMore,
  TuiProgressBar,
  TuiStatus,
} from '@taiga-ui/kit';
import { TuiItemGroup, TuiCardLarge } from '@taiga-ui/layout';
import { TuiTable, TuiTableControl } from '@taiga-ui/addon-table';

import { EmployeeFilter, EMPTY_EMPLOYEE_FILTER, type Employee } from '../../model/employee-model';
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
    TuiProgressBar,
    TuiTable,
    TuiTableControl,
    TuiTitle,
    TuiStatus,
    EmployeeFilterBarComponent,
    MainHeading,
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

      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });
  });

  // employees: Employee[] = [
  //   {
  //     id: 'emp-001',
  //     userId: 'user-001',
  //     staffNo: 'EMP1001',
  //     firstName: 'Saad',
  //     fullName: 'Saad Masood',
  //     lastName: 'Masood',
  //     email: 'saad.masood@company.com',
  //     departmentId: 'dept-001',
  //     departmentName: 'Engineering',
  //     branchId: 'branch-001',
  //     branchName: 'Karachi HQ',
  //     jobTitleId: 'job-001',
  //     jobTitleName: 'Frontend Developer',
  //     managerId: 'emp-010',
  //     managerName: 'Ahmed Khan',
  //     isActive: true,
  //     createdAtUtc: new Date('2024-01-15T09:00:00Z'),
  //     role: 'Employee',
  //     status: 'Active',
  //   },
  //   {
  //     id: 'emp-002',
  //     userId: 'user-002',
  //     staffNo: 'EMP1002',
  //     firstName: 'Ayesha',
  //     fullName: 'Ayesha Ali',
  //     lastName: 'Ali',
  //     email: 'ayesha.ali@company.com',
  //     departmentId: 'dept-001',
  //     departmentName: 'Engineering',
  //     branchId: 'branch-001',
  //     branchName: 'Karachi HQ',
  //     jobTitleId: 'job-002',
  //     jobTitleName: 'Backend Developer',
  //     managerId: 'emp-010',
  //     managerName: 'Ahmed Khan',
  //     isActive: true,
  //     createdAtUtc: new Date('2023-10-22T11:30:00Z'),
  //     role: 'Employee',
  //     status: 'Active',
  //   },
  //   {
  //     id: 'emp-003',
  //     userId: 'user-003',
  //     staffNo: 'EMP1003',
  //     firstName: 'Bilal',
  //     fullName: 'Bilal Hussain',
  //     lastName: 'Hussain',
  //     email: 'bilal.hussain@company.com',
  //     departmentId: 'dept-002',
  //     departmentName: 'Human Resources',
  //     branchId: 'branch-002',
  //     branchName: 'Lahore Office',
  //     jobTitleId: 'job-003',
  //     jobTitleName: 'HR Officer',
  //     managerId: 'emp-011',
  //     managerName: 'Fatima Noor',
  //     isActive: true,
  //     createdAtUtc: new Date('2022-07-18T08:15:00Z'),
  //     role: 'HR',
  //     status: 'On Leave',
  //   },
  //   {
  //     id: 'emp-004',
  //     userId: 'user-004',
  //     staffNo: 'EMP1004',
  //     firstName: 'Fatima',
  //     fullName: 'Fatima Noor',
  //     lastName: 'Noor',
  //     email: 'fatima.noor@company.com',
  //     departmentId: 'dept-002',
  //     departmentName: 'Human Resources',
  //     branchId: 'branch-002',
  //     branchName: 'Lahore Office',
  //     jobTitleId: 'job-004',
  //     jobTitleName: 'HR Manager',
  //     managerId: undefined,
  //     managerName: undefined,
  //     isActive: true,
  //     createdAtUtc: new Date('2021-03-10T10:00:00Z'),
  //     role: 'Manager',
  //     status: 'Active',
  //   },
  //   {
  //     id: 'emp-005',
  //     userId: 'user-005',
  //     staffNo: 'EMP1005',
  //     firstName: 'Usman',
  //     fullName: 'Usman Tariq',
  //     lastName: 'Tariq',
  //     email: 'usman.tariq@company.com',
  //     departmentId: 'dept-003',
  //     departmentName: 'Finance',
  //     branchId: 'branch-003',
  //     branchName: 'Islamabad Office',
  //     jobTitleId: 'job-005',
  //     jobTitleName: 'Accountant',
  //     managerId: 'emp-012',
  //     managerName: 'Sara Ahmed',
  //     isActive: false,
  //     createdAtUtc: new Date('2020-11-05T14:20:00Z'),
  //     role: 'Employee',
  //     status: 'Inactive',
  //   },
  //   {
  //     id: 'emp-006',
  //     userId: 'user-006',
  //     staffNo: 'EMP1006',
  //     firstName: 'Sara',
  //     fullName: 'Sara Ahmed',
  //     lastName: 'Ahmed',
  //     email: 'sara.ahmed@company.com',
  //     departmentId: 'dept-003',
  //     departmentName: 'Finance',
  //     branchId: 'branch-003',
  //     branchName: 'Islamabad Office',
  //     jobTitleId: 'job-006',
  //     jobTitleName: 'Finance Manager',
  //     managerId: undefined,
  //     managerName: undefined,
  //     isActive: true,
  //     createdAtUtc: new Date('2019-09-01T09:45:00Z'),
  //     role: 'Manager',
  //     status: 'Active',
  //   },
  //   {
  //     id: 'emp-007',
  //     userId: 'user-007',
  //     staffNo: 'EMP1007',
  //     firstName: 'Hassan',
  //     fullName: 'Hassan Raza',
  //     lastName: 'Raza',
  //     email: 'hassan.raza@company.com',
  //     departmentId: 'dept-004',
  //     departmentName: 'Sales',
  //     branchId: 'branch-001',
  //     branchName: 'Karachi HQ',
  //     jobTitleId: 'job-007',
  //     jobTitleName: 'Sales Executive',
  //     managerId: 'emp-008',
  //     managerName: 'Ali Shah',
  //     isActive: true,
  //     createdAtUtc: new Date('2024-04-12T13:10:00Z'),
  //     role: 'Employee',
  //     status: 'Probation',
  //   },
  //   {
  //     id: 'emp-008',
  //     userId: 'user-008',
  //     staffNo: 'EMP1008',
  //     firstName: 'Ali',
  //     fullName: 'Ali Shah',
  //     lastName: 'Shah',
  //     email: 'ali.shah@company.com',
  //     departmentId: 'dept-004',
  //     departmentName: 'Sales',
  //     branchId: 'branch-001',
  //     branchName: 'Karachi HQ',
  //     jobTitleId: 'job-008',
  //     jobTitleName: 'Sales Manager',
  //     managerId: undefined,
  //     managerName: undefined,
  //     isActive: true,
  //     createdAtUtc: new Date('2018-05-20T08:00:00Z'),
  //     role: 'Manager',
  //     status: 'Active',
  //   },
  //   {
  //     id: 'emp-009',
  //     userId: 'user-009',
  //     staffNo: 'EMP1009',
  //     firstName: 'Zainab',
  //     fullName: 'Zainab Iqbal',
  //     lastName: 'Iqbal',
  //     email: 'zainab.iqbal@company.com',
  //     departmentId: 'dept-005',
  //     departmentName: 'Marketing',
  //     branchId: 'branch-002',
  //     branchName: 'Lahore Office',
  //     jobTitleId: 'job-009',
  //     jobTitleName: 'Marketing Specialist',
  //     managerId: 'emp-013',
  //     managerName: 'Omar Siddiqui',
  //     isActive: true,
  //     createdAtUtc: new Date('2023-06-08T15:00:00Z'),
  //     role: 'Employee',
  //     status: 'Active',
  //   },
  //   {
  //     id: 'emp-010',
  //     userId: 'user-010',
  //     staffNo: 'EMP1010',
  //     firstName: 'Ahmed',
  //     fullName: 'Ahmed Khan',
  //     lastName: 'Khan',
  //     email: 'ahmed.khan@company.com',
  //     departmentId: 'dept-001',
  //     departmentName: 'Engineering',
  //     branchId: 'branch-001',
  //     branchName: 'Karachi HQ',
  //     jobTitleId: 'job-010',
  //     jobTitleName: 'Engineering Manager',
  //     managerId: undefined,
  //     managerName: undefined,
  //     isActive: true,
  //     createdAtUtc: new Date('2017-01-15T09:00:00Z'),
  //     role: 'Admin',
  //     status: 'Active',
  //   },
  // ];
}
