import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLineChart, TuiAxes } from '@taiga-ui/addon-charts';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiButton, TuiPoint, TuiIcon } from '@taiga-ui/core';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';
import { Router } from '@angular/router';
import { AttendanceService } from '../../../attendance/service/attendance.service';
import { AttendanceBarChartComponent, AttendancePunch } from "../attendance-bar-chart/attendance-bar-chart";
import { AttendanceChannelType, PunchCommand, PunchType } from '../../../attendance/model/attendance.model';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { DashboardService } from '../../service/dashboard.service';

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


export interface PerformanceMetric {
  title: string;
  score: number; // e.g., 94%
  points: readonly TuiPoint[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: 'online' | 'busy' | 'leave';
  attendanceRate: string;
}


@Component({
  selector: 'app-performance-section',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiCardLarge, MatIcon, TuiIcon, AttendanceBarChartComponent],
  templateUrl: './performance-section.html',
})
export class PerformanceSection {
  protected readonly attendanceService = inject(AttendanceService);
  protected readonly dashboardService = inject(DashboardService);
  protected router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser();
  private readonly toast = inject(ToastService);
  readonly employeeId = this.currentUser?.employeeInfo?.id;
  isPunchingIn = signal(false);
  today = new Date();

  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  formattedDate = signal(this.today.toLocaleDateString('en-US', this.options));

  isToday(dateStr: string): boolean {
    const d = new Date(dateStr);
    return (
      d.getFullYear() === this.today.getFullYear() &&
      d.getMonth() === this.today.getMonth() &&
      d.getDate() === this.today.getDate()
    );
  }

  protected isPendingRegularization(day: { record: { status?: string; adjustmentStatus?: string | null } | null }): boolean {
    return day.record?.status === 'NeedsRegularization' || day.record?.adjustmentStatus === 'Pending';
  }

  protected isWfhRow(day: { record: { status?: string; adjustmentStatus?: string | null } | null }): boolean {
    return day.record?.status === 'WorkFromHome' || day.record?.adjustmentStatus === 'Pending WFH';
  }

  protected requestTypeForRow(day: { record: { status?: string; adjustmentStatus?: string | null } | null }): string {
    return this.isWfhRow(day) ? 'wfh' : 'regularization';
  }

  fullWeekAttendance = computed(() => {
    const rawData = this.attendanceService.currentMonth() ?? [];

    const attendanceMap = new Map(rawData.map((item) => [item.date, item]));

    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    // Generate 7 days (Monday -> Sunday)
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = toIsoDate(dayDate);

      const record = attendanceMap.get(dateStr);

      return {
        dateStr,
        record: record ?? null,
      };
    });
  });

  readonly performanceTrend: readonly TuiPoint[] = [
    [0, 78],
    [1, 82],
    [2, 80],
    [3, 88],
    [4, 91],
    [5, 95],
    [6, 92],
    [7, 89],
    [8, 93],
    [9, 90],
    [10, 87],
    [11, 85],
    [12, 88],
    [13, 91],
    [14, 94],
    [15, 93],
    [16, 90],
    [17, 88],
    [18, 92],
    [19, 95],
    [20, 97],
    [21, 94],
    [22, 91],
    [23, 89],
    [24, 93],
    [25, 96],
    [26, 95],
    [27, 92],
    [28, 94],
    [29, 98],
  ];

  /** Real work-hour-overview data: this employee's actual clock in/out per day. */
  protected readonly barChartPunches = computed<AttendancePunch[]>(() =>
    (this.attendanceService.currentMonth() ?? []).map((d) => ({
      date: d.date,
      checkIn: this.toHm(d.firstIn),
      checkOut: this.toHm(d.lastOut),
    })),
  );

  /** The employee's current shift, used as the expected start/end reference on the bar chart. */
  protected readonly currentShift = computed(() => {
    const history = this.dashboardService.data()?.shiftHistory ?? [];
    return history.find((s) => s.isCurrent) ?? history[0] ?? null;
  });

  protected formatShiftTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }

  private toHm(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  // <-------------- PUNCHES LOGIC -------------->

  breakSessions = computed(() => {
    const punches = this.attendanceService.todayStatus()?.punches ?? [];
    const breakPunches = punches
      .filter((p) => p.punchType === 'BreakStart' || p.punchType === 'BreakEnd')
      .sort((a, b) => new Date(a.punchTime).getTime() - new Date(b.punchTime).getTime());

    const sessions: { start: string; end: string | null }[] = [];
    for (const p of breakPunches) {
      if (p.punchType === 'BreakStart') {
        sessions.push({ start: p.punchTime, end: null });
      } else if (p.punchType === 'BreakEnd') {
        const open = sessions.find((s) => s.end === null);
        if (open) open.end = p.punchTime;
      }
    }
    return sessions;
  });

  isOnBreak = computed(() => this.breakSessions().some((s) => s.end === null));

  canClockOut = computed(
    () =>
      this.attendanceService.isClockedIn() &&
      !this.attendanceService.isClockedOut() &&
      !this.isOnBreak(),
  );

  protected onClockIn(): void {
    if (!this.employeeId) {
      this.toast.error('Employee ID not found', 'Attendance Updated');
      return;
    }
    this.isPunchingIn.set(true);
    const command: PunchCommand = {
      employeeId: this.employeeId,
      punchType: PunchType.ClockIn,
      punchChannel: AttendanceChannelType.Web,
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
    this.isPunchingIn.set(false);
  }

  protected onBreakStart(): void {
    if (!this.employeeId) {
      this.toast.error('Employee ID not found', 'Failed');
      return;
    }

    const command: PunchCommand = {
      employeeId: this.employeeId,
      punchType: PunchType.BreakStart,
      punchChannel: AttendanceChannelType.Web,
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
      punchType: PunchType.BreakEnd,
      punchChannel: AttendanceChannelType.Web,
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
    const employeeId = this.currentUser?.employeeInfo?.id;

    if (!employeeId) {
      this.toast.error('Employee ID not found', 'Attendance Updated');
      return;
    }

    const command: PunchCommand = {
      employeeId,
      punchType: PunchType.ClockOut,
      punchChannel: AttendanceChannelType.Web,
      deviceId: null,
      latitude: null,
      longitude: null,
    };
    this.isPunchingIn.set(true);
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
    this.isPunchingIn.set(false);
  }
}
