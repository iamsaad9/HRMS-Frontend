import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AddEmployeeCommand, CreateEmployeeResponse, Employee } from '../model/employee-model';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { LoadingService } from '../../../../core/services/loading.service';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = '/api/Employees';
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);

  #allEmployees = signal<Employee[] | null>(null);
  allEmployees = this.#allEmployees.asReadonly();

  hasCachedEmployees = computed(() => {
    const employees = this.allEmployees(); // 👈 Call the signal function
    return employees !== null && employees.length > 0;
  });

  addEmployee(command: any): Observable<ApiResponse<CreateEmployeeResponse>> {
    return this.http.post<ApiResponse<CreateEmployeeResponse>>(`${this.apiUrl}`, command).pipe(
      tap((response) => {
        const newEmployee = response.data;
        if (response.isSuccess && newEmployee) {
          console.log('✅ Employee added successfully:', newEmployee);
        }
      }),
    );
  }

  getAllEmployees(): Observable<ApiResponse<Employee[]>> {
    if (this.hasCachedEmployees()) {
      console.log('Fetched cached employees.');
      return of({
        isSuccess: true,
        data: this.#allEmployees() ?? [], // 👈 Nullish coalescing operator prevents 'null'
        message: 'Retrieved from cache',
        errors: [],
      });
    }
    this.loadingService.showLoading();
    return this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}`).pipe(
      tap((response) => {
        if (response.data && response.isSuccess) {
          this.#allEmployees.set(response.data);
          console.log('All Employees: ', this.#allEmployees());
        }
      }),

      finalize(() => {
        this.loadingService.stopLoading();
      }),
    );
  }
}
