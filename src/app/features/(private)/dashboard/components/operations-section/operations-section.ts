import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DashboardService } from '../../service/dashboard.service';
import { DashboardPendingApproval } from '../../dashboard.model';
import { RequestsService } from '../../../requests/service/request.service';
import { toRequestType } from '../../../requests/model/request.model';

@Component({
  selector: 'app-operations-section',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiAvatar, TuiCardLarge, MatIcon, TuiIcon],
  templateUrl: './operations-section.html',
})
export class OperationsSection {
  private readonly requestService = inject(RequestsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dashboardService = inject(DashboardService);
  protected readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  /** Cap how many show on the card */
  private readonly maxVisible = 4;

  // Pending approvals card - reads the SAME dashboard payload the "Pending Approval" KPI count
  // comes from, rather than a separately-scoped fetch, so the two numbers can never disagree.
  protected approvingId = signal<string | null>(null);

  protected readonly allPendingApprovals = computed(
    () => this.dashboardService.data()?.pendingApprovalsTeamMembers ?? [],
  );

  protected readonly pendingRequests = computed(() => this.allPendingApprovals().slice(0, this.maxVisible));

  protected readonly totalPending = computed(() => this.allPendingApprovals().length);

  protected quickApprove(record: DashboardPendingApproval): void {
    const type = toRequestType(record.requestType);
    if (!type) return;

    this.approvingId.set(record.approvalRequestId);

    this.requestService
      .approve(type, record.entityId, {
        approvedByEmployeeId: this.currentUser()?.employeeInfo.id ?? '',
        remarks: null,
      })
      .pipe(finalize(() => this.approvingId.set(null)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.dashboardService.load().subscribe();
            this.toast.success(`Approved ${record.requestType} for ${record.requesterName}`, 'Request Updated');
          }
        },
        error: () => this.toast.error('Unable to approve this request', 'Request Updated'),
      });
  }

  protected viewAll(): void {
    this.router.navigate(['/requests/approvals']); // adjust to your real route
  }

  protected readonly teamMembers = computed(() => this.dashboardService.data()?.teamMembers ?? []);
}

