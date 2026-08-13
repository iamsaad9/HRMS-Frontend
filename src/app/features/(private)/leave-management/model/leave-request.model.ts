// Leave Request

export type LeaveType =
  | 'annual' | 'sick' | 'wfh' | 'unpaid' | 'maternity'
  | 'paternity' | 'casual' | 'others';

export type DurationType = 'full_day' | 'half_day' | 'custom_hours';
export type HalfDayPeriod = 'first_half' | 'second_half';

export interface LeaveRequestPayload {
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationType: DurationType;
  halfDayPeriod?: HalfDayPeriod;
  customHours?: { startTime: string; endTime: string };
  reason: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  wfh: 'Work From Home',
  unpaid: 'Unpaid Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  casual: 'Casual Leave',
  others: 'Others',
};

export const LEAVE_TYPE_OPTIONS: string[] = Object.values(LEAVE_TYPE_LABELS);

export function leaveTypeToLabel(type: LeaveType | null): string {
  return type ? LEAVE_TYPE_LABELS[type] : '';
}

export function labelToLeaveType(label: string): LeaveType {
  const entry = Object.entries(LEAVE_TYPE_LABELS).find(([, value]) => value === label);
  if (!entry) throw new Error(`Unknown leave type label: ${label}`);
  return entry[0] as LeaveType;
}

export interface LeaveRequestResponseDto extends LeaveRequestPayload {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAtUtc: string;
  adminRemarks?: string;
}