import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RequestsService } from './request.service';
import { AuthService } from '../../../(public)/auth/services/auth.service';
import { RequestType } from '../model/request.model';

describe('RequestsService', () => {
  let service: RequestsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { currentUser: () => ({ employeeInfo: { id: 'approver-1' } }) },
        },
      ],
    });

    service = TestBed.inject(RequestsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const routeSegmentCases: [RequestType, string][] = [
    ['leave', 'leaves'],
    ['wfh', 'work-from-home'],
    ['regularization', 'attendance-regularization'],
  ];

  describe('approve', () => {
    it.each(routeSegmentCases)('routes %s approvals to /%s/{id}/approve', (type, segment) => {
      service.approve(type, 'req-1', { remarks: 'looks good' }).subscribe();

      const req = httpMock.expectOne(`/api/Attendance/${segment}/req-1/approve`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ approvedByEmployeeId: 'approver-1', remarks: 'looks good' });
      req.flush({ isSuccess: true, data: true, message: '' });
    });
  });

  describe('reject', () => {
    it.each(routeSegmentCases)('routes %s rejections to /%s/{id}/reject', (type, segment) => {
      service.reject(type, 'req-1', { remarks: 'missing details' }).subscribe();

      const req = httpMock.expectOne(`/api/Attendance/${segment}/req-1/reject`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rejectedByEmployeeId: 'approver-1', remarks: 'missing details' });
      req.flush({ isSuccess: true, data: true, message: '' });
    });

    it('defaults remarks to an empty string when none is given', () => {
      service.reject('leave', 'req-1', { remarks: null }).subscribe();

      const req = httpMock.expectOne('/api/Attendance/leaves/req-1/reject');
      expect(req.request.body).toEqual({ rejectedByEmployeeId: 'approver-1', remarks: '' });
      req.flush({ isSuccess: true, data: true, message: '' });
    });
  });

  describe('cancel', () => {
    it.each(routeSegmentCases)('sends a DELETE to /%s/{id} scoped to the current employee', (type, segment) => {
      service.cancel(type, 'req-1').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `/api/Attendance/${segment}/req-1` && r.method === 'DELETE',
      );
      expect(req.request.params.get('employeeId')).toBe('approver-1');
      req.flush({ isSuccess: true, data: true, message: '' });
    });
  });

  it('getAllMyRequests omits the employeeId param when none is passed', () => {
    service.getAllMyRequests().subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/Attendance/my-requests');
    expect(req.request.params.has('employeeId')).toBe(false);
    req.flush({ isSuccess: true, data: [], message: '' });
  });

  it('getAllMyRequests includes the employeeId param when passed', () => {
    service.getAllMyRequests('emp-9').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/Attendance/my-requests');
    expect(req.request.params.get('employeeId')).toBe('emp-9');
    req.flush({ isSuccess: true, data: [], message: '' });
  });

  it('getManagerPendingRequests scopes by managerId', () => {
    service.getManagerPendingRequests('mgr-1').subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/Attendance/manager/pending-requests');
    expect(req.request.params.get('managerId')).toBe('mgr-1');
    req.flush({ isSuccess: true, data: [], message: '' });
  });

  it('getHrPendingRequests and getAllPendingRequests hit their fixed endpoints', () => {
    service.getHrPendingRequests().subscribe();
    httpMock.expectOne('/api/Attendance/hr/pending-requests').flush({ isSuccess: true, data: [], message: '' });

    service.getAllPendingRequests().subscribe();
    httpMock
      .expectOne('/api/Attendance/admin/pending-requests')
      .flush({ isSuccess: true, data: [], message: '' });
  });
});
