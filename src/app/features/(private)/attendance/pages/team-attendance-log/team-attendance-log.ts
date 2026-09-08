import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';

import { DepartmentAttendanceFilter, DepartmentAttendanceRecord } from '../../model/attendance.model';
import { TeamAttendanceLogService } from './team-attendance-log.service';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-team-attendance-log',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, TuiButton, TuiBadge, TuiTable, TuiTextfield, TuiCardLarge, MainHeading],
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

  protected onStartDateChange(startDate: string): void {
    this.filter.update((f) => ({ ...f, startDate }));
  }

  protected onEndDateChange(endDate: string): void {
    this.filter.update((f) => ({ ...f, endDate }));
  }

  protected search(): void {
    const { startDate, endDate } = this.filter();
    if (!this.managerId || !startDate || !endDate) return;

    this.isLoading.set(true);
    this.teamAttendanceLogService.getTeamAttendanceLog(this.managerId, startDate, endDate).subscribe({
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
