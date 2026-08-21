import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

export interface AttendancePunch {
  date: string;          // 'YYYY-MM-DD'
  checkIn: string | null;    // 'HH:mm', null if missing
  checkOut: string | null;   // 'HH:mm', null if missing
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
  status: 'complete' | 'incomplete' | 'empty';
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
readonly punches = input<readonly AttendancePunch[]>([
    { date: '2026-08-01', checkIn: '09:58', checkOut: '17:05' }, // Sunday
  { date: '2026-08-02', checkIn: '08:55', checkOut: '17:05' },
  { date: '2026-08-03', checkIn: '09:00', checkOut: '17:00' },
  { date: '2026-08-04', checkIn: '08:48', checkOut: '17:15' },
  { date: '2026-08-05', checkIn: '09:12', checkOut: '17:02' }, // Late check-in
  { date: '2026-08-06', checkIn: '08:58', checkOut: '15:30' }, // Early check-out
  { date: '2026-08-07', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-08-08', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-08-09', checkIn: '08:52', checkOut: '17:08' },
  { date: '2026-08-10', checkIn: '09:05', checkOut: '17:00' },
  { date: '2026-08-11', checkIn: '08:59', checkOut: '17:12' },    // Missing check-out
  { date: '2026-08-12', checkIn: '08:45', checkOut: '17:30' },
  { date: '2026-08-13', checkIn: '09:00', checkOut: '16:45' },
  { date: '2026-08-14', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-08-15', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-08-16', checkIn: '08:50', checkOut: '17:10' },
  { date: '2026-08-17', checkIn: '09:30', checkOut: '18:00' }, // Shifted schedule
  { date: '2026-08-18', checkIn: '08:55', checkOut: '17:00' },
  { date: '2026-08-19', checkIn: '08:57', checkOut: '17:03' },
  { date: '2026-08-20', checkIn: '09:01', checkOut: '17:00' },
  { date: '2026-08-21', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-08-22', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-08-23', checkIn: '08:58', checkOut: '15:30'  }, // Leave / Absent
  { date: '2026-08-24', checkIn: '08:40', checkOut: '17:20' },
  { date: '2026-08-25', checkIn: '08:59', checkOut: '17:01' },
  { date: '2026-08-26', checkIn: '08:58', checkOut: '15:30'  },    // Missing check-in
  { date: '2026-08-27', checkIn: '08:50', checkOut: '16:00' },
  { date: '2026-08-28', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-08-29', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-08-30', checkIn: '08:53', checkOut: '17:12' },
   ]);

  readonly shiftStart = input<string>('09:00');
  readonly shiftEnd = input<string>('18:00');
  protected readonly todayDateStr = new Date().toLocaleDateString('en-CA');
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
    const shiftEndMin = toMinutes(this.shiftEnd());
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
    const TOTAL_DAYS = 30;

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

      const inMin = toMinutes(punch.checkIn);
      const outMin = toMinutes(punch.checkOut);

      const lateMin = Math.max(0, inMin - shiftStartMin);
      const overtimeMin = Math.max(0, outMin - shiftEndMin);
      const workedMin = Math.max(0, outMin - inMin);
      const workMin = Math.max(0, workedMin - overtimeMin);

      const lateHours = lateMin / 60;
      const workHours = workMin / 60;
      const overtimeHours = overtimeMin / 60;
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

  protected readonly totals = computed(() => {
    return this.days().reduce(
      (acc, day) => {
        acc.regular += day.workHours;
        acc.late += day.lateHours;
        acc.overtime += day.overtimeHours;
        return acc;
      },
      { regular: 0, late: 0, overtime: 0 }
    );
  });

  protected segmentHeightPct(hours: number): number {
    const max = this.maxTotalHours();
    return max > 0 ? (hours / max) * 100 : 0;
  }
}