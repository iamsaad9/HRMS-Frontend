import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import {
  LoginCommand,
  LoginResponse,
  RegisterCommand,
  RegisterResponse,
} from '../model/auth.model';
import { ApiResponse } from '../../../../core/models/api-response.model';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7085/api/Auth';

  login(command: LoginCommand): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/Login`, command);
  }

  register(command: RegisterCommand): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.apiUrl}/Register`, command);
  }

  refreshToken() {
    console.log('🔥 REFRESH TOKEN API CALLED');

    return of({
      accessToken: 'new_fake_access_token',
      refreshToken: 'new_fake_refresh_token',
    }).pipe(
      delay(1500),
      tap((tokens) => {
        this.setTokens(tokens);
        console.log('✅ NEW TOKENS SAVED');
      }),
    );
  }

  setTokens(tokens: AuthResponse) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  logout() {
    localStorage.clear();
  }
}
