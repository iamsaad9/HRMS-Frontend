import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TuiButton, TuiCell, TuiTitle, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiStatus } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';

import {
  ATTENDANCE_CHANNEL_LABELS,
  AttendanceHistoryFilter,
  AttendanceRecord,
  EMPTY_ATTENDANCE_HISTORY_FILTER,
} from '../../model/attendance.model';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendance.service';
import { AttendanceHistoryFilterBar } from '../../components/attendance-hisotry-filter-bar/attendance-history-filter-bar';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { TuiCardLarge } from "@taiga-ui/layout";
import { Router } from '@angular/router';

export interface DisplayAttendanceRecord extends Partial<AttendanceRecord> {
  attendanceDate: string;
  hasData: boolean;
}

@Component({
  selector: 'app-attendance-history',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TuiButton,
    TuiBadge,
    TuiTable,
    TuiStatus,
    MainHeading,
    AttendanceHistoryFilterBar,
    TuiCardLarge,
    TuiIcon,
    DecimalPipe
],
  templateUrl: './attendance-history.html',
  styleUrl: './attendance-history.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceHistory implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  protected currentUserId = this.authService.currentUser()?.employeeInfo.id;

  protected allRecords = signal<AttendanceRecord[]>([]);

  private earliestLoadedDate = signal<string | null>(null);

  protected isLoadingMore = false;

  protected filter = signal<AttendanceHistoryFilter>({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
  protected hasSearched = signal(false);
  protected readonly channelLabels = ATTENDANCE_CHANNEL_LABELS;

  protected weekOffset = signal<number>(0);

  protected weekDays = computed(() => {
    const days: string[] = [];
    const today = new Date();

    const currentDay = today.getDay();
    const distanceToMonday = (currentDay + 6) % 7;

    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday - this.weekOffset() * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(this.toDateStr(d));
    }

    return days;
  });

  protected dateRangeLabel = computed(() => {
    const days = this.weekDays();
    if (days.length === 0) return '';
    const start = new Date(days[0]);
    const end = new Date(days[days.length - 1]);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} — ${end.toLocaleDateString('en-US', opts)}`;
  });

  protected filledWeekRecords = computed<DisplayAttendanceRecord[]>(() => {
    const fetched = this.allRecords();
    const fetchedMap = new Map<string, AttendanceRecord>();

    fetched.forEach((rec: AttendanceRecord) => {
      const key = rec.date ? rec.date.split('T')[0] : '';
      if (key) fetchedMap.set(key, rec);
    });

  const weekRecords = this.weekDays().map((dayStr): DisplayAttendanceRecord => {
    const match = fetchedMap.get(dayStr);
    if (match) {
      return {
        ...match,
        attendanceDate: match.date, // 👈 Map date to attendanceDate
        hasData: true,
      };
    }
      return {
        attendanceDate: dayStr,
        date: dayStr,
        employeeId: this.filter().employeeId || 'N/A',
        hasData: false,
      };
    });

    const selectedStatuses = this.filter().statuses;
    if (selectedStatuses.length === 0) return weekRecords;

    return weekRecords.filter((r) => {
      if (!r.hasData) return false;
      return selectedStatuses.some((s) => {
        if (s === 'Late') return !!r.lateMinutes && r.lateMinutes > 0;
        if (s === 'On Leave') return r.status === 'OnLeave';
        if (s === 'Half-day') return r.status === 'HalfDay';
        return r.status === s;
      });
    });
  });

  ngOnInit(): void {
    console.log("User Id in attendance history: ", this.currentUserId)
    this.loadInitialMonth();
  }

  private toDateStr(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // First load: one month back from today, e.g. Jul 10 -> Aug 10.
  private loadInitialMonth(): void {
    if (!this.currentUserId) return;

    const today = new Date();
    const endDate = this.toDateStr(today);

    const start = new Date(today);
    start.setMonth(start.getMonth() - 1);
    const startDate = this.toDateStr(start);

    this.fetchAndMergeRange(startDate, endDate, startDate);
  }

  private loadMoreIfNeeded(neededStartDate: string): void {
    const earliest = this.earliestLoadedDate();
    if (!earliest || this.isLoadingMore) return;
    if (neededStartDate < earliest) {
      this.loadPreviousMonth(earliest);
    }
  }

  // Pulls the month immediately preceding what's already cached.
  // e.g. cached earliest = Jul 10 -> fetches Jun 10 to Jul 9.
  private loadPreviousMonth(currentEarliest: string): void {
    const earliestDate = new Date(`${currentEarliest}T00:00:00`);

    const newEnd = new Date(earliestDate);
    newEnd.setDate(newEnd.getDate() - 1);
    const newEndDate = this.toDateStr(newEnd);

    const newStart = new Date(earliestDate);
    newStart.setMonth(newStart.getMonth() - 1);
    const newStartDate = this.toDateStr(newStart);

    this.fetchAndMergeRange(newStartDate, newEndDate, newStartDate);
  }

private fetchAndMergeRange(startDate: string, endDate: string, newEarliest: string): void {
  if (!this.currentUserId) return;

  this.isLoadingMore = true;

  this.attendanceService
    .getHistory({ employeeId: this.currentUserId, startDate, endDate })
    .subscribe({
      next: (response) => {
        this.hasSearched.set(true);
        if (response.isSuccess && response.data) {
          // Map backend fields to AttendanceRecord interface
          const mappedRecords: AttendanceRecord[] = response.data

          // Prepend mapped batch
          this.allRecords.update((existing) => [...mappedRecords, ...existing]);

          // Log inside next callback to see updated signal data
          console.log('All Records Updated:', this.allRecords());
        }
        this.earliestLoadedDate.set(newEarliest);
        this.isLoadingMore = false;
      },
      error: () => {
        this.hasSearched.set(true);
        this.isLoadingMore = false;
      },
    });
}

  protected onFilterChange(updatedFilter: AttendanceHistoryFilter): void {
    // Only the status filter is actually applied (client-side, against the currently loaded week) -
    // the other fields (workLocation/shiftType/department/employmentType/exceptionFlags) have no
    // backend equivalent on the real attendance-history endpoint.
    this.filter.update((f) => ({ ...f, statuses: updatedFilter.statuses }));
  }

  protected previousWeek(): void {
    this.weekOffset.update((w) => w + 1);
    const days = this.weekDays();
    this.loadMoreIfNeeded(days[0]);
  }

  protected nextWeek(): void {
    if (this.weekOffset() > 0) {
      this.weekOffset.update((w) => w - 1);
    }
  }

  protected onRefresh(): void {
    this.allRecords.set([]);
    this.earliestLoadedDate.set(null);
    this.weekOffset.set(0);
    this.loadInitialMonth();
  }

  protected onExport(): void {
    const days = this.weekDays();
    const f = {
      ...this.filter(),
      startDate: days[0],
      endDate: days[days.length - 1],
    };
    if (!f.employeeId) return;

    this.attendanceService.exportAttendance(f).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-${f.employeeId}-${f.startDate}-to-${f.endDate}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  protected statusAppearance(status: string | undefined): string {
    switch (status) {
      case 'Present':
        return 'positive';
      case 'Late':
        return 'warning';
      case 'Absent':
        return 'negative';
      default:
        return 'neutral';
    }
  }
}