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


private readonly dialogs = inject(TuiDialogService);

protected addShift(): void {
  this.dialogs
    .open<ShiftFormValue | null>(new PolymorpheusComponent(AddShiftModal), {
      label: 'Add Shift',
      size: 'm',
      data: null,
    })
    .subscribe((result) => {
      if (!result) return;

      // TODO: replace with real API call + response mapping to your Shift display model
      this.shifts.update((list) => [
        ...list,
        {
          id: crypto.randomUUID(),
          name: result.name,
          icon: '@tui.sun',
          iconBg: '#DCFCE7',
          status: result.isDefault ? 'active' : 'inactive',
          startTime: result.startTime,
          endTime: result.endTime,
          days: [],
          autoBreakStart: '',
          autoBreakEnd: '',
          paidBreak: false,
        },
      ]);
    });
}

protected editShift(shift: Shift): void {
  this.dialogs
    .open<ShiftFormValue | null>(new PolymorpheusComponent(AddShiftModal), {
      label: 'Edit Shift',
      size: 'm',
      data: {
        code: '', // TODO: map from your Shift model once `code` is part of it
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriodLateMinutes: null,
        gracePeriodEarlyExitMinutes: null,
        isDefault: shift.status === 'active',
      },
    })
    .subscribe((result) => {
      if (!result) return;
      // TODO: call update API, then patch the corresponding entry in `shifts()`
    });
}
  // ---- STUBS: implement later ----

  protected saveChanges(): void {
    // TODO: persist all pending changes (shifts, penalty rules, calendars)
  }

  protected deleteShift(shift: Shift): void {
    // TODO: confirm + call delete API
  }

  protected toggleShiftStatus(shift: Shift): void {
    // TODO: call API to toggle status, then update local signal on success
  }

  protected openShiftMenu(shift: Shift): void {
    // TODO: open dropdown (duplicate, view assignees, etc.)
  }

  protected addCalendar(): void {
    // TODO: open add-calendar dialog/form
  }

}