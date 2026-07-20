import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { TuiButton, TuiDataList, TuiDropdown, TuiTitle } from '@taiga-ui/core';
import { TuiChevron } from '@taiga-ui/kit';
import { DropDownItem, DropdownSelectorComponent } from '../dropdown-selector/dropdown-selector';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';

interface ExampleAction {
  readonly icon: string;
  readonly description: string;
  readonly title: string;
}

interface Routes {
  id: string;
  name: string;
  description: string;
  route: string;
  category: string;
  tags: string[];
}

@Component({
  selector: 'app-navbar',
  imports: [
    TuiActiveZone,
    TuiChevron,
    TuiDataList,
    TuiDropdown,
    TuiObscured,
    TuiTitle,
    DropdownSelectorComponent,
    MatIcon,
  ],
  standalone: true,
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'fixed inset-x-0 top-0 z-50 block h-14 shadow-sm',
  },
})
export class NavbarComponent {
  notificationCount = signal(3);
  searchQuery = signal('');
  searchFocused = signal(false);
  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();

    // If query is empty or less than 2 characters, don't show any dropdown data
    if (query.length < 2) {
      return [];
    }

    // 3. This is where the actual comparison happens!
    return this.mockRoutes.filter((route) => {
      const matchTitle = route.name.toLowerCase().includes(query);
      const matchCategory = route.category.toLowerCase().includes(query);

      // Optional: checks your tag arrays if they are present in your interface
      const matchTags = route.tags?.some((tag) => tag.toLowerCase().includes(query));

      return matchTitle || matchCategory || matchTags;
    });
  });
  activeIndex = signal(-1);
  menuToggle = output<void>();

  protected readonly actions: readonly ExampleAction[] = [
    {
      icon: 'add',
      title: 'Create Employee',
      description: 'Create and Employee',
    },
    {
      icon: 'delete',
      title: 'Remove Employee',
      description: 'Delete and Employee',
    },
    {
      icon: 'arrow_downward',
      title: 'Download Report',
      description: 'Download any report',
    },
  ];

  protected readonly open = signal(false);
  protected readonly router = inject(Router);
  protected readonly navMenuOpen = signal(false);
  protected readonly selected = signal<ExampleAction | null>(null);
  protected readonly buttonLabel = computed(() => this.selected()?.title ?? 'Choose');

  protected onClick(): void {
    this.open.update((open) => !open);
  }

  protected openNavMenu(): void {
    this.navMenuOpen.update((open) => !open);
  }

  protected onObscured(obscured: boolean): void {
    if (obscured) {
      this.open.set(false);
      this.navMenuOpen.set(false);
    }
  }

  protected onActiveZone(active: boolean): void {
    if (!active) {
      this.open.set(false);
      this.navMenuOpen.set(false);
    }
  }

  protected onSelect(action: ExampleAction): void {
    this.selected.set(action);
    this.open.set(false);
  }

  protected navigateTo(routePath: string) {
    this.router.navigate([routePath]);
    this.searchQuery.set('');
    this.searchFocused.set(false);
    this.activeIndex.set(-1);
  }

  protected onSearchBlur() {
    setTimeout(() => {
      this.searchFocused.set(false);
      this.activeIndex.set(-1); // Reset highlight when leaving input
    }, 150);
  }

  protected readonly mockDropdownItems: DropDownItem[] = [
    {
      icon: 'dashboard',
      title: 'Dashboard',
      description: 'Overview of your account and activity',
      routeTo: '/dashboard',
    },
    {
      icon: 'file_copy',
      title: 'Projects',
      description: 'Manage all your projects',
      childItems: [
        {
          icon: 'watch_later',
          title: 'Active Projects',
          description: 'View ongoing projects',
          routeTo: '/projects/active',
        },
        {
          icon: 'archive',
          title: 'Archived Projects',
          description: 'Browse archived projects',
          routeTo: '/projects/archived',
        },
        {
          icon: 'add',
          title: 'Create Project',
          description: 'Start a new project',
          routeTo: '/projects/new',
          childItems: [
            {
              icon: 'insert_drive_file',
              title: 'Empty Project',
              description: 'Start an empty project',
              routeTo: '/project/empty/new',
            },
            {
              icon: 'add_to_photos',
              title: 'Template Project',
              description: 'Start an template based project',
              routeTo: '/project/template/new',
            },
          ],
        },
      ],
    },
    {
      icon: 'people_outline',
      title: 'Team',
      description: 'Manage team members and roles',
      childItems: [
        {
          icon: 'person_outline',
          title: 'Members',
          description: 'View all team members',
          routeTo: '/team/members',
        },
        {
          icon: 'security',
          title: 'Roles',
          description: 'Manage user roles and permissions',
          routeTo: '/team/roles',
          childItems: [
            {
              icon: 'supervised_user_circle',
              title: 'All Roles',
              description: 'View all Roles',
              routeTo: '/roles/all',
            },
          ],
        },
      ],
    },
    {
      icon: 'chrome_reader_mode',
      title: 'Reports',
      description: 'View analytics and reports',
      childItems: [
        {
          icon: 'attach_money',
          title: 'Sales Report',
          description: 'Monthly sales analytics',
          routeTo: '/reports/sales',
        },
        {
          icon: 'attach_money',
          title: 'Performance',
          description: 'Track team performance',
          routeTo: '/reports/performance',
        },
        {
          icon: 'note_add',
          title: 'Custom Reports',
          description: 'Generate custom reports',
          routeTo: '/reports/custom',
        },
      ],
    },
    {
      icon: 'settings',
      title: 'Settings',
      description: 'Configure application preferences',
      childItems: [
        {
          icon: 'person',
          title: 'Profile',
          description: 'Update your profile information',
          routeTo: '/settings/profile',
        },
        {
          icon: 'security',
          title: 'Security',
          description: 'Manage password and authentication',
          routeTo: '/settings/security',
        },
        {
          icon: 'notifications',
          title: 'Notifications',
          description: 'Configure notification preferences',
          routeTo: '/settings/notifications',
        },
      ],
    },
    {
      icon: 'help_outline',
      title: 'Help Center',
      description: 'Documentation and support resources',
      routeTo: '/help',
    },
  ];

  protected readonly mockRoutes: Routes[] = [
    {
      id: 'route_1',
      name: 'New Employee Onboarding',
      description: 'Add and onboard a new team member to the system',
      route: '/employee/new',
      category: 'Employee Management',
      tags: ['hire', 'staff', 'add', 'create', 'onboard'],
    },
    {
      id: 'route_2',
      name: 'Employee Directory',
      description: 'View and search all active and former staff profiles',
      route: '/employee/directory',
      category: 'Employee Management',
      tags: ['staff', 'list', 'profiles', 'members', 'find'],
    },
    {
      id: 'route_3',
      name: 'Update Employee Profile',
      description: 'Edit current employee designations, bank details, or contact info',
      route: '/employee/edit',
      category: 'Employee Management',
      tags: ['modify', 'change', 'details', 'update'],
    },
    {
      id: 'route_4',
      name: 'Request Leave / Time-Off',
      description: 'Submit a new sick leave, casual leave, or vacation request',
      route: '/leaves/request',
      category: 'Time & Attendance',
      tags: ['holiday', 'vacation', 'sick', 'time-off', 'absence'],
    },
    {
      id: 'route_5',
      name: 'Leave Approvals',
      description: 'Review and approve or reject pending team leave requests',
      route: '/leaves/approvals',
      category: 'Time & Attendance',
      tags: ['manager', 'approve', 'reject', 'status', 'pending'],
    },
    {
      id: 'route_6',
      name: 'Payroll Dashboard',
      description: 'View monthly salary disbursements, bonuses, and slips',
      route: '/finance/payroll',
      category: 'Payroll & Finance',
      tags: ['salary', 'pay', 'money', 'slip', 'bonus'],
    },
    {
      id: 'route_7',
      name: 'Tax Configurations',
      description: 'Manage regional tax brackets, deductions, and declarations',
      route: '/finance/tax-settings',
      category: 'Payroll & Finance',
      tags: ['tax', 'deductions', 'settings', 'compliance'],
    },
    {
      id: 'route_8',
      name: 'Active Performance Reviews',
      description: 'Evaluate employee KPIs and peer feedback appraisal cycles',
      route: '/performance/reviews',
      category: 'Performance',
      tags: ['appraisal', 'kpi', 'rating', 'evaluation', 'goals'],
    },
    {
      id: 'route_9',
      name: 'System Security Settings',
      description: 'Manage user roles, permissions, and multi-factor authentication',
      route: '/settings/security',
      category: 'Administration',
      tags: ['password', 'mfa', 'roles', 'permissions', 'admin'],
    },
    {
      id: 'route_10',
      name: 'Global HR Configurations',
      description: 'Modify company branches, operational shifts, and holiday calendars',
      route: '/settings/general',
      category: 'Administration',
      tags: ['shifts', 'branches', 'office', 'calendar', 'holidays'],
    },
  ];
}
