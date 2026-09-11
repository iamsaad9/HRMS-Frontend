// manager-or-privileged.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

/**
 * Gates pages meant for "Admin, HR, or a manager looking at their own team" -
 * plain permission claims (attendance:view, requests:apply, ...) can't express this because
 * "Manager" isn't a real Identity role here, it's structural (does this employee have direct
 * reports). Every plain User already holds those base permissions, so permissionGuard alone lets
 * everyone through; this guard adds the actual Admin/HR/manager check on top.
 */
export const managerOrPrivilegedGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowed = authService.hasRole(['Admin', 'HR']) || !!authService.currentUser()?.isManager;

  if (allowed) {
    return true;
  }

  console.warn(`Access denied to route: ${state.url} (requires Admin, HR, or manager)`);
  return router.createUrlTree(['/dashboard']);
};
