import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TuiTable } from '@taiga-ui/addon-table';
import { TuiBadge } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceService } from '../../service/attendance.service';
import { AuthService } from '../../../../(public)/auth/services/auth.service';
import { ShiftHistoryEntry } from '../../model/attendance.model';

@Component({
  selector: 'app-my-shift-history',
  standalone: true,
  imports: [DatePipe, TuiTable, TuiBadge, TuiCardLarge, MainHeading],
  templateUrl: './my-shift-history.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyShiftHistory implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly authService = inject(AuthService);

  protected history = signal<ShiftHistoryEntry[]>([]);
  protected isLoading = signal(true);

  ngOnInit(): void {
    const employeeId = this.authService.currentUser()?.employeeInfo?.id;
    if (!employeeId) {
      this.isLoading.set(false);
      return;
    }

    this.attendanceService.getShiftHistory(employeeId).subscribe({
      next: (response) => {
        this.history.set(response.isSuccess && response.data ? response.data : []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }
}
