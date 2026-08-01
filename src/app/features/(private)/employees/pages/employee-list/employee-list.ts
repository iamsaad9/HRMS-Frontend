import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
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

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeList {
  // @Input({ required: true })
  // employees: readonly Employee[] = [];

  protected filter = signal<EmployeeFilter>({ ...EMPTY_EMPLOYEE_FILTER });

  @Output()
  readonly edit = new EventEmitter<Employee>();

  @Output()
  readonly more = new EventEmitter<Employee>();

  protected readonly sizes = ['l', 'm', 's'] as const;
  protected size: (typeof this.sizes)[number] = 'm';
  protected selected: Employee[] = [];

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
    const list = this.employees;
    const currentFilter = this.filter();

    return list.filter((emp) => {
      // 1. Search filter
      const matchesSearch =
        !currentFilter.search ||
        emp.name?.toLowerCase().includes(currentFilter.search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(currentFilter.search.toLowerCase());

      // 2. Department filter
      const matchesDept = !currentFilter.department || emp.department === currentFilter.department;

      // 3. Role filter
      const matchesRole =
        !currentFilter.role ||
        (emp as any).role === currentFilter.role ||
        (emp as any).designation === currentFilter.role;

      // 4. Status filter
      const matchesStatus = !currentFilter.status || emp.status === currentFilter.status;

      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });
  });

  employees: Employee[] = [
    {
      id: 'EMP-001',
      name: 'Saad Masood',
      email: 'saad.masood@example.com',
      role: 'Frontend Developer',
      department: 'Engineering',
      status: 'Active',

      tags: ['React', 'Next.js', 'TypeScript'],
      workload: 85,
    },
    {
      id: 'EMP-002',
      name: 'Ayesha Khan',
      email: 'ayesha.khan@example.com',
      role: 'UI/UX Designer',
      department: 'Design',
      status: 'On Leave',

      tags: ['Figma', 'Prototyping'],
      workload: 0,
    },
    {
      id: 'EMP-003',
      name: 'Ali Raza',
      email: 'ali.raza@example.com',
      role: 'Backend Developer',
      department: 'Engineering',
      status: 'Active',

      tags: ['.NET', 'PostgreSQL', 'Docker'],
      workload: 72,
    },
    {
      id: 'EMP-004',
      name: 'Fatima Ahmed',
      email: 'fatima.ahmed@example.com',
      role: 'QA Engineer',
      department: 'Quality Assurance',
      status: 'Terminated',

      tags: ['Automation', 'Cypress'],
      workload: 0,
    },
    {
      id: 'EMP-005',
      name: 'Hamza Siddiqui',
      email: 'hamza.siddiqui@example.com',
      role: 'DevOps Engineer',
      department: 'Infrastructure',
      status: 'Active',

      tags: ['AWS', 'Kubernetes', 'CI/CD'],
      workload: 93,
    },
    {
      id: 'EMP-006',
      name: 'Zainab Malik',
      email: 'zainab.malik@example.com',
      role: 'Project Manager',
      department: 'Management',
      status: 'Active',

      tags: ['Agile', 'Scrum'],
      workload: 60,
    },
    {
      id: 'EMP-007',
      name: 'Usman Tariq',
      email: 'usman.tariq@example.com',
      role: 'Business Analyst',
      department: 'Business',
      status: 'On Leave',

      tags: ['Requirements', 'Documentation'],
      workload: 0,
    },
    {
      id: 'EMP-008',
      name: 'Sara Noor',
      email: 'sara.noor@example.com',
      role: 'HR Specialist',
      department: 'Human Resources',
      status: 'Active',

      tags: ['Recruitment', 'Payroll'],
      workload: 48,
    },
  ];
}
