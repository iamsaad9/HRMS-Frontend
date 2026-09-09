import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiIcon, TuiDialogService, TuiGroup, TuiInput } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { ToastService } from '../../../../../core/services/toast.service';
import { CategoryType } from '../../../employees/model/employee.model';
import { Holiday, HolidayService } from '../../service/holiday.service';
import { AddCalendarEventModal, CalendarEventFormValue } from '../../components/add-calendar-event-modal/add-calendar-event-modal';
import { MainHeading } from "../../../../../shared/components/main-heading/main-heading";

type EventType = 'work-day' | 'weekend' | 'holiday' | 'optional-holiday' | 'training-day' | 'custom-event';

const EVENT_TYPE_TO_HOLIDAY_TYPE = {
  'work-day': 'WorkDay',
  weekend: 'Weekend',
  holiday: 'BankHoliday',
  'optional-holiday': 'BankHoliday',
  'training-day': 'TrainingDay',
  'custom-event': 'Other',
} as const satisfies Record<EventType, string>;

const HOLIDAY_TYPE_TO_EVENT_TYPE: Record<string, EventType> = {
  TermBreak: 'holiday',
  HalfTerm: 'holiday',
  BankHoliday: 'holiday',
};

interface SidebarCategoryItem {
  category: CategoryType;
  name: string;
  scope: string;
  requiresAcademicYear: boolean;
}

interface DayCell {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: Holiday[];
}

function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

