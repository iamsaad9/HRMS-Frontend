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

const SHIFT_START = 9 * 60;  // 09:00 in minutes
const SHIFT_END = 18 * 60;   // 18:00 in minutes
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface MinutesSegment {
  lateMins: number;
  regularMins: number;
  overtimeMins: number;
}

function segmentsFor(punch: AttendancePunch): MinutesSegment {
  if (!punch.checkIn || !punch.checkOut) {
    return { lateMins: 0, regularMins: 0, overtimeMins: 0 };
  }

  const inMin = toMinutes(punch.checkIn);
  const outMin = Math.max(toMinutes(punch.checkOut), inMin);

  // Late: minutes arrived after SHIFT_START (capped at shift end/checkout)
  const lateMins = Math.max(0, Math.min(inMin, SHIFT_END) - SHIFT_START);

  // Regular: minutes worked within SHIFT_START -> SHIFT_END
  const regularMins = Math.max(0, Math.min(outMin, SHIFT_END) - Math.max(inMin, SHIFT_START));

  // Overtime: minutes worked past SHIFT_END
  const overtimeMins = Math.max(0, outMin - SHIFT_END);

  return { lateMins, regularMins, overtimeMins };
}
@Component({
  selector: 'app-user-cards',
  templateUrl: './user-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiIcon, TuiButton,  TuiCardLarge, DatePipe,  MatIcon, AttendanceBarChartComponent],
})
export class UserCardsComponent {
   protected readonly attendanceService = inject(AttendanceService);
   protected router = inject(Router);

  isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === today.getFullYear()
    && d.getMonth() === today.getMonth()
    && d.getDate() === today.getDate();
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

  readonly axisXLabels: readonly string[] = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];





  //  readonly punches = input.required<readonly AttendancePunch[]>();
  readonly punches = input<readonly AttendancePunch[]>([
    { date: '2026-03-01', checkIn: '09:58', checkOut: '17:05' }, // Sunday
  { date: '2026-03-02', checkIn: '08:55', checkOut: '17:05' },
  { date: '2026-03-03', checkIn: '09:00', checkOut: '17:00' },
  { date: '2026-03-04', checkIn: '08:48', checkOut: '17:15' },
  { date: '2026-03-05', checkIn: '09:12', checkOut: '17:02' }, // Late check-in
  { date: '2026-03-06', checkIn: '08:58', checkOut: '15:30' }, // Early check-out
  { date: '2026-03-07', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-03-08', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-03-09', checkIn: '08:52', checkOut: '17:08' },
  { date: '2026-03-10', checkIn: '09:05', checkOut: '17:00' },
  { date: '2026-03-11', checkIn: '08:59', checkOut: '17:12' },    // Missing check-out
  { date: '2026-03-12', checkIn: '08:45', checkOut: '17:30' },
  { date: '2026-03-13', checkIn: '09:00', checkOut: '16:45' },
  { date: '2026-03-14', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-03-15', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-03-16', checkIn: '08:50', checkOut: '17:10' },
  { date: '2026-03-17', checkIn: '09:30', checkOut: '18:00' }, // Shifted schedule
  { date: '2026-03-18', checkIn: '08:55', checkOut: '17:00' },
  { date: '2026-03-19', checkIn: '08:57', checkOut: '17:03' },
  { date: '2026-03-20', checkIn: '09:01', checkOut: '17:00' },
  { date: '2026-03-21', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-03-22', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-03-23', checkIn: '08:58', checkOut: '15:30'  }, // Leave / Absent
  { date: '2026-03-24', checkIn: '08:40', checkOut: '17:20' },
  { date: '2026-03-25', checkIn: '08:59', checkOut: '17:01' },
  { date: '2026-03-26', checkIn: '08:58', checkOut: '15:30'  },    // Missing check-in
  { date: '2026-03-27', checkIn: '08:50', checkOut: '16:00' },
  { date: '2026-03-28', checkIn: '08:58', checkOut: '15:30'  }, // Saturday
  { date: '2026-03-29', checkIn: '08:58', checkOut: '15:30'  }, // Sunday
  { date: '2026-03-30', checkIn: '08:53', checkOut: '17:12' },
   ]);

   protected readonly rawSegments = computed(() =>
    this.punches().map(segmentsFor)
  );

  // Taiga UI stacked bar chart values per column: [lateHours, regularHours, overtimeHours]
  protected readonly value = computed(() =>
    this.rawSegments().map(({ lateMins, regularMins, overtimeMins }) => [
      +(lateMins / 60).toFixed(2),
      +(regularMins / 60).toFixed(2),
      +(overtimeMins / 60).toFixed(2),
    ])
  );

  // Timezone-safe day extraction for Taiga UI X-axis labels
  protected readonly labelsX = computed(() =>
    this.punches().map((p, i) => {
      if (i % 5 !== 0) return '';
      const dayStr = p.date.split('-')[2];
      return String(parseInt(dayStr, 10));
    })
  );

  protected readonly labelsY = ['0', '12h'];

  protected readonly max = computed(() => {
    const totalsInHours = this.value().map(([l, r, o]) => l + r + o);
    const highestBar = Math.max(...totalsInHours, 9);
    return tuiCeil(highestBar, -1) || 12;
  });

  protected readonly totals = computed(() => {
    const sum = this.rawSegments().reduce(
      (acc, s) => ({
        regularMins: acc.regularMins + s.regularMins,
        lateMins: acc.lateMins + s.lateMins,
        overtimeMins: acc.overtimeMins + s.overtimeMins,
      }),
      { regularMins: 0, lateMins: 0, overtimeMins: 0 }
    );

    return {
      regular: sum.regularMins / 60,
      late: sum.lateMins / 60,
      overtime: sum.overtimeMins / 60,
    };
  });

  protected readonly score = computed(() => {
    const { regular, overtime } = this.totals();
    // Count weekdays (excluding weekends / empty punches if you only score workdays)
    const totalDays = this.punches().filter(p => p.checkIn || p.checkOut).length || 1;
    const expectedHours = totalDays * 8; // 8-hour workday standard (09:00 - 18:00 minus 1h break)
    
    if (expectedHours === 0) return 100;
    
    const earnedHours = regular + Math.min(overtime, regular * 0.15);
    return Math.min(100, Math.round((earnedHours / expectedHours) * 100));
  });

  protected readonly scoreLabel = computed(() => {
    const s = this.score();
    if (s >= 90) return 'Excellent';
    if (s >= 75) return 'Good';
    if (s >= 60) return 'Fair';
    return 'Needs attention';
  });
}