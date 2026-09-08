import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiCheckbox, TuiExpand, TuiTextfield, TuiTextfieldComponent } from '@taiga-ui/core';
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
  LeaveType,
  ShiftType,
  ExceptionFlag,
  Department,
  EmploymentType,
} from '../../model/attendance.model';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { TuiCardLarge, TuiElasticContainer, TuiItemGroup } from '@taiga-ui/layout';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
// import { LEAVE_TYPE_OPTIONS } from '../../../leave-management/model/leave-request.model';

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
    TuiCheckbox,
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
export class AttendanceHistoryFilterBar {
  @Output()
  readonly filterChange = new EventEmitter<AttendanceHistoryFilter>();
  protected readonly authService = inject(AuthService);
  protected readonly leaveService = inject(LeaveRequestsService);


  isAdmin = this.authService.currentUser()?.employeeInfo?.roles?.includes("Admin") || false;
  showMoreFilters = false;
  // Option lists exposed to the template
  protected readonly statusOptions = ATTENDANCE_STATUS_OPTIONS;
  protected readonly leaveTypeOptions = this.leaveService.leaveTypes();
  protected readonly exceptionFlagOptions = EXCEPTION_FLAG_OPTIONS;

  protected draft = signal<AttendanceHistoryFilter>({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });

  protected onStartDateChange(value: string): void {
    this.draft.update((f) => ({ ...f, startDate: value }));
  }

  protected onEndDateChange(value: string): void {
    this.draft.update((f) => ({ ...f, endDate: value }));
  }

  protected onStatusesChange(value: AttendanceStatus[]): void {
    this.draft.update((f) => ({ ...f, statuses: value }));
  }


  protected onLeaveTypeChange(value: LeaveType | null): void {
    this.draft.update((f) => ({ ...f, leaveType: value }));
  }

  protected onExceptionFlagsChange(value: ExceptionFlag[]): void {
    this.draft.update((f) => ({ ...f, exceptionFlags: value }));
  }



  protected onSearch(): void {
   
    this.filterChange.emit({ ...this.draft() });
  }

  protected onReset(): void {
    this.draft.set({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
    this.filterChange.emit({ ...EMPTY_ATTENDANCE_HISTORY_FILTER });
  }
}