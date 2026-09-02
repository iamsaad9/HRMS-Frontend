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