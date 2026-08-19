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
import { roleGuard } from './core/guards/role.guard';
import { AttendanceHistory } from './features/(private)/attendance/pages/attendance-history/attendance-history';
import { DepartmentAttendanceLog } from './features/(private)/attendance/pages/department-attendance-log/department-attendance-log';
import { AttendanceAdjustment } from './features/(private)/attendance/pages/attendance-adjustment/attendance-adjustment';
import { AttendanceAdjustmentApprovals } from './features/(private)/attendance/pages/attendance-adjustment-approvals/attendance-adjustment-approvals';
import { ScheduleShift } from './features/(private)/attendance/pages/schedule-shifts/schedule-shifts';
import { ReportsExtraction } from './features/(private)/reports/pages/report-extraction/report-extraction';
import { LeaveRequest } from './features/(private)/leave-management/pages/new-leave-request/new-leave-request';
import { LeaveRequestList } from './features/(private)/leave-management/pages/leave-requests-list/leave-requests-list';
import { LeaveRequestApprovals } from './features/(private)/leave-management/pages/leave-request-approvals/leave-request-approvals';

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
      {
        path: 'employee/all',
        component: EmployeeList,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'employee',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
         children: [
          { path: '', component: AddEmployee },
          { path: 'new', component: AddEmployee },
          { path: ':id/edit', component: AddEmployee },
          { path: ':id/view', component: EmployeeView },
        ],
      },
      {
        path: 'employee/new/bulk-upload',
        component: BulkUploadEmployee,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'employee/org-chart',
        component: OrgChart,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },

      // Attendance Tab (Admin Only)
      {
        path: 'attendance/history',
        component: AttendanceHistory,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      }, 
      {
        path: 'attendance/daily-logs',
        component: DepartmentAttendanceLog,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },

      // Requests Tab (Both Admin & User)
      {
        path: 'leave-requests',
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] },
        children: [
          { path: '', component: LeaveRequest },
          { path: 'new', component: LeaveRequest },
          { path: ':id/edit', component: LeaveRequest },
        ],
      },
      {
        path: 'leave-requests/my',
        component: LeaveRequestList,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] },
      },
      {
        path: 'leave-requests/all',
        component: LeaveRequestApprovals,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] },
      },
      {
        path: 'attendance/adjustment/:id',
        component: AttendanceAdjustment,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] },
      },
      {
        path: 'attendance/adjustments-approval/all',
        component: AttendanceAdjustmentApprovals,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] },
      },
      {
        path: 'schedule/roster-config',
        component: ScheduleShift,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] },
      },
       {
        path: 'reports/compliance',
        component: ReportsExtraction,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] },
      },

      // Account Settings (Both Admin & User)
      // Web Clock-In Tab (Both Admin & User)
    ],
  },
  { path: '**', redirectTo: 'login' },
];