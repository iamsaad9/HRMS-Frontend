import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  LoginCommand,
  LoginResponse,
  RegisterCommand,
  RegisterResponse,
  User,
} from '../model/auth.model';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api/Auth';
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly STORAGE_KEY = 'fallback_user';

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
        if (!refreshRes.isSuccess || !refreshRes.data) {
          return of(false);
        }

        // Extract the new access token directly from the refresh response
        const token = refreshRes.data.accessToken;

        // 👈 Pass the Bearer token in the headers!
        return this.http
          .get<ApiResponse<User>>(`${this.apiUrl}/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .pipe(
            tap((meRes) => {
              if (meRes.isSuccess && meRes.data) {
                this.#currentUser.set(meRes.data);
              }
            }),
            map((meRes) => meRes.isSuccess),
            catchError(() => {
              this.clearAuth();
              return of(false);
            }),
          );
      }),
      catchError(() => {
        this.clearAuth();
        return of(false);
      }),
    );
  }

  login(command: LoginCommand): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/Login`, command).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          this.#accessToken.set(response.data.accessToken);
          this.#currentUser.set(response.data.user);
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
          } else {
            this.clearAuth();
          }
        }),
        catchError((err) => {
          this.clearAuth();
          return throwError(() => err);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/Logout`, {}, { withCredentials: true }).pipe(
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
  }
}
