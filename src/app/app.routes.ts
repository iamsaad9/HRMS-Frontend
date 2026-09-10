// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './features/(public)/auth/login/login';
import MainLayout from './features/(private)/main-layout';
import { Dashboard } from './features/(private)/dashboard/pages/dashboard';
import { AddEmployee } from './features/(private)/employees/pages/add-employee/add-employee';
import { EmployeeView} from './features/(private)/employees/pages/view-employee/view-employee';
import { BulkUploadEmployee } from './features/(private)/employees/pages/bulk-upload/bulk-upload';
import { OrgChart } from './features/(private)/employees/pages/org-chart/org-chart';
import { EmployeeList } from './features/(private)/employees/pages/employee-list/employee-list';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { AttendanceHistory } from './features/(private)/attendance/pages/attendance-history/attendance-history';
import { DepartmentAttendanceLog } from './features/(private)/attendance/pages/department-attendance-log/department-attendance-log';
import { AttendanceAdjustment } from './features/(private)/attendance/pages/attendance-adjustment/attendance-adjustment';
import { AttendanceAdjustmentApprovals } from './features/(private)/attendance/pages/attendance-adjustment-approvals/attendance-adjustment-approvals';
import { ScheduleShift } from './features/(private)/attendance/pages/schedule-shifts/schedule-shifts';
import { HolidayCalendar } from './features/(private)/attendance/pages/holiday-calendar/holiday-calendar';
import { EmployeeShiftHistory } from './features/(private)/attendance/pages/employee-shift-history/employee-shift-history';
import { MyShiftHistory } from './features/(private)/attendance/pages/my-shift-history/my-shift-history';
import { LeaveAdjustment } from './features/(private)/attendance/pages/leave-adjustment/leave-adjustment';
import { LeaveAdjustmentDetail } from './features/(private)/attendance/pages/leave-adjustment-detail/leave-adjustment-detail';
import { TeamAttendanceLog } from './features/(private)/attendance/pages/team-attendance-log/team-attendance-log';
import { ReportsExtraction } from './features/(private)/reports/pages/report-extraction/report-extraction';
import { LeaveRequest } from './features/(private)/leave-management/pages/new-leave-request/new-leave-request';
import { LeaveRequestList } from './features/(private)/leave-management/pages/leave-requests-list/leave-requests-list';
import { NewRequest } from './features/(private)/requests/pages/new-requests/new-requests';
import { AllMyRequestsComponent } from './features/(private)/requests/pages/my-requests-page/my-requests';
import { ViewRequest } from './features/(private)/requests/pages/view-request-page/view-request';
import { RequestApprovals } from './features/(private)/requests/pages/request-approvals/request-approvals';
import { selfOrPermissionGuard } from './core/guards/self-or-permission.guard';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], component: Login },
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },

      // HRMS Tab (Admin Only)
     { path: 'employee/all', component: EmployeeList, canActivate: [permissionGuard], data: { permissions: ['users:read'] } },

//      {
//   path: 'employee',
//   canActivate: [permissionGuard],
//   data: { permissions: ['users:create'] }, // ⚠️ see note below
//   children: [
//     { path: '', component: AddEmployee },
//     { path: 'new', component: AddEmployee },
//     { path: ':id/edit', component: AddEmployee },
//     { path: ':id/view', component: EmployeeView },
//   ],
// },

{
  path: 'employee',
  children: [
    {
      path: '',
      component: AddEmployee,
      canActivate: [permissionGuard],
      data: { permissions: ['users:create'] },
    },
    {
      path: 'new',
      component: AddEmployee,
      canActivate: [permissionGuard],
      data: { permissions: ['users:create'] },
    },
    {
      path: ':id/edit',
      component: AddEmployee,
      canActivate: [permissionGuard],
      data: { permissions: ['users:create'] }, // editing someone else stays admin-only
    },
    {
      path: ':id/view',
      component: EmployeeView,
      canActivate: [selfOrPermissionGuard],
      data: { permissions: ['users:read', 'users:create'] }, // whichever grants "view others"
    },
  ],
},

