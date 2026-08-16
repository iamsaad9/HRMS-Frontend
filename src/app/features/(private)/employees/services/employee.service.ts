import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AddEmployeeCommand, CreateEmployeeResponse, Employee } from '../model/employee.model';
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
          this.#allEmployees.set(null);
        }
      }),
    );
  }

  bulkUpload(command:File):Observable<ApiResponse<any>>{
    const formData = new FormData();
    formData.append('file', command, command.name);
     return this.http.post<ApiResponse<any>>(`${this.apiUrl}/bulk-upload`, formData).pipe(
      tap((response)=>{
        if(response.isSuccess){
          console.log('✅ Employee added successfully');
          this.getAllEmployees().subscribe()
        } 
      })
     )
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-template`, {
      responseType: 'blob' // Essential for receiving files/CSVs correctly
    });
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

getEmployeeById(id: string): Observable<ApiResponse<Employee>> {
  const cachedEmployee = this.#allEmployees()?.find((emp) => emp.id === id);

  if (cachedEmployee) {
    console.log(`Fetched cached employee with ID: ${id}`);
    return of({
      isSuccess: true,
      data: cachedEmployee,
      message: 'Retrieved from cache',
      errors: [],
    });
  }

  this.loadingService.showLoading();
  return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`).pipe(
    tap((response) => {
      if (response.isSuccess && response.data) {
        console.log(`Fetched employee ${id}:`, response.data);
      }
    }),
    finalize(() => {
      this.loadingService.stopLoading();
    })
  );
}
}
