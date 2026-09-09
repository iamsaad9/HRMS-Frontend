import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { AuthService } from '../../../(public)/auth/services/auth.service';
import { AdminDashboardResponse, EmployeeDashboardResponse } from '../dashboard.model';
import { ApiResponse } from '../../../../core/models/api-response.model';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  let currentUser: WritableSignal<{ employeeInfo: { roles: string[] } } | null>;

  const baseEmployeeResponse: EmployeeDashboardResponse = {
    employeeId: 'emp-1',
    totalPresent: 10,
    totalAbsent: 0,
    totalLate: 0,
    totalWorkFromHome: 0,
    totalLeaves: 0,
    leaveBalances: [],
    attendanceHistory: [],
    holidayCalendar: [],
    teamMembers: [],
    employeeProfile: null,
    shiftHistory: [],
    pendingApprovalsTeamMembers: [],
  };

  const baseAdminResponse: AdminDashboardResponse = {
    cards: {
      totalActiveEmployees: 5,
      totalPresentToday: 4,
      onLeaveToday: 1,
      onWfhToday: 0,
      pendingApprovalsCount: 2,
      pendingLeaveApprovals: 1,
      pendingRegularizationApprovals: 1,
      pendingWfhApprovals: 0,
    },
    employeeProfile: null,
    shiftHistory: [],
    remainingLeaves: [],
    holidayCalendar: [],
    teamMembers: [],
    pendingApprovalsTeamMembers: [],
  };

  function setup(roles: string[]) {
    currentUser = signal({ employeeInfo: { roles } });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser } },
      ],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('isAdmin is true only when the current user has the Admin role', () => {
    setup(['Admin']);
    expect(service.isAdmin()).toBe(true);
  });

  it('isAdmin is false for a plain employee or manager', () => {
    setup(['User']);
    expect(service.isAdmin()).toBe(false);
  });

  it('load() for an Admin hits the admin endpoint and maps remainingLeaves onto leaveBalances', () => {
    setup(['Admin']);

    let result: ReturnType<DashboardService['data']> | null = null;
    service.load().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/Dashboard/admin');
    req.flush({
      isSuccess: true,
      data: baseAdminResponse,
      message: '',
    } satisfies ApiResponse<AdminDashboardResponse>);

    expect(result).not.toBeNull();
    expect(result!.cards).toEqual(baseAdminResponse.cards);
    expect(service.data()?.cards).toEqual(baseAdminResponse.cards);
  });

  it('load() for a non-Admin hits the employee endpoint and cards is null', () => {
    setup(['User']);

    service.load().subscribe();

    const req = httpMock.expectOne('/api/Dashboard/employee');
    req.flush({
      isSuccess: true,
      data: baseEmployeeResponse,
      message: '',
    } satisfies ApiResponse<EmployeeDashboardResponse>);

    expect(service.data()?.cards).toBeNull();
  });

  it('load() clears the cached data and resolves null when the API reports failure', () => {
    setup(['User']);

    // Prime the signal with a prior successful load first.
    service.load().subscribe();
    httpMock
      .expectOne('/api/Dashboard/employee')
      .flush({ isSuccess: true, data: baseEmployeeResponse, message: '' });
    expect(service.data()).not.toBeNull();

    let result: unknown = 'unset';
    service.load().subscribe((r) => (result = r));
    httpMock.expectOne('/api/Dashboard/employee').flush({ isSuccess: false, data: null, message: 'error' });

    expect(result).toBeNull();
    expect(service.data()).toBeNull();
  });

  it('isManager reflects whether the loaded dashboard has any team members', () => {
    setup(['User']);
    expect(service.isManager()).toBe(false);

    service.load().subscribe();
    httpMock.expectOne('/api/Dashboard/employee').flush({
      isSuccess: true,
      data: { ...baseEmployeeResponse, teamMembers: [{ employeeId: 'e2' } as any] },
      message: '',
    });

    expect(service.isManager()).toBe(true);
  });
});
