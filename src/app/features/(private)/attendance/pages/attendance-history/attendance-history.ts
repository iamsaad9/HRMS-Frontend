import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TuiButton, TuiCell, TuiTitle, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiPagination, TuiStatus } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';

import {
  ATTENDANCE_CHANNEL_LABELS,
  AttendanceHistoryFilter,
  AttendanceRecord,
  AttendanceStatus,
  EMPTY_ATTENDANCE_HISTORY_FILTER,
  ExceptionFlag,
} from '../../model/attendance.model';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendance.service';
import { AttendanceHistoryFilterBar } from '../../components/attendance-hisotry-filter-bar/attendance-history-filter-bar';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
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
    DecimalPipe,
    TuiPagination,
],
  templateUrl: './attendance-history.html',
  styleUrl: './attendance-history.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceHistory implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly router = inject(Router);

  protected currentUserId = this.authService.currentUser()?.employeeInfo.id;

  protected allRecords = signal<AttendanceRecord[]>([]);

  private earliestLoadedDate = signal<string | null>(null);

  protected isLoadingMore = false;

  protected filter = signal<AttendanceHistoryFilter>({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
  protected hasSearched = signal(false);
  protected readonly channelLabels = ATTENDANCE_CHANNEL_LABELS;

  // Non-null once a Start Date + End Date search has been run - switches the table from the
  // rolling week view to a flat, paginated view of exactly that (server-capped) range.
  protected filteredRecords = signal<AttendanceRecord[] | null>(null);
  protected isSearchingRange = signal(false);
  protected page = signal(0);
  protected readonly pageSize = 15;

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

    const f = this.filter();
    if (f.statuses.length === 0 && f.exceptionFlags.length === 0 && !f.leaveTypeId) return weekRecords;

    return weekRecords.filter((r) => r.hasData && this.matchesFilters(r, f));
  });

  /** Flat list for the date-range search results, filtered but not yet paginated. */
  protected matchedFilteredRecords = computed<DisplayAttendanceRecord[]>(() => {
    const filtered = this.filteredRecords();
    if (filtered === null) return [];
    const f = this.filter();
    return filtered
      .map((r): DisplayAttendanceRecord => ({ ...r, attendanceDate: r.date, hasData: true }))
      .filter((r) => this.matchesFilters(r, f));
  });

  protected totalFilteredPages = computed(() =>
    Math.max(1, Math.ceil(this.matchedFilteredRecords().length / this.pageSize)),
  );

  private pagedFilteredRecords = computed<DisplayAttendanceRecord[]>(() => {
    const start = this.page() * this.pageSize;
    return this.matchedFilteredRecords().slice(start, start + this.pageSize);
  });

  /** What the table actually renders - filtered/paginated search results, or the default week view. */
  protected displayedRecords = computed<DisplayAttendanceRecord[]>(() =>
    this.filteredRecords() === null ? this.filledWeekRecords() : this.pagedFilteredRecords(),
  );

  protected isRangeSearchActive = computed(() => this.filteredRecords() !== null);

  private matchesFilters(r: DisplayAttendanceRecord, f: AttendanceHistoryFilter): boolean {
    if (f.statuses.length > 0 && !this.matchesStatus(r, f.statuses)) return false;
    if (f.exceptionFlags.length > 0 && !this.matchesExceptionFlags(r, f.exceptionFlags)) return false;
    if (f.leaveTypeId && r.leaveTypeId !== f.leaveTypeId) return false;
    return true;
  }

  private matchesStatus(r: DisplayAttendanceRecord, statuses: AttendanceStatus[]): boolean {
    return statuses.some((s) => {
      if (s === 'Late') return !!r.lateMinutes && r.lateMinutes > 0;
      if (s === 'On Leave') return r.status === 'OnLeave';
      if (s === 'Half-day') return r.status === 'HalfDay';
      return r.status === s;
    });
  }

  private matchesExceptionFlags(r: DisplayAttendanceRecord, flags: ExceptionFlag[]): boolean {
    return flags.some((flag) => {
      switch (flag) {
        case 'Overtime Worked':
          return !!r.overtimeHours && r.overtimeHours > 0;
        case 'Late Arrival':
          return !!r.lateMinutes && r.lateMinutes > 0;
        case 'Early Departure':
          return !!r.earlyExitMinutes && r.earlyExitMinutes > 0;
        case 'Missing Punch / Check-out':
          return !!r.firstIn && !r.lastOut;
        case 'Short Hours':
          return r.totalHoursWorked != null && r.totalHoursWorked > 0 && r.totalHoursWorked < 4;
        default:
          return false;
      }
    });
  }

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
    this.filter.set(updatedFilter);
    this.page.set(0);

    if (updatedFilter.startDate && updatedFilter.endDate) {
      this.searchRange(updatedFilter.startDate, updatedFilter.endDate);
    } else {
      // No explicit range - fall back to the rolling week view (statuses/exceptionFlags/leaveType
      // still apply there via filledWeekRecords).
      this.filteredRecords.set(null);
    }
  }

  /** Fetches exactly the requested range (server-capped at ~3 months) for the filtered/paginated view. */
  private searchRange(startDate: string, endDate: string): void {
    if (!this.currentUserId) return;

    this.isSearchingRange.set(true);
    this.attendanceService.getHistory({ employeeId: this.currentUserId, startDate, endDate }).subscribe({
      next: (response) => {
        this.hasSearched.set(true);
        this.isSearchingRange.set(false);
        if (response.isSuccess && response.data) {
          this.filteredRecords.set(response.data);
        } else {
          this.filteredRecords.set([]);
          this.toast.error(response.message || 'Could not load attendance for that range.', 'Search failed');
        }
      },
      error: (err) => {
        this.hasSearched.set(true);
        this.isSearchingRange.set(false);
        this.filteredRecords.set([]);
        this.toast.error(
          err?.error?.message || 'Could not load attendance for that range.',
          'Search failed',
        );
      },
    });
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
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
    const f = this.filter();
    if (f.startDate && f.endDate) {
      this.searchRange(f.startDate, f.endDate);
      return;
    }
    this.allRecords.set([]);
    this.earliestLoadedDate.set(null);
    this.weekOffset.set(0);
    this.loadInitialMonth();
  }

  protected onExport(): void {
    if (!this.currentUserId) return;

    const filter = this.filter();
    const days = this.weekDays();
    const f = {
      employeeId: this.currentUserId,
      startDate: filter.startDate && filter.endDate ? filter.startDate : days[0],
      endDate: filter.startDate && filter.endDate ? filter.endDate : days[days.length - 1],
    };

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