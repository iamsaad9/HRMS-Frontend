import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';

// Mirrors backend LeaveAllocationDto
export interface LeaveAllocationRow {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  adjustedDays: number;
  remainingBalance: number;
}

// Mirrors backend LeaveAdjustmentLogDto
export interface LeaveAdjustmentLog {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  adjustmentDays: number;
  reason: string;
  approvedBy: string;
  approvedByName: string;
  createdAtUtc: string;
}

export interface AdjustLeaveBalanceCommand {
  employeeId: string;
  leaveTypeId: string;
  adjustmentDays: number;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveAdjustmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/Attendance';

  getAllBalances(year?: number): Observable<ApiResponse<LeaveAllocationRow[]>> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http.get<ApiResponse<LeaveAllocationRow[]>>(`${this.apiUrl}/leave-balances`, { params });
  }

  getEmployeeBalances(employeeId: string, year?: number): Observable<ApiResponse<LeaveAllocationRow[]>> {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    return this.http.get<ApiResponse<LeaveAllocationRow[]>>(`${this.apiUrl}/leave-balances/${employeeId}`, {
      params,
    });
  }

  getAdjustmentLog(employeeId: string): Observable<ApiResponse<LeaveAdjustmentLog[]>> {
    return this.http.get<ApiResponse<LeaveAdjustmentLog[]>>(
      `${this.apiUrl}/leave-balances/${employeeId}/adjustments`,
    );
  }

  adjustBalance(command: AdjustLeaveBalanceCommand): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/leave-balances/adjust`, command);
  }
}
