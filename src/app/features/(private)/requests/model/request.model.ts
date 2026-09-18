import { TuiDay } from '@taiga-ui/cdk';

export type RequestType = 'leave' | 'wfh' | 'regularization';
export type HalfDayType = 'first_half' | 'second_half';

/** Maps the backend's RequestType string (as seen on RequestData/RequestResponse) to the frontend union. */
export function toRequestType(backendType: string): RequestType | null {
  switch (backendType) {
    case 'Leave':
      return 'leave';
    case 'WorkFromHome':
      return 'wfh';
    case 'AttendanceRegularization':
    case 'Regularization':
      return 'regularization';
    default:
      return null;
  }
}

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

// Backend's Update* endpoints only accept a header-level re-shape (Leave/WFH: a new date range;
// Regularization: a fresh set of line items) - they regenerate day-by-day details server-side
// rather than accepting per-day edits for Leave/WFH.
export interface UpdateLeavePayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface UpdateWorkFromHomePayload {
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface UpdateAttendanceRegularizationPayload {
  lineItems: RegularizationLineItem[];
  reason: string | null;
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
  requesterEmployeeId: string;
  requesterName: string;
  departmentName: string;
  leaveTypeName: string | null;
}
 
// Top-level API Response wrapper
export interface ApiResponse<T extends RequestDetail = RequestDetail> {
  data: RequestData<T>;
  isSuccess: boolean;
  message: string;
}

export type GetRequestByIdResponse<T extends RequestDetail = RequestDetail> = RequestData<T>;

export interface RequestApprovalStep {
  stepOrder: number;
  approverType: string;
  stepAction: string;
  approverEmployeeId: string | null;
  approverName: string | null;
  comments: string | null;
  actionAtUtc: string | null;
}

export interface RequestData<T extends RequestDetail> {
  moduleEntityId: string;
  requestType: 'WorkFromHome' | 'Leave' | 'AttendanceRegularization';
  requesterEmployeeId: string;
  requesterName: string;
  departmentName: string;
  designationTitle: string;
  leaveTypeId: string | null;
  leaveTypeName: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  overallStatus: number;
  currentStepOrder: number;
  totalSteps: number;
  requestReason: string;
  createdAtUtc: string;
  approvedByName: string | null;
  rejectedByName: string | null;
  approvals: RequestApprovalStep[];
  details: T[];
}

// Base shared properties across all detail line items
export interface BaseDetail {
  detailId: string;
  date: string;
}

// 1. Leave Detail Line Item
export interface LeaveDetail extends BaseDetail {
  isHalfDay: boolean;
  halfDayType: number;
  dayCount: number;
  leaveTypeId: string;
}

// 2. Work From Home Detail Line Item
export interface WorkFromHomeDetail extends BaseDetail {
  isHalfDay: boolean;
  halfDayType: number;
  dayCount: number;
}

// 3. Attendance Regularization Detail Line Item
export interface AttendanceRegularizationDetail extends BaseDetail {
  requestedClockIn: string | null;
  requestedClockOut: string | null;
  requestedBreakIn: string | null;
  requestedBreakOut: string | null;
  remarks: string | null;
}

// Union type for details
export type RequestDetail =
  | LeaveDetail
  | WorkFromHomeDetail
  | AttendanceRegularizationDetail;

// --- Updated Type Guards ---

export function isLeaveDetail(detail: RequestDetail): detail is LeaveDetail {
  return 'leaveTypeId' in detail;
}

export function isAttendanceRegularizationDetail(
  detail: RequestDetail,
): detail is AttendanceRegularizationDetail {
  return 'requestedClockIn' in detail;
}

export function isWorkFromHomeDetail(detail: RequestDetail): detail is WorkFromHomeDetail {
  return 'isHalfDay' in detail && !('leaveTypeId' in detail);
}