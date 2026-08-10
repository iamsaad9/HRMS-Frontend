import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';

import {
  AttendanceHistoryFilter,
  EMPTY_ATTENDANCE_HISTORY_FILTER,
} from '../../model/attendance-model';

@Component({
  selector: 'app-attendance-history-filter-bar',
  standalone: true,
  imports: [FormsModule, TuiButton],
  templateUrl: './attendance-history-filter-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceHistoryFilterBar {
  @Output()
  readonly filterChange = new EventEmitter<AttendanceHistoryFilter>();

  protected draft = signal<AttendanceHistoryFilter>({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });

  protected onEmployeeIdChange(value: string): void {
    this.draft.update((f) => ({ ...f, employeeId: value }));
  }

  protected onStartDateChange(value: string): void {
    this.draft.update((f) => ({ ...f, startDate: value }));
  }

  protected onEndDateChange(value: string): void {
    this.draft.update((f) => ({ ...f, endDate: value }));
  }

  protected get canSearch(): boolean {
    const f = this.draft();
    return !!f.employeeId && !!f.startDate && !!f.endDate;
  }

  protected onSearch(): void {
    if (!this.canSearch) return;
    this.filterChange.emit({ ...this.draft() });
  }

  protected onReset(): void {
    this.draft.set({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
    this.filterChange.emit({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
  }
}