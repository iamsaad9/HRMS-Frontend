// attendance.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { LoadingService } from '../../../../core/services/loading.service';
import {
  AdjustmentActionCommand,
  AdjustmentListParams,
  AssignShiftCommand,
  AttendanceAdjustmentForm,
  AttendanceAdjustmentResponseDto,
  AttendanceExportParams,
  AttendanceHistoryParams,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceSummaryParams,
  CreateShiftCommand,
  DailyAttendance,
  DepartmentDailyLogEntry,
  PunchCommand,
  PunchResponseDto,
  Shift,
  ShiftHistoryEntry,
  TeamAttendanceParams,
  TeamAttendanceRecord,
} from '../model/attendance.model';
import { AuthService } from '../../../(public)/auth/services/auth.service';

const toLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = '/api/Attendance';
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthService);

  currentUserId = computed(() => this.authService.currentUser()?.employeeInfo.id);

  #adjustments = signal<AttendanceAdjustmentResponseDto[] | null>(null);
  allAdjustments = this.#adjustments.asReadonly();

  #currentMonth = signal<DailyAttendance[] | null>(null);
  currentMonth = this.#currentMonth.asReadonly();

  hasCachedAdjustments = computed(() => {
    const list = this.allAdjustments();
    return list !== null && list.length > 0;
  });

  // ---------------------------------------------------------------
  // Robust Active Shift Selector
  // ---------------------------------------------------------------
 // Matches the backend's own "slot" concept (RecordPunchAsync's openSlot/bump logic): an
 // overnight shift's DailyAttendance row is dated by when it STARTED, and stays the current
 // slot - even once the real calendar day has rolled over - until a genuinely new slot exists
 // (a fresh clock-in for today, or a bumped-forward slot once the previous shift's window has
 // passed). So "today's calendar date" is the wrong thing to match on; the latest REAL record
 // (virtual/placeholder days like a future "Absent" placeholder have id = Guid.Empty) is what's
 // actually current, whatever date it's dated.
 activeShiftRecord = computed(() => {
  const records = this.#currentMonth() ?? [];
  if (records.length === 0) {
    console.log('[activeShiftRecord] No current month records available.');
    return null;
  }

  // Local calendar date, not UTC (`toISOString()` would roll over to "tomorrow" hours before
  // local midnight for any viewer east of UTC) - only used below for the no-real-data fallback.
  const todayStr = toLocalDateStr(new Date());
  console.log(`[activeShiftRecord] Evaluating active shift. Today: ${todayStr}, Total Records: ${records.length}`);

  // A "real" record here specifically means a genuinely PUNCHED slot (firstIn set) - not just any
  // row with a non-empty id, since an approved leave/WFH day also gets a real DailyAttendance row
  // (with firstIn left null) as soon as it's approved, even for a future date. Requiring firstIn
  // keeps a future approved leave from ever outranking today's actual punched session, while
  // still never second-guessing a punched slot's date against the browser's own "today": a
  // bumped-to-next-day slot (shift ended, employee clocked in again past the shift's end) is
  // dated in UK time and can legitimately be a day ahead of the viewer's own local calendar date
  // for a few hours around midnight - the old `r.date <= todayStr` guard excluded exactly that
  // slot, leaving the card stuck on the previous, already-closed one until the browser's own
  // clock caught up.
  const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
  const realRecords = records.filter((r) => r.id && r.id !== EMPTY_GUID && !!r.firstIn);

  if (realRecords.length > 0) {
    const latestReal = realRecords.reduce((latest, r) => (r.date > latest.date ? r : latest));
    console.log('[activeShiftRecord] Latest real slot Hit -> Selected:', latestReal);
    return latestReal;
  }

  // No real attendance data at all yet this month - show today's (virtual) placeholder so the
  // card still has something sensible (e.g. "Absent"/"Weekly Off") instead of nothing.
  const todayRecord = records.find((r) => r.date === todayStr) ?? null;
  console.log('[activeShiftRecord] No real slot -> Falling back to today placeholder:', todayRecord);
  return todayRecord;
});

