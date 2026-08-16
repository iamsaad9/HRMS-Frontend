// Leave Type

export interface LeaveTypeResponse{
  id:string;
  code:string;
  name:string;
  defaultAllocatedDays:number;
  isEncashable:boolean;
  isActive:boolean;
}


// Leave Request

export type DurationType = 'full_day' | 'half_day' | 'custom_hours';
export type HalfDayPeriod = 'first_half' | 'second_half';

export interface LeaveRequestPayload {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  // durationType: DurationType;
  // halfDayPeriod?: HalfDayPeriod;
  // customHours?: { startTime: string; endTime: string };
}



export interface LeaveRequestResponse {
  id: string;
   employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
   startDate: string;
  endDate: string;
  totalDays:number;
  reason:string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAtUtc: string;
}

export interface ApproveRejectLeaveRequest {
  approvedByEmployeeId: string;
  remarks: string | null;
}