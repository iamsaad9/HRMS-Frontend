import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { LoadingService } from "../../../../core/services/loading.service";
import { AuthService } from "../../../(public)/auth/services/auth.service";
import { ApproveRejectLeaveRequest, LeaveRequestPayload, LeaveRequestResponse, LeaveTypeResponse, UpdateLeaveRequestPayload } from "../model/leave-request.model";
import { Observable, tap } from "rxjs";
import { ApiResponse } from "../../../../core/models/api-response.model";

@Injectable({ providedIn: 'root' })
export class LeaveRequestsService {
    private apiUrl = '/api/Attendance';
    private http = inject(HttpClient);
    private loadingService = inject(LoadingService);
    private authService = inject(AuthService);
    currentUserId = this.authService.currentUser()?.employeeInfo.employeeId

    #leaveTypes = signal<LeaveTypeResponse[]>([]);
    leaveTypes = this.#leaveTypes.asReadonly();

     #allleaves = signal<LeaveRequestResponse[]>([]);
    allleaves = this.#allleaves.asReadonly();

    addLeave(command:LeaveRequestPayload):Observable<ApiResponse<any>>{
        return this.http
           .post<ApiResponse<any>>(`${this.apiUrl}/leaves/apply`, command)
           .pipe(
             tap((response) => {
               if (response.isSuccess && response.data) {
                 console.log(`✅ Leave Created:`, response.data);
               }
             })
           ); 
    }

    updateLeave(id:string,command:UpdateLeaveRequestPayload):Observable<ApiResponse<any>>{
        return this.http
           .put<ApiResponse<any>>(`${this.apiUrl}/leaves/${id}`, command)
           .pipe(
             tap((response) => {
               if (response.isSuccess && response.data) {
                 console.log(`✅ Leave Updated:`, response.data);
               }
             })
           ); 
    }

    getAllLeaveTypes():Observable<ApiResponse<LeaveTypeResponse[]>>{
        return this.http
           .get<ApiResponse<LeaveTypeResponse[]>>(`${this.apiUrl}/leave-types`)
           .pipe(
             tap((response) => {
               if (response.isSuccess && response.data) {
                 console.log(`✅ Leave Types fetched:`, response.data);
                 this.#leaveTypes.set(response.data);
               }
             })
           ); 
    }

    getAllLeaves(employeeId?: string): Observable<ApiResponse<LeaveRequestResponse[]>> {
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }

    return this.http
      .get<ApiResponse<LeaveRequestResponse[]>>(`${this.apiUrl}/leaves`, { params })
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log(`✅ Leave Types fetched:`, response.data);
            this.#allleaves.set(response.data);
          }
        })
      );
    }

getLeaveById(id?: string): Observable<ApiResponse<LeaveRequestResponse[]>> {
    return this.http
      .get<ApiResponse<LeaveRequestResponse[]>>(`${this.apiUrl}/leaves/${id}`)
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log(`✅ Leave fetched:`, response.data);
            this.#allleaves.set(response.data);
          }
        })
      );
    }    

    approveLeave(
      id: string,
    payload: ApproveRejectLeaveRequest,
  ): Observable<ApiResponse<LeaveRequestResponse>> {
    return this.http.post<ApiResponse<LeaveRequestResponse>>(
      `${this.apiUrl}/leaves/${id}/approve`,
      payload,
    );
    }

    rejectLeave(
    id: string,
    payload: ApproveRejectLeaveRequest,
  ): Observable<ApiResponse<LeaveRequestResponse>> {
    return this.http.post<ApiResponse<LeaveRequestResponse>>(
      `${this.apiUrl}/leaves/${id}/reject`,
      payload,
    );
    }
}