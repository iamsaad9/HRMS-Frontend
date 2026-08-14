import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { AttendanceChannelType, PunchCommand, PunchType } from '../../../attendance/model/attendance.model';
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
  readonly employeeId = this.currentUser?.employeeInfo?.employeeId;
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



breakSessions = computed(() => {
  const punches = this.attendanceService.todayStatus()?.punches ?? [];
  const breakPunches = punches
    .filter(p => p.punchType === '3' || p.punchType === '4')
    .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

  const sessions: { start: string; end: string | null }[] = [];
  for (const p of breakPunches) {
    if (p.punchType === 'BreakStart') {
      sessions.push({ start: p.punchTime, end: null });
    } else if (p.punchType === 'BreakEnd') {
      const open = sessions.find(s => s.end === null);
      if (open) open.end = p.punchTime;
    }
  }
  return sessions;
});

// True if there's a BreakStart with no matching BreakEnd yet
isOnBreak = computed(() => this.breakSessions().some(s => s.end === null));

// Can't clock out while any break is still open
canClockOut = computed(() => this.attendanceService.isClockedIn() 
  && !this.attendanceService.isClockedOut() 
  && !this.isOnBreak());

  protected onClockIn(): void {


    if (!this.employeeId) {
      this.toast.error('Employee ID not found', 'Attendance Updated');
      return;
    }

    const command: PunchCommand = {
      employeeId:this.employeeId,
      punchType:PunchType.ClockIn,
      channel: AttendanceChannelType.Web,
      deviceId: null,
      latitude: null,
      longitude: null,
    };

    this.attendanceService.punch(command).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Clocked in successfully!', 'Attendance Updated');
        } else {
          this.toast.error('Clock in failed!', 'Attendance Updated');
        }
      },
      error: () => {
        this.toast.error('Clock in failed!', 'Attendance Updated');
      },

      
    });
  }

    protected onBreakStart(): void {
    if (!this.employeeId) {
      this.toast.error('Employee ID not found', 'Failed');
      return;
    }

    const command: PunchCommand = {
      employeeId: this.employeeId,
      punchType:PunchType.BreakStart,
      channel: AttendanceChannelType.Web,
      deviceId: null,
      latitude: null,
      longitude: null,
    };

    this.attendanceService.punch(command).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Break Started!', 'Attendance Updated');
        } else {
          this.toast.error('Break start failed!', 'Attendance Updated');
        }
      },
      error: () => {
        this.toast.error('Break start failed!', 'Attendance Updated');
      },
      
    });
  }

   protected onBreakEnd(): void {
    if (!this.employeeId) {
      this.toast.error('Employee ID not found', 'Failed');
      return;
    }

    const command: PunchCommand = {
      employeeId: this.employeeId,
      punchType:PunchType.BreakEnd,
      channel: AttendanceChannelType.Web,
      deviceId: null,
      latitude: null,
      longitude: null,
    };

    this.attendanceService.punch(command).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Break Ended!', 'Attendance Updated');
        } else {
          this.toast.error('Break end failed!', 'Attendance Updated');
        }
      },
      error: () => {
        this.toast.error('Break end failed!', 'Attendance Updated');
      },
      
    });
  }

  protected onClockOut(): void {

    const employeeId = this.currentUser?.employeeInfo?.employeeId;

    if (!employeeId) {
      this.toast.error('Employee ID not found', 'Attendance Updated');
      return;
    }

    const command: PunchCommand = {
      employeeId,
      punchType:PunchType.ClockOut,
      channel: AttendanceChannelType.Web,
      deviceId: null,
      latitude: null,
      longitude: null,
    };

    this.attendanceService.punch(command).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Clocked out successfully!', 'Attendance Updated');
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
