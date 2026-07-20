import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private baseUrl = 'https://localhost:5001/api/auth';

  login(data: any) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data);
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
