import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Get required roles from route metadata
  const requiredRoles = route.data?.['roles'] as string[];

  // 2. If no specific roles required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // 3. Check if user possesses required role
  if (authService.hasRole(requiredRoles)) {
    return true;
  }

  // 4. Access Denied: Redirect to unauthorized page or main dashboard
  console.warn(`Access denied to route: ${state.url}`);
  return router.createUrlTree(['/dashboard']);
};
