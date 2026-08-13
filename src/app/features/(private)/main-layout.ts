import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ButtonDirective } from 'primeng/button';
import { TuiTextfieldComponent, TuiRoot } from '@taiga-ui/core';
import { Loader } from '../../shared/components/loader/loader';
import { AuthService } from '../(public)/auth/services/auth.service';
import { AttendanceService } from './attendance/service/attendance.service';
import { firstValueFrom, forkJoin } from 'rxjs';

const toLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

@Component({
  imports: [RouterOutlet, NavbarComponent, Loader],
  selector: 'main-layout-root',
  standalone: true,
  templateUrl: './main-layout.html',
})
export default class MainLayout implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly attendanceService = inject(AttendanceService);

  ngOnInit(): void {
    firstValueFrom(this.authService.checkSession()).then(() => {
      const currentUser = this.authService.currentUser();
      const currentUserId = currentUser?.employeeInfo?.employeeId;

      if (currentUserId) {
        console.log('Current User ID in main layout:', currentUserId);

        this.attendanceService.getInitialWeek().subscribe({
          next: (history ) => {
            console.log('Week History Loaded:', history);
          },
          error: (err) => {
            console.error('Error loading initial attendance data:', err);
          },
        });
      }
    });
  }
}