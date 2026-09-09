import { Component, inject, OnInit } from '@angular/core';
import { QuickCards } from '../components/quick-cards/quick-cards';
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { PerformanceSection } from '../components/performance-section/performance-section';
import { UserCardsComponent } from '../components/user-cards/user-card';
import { DashboardClock } from '../../../../shared/components/dashboard-clock/dashboard-clock';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { AuthService } from '../../../(public)/auth/services/auth.service';
import { OperationsSection } from "../components/operations-section/operations-section";
import { DashboardService } from '../service/dashboard.service';
import { AttendanceService } from '../../attendance/service/attendance.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [
    QuickCards,
    TuiButton,
    PerformanceSection,
    UserCardsComponent,
    DashboardClock,
    TuiIcon,
    OperationsSection
],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  currentDate: Date = new Date();
  private readonly authService = inject(AuthService);
    private readonly attendanceService = inject(AttendanceService);

  protected readonly dashboardService = inject(DashboardService);
  currentUser = this.authService.currentUser();

 ngOnInit(): void {
  this.dashboardService.load().subscribe();

  // Read the current user directly from the signal/state without re-checking the session
  const currentUser = this.authService.currentUser();
  const currentUserId = currentUser?.employeeInfo?.id;

  if (currentUserId) {
    this.attendanceService.getCurrentMonth().subscribe({
      next: (history) => console.log('Week History Loaded:', history),
      error: (err) => console.error('Error loading initial attendance data:', err),
    });
  }
}

  protected refresh(): void {
    this.dashboardService.load().subscribe();
  }
}
