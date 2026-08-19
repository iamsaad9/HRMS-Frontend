import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import {
  AttendanceStatus,
  Department,
  DepartmentAttendanceFilter,
  DepartmentAttendanceRecord,
  DEPARTMENT_OPTIONS
} from '../../model/attendance.model';

// ---- Mock data -------------------------------------------------------
// Replace this whole block once the real endpoints are wired up.


const MOCK_EMPLOYEES: Record<string, { employeeId: string; employeeName: string }[]> = {
  'dep-1': [
    { employeeId: 'EMP-101', employeeName: 'Ali Raza' },
    { employeeId: 'EMP-102', employeeName: 'Fatima Noor' },
    { employeeId: 'EMP-103', employeeName: 'Hassan Iqbal' },
    { employeeId: 'EMP-104', employeeName: 'Zainab Sheikh' },
  ],
  'dep-2': [
    { employeeId: 'EMP-201', employeeName: 'Bilal Ahmed' },
    { employeeId: 'EMP-202', employeeName: 'Sana Malik' },
  ],
  'dep-3': [
    { employeeId: 'EMP-301', employeeName: 'Usman Tariq' },
    { employeeId: 'EMP-302', employeeName: 'Ayesha Khan' },
    { employeeId: 'EMP-303', employeeName: 'Omar Farooq' },
  ],
  'dep-4': [
    { employeeId: 'EMP-401', employeeName: 'Mahnoor Aslam' },
  ],
};

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

// Simple deterministic pseudo-random so the same filter always renders the same mock data.
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function generateMockRecord(
  departmentId: string,
  employeeId: string,
  employeeName: string,
  date: string
): DepartmentAttendanceRecord {
  const rand = seededRandom(`${employeeId}-${date}`);

  let status: AttendanceStatus;
  if (rand < 0.08) status = 'Absent';
  else if (rand < 0.1) status = 'On Leave';
  else if (rand < 0.28) status = 'Late';
  else status = 'Present';

  if (status === 'Absent' || status === 'On Leave') {
    return {
      id: `${employeeId}-${date}`,
      employeeId,
      employeeName,
      departmentId,
      date,
      firstIn: null,
      lastOut: null,
      totalHoursWorked: null,
      lateMinutes: 0,
      earlyExitMinutes: 0,
      overtimeHours: 0,
      status,
    };
  }

  const lateMinutes = status === 'Late' ? Math.round(10 + rand * 50) : 0;
  const startHour = 9 + (lateMinutes > 0 ? lateMinutes / 60 : 0);
  const totalHoursWorked = Math.round((7.5 + rand * 1.5) * 100) / 100;
  const earlyExitMinutes = rand > 0.85 ? Math.round(rand * 30) : 0;
  const overtimeHours = rand > 0.9 ? Math.round(rand * 2 * 10) / 10 : 0;

  const firstInDate = new Date(`${date}T00:00:00`);
  firstInDate.setMinutes(Math.round(startHour * 60));
  const lastOutDate = new Date(firstInDate);
  lastOutDate.setMinutes(lastOutDate.getMinutes() + Math.round(totalHoursWorked * 60));

  return {
    id: `${employeeId}-${date}`,
    employeeId,
    employeeName,
    departmentId,
    date,
    firstIn: firstInDate.toISOString(),
    lastOut: lastOutDate.toISOString(),
    totalHoursWorked,
    lateMinutes,
    earlyExitMinutes,
    overtimeHours,
    status,
  };
}

// ---- Service -----------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class DepartmentAttendanceLogService {
  getDepartments(): Observable<Department[]> {
    // TODO: replace with real API call, e.g.:
    // return this.http.get<Department[]>('/api/departments');
    return of(DEPARTMENT_OPTIONS).pipe(delay(150));
  }

  getDepartmentAttendanceLog(filter: DepartmentAttendanceFilter): Observable<DepartmentAttendanceRecord[]> {
    // TODO: replace this whole method body with the real API call, e.g.:
    // return this.http
    //   .get<ApiResponse<DepartmentAttendanceRecord[]>>('/api/attendance/department', {
    //     params: {
    //       departmentId: filter.departmentId,
    //       startDate: filter.startDate,
    //       endDate: filter.endDate,
    //     },
    //   })
    //   .pipe(map((res) => res.data));

    return of(filter).pipe(
      delay(300),
      map(({ departmentId, startDate, endDate }) => {
        if (!departmentId || !startDate || !endDate) return [];

        const employees = MOCK_EMPLOYEES[departmentId] ?? [];
        const days = getDaysBetween(startDate, endDate);

        const records: DepartmentAttendanceRecord[] = [];
        for (const day of days) {
          for (const emp of employees) {
            records.push(
              generateMockRecord(departmentId, emp.employeeId, emp.employeeName, day)
            );
          }
        }
        return records;
      })
    );
  }
}