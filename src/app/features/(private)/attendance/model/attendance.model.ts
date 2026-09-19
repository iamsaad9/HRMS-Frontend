// attendance-model.ts

// Mirrors backend DepartmentAttendanceLogDto (Modules.Attendance/Application/DTOs/AttendanceDTOs.cs) -
// deliberately lightweight (no punches) for department/team daily-log views.
export interface DepartmentDailyLogEntry {
  employeeId: string;
  fullName: string;
  designation: string;
  date: string;
  status: string;
  firstIn: string | null;
  lastOut: string | null;
  lateMinutes: number;
  earlyExitMinutes?: number;
  overtimeMinutes?: number;
  earlyInMinutes?: number;
  shiftName?: string | null;
  remarks?: string | null;
  breakIn?: string | null;
  breakOut?: string | null;
}

// Mirrors backend ShiftHistoryDto (Modules.Attendance/Application/DTOs/DashboardDTOs.cs)
export interface ShiftHistoryEntry {
  shiftAssignmentId: string;
  shiftId: string;
  shiftCode: string;
  shiftName: string;
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  effectiveFrom: string;
  effectiveTo: string | null;
  isCurrent: boolean;
}

/* ==========================================================================
   1. ENUMS & CORE DOMAIN TYPES
   ========================================================================== */

export enum AttendanceChannelType {
  Web = 1,
  Mobile = 2,
  Kiosk = 3,
  Biometric = 4,
}

export enum PunchType {
  ClockIn = 1,
  ClockOut = 2,
  BreakStart = 3,
  BreakEnd = 4,
}

export type AdjustmentStatus = 'Pending' | 'Approved' | 'Rejected';

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
  | 'Early Arrival'
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


/* ==========================================================================
   2. DOMAIN MODELS & DTOs (Read / Response Shapes)
   ========================================================================== */

// --- Attendance Records ---
export interface PunchResponseDto {
  id: string;
  punchTime: string;
  punchType: string | PunchType;
  punchChannel: string | AttendanceChannelType;
  // The attendance "slot" date the backend actually attributed this punch to - only populated on
  // the live punch() response, not on punches read back inside a day's history/detail record.
  attendanceDate?: string;
}

export interface DailyAttendance {
  id: string;
  employeeId: string;
  date: string;
  status?: string;
  firstIn: string | null;
  lastOut: string | null;
  workingHours: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeHours: number;
  remarks: string;
  isLate: boolean;
  isEarlyExit: boolean;
  punches: PunchResponseDto[];
  adjustmentStatus: string | null;
  adjustmentId: string | null;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status?: string;
  firstIn: string;
  lastOut: string;
  totalHoursWorked: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeMinutes: number;
  earlyInMinutes: number;
  shiftName: string | null;
  remarks: string;
  punches: PunchResponseDto[];
  adjustmentStatus: string | null;
  adjustmentId: string | null;
  leaveTypeId?: string | null;
  leaveTypeName?: string | null;
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

// --- Shift Models ---
export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodLateMinutes: number;
  gracePeriodEarlyExitMinutes: number;
  isActive: boolean;
  isDefault: boolean;
}

// --- Regularization / Adjustment Models ---
export interface RequestedPunch {
  id: string;
  requestedPunchTime: string;
  requestedPunchType: PunchType;
}

export interface AdjustmentPunchResponse {
  id: string;
  requestedPunchType: PunchType;
  requestedPunchTime: string;
}


export interface AttendanceAdjustmentResponseDto {
  id: string;
  employeeId: string;
  attendanceDate: string;
  reason: string;
  status: AdjustmentStatus;
  adminRemarks?: string | null;
  createdAtUtc: string;
  punches: RequestedPunch[];
}


/* ==========================================================================
   3. COMMANDS (POST / PUT Payloads) & FORMS
   ========================================================================== */

export interface PunchCommand {
  employeeId: string;
  punchType: PunchType;
  punchChannel: AttendanceChannelType;
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
  isDefault?: boolean;
}

export interface AssignShiftCommand {
  employeeId: string;
  shiftId: string;
  effectiveFrom: string; // yyyy-MM-dd
  effectiveTo: string | null;
}

export interface AdjustmentActionCommand {
  actionByUserId: string;
  remarks: string | null;
}

export interface AttendanceAdjustmentForm {
  employeeId: string;
  attendanceDate: string;
  reason: string;
  punches: RequestedPunch[];
}


/* ==========================================================================
   4. QUERY PARAMS & FILTERS
   ========================================================================== */

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

export interface AttendanceHistoryFilter {
  employeeId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  statuses: AttendanceStatus[];
  workLocation: WorkLocation | null;
  leaveTypeId: string | null;
  shiftType: ShiftType | null;
  exceptionFlags: ExceptionFlag[];
  department: Department | null;
  employmentType: EmploymentType | null;
}


/* ==========================================================================
   5. CONSTANTS & DICTIONARIES
   ========================================================================== */

export const EMPTY_ATTENDANCE_HISTORY_FILTER: AttendanceHistoryFilter = {
  employeeId: '',
  startDate: '',
  endDate: '',
  statuses: [],
  workLocation: null,
  leaveTypeId: null,
  shiftType: null,
  exceptionFlags: [],
  department: null,
  employmentType: null,
};

export const ATTENDANCE_CHANNEL_LABELS: Record<number, string> = {
  1: 'Web',
  2: 'Mobile',
  3: 'Kiosk',
  4: 'Biometric',
};

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
  'Early Arrival',
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








// Admin Attendance View model

export interface DepartmentAttendanceFilter {
  departmentId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
}

export const EMPTY_DEPARTMENT_ATTENDANCE_FILTER: DepartmentAttendanceFilter = {
  departmentId: '',
  startDate: '',
  endDate: '',
};


// One row = one employee's attendance for a single day.
export interface DepartmentAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  date: string; // yyyy-MM-dd
  firstIn: string | null;
  lastOut: string | null;
  totalHoursWorked: number | null;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeHours: number;
  overtimeMinutes?: number;
  earlyInMinutes?: number;
  shiftName?: string | null;
  remarks?: string | null;
  breakIn?: string | null;
  breakOut?: string | null;
  status: string;
}

// Quick-info stats for the department, scoped to the day currently being viewed.
export interface DepartmentDaySummary {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  avgWorkingHours: number;
  totalOvertimeHours: number;
}