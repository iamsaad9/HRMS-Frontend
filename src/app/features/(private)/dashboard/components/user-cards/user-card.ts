import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';

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
  imports: [TuiIcon, TuiCardLarge, TuiHeader, TuiAvatar, MatIcon],
})
export class UserCardsComponent {
  // Profile Data
  readonly user = {
    name: 'Saad Masood',
    role: 'Junior Associate Developer',
    department: 'Development',
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
    todayStatus: {
      isClockedIn: true,
      startTime: '09:00 AM',
      endTime: null, // Set to string like '05:30 PM' when clocked out
    },
  };

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
}
