import { Component } from '@angular/core';
import { KpiSummary } from '../components/kpi-summary/kpi-summary';
import { TuiHeader } from '@taiga-ui/layout';
import { DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { PerformanceSection } from '../components/performance-section/performance-section';
import { UserCardsComponent } from '../components/user-cards/user-card';

@Component({
  selector: 'app-dashboard',
  imports: [KpiSummary, TuiHeader, DatePipe, MatIcon, PerformanceSection, UserCardsComponent],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  currentDate: Date = new Date();
}