// Legacy replacement mapping to active shift
todayStatus = computed(() => {
  const status = this.activeShiftRecord();
  console.log('[todayStatus] Selected:', status);
  return status;
});



  isClockedIn = computed(() => !!this.todayStatus()?.punches.find((p) => p.punchType == 'In'));
  isClockedOut = computed(() => !!this.todayStatus()?.punches.find((p) => p.punchType == 'Out'));

  // Whether there's a session open RIGHT NOW - i.e. the most recent punch isn't a Clock Out -
  // matching the backend's own gate for accepting a new Clock In (RecordPunchAsync only blocks
  // In when the last punch is still open). isClockedIn/isClockedOut above just ask "did an In /
  // Out happen at all", which both stay true forever once a full shift (In...Out) has completed,
  // so they can't tell "shift finished, ready for a new one" apart from "still on shift".
  hasOpenSession = computed(() => {
    const punches = this.todayStatus()?.punches ?? [];
    return punches.length > 0 && punches[punches.length - 1].punchType !== 'Out';
  });

  isOnBreak = computed(() => this.todayStatus()?.lastOut ?? false);

private upsertDailyAttendance(todayRecord: DailyAttendance): void {
  console.log('[upsertDailyAttendance] Upserting Record:', todayRecord);
  this.#currentMonth.update((records) => {
    const list = records ?? [];

    const index = list.findIndex((day) => 
      (todayRecord.id && todayRecord.id !== '00000000-0000-0000-0000-000000000000' && day.id === todayRecord.id) ||
      day.date === todayRecord.date
    );

    if (index !== -1) {
      console.log(`[upsertDailyAttendance] Updating existing record at index ${index}`);
      return list.map((day, i) => (i === index ? todayRecord : day));
    }

    console.log('[upsertDailyAttendance] Appending new record to list');
    return [...list, todayRecord].sort((a, b) => b.date.localeCompare(a.date));
  });
}

  // ---------------------------------------------------------------
  // Punch actions (FIXED for overnight shifts)
  // ---------------------------------------------------------------
  punch(command: PunchCommand): Observable<ApiResponse<PunchResponseDto>> {
    return this.http.post<ApiResponse<PunchResponseDto>>(`${this.apiUrl}/punch`, command).pipe(
      switchMap((response) => {
        if (!response.isSuccess) {
          return of(response);
        }

        // The backend already resolved exactly which attendance "slot" date this punch belongs to
        // (RecordPunchAsync's own targetDate - e.g. yesterday's date if clocking out post-
        // midnight) - use that authoritative value instead of re-guessing it from
        // activeShiftRecord(), which still reflects state from BEFORE this punch and can point at
        // an older, already-closed slot (e.g. the first Clock-In of a new day, before today has
        // any record of its own yet), causing this upsert to silently miss today's fresh punch.
        const targetShiftDate = response.data?.attendanceDate ?? toLocalDateStr(new Date());

        return this.getDailyAttendance(command.employeeId, targetShiftDate).pipe(
          tap((todayResponse) => {
            if (todayResponse.isSuccess && todayResponse.data) {
              const todayAttendance = Array.isArray(todayResponse.data)
                ? todayResponse.data[0]
                : todayResponse.data;

              if (todayAttendance) {
                this.upsertDailyAttendance(todayAttendance);
              }
            }
          }),
          map(() => response)
        );
      })
    );
  }

  // ---------------------------------------------------------------
  // Daily / history / detail
  // ---------------------------------------------------------------
  getDailyAttendance(employeeId: string, date: string): Observable<ApiResponse<DailyAttendance>> {
    this.loadingService.showLoading();
    return this.http
      .get<ApiResponse<DailyAttendance>>(`${this.apiUrl}/daily/${employeeId}/${date}`)
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log("Active Shift Status:", this.activeShiftRecord());
          }
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        })
      );
  }

  getHistory(params: AttendanceHistoryParams): Observable<ApiResponse<AttendanceRecord[]>> {
    this.loadingService.showLoading();
    const httpParams = new HttpParams()
      .set('employeeId', params.employeeId)
      .set('startDate', params.startDate)
      .set('endDate', params.endDate);

    return this.http
      .get<ApiResponse<AttendanceRecord[]>>(`${this.apiUrl}/history`, { params: httpParams })
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            // Populate #currentMonth signal when month history is fetched
            this.#currentMonth.set(response.data as unknown as DailyAttendance[]);
          }
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        })
      );
  }


  getCurrentMonth(): Observable<ApiResponse<DailyAttendance[]>> {
    const today = new Date();

    // Set start date to the 1st of the current month, end date to the actual last day of the month
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startDate = toLocalDateStr(start);
    const endDate = toLocalDateStr(end);

    this.loadingService.showLoading();

    const httpParams = new HttpParams()
      .set('employeeId', this.currentUserId() || '')
      .set('startDate', startDate)
      .set('endDate', endDate);

    console.log('Params: ', httpParams);
    return this.http
      .get<ApiResponse<DailyAttendance[]>>(`${this.apiUrl}/history`, { params: httpParams })
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log('Current Month history:', response.data);
            this.#currentMonth.set(response.data); // Update signal/subject reference if needed
          }
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  getDepartmentDailyLog(departmentId: string, date: string): Observable<ApiResponse<DepartmentDailyLogEntry[]>> {
    const httpParams = new HttpParams().set('departmentId', departmentId).set('date', date);
    return this.http.get<ApiResponse<DepartmentDailyLogEntry[]>>(`${this.apiUrl}/department-daily-log`, {
      params: httpParams,
    });
  }

  getDepartmentDailyLogRange(
    departmentId: string,
    startDate: string,
    endDate: string,
  ): Observable<ApiResponse<DepartmentDailyLogEntry[]>> {
    const httpParams = new HttpParams()
      .set('departmentId', departmentId)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<ApiResponse<DepartmentDailyLogEntry[]>>(`${this.apiUrl}/department-daily-log/range`, {
      params: httpParams,
    });
  }

  getTeamDailyLog(managerId: string, date: string): Observable<ApiResponse<DepartmentDailyLogEntry[]>> {
    const httpParams = new HttpParams().set('managerId', managerId).set('date', date);
    return this.http.get<ApiResponse<DepartmentDailyLogEntry[]>>(`${this.apiUrl}/team-daily-log`, {
      params: httpParams,
    });
  }

  getTeamDailyLogRange(
    managerId: string,
    startDate: string,
    endDate: string,
  ): Observable<ApiResponse<DepartmentDailyLogEntry[]>> {
    const httpParams = new HttpParams()
      .set('managerId', managerId)
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<ApiResponse<DepartmentDailyLogEntry[]>>(`${this.apiUrl}/team-daily-log/range`, {
      params: httpParams,
    });
  }

  getShiftHistory(employeeId: string): Observable<ApiResponse<ShiftHistoryEntry[]>> {
    this.loadingService.showLoading();
    const httpParams = new HttpParams().set('employeeId', employeeId);
    return this.http
      .get<ApiResponse<ShiftHistoryEntry[]>>(`${this.apiUrl}/shift-history`, { params: httpParams })
      .pipe(
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  getAttendanceById(id: string): Observable<ApiResponse<DailyAttendance>> {
    this.loadingService.showLoading();
    return this.http.get<ApiResponse<DailyAttendance>>(`${this.apiUrl}/${id}`).pipe(
      finalize(() => {
        this.loadingService.stopLoading();
      }),
    );
  }

  // ---------------------------------------------------------------
  // Shifts
  // ---------------------------------------------------------------
  createShift(command: CreateShiftCommand): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/shifts`, command).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          console.log('✅ Shift created:', response.data);
        }
      }),
    );
  }

  getShifts(): Observable<ApiResponse<Shift[]>> {
    return this.http.get<ApiResponse<Shift[]>>(`${this.apiUrl}/shifts`);
  }

  assignShift(command: AssignShiftCommand): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/shift-assignments`, command);
  }

  // ---------------------------------------------------------------
  // Adjustments
  // ---------------------------------------------------------------
  createAdjustment(
    command: AttendanceAdjustmentForm,
  ): Observable<ApiResponse<AttendanceAdjustmentResponseDto>> {
    return this.http
      .post<ApiResponse<AttendanceAdjustmentResponseDto>>(`${this.apiUrl}/adjustments`, command)
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log('✅ Adjustment requested:', response.data);
            this.#adjustments.set(null); // invalidate cache
          }
        }),
      );
  }

  getAdjustments(
    params: AdjustmentListParams,
    useCache = true,
  ): Observable<ApiResponse<AttendanceAdjustmentResponseDto[]>> {
    if (useCache && this.hasCachedAdjustments()) {
      console.log('Fetched cached adjustments.');
      return of({
        isSuccess: true,
        data: this.#adjustments() ?? [],
        message: 'Retrieved from cache',
        errors: [],
      });
    }

    this.loadingService.showLoading();
    let httpParams = new HttpParams();
    if (params.employeeId) httpParams = httpParams.set('employeeId', params.employeeId);
    if (params.status !== undefined && params.status !== null) {
      httpParams = httpParams.set('status', params.status.toString());
    }

    return this.http
      .get<
        ApiResponse<AttendanceAdjustmentResponseDto[]>
      >(`${this.apiUrl}/adjustments`, { params: httpParams })
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            this.#adjustments.set(response.data);
            console.log('All Adjustments: ', this.#adjustments());
          }
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  approveAdjustment(
    id: string,
    command: AdjustmentActionCommand,
  ): Observable<ApiResponse<AttendanceAdjustmentResponseDto>> {
    return this.http
      .put<
        ApiResponse<AttendanceAdjustmentResponseDto>
      >(`${this.apiUrl}/adjustments/${id}/approve`, command)
      .pipe(
        tap((response) => {
          if (response.isSuccess) {
            console.log('✅ Adjustment approved:', response.data);
            this.#adjustments.set(null); // invalidate cache
          }
        }),
      );
  }

  rejectAdjustment(
    id: string,
    command: AdjustmentActionCommand,
  ): Observable<ApiResponse<AttendanceAdjustmentResponseDto>> {
    return this.http
      .put<
        ApiResponse<AttendanceAdjustmentResponseDto>
      >(`${this.apiUrl}/adjustments/${id}/reject`, command)
      .pipe(
        tap((response) => {
          if (response.isSuccess) {
            console.log('✅ Adjustment rejected:', response.data);
            this.#adjustments.set(null); // invalidate cache
          }
        }),
      );
  }

  // ---------------------------------------------------------------
  // Team / summary / export
  // ---------------------------------------------------------------
  getTeamAttendance(params: TeamAttendanceParams): Observable<ApiResponse<TeamAttendanceRecord[]>> {
    this.loadingService.showLoading();
    const httpParams = new HttpParams().set('managerId', params.managerId).set('date', params.date);

    return this.http
      .get<ApiResponse<TeamAttendanceRecord[]>>(`${this.apiUrl}/team`, { params: httpParams })
      .pipe(
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  getSummary(params: AttendanceSummaryParams): Observable<ApiResponse<AttendanceSummary>> {
    this.loadingService.showLoading();
    const httpParams = new HttpParams()
      .set('employeeId', params.employeeId)
      .set('month', params.month.toString())
      .set('year', params.year.toString());

    return this.http
      .get<ApiResponse<AttendanceSummary>>(`${this.apiUrl}/summary`, { params: httpParams })
      .pipe(
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  exportAttendance(params: AttendanceExportParams): Observable<Blob> {
    this.loadingService.showLoading();
    const httpParams = new HttpParams()
      .set('employeeId', params.employeeId)
      .set('startDate', params.startDate)
      .set('endDate', params.endDate);

    return this.http
      .get(`${this.apiUrl}/export`, { params: httpParams, responseType: 'blob' })
      .pipe(
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }
}
