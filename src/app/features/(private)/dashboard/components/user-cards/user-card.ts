import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiIcon, TuiPoint } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
import { TuiAxes, TuiLineChart } from '@taiga-ui/addon-charts';

export interface ClockHistoryItem {
  date: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: string;
}

@Component({
  selector: 'app-user-cards',
  templateUrl: './user-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiIcon, TuiCardLarge, TuiHeader, TuiAvatar, MatIcon, TuiAxes, TuiLineChart],
})
export class UserCardsComponent {
  // Profile Data

  // Last 7 Days Clock-in/Clock-out History
  clockHistory: ClockHistoryItem[] = [
    { date: 'Today', clockIn: '09:00 AM', clockOut: '--:--', totalHours: 'In Progress' },
    { date: 'Yesterday', clockIn: '08:55 AM', clockOut: '05:15 PM', totalHours: '8h 20m' },
    { date: 'Jul 27, Mon', clockIn: '09:05 AM', clockOut: '05:30 PM', totalHours: '8h 25m' },
    { date: 'Jul 26, Sun', clockIn: '09:00 AM', clockOut: '05:00 PM', totalHours: '8h 00m' },
    { date: 'Jul 25, Sat', clockIn: '08:48 AM', clockOut: '04:55 PM', totalHours: '8h 07m' },
    { date: 'Jul 24, Fri', clockIn: '09:12 AM', clockOut: '05:45 PM', totalHours: '8h 33m' },
    { date: 'Jul 23, Thu', clockIn: '08:58 AM', clockOut: '05:02 PM', totalHours: '8h 04m' },
  ];

  readonly performanceTrend: readonly TuiPoint[] = [
    [0, 78],
    [1, 82],
    [2, 80],
    [3, 88],
    [4, 91],
    [5, 95],
    [6, 92],
    [7, 89],
    [8, 93],
    [9, 90],
    [10, 87],
    [11, 85],
    [12, 88],
    [13, 91],
    [14, 94],
    [15, 93],
    [16, 90],
    [17, 88],
    [18, 92],
    [19, 95],
    [20, 97],
    [21, 94],
    [22, 91],
    [23, 89],
    [24, 93],
    [25, 96],
    [26, 95],
    [27, 92],
    [28, 94],
    [29, 98],
  ];

  readonly axisXLabels: readonly string[] = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
}
