// self-or-permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

export const selfOrPermissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const targetId = route.paramMap.get('id');
  const currentUserId = authService.currentUser()?.employeeInfo.id;

  // Case 1: viewing your own record — always allowed
  if (targetId && currentUserId && targetId === currentUserId) {
    return true;
  }

  // Case 2: viewing someone else's record — needs explicit permission
  const requiredPermissions = route.data?.['permissions'] as string[];
  if (authService.hasPermission(requiredPermissions)) {
    return true;
  }

  console.warn(`Access denied to route: ${state.url}`);
  return router.createUrlTree(['/dashboard']);
};