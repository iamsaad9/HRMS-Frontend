import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { ButtonDirective } from 'primeng/button';
import { TuiTextfieldComponent, TuiRoot } from '@taiga-ui/core';
import { Loader } from '../../shared/components/loader/loader';
import { AuthService } from '../(public)/auth/services/auth.service';
import { AttendanceService } from './attendance/service/attendanceService';
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
    const today = new Date();
    const endDate = toLocalDateStr(today); // Today's date YYYY-MM-DD

    // 7 days total (today - 6 days through today)
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const startDate = toLocalDateStr(start);

    firstValueFrom(this.authService.checkSession()).then(() => {
      const currentUser = this.authService.currentUser();
      const currentUserId = currentUser?.employeeInfo?.employeeId;

      if (currentUserId) {
        console.log('Current User ID in main layout:', currentUserId);

        const getHistoryParams = {
          employeeId: currentUserId,
          startDate,
          endDate,
        };

        // Fire both HTTP requests simultaneously
        forkJoin({
          history: this.attendanceService.getInitialWeek(getHistoryParams),
          today: this.attendanceService.getDailyAttendance(currentUserId, endDate),
        }).subscribe({
          next: ({ history, today }) => {
            console.log('Week History Loaded:', history);
            console.log("Today's Data Loaded:", today);
          },
          error: (err) => {
            console.error('Error loading initial attendance data:', err);
          },
        });
      }
    });
  }
}