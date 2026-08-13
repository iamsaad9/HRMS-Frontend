import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { TuiButton, TuiExpand, TuiTitle, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiElasticContainer } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
import { LeaveRequestResponseDto, leaveTypeToLabel } from '../../model/leave-request.model';
import { TuiBadge, TuiChevron } from '@taiga-ui/kit';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { LeaveRequestsService } from '../../service/leave-requests.service';

interface MonthGroup {
  key: string;
  label: string;
  requests: LeaveRequestResponseDto[];
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
    TuiTitle,
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
  protected readonly leaveTypeToLabel = leaveTypeToLabel;

//   protected requests = signal<LeaveRequestResponseDto[]>([]);

protected requests = signal<LeaveRequestResponseDto[]> ( [
  // ── August 2026 ──
  {
    id: 'lr-9f1a2b3c-0001',
    userId: 'emp-10482',
    leaveType: 'annual',
    startDate: '2026-08-18',
    endDate: '2026-08-20',
    durationType: 'full_day',
    reason: 'Family trip planned for the long weekend.',
    status: 'Pending',
    createdAtUtc: '2026-08-10T09:15:00.000Z',
  },
  {
    id: 'lr-9f1a2b3c-0002',
    userId: 'emp-10482',
    leaveType: 'sick',
    startDate: '2026-08-05',
    endDate: '2026-08-05',
    durationType: 'full_day',
    reason: 'Down with fever, need to rest and see a doctor.',
    status: 'Approved',
    adminRemarks: 'Get well soon. Approved without documentation.',
    createdAtUtc: '2026-08-05T07:40:00.000Z',
  },
  {
    id: 'lr-9f1a2b3c-0003',
    userId: 'emp-10482',
    leaveType: 'wfh',
    startDate: '2026-08-12',
    endDate: '2026-08-12',
    durationType: 'half_day',
    halfDayPeriod: 'second_half',
    reason: 'Waiting for a home appliance delivery in the afternoon.',
    status: 'Approved',
    createdAtUtc: '2026-08-11T13:20:00.000Z',
  },

  // ── July 2026 ──
  {
    id: 'lr-9f1a2b3c-0004',
    userId: 'emp-10482',
    leaveType: 'casual',
    startDate: '2026-07-22',
    endDate: '2026-07-22',
    durationType: 'custom_hours',
    customHours: { startTime: '14:00', endTime: '18:00' },
    reason: 'Personal appointment in the afternoon.',
    status: 'Rejected',
    adminRemarks: 'Overlaps with the sprint review — please reschedule your appointment if possible.',
    createdAtUtc: '2026-07-20T11:05:00.000Z',
  },
  {
    id: 'lr-9f1a2b3c-0005',
    userId: 'emp-10482',
    leaveType: 'annual',
    startDate: '2026-07-01',
    endDate: '2026-07-04',
    durationType: 'full_day',
    reason: 'Pre-planned vacation, tickets already booked.',
    status: 'Approved',
    adminRemarks: 'Enjoy your trip!',
    createdAtUtc: '2026-06-15T10:00:00.000Z',
  },
  {
    id: 'lr-9f1a2b3c-0006',
    userId: 'emp-10482',
    leaveType: 'wfh',
    startDate: '2026-07-09',
    endDate: '2026-07-09',
    durationType: 'half_day',
    halfDayPeriod: 'first_half',
    reason: 'Internet technician visit scheduled in the morning.',
    status: 'Approved',
    createdAtUtc: '2026-07-08T16:45:00.000Z',
  },

  // ── June 2026 ──
  {
    id: 'lr-9f1a2b3c-0007',
    userId: 'emp-10482',
    leaveType: 'unpaid',
    startDate: '2026-06-25',
    endDate: '2026-06-27',
    durationType: 'full_day',
    reason: 'Extended personal leave beyond annual quota for a family event.',
    status: 'Approved',
    adminRemarks: 'Approved as unpaid since annual balance is exhausted.',
    createdAtUtc: '2026-06-10T08:30:00.000Z',
  },
  {
    id: 'lr-9f1a2b3c-0008',
    userId: 'emp-10482',
    leaveType: 'sick',
    startDate: '2026-06-03',
    endDate: '2026-06-04',
    durationType: 'full_day',
    reason: 'Recovering from a minor viral infection.',
    status: 'Approved',
    createdAtUtc: '2026-06-03T06:50:00.000Z',
  },
  {
    id: 'lr-9f1a2b3c-0009',
    userId: 'emp-10482',
    leaveType: 'others',
    startDate: '2026-06-15',
    endDate: '2026-06-15',
    durationType: 'custom_hours',
    customHours: { startTime: '09:00', endTime: '11:30' },
    reason: 'Attending a family court hearing.',
    status: 'Pending',
    createdAtUtc: '2026-06-14T18:10:00.000Z',
  },
]);


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
    const groups = new Map<string, LeaveRequestResponseDto[]>();

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
    // this.isLoading.set(true);
    // this.loadError.set(null);

    // this.leaveService
    //   .getMyLeaveRequests()
    //   .pipe(finalize(() => this.isLoading.set(false)))
    //   .subscribe({
    //     next: (response) => {
    //       if (response.isSuccess && response.data) {
    //         this.requests.set(response.data);
    //         this.initExpandedState(response.data);
    //       } else {
    //         this.loadError.set('Unable to load your leave requests.');
    //       }
    //     },
    //     error: () => this.loadError.set('Unable to load your leave requests.'),
    //   });
  }

  private initExpandedState(data: LeaveRequestResponseDto[]): void {
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

  protected durationLabel(req: LeaveRequestResponseDto): string {
    switch (req.durationType) {
      case 'full_day':
        return 'Full Day';
      case 'half_day':
        return req.halfDayPeriod === 'first_half' ? 'Half Day (Morning)' : 'Half Day (Afternoon)';
      case 'custom_hours':
        return req.customHours ? `${req.customHours.startTime} - ${req.customHours.endTime}` : 'Custom Hours';
      default:
        return '';
    }
  }

  protected dateRangeLabel(req: LeaveRequestResponseDto): string {
    return req.startDate === req.endDate ? req.startDate : `${req.startDate} - ${req.endDate}`;
  }
}