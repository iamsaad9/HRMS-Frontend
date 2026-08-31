import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TuiButton, TuiIcon, TuiPoint } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
import { AttendanceService } from '../../../attendance/service/attendance.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AttendanceBarChartComponent } from "../attendance-bar-chart/attendance-bar-chart";
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { LeaveCalendarCard } from "../leave-calendar/leave-calendar";
import { TuiRingChart, TuiLegendItem } from '@taiga-ui/addon-charts';
import { TuiHovered, tuiSum } from '@taiga-ui/cdk';
import { TuiAmountPipe } from '@taiga-ui/addon-commerce';

export interface ClockHistoryItem {
  date: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: string;
}

@Component({
  selector: 'app-user-cards',
  templateUrl: './user-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiButton,RouterLink, TuiHovered, TuiCardLarge,  MatIcon, LeaveCalendarCard, TuiRingChart, TuiLegendItem],
})
export class UserCardsComponent {
  protected readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  protected router = inject(Router);
  readonly currentUser = this.authService.currentUser();


 protected initials = computed(() => {
    if (!this.currentUser) return '';
    return `${this.currentUser.employeeInfo.firstName[0]?.[0] ?? ''}${this.currentUser.employeeInfo.lastName[0]?.[0] ?? ''}`.toUpperCase();
  });

  protected activeItemIndex = Number.NaN;
    protected readonly value = [9, 12, 10];
    protected readonly sum = tuiSum(...this.value);
    protected readonly labels = ['Annual', 'Casual', 'Sick'];
 
    protected isItemActive(index: number): boolean {
        return this.activeItemIndex === index;
    }
 
    protected onHover(index: number, hovered: boolean): void {
        this.activeItemIndex = hovered ? index : Number.NaN;
    }
}