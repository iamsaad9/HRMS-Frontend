import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiBadge, TuiInputDate } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';

import { DepartmentAttendanceFilter, DepartmentAttendanceRecord } from '../../model/attendance.model';
import { TeamAttendanceLogService } from './team-attendance-log.service';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { isoToDisplayDate, toIsoDate } from '../../../../../shared/utils/date-format.util';
import { DurationPipe } from '../../../../../shared/pipes/duration.pipe';

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-team-attendance-log',
  standalone: true,
  imports: [
    FormsModule, DatePipe, TuiButton, TuiIcon, TuiBadge, TuiTable, TuiTextfield, TuiInputDate, TuiCardLarge,
    MainHeading, DurationPipe,
  ],
  templateUrl: './team-attendance-log.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamAttendanceLog implements OnInit {
  private readonly teamAttendanceLogService = inject(TeamAttendanceLogService);
  private readonly authService = inject(AuthService);

  protected managerId = this.authService.currentUser()?.employeeInfo?.id ?? '';

  protected filter = signal<Pick<DepartmentAttendanceFilter, 'startDate' | 'endDate'>>({
    startDate: toDateStr(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    endDate: toDateStr(new Date()),
  });

  protected allRecords = signal<DepartmentAttendanceRecord[]>([]);
  protected isLoading = signal(false);
  protected hasSearched = signal(false);
  protected rangeError = signal<string | null>(null);
  protected readonly maxRangeDays = 92;
  protected selectedEmployeeId = signal<string | null>(null);

  // One row per employee, deduped from allRecords(), for the left-hand list.
  protected employees = computed(() => {
    const map = new Map<string, { id: string; name: string; recordCount: number }>();
    for (const r of this.allRecords()) {
      const existing = map.get(r.employeeId);
      if (existing) {
        existing.recordCount++;
      } else {
        map.set(r.employeeId, { id: r.employeeId, name: r.employeeName, recordCount: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  // The selected employee's records across the searched range, newest first.
  protected selectedEmployeeRecords = computed(() => {
    const id = this.selectedEmployeeId();
    if (!id) return [];
    return this.allRecords()
      .filter((r) => r.employeeId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  protected selectedEmployeeName = computed(
  () => this.employees().find((e) => e.id === this.selectedEmployeeId())?.name ?? '',
  );

  protected selectEmployee(id: string): void {
    this.selectedEmployeeId.set(id);
  }

  protected byDate = computed(() => {
    const map = new Map<string, DepartmentAttendanceRecord[]>();
    for (const r of this.allRecords()) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return map;
  });

  protected sortedDates = computed(() => Array.from(this.byDate().keys()).sort().reverse());

  ngOnInit(): void {
    if (this.managerId) this.search();
  }

  protected displayStartDate = computed(() => isoToDisplayDate(this.filter().startDate));
  protected displayEndDate = computed(() => isoToDisplayDate(this.filter().endDate));

  protected onStartDateChange(displayValue: string): void {
    this.filter.update((f) => ({ ...f, startDate: toIsoDate(displayValue) }));
  }

  protected onEndDateChange(displayValue: string): void {
    this.filter.update((f) => ({ ...f, endDate: toIsoDate(displayValue) }));
  }

  protected search(): void {
  const { startDate, endDate } = this.filter();
  if (!this.managerId || !startDate || !endDate) return;

  const days = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000;
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
  this.teamAttendanceLogService.getTeamAttendanceLog(this.managerId, startDate, endDate).subscribe({
    next: (records) => {
      this.allRecords.set(records);
      this.hasSearched.set(true);
      this.isLoading.set(false);
      this.selectedEmployeeId.set(records[0]?.employeeId ?? null);
    },
    error: () => {
      this.hasSearched.set(true);
      this.isLoading.set(false);
    },
  });
}

  protected statusAppearance(status: string | undefined): string {
    switch (status) {
      case 'Present':
        return 'positive';
      case 'NeedsRegularization':
        return 'warning';
      case 'Absent':
        return 'negative';
      default:
        return 'neutral';
    }
  }
}
