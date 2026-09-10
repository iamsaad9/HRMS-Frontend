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
  {
    id: '5',
    icon: 'assessment',
    title: 'Reports',
    description: 'Data generation and report formatting',
    category: 'Reports Tab',
    childItems: [
       {
      id: '5.1', icon: 'download', title: 'Compliance Extraction',
      description: 'Data generation and report formatting',
      routeTo: '/reports/compliance', category: 'Reports Tab',
      permission: 'reports:read',
    },
    ],
  },

];














// Additional Context: These are recently edited files. Do not suggest code that has been deleted.
export const AdminDashboardData = [
  {
   "cards": {
      "totalActiveEmployees": 30,
      "totalPresentToday": 0,
      "onLeaveOrWfhToday": 0,
      "pendingApprovalsCount": 1
    },
    "employeeProfile": {
      "id": "4aaa62db-d5bf-44ca-bf32-ab639ae69ad4",
      "userId": "2f22c64e-8c45-4ed4-9ddc-40370c527de7",
      "category": 1,
      "staffNo": "EMP-0178",
      "title": "",
      "firstName": "Mir Taha",
      "lastName": "Ali",
      "fullName": "Mir Taha Ali",
      "dateOfBirth": null,
      "gender": null,
      "workEmail": "admin@user.com",
      "mobile": null,
      "niNumber": null,
      "startDate": null,
      "employmentType": null,
      "isActive": true,
      "createdAtUtc": "2026-08-21T17:54:25.826829Z",
      "departmentId": "602de3c9-5599-4914-9a2f-4ecbbfe0dd3e",
      "departmentName": "Relief",
      "branchId": "9985c683-a074-4701-9cbf-00c825bd99d5",
      "branchName": "As-Suffa HQ",
      "designationId": "ee6eb1ad-cf7d-4050-ae44-809bb320b322",
      "designationTitle": "CEO of Relief ",
      "managerId": null,
      "managerName": null,
      "managerEmail": null,
      "shiftCode": "N/A",
      "roles": [
        "Admin"
      ]
    },
    "shiftHistory": [
      {
        "shiftAssignmentId": "05749026-477c-4702-b19a-443611ab9ee6",
        "shiftId": "7c3c3299-feb8-495e-b51f-45c2b991bc71",
        "shiftCode": "GENERAL",
        "shiftName": "General Shift",
        "startTime": "09:00:00",
        "endTime": "17:00:00",
        "effectiveFrom": "2026-01-01",
        "effectiveTo": null,
        "isCurrent": true
      }
    ],
    "remainingLeaves": [
      {
        "leaveTypeId": "2a70d68f-103a-4a37-af48-50a1e01ef195",
        "leaveTypeName": "Annual Leave",
        "allocatedDays": 25,
        "adjustmentDays": 0,
        "totalEntitlement": 25,
        "usedDays": 0,
        "pendingDays": 0,
        "remainingDays": 25
      },
      {
        "leaveTypeId": "b44e25ae-5067-4a4b-9759-2467e9c29530",
        "leaveTypeName": "Sick Leave",
        "allocatedDays": 10,
        "adjustmentDays": 0,
        "totalEntitlement": 10,
        "usedDays": 0,
        "pendingDays": 0,
        "remainingDays": 10
      },
      {
        "leaveTypeId": "19b11c7f-def6-422d-86cf-f0281febefa8",
        "leaveTypeName": "Compassionate Leave",
        "allocatedDays": 5,
        "adjustmentDays": 0,
        "totalEntitlement": 5,
        "usedDays": 0,
        "pendingDays": 0,
        "remainingDays": 5
      },
      {
        "leaveTypeId": "d560134c-6732-4048-a1ca-1938efba3e62",
        "leaveTypeName": "Unpaid Leave (LWP)",
        "allocatedDays": 0,
        "adjustmentDays": 0,
        "totalEntitlement": 0,
        "usedDays": 0,
        "pendingDays": 0,
        "remainingDays": 0
      }
    ],
    "holidayCalendar": [],
    "pendingApprovalsTeamMembers": [
      {
        "approvalRequestId": "8d32c4d1-1192-4df2-bbaf-5f1ea18a3353",
        "entityId": "80411154-af4a-4c62-b28d-b70f7e8a3db7",
        "requestType": "Leave",
        "requesterName": "Ahmed Siddique Siddique",
        "departmentName": "Relief",
        "currentStepOrder": 1,
        "submittedDate": "2026-09-01T18:13:15.759686Z",
        "summary": "Leave · 4.0 day(s) (8/15/2026 - 8/20/2026)"
      }
    ]
  },
]