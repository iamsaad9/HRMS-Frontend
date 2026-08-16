// app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './features/(public)/auth/login/login';
import MainLayout from './features/(private)/main-layout';
import { Dashboard } from './features/(private)/dashboard/pages/dashboard';
import { AddEmployee } from './features/(private)/employees/pages/add-employee/add-employee';
import { BulkUploadEmployee } from './features/(private)/employees/pages/bulk-upload/bulk-upload';
import { EmployeeList } from './features/(private)/employees/pages/employee-list/employee-list';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AttendanceHistory } from './features/(private)/attendance/pages/attendance-history/attendance-history';
import { AttendanceAdjustment } from './features/(private)/attendance/pages/attendance-adjustment/attendance-adjustment';
import { AttendanceAdjustmentApprovals } from './features/(private)/attendance/pages/attendance-adjustment-approvals/attendance-adjustment-approvals';
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
      { path: 'dashboard', component: Dashboard },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'employee/new',
        component: AddEmployee,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'employee/new/bulk-upload',
        component: BulkUploadEmployee,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
      },
      {
        path: 'employee/all',
        component: EmployeeList,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'HR'] }, // Supports multiple allowed roles
      },
      {
        path: 'attendance/history',
        component: AttendanceHistory,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] }, // Supports multiple allowed roles
      },
      {
        path: 'attendance/adjustment/:id',
        component: AttendanceAdjustment,
        canActivate: [roleGuard],
        data: { roles: ['Admin','User'] }, // Supports multiple allowed roles
      },
      {
        path: 'attendance/adjustments-approval/all',
        component: AttendanceAdjustmentApprovals,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] }, // Supports multiple allowed roles
      },
      {
        path: 'leave-requests/new',
        component: LeaveRequest,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] }, // Supports multiple allowed roles
      },
       {
        path: 'leave-requests/my',
        component: LeaveRequestList,
        canActivate: [roleGuard],
        data: { roles: ['Admin', 'User'] }, // Supports multiple allowed roles
      },
       {
        path: 'leave-requests/all',
        component: LeaveRequestApprovals,
        canActivate: [roleGuard],
        data: { roles: ['Admin'] }, // Supports multiple allowed roles
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
