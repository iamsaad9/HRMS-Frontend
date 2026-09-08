import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { RequestsService } from '../../service/request.service';
import { RequestResponse } from '../../model/request.model';

type ApproverScope = 'admin' | 'hr' | 'manager' | 'none';

@Component({
  selector: 'app-request-approvals',
  standalone: true,
  imports: [DatePipe, RouterLink, TuiBadge, TuiButton, TuiIcon, TuiCardLarge, MainHeading],
  templateUrl: './request-approvals.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestApprovals implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly requestsService = inject(RequestsService);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly scope = computed<ApproverScope>(() => {
    const roles = this.currentUser()?.employeeInfo?.roles ?? [];
    if (roles.includes('Admin')) return 'admin';
    if (roles.includes('HR')) return 'hr';
    return this.currentUser()?.employeeInfo?.id ? 'manager' : 'none';
  });

  protected readonly scopeLabel = computed(() => {
    switch (this.scope()) {
      case 'admin':
        return 'All company requests';
      case 'hr':
        return "Your team's requests, plus all compassionate leave requests company-wide";
      case 'manager':
        return "Your team's requests";
      default:
        return '';
    }
  });

  protected requests = signal<RequestResponse[]>([]);
  protected isLoading = signal(true);
  protected loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    const scope = this.scope();
    const employeeId = this.currentUser()?.employeeInfo?.id;

    const request$ =
      scope === 'admin'
        ? this.requestsService.getAllPendingRequests()
        : scope === 'hr'
          ? this.requestsService.getHrPendingRequests()
          : employeeId
            ? this.requestsService.getManagerPendingRequests(employeeId)
            : null;

    if (!request$) {
      this.isLoading.set(false);
      this.requests.set([]);
      return;
    }

    request$.subscribe({
      next: (response) => {
        this.requests.set(response.isSuccess && response.data ? response.data : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load pending requests.');
        this.isLoading.set(false);
      },
    });
  }

  protected getRequestTypeIcon(requestType: string): string {
    const iconMap: Record<string, string> = {
      leave: '@tui.volleyball',
      workfromhome: '@tui.home',
      attendanceregularization: '@tui.clock',
    };
    return iconMap[requestType.toLowerCase()] ?? '@tui.file';
  }

  protected dateRangeLabel(req: RequestResponse): string {
    return req.startDate === req.endDate ? req.startDate : `${req.startDate} - ${req.endDate}`;
  }
}
