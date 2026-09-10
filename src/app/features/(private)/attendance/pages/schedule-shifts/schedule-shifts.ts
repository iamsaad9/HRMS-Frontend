import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiDialogService, TuiIcon } from '@taiga-ui/core';
import { TuiTabs, TuiSwitch } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AddShiftModal, ShiftFormValue } from '../../components/add-shift-modal/add-shift-modal';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';

interface Shift {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  status: 'active' | 'inactive';
  startTime: string;
  endTime: string;
  days: string[];
  autoBreakStart: string;
  autoBreakEnd: string;
  paidBreak: boolean;
}


@Component({
  selector: 'app-schedule-shift',
  imports: [
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiTabs,
    TuiSwitch,
    TuiCardLarge,
    MainHeading,
],
  templateUrl: './schedule-shifts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleShift {
  protected activeTabIndex = signal<number>(0);

  // ---- MOCK DATA ----
  protected shifts = signal<Shift[]>([
    {
      id: '1',
      name: 'Morning Shift',
      icon: '@tui.sun',
      iconBg: '#DCFCE7',
      status: 'active',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      autoBreakStart: '01:00 PM',
      autoBreakEnd: '02:00 PM',
      paidBreak: true,
    },
    {
      id: '2',
      name: 'Evening Shift',
      icon: '@tui.sunset',
      iconBg: '#DBEAFE',
      status: 'active',
      startTime: '02:00 PM',
      endTime: '10:00 PM',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      autoBreakStart: '06:00 PM',
      autoBreakEnd: '06:30 PM',
      paidBreak: true,
    },
    {
      id: '3',
      name: 'Night Shift',
      icon: '@tui.moon-star',
      iconBg: '#EDE9FE',
      status: 'inactive',
      startTime: '10:00 PM',
      endTime: '06:00 AM',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      autoBreakStart: '02:00 AM',
      autoBreakEnd: '02:30 AM',
      paidBreak: true,
    },
  ]);
}