import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TuiButton, TuiDialogService, TuiIcon } from '@taiga-ui/core';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiCardLarge } from '@taiga-ui/layout';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ToastService } from '../../../../../core/services/toast.service';
import { CategoryType } from '../../../employees/model/employee.model';
import { Holiday, HolidayService } from '../../service/holiday.service';
import { AddHolidayModal, HolidayFormValue } from '../../components/add-holiday-modal/add-holiday-modal';

function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

@Component({
  selector: 'app-holiday-calendar',
  standalone: true,
  imports: [FormsModule, DatePipe, TuiButton, TuiBadge, TuiTable, TuiCardLarge, TuiIcon, MainHeading],
  templateUrl: './holiday-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HolidayCalendar {
  private readonly holidayService = inject(HolidayService);
  private readonly dialogs = inject(TuiDialogService);
  private readonly toast = inject(ToastService);

  protected readonly CategoryType = CategoryType;

  protected selectedCategory = signal<CategoryType | null>(null);
  protected academicYear = signal<string>(currentAcademicYear());
  protected holidays = signal<Holiday[]>([]);
  protected isLoading = signal(false);
  protected hasSearched = signal(false);

  protected selectCategory(category: CategoryType): void {
    this.selectedCategory.set(category);
    this.hasSearched.set(false);
    this.holidays.set([]);
  }

  protected canSearch(): boolean {
    const category = this.selectedCategory();
    if (category === null) return false;
    if (category === CategoryType.Academic) return !!this.academicYear().trim();
    return true;
  }

  protected search(): void {
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

  protected addHoliday(): void {
    const category = this.selectedCategory();
    if (category === null) return;

    this.dialogs
      .open<HolidayFormValue | null>(new PolymorpheusComponent(AddHolidayModal), {
        label: 'Add Holiday',
        size: 'm',
      })
      .subscribe((result) => {
        if (!result) return;

        this.holidayService
          .createHoliday({
            title: result.title,
            startDate: result.startDate,
            endDate: result.endDate,
            type: result.type,
            applicableCategory: category,
            isOptional: result.isOptional,
            academicYear: category === CategoryType.Academic ? this.academicYear().trim() : currentAcademicYear(),
          })
          .subscribe({
            next: (response) => {
              if (response.isSuccess) {
                this.toast.success('Holiday added successfully.', 'Saved');
                this.search();
              } else {
                this.toast.error(response.message || 'Could not add holiday.', 'Save Failed');
              }
            },
            error: (err) => this.toast.error(err?.error?.message || 'Could not add holiday.', 'Save Failed'),
          });
      });
  }

  protected deleteHoliday(holiday: Holiday): void {
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

  protected typeAppearance(type: string): string {
    switch (type) {
      case 'TermBreak':
      case 'HalfTerm':
        return 'info';
      case 'BankHoliday':
        return 'warning';
      default:
        return 'neutral';
    }
  }
}
