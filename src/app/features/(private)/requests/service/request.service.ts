import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { LoadingService } from "../../../../core/services/loading.service";
import { AuthService } from "../../../(public)/auth/services/auth.service";
import { Observable, tap } from "rxjs";
import { ApiResponse } from "../../../../core/models/api-response.model";
import { GetRequestByIdResponse, NewRequestPayload, RequestResponse } from "../model/request.model";

@Injectable({ providedIn: 'root' })
export class RequestsService {
    private apiUrl = '/api/Attendance';
    private http = inject(HttpClient);
    private loadingService = inject(LoadingService);
    private authService = inject(AuthService);
    currentUserId = this.authService.currentUser()?.employeeInfo.id

    // #leaveTypes = signal<LeaveTypeResponse[]>([]);
    // leaveTypes = this.#leaveTypes.asReadonly();

     #allRequests = signal<RequestResponse[]>([]);
    allRequests = this.#allRequests.asReadonly();

    addLeave(command:NewRequestPayload):Observable<ApiResponse<any>>{
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

        addWorkFromHome(command:NewRequestPayload):Observable<ApiResponse<any>>{
        return this.http
           .post<ApiResponse<any>>(`${this.apiUrl}/work-from-home`, command)
           .pipe(
             tap((response) => {
               if (response.isSuccess && response.data) {
                 console.log(`✅ Work From Home Created:`, response.data);
               }
             })
           ); 
    }

     addAttendanceRegularization(command:NewRequestPayload):Observable<ApiResponse<any>>{
        return this.http
           .post<ApiResponse<any>>(`${this.apiUrl}/attendance-regularization`, command)
           .pipe(
             tap((response) => {
               if (response.isSuccess && response.data) {
                 console.log(`✅ Attendance Regularization Created:`, response.data);
               }
             })
           ); 
    }


//     updateLeave(id:string,command:UpdateLeaveRequestPayload):Observable<ApiResponse<any>>{
//         return this.http
//            .put<ApiResponse<any>>(`${this.apiUrl}/leaves/${id}`, command)
//            .pipe(
//              tap((response) => {
//                if (response.isSuccess && response.data) {
//                  console.log(`✅ Leave Updated:`, response.data);
//                }
//              })
//            ); 
//     }

//     getAllLeaveTypes():Observable<ApiResponse<LeaveTypeResponse[]>>{
//         return this.http
//            .get<ApiResponse<LeaveTypeResponse[]>>(`${this.apiUrl}/leave-types`)
//            .pipe(
//              tap((response) => {
//                if (response.isSuccess && response.data) {
//                  console.log(`✅ Leave Types fetched:`, response.data);
//                  this.#leaveTypes.set(response.data);
//                }
//              })
//            ); 
//     }

    getAllMyRequests(employeeId?: string): Observable<ApiResponse<RequestResponse[]>> {
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }

    return this.http
      .get<ApiResponse<RequestResponse[]>>(`${this.apiUrl}/my-requests`, { params })
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log(`✅ All my requests fetched:`, response.data);
            this.#allRequests.set(response.data);
          }
        })
      );
    }

getRequestById(id?: string): Observable<ApiResponse<GetRequestByIdResponse>> {
    return this.http
      .get<ApiResponse<GetRequestByIdResponse>>(`${this.apiUrl}/request-detail/${id}`)
      .pipe(
        tap((response) => {
          if (response.isSuccess && response.data) {
            console.log(`✅ Request fetched:`, response.data);
          }
        })
      );
    }    

//     approveLeave(
//       id: string,
//     payload: ApproveRejectLeaveRequest,
//   ): Observable<ApiResponse<LeaveRequestResponse>> {
//     return this.http.post<ApiResponse<LeaveRequestResponse>>(
//       `${this.apiUrl}/leaves/${id}/approve`,
//       payload,
//     );
//     }

//     rejectLeave(
//     id: string,
//     payload: ApproveRejectLeaveRequest,
//   ): Observable<ApiResponse<LeaveRequestResponse>> {
//     return this.http.post<ApiResponse<LeaveRequestResponse>>(
//       `${this.apiUrl}/leaves/${id}/reject`,
//       payload,
//     );
//     }
}