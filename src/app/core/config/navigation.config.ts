import { DropDownItem } from '../../shared/components/dropdown-selector/dropdown-selector';

export const DropdownItems: DropDownItem[] = [
  // HRMS Tab (Admin Only)
   {
    id: '0',
    icon: 'dashboard',
    title: 'Home',
    description: 'Overview of your account and activity',
    routeTo: '/dashboard',
    category: 'Home',
  },
  {
    id: '1',
    icon: 'people',
    title: 'HRMS',
    description: 'Manage employee directory, user creation, and organization chart',
    category: 'HRMS Tab',
    permission: 'users:read', // Requires users:read to view HRMS section
    childItems: [
      {
        id: '1.1',
        icon: 'folder_shared',
        title: 'Employee Dashboard',
        description: 'Directory with department filtering',
        routeTo: '/employee/all',
        category: 'HRMS Tab',
        permission: 'users:read',
      },
      {
        id: '1.2',
        icon: 'person_add',
        title: 'User Creation',
        description: 'Registration form and Bulk CSV upload',
        routeTo: '/employee/new',
        category: 'HRMS Tab',
        permission: 'users:create', // Specifically requires user creation right
      },
      {
        id: '1.3',
        icon: 'cloud_upload',
        title: 'Bulk Upload Employee',
        description: 'Bulk CSV upload for workers',
        routeTo: '/employee/new/bulk-upload',
        category: 'HRMS Tab',
        permission: 'users:create',
      },
      {
        id: '1.4',
        icon: 'account_tree',
        title: 'Org Chart',
        description: 'Visual company hierarchy tree',
        routeTo: '/employee/org-chart',
        category: 'HRMS Tab',
        permission: 'orgchart:read',
      },
    ],
  },

  // Schedule / Shift Tab (Admin Only)
  {
    id: '2',
    icon: 'schedule',
    title: 'Schedule / Shift',
    description: 'Setup panels for shifts and custom calendars',
    category: 'Schedule / Shift Tab',
    childItems: [
      {
        id: '2.1',
        icon: 'calendar_month',
        title: 'Roster Config',
        description: 'Setup shifts and custom calendars',
        routeTo: '/schedule/roster-config',
        category: 'Schedule / Shift Tab',
         requireManager: true,
      },
      {
        id: '2.2',
        icon: 'event',
        title: 'Holiday Calendar',
        description: 'Manage holiday calendar entries by employee category',
        routeTo: '/schedule/holiday-calendar',
        category: 'Schedule / Shift Tab',
        permission: 'calendar:manage',
      },
      {
        id: '2.3',
        icon: 'work_history',
        title: 'Employee Shift History',
        description: "Look up a team member's assigned shift history",
        routeTo: '/attendance/shift-history',
        category: 'Schedule / Shift Tab',
        requireManager: true,
      },
      {
        id: '2.4',
        icon: 'history_toggle_off',
        title: 'My Shift History',
        description: 'View your own assigned shift history',
        routeTo: '/attendance/my-shift-history',
        category: 'Schedule / Shift Tab',
        permission: 'attendance:view',
      },
      {
        id: '2.5',
        icon: 'balance',
        title: 'Leave Adjustment',
        description: 'Adjust employee leave balances',
        routeTo: '/schedule/leave-adjustment',
        category: 'Schedule / Shift Tab',
        permission: 'calendar:manage',
      },
      {
        id: '2.6',
        icon: 'assignment_add',
        title: 'Assign Leave',
        description: 'Assign leave allocations to Academic employees, single or bulk via CSV',
        routeTo: '/schedule/assign-leave',
        category: 'Schedule / Shift Tab',
        permission: 'calendar:manage',
      },
    ],
  },

  // Attendance Tab (Admin Only)
 {
  id: '3', icon: 'check_circle', title: 'Attendance',
  description: 'Department-wise live logs',
  category: 'Attendance Tab',
  childItems: [
    {
      id: '3.1', icon: 'list_alt', title: 'Employee Attendance Logs',
      description: 'Department-wise attendance live logs',
      routeTo: '/attendance/daily-logs', category: 'Attendance Tab',
      permission: 'attendance:logs',
    },
    {
      id: '3.2', icon: 'history', title: 'My Attendance Logs',
      description: 'View your attendance history',
      routeTo: '/attendance/history', category: 'Attendance Tab',
      permission: 'attendance:view',
    },
    {
      id: '3.3', icon: 'groups', title: "My Team's Attendance Logs",
      description: 'Daily attendance for your direct reports',
      routeTo: '/attendance/team-logs', category: 'Attendance Tab',
      requireManager: true,
    },
  ],
},

  // Requests Tab (Both Admin & User)
  {
    id: '4',
    icon: 'assignment',
    title: 'Requests',
    description: 'User actions and approval dashboards',
    category: 'Requests Tab',
    childItems: [
        {
      id: '4.01', icon: 'add_circle', title: 'Apply for Leave/ WFH/ Adjustment',
      description: 'Apply for Leave, WFH, and Missing Time entries',
      routeTo: '/requests/new', category: 'Requests Tab',
      permission: 'requests:apply',
    },
        {
      id: '4.15', icon: 'person', title: 'My Requests',
      description: 'View status of your submitted requests',
      routeTo: '/requests/my', category: 'Requests Tab',
      permission: 'requests:apply',
    },
     
      {
      id: '4.3', icon: 'done_all', title: 'Request Approvals',
      description: 'Approval dashboard for team requests',
      routeTo: '/requests/approvals', category: 'Requests Tab',
      requireManager: true,
    },
    ],
  },

  // Reports Tab (Admin Only)
  // {
  //   id: '5',
  //   icon: 'assessment',
  //   title: 'Reports',
  //   description: 'Data generation and report formatting',
  //   category: 'Reports Tab',
  //   childItems: [
  //      {
  //     id: '5.1', icon: 'download', title: 'Compliance Extraction',
  //     description: 'Data generation and report formatting',
  //     routeTo: '/reports/compliance', category: 'Reports Tab',
  //     permission: 'reports:read',
  //   },
  //   ],
  // },

];

