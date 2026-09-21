import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  changePasswordCommand,
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


  private normalize(p: string): string {
  return p.trim();
}

  private userPermissions(): string[] {
    const user = this.#currentUser() as (User & {
      permissions?: string[];
      employeeInfo?: { permissions?: string[] };
    }) | null;

    return user?.permissions ?? user?.employeeInfo?.permissions ?? [];
  }

  hasPermission(required: string | string[]): boolean {
    const userPerms = this.userPermissions().map(p => this.normalize(p));

    // Super-admin wildcard
    if (userPerms.includes('*')) return true;

    const requiredList = Array.isArray(required) ? required : [required];
    return requiredList.some(p => userPerms.includes(this.normalize(p)));
  }

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
    tap((refreshRes) => console.log('[checkSession] Refresh token response:', refreshRes)),
    switchMap((refreshRes) => {
      if (!refreshRes || !refreshRes.isSuccess || !refreshRes.data) {
        console.warn('[checkSession] Refresh failed or missing data. Clearing auth.');
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
            console.log('[checkSession] /me response:', meRes);
            if (meRes?.isSuccess && meRes?.data) {
              console.log('[checkSession] Session valid. Setting current user:', meRes.data);
              this.#currentUser.set(meRes.data);
            } else {
              console.warn('[checkSession] /me request unsuccessful. Clearing auth.');
              this.clearAuth();
            }
          }),
          map((meRes) => meRes.isSuccess),
          catchError((err) => {
            this.clearAuth();
            return of(false);
          }),
          finalize(() => {
            this.#isInitialized.set(true);
          })
        );
    }),
    catchError((err) => {
      this.clearAuth();
      return of(false);
    }),
    finalize(() => {
      this.#isInitialized.set(true);
    })
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

  /**
   * Routine self-service change - verifies currentPassword server-side before applying
   * newPassword. The new password only affects future logins (the JWT itself doesn't encode the
   * password) - no need to sign the user out of their current session for it to take effect.
   */
  changePassword(command:changePasswordCommand):Observable<ApiResponse<any>>{
    return this.http.post<any>(`${this.apiUrl}/change-password`,command).pipe(
      catchError((err)=>{
        return throwError(()=>err);
      })
    )
  }

  /**
   * Forced first-login reset - no currentPassword needed/known by the caller, since the only
   * thing being proven is that the user holds a valid session (they just logged in with the
   * default password). Stays signed in on success, same reasoning as changePassword() above -
   * MainLayout just needs isDefaultPassword to flip so it stops re-prompting.
   */
  changePasswordFirstLogin(command:changePasswordCommand): Observable<ApiResponse<any>> {
    return this.http.post<any>(`${this.apiUrl}/change-password-first-login`,  command ).pipe(
      tap((response) => {
        if (response.isSuccess) {
          const user = this.#currentUser();
          if (user) {
            this.#currentUser.set({ ...user, isDefaultPassword: false });
          }
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }

  /**
   * Emails a brand-new random password to the given address if (and only if) it belongs to an
   * active user with an active employee record - the response message is deliberately the same
   * either way, so it can't be used to check whether an email is registered.
   */
  forgotPassword(email: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError((err) => throwError(() => err)),
    );
  }

  /** Keeps the navbar / dashboard "My Profile" card in sync immediately after the signed-in user uploads their own picture, without waiting on a full /me refetch. */
  updateOwnProfilePicture(pictureUrl: string): void {
    const user = this.#currentUser();
    if (!user?.employeeInfo) return;
    this.#currentUser.set({
      ...user,
      employeeInfo: { ...user.employeeInfo, profilePictureUrl: pictureUrl },
    });
  }

  hasRole(allowedRoles: string[]): boolean {
    console.log("Checking roles for allowedRoles:", allowedRoles);
    const user = this.#currentUser();
    if (!user || !user.employeeInfo.roles) return false;
    console.log("User Roles:", user.employeeInfo.roles);

    const userRoles = Array.isArray(user.employeeInfo.roles) ? user.employeeInfo.roles : [user.employeeInfo.roles];
    console.log("Allowed Roles:", allowedRoles);
    return allowedRoles.some((role) => userRoles.includes(role));
  }
}
