import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiIcon, TuiDialogService, TuiGroup, TuiInput, TuiCheckbox } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { ToastService } from '../../../../../core/services/toast.service';
import { CategoryType } from '../../../employees/model/employee.model';
import { Holiday, HolidayService, CreateHolidayCommand } from '../../service/holiday.service';
import { AddCalendarEventModal, HolidayFormValue } from '../../components/add-calendar-event-modal/add-calendar-event-modal';
import { MainHeading } from "../../../../../shared/components/main-heading/main-heading";

// The 4 real HolidayType values (see HolidayService's HolidayType enum).
type LegendKey = 'PublicHoliday' | 'BankHoliday' | 'TermBreak' | 'HalfTerm';

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
  imports: [FormsModule, DatePipe, TuiButton, TuiIcon, TuiBadge, TuiTable, TuiCardLarge, TuiGroup, TuiInput, TuiCheckbox, MainHeading],
  templateUrl: './holiday-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HolidayCalendar {
  private readonly dialogs = inject(TuiDialogService);
  private readonly holidayService = inject(HolidayService);
  private readonly toast = inject(ToastService);

  protected readonly CategoryType = CategoryType;

  protected readonly legendMeta: Record<LegendKey, { label: string; color: string }> = {
    PublicHoliday: { label: 'Public Holiday', color: '#A78BFA' },
    BankHoliday: { label: 'Bank Holiday', color: '#818CF8' },
    TermBreak: { label: 'Term Break', color: '#22D3EE' },
    HalfTerm: { label: 'Half Term', color: '#FBBF24' },
  };

  protected readonly legendEntries = Object.entries(this.legendMeta) as [
    LegendKey,
    { label: string; color: string },
  ][];

  // ---- SIDEBAR: employee categories ----
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
  protected showInactive = signal(false);

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

  protected onShowInactiveChange(value: boolean): void {
    this.showInactive.set(value);
    this.loadHolidays();
  }

  protected loadHolidays(): void {
    const category = this.selectedCategory();
    if (category === null) return;

    this.isLoading.set(true);
    const academicYear = category === CategoryType.Academic ? this.academicYear().trim() : null;

    this.holidayService.getHolidays(category, academicYear, this.showInactive()).subscribe({
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

  // ---- CALENDAR STATE ----
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
    const key = holiday.type as LegendKey;
    return this.legendMeta[key]?.color ?? this.legendMeta.BankHoliday.color;
  }

  /** yyyy-MM-dd from LOCAL date parts. `date.toISOString()` converts to UTC first, which shifts
   * the date by a day in any timezone ahead of UTC (midnight local -> the previous day in UTC) -
   * that was the cause of every holiday appearing one day later than stored on this calendar. */
  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  // ---- ADD HOLIDAY (always creates a new entry - there's no update-in-place endpoint, only
  // create + activate/deactivate, so a day already holding a holiday just adds another one) ----
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

    this.dialogs
      .open<HolidayFormValue | null>(new PolymorpheusComponent(AddCalendarEventModal), {
        label: 'Add Holiday',
        size: 's',
        data: { startDate: this.toIso(cell.date), category },
      })
      .subscribe((result) => {
        if (!result) return;
        this.saveHoliday(result, category);
      });
  }

  private saveHoliday(result: HolidayFormValue, category: CategoryType): void {
    const command: CreateHolidayCommand = {
      title: result.title,
      startDate: result.startDate,
      endDate: result.endDate,
      type: result.type,
      applicableCategory: category,
      isOptional: false,
      academicYear: category === CategoryType.Academic ? this.academicYear().trim() : currentAcademicYear(),
    };

    this.holidayService.createHoliday(command).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success('Holiday saved.', 'Saved');
          this.loadHolidays();
        } else {
          this.toast.error(response.message || 'Could not save holiday.', 'Save Failed');
        }
      },
      error: (err) => this.toast.error(err?.error?.message || 'Could not save holiday.', 'Save Failed'),
    });
  }

  /** Soft-delete/restore - never a hard delete, since historical attendance/payroll records may
   * already reference the date a holiday applied to. */
  protected toggleHolidayStatus(holiday: Holiday, event: MouseEvent): void {
    event.stopPropagation();
    const nextActive = !holiday.isActive;

    this.holidayService.setHolidayStatus(holiday.id, nextActive).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toast.success(nextActive ? 'Holiday reactivated.' : 'Holiday deactivated.', 'Saved');
          if (!nextActive && !this.showInactive()) {
            this.holidays.update((list) => list.filter((h) => h.id !== holiday.id));
          } else {
            this.holidays.update((list) =>
              list.map((h) => (h.id === holiday.id ? { ...h, isActive: nextActive } : h)),
            );
          }
        }
      },
      error: () => this.toast.error('Could not update this holiday.', 'Update Failed'),
    });
  }
}
