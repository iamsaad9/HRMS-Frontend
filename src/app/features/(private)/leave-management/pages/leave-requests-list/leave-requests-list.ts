import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { TuiButton, TuiExpand, TuiTitle, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiElasticContainer } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
import { LeaveRequestResponse} from '../../model/leave-request.model';
import { TuiBadge, TuiChevron } from '@taiga-ui/kit';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { LeaveRequestsService } from '../../service/leave-requests.service';

interface MonthGroup {
  key: string;
  label: string;
  requests: LeaveRequestResponse[];
}

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [
    TuiCardLarge,
    TuiBadge,
    TuiButton,
    TuiChevron,
    TuiElasticContainer,
    TuiExpand,
    MatIcon,
    DatePipe,
    MainHeading,
    TuiIcon
],
  templateUrl: './leave-requests-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveRequestList implements OnInit {
  private readonly leaveService = inject(LeaveRequestsService);
  private readonly authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  protected requests = signal<LeaveRequestResponse[]>([]);


  protected isLoading = signal(false);
  protected loadError = signal<string | null>(null);
  protected expandedMonths = signal<Record<string, boolean>>({});
    protected leaveStats = computed(() => {
  const all = this.requests();
  return {
    total: all.length,
    approved: all.filter((r) => r.status === 'Approved').length,
    rejected: all.filter((r) => r.status === 'Rejected').length,
  };
});
  protected monthGroups = computed<MonthGroup[]>(() => {
    const groups = new Map<string, LeaveRequestResponse[]>();

    for (const req of this.requests()) {
      const key = req.startDate.slice(0, 7); // 'YYYY-MM'
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(req);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, reqs]) => ({
        key,
        label: this.formatMonthLabel(key),
        requests: [...reqs].sort((a, b) => b.startDate.localeCompare(a.startDate)),
      }));
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  private loadRequests(): void {
    this.isLoading.set(true);
    // this.loadError.set(null);

    this.leaveService
      .getAllLeaves(this.currentUser()?.employeeInfo.employeeId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.requests.set(response.data);
            this.initExpandedState(response.data);
          } else {
            this.loadError.set('Unable to load your leave requests.');
          }
        },
        error: () => this.loadError.set('Unable to load your leave requests.'),
      });
  }

  private initExpandedState(data: LeaveRequestResponse[]): void {
    const keys = Array.from(new Set(data.map((r) => r.startDate.slice(0, 7)))).sort((a, b) =>
      b.localeCompare(a),
    );
    const expanded: Record<string, boolean> = {};
    keys.forEach((key, i) => (expanded[key] = i === 0)); // only the most recent month opens by default
    this.expandedMonths.set(expanded);
  }

  protected toggleMonth(key: string): void {
    this.expandedMonths.update((state) => ({ ...state, [key]: !state[key] }));
  }

  protected isExpanded(key: string): boolean {
    return !!this.expandedMonths()[key];
  }

  private formatMonthLabel(key: string): string {
    const [year, month] = key.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  protected statusAppearance(status: string): string {
    switch (status) {
      case 'Approved':
        return 'positive';
      case 'Rejected':
        return 'negative';
      default:
        return 'warning';
    }
  }

  // protected durationLabel(req: LeaveRequestResponse): string {
  //   switch (req.durationType) {
  //     case 'full_day':
  //       return 'Full Day';
  //     case 'half_day':
  //       return req.halfDayPeriod === 'first_half' ? 'Half Day (Morning)' : 'Half Day (Afternoon)';
  //     case 'custom_hours':
  //       return req.customHours ? `${req.customHours.startTime} - ${req.customHours.endTime}` : 'Custom Hours';
  //     default:
  //       return '';
  //   }
  // }

  protected dateRangeLabel(req: LeaveRequestResponse): string {
    return req.startDate === req.endDate ? req.startDate : `${req.startDate} - ${req.endDate}`;
  }
}