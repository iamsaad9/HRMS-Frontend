import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. If we ALREADY have an access token in memory (e.g. fresh login), allow entry immediately
  if (authService.isAuthenticated()) {
    return true;
  }

  // 2. Only if token is missing (e.g. hard page refresh F5), check the session via refresh token
  return authService.checkSession().pipe(
    take(1),
    map((isSessionValid) => {
      if (isSessionValid && authService.isAuthenticated()) {
        return true;
      }
      return router.createUrlTree(['/Auth/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};
