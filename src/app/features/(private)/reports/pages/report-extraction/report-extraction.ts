import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { NgClass } from '@angular/common';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { AttendanceHistoryFilterBar } from '../../../attendance/components/attendance-hisotry-filter-bar/attendance-history-filter-bar';
import { EmployeeFilterBarComponent } from '../../../employees/components/employee-filter-bar/employee-filter-bar';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Employee, EmployeeFilter } from '../../../employees/model/employee.model';
import { AttendanceHistoryFilter } from '../../../attendance/model/attendance.model';
import { REPORT_DEFINITIONS, ReportDefinition, ReportKey } from '../../model/report-extraction.model';
import { ReportExtractionService } from '../../service/report-extraction.service';



@Component({
  selector: 'app-reports-extraction',
  standalone: true,
  imports: [
    NgClass,
    TuiButton,
    TuiIcon,
    TuiCardLarge,
    MainHeading,
    AttendanceHistoryFilterBar,
    EmployeeFilterBarComponent,
  ],
  templateUrl: './report-extraction.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsExtraction {
  private readonly reportService = inject(ReportExtractionService);
  private readonly employeeService = inject(EmployeeService);

  protected readonly reports: ReportDefinition[] = REPORT_DEFINITIONS;

  protected selectedReport = signal<ReportKey | null>(null);
  protected isExtracting = signal(false);
  protected errorMessage = signal<string | null>(null);

  // Draft filters captured from each report's filter bar
  private attendanceFilter = signal<AttendanceHistoryFilter | null>(null);
  private employeeFilter = signal<EmployeeFilter | null>(null);

  // Feed the employee filter bar; swap for whatever signal your EmployeeService exposes
  protected allEmployees = computed<readonly Employee[]>(() => this.employeeService.allEmployees() ?? []);

  protected selectedReportDefinition = computed(() =>
    this.reports.find((r) => r.key === this.selectedReport()) ?? null
  );

  protected canExtract = computed(() => {
    switch (this.selectedReport()) {
      case 'attendance-history':
        return this.attendanceFilter() !== null;
      case 'employee-directory':
        return this.employeeFilter() !== null;
      default:
        return false;
    }
  });

  protected selectReport(key: ReportKey): void {
    this.selectedReport.set(key);
    this.errorMessage.set(null);
    this.attendanceFilter.set(null);
    this.employeeFilter.set(null);
  }

  protected changeReport(): void {
    this.selectedReport.set(null);
    this.errorMessage.set(null);
  }

  protected onAttendanceFilterChange(filter: AttendanceHistoryFilter): void {
    this.attendanceFilter.set(filter);
  }

  protected onEmployeeFilterChange(filter: EmployeeFilter): void {
    this.employeeFilter.set(filter);
  }

  protected extract(): void {
    const key = this.selectedReport();
    if (!key || !this.canExtract()) return;

    this.isExtracting.set(true);
    this.errorMessage.set(null);

    const request$ =
      key === 'attendance-history'
        ? this.reportService.extractAttendanceHistory(this.attendanceFilter()!)
        : this.reportService.extractEmployeeDirectory(this.employeeFilter()!);

    request$.subscribe({
      next: (blob) => {
        this.reportService.downloadCsv(blob, key);
        this.isExtracting.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not extract the report. Please try again.');
        this.isExtracting.set(false);
      },
    });
  }
}