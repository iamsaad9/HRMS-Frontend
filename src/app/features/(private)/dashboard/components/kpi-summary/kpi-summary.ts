import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCard } from '../../dashboard.model';
import { TuiExpand, TuiPoint } from '@taiga-ui/core';
import {
  TuiRingChart,
  TuiLineChart,
  TuiAxes,
  TuiLegendItem,
  TuiArcChart,
} from '@taiga-ui/addon-charts';
import { TuiAccordion, TuiChevron, TuiProgressCircle } from '@taiga-ui/kit';
import { FormsModule } from '@angular/forms';
import { TuiCard, TuiCardLarge, TuiHeader, TuiSubheaderComponent } from '@taiga-ui/layout';
import { tuiSum } from '@taiga-ui/cdk';
import { MatIcon } from '@angular/material/icon';
import { TuiAmountPipe } from '@taiga-ui/addon-commerce';

@Component({
  selector: 'app-kpi-summary',
  standalone: true,
  imports: [
    TuiAmountPipe,
    CommonModule,
    TuiRingChart,
    TuiCardLarge,
    TuiProgressCircle,
    FormsModule,
    TuiHeader,
    TuiLegendItem,
    TuiArcChart,
    MatIcon,
    TuiCard,
    TuiChevron,
    TuiAccordion,
    TuiExpand,
  ],
  templateUrl: './kpi-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiSummary {
  readonly attendanceValues = signal<number[]>([57, 8, 4, 3]);
  readonly labels = ['Present', 'Absent', 'Leave', 'WFH'];
  readonly headcountProgress = signal<number>(0.925);
  protected activeItemIndex = Number.NaN;
  protected readonly sum = tuiSum(...this.attendanceValues());
  protected collapsed = signal(false);
  readonly payrollTrendData: readonly TuiPoint[] = [
    [0, 160],
    [1, 165],
    [2, 172],
    [3, 170],
    [4, 180],
    [5, 184.5],
  ];
  expanded = true;

  toggleExpand(): void {
    this.expanded = !this.expanded;
  }

  protected isItemActive(index: number): boolean {
    return this.activeItemIndex === index;
  }
  protected onHover(index: number, hovered: boolean): void {
    this.activeItemIndex = hovered ? index : Number.NaN;
  }
  protected index = Number.NaN;

  protected get label(): string {
    return (Number.isNaN(this.index) ? 'Total' : this.labels[this.index]) ?? '';
  }
  readonly kpiCards = signal<KpiCard[]>([
    {
      id: 'total-employees',
      title: 'Total Headcount',
      value: 148,
      changeLabel: '+6 this month',
      trend: 'up',
      subtext: 'vs. 142 last month',
      icon: 'users',
    },
    {
      id: 'attendance-rate',
      title: "Today's Attendance",
      value: '92.5%',
      changeLabel: '137 Present',
      trend: 'up',
      subtext: '8 Leave • 3 Absent',
      icon: 'calendar-check',
    },
    {
      id: 'payroll-cost',
      title: 'Monthly Payroll Cost',
      value: '$184,500',
      changeLabel: '+2.4%',
      trend: 'down',
      subtext: 'Next payout: Aug 30',
      icon: 'dollar-sign',
    },
    {
      id: 'pending-requests',
      title: 'Pending Approvals',
      value: 7,
      changeLabel: 'Requires Action',
      trend: 'neutral',
      subtext: '4 Leaves • 3 Expenses',
      icon: 'clock',
    },
  ]);
}
