import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  LoginCommand,
  LoginResponse,
  RegisterCommand,
  RegisterResponse,
  User,
} from '../model/auth.model';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Auth';
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly STORAGE_KEY = 'fallback_user';
  private readonly router = inject(Router);

  #accessToken = signal<string | null>(null);
  #currentUser = signal<User | null>(null);
  currentUser = this.#currentUser.asReadonly();

  isAuthenticated = computed(() => this.#currentUser() !== null);

  #isInitialized = signal<boolean>(false);
  isInitialized = this.#isInitialized.asReadonly();

  constructor() {
    effect(() => {
      const user = this.#currentUser();
      if (!this.isBrowser) return;

      if (user) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    });
  }

  checkSession(): Observable<boolean> {
    return this.refreshToken().pipe(
      switchMap((refreshRes) => {
        if (!refreshRes || !refreshRes.isSuccess || !refreshRes.data) {
          this.clearAuth();
          return of(false);
        }

        const token = refreshRes.data.accessToken;

        return this.http
          .get<ApiResponse<User>>(`${this.apiUrl}/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .pipe(
            tap((meRes) => {
              if (meRes?.isSuccess && meRes?.data) {
                this.#currentUser.set(meRes.data);
                return true;
              }

              this.clearAuth();
              return false;
            }),
            map((meRes) => meRes.isSuccess),
            catchError(() => {
              this.clearAuth();
              return of(false);
            }),
            finalize(() => {
              this.#isInitialized.set(true);
            }),
          );
      }),
      catchError(() => {
        this.clearAuth();
        return of(false);
      }),
      finalize(() => {
        this.#isInitialized.set(true);
      }),
    );
  }

  refreshToken(): Observable<ApiResponse<LoginResponse | null>> {
    return this.http
      .post<
        ApiResponse<LoginResponse | null>
      >(`${this.apiUrl}/refresh-token`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log('✅ Refresh Token found! Session refreshed.');
            this.#accessToken.set(response.data.accessToken);
            this.#currentUser.set(response.data.user);
          }
        }),
        catchError((err) => {
          // Do NOT call clearAuth() here — handle unauthenticated state in caller/interceptor
          return of({ isSuccess: false, message: 'Unauthorized', data: null });
        }),
      );
  }

  login(command: LoginCommand): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/Login`, command).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          this.#accessToken.set(response.data.accessToken);
          this.#currentUser.set(response.data.user);
          this.#isInitialized.set(true);
        }
      }),
      catchError((err) => {
        this.clearAuth();
        return throwError(() => err);
      }),
    );
  }

  register(command: RegisterCommand): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.apiUrl}/Register`, command);
  }

  logout(): Observable<void> {
    console.log('Logging Out...');
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.clearAuth();
      }),
    );
  }

  getAccessToken(): string | null {
    return this.#accessToken();
  }

  clearAuth(): void {
    this.#accessToken.set(null);
    this.#currentUser.set(null);
    this.#isInitialized.set(true); // 👈 Critical: Mark as initialized so guestGuard stops checking!

    if (this.router.url !== '/login') {
      this.router.navigate(['/login']);
    }
  }

  hasRole(allowedRoles: string[]): boolean {
    const user = this.#currentUser();
    if (!user || !user.roles) return false;

    const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
    return allowedRoles.some((role) => userRoles.includes(role));
  }
}
