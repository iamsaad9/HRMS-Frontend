import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { AttendanceService } from './attendance.service';
import { AuthService } from '../../../(public)/auth/services/auth.service';
import { AttendanceChannelType, DailyAttendance, PunchType } from '../model/attendance.model';
import { ApiResponse } from '../../../../core/models/api-response.model';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let httpMock: HttpTestingController;
  let currentUser: WritableSignal<{ employeeInfo: { id: string } } | null>;

  beforeEach(() => {
    currentUser = signal<{ employeeInfo: { id: string } } | null>({
      employeeInfo: { id: 'emp-1' },
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser } },
      ],
    });

    service = TestBed.inject(AttendanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Regression test: currentUserId used to be a plain field captured once at construction,
  // before the session/user had loaded, so it stayed empty after a page refresh.
  it('currentUserId tracks the authenticated user live, rather than a snapshot taken at construction', () => {
    expect(service.currentUserId()).toBe('emp-1');

    currentUser.set({ employeeInfo: { id: 'emp-2' } });

    expect(service.currentUserId()).toBe('emp-2');
  });

  it('currentUserId is undefined before the session has loaded, then updates once it does', () => {
    currentUser.set(null);
    expect(service.currentUserId()).toBeUndefined();

    currentUser.set({ employeeInfo: { id: 'emp-3' } });
    expect(service.currentUserId()).toBe('emp-3');
  });

  describe('getCurrentMonth', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    // Regression test: getCurrentMonth() used to hardcode the end date to day 30,
    // which clips 31-day months short and rolls Feb over into March.
    it('requests through the real last day of a 31-day month, not day 30', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 10)); // August 10, 2026 - August has 31 days

      service.getCurrentMonth().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/Attendance/history' && r.params.get('endDate') === '2026-08-31',
      );
      expect(req.request.params.get('startDate')).toBe('2026-08-01');
      req.flush({ isSuccess: true, data: [], message: '' } satisfies ApiResponse<DailyAttendance[]>);
    });

    it('requests through the real last day of a 28-day February, without rolling into March', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 1, 10)); // February 10, 2026 - not a leap year, 28 days

      service.getCurrentMonth().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/Attendance/history' && r.params.get('endDate') === '2026-02-28',
      );
      req.flush({ isSuccess: true, data: [], message: '' } satisfies ApiResponse<DailyAttendance[]>);
    });

    it('scopes the request to the currently authenticated employee', () => {
      service.getCurrentMonth().subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/Attendance/history');
      expect(req.request.params.get('employeeId')).toBe('emp-1');
      req.flush({ isSuccess: true, data: [], message: '' } satisfies ApiResponse<DailyAttendance[]>);
    });
  });

  describe('punch', () => {
    it("re-fetches and upserts today's record into currentMonth on a successful punch", () => {
      const punchResponse: ApiResponse<any> = {
        isSuccess: true,
        data: { id: 'punch-1', punchTime: new Date().toISOString(), punchType: 'In', punchChannel: 'Web' },
        message: '',
      };
      const today = new Date().toISOString().split('T')[0];
      const dailyRecord: DailyAttendance = {
        id: 'day-1',
        employeeId: 'emp-1',
        date: today,
        firstIn: '09:00:00',
        lastOut: null,
        workingHours: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeHours: 0,
        remarks: '',
        isLate: false,
        isEarlyExit: false,
        punches: [],
        adjustmentStatus: null,
        adjustmentId: null,
      };

      let result: ApiResponse<any> | undefined;
      service
        .punch({
          employeeId: 'emp-1',
          punchType: PunchType.ClockIn,
          punchChannel: AttendanceChannelType.Web,
          deviceId: null,
          latitude: null,
          longitude: null,
        })
        .subscribe((r) => (result = r));

      httpMock.expectOne('/api/Attendance/punch').flush(punchResponse);
      httpMock
        .expectOne((r) => r.url === `/api/Attendance/daily/emp-1/${today}`)
        .flush({ isSuccess: true, data: dailyRecord, message: '' } satisfies ApiResponse<DailyAttendance>);

      expect(result).toEqual(punchResponse);
      expect(service.currentMonth()).toEqual([dailyRecord]);
    });

    it('does not attempt to fetch daily attendance when the punch itself fails', () => {
      const failure: ApiResponse<any> = { isSuccess: false, data: null, message: 'Already punched in' };

      service
        .punch({
          employeeId: 'emp-1',
          punchType: PunchType.ClockIn,
          punchChannel: AttendanceChannelType.Web,
          deviceId: null,
          latitude: null,
          longitude: null,
        })
        .subscribe();

      httpMock.expectOne('/api/Attendance/punch').flush(failure);
      httpMock.expectNone((r) => r.url.startsWith('/api/Attendance/daily/'));
    });
  });

  it('getShiftHistory requests the given employee via query param', () => {
    service.getShiftHistory('emp-7').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/Attendance/shift-history');
    expect(req.request.params.get('employeeId')).toBe('emp-7');
    req.flush({ isSuccess: true, data: [], message: '' });
  });
});
