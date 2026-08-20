import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TuiButton, TuiIcon, TuiPoint } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
import { TuiAxes, TuiLineChart, TuiBarChart } from '@taiga-ui/addon-charts';
import { AttendanceService } from '../../../attendance/service/attendance.service';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { tuiCeil } from '@taiga-ui/cdk';
import { AttendanceBarChartComponent, AttendancePunch } from "../../../../../shared/components/attendance-bar-chart/attendance-bar-chart";
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AttendanceChannelType, PunchCommand, PunchType } from '../../../attendance/model/attendance.model';

export interface ClockHistoryItem {
  date: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: string;
}


function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}



@Component({
  selector: 'app-user-cards',
  templateUrl: './user-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiIcon, TuiButton,  TuiCardLarge, DatePipe,  MatIcon, AttendanceBarChartComponent],
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


  










}