import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  AddEmployeeCommand,
  BrancheItem,
  BulkUploadResult,
  CreateEmployeeResponse,
  DepartmentItem,
  DesignationItem,
  Employee,
  ManagerItem,
  RoleItem,
} from '../model/employee.model';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { LoadingService } from '../../../../core/services/loading.service';
import { Departments } from '../../departments/departments';
import { Department } from '../../attendance/model/attendance.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = '/api/Employees';
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);

  #allEmployees = signal<Employee[] | null>(null);
  allEmployees = this.#allEmployees.asReadonly();

  #allDesignations = signal<DesignationItem[] | null>(null);
  allDesignations = this.#allDesignations.asReadonly();

  #allDepartments = signal<DepartmentItem[]>([]);
  allDepartments = this.#allDepartments.asReadonly();

  #allRoles = signal<RoleItem[] | null>(null);
  allRoles = this.#allRoles.asReadonly();

  #allManagers = signal<ManagerItem[] | null>(null);
  allManagers = this.#allManagers.asReadonly();

  #allBranches = signal<BrancheItem[] | null>(null);
  allBranches = this.#allBranches.asReadonly();

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
  bulkUpload(file: File, upsert: boolean): Observable<BulkUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new HttpParams().set('isUpsert', upsert);

    return this.http
      .post<BulkUploadResult>(`${this.apiUrl}/bulk-upload`, formData, { params })
      .pipe(
        switchMap((response) => {
          console.log('✅ Employee added successfully');
          return this.getAllEmployees().pipe(map(() => response));
        }),
      );
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-template`, {
      responseType: 'blob', // Essential for receiving files/CSVs correctly
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
      }),
    );
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================
  getDepartments(): Observable<ApiResponse<DepartmentItem[]>> {
    const cached = this.#allDepartments();
    if (cached !== null && cached.length > 0) {
      return of({
        isSuccess: true,
        data: cached,
        message: 'Retrieved from cache',
        errors: [],
      });
    }

    this.loadingService.showLoading();
    return this.http.get<ApiResponse<DepartmentItem[]>>(`${this.apiUrl}/departments`).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          this.#allDepartments.set(response.data);
        }
      }),
      finalize(() => this.loadingService.stopLoading()),
    );
  }

  // ==========================================
  // DESIGNATIONS
  // ==========================================
  getDesignations(): Observable<ApiResponse<DesignationItem[]>> {
    const cached = this.#allDesignations();
    if (cached !== null && cached.length > 0) {
      return of({
        isSuccess: true,
        data: cached,
        message: 'Retrieved from cache',
        errors: [],
      });
    }

    this.loadingService.showLoading();
    return this.http.get<ApiResponse<DesignationItem[]>>(`${this.apiUrl}/designations`).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          this.#allDesignations.set(response.data);
        }
      }),
      finalize(() => this.loadingService.stopLoading()),
    );
  }

  // ==========================================
  // MANAGERS
  // ==========================================
  getManagers(): Observable<ApiResponse<ManagerItem[]>> {
    const cached = this.#allManagers();
    if (cached !== null && cached.length > 0) {
      return of({
        isSuccess: true,
        data: cached,
        message: 'Retrieved from cache',
        errors: [],
      });
    }

    this.loadingService.showLoading();
    return this.http.get<ApiResponse<ManagerItem[]>>(`${this.apiUrl}/managers`).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          this.#allManagers.set(response.data);
        }
      }),
      finalize(() => this.loadingService.stopLoading()),
    );
  }

  // ==========================================
  // ROLES
  // ==========================================
  getRoles(): Observable<ApiResponse<RoleItem[]>> {
    const cached = this.#allRoles();
    if (cached !== null && cached.length > 0) {
      return of({
        isSuccess: true,
        data: cached,
        message: 'Retrieved from cache',
        errors: [],
      });
    }

    this.loadingService.showLoading();
    return this.http.get<ApiResponse<RoleItem[]>>(`${this.apiUrl}/roles`).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          this.#allRoles.set(response.data);
        }
      }),
      finalize(() => this.loadingService.stopLoading()),
    );
  }

  // ==========================================
  // Branches
  // ==========================================

  getBranches(): Observable<ApiResponse<BrancheItem[]>> {
    const cached = this.#allBranches();
    if (cached !== null && cached.length > 0) {
      return of({
        isSuccess: true,
        data: cached,
        message: 'Retrieved from cache',
        errors: [],
      });
    }

    this.loadingService.showLoading();
    return this.http.get<ApiResponse<BrancheItem[]>>(`${this.apiUrl}/branches`).pipe(
      tap((response) => {
        if (response.isSuccess && response.data) {
          this.#allBranches.set(response.data);
        }
      }),
      finalize(() => this.loadingService.stopLoading()),
    );
  }
}
