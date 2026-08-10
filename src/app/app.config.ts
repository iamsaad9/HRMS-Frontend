import { provideTaiga } from '@taiga-ui/core';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AttendanceService } from './features/(private)/attendance/service/attendanceService';
import { AuthService } from './features/(public)/auth/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
    provideRouter(routes),
    provideTaiga(),
   
  ],
};
