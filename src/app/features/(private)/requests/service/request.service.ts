import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { LoadingService } from "../../../../core/services/loading.service";
import { AuthService } from "../../../(public)/auth/services/auth.service";
import { Observable, tap } from "rxjs";
import { ApiResponse } from "../../../../core/models/api-response.model";
import {
  GetRequestByIdResponse,
  NewRequestPayload,
  RequestResponse,
  RequestType,
  UpdateAttendanceRegularizationPayload,
  UpdateLeavePayload,
  UpdateWorkFromHomePayload,
} from "../model/request.model";

export interface ApproveRejectPayload {
  approvedByEmployeeId?: string;
  rejectedByEmployeeId?: string;
  remarks: string | null;
}

const TYPE_TO_ROUTE_SEGMENT: Record<RequestType, string> = {
  leave: 'leaves',
  wfh: 'work-from-home',
  regularization: 'attendance-regularization',
};

@Injectable({ providedIn: 'root' })
export class RequestsService {
    private apiUrl = '/api/Attendance';
    private http = inject(HttpClient);
    private loadingService = inject(LoadingService);
    private authService = inject(AuthService);

    // A getter, not a captured field - this.authService.currentUser() must be read fresh on every
    // call. Capturing it once at construction time froze it to whatever the signal held at that
    // instant (often nothing yet, since RequestsService is a root singleton that can be built
    // before the session finishes loading), so cancel/approve/reject silently carried a stale or
    // empty employee id for the rest of the app's lifetime.
    private get currentUserId(): string | undefined {
      return this.authService.currentUser()?.employeeInfo.id;
    }

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
                 console.log(`✅ Attendance Adjustment Created:`, response.data);
               }
             })
           ); 
    }


    updateLeave(id: string, command: UpdateLeavePayload): Observable<ApiResponse<boolean>> {
      return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/leaves/${id}`, command);
    }

    updateWorkFromHome(id: string, command: UpdateWorkFromHomePayload): Observable<ApiResponse<boolean>> {
      return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/work-from-home/${id}`, command);
    }

    updateAttendanceRegularization(id: string, command: UpdateAttendanceRegularizationPayload): Observable<ApiResponse<boolean>> {
      return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/attendance-regularization/${id}`, command);
    }

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

    approve(type: RequestType, id: string, payload: ApproveRejectPayload): Observable<ApiResponse<boolean>> {
      return this.http.post<ApiResponse<boolean>>(
        `${this.apiUrl}/${TYPE_TO_ROUTE_SEGMENT[type]}/${id}/approve`,
        { approvedByEmployeeId: this.currentUserId, remarks: payload.remarks },
      );
    }

    reject(type: RequestType, id: string, payload: ApproveRejectPayload): Observable<ApiResponse<boolean>> {
      return this.http.post<ApiResponse<boolean>>(
        `${this.apiUrl}/${TYPE_TO_ROUTE_SEGMENT[type]}/${id}/reject`,
        { rejectedByEmployeeId: this.currentUserId, remarks: payload.remarks ?? '' },
      );
    }

    sendApprovalEmail(requesterEmployeeId: string, requestType: string, remarks?: string): Observable<ApiResponse<boolean>> {
      return this.http.post<ApiResponse<boolean>>('/api/Email/send-approval', {
        requesterEmployeeId,
        requestType,
        remarks,
      });
    }

    sendRejectionEmail(requesterEmployeeId: string, requestType: string, remarks?: string): Observable<ApiResponse<boolean>> {
      return this.http.post<ApiResponse<boolean>>('/api/Email/send-rejection', {
        requesterEmployeeId,
        requestType,
        remarks,
      });
    }

    cancel(type: RequestType, id: string): Observable<ApiResponse<boolean>> {
      const params = new HttpParams().set('employeeId', this.currentUserId ?? '');
      return this.http.delete<ApiResponse<boolean>>(
        `${this.apiUrl}/${TYPE_TO_ROUTE_SEGMENT[type]}/${id}`,
        { params },
      );
    }

    getManagerPendingRequests(managerId: string): Observable<ApiResponse<RequestResponse[]>> {
      const params = new HttpParams().set('managerId', managerId);
      return this.http.get<ApiResponse<RequestResponse[]>>(`${this.apiUrl}/manager/pending-requests`, { params });
    }

    getHrPendingRequests(): Observable<ApiResponse<RequestResponse[]>> {
      return this.http.get<ApiResponse<RequestResponse[]>>(`${this.apiUrl}/hr/pending-requests`);
    }

    getAllPendingRequests(): Observable<ApiResponse<RequestResponse[]>> {
      return this.http.get<ApiResponse<RequestResponse[]>>(`${this.apiUrl}/admin/pending-requests`);
    }
}