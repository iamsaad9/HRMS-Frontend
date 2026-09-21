import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TuiButton, TuiExpand, TuiTitle, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiElasticContainer } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
import { RequestResponse } from '../../model/request.model';
import { TuiBadge, TuiChevron } from '@taiga-ui/kit';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { RequestsService } from '../../service/request.service';

interface MonthGroup {
  key: string;
  label: string;
  requests: RequestResponse[];
}

type StatusFilter = 'All' | 'Pending' | 'Approved' | 'Rejected';
export type RequestTypeFilter = 'All' | 'leave' | 'workfromhome' | 'attendanceregularization';

@Component({
  selector: 'app-all-my-requests',
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
    TuiIcon,
    RouterLink,
    FormsModule,
  ],
  templateUrl: './my-requests.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllMyRequestsComponent implements OnInit {
  private readonly requestsService = inject(RequestsService);
  private readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  protected requests = signal<RequestResponse[]>([]);
  protected isLoading = signal(false);
  protected loadError = signal<string | null>(null);
  protected expandedMonths = signal<Record<string, boolean>>({});
  protected statusFilter = signal<StatusFilter>('All');
  protected typeFilter = signal<RequestTypeFilter>('All');

  // Type-filtered list; feed this into monthGroups() and requestStats() instead of requests()
  private readonly typeFilteredRequests = computed(() => {
    const type = this.typeFilter();
    const all = this.requests();
    if (type === 'All') return all;
    return all.filter((r) => r.requestType.toLowerCase().replace(/[\s_-]/g, '') === type);
  });

  protected requestStats = computed(() => {
    const all = this.requests();
    return {
      total: all.length,
      approved: all.filter((r) => r.overallStatus === 'Approved').length,
      rejected: all.filter((r) => r.overallStatus === 'Rejected').length,
      pending: all.filter((r) => r.overallStatus === 'Pending').length,
    };
  });

  private readonly filteredRequests = computed(() => {
    const status = this.statusFilter();
    const typeFiltered = this.typeFilteredRequests();
    return status === 'All' ? typeFiltered : typeFiltered.filter((r) => r.overallStatus === status);
  });

  protected monthGroups = computed<MonthGroup[]>(() => {
    const groups = new Map<string, RequestResponse[]>();

    for (const req of this.filteredRequests()) {
      const key = req.startDate.slice(0, 7); // 'YYYY-MM'
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(req);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, reqs]) => ({
        key,
        label: this.formatMonthLabel(key),
        requests: [...reqs].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)),
      }));
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  protected loadRequests(): void {
    this.isLoading.set(true);

    this.requestsService
      .getAllMyRequests(this.currentUser()?.employeeInfo.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.requests.set(response.data);
            this.initExpandedState(response.data);
          } else {
            this.loadError.set('Unable to load your requests.');
          }
        },
        error: () => this.loadError.set('Unable to load your requests.'),
      });
  }

  private initExpandedState(data: RequestResponse[]): void {
    const keys = Array.from(new Set(data.map((r) => r.startDate.slice(0, 7)))).sort((a, b) =>
      b.localeCompare(a),
    );
    const expanded: Record<string, boolean> = {};
    keys.forEach((key, i) => (expanded[key] = i === 0));
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
      case 'Pending':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  protected dateRangeLabel(req: RequestResponse): string {
    return req.startDate === req.endDate ? req.startDate : `${req.startDate} - ${req.endDate}`;
  }

  protected totalDaysLabel(days: number): string {
    return days === 1 ? '1 day' : `${days} days`;
  }

  protected getRequestTypeIcon(requestType: string): string {
    const iconMap: Record<string, string> = {
      leave: '@tui.volleyball',
      workfromhome: '@tui.home',
      attendanceregularization: '@tui.clock',
      default: '@tui.file',
    };
    return iconMap[requestType.toLowerCase()];
  }
}
