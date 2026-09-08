import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { CategoryType } from '../../employees/model/employee.model';

// Mirrors backend HolidayType enum (Modules.Attendance/Domain/Enums/AttendanceEnum.cs)
export enum HolidayType {
  PublicHoliday = 1,
  BankHoliday = 2,
  TermBreak = 3,
  HalfTerm = 4,
}

export const HOLIDAY_TYPE_OPTIONS: { value: HolidayType; label: string }[] = [
  { value: HolidayType.PublicHoliday, label: 'Public Holiday' },
  { value: HolidayType.BankHoliday, label: 'Bank Holiday' },
  { value: HolidayType.TermBreak, label: 'Term Break' },
  { value: HolidayType.HalfTerm, label: 'Half Term' },
];

export interface Holiday {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  isOptional: boolean;
}

export interface CreateHolidayCommand {
  title: string;
  startDate: string;
  endDate: string;
  type: HolidayType;
  applicableCategory: CategoryType;
  isOptional: boolean;
  academicYear: string;
}

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/Holidays';

  getHolidays(category: CategoryType, academicYear?: string | null): Observable<ApiResponse<Holiday[]>> {
    let params = new HttpParams().set('category', category);
    if (academicYear) params = params.set('academicYear', academicYear);
    return this.http.get<ApiResponse<Holiday[]>>(this.apiUrl, { params });
  }

  createHoliday(command: CreateHolidayCommand): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.apiUrl, command);
  }

  deleteHoliday(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
