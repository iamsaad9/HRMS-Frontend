import { DropDownItem } from '../../shared/components/dropdown-selector/dropdown-selector';

export const DropdownItems: DropDownItem[] = [
  // HRMS Tab (Admin Only)
   {
    id: '0',
    icon: 'dashboard',
    title: 'Home',
    description: 'Overview of your account and activity',
    routeTo: '/dashboard',
    tags: ['/', 'dashboard', 'home'],
    category: 'Home',
    // permissions:'dashboard:view'
  },
  {
    id: '1',
    icon: 'people',
    title: 'HRMS',
    description: 'Manage employee directory, user creation, and organization chart',
    category: 'HRMS Tab',
    childItems: [
      {
        id: '1.1',
        icon: 'folder_shared',
        title: 'Employee Dashboard',
        description: 'Directory with department filtering',
        routeTo: '/employee/all',
        category: 'HRMS Tab',
      },
      {
        id: '1.2',
        icon: 'person_add',
        title: 'User Creation',
        description: 'Registration form and Bulk CSV upload',
        routeTo: '/employee/new',
        category: 'HRMS Tab',
      },
      {
        id: '1.3',
        icon: 'cloud_upload',
        title: 'Bulk Upload Employee',
        description: 'Bulk CSV upload for workers',
        routeTo: '/employee/new/bulk-upload',
        category: 'HRMS Tab',
      },
      {
        id: '1.4',
        icon: 'account_tree',
        title: 'Org Chart',
        description: 'Visual company hierarchy tree',
        routeTo: '/employee/org-chart',
        category: 'HRMS Tab',
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
      },
    ],
  },

  // Attendance Tab (Admin Only)
  {
    id: '3',
    icon: 'access_time',
    title: 'Attendance',
    description: 'Department-wise live logs',
    category: 'Attendance Tab',
    childItems: [
      {
        id: '3.1',
        icon: 'list_alt',
        title: 'Daily Logs',
        description: 'Department-wise live logs',
        routeTo: '/attendance/daily-logs',
        category: 'Attendance Tab',
      },
      {
        id: '3.2',
        icon: 'history',
        title: 'Attendance History',
        description: 'View all attendance history',
        routeTo: '/attendance/history',
        category: 'Attendance Tab',
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
        id: '4.1',
        icon: 'add_circle',
        title: 'Apply for Leave / WFH',
        description: 'Apply for Leave, WFH, and Missing Time entries',
        routeTo: '/leave-requests/new',
        category: 'Requests Tab',
      },
      {
        id: '4.2',
        icon: 'person',
        title: 'Your Leave Requests',
        description: 'View status of your submitted requests',
        routeTo: '/leave-requests/my',
        category: 'Requests Tab',
      },
      {
        id: '4.3',
        icon: 'done_all',
        title: 'Approvals Dashboard',
        description: 'One-click approval dashboard for requests & Overtime',
        routeTo: '/leave-requests/all',
        category: 'Requests Tab',
      },
      {
        id: '4.4',
        icon: 'edit_calendar',
        title: 'Attendance Adjustments',
        description: 'Manage attendance adjustment requests',
        routeTo: '/attendance/adjustments-approval/all',
        category: 'Requests Tab',
      },
    ],
  },

  // Reports Tab (Admin Only)
  {
    id: '5',
    icon: 'assessment',
    title: 'Reports',
    description: 'Data generation and report formatting',
    category: 'Reports Tab',
    childItems: [
      {
        id: '5.1',
        icon: 'download',
        title: 'Compliance Extraction',
        description: 'Data generation and report formatting',
        routeTo: '/reports/compliance',
        category: 'Reports Tab',
      },
    ],
  },

];