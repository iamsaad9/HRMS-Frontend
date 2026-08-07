import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TuiLineChart, TuiAxes } from '@taiga-ui/addon-charts';
import { TuiAvatar } from '@taiga-ui/kit';
import { TuiButton, TuiPoint } from '@taiga-ui/core';
import { TeamMember } from './performance-section.model';
import { MatIcon } from '@angular/material/icon';
import { TuiCardLarge } from '@taiga-ui/layout';

@Component({
  selector: 'app-performance-section',
  standalone: true,
  imports: [CommonModule, TuiButton, TuiAvatar, TuiCardLarge, MatIcon],
  templateUrl: './performance-section.html',
})
export class PerformanceSection {
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
