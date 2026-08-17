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
  PunchCommand,
  PunchResponseDto,
  Shift,
  TeamAttendanceParams,
  TeamAttendanceRecord,
} from '../model/attendance.model';
import { ToastService } from '../../../../core/services/toast.service';
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
  utctoday = new Date()
  today = toLocalDateStr(this.utctoday);
  currentUserId = this.authService.currentUser()?.employeeInfo.employeeId

todayStatus = computed(() => {
  return this.currentMonth()?.find((day) => day.date === this.today);
});

#adjustments = signal<AttendanceAdjustmentResponseDto[] | null>(null);
allAdjustments = this.#adjustments.asReadonly();

#currentMonth = signal<DailyAttendance[] | null>(null);
currentMonth = this.#currentMonth.asReadonly();

hasCachedAdjustments = computed(() => {
  const list = this.allAdjustments();
  return list !== null && list.length > 0;
});


// Call this.todayStatus() as a function, and convert to boolean if needed
isClockedIn = computed(() => !!this.todayStatus()?.firstIn);
isClockedOut = computed(() => !!this.todayStatus()?.lastOut);


// Also fixed typo: isEarlyExist -> isEarlyExit
isOnBreak = computed(() => this.todayStatus()?.lastOut ?? false);

private upsertDailyAttendance(todayRecord: DailyAttendance): void {
  this.#currentMonth.update((records) => {
    const list = records ?? [];
    const index = list.findIndex((day) => day.date === todayRecord.date);

    if (index !== -1) {
      // Replace existing day
      return list.map((day, i) => (i === index ? todayRecord : day));
    }

    // Append today's new entry
    return [...list, todayRecord];
  });
}

  // ---------------------------------------------------------------
  // Punch actions
  // ---------------------------------------------------------------
  punch(command: PunchCommand): Observable<ApiResponse<PunchResponseDto>> {
    return this.http
      .post<ApiResponse<PunchResponseDto>>(`${this.apiUrl}/punch`, command)
      .pipe(
        switchMap((response) => {
          if (!response.isSuccess) {
            return of(response);
          }

          const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

          // Fetch attendance filtering by today's date
          return this.getDailyAttendance(command.employeeId, today).pipe(
            tap((todayResponse) => {
              if (todayResponse.isSuccess && todayResponse.data) {
                // Handle single item or array based on API response structure
                const todayAttendance = Array.isArray(todayResponse.data) 
                  ? todayResponse.data[0] 
                  : todayResponse.data;

                if (todayAttendance) {
                  this.upsertDailyAttendance(todayAttendance);
                }
              }
            }),
            map(() => response) // Return original punch response to subscriber
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
            console.log("Today's Status:", this.todayStatus);
          }
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        }),
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
          if (response.isSuccess) {
            console.log('Attendance history:', response.data);
          }
        }),
        finalize(() => {
          this.loadingService.stopLoading();
        }),
      );
  }

  getCurrentMonth(): Observable<ApiResponse<DailyAttendance[]>> {
    const today = new Date();
    // const endDate = toLocalDateStr(today); 

    // Set start date to the 1st of the current month
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 30);
    const startDate = toLocalDateStr(start);
    const endDate = toLocalDateStr(end);

    this.loadingService.showLoading();
    
    const httpParams = new HttpParams()
      .set('employeeId', this.currentUserId || '')
      .set('startDate', startDate)
      .set('endDate', endDate);

      console.log("Params: ",httpParams)
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
    command: AttendanceAdjustmentForm ,
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
      .put<ApiResponse<AttendanceAdjustmentResponseDto>>(`${this.apiUrl}/adjustments/${id}/approve`, command)
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
      .put<ApiResponse<AttendanceAdjustmentResponseDto>>(`${this.apiUrl}/adjustments/${id}/reject`, command)
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
