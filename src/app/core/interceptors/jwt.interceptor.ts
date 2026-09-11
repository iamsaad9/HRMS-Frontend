import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

// Module-level state — shared across all requests handled by this interceptor instance,
// so concurrent 401s only trigger a single refresh call.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const attach = (r: typeof req, t: string | null) => {
    let headers = r.headers;
    if (t && r.url.startsWith('/api')) {
      headers = headers.set('Authorization', `Bearer ${t}`);
    }
    return r.clone({ headers, withCredentials: true });
  };

  const clonedRequest = attach(req, token);

  return next(clonedRequest).pipe(
    catchError((error: unknown) => {
      console.log('JWT Interceptor caught error:', error);
      const isAuthEndpoint = req.url.includes('/refresh-token') || req.url.includes('/login');

      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        req.url.startsWith('/api') &&
        !isAuthEndpoint
      ) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshedToken$.next(null);

          return authService.refreshToken().pipe(
            switchMap((response) => {
              isRefreshing = false;

              if (response.isSuccess && response.data) {
                const newToken = response.data.accessToken;
                refreshedToken$.next(newToken);
                return next(attach(req, newToken));
              }

              refreshedToken$.next(null);
              return throwError(() => error);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              refreshedToken$.next(null);
              return throwError(() => refreshErr);
            }),
          );
        }

        // A refresh is already in flight — wait for it, then retry with the new token.
        return refreshedToken$.pipe(
          filter((t) => t !== null),
          take(1),
          switchMap((newToken) => next(attach(req, newToken))),
        );
      }

      return throwError(() => error);
    }),
  );
};