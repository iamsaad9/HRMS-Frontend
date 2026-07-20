import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';

import { inject } from '@angular/core';
import { AuthService } from '../../features/(public)/auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = authService.getAccessToken();

  // 1. Attach token to every request
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return throwError(
    () =>
      new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
      }),
  ).pipe(
    catchError((error: HttpErrorResponse) => {
      // 2. If NOT 401 → just throw error
      console.log('❌ 401 caught');

      if (error.status !== 401) {
        return throwError(() => error);
      }

      // 3. Prevent multiple refresh calls at same time
      if (isRefreshing) {
        return throwError(() => error);
      }

      isRefreshing = true;

      // 4. Call refresh token API
      console.log('🔄 Trying refresh token');
      return authService.refreshToken().pipe(
        switchMap((res) => {
          console.log('✅ Retrying original request');
          isRefreshing = false;

          // update request with new token
          const newReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${res.accessToken}`,
            },
          });

          // retry original request
          return next(newReq);
        }),
        catchError((err) => {
          isRefreshing = false;
          console.log('❌ Refresh Failed');
          // refresh failed → logout user
          authService.logout();
          return throwError(() => err);
        }),
      );
    }),
  );
};
