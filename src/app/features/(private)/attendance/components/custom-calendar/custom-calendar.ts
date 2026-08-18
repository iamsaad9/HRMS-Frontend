import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TuiButton, TuiIcon,  TuiDialogService, TuiGroup } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { AddCalendarEventModal, CalendarEventFormValue } from '../add-calendar-event-modal/add-calendar-event-modal';

type EventType = 'work-day' | 'weekend' | 'holiday' | 'optional-holiday' | 'training-day' | 'custom-event';

interface CustomCalendarDef {
  id: string;
  name: string;
  scope: string;
  isDefault: boolean;
}

interface CalendarEvent {
  id: string;
  calendarId: string;
  date: string; // ISO yyyy-MM-dd
  title: string;
  type: EventType;
}

interface DayCell {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-custom-calendar',
  imports: [TuiButton, TuiIcon,  TuiCardLarge,TuiGroup],
  templateUrl: './custom-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomCalendar {
  private readonly dialogs = inject(TuiDialogService);

  protected readonly eventTypeMeta: Record<EventType, { label: string; color: string }> = {
    'work-day': { label: 'Work Day', color: '#22C55E' },
    weekend: { label: 'Weekend', color: '#9CA3AF' },
    holiday: { label: 'Holiday', color: '#A78BFA' },
    'optional-holiday': { label: 'Optional Holiday', color: '#93C5FD' },
    'training-day': { label: 'Training Day', color: '#FBBF24' },
    'custom-event': { label: 'Custom Event', color: '#22D3EE' },
  };

  protected readonly legendEntries = Object.entries(this.eventTypeMeta) as [EventType, { label: string; color: string }][];

  // ---- MOCK DATA ----
  protected calendars = signal<CustomCalendarDef[]>([
    { id: '1', name: 'Company Default Calendar', scope: 'All Locations', isDefault: true },
    { id: '2', name: 'Manufacturing Unit Calendar', scope: 'Manufacturing Department', isDefault: false },
    { id: '3', name: 'Sales Team Calendar', scope: 'Sales Department', isDefault: false },
    { id: '4', name: 'Canada Office Calendar', scope: 'Canada Office', isDefault: false },
  ]);

  protected selectedCalendarId = signal<string>('1');

  protected events = signal<CalendarEvent[]>([
    { id: 'e1', calendarId: '1', date: '2025-05-01', title: 'Labor Day', type: 'holiday' },
    { id: 'e2', calendarId: '1', date: '2025-05-05', title: 'Training Day', type: 'training-day' },
    { id: 'e3', calendarId: '1', date: '2025-05-12', title: 'Company Holiday', type: 'holiday' },
    { id: 'e4', calendarId: '1', date: '2025-05-19', title: 'Memorial Day', type: 'optional-holiday' },
  ]);

  // ---- CALENDAR STATE ----
  protected viewMode = signal<'month' | 'week' | 'list'>('month');
  protected showLegend = signal<boolean>(true);
  protected cursorDate = signal<Date>(new Date(2025, 4, 1)); // May 2025, matches mock data

  protected monthLabel = computed(() =>
    this.cursorDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  protected readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  protected calendarGrid = computed<DayCell[]>(() => {
    const cursor = this.cursorDate();
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sun
    const gridStart = new Date(year, month, 1 - startOffset);

    const today = new Date();
    const eventsForSelectedCalendar = this.events().filter(
      (e) => e.calendarId === this.selectedCalendarId(),
    );

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);

      const iso = this.toIso(date);
      cells.push({
        date,
        inCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, today),
        events: eventsForSelectedCalendar.filter((e) => e.date === iso),
      });
    }
    return cells;
  });

  private toIso(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // ---- NAVIGATION ----
  protected prevMonth(): void {
    const d = this.cursorDate();
    this.cursorDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const d = this.cursorDate();
    this.cursorDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  protected goToToday(): void {
    const now = new Date();
    this.cursorDate.set(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  protected selectCalendar(calendarId: string): void {
    this.selectedCalendarId.set(calendarId);
  }

  protected setViewMode(mode: 'month' | 'week' | 'list'): void {
    this.viewMode.set(mode);
  }

  protected toggleLegend(): void {
    this.showLegend.update((v) => !v);
  }

  // ---- STUBS: implement later ----

  protected addCalendar(): void {
    // TODO: open add-calendar dialog/form (name, scope: locations/departments/teams)
  }

  protected openCalendarMenu(cal: CustomCalendarDef): void {
    // TODO: dropdown menu — rename, duplicate, set default, delete
  }

  protected onDayClick(cell: DayCell): void {
    const existing = cell.events[0];

    this.dialogs
      .open<CalendarEventFormValue | null>(new PolymorpheusComponent(AddCalendarEventModal), {
        label: existing ? 'Edit Event' : 'Add Event',
        size: 's',
        data: {
          date: this.toIso(cell.date),
          title: existing?.title ?? '',
          type: existing?.type ?? 'holiday',
        },
      })
      .subscribe((result) => {
        if (!result) return;
        // TODO: call CalendarService.saveEvent(this.selectedCalendarId(), result)
        // then refresh `events` from the API response instead of mutating locally
      });
  }
}