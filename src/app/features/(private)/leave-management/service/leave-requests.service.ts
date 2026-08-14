import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { LoadingService } from "../../../../core/services/loading.service";
import { AuthService } from "../../../(public)/auth/services/auth.service";
import { LeaveRequestPayload, LeaveTypeResponse } from "../model/leave-request.model";
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
}