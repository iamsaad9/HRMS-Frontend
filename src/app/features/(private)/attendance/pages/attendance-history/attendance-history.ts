import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiCell, TuiTitle } from '@taiga-ui/core';
import { TuiBadge, TuiStatus } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';

import {
  ATTENDANCE_CHANNEL_LABELS,
  AttendanceHistoryFilter,
  AttendanceRecord,
  EMPTY_ATTENDANCE_HISTORY_FILTER,
} from '../../model/attendance-model';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendanceService';
import { AttendanceHistoryFilterBar } from '../../components/attendance-hisotry-filter-bar/attendance-history-filter-bar';
import { AuthService } from '../../../../(public)/auth/services/auth.service';

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
    TuiCell,
    TuiTitle,
    TuiBadge,
    TuiTable,
    TuiStatus,
    MainHeading,
    AttendanceHistoryFilterBar,
  ],
  templateUrl: './attendance-history.html',
  styleUrl: './attendance-history.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceHistory implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);

  protected currentUserId = this.authService.currentUser()?.employeeInfo.employeeId;

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
      const key = rec.attendanceDate ? rec.attendanceDate.split('T')[0] : '';
      if (key) fetchedMap.set(key, rec);
    });

    return this.weekDays().map((dayStr) => {
      const match = fetchedMap.get(dayStr);
      if (match) {
        return { ...match, hasData: true };
      }
      return {
        attendanceDate: dayStr,
        employeeId: this.filter().employeeId || 'N/A',
        employeeName: 'N/A',
        clockIn: null,
        clockOut: null,
        breakStart: null,
        breakEnd: null,
        channel: undefined,
        totalHours: undefined,
        status: undefined,
        hasData: false,
      };
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

  // Call this whenever the visible week window changes. If the week's
  // start date falls before what's cached, pull another month.
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
          const mappedRecords: AttendanceRecord[] = response.data.map((item: any) => ({
            id: item.id,
            employeeId: item.employeeId,
            attendanceDate: item.date || item.attendanceDate, // maps "date" to "attendanceDate"
            clockIn: item.firstIn || item.clockIn || null,   // maps "firstIn" to "clockIn"
            clockOut: item.lastOut || item.clockOut || null, // maps "lastOut" to "clockOut"
            breakStart: item.breakStart || null,
            breakEnd: item.breakEnd || null,
            channel: item.channel ?? 0,
            totalHours: item.workingHours ?? item.totalHours ?? 0,
            status: item.status,
          }));

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
    // left as-is per your note to ignore filter for now
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