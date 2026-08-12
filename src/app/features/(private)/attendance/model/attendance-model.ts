// attendance-model.ts

// ---------- Enums ----------
export enum AttendanceChannel {
  Web = 1,
  Mobile = 2,
  Kiosk = 3,
  Biometric = 4,
}


// Adjustmnets

/**
 * PunchType must stay in lockstep with the backend `PunchType` enum.
 * Adjust the numeric values/labels below if the backend enum differs.
 */
export enum PunchType {
  ClockIn = 1,
  ClockOut = 2,
  BreakStart = 3,
  BreakEnd = 4,
}

/** Plain label list — kept simple so it plugs into `tui-data-list-wrapper` the same
 *  way the `departments` list does on the employee-details form. */
export const PUNCH_TYPE_LABELS: readonly string[] = [
  'Clock In',
  'Clock Out',
  'Break Start',
  'Break End',
];

const PUNCH_TYPE_BY_LABEL: Record<string, PunchType> = {
  'Clock In': PunchType.ClockIn,
  'Clock Out': PunchType.ClockOut,
  'Break Start': PunchType.BreakStart,
  'Break End': PunchType.BreakEnd,
};

const LABEL_BY_PUNCH_TYPE: Record<PunchType, string> = {
  [PunchType.ClockIn]: 'Clock In',
  [PunchType.ClockOut]: 'Clock Out',
  [PunchType.BreakStart]: 'Break Start',
  [PunchType.BreakEnd]: 'Break End',
};

export function punchTypeToLabel(type: PunchType): string {
  return LABEL_BY_PUNCH_TYPE[type] ?? '';
}

export function labelToPunchType(label: string): PunchType | null {
  return PUNCH_TYPE_BY_LABEL[label] ?? null;
}

export type AdjustmentStatus = 'Pending' | 'Approved' | 'Rejected';

/* ------------------------------------------------------------------ */
/*  Shapes used by the reactive form (request payload sent to the API) */
/* ------------------------------------------------------------------ */

export interface RequestedPunchForm {
  requestedPunchType: PunchType | null;
  requestedPunchTime: string;
}

export interface AttendanceAdjustmentForm {
  employeeId: string;
  attendanceDate: string;
  reason: string;
  punches: RequestedPunchForm[];
}

/* ------------------------------------------------------------------ */
/*  Shapes returned by the API                                        */
/* ------------------------------------------------------------------ */

export interface RequestedPunchResponseDto {
  id: string;
  requestedPunchType: PunchType;
  /** TimeOnly serialized as "HH:mm:ss" */
  requestedPunchTime: string;
}

export interface AttendanceAdjustmentResponseDto {
  id: string;
  employeeId: string;
  /** DateOnly serialized as "yyyy-MM-dd" */
  attendanceDate: string;
  reason: string;
  status: AdjustmentStatus;
  adminRemarks?: string | null;
  createdAtUtc: string;
  punches: RequestedPunchResponseDto[];
}

// ---------- Commands (requests) ----------
export interface ClockActionCommand {
  employeeId: string;
  channel: AttendanceChannel;
  deviceId: string | null;
  latitude: string | null;
  longitude: string | null;
}

export interface CreateShiftCommand {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodLateMinutes: number;
  gracePeriodEarlyExitMinutes: number;
}

export interface CreateAdjustmentCommand {
  employeeId: string;
  attendanceDate: string;
  requestedPunchType: PunchType;
  requestedPunchTime: string;
  reason: string;
}

export interface AdjustmentActionCommand {
  actionByUserId: string;
  remarks: string | null;
}

// ---------- Query params ----------
export interface AttendanceHistoryParams {
  employeeId: string;
  startDate: string;
  endDate: string;
}

export interface AdjustmentListParams {
  employeeId?: string;
  status?: AdjustmentStatus | string;
}

export interface TeamAttendanceParams {
  managerId: string;
  date: string;
}

export interface AttendanceSummaryParams {
  employeeId: string;
  month: number;
  year: number;
}

export interface AttendanceExportParams {
  employeeId: string;
  startDate: string;
  endDate: string;
}

// ---------- Response models ----------
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  attendanceDate: string;
  clockIn: string | null;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  channel: AttendanceChannel;
  status?: string; // e.g. Present / Late / Absent
  totalHours?: number;
}

