import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { DepartmentAttendanceRecord } from '../../model/attendance.model';
import { AttendanceService } from '../../service/attendance.service';

@Injectable({ providedIn: 'root' })
export class TeamAttendanceLogService {
  private readonly attendanceService = inject(AttendanceService);

  getTeamAttendanceLog(managerId: string, startDate: string, endDate: string): Observable<DepartmentAttendanceRecord[]> {
    if (!managerId || !startDate || !endDate) return of([]);

    // One request for the whole range, not one per day - the backend already pulls every
    // employee/date pair in a single query (team-daily-log/range).
    return this.attendanceService.getTeamDailyLogRange(managerId, startDate, endDate).pipe(
      map((response) => {
        if (!response.isSuccess || !response.data) return [];
        return response.data.map(
          (entry): DepartmentAttendanceRecord => ({
            id: `${entry.employeeId}-${entry.date}`,
            employeeId: entry.employeeId,
            employeeName: entry.fullName,
            departmentId: '',
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
            earlyExitMinutes: 0,
            overtimeHours: 0,
            status: entry.status,
          }),
        );
      }),
    );
  }
}
