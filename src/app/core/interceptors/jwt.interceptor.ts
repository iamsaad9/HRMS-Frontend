import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/(public)/auth/services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  let headers = req.headers;

  if (token && req.url.startsWith('/api')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const clonedRequest = req.clone({
    headers,
    withCredentials: true,
  });

  return next(clonedRequest);
};