{ path: 'employee/new/bulk-upload', component: BulkUploadEmployee, canActivate: [permissionGuard], data: { permissions: ['users:create'] } }, // ⚠️
{ path: 'employee/org-chart', component: OrgChart, canActivate: [permissionGuard], data: { permissions: ['orgchart:read'] } },


   // Attendance
{ path: 'attendance/history', component: AttendanceHistory, canActivate: [permissionGuard], data: { permissions: ['attendance:view'] } },
{ path: 'attendance/daily-logs', component: DepartmentAttendanceLog, canActivate: [permissionGuard], data: { permissions: ['attendance:logs'] } },
{ path: 'attendance/team-logs', component: TeamAttendanceLog, canActivate: [permissionGuard], data: { permissions: ['attendance:view'] } },


      // Requests Tab (Both Admin & User)
    
    { path: 'requests/new', component: NewRequest, canActivate: [permissionGuard], data: { permissions: ['requests:apply'] } },
{ path: 'requests/my', component: AllMyRequestsComponent, canActivate: [permissionGuard], data: { permissions: ['requests:apply'] } },
// Static segments (approvals) must come before the ':id' wildcard below, or the router matches
// '/requests/approvals' as ViewRequest with id="approvals" and this route is never reached.
{ path: 'requests/approvals', component: RequestApprovals, canActivate: [permissionGuard], data: { permissions: ['requests:approve', 'requests:apply'] } },
{ path: 'requests/:id', component: ViewRequest, canActivate: [permissionGuard], data: { permissions: ['requests:read'] } },

  // {
      //   path: 'leave-requests',
      //   canActivate: [roleGuard],
      //   data: { roles: ['Admin', 'User'] },
      //   children: [
      //     { path: '', component: LeaveRequest },
      //     { path: 'new', component: LeaveRequest },
      //     { path: ':id/edit', component: LeaveRequest },
      //   ],
      // },
      // {
      //   path: 'leave-requests/my',
      //   component: LeaveRequestList,
      //   canActivate: [roleGuard],
      //   data: { roles: ['Admin', 'User'] },
      // },
      // {
      //   path: 'attendance/adjustment/:id',
      //   component: AttendanceAdjustment,
      //   canActivate: [roleGuard],
      //   data: { roles: ['Admin', 'User'] },
      // },
      // {
      //   path: 'attendance/adjustments-approval/all',
      //   component: AttendanceAdjustmentApprovals,
      //   canActivate: [roleGuard],
      //   data: { roles: ['Admin', 'User'] },
      // },
      {
        path: 'schedule/roster-config',
        component: ScheduleShift,
       canActivate: [permissionGuard], data: { permissions: ['calendar:manage'] } ,
      },
      {
        path: 'schedule/holiday-calendar',
        component: HolidayCalendar,
        canActivate: [permissionGuard], data: { permissions: ['calendar:manage'] },
      },
      {
        path: 'schedule/leave-adjustment',
        component: LeaveAdjustment,
        canActivate: [permissionGuard], data: { permissions: ['calendar:manage'] },
      },
      {
        path: 'schedule/leave-adjustment/:employeeId',
        component: LeaveAdjustmentDetail,
        canActivate: [permissionGuard], data: { permissions: ['calendar:manage'] },
      },
      {
        path: 'attendance/shift-history',
        component: EmployeeShiftHistory,
        canActivate: [permissionGuard], data: { permissions: ['attendance:view'] },
      },
      {
        path: 'attendance/my-shift-history',
        component: MyShiftHistory,
        canActivate: [permissionGuard], data: { permissions: ['attendance:view'] },
      },
      //  {
      //   path: 'reports/compliance',
      //   component: ReportsExtraction,
      //   canActivate: [roleGuard],
      //   data: { roles: ['Admin', 'User'] },
      // },

    ],
  },
  { path: '**', redirectTo: 'login' },
];