import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { RequestsService } from '../../service/request.service';
import { 
  isAttendanceRegularizationDetail, 
  isLeaveDetail, 
  isWorkFromHomeDetail, 
  RequestData, 
  RequestDetail,
  LeaveDetail,
  WorkFromHomeDetail 
} from '../../model/request.model';

@Component({
  selector: 'app-view-request',
  standalone: true,
  imports: [CommonModule, RouterLink, TuiButton, TuiCardLarge, MainHeading, TuiIcon],
  templateUrl: './view-request.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewRequest {
  private readonly route = inject(ActivatedRoute);
  private readonly requestService = inject(RequestsService);
 
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly request = signal<RequestData<RequestDetail> | null>(null);
 
  protected readonly title = computed(() => {
    switch (this.request()?.requestType) {
      case 'WorkFromHome':
        return 'Work From Home Request';
      case 'Leave':
        return 'Leave Request';
      case 'AttendanceRegularization':
        return 'Attendance Regularization Request';
      default:
        return 'Request Details';
    }
  });
 
  // Expose type guards directly with clear matching names
  protected readonly isLeaveDetail = isLeaveDetail;
  protected readonly isWorkFromHomeDetail = isWorkFromHomeDetail;
  protected readonly isAttendanceRegularizationDetail = isAttendanceRegularizationDetail;

  // Helper type guard for properties shared by Leave and WFH
  protected hasHalfDay(detail: RequestDetail): detail is LeaveDetail | WorkFromHomeDetail {
    return isLeaveDetail(detail) || isWorkFromHomeDetail(detail);
  }
 
  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
 
          this.loading.set(true);
          this.error.set(null);
          this.request.set(null);
 
          if (!id) {
            this.error.set('No request id was provided.');
            this.loading.set(false);
            return of(null);
          }
 
          return this.requestService.getRequestById(id).pipe(
            tap((res) => {
              if (res.isSuccess && res.data) {
                this.request.set(res.data);
              } else {
                this.error.set(res.message ?? 'Failed to load request details.');
              }
            }),
            catchError(() => {
              this.error.set('Failed to load request details. Please try again.');
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe();
  }
 
  protected statusLabel(status: number): string {
    const map: Record<number, string> = {
      0: 'Draft',
      1: 'Pending',
      2: 'Approved',
      3: 'Rejected',
      4: 'Cancelled',
    };
    return map[status] ?? `Status ${status}`;
  }
 
  protected statusClass(status: number): string {
    const map: Record<number, string> = {
      1: 'bg-amber-100 text-amber-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-red-100 text-red-800',
      4: 'bg-slate-100 text-slate-700',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }
 
 halfDayLabel(type: number): string {
    switch (type) {
      case 1: return 'First Half (0.5 day)';
      case 2: return 'Second Half (0.5 day)';
      default: return 'Half Day';
    }
  }
}