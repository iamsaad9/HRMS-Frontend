import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { DepartmentAttendanceFilter, DepartmentAttendanceRecord } from '../../model/attendance.model';
import { AttendanceService } from '../../service/attendance.service';

function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysBetween(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cur = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  while (cur <= end) {
    days.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

@Injectable({ providedIn: 'root' })
export class DepartmentAttendanceLogService {
  private readonly attendanceService = inject(AttendanceService);

  /** Calls the real per-day department-daily-log endpoint once per day in the range and flattens the results. */
  getDepartmentAttendanceLog(filter: DepartmentAttendanceFilter): Observable<DepartmentAttendanceRecord[]> {
    const { departmentId, startDate, endDate } = filter;
    if (!departmentId || !startDate || !endDate) return of([]);

    const days = getDaysBetween(startDate, endDate);
    if (days.length === 0) return of([]);

    return forkJoin(
      days.map((date) => this.attendanceService.getDepartmentDailyLog(departmentId, date)),
    ).pipe(
      map((responses) =>
        responses.flatMap((response, i) => {
          if (!response.isSuccess || !response.data) return [];
          const date = days[i];
          return response.data.map(
            (entry): DepartmentAttendanceRecord => ({
              id: `${entry.employeeId}-${date}`,
              employeeId: entry.employeeId,
              employeeName: entry.fullName,
              departmentId,
              date,
              firstIn: entry.firstIn,
              lastOut: entry.lastOut,
              totalHoursWorked:
                entry.firstIn && entry.lastOut
                  ? Math.round(
                      ((new Date(entry.lastOut).getTime() - new Date(entry.firstIn).getTime()) / 3600000) * 100,
                    ) / 100
                  : null,
              lateMinutes: entry.lateMinutes,
              earlyExitMinutes: 0,
              overtimeHours: 0,
              status: entry.status,
            }),
          );
        }),
      ),
    );
  }
}
