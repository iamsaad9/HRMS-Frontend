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
  protected readonly dashboardService = inject(DashboardService);
  currentUser = this.authService.currentUser();

  ngOnInit(): void {
    this.dashboardService.load().subscribe();
  }

  protected refresh(): void {
    this.dashboardService.load().subscribe();
  }
}
