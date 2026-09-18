import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLineChart, TuiAxes } from '@taiga-ui/addon-charts';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiButton, TuiPoint, TuiIcon, TuiHint } from '@taiga-ui/core';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';
import { Router } from '@angular/router';
import { AttendanceService } from '../../../attendance/service/attendance.service';
import { AttendanceBarChartComponent, AttendancePunch } from "../attendance-bar-chart/attendance-bar-chart";
import { AttendanceChannelType, PunchCommand, PunchType } from '../../../attendance/model/attendance.model';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { DashboardService } from '../../service/dashboard.service';

function extractErrorMessage(error: any, fallback: string): string {
  return (
    error?.error?.message ??
    error?.error?.title ??
    error?.error?.errors?.[0] ??
    (typeof error?.error === 'string' ? error.error : null) ??
    fallback
  );
}

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
  imports: [CommonModule, TuiButton, TuiCardLarge, MatIcon, TuiIcon,TuiHint, AttendanceBarChartComponent],
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

  // Shows the ATTENDANCE date (whichever slot attendanceService.activeShiftRecord() resolved -
  // an overnight shift still shows its origin date even after the real calendar day has rolled
  // over), not necessarily the literal "today" - see activeShiftRecord()'s own comment.
  formattedDate = computed(() => {
    const activeDate = this.attendanceService.activeShiftRecord()?.date;
    if (!activeDate) return this.today.toLocaleDateString('en-US', this.options);
    const [y, m, d] = activeDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', this.options);
  });

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


  /**
   * Real work-hour-overview data: this employee's actual clock in/out per day. Regular/Late/
   * Overtime hours are taken directly from the backend's own calculation (totalHoursWorked/
   * lateMinutes/overtimeMinutes - the DailyAttendance TS model's field names are stale, so these
   * are read off the raw response) rather than re-derived on the frontend from HH:mm strings,
   * so the bar chart always matches the backend to the second instead of approximating it.
   */
  protected readonly barChartPunches = computed<AttendancePunch[]>(() =>
    (this.attendanceService.currentMonth() ?? []).map((d) => {
      const raw = d as unknown as {
        totalHoursWorked?: number;
        lateMinutes?: number;
        overtimeMinutes?: number;
      };
      const overtimeHours = (raw.overtimeMinutes ?? 0) / 60;
      const lateHours = (raw.lateMinutes ?? 0) / 60;
      const workHours = Math.max(0, (raw.totalHoursWorked ?? 0) - overtimeHours);

      return {
        date: d.date,
        checkIn: this.toHm(d.firstIn),
        checkOut: this.toHm(d.lastOut),
        status: d.status,
        lateHours,
        workHours,
        overtimeHours,
      };
    }),
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

  // Shifts are defined in UK time (see backend ToUkTime()/ToUkDate()), so the punch's clock
  // face must be read in the UK timezone too - not the browser's local timezone, which for a
  // viewer outside the UK produces an hours-off mismatch against shiftStart/shiftEnd.
  private toHm(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
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

  protected onClockIn(): void {
    if (!this.employeeId) {
      this.toast.error('Employee ID not found', 'Error');
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
          this.toast.error(response.message || 'Clock in failed!', 'Validation Error');
        }
      },
      error: (error) => {
        this.toast.error(extractErrorMessage(error, 'Clock in failed!'), 'Clock In Failed');
      },
    });
    this.isPunchingIn.set(false);
  }

  protected onBreakStart(): void {
    if (!this.employeeId) {
      this.toast.error('Employee ID not found', 'Failed');
      return;
    }

    // if (!this.canStartBreak()) {
    //   this.toast.error('Only one break session is allowed per shift', 'Break Unavailable');
    //   return;
    // }

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
          this.toast.error(response.message || 'Break start failed!', 'Validation Error');
        }
      },
      error: (error) => {
        this.toast.error(extractErrorMessage(error, 'Break start failed!'), 'Break Start Failed');
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
          this.toast.error(response.message || 'Break end failed!', 'Validation Error');
        }
      },
      error: (error) => {
        this.toast.error(extractErrorMessage(error, 'Break end failed!'), 'Break End Failed');
      },
    });
  }

  protected onClockOut(): void {
    const employeeId = this.currentUser?.employeeInfo?.id;

    if (!employeeId) {
      this.toast.error('Employee ID not found', 'Error');
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
          this.toast.error(response.message || 'Clock out failed!', 'Validation Error');
        }
      },
      error: (error) => {
        this.toast.error(extractErrorMessage(error, 'Clock out failed!'), 'Clock Out Failed');
      },
    });
    this.isPunchingIn.set(false);
  }
}
