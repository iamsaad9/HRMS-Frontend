import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { Router } from '@angular/router';
import { DashboardService } from '../../service/dashboard.service';
import { DashboardPendingApproval } from '../../dashboard.model';

@Component({
  selector: 'app-operations-section',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiAvatar, TuiCardLarge, MatIcon, TuiIcon, RouterLink],
  templateUrl: './operations-section.html',
})
export class OperationsSection {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  protected readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  /** Cap how many show on the card */
  private readonly maxVisible = 4;

  // Pending approvals card - reads the SAME dashboard payload the "Pending Approval" KPI count
  // comes from, rather than a separately-scoped fetch, so the two numbers can never disagree.
  protected readonly allPendingApprovals = computed(
    () => this.dashboardService.data()?.pendingApprovalsTeamMembers ?? [],
  );

  protected readonly pendingRequests = computed(() => this.allPendingApprovals().slice(0, this.maxVisible));

  protected readonly totalPending = computed(() => this.allPendingApprovals().length);

  // record.entityId is the request's actual module entity id (Leave/WFH/Regularization id) -
  // the same id the "Review"/"eye" links on the Request Approvals and My Requests pages use for
  // /requests/:id, since that's what GetRequestDetailAsync looks the request up by.
  protected requestLink(record: DashboardPendingApproval): (string | number)[] {
    return ['/requests', record.entityId];
  }

  protected viewAll(): void {
    this.router.navigate(['/requests/approvals']); // adjust to your real route
  }

  protected viewAllTeamAnalytics(): void {
    this.router.navigate(['/attendance/team-logs']);
  }

  protected readonly teamMembers = computed(() => this.dashboardService.data()?.teamMembers ?? []);

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
}

