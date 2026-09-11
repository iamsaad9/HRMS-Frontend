import { ChangeDetectionStrategy, Component, EventEmitter, computed, inject, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiExpand, TuiTextfield, TuiTextfieldComponent } from '@taiga-ui/core';
import { TuiMultiSelect, TuiSelect, TuiDataListWrapperComponent, TuiInputDate, TuiDataListWrapper, TuiChevron, TuiChip } from '@taiga-ui/kit';

import {
  AttendanceHistoryFilter,
  EMPTY_ATTENDANCE_HISTORY_FILTER,
  ATTENDANCE_STATUS_OPTIONS,
  WORK_LOCATION_OPTIONS,
  SHIFT_TYPE_OPTIONS,
  EXCEPTION_FLAG_OPTIONS,
  DEPARTMENT_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  AttendanceStatus,
  WorkLocation,
  ShiftType,
  ExceptionFlag,
  Department,
  EmploymentType,
} from '../../model/attendance.model';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { TuiCardLarge, TuiElasticContainer, TuiItemGroup } from '@taiga-ui/layout';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import { parseDisplayDate, toIsoDate } from '../../../../../shared/utils/date-format.util';

/** Max span the date range can cover, so a filtered fetch can't turn into an unbounded scan. */
export const MAX_HISTORY_RANGE_DAYS = 92;

@Component({
  selector: 'app-attendance-history-filter-bar',
  standalone: true,
  imports: [
    FormsModule,
    TuiInputDate,
    TuiButton,
    TuiTextfield,
    TuiSelect,
    TuiMultiSelect,
    TuiDataListWrapper,
    TuiDataListWrapperComponent,
    TuiCardLarge,
    TuiElasticContainer,
    TuiExpand,
    TuiChevron,
    TuiChip,
    TuiInputDate,
    TuiItemGroup
],
  templateUrl: './attendance-history-filter-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceHistoryFilterBar implements OnInit {
  @Output()
  readonly filterChange = new EventEmitter<AttendanceHistoryFilter>();
  protected readonly authService = inject(AuthService);
  protected readonly leaveService = inject(LeaveRequestsService);


  isAdmin = this.authService.currentUser()?.employeeInfo?.roles?.includes("Admin") || false;
  showMoreFilters = false;
  // Option lists exposed to the template
  protected readonly statusOptions = ATTENDANCE_STATUS_OPTIONS;
  // computed(), not a plain snapshot - leaveTypes() is empty until getAllLeaveTypes() resolves,
  // so a plain `= this.leaveService.leaveTypes()` would freeze on that empty array forever.
  protected readonly leaveTypeOptions = computed(() => this.leaveService.leaveTypes());
  protected readonly leaveTypeNames = computed(() => this.leaveTypeOptions().map((t) => t.name));
  protected readonly exceptionFlagOptions = EXCEPTION_FLAG_OPTIONS;
  protected readonly maxRangeDays = MAX_HISTORY_RANGE_DAYS;

  protected draft = signal<AttendanceHistoryFilter>({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
  protected rangeError = signal<string | null>(null);

  ngOnInit(): void {
    this.leaveService.getAllLeaveTypes().subscribe();
  }

  protected onStartDateChange(value: string): void {
    this.draft.update((f) => ({ ...f, startDate: value }));
    this.validateRange();
  }

  protected onEndDateChange(value: string): void {
    this.draft.update((f) => ({ ...f, endDate: value }));
    this.validateRange();
  }

  protected onStatusesChange(value: AttendanceStatus[]): void {
    this.draft.update((f) => ({ ...f, statuses: value }));
  }


  protected onLeaveTypeChange(value: string | null): void {
    this.draft.update((f) => ({ ...f, leaveTypeId: value }));
  }

  protected onExceptionFlagsChange(value: ExceptionFlag[]): void {
    this.draft.update((f) => ({ ...f, exceptionFlags: value }));
  }

  private validateRange(): boolean {
    const { startDate, endDate } = this.draft();
    if (!startDate || !endDate) {
      this.rangeError.set(null);
      return true;
    }
    const start = parseDisplayDate(startDate);
    const end = parseDisplayDate(endDate);
    if (!start || !end) {
      // Still mid-typing an incomplete date - nothing to validate yet.
      this.rangeError.set(null);
      return true;
    }
    const days = (end.getTime() - start.getTime()) / 86_400_000;
    if (days < 0) {
      this.rangeError.set('End date cannot be before start date.');
      return false;
    }
    if (days > this.maxRangeDays) {
      this.rangeError.set(`Date range cannot exceed ${this.maxRangeDays} days (~3 months).`);
      return false;
    }
    this.rangeError.set(null);
    return true;
  }

  protected onSearch(): void {
    if (!this.validateRange()) return;
    const draft = this.draft();
    this.filterChange.emit({
      ...draft,
      startDate: draft.startDate ? toIsoDate(draft.startDate) : draft.startDate,
      endDate: draft.endDate ? toIsoDate(draft.endDate) : draft.endDate,
    });
  }

  protected onReset(): void {
    this.draft.set({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
    this.rangeError.set(null);
    this.filterChange.emit({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
  }
}