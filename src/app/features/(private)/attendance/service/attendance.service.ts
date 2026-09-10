// attendance.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { LoadingService } from '../../../../core/services/loading.service';
import {
  AdjustmentActionCommand,
  AdjustmentListParams,
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
 activeShiftRecord = computed(() => {
  const records = this.#currentMonth() ?? [];
  if (records.length === 0) {
    console.log('[activeShiftRecord] No current month records available.');
    return null;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  console.log(`[activeShiftRecord] Evaluating active shift. Today: ${todayStr}, Total Records: ${records.length}`);

  // 1. Open shift priority (has punches, but last punch isn't 'Out')
  const openShift = records
    .filter((r) => r.date <= todayStr && r.punches && r.punches.length > 0)
    .find((r) => {
      const lastPunch = r.punches[r.punches.length - 1];
      return lastPunch.punchType !== 'Out';
    });

  if (openShift) {
    console.log('[activeShiftRecord] Strategy 1 Hit -> Selected Open Shift:', openShift);
    return openShift;
  }

  // 2. Exact current date match
  const todayRecord = records.find((r) => r.date === todayStr);
  if (todayRecord) {
    console.log('[activeShiftRecord] Strategy 2 Hit -> Selected Exact Today Record:', todayRecord);
    return todayRecord;
  }

  // 3. Fallback to latest non-future date
  const pastOrPresentRecords = records
    .filter((r) => r.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  const fallbackRecord = pastOrPresentRecords[0] ?? null;
  console.log('[activeShiftRecord] Strategy 3 Hit -> Selected Fallback Record:', fallbackRecord);
  return fallbackRecord;
});

// Legacy replacement mapping to active shift
todayStatus = computed(() => {
  const status = this.activeShiftRecord();
  console.log('[todayStatus] Selected:', status);
  return status;
});



  isClockedIn = computed(() => !!this.todayStatus()?.punches.find((p) => p.punchType == 'In'));
  isClockedOut = computed(() => !!this.todayStatus()?.punches.find((p) => p.punchType == 'Out'));

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

        // Target the active shift's date (e.g., yesterday's date if clocking out post-midnight)
        const targetShiftDate = this.activeShiftRecord()?.date ?? new Date().toISOString().split('T')[0];

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

  getTeamDailyLog(managerId: string, date: string): Observable<ApiResponse<DepartmentDailyLogEntry[]>> {
    const httpParams = new HttpParams().set('managerId', managerId).set('date', date);
    return this.http.get<ApiResponse<DepartmentDailyLogEntry[]>>(`${this.apiUrl}/team-daily-log`, {
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
  createShift(command: CreateShiftCommand): Observable<ApiResponse<Shift>> {
    return this.http.post<ApiResponse<Shift>>(`${this.apiUrl}/shifts`, command).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          console.log('✅ Shift created:', response.data);
        }
      }),
    );
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
