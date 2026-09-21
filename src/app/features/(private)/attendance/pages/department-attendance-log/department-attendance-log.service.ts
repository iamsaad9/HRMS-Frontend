import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { DepartmentAttendanceFilter, DepartmentAttendanceRecord } from '../../model/attendance.model';
import { AttendanceService } from '../../service/attendance.service';

@Injectable({ providedIn: 'root' })
export class DepartmentAttendanceLogService {
  private readonly attendanceService = inject(AttendanceService);

  getDepartmentAttendanceLog(filter: DepartmentAttendanceFilter): Observable<DepartmentAttendanceRecord[]> {
    const { departmentId, startDate, endDate } = filter;
    if (!departmentId || !startDate || !endDate) return of([]);

    // One request for the whole range, not one per day - the backend already pulls every
    // employee/date pair in a single query (department-daily-log/range).
    return this.attendanceService.getDepartmentDailyLogRange(departmentId, startDate, endDate).pipe(
      map((response) => {
        if (!response.isSuccess || !response.data) return [];
        return response.data.map(
          (entry): DepartmentAttendanceRecord => ({
            id: `${entry.employeeId}-${entry.date}`,
            employeeId: entry.employeeId,
            employeeName: entry.fullName,
            departmentId,
            date: entry.date,
            firstIn: entry.firstIn,
            lastOut: entry.lastOut,
            totalHoursWorked:
              entry.firstIn && entry.lastOut
                ? Math.round(
                    ((new Date(entry.lastOut).getTime() - new Date(entry.firstIn).getTime()) / 3600000) * 100,
                  ) / 100
                : null,
            lateMinutes: entry.lateMinutes,
            earlyExitMinutes: entry.earlyExitMinutes ?? 0,
            overtimeHours: 0,
            overtimeMinutes: entry.overtimeMinutes ?? 0,
            earlyInMinutes: entry.earlyInMinutes ?? 0,
            shiftName: entry.shiftName ?? null,
            remarks: entry.remarks ?? null,
            breakIn: entry.breakIn ?? null,
            breakOut: entry.breakOut ?? null,
            status: entry.status,
          }),
        );
      }),
    );
  }
}
