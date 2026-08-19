import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AttendanceHistoryFilter } from '../../attendance/model/attendance.model';
import { EmployeeFilter } from '../../employees/model/employee.model';

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

@Injectable({ providedIn: 'root' })
export class ReportExtractionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `/reports`;

  extractAttendanceHistory(filter: AttendanceHistoryFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/attendance-history/export`, filter, {
      responseType: 'blob',
    });
  }

  extractEmployeeDirectory(filter: EmployeeFilter): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/employee-directory/export`, filter, {
      responseType: 'blob',
    });
  }

  downloadCsv(blob: Blob, reportKey: string): void {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `${reportKey}-${stamp}.csv`);
  }
}