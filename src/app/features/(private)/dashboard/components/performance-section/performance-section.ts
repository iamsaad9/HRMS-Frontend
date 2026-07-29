import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLineChart, TuiAxes } from '@taiga-ui/addon-charts';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiPoint } from '@taiga-ui/core';
import { TeamMember } from './performance-section.model';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';

@Component({
  selector: 'app-performance-section',
  standalone: true,
  imports: [CommonModule, TuiLineChart, TuiAxes, TuiAvatar, TuiCardLarge, MatIcon],
  templateUrl: './performance-section.html',
})
export class PerformanceSection {
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

  // Mock team members list
  readonly teamMembers = signal<TeamMember[]>([
    {
      id: 'usr-1',
      name: 'Alex Rivera',
      role: 'Frontend Engineer',
      status: 'online',
      attendanceRate: '98%',
    },
    {
      id: 'usr-2',
      name: 'Sarah Jenkins',
      role: 'UI/UX Designer',
      status: 'online',
      attendanceRate: '96%',
    },
    {
      id: 'usr-3',
      name: 'Maria Chen',
      role: 'Backend Developer',
      status: 'busy',
      attendanceRate: '92%',
    },
    {
      id: 'usr-4',
      name: 'James Wilson',
      role: 'QA Engineer',
      status: 'leave',
      attendanceRate: '89%',
    },
  ]);
}
