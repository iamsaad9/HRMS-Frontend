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

// Type and category live on the same HolidayCalendar row - there's no separate lookup table
// linking them - so which types are offered per category is a fixed business rule, not
// something read from the database. Term/half-term breaks are a school-calendar concept and
// don't apply to Administrative staff; public/bank holidays apply to everyone.
export const HOLIDAY_TYPES_BY_CATEGORY: Record<CategoryType, HolidayType[]> = {
  [CategoryType.Academic]: [
    HolidayType.PublicHoliday,
    HolidayType.BankHoliday,
    HolidayType.TermBreak,
    HolidayType.HalfTerm,
  ],
  [CategoryType.Administrative]: [HolidayType.PublicHoliday, HolidayType.BankHoliday],
};

export interface Holiday {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  isOptional: boolean;
  isActive: boolean;
  updatedBy?: string | null;
  updatedAtUtc?: string | null;
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

  getHolidays(
    category: CategoryType,
    academicYear?: string | null,
    includeInactive = false,
  ): Observable<ApiResponse<Holiday[]>> {
    let params = new HttpParams().set('category', category).set('includeInactive', includeInactive);
    if (academicYear) params = params.set('academicYear', academicYear);
    return this.http.get<ApiResponse<Holiday[]>>(this.apiUrl, { params });
  }

  createHoliday(command: CreateHolidayCommand): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(this.apiUrl, command);
  }

  /** Soft-delete/restore - never a hard delete, since historical attendance/payroll records may
   * already reference the date a holiday applied to. */
  setHolidayStatus(id: string, isActive: boolean): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.apiUrl}/${id}/status`, { isActive });
  }
}
