import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { DashboardService } from '../../service/dashboard.service';


export interface CalendarDay {
  date: Date;
  dateStr: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  holiday: Holiday | null;
}

export interface Holiday {
  date: string; // yyyy-MM-dd
  name: string;
}

@Component({
  selector: 'app-leave-calendar-card',
  standalone: true,
  imports: [DatePipe, TuiButton, TuiIcon, TuiCardLarge],
  templateUrl: './leave-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class LeaveCalendarCard {
  protected readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);

  private readonly today = this.stripTime(new Date());
  protected readonly weekDayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Which month is currently displayed. Day is irrelevant, only month/year is used.
  protected viewDate = signal<Date>(new Date());

  // Expand each holiday's [startDate, endDate] range into one entry per day so
  // multi-day term breaks/bank holidays highlight every day, not just the first.
  protected holidays = computed<Holiday[]>(() => {
    const raw = this.dashboardService.data()?.holidayCalendar ?? [];
    const expanded: Holiday[] = [];

    for (const h of raw) {
      const cursor = new Date(h.startDate);
      const end = new Date(h.endDate);
      while (cursor <= end) {
        expanded.push({ date: this.toDateStr(cursor), name: h.title });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return expanded;
  });

  private holidayMap = computed<Map<string, Holiday>>(() => {
    const map = new Map<string, Holiday>();
    for (const h of this.holidays()) map.set(h.date, h);
    return map;
  });
 
  protected monthLabel = computed(() =>
    this.viewDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );
 
  // 6-row (42-cell) grid so the layout height stays stable across months.
  protected calendarWeeks = computed<CalendarDay[][]>(() => {
    const view = this.viewDate();
    const year = view.getFullYear();
    const month = view.getMonth();
 
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const gridStart = new Date(year, month, 1 - startOffset);
 
    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const dateStr = this.toDateStr(date);
      const stripped = this.stripTime(date);
 
      days.push({
        date,
        dateStr,
        inCurrentMonth: date.getMonth() === month,
        isToday: stripped.getTime() === this.today.getTime(),
        isPast: stripped.getTime() < this.today.getTime(),
        holiday: this.holidayMap().get(dateStr) ?? null,
      });
    }
 
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  });
 
  private toDateStr(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
 
  private stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
 
  protected previousMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }
 
  protected nextMonth(): void {
    const v = this.viewDate();
    this.viewDate.set(new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }
}