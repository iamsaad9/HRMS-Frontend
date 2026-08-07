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
    ],
  },

  { path: '**', redirectTo: 'login' },
];
