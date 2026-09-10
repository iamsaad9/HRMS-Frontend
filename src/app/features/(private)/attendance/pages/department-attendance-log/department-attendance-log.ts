import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TuiButton, TuiCell, TuiTitle, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiBadge, TuiInputDate, TuiStatus } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';
import { Router } from '@angular/router';

import {
  DepartmentAttendanceFilter,
  DepartmentAttendanceRecord,
  DepartmentDaySummary,
  EMPTY_DEPARTMENT_ATTENDANCE_FILTER,
} from '../../model/attendance.model';
import { DepartmentAttendanceLogService } from '../../pages/department-attendance-log/department-attendance-log.service';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { EmployeeService } from '../../../employees/services/employee.service';
import { isoToDisplayDate, toIsoDate } from '../../../../../shared/utils/date-format.util';

@Component({
  selector: 'app-department-attendance-log',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    TuiButton,
    TuiBadge,
    TuiTable,
    TuiStatus,
    TuiTextfield,
    TuiInputDate,
    TuiCardLarge,
    TuiIcon,
    MainHeading,
  ],
  templateUrl: './department-attendance-log.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentAttendanceLog implements OnInit {
  private readonly attendanceService = inject(DepartmentAttendanceLogService);
  private readonly employeeService = inject(EmployeeService);
  protected readonly router = inject(Router);

  protected departments = computed(() => this.employeeService.allDepartments() ?? []);
  protected filter = signal<DepartmentAttendanceFilter>({ ...EMPTY_DEPARTMENT_ATTENDANCE_FILTER });

  protected allRecords = signal<DepartmentAttendanceRecord[]>([]);
  protected isLoading = signal(false);
  protected hasSearched = signal(false);
  protected rangeError = signal<string | null>(null);
  protected readonly maxRangeDays = 92;

  // Pagination: one page == one day in the selected range.
  protected currentPage = signal(1);

  protected daysInRange = computed<string[]>(() => {
    const { startDate, endDate } = this.filter();
    if (!startDate || !endDate || startDate > endDate) return [];

    const days: string[] = [];
    const cur = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    while (cur <= end) {
      days.push(this.toDateStr(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  });

  protected totalPages = computed(() => this.daysInRange().length);

  protected currentDate = computed<string | null>(() => {
    const days = this.daysInRange();
    const page = this.currentPage();
    return days[page - 1] ?? null;
  });

  protected currentDateLabel = computed(() => {
    const date = this.currentDate();
    if (!date) return '';
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  });

  // Rows for the currently viewed day.
  protected currentDayRecords = computed<DepartmentAttendanceRecord[]>(() => {
    const date = this.currentDate();
    if (!date) return [];
    return this.allRecords().filter((r) => r.date === date);
  });

  // Quick-info cards, scoped to the day currently being viewed.
  protected daySummary = computed<DepartmentDaySummary | null>(() => {
    const date = this.currentDate();
    const records = this.currentDayRecords();
    if (!date || records.length === 0) return null;

    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.lateMinutes > 0).length;
    const absent = records.filter((r) => r.status === 'Absent' || r.status === 'OnLeave').length;

    const workedHours = records
      .map((r) => r.totalHoursWorked)
      .filter((h): h is number => h != null);
    const avgWorkingHours = workedHours.length
      ? workedHours.reduce((sum, h) => sum + h, 0) / workedHours.length
      : 0;

    const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtimeHours ?? 0), 0);

    return {
      date,
      totalEmployees: records.length,
      present,
      absent,
      late,
      avgWorkingHours,
      totalOvertimeHours,
    };
  });

  // Windowed list of page numbers so the pager doesn't grow unbounded on wide ranges.
  protected visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const windowSize = 5;

    let start = Math.max(1, current - Math.floor(windowSize / 2));
    const end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  });

  ngOnInit(): void {
    this.employeeService.getDepartments().subscribe();
  }

  private toDateStr(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  protected onDepartmentChange(departmentId: string): void {
    this.filter.update((f) => ({ ...f, departmentId }));
  }

  // The date inputs display/emit "dd.mm.yyyy" (tuiInputDate's locale format) while `filter()`
  // keeps plain ISO throughout, since day-range math and the HTTP params both need real ISO dates.
  protected displayStartDate = computed(() => isoToDisplayDate(this.filter().startDate));
  protected displayEndDate = computed(() => isoToDisplayDate(this.filter().endDate));

  protected onStartDateChange(displayValue: string): void {
    this.filter.update((f) => ({ ...f, startDate: toIsoDate(displayValue) }));
  }

  protected onEndDateChange(displayValue: string): void {
    this.filter.update((f) => ({ ...f, endDate: toIsoDate(displayValue) }));
  }

  protected onSearch(): void {
    const f = this.filter();
    if (!f.departmentId || !f.startDate || !f.endDate) return;

    const days = (new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / 86_400_000;
    if (days < 0) {
      this.rangeError.set('End date cannot be before start date.');
      return;
    }
    if (days > this.maxRangeDays) {
      this.rangeError.set(`Date range cannot exceed ${this.maxRangeDays} days (~3 months).`);
      return;
    }
    this.rangeError.set(null);

    this.isLoading.set(true);
    this.currentPage.set(1);

    this.attendanceService.getDepartmentAttendanceLog(f).subscribe({
      next: (records) => {
        this.allRecords.set(records);
        this.hasSearched.set(true);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasSearched.set(true);
        this.isLoading.set(false);
      },
    });
  }

  protected onRefresh(): void {
    this.onSearch();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  protected previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  protected nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  protected statusAppearance(status: string | undefined): string {
    switch (status) {
      case 'Present':
        return 'positive';
      case 'NeedsRegularization':
        return 'warning';
      case 'Absent':
        return 'negative';
      case 'OnLeave':
      case 'WorkFromHome':
      case 'WeeklyOff':
      case 'Holiday':
        return 'neutral';
      default:
        return 'neutral';
    }
  }

}