import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TuiButton, TuiIcon, TuiInput, TuiLabel, TuiTextfield } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiInputDate, TuiInputTime, TuiTextarea } from '@taiga-ui/kit';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { RequestsService } from '../../service/request.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import {
  isAttendanceRegularizationDetail,
  isLeaveDetail,
  isWorkFromHomeDetail,
  RegularizationLineItem,
  RequestData,
  RequestDetail,
  LeaveDetail,
  WorkFromHomeDetail,
  toRequestType,
} from '../../model/request.model';

interface EditableLineItem {
  date: string;
  requestedClockIn: string;
  requestedClockOut: string;
  requestedBreakIn: string;
  requestedBreakOut: string;
  remarks: string;
}

@Component({
  selector: 'app-view-request',
  standalone: true,
  imports: [CommonModule, FormsModule,TuiInputTime,TuiInputDate, RouterLink, TuiButton, TuiCardLarge, MainHeading, TuiIcon, TuiTextarea, TuiTextfield,TuiLabel],
  templateUrl: './view-request.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewRequest {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly requestService = inject(RequestsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly leaveService = inject(LeaveRequestsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly request = signal<RequestData<RequestDetail> | null>(null);
  protected readonly isSubmittingAction = signal(false);
  protected readonly remarks = signal('');

  protected readonly leaveTypeOptions = this.leaveService.leaveTypes;

  protected readonly isEditing = signal(false);
  protected readonly editStartDate = signal('');
  protected readonly editEndDate = signal('');
  protected readonly editLeaveTypeId = signal('');
  protected readonly editReason = signal('');
  protected readonly editLineItems = signal<EditableLineItem[]>([]);

  protected readonly currentEmployeeId = this.authService.currentUser()?.employeeInfo?.id ?? null;

  protected readonly isOwnRequest = computed(
    () => !!this.currentEmployeeId && this.request()?.requesterEmployeeId === this.currentEmployeeId,
  );

  protected readonly isPending = computed(() => this.request()?.overallStatus === 1);

  protected readonly canCancel = computed(
    () => this.isOwnRequest() && this.isPending() && this.request()?.currentStepOrder === 1,
  );

  // Same rule as cancel: only the requester, and only before any approver has acted on it.
  protected readonly canEdit = this.canCancel;

  protected readonly canApproveOrReject = computed(() => !this.isOwnRequest() && this.isPending());
 
  protected readonly title = computed(() => {
    switch (this.request()?.requestType) {
      case 'WorkFromHome':
        return 'Work From Home Request';
      case 'Leave':
        return 'Leave Request';
      case 'AttendanceRegularization':
        return 'Attendance Adjustment Request';
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
 
  private currentId: string | null = null;

  constructor() {
    this.leaveService.getAllLeaveTypes().subscribe();

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          this.currentId = id;

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

  private reload(): void {
    if (!this.currentId) return;
    this.requestService.getRequestById(this.currentId).subscribe((res) => {
      if (res.isSuccess && res.data) this.request.set(res.data);
    });
  }

  protected approve(): void {
    const r = this.request();
    if (!r || !this.currentId) return;
    const type = toRequestType(r.requestType);
    if (!type) return;

    this.isSubmittingAction.set(true);
    this.requestService
      .approve(type, this.currentId, { remarks: this.remarks() || null })
      .pipe(finalize(() => this.isSubmittingAction.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.toast.success('Request approved.', 'Approved');
            this.router.navigate(['/requests/approvals']);
          } else {
            this.toast.error(res.message || 'Could not approve this request.', 'Approve Failed');
          }
        },
        error: (err) => this.toast.error(err?.error?.message || 'Could not approve this request.', 'Approve Failed'),
      });
  }

  protected reject(): void {
    const r = this.request();
    if (!r || !this.currentId) return;
    const type = toRequestType(r.requestType);
    if (!type) return;

    if (!this.remarks().trim()) {
      this.toast.error('Please provide a reason for rejecting this request.', 'Reason Required');
      return;
    }

    this.isSubmittingAction.set(true);
    this.requestService
      .reject(type, this.currentId, { remarks: this.remarks() })
      .pipe(finalize(() => this.isSubmittingAction.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.toast.success('Request rejected.', 'Rejected');
            this.router.navigate(['/requests/approvals']);
          } else {
            this.toast.error(res.message || 'Could not reject this request.', 'Reject Failed');
          }
        },
        error: (err) => this.toast.error(err?.error?.message || 'Could not reject this request.', 'Reject Failed'),
      });
  }

  protected cancel(): void {
    const r = this.request();
    if (!r || !this.currentId) return;
    const type = toRequestType(r.requestType);
    if (!type) return;

    this.isSubmittingAction.set(true);
    this.requestService
      .cancel(type, this.currentId)
      .pipe(finalize(() => this.isSubmittingAction.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.toast.success('Request cancelled.', 'Cancelled');
            this.reload();
          } else {
            this.toast.error(res.message || 'Could not cancel this request.', 'Cancel Failed');
          }
        },
        error: (err) => this.toast.error(err?.error?.message || 'Could not cancel this request.', 'Cancel Failed'),
      });
  }

  private toTimeInputValue(value: string | null | undefined): string {
    return value ? value.slice(0, 5) : '';
  }

  private fromTimeInputValue(value: string): string | null {
    return value ? `${value}:00` : null;
  }

  protected startEdit(): void {
    const r = this.request();
    if (!r) return;

    this.editStartDate.set(r.startDate.slice(0, 10));
    this.editEndDate.set(r.endDate.slice(0, 10));
    this.editLeaveTypeId.set(r.leaveTypeId ?? '');
    this.editReason.set(r.requestReason ?? '');

    if (r.requestType === 'AttendanceRegularization') {
      this.editLineItems.set(
        r.details.filter(isAttendanceRegularizationDetail).map((d) => ({
          date: d.date ? d.date.slice(0, 10) : '',
          requestedClockIn: this.toTimeInputValue(d.requestedClockIn),
          requestedClockOut: this.toTimeInputValue(d.requestedClockOut),
          requestedBreakIn: this.toTimeInputValue(d.requestedBreakIn),
          requestedBreakOut: this.toTimeInputValue(d.requestedBreakOut),
          remarks: d.remarks ?? '',
        })),
      );
    }

    this.isEditing.set(true);
  }

  protected cancelEditMode(): void {
    this.isEditing.set(false);
  }

  protected addLineItem(): void {
    this.editLineItems.update((items) => [
      ...items,
      { date: '', requestedClockIn: '', requestedClockOut: '', requestedBreakIn: '', requestedBreakOut: '', remarks: '' },
    ]);
  }

  protected removeLineItem(index: number): void {
    this.editLineItems.update((items) => items.filter((_, i) => i !== index));
  }

  protected updateLineItem<K extends keyof EditableLineItem>(index: number, field: K, value: EditableLineItem[K]): void {
    this.editLineItems.update((items) =>
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  protected saveEdit(): void {
    const r = this.request();
    if (!r || !this.currentId) return;

    this.isSubmittingAction.set(true);

    const request$ =
      r.requestType === 'Leave'
        ? this.requestService.updateLeave(this.currentId, {
            leaveTypeId: this.editLeaveTypeId(),
            startDate: this.editStartDate(),
            endDate: this.editEndDate(),
            reason: this.editReason() || null,
          })
        : r.requestType === 'WorkFromHome'
          ? this.requestService.updateWorkFromHome(this.currentId, {
              startDate: this.editStartDate(),
              endDate: this.editEndDate(),
              reason: this.editReason() || null,
            })
          : this.requestService.updateAttendanceRegularization(this.currentId, {
              lineItems: this.editLineItems().map(
                (item): RegularizationLineItem => ({
                  date: item.date,
                  requestedClockIn: this.fromTimeInputValue(item.requestedClockIn),
                  requestedClockOut: this.fromTimeInputValue(item.requestedClockOut),
                  requestedBreakIn: this.fromTimeInputValue(item.requestedBreakIn),
                  requestedBreakOut: this.fromTimeInputValue(item.requestedBreakOut),
                  remarks: item.remarks,
                }),
              ),
              reason: this.editReason() || null,
            });

    request$.pipe(finalize(() => this.isSubmittingAction.set(false))).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.toast.success('Request updated.', 'Updated');
          this.isEditing.set(false);
          this.reload();
        } else {
          this.toast.error(res.message || 'Could not update this request.', 'Update Failed');
        }
      },
      error: (err) => this.toast.error(err?.error?.message || 'Could not update this request.', 'Update Failed'),
    });
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