import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { LoadingService } from '../../../../core/services/loading.service';
import { AuthService } from '../../../(public)/auth/services/auth.service';
import {
  AdminDashboardResponse,
  DashboardData,
  EmployeeDashboardResponse,
} from '../dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService);
  private readonly apiUrl = '/api/Dashboard';

  #data = signal<DashboardData | null>(null);
  data = this.#data.asReadonly();

  isAdmin = computed(() =>
    (this.authService.currentUser()?.employeeInfo?.roles ?? []).includes('Admin'),
  );

  /** True once the dashboard payload has loaded and the employee has at least one direct report. */
  isManager = computed(() => (this.data()?.teamMembers.length ?? 0) > 0);

  load(): Observable<DashboardData | null> {
    const isAdmin = this.isAdmin();
    const url = isAdmin ? `${this.apiUrl}/admin` : `${this.apiUrl}/employee`;

    this.loadingService.showLoading();
    return this.http
      .get<ApiResponse<AdminDashboardResponse | EmployeeDashboardResponse>>(url)
      .pipe(
        map((response) => {
          if (!response.isSuccess || !response.data) {
            this.#data.set(null);
            return null;
          }

          const normalized = isAdmin
            ? this.normalizeAdmin(response.data as AdminDashboardResponse)
            : this.normalizeEmployee(response.data as EmployeeDashboardResponse);

          this.#data.set(normalized);
          return normalized;
        }),
        finalize(() => this.loadingService.stopLoading()),
      );
  }

  private normalizeAdmin(dto: AdminDashboardResponse): DashboardData {
    return {
      cards: dto.cards,
      employeeProfile: dto.employeeProfile,
      shiftHistory: dto.shiftHistory ?? [],
      leaveBalances: dto.remainingLeaves ?? [],
      holidayCalendar: dto.holidayCalendar ?? [],
      teamMembers: dto.teamMembers ?? [],
      pendingApprovalsTeamMembers: dto.pendingApprovalsTeamMembers ?? [],
    };
  }

  private normalizeEmployee(dto: EmployeeDashboardResponse): DashboardData {
    return {
      cards: null,
      employeeProfile: dto.employeeProfile,
      shiftHistory: dto.shiftHistory ?? [],
      leaveBalances: dto.leaveBalances ?? [],
      holidayCalendar: dto.holidayCalendar ?? [],
      teamMembers: dto.teamMembers ?? [],
      pendingApprovalsTeamMembers: dto.pendingApprovalsTeamMembers ?? [],
    };
  }
}
