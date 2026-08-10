// attendance-model.ts

// ---------- Enums ----------
export enum AttendanceChannel {
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

export enum AdjustmentStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
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

// attendance-model.ts (additions)

export interface AttendanceHistoryFilter {
  employeeId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
}

export const EMPTY_ATTENDANCE_HISTORY_FILTER: AttendanceHistoryFilter = {
  employeeId: '',
  startDate: '',
  endDate: '',
};

// Handy for displaying the channel enum in the table
export const ATTENDANCE_CHANNEL_LABELS: Record<number, string> = {
  1: 'Web',
  2: 'Mobile',
  3: 'Kiosk',
  4: 'Biometric',
};