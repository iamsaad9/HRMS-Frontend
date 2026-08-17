import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLineChart, TuiAxes } from '@taiga-ui/addon-charts';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiButton, TuiPoint, TuiIcon } from '@taiga-ui/core';
import { TeamMember } from './performance-section.model';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';
import { Router } from '@angular/router';
import { AttendanceService } from '../../../attendance/service/attendance.service';
import { AttendanceBarChartComponent } from "../../../../../shared/components/attendance-bar-chart/attendance-bar-chart";

export interface AttendancePunch {
    readonly date: string;       // 'YYYY-MM-DD'
    readonly checkIn: string | null;   // 'HH:mm'
    readonly checkOut: string | null;  // 'HH:mm'
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-performance-section',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiAvatar, TuiCardLarge, MatIcon, TuiIcon, AttendanceBarChartComponent],
  templateUrl: './performance-section.html',
})
export class PerformanceSection {
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

 
}
