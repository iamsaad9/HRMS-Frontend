import { Employee } from '../employees/model/employee.model';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KpiCard {
  id: string;
  title: string;
  value: string | number;
  changeLabel: string;
  trend: TrendDirection;
  subtext?: string;
  icon: 'users' | 'calendar-check' | 'dollar-sign' | 'clock';
}

// Mirrors backend AdminDashboardCardsDto (Modules.Attendance/Application/DTOs/DashboardDTOs.cs)
export interface DashboardCards {
  totalActiveEmployees: number;
  totalPresentToday: number;
  onLeaveToday: number;
  onWfhToday: number;
  pendingApprovalsCount: number;
  pendingLeaveApprovals: number;
  pendingRegularizationApprovals: number;
  pendingWfhApprovals: number;
}

// Mirrors backend ShiftHistoryDto
export interface DashboardShiftHistoryEntry {
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

// Mirrors backend LeaveBalanceDto
export interface DashboardLeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  adjustmentDays: number;
  totalEntitlement: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

// Mirrors backend HolidayDto
export interface DashboardHoliday {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  isOptional: boolean;
}

// Mirrors backend TeamMemberDto
export interface DashboardTeamMember {
  employeeId: string;
  fullName: string;
  designation: string;
  departmentName: string;
  departmentId: string | null;
  workEmail: string;
  staffNo: string;
}

// Mirrors backend PendingApprovalDto
export interface DashboardPendingApproval {
  approvalRequestId: string;
  entityId: string;
  requestType: string;
  requesterName: string;
  departmentName: string;
  currentStepOrder: number;
  submittedDate: string;
  summary: string;
}

/** Raw shape of GET api/Dashboard/employee | manager */
export interface EmployeeDashboardResponse {
  employeeId: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalWorkFromHome: number;
  totalLeaves: number;
  leaveBalances: DashboardLeaveBalance[];
  attendanceHistory: unknown[];
  holidayCalendar: DashboardHoliday[];
  teamMembers: DashboardTeamMember[];
  employeeProfile: Employee | null;
  shiftHistory: DashboardShiftHistoryEntry[];
  pendingApprovalsTeamMembers: DashboardPendingApproval[];
}

/** Raw shape of GET api/Dashboard/admin */
export interface AdminDashboardResponse {
  cards: DashboardCards;
  employeeProfile: Employee | null;
  shiftHistory: DashboardShiftHistoryEntry[];
  remainingLeaves: DashboardLeaveBalance[];
  holidayCalendar: DashboardHoliday[];
  teamMembers: DashboardTeamMember[];
  pendingApprovalsTeamMembers: DashboardPendingApproval[];
}

/** Normalized shape every dashboard component consumes, regardless of which endpoint served it. */
export interface DashboardData {
  cards: DashboardCards | null; // null for a non-Admin (Employee/Manager) dashboard
  employeeProfile: Employee | null;
  shiftHistory: DashboardShiftHistoryEntry[];
  leaveBalances: DashboardLeaveBalance[];
  holidayCalendar: DashboardHoliday[];
  teamMembers: DashboardTeamMember[];
  pendingApprovalsTeamMembers: DashboardPendingApproval[];
}
