import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { KpiCard } from '../../dashboard.model';
import { TuiPoint, TuiIcon, TuiAppearance } from '@taiga-ui/core';
import { TuiRingChart, TuiArcChart } from '@taiga-ui/addon-charts';
import { TuiAccordion, TuiAvatar, TuiProgressCircle } from '@taiga-ui/kit';
import { FormsModule } from '@angular/forms';
import { TuiCard, TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { tuiSum } from '@taiga-ui/cdk';
import { MatIcon } from '@angular/material/icon';
import { TuiAmountPipe } from '@taiga-ui/addon-commerce';
import { AttendanceService } from '../../../attendance/service/attendance.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { AttendanceChannel, ClockActionCommand } from '../../../attendance/model/attendance.model';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-quick-cards',
  standalone: true,
  imports: [
    TuiAmountPipe,
    CommonModule,
    TuiRingChart,
    TuiCardLarge,
    TuiProgressCircle,
    FormsModule,
    TuiHeader,
    TuiArcChart,
    MatIcon,
    TuiCard,
    TuiAccordion,
    TuiAvatar,
    TuiAppearance,
    DatePipe
  ],
  templateUrl: './quick-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickCards {
  protected readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly currentUser = this.authService.currentUser();
  readonly attendanceValues = signal<number[]>([57, 8, 4, 3]);
  readonly labels = ['Present', 'Absent', 'Leave', 'WFH'];
  readonly headcountProgress = signal<number>(0.925);
  protected activeItemIndex = Number.NaN;
  protected readonly sum = tuiSum(...this.attendanceValues());
  protected collapsed = signal(false);
  readonly payrollTrendData: readonly TuiPoint[] = [
    [0, 160],
    [1, 165],
    [2, 172],
    [3, 170],
    [4, 180],
    [5, 184.5],
  ];
  expanded = true;

  toggleExpand(): void {
    this.expanded = !this.expanded;
  }

  protected isItemActive(index: number): boolean {
    return this.activeItemIndex === index;
  }
  protected onHover(index: number, hovered: boolean): void {
    this.activeItemIndex = hovered ? index : Number.NaN;
  }
  protected index = Number.NaN;

  protected get label(): string {
    return (Number.isNaN(this.index) ? 'Total' : this.labels[this.index]) ?? '';
  }

  protected onClockIn(): void {

    const employeeId = this.currentUser?.employeeInfo?.employeeId;

    if (!employeeId) {
      this.toast.error('Employee ID not found', 'Attendance Updated');
      return;
    }

    const command: ClockActionCommand = {
      employeeId,
      channel: AttendanceChannel.Web,
      deviceId: null,
      latitude: null,
      longitude: null,
    };

    this.attendanceService.clockIn(command).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Clocked in successfully!', 'Attendance Updated');
          this.attendanceService.getInitialWeek().subscribe()
        } else {
          this.toast.error('Clock in failed!', 'Attendance Updated');
        }
      },
      error: () => {
        this.toast.error('Clock in failed!', 'Attendance Updated');
      },

      
    });
  }

  protected onClockOut(): void {

    const employeeId = this.currentUser?.employeeInfo?.employeeId;

    if (!employeeId) {
      this.toast.error('Employee ID not found', 'Attendance Updated');
      return;
    }

    const command: ClockActionCommand = {
      employeeId,
      channel: AttendanceChannel.Web,
      deviceId: null,
      latitude: null,
      longitude: null,
    };

    this.attendanceService.clockOut(command).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Clocked out successfully!', 'Attendance Updated');
          this.attendanceService.getInitialWeek().subscribe()
        } else {
          this.toast.error('Clock out failed!', 'Attendance Updated');
        }
      },
      error: () => {
        this.toast.error('Clock out failed!', 'Attendance Updated');
      },
      
    });
  }

  readonly user = {
    name: 'Saad Masood',
    role: 'Junior Associate Developer',
    department: 'Development',
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
    todayStatus: {
      isClockedIn: true,
      startTime: '09:00 AM',
      endTime: null, // Set to string like '05:30 PM' when clocked out
    },
  };

  readonly kpiCards = signal<KpiCard[]>([
    {
      id: 'total-employees',
      title: 'Total Headcount',
      value: 148,
      changeLabel: '+6 this month',
      trend: 'up',
      subtext: 'vs. 142 last month',
      icon: 'users',
    },
    {
      id: 'attendance-rate',
      title: "Today's Attendance",
      value: '92.5%',
      changeLabel: '137 Present',
      trend: 'up',
      subtext: '8 Leave • 3 Absent',
      icon: 'calendar-check',
    },
    {
      id: 'payroll-cost',
      title: 'Monthly Payroll Cost',
      value: '$184,500',
      changeLabel: '+2.4%',
      trend: 'down',
      subtext: 'Next payout: Aug 30',
      icon: 'dollar-sign',
    },
    {
      id: 'pending-requests',
      title: 'Pending Approvals',
      value: 7,
      changeLabel: 'Requires Action',
      trend: 'neutral',
      subtext: '4 Leaves • 3 Expenses',
      icon: 'clock',
    },
  ]);
}
