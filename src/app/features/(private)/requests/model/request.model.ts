import { TuiDay } from '@taiga-ui/cdk';

export type RequestType = 'leave' | 'wfh' | 'regularization';
export type HalfDayType = 'first_half' | 'second_half';

export interface LeaveWfhLineItem {
  date: string;              // ISO date, formatted on submit
  isHalfDay: boolean;
  halfDayType: HalfDayType | null;
}

export interface RegularizationLineItem {
  date: string;
  requestedClockIn: string | null;
  requestedClockOut: string | null;
  requestedBreakIn: string | null;
  requestedBreakOut: string | null;
  remarks: string;
}

export interface NewRequestPayload {
  requestType: RequestType;
  employeeId: string;
  reason: string;
  startDate: string;
  endDate: string;
  leaveTypeId?: string;
  lineItems?: LeaveWfhLineItem[] | RegularizationLineItem[];
}

// General Request Response
export interface RequestResponse {
  id: string;
  requestType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  overallStatus: 'Pending' | 'Approved' | 'Rejected';
  currentStepOrder: number;
  createdAtUtc: string;
}
 

// Single Request Response

export interface GetRequestByIdResponse<T extends RequestDetail = RequestDetail> {
  data: RequestData<T>;
}

export interface RequestData<T extends RequestDetail> {
  requestType: 'WorkFromHome' | 'Leave' | 'AttendanceRegularization';
  overallStatus: number;
  currentStepOrder: number;
  totalSteps: number;
  requestReason: string;
  createdAtUtc: string;
  details: T[];
}

// Base shared properties across all detail types
export interface BaseDetail {
  detailId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  approvalRequestId: string;
  overallStatus: number;
  currentStepOrder: number;
  totalSteps: number;
  approvalReason: string;
}

// 1. Work From Home Detail
export interface WorkFromHomeDetail extends BaseDetail {
  date: string;
  isHalfDay: boolean;
  halfDayType: number;
  dayCount: number;
  workFromHomeRequestId: string;
  requestCreatedAtUtc: string;
}

// 2. Leave Detail
export interface LeaveDetail extends BaseDetail {
  date: string;
  isHalfDay: boolean;
  halfDayType: number;
  dayCount: number;
  leaveApplicationId: string;
  leaveTypeId: string;
  applicationCreatedAtUtc: string;
}

// 3. Attendance Regularization Detail
export interface AttendanceRegularizationDetail extends BaseDetail {
  date: string;
  requestedClockIn: string | null;
  requestedClockOut: string | null;
  requestedBreakIn: string | null;
  requestedBreakOut: string | null;
  attendanceRegularizationId: string;
  requestCreatedAtUtc: string;
}

// Union type for details
export type RequestDetail = 
  | WorkFromHomeDetail 
  | LeaveDetail 
  | AttendanceRegularizationDetail;