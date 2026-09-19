import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

export interface AttendancePunch {
  date: string;          // 'YYYY-MM-DD'
  checkIn: string | null;    // 'HH:mm', null if missing
  checkOut: string | null;   // 'HH:mm', null if missing
  status?: string;           // 'OnLeave', 'Present', etc.
  /**
   * Backend-computed hours (from totalHoursWorked/lateMinutes/overtimeMinutes). When supplied,
   * these are used as-is instead of re-deriving late/work/overtime from checkIn/checkOut - the
   * caller's own timezone/overnight-shift handling is skipped entirely, so the numbers always
   * match the backend to the second.
   */
  lateHours?: number;
  workHours?: number;
  overtimeHours?: number;
}

interface DaySegment {
  date: string;
  dayNum: number;
  weekdayShort: string;
  isWeekend: boolean;
  lateHours: number;
  workHours: number;
  overtimeHours: number;
  totalHours: number;
  status: 'complete' | 'incomplete' | 'empty' | 'leave';
  tooltip: string;
}

const YAXIS_TICKS = [1, 0.75, 0.5, 0.25, 0] as const;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

@Component({
  selector: 'app-attendance-bar-chart',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  templateUrl: './attendance-bar-chart.html',
  styleUrl: './attendance-bar-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceBarChartComponent {
  readonly punches = input<readonly AttendancePunch[]>([]);

  readonly shiftStart = input<string>('09:00');
  readonly shiftEnd = input<string>('18:00');
  // The currently "active" attendance date (same resolved slot as the Attendance Date card, e.g.
  // a bumped-to-next-day slot) - falls back to the browser's own local date only when there's no
  // active slot to point at (e.g. nothing punched yet this month).
  readonly attendanceDate = input<string | null>(null);
  protected readonly todayDateStr = computed(() => this.attendanceDate() ?? new Date().toLocaleDateString('en-CA'));
  protected readonly yAxisTicks = YAXIS_TICKS;

  selectedDay = signal<DaySegment | null>(null);

  toggleDayPopover(day: DaySegment, event: Event): void {
    event.stopPropagation();
    if (this.selectedDay()?.date === day.date) {
      this.selectedDay.set(null);
    } else {
      this.selectedDay.set(day);
    }
  }

  closePopover(): void {
    this.selectedDay.set(null);
  }

  protected readonly days = computed<DaySegment[]>(() => {
    const shiftStartMin = toMinutes(this.shiftStart());
    const rawShiftEndMin = toMinutes(this.shiftEnd());
    // Overnight shift (e.g. 18:30 - 02:30): the end time-of-day is numerically smaller than the
    // start, but it actually falls on the NEXT calendar day - shift it 24h forward so duration
    // math below stays on one continuous timeline instead of comparing against an "earlier"
    // clock time and producing a huge bogus overtime figure.
    const isOvernightShift = rawShiftEndMin <= shiftStartMin;
    const shiftEndMin = isOvernightShift ? rawShiftEndMin + 24 * 60 : rawShiftEndMin;
    const inputPunches = this.punches();

    const punchMap = new Map<string, AttendancePunch>(
      inputPunches.map((p) => [p.date, p])
    );

    let baseYear = 2026;
    let baseMonth = 3;

    if (inputPunches.length > 0 && inputPunches[0].date) {
      const [y, m] = inputPunches[0].date.split('-').map(Number);
      baseYear = y;
      baseMonth = m;
    }

    const fullMonthSegments: DaySegment[] = [];
    // Get actual number of days in the month
    const TOTAL_DAYS = new Date(baseYear, baseMonth, 0).getDate();

    for (let dayNum = 1; dayNum <= TOTAL_DAYS; dayNum++) {
      const monthStr = String(baseMonth).padStart(2, '0');
      const dayStr = String(dayNum).padStart(2, '0');
      const dateStr = `${baseYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(`${dateStr}T00:00:00`);
      const weekdayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      const punch = punchMap.get(dateStr);

      if (!punch) {
        fullMonthSegments.push({
          date: dateStr,
          dayNum,
          weekdayShort,
          isWeekend,
          lateHours: 0,
          workHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          status: 'empty',
          tooltip: `${dateStr} — No attendance data recorded`,
        });
        continue;
      }

      if (punch.status === 'OnLeave') {
        fullMonthSegments.push({
          date: dateStr,
          dayNum,
          weekdayShort,
          isWeekend,
          lateHours: 0,
          workHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          status: 'leave',
          tooltip: `${dateStr} — On Leave`,
        });
        continue;
      }

      if (!punch.checkIn || !punch.checkOut) {
        fullMonthSegments.push({
          date: dateStr,
          dayNum,
          weekdayShort,
          isWeekend,
          lateHours: 0,
          workHours: 0,
          overtimeHours: 0,
          totalHours: 0,
          status: 'incomplete',
          tooltip: `${dateStr} — incomplete punch (missing ${!punch.checkIn ? 'check-in' : 'check-out'})`,
        });
        continue;
      }

      let lateHours: number;
      let workHours: number;
      let overtimeHours: number;

      if (punch.lateHours !== undefined && punch.workHours !== undefined && punch.overtimeHours !== undefined) {
        // Backend-computed, second-precise figures - use them as-is instead of re-deriving from
        // HH:mm strings (which loses seconds and can't account for the backend's own shift/
        // timezone handling).
        lateHours = punch.lateHours;
        workHours = punch.workHours;
        overtimeHours = punch.overtimeHours;
      } else {
        const inMin = toMinutes(punch.checkIn);
        let outMin = toMinutes(punch.checkOut);
        // On an overnight shift, a check-out clock time earlier than check-in means it happened
        // after midnight (the next calendar day) - shift it forward to match shiftEndMin's scale.
        if (isOvernightShift && outMin < inMin) {
          outMin += 24 * 60;
        }

        const lateMin = Math.max(0, inMin - shiftStartMin);
        const overtimeMin = Math.max(0, outMin - shiftEndMin);
        const workedMin = Math.max(0, outMin - inMin);
        const workMin = Math.max(0, workedMin - overtimeMin);

        lateHours = lateMin / 60;
        workHours = workMin / 60;
        overtimeHours = overtimeMin / 60;
      }

      const totalHours = lateHours + workHours + overtimeHours;

      const tooltipParts = [
        `${dateStr} · In ${punch.checkIn} / Out ${punch.checkOut}`,
        lateHours > 0 ? `Late ${formatHours(lateHours)}` : null,
        `Work ${formatHours(workHours)}`,
        overtimeHours > 0 ? `OT ${formatHours(overtimeHours)}` : null,
      ].filter(Boolean);

      fullMonthSegments.push({
        date: dateStr,
        dayNum,
        weekdayShort,
        isWeekend,
        lateHours,
        workHours,
        overtimeHours,
        totalHours,
        status: 'complete',
        tooltip: tooltipParts.join(' · '),
      });
    }

    return fullMonthSegments;
  });

  protected readonly maxTotalHours = computed(() => {
    const max = Math.max(...this.days().map((d) => d.totalHours), 0);
    return Math.max(8, Math.ceil(max));
  });

  // The footer tracks the same "active" day as the bar highlight (todayDateStr) - not a sum
  // across every day shown, so it moves together with the Attendance Date card/bar highlight
  // instead of staying pinned to whichever day happens to have data first.
  protected readonly totals = computed(() => {
    const activeDay = this.days().find((d) => d.date === this.todayDateStr());
    return {
      regular: activeDay?.workHours ?? 0,
      late: activeDay?.lateHours ?? 0,
      overtime: activeDay?.overtimeHours ?? 0,
    };
  });

  protected segmentHeightPct(hours: number): number {
    const max = this.maxTotalHours();
    return max > 0 ? (hours / max) * 100 : 0;
  }
}