export interface DailyAttendance {
  id:string;
  employeeId: string;
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  workingHours: number;
  overtimeHours: number;
  status?: string;
  isLate: boolean;
  isEarlyExist: boolean;
}

export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodLateMinutes: number;
  gracePeriodEarlyExitMinutes: number;
}

export interface AttendanceAdjustment {
  id: string;
  employeeId: string;
  employeeName?: string;
  attendanceDate: string;
  requestedPunchType: PunchType;
  requestedPunchTime: string;
  reason: string;
  status: AdjustmentStatus;
  actionByUserId?: string;
  remarks?: string | null;
  createdAt?: string;
}

export interface TeamAttendanceRecord {
  employeeId: string;
  employeeName: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
}

export interface AttendanceSummary {
  employeeId: string;
  month: number;
  year: number;
  totalDaysPresent: number;
  totalDaysAbsent: number;
  totalLateDays: number;
  totalOvertimeMinutes?: number;
  totalHoursWorked?: number;
}

// Filters
export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Half-day'
  | 'On Leave'
  | 'Holiday';

export type WorkLocation =
  | 'Office'
  | 'Remote / WFH'
  | 'On Site / Client Location'
  | 'Hybrid';

export type LeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Paid Time Off (PTO)'
  | 'Maternity/Paternity'
  | 'Unpaid Leave';

export type ShiftType =
  | 'Morning'
  | 'Evening'
  | 'Night'
  | 'Flexible'
  | 'Rotational';

export type ExceptionFlag =
  | 'Overtime Worked'
  | 'Short Hours'
  | 'Late Arrival'
  | 'Early Departure'
  | 'Missing Punch / Check-out';

export type Department =
  | 'Engineering'
  | 'HR'
  | 'Sales'
  | 'Marketing'
  | 'Finance'
  | 'Operations';

export type EmploymentType =
  | 'Full-Time'
  | 'Part-Time'
  | 'Contractor'
  | 'Intern';

export interface AttendanceHistoryFilter {
  employeeId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  statuses: AttendanceStatus[];
  workLocation: WorkLocation | null;
  leaveType: LeaveType | null;
  shiftType: ShiftType | null;
  exceptionFlags: ExceptionFlag[];
  department: Department | null;
  employmentType: EmploymentType | null;
}

export const EMPTY_ATTENDANCE_HISTORY_FILTER: AttendanceHistoryFilter = {
  employeeId: '',
  startDate: '',
  endDate: '',
  statuses: [],
  workLocation: null,
  leaveType: null,
  shiftType: null,
  exceptionFlags: [],
  department: null,
  employmentType: null,
};

// Handy for displaying the channel enum in the table
export const ATTENDANCE_CHANNEL_LABELS: Record<number, string> = {
  1: 'Web',
  2: 'Mobile',
  3: 'Kiosk',
  4: 'Biometric',
};

// Option lists for the filter bar dropdowns
export const ATTENDANCE_STATUS_OPTIONS: AttendanceStatus[] = [
  'Present',
  'Absent',
  'Late',
  'Half-day',
  'On Leave',
  'Holiday',
];

export const WORK_LOCATION_OPTIONS: WorkLocation[] = [
  'Office',
  'Remote / WFH',
  'On Site / Client Location',
  'Hybrid',
];

export const LEAVE_TYPE_OPTIONS: LeaveType[] = [
  'Casual Leave',
  'Sick Leave',
  'Paid Time Off (PTO)',
  'Maternity/Paternity',
  'Unpaid Leave',
];

export const SHIFT_TYPE_OPTIONS: ShiftType[] = [
  'Morning',
  'Evening',
  'Night',
  'Flexible',
  'Rotational',
];

export const EXCEPTION_FLAG_OPTIONS: ExceptionFlag[] = [
  'Overtime Worked',
  'Short Hours',
  'Late Arrival',
  'Early Departure',
  'Missing Punch / Check-out',
];

export const DEPARTMENT_OPTIONS: Department[] = [
  'Engineering',
  'HR',
  'Sales',
  'Marketing',
  'Finance',
  'Operations',
];

export const EMPLOYMENT_TYPE_OPTIONS: EmploymentType[] = [
  'Full-Time',
  'Part-Time',
  'Contractor',
  'Intern',
];