@Component({
  selector: 'app-holiday-calendar',
  imports: [FormsModule, DatePipe, TuiButton, TuiIcon, TuiBadge, TuiTable, TuiCardLarge, TuiGroup, TuiInput, MainHeading],
  templateUrl: './holiday-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HolidayCalendar {
  private readonly dialogs = inject(TuiDialogService);
  private readonly holidayService = inject(HolidayService);
  private readonly toast = inject(ToastService);

  protected readonly CategoryType = CategoryType;

  protected readonly eventTypeMeta: Record<EventType, { label: string; color: string }> = {
    'work-day': { label: 'Work Day', color: '#22C55E' },
    weekend: { label: 'Weekend', color: '#9CA3AF' },
    holiday: { label: 'Holiday', color: '#A78BFA' },
    'optional-holiday': { label: 'Optional Holiday', color: '#93C5FD' },
    'training-day': { label: 'Training Day', color: '#FBBF24' },
    'custom-event': { label: 'Custom Event', color: '#22D3EE' },
  };

  protected readonly legendEntries = Object.entries(this.eventTypeMeta) as [
    EventType,
    { label: string; color: string },
  ][];

  // ---- SIDEBAR: employee categories replace the old generic "custom calendars" list ----
  protected readonly sidebarCategories: SidebarCategoryItem[] = [
    {
      category: CategoryType.Administrative,
      name: 'Administrative',
      scope: 'Administrative staff',
      requiresAcademicYear: false,
    },
    {
      category: CategoryType.Academic,
      name: 'Academic',
      scope: 'Academic staff',
      requiresAcademicYear: true,
    },
  ];

  protected selectedCategory = signal<CategoryType | null>(null);
  protected academicYear = signal<string>(currentAcademicYear());
  protected isLoading = signal(false);
  protected hasSearched = signal(false);
  protected holidays = signal<Holiday[]>([]);

  protected canLoad(): boolean {
    const category = this.selectedCategory();
    if (category === null) return false;
    if (category === CategoryType.Academic) return !!this.academicYear().trim();
    return true;
  }

  protected selectCategory(category: CategoryType): void {
    this.selectedCategory.set(category);
    this.holidays.set([]);
    this.hasSearched.set(false);

    if (category !== CategoryType.Academic || this.academicYear().trim()) {
      this.loadHolidays();
    }
  }

  protected onAcademicYearChange(value: string): void {
    this.academicYear.set(value);
    if (this.selectedCategory() === CategoryType.Academic && value.trim()) {
      this.loadHolidays();
    }
  }

  protected loadHolidays(): void {
    const category = this.selectedCategory();
    if (category === null) return;

    this.isLoading.set(true);
    const academicYear = category === CategoryType.Academic ? this.academicYear().trim() : null;

    this.holidayService.getHolidays(category, academicYear).subscribe({
      next: (response) => {
        this.holidays.set(response.isSuccess && response.data ? response.data : []);
        this.hasSearched.set(true);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasSearched.set(true);
        this.isLoading.set(false);
        this.toast.error('Could not load holiday calendar entries.', 'Load Failed');
      },
    });
  }

  // ---- CALENDAR STATE (unchanged from the original custom-calendar) ----
  protected viewMode = signal<'month' | 'week' | 'list'>('month');
  protected showLegend = signal<boolean>(true);
  protected cursorDate = signal<Date>(new Date());

  protected monthLabel = computed(() =>
    this.cursorDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
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
    const holidays = this.holidays();

    const cells: DayCell[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);

      cells.push({
        date,
        inCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, today),
        events: holidays.filter((h) => this.isDateWithinHoliday(date, h)),
      });
    }
    return cells;
  });

  private isDateWithinHoliday(date: Date, holiday: Holiday): boolean {
    const iso = this.toIso(date);
    const start = holiday.startDate.slice(0, 10);
    const end = (holiday.endDate ?? holiday.startDate).slice(0, 10);
    return iso >= start && iso <= end;
  }

  protected eventColor(holiday: Holiday): string {
    const eventType = HOLIDAY_TYPE_TO_EVENT_TYPE[holiday.type] ?? (holiday.isOptional ? 'optional-holiday' : 'holiday');
    return this.eventTypeMeta[eventType].color;
  }

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

  protected setViewMode(mode: 'month' | 'week' | 'list'): void {
    this.viewMode.set(mode);
  }

  protected toggleLegend(): void {
    this.showLegend.update((v) => !v);
  }

  // ---- ADD / EDIT / DELETE HOLIDAY (kept using the existing generic event modal) ----
  protected addHolidayToday(): void {
    const today = new Date();
    this.onDayClick({ date: today, inCurrentMonth: true, isToday: true, events: [] });
  }

  protected onDayClick(cell: DayCell): void {
    const category = this.selectedCategory();
    if (category === null) {
      this.toast.error('Select a category first.', 'No Category Selected');
      return;
    }

    const existing = cell.events[0];

    this.dialogs
      .open<CalendarEventFormValue | null>(new PolymorpheusComponent(AddCalendarEventModal), {
        label: existing ? 'Edit Holiday' : 'Add Holiday',
        size: 's',
        data: {
          date: this.toIso(cell.date),
          title: existing?.title ?? '',
          // NOTE: existing.type comes from the Holiday API's type union; we map it
          // down to the modal's simpler EventType just so the form has something
          // sensible pre-selected.
          type: existing ? HOLIDAY_TYPE_TO_EVENT_TYPE[existing.type] ?? 'holiday' : 'holiday',
        },
      })
      .subscribe((result) => {
        if (!result) return;
        this.saveHoliday(result, category, existing);
      });
  }

  private saveHoliday(result: CalendarEventFormValue, category: CategoryType, existing?: Holiday): void {
  
    // const payload = {
    //   title: result.title,
    //   startDate: result.date,
    //   endDate: result.date,
    //   type: (EVENT_TYPE_TO_HOLIDAY_TYPE[result.type as EventType] ?? 'BankHoliday') as Holiday['type'],
    //   applicableCategory: category,
    //   isOptional: result.type === 'optional-holiday',
    //   academicYear: category === CategoryType.Academic ? this.academicYear().trim() : currentAcademicYear(),
    // };

    // if (existing) {
    
    //   this.holidayService.deleteHoliday(existing.id).subscribe();
    // }

    // this.holidayService.createHoliday(payload).subscribe({
    //   next: (response) => {
    //     if (response.isSuccess) {
    //       this.toast.success('Holiday saved.', 'Saved');
    //       this.loadHolidays();
    //     } else {
    //       this.toast.error(response.message || 'Could not save holiday.', 'Save Failed');
    //     }
    //   },
    //   error: (err) => this.toast.error(err?.error?.message || 'Could not save holiday.', 'Save Failed'),
    // });
  }

  protected deleteHoliday(holiday: Holiday, event: MouseEvent): void {
    event.stopPropagation();
    this.holidayService.deleteHoliday(holiday.id).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Holiday deleted.', 'Deleted');
          this.holidays.update((list) => list.filter((h) => h.id !== holiday.id));
        }
      },
      error: () => this.toast.error('Could not delete this holiday.', 'Delete Failed'),
    });
  }
}