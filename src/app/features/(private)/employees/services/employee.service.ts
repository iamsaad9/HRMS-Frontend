import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AddEmployeeCommand } from '../model/employee-model';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = 'https://localhost:7085/api/Employees';
  private http = inject(HttpClient);

  addEmployee(command: any): Observable<ApiResponse<AddEmployeeCommand>> {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjQyMDAiLCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3MDg1IiwiZXhwIjoxNzg1Nzc5MjkzLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImQ5ZmYwNzQwLWM4MzQtNDVmNS04Njk5LTUzMDJkOThjNDRlMCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJ0ZXN0QGdtYWlsLmNvbSIsImlhdCI6MTc4NTc3ODM5MywibmJmIjoxNzg1Nzc4MzkzfQ.EEfjYuklXtaBPGkv0D0QtC1p93fnZjWdQ9Udl4aBsb4';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .post<ApiResponse<AddEmployeeCommand>>(`${this.apiUrl}`, command, { headers })
      .pipe(
        tap((response) => {
          const newEmployee = response.data;
          if (response.isSuccess && newEmployee) {
            console.log('✅ Employee added successfully:', newEmployee);
          }
        }),
      );
  }
}
