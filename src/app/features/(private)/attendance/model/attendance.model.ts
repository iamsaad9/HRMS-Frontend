// attendance-model.ts

// ---------- Enums ----------
export enum AttendanceChannelType {
  Web = 1,
  Mobile = 2,
  Kiosk = 3,
  Biometric = 4,
}


// Adjustmnets

export enum PunchType {
    ClockIn= 0,
  ClockOut= 1,
  BreakStart=3,
  BreakEnd=4
};

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

export interface PunchResponseDto {
  id: string;
  punchType:string;
  punchTime:string;
  channel:string;
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
  punches: PunchResponseDto[];
}

// ---------- Commands (requests) ----------
export interface PunchCommand {
  employeeId: string;
  punchType:PunchType;
  channel: AttendanceChannelType;
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
  channel: AttendanceChannelType;
  status?: string; 
  totalHours?: number;
}



export interface DailyAttendance {
  id:string;
  employeeId: string;
  date: string;
  status?: string;
  firstIn: string | null;
  lastOut: string | null;
  totalHoursWorked: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeHours: number;
  remarks:string;
  punches:PunchResponseDto[]
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

export type LeaveType =
  | 'annual' | 'sick' | 'wfh' | 'unpaid' | 'maternity'
  | 'paternity' | 'casual' | 'others';


