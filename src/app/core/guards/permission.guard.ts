// permission.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermissions = route.data?.['permissions'] as string[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (authService.hasPermission(requiredPermissions)) {
    return true;
  }

  console.warn(`Access denied to route: ${state.url}`);
  return router.createUrlTree(['/dashboard']);
};