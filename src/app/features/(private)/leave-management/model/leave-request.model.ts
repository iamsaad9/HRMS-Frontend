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
  userId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  // durationType: DurationType;
  // halfDayPeriod?: HalfDayPeriod;
  // customHours?: { startTime: string; endTime: string };
}



export interface LeaveRequestResponseDto extends LeaveRequestPayload {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAtUtc: string;
  adminRemarks?: string;
}