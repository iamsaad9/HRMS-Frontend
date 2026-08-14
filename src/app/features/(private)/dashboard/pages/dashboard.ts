import { Component, inject } from '@angular/core';
import { QuickCards } from '../components/quick-cards/quick-cards';
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { PerformanceSection } from '../components/performance-section/performance-section';
import { UserCardsComponent } from '../components/user-cards/user-card';
import { DashboardClock } from '../../../../shared/components/dashboard-clock/dashboard-clock';
import { TuiButton } from '@taiga-ui/core';
import { AuthService } from '../../../(public)/auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    QuickCards,
    TuiButton,
    PerformanceSection,
    UserCardsComponent,
    DashboardClock,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  currentDate: Date = new Date();
  private readonly authService = inject(AuthService);
  currentUser = this.authService.currentUser();
}
