import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TuiButton,
  TuiDropdown,
  TuiInput,
  TuiLabel,
  TuiTextfield,
  TuiTextfieldComponent,
} from '@taiga-ui/core';
import {
  TuiBadge,
  TuiChevron,
  TuiDataListWrapperComponent,
  TuiFiles,
  TuiInputNumber,
  TuiSelect,
  type TuiFileLike,
} from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { catchError, finalize, of, Subject, tap } from 'rxjs';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ToastService } from '../../../../../core/services/toast.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import { LeaveAdjustmentService, LeaveAllocationRow } from '../../service/leave-adjustment.service';
import { BulkUploadResult } from '../../../employees/model/employee.model';

interface PickerEmployee {
  id: string;
  fullName: string;
  staffNo: string;
}

interface LeaveTypeOption {
  id: string;
  defaultAllocatedDays: number;
  toString: () => string;
}

@Component({
  selector: 'app-assign-leave',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    TuiButton,
    TuiBadge,
    TuiInput,
    TuiLabel,
    TuiTextfieldComponent,
    TuiInputNumber,
    TuiChevron,
    TuiDropdown,
    TuiSelect,
    TuiTextfield,
    TuiDataListWrapperComponent,
    TuiFiles,
    TuiCardLarge,
    MainHeading,
  ],
  templateUrl: './assign-leave.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignLeave implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly leaveTypesService = inject(LeaveRequestsService);
  private readonly leaveAdjustmentService = inject(LeaveAdjustmentService);
  private readonly toast = inject(ToastService);

  // ---------- Employee list - this page's whole purpose is giving Administrative employees
  // their initial leave allocation for a year, so only Active Administrative employees show up.
  protected employees = computed<PickerEmployee[]>(() =>
    (this.employeeService.allEmployees() ?? [])
      .filter((e) => e.isActive && e.category === 'Administrative')
      .map((e) => ({ id: e.id, fullName: e.fullName, staffNo: e.staffNo })),
  );

  protected employeeSearch = signal('');
  protected filteredEmployees = computed(() => {
    const q = this.employeeSearch().trim().toLowerCase();
    if (!q) return this.employees();
    return this.employees().filter(
      (e) => e.fullName.toLowerCase().includes(q) || e.staffNo.toLowerCase().includes(q),
    );
  });

  protected selectedEmployee = signal<PickerEmployee | null>(null);

  // ---------- Current leave balances (right panel) ----------
  protected balances = signal<LeaveAllocationRow[]>([]);
  protected isLoadingBalances = signal(false);
  protected hasLoadedBalances = signal(false);

  // ---------- Leave types - dropdown label shows each type's default allocated days, and
  // picking one auto-fills the (locked) Allocated Days field below. ----------
  protected leaveTypeOptions = computed<LeaveTypeOption[]>(() =>
    this.leaveTypesService
      .leaveTypes()
      // Unpaid leave types skip the balance check entirely when a request is applied (see
      // AttendanceService.ApplyLeaveAsync) - employees don't need an allocation for them at all,
      // so they're excluded here rather than offering to assign something that's never checked.
      .filter((t) => t.isActive && t.isPaid)
      .map((t) => ({
        id: t.id,
        defaultAllocatedDays: t.defaultAllocatedDays,
        toString: () => `${t.name} (${t.defaultAllocatedDays} days default)`,
      })),
  );

  // ---------- Inline assign form ----------
  protected showAssignForm = signal(false);
  protected selectedLeaveTypeOption = signal<LeaveTypeOption | null>(null);
  protected isSubmitting = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  // Year is always the current year and Allocated Days always comes from the picked leave
  // type's own default - both are shown disabled/greyed, not editable by the admin.
  protected form = new FormGroup({
    year: new FormControl<number>({ value: this.currentYear, disabled: true }, { nonNullable: true }),
    allocatedDays: new FormControl<number | null>({ value: null, disabled: true }),
  });

  // ---------- Bulk-upload state - mirrors the Employee Bulk Upload page's UX ----------
  protected readonly control = new FormControl<TuiFileLike | null>(null, Validators.required);
  protected readonly failedFiles$ = new Subject<TuiFileLike | null>();
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly isError = signal(false);
  protected readonly result = signal<BulkUploadResult | null>(null);
  protected readonly isDownloadingTemplate = signal(false);

  constructor() {
    this.control.valueChanges.subscribe((file) => this.processFile(file));
  }

  ngOnInit(): void {
    this.employeeService.getAllEmployees().subscribe();
    this.leaveTypesService.getAllLeaveTypes().subscribe();
  }

  protected selectEmployee(id: string): void {
    const emp = this.employees().find((e) => e.id === id) ?? null;
    this.selectedEmployee.set(emp);
    this.resetAssignForm();
    this.showAssignForm.set(false);
    this.loadBalances();
  }

  private loadBalances(): void {
    const employeeId = this.selectedEmployee()?.id;
    if (!employeeId) return;

    this.isLoadingBalances.set(true);
    this.leaveAdjustmentService.getEmployeeBalances(employeeId).subscribe({
      next: (response) => {
        this.balances.set(response.isSuccess && response.data ? response.data : []);
        this.hasLoadedBalances.set(true);
        this.isLoadingBalances.set(false);
      },
      error: () => {
        this.hasLoadedBalances.set(true);
        this.isLoadingBalances.set(false);
      },
    });
  }

  protected toggleAssignForm(): void {
    if (this.showAssignForm()) this.resetAssignForm();
    this.showAssignForm.update((open) => !open);
  }

  protected onLeaveTypeChange(option: LeaveTypeOption | null): void {
    this.selectedLeaveTypeOption.set(option);
    this.form.patchValue({ allocatedDays: option?.defaultAllocatedDays ?? null });
  }

  // Checked against the current-leaves list already loaded for this employee - catches a
  // duplicate assignment immediately, before the submit round-trip to the backend (which also
  // rejects it, since this same check has to hold no matter which route the request came from).
  protected alreadyAssignedThisYear = computed(() => {
    const leaveTypeId = this.selectedLeaveTypeOption()?.id;
    if (!leaveTypeId) return false;
    return this.balances().some((b) => b.leaveTypeId === leaveTypeId && b.year === this.currentYear);
  });

  protected submit(): void {
    const employeeId = this.selectedEmployee()?.id;
    const leaveTypeId = this.selectedLeaveTypeOption()?.id;
    const allocatedDays = this.form.getRawValue().allocatedDays;

    if (!employeeId || !leaveTypeId || allocatedDays == null) {
      this.toast.error('Select a leave type.', 'Missing Information');
      return;
    }

    if (this.alreadyAssignedThisYear()) {
      this.toast.error(
        `This employee already has this leave type assigned for ${this.currentYear}.`,
        'Already Assigned',
      );
      return;
    }

    this.isSubmitting.set(true);

    this.leaveAdjustmentService
      .adjustBalance({
        employeeId,
        leaveTypeId,
        adjustmentDays: 0,
        reason: `Leave allocation assigned for ${this.currentYear}`,
        year: this.currentYear,
        allocatedDays,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toast.success('Leave allocation assigned successfully.', 'Saved');
            this.resetAssignForm();
            this.showAssignForm.set(false);
            this.loadBalances();
          } else {
            this.toast.error(response.message || 'Could not assign leave.', 'Save Failed');
          }
        },
        error: (err) => this.toast.error(err?.error?.message || 'Could not assign leave.', 'Save Failed'),
      });
  }

  private resetAssignForm(): void {
    this.selectedLeaveTypeOption.set(null);
    this.form.reset({ year: this.currentYear, allocatedDays: null });
  }

  protected removeFile(): void {
    this.control.setValue(null);
    this.selectedFile.set(null);
    this.isUploading.set(false);
    this.isError.set(false);
    this.result.set(null);
    this.failedFiles$.next(null);
  }

  protected resetAll(): void {
    this.removeFile();
  }

  protected processFile(file: TuiFileLike | null): void {
    this.failedFiles$.next(null);
    this.isError.set(false);
    this.result.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (!this.isCsv(file)) {
      this.failedFiles$.next(file);
      this.selectedFile.set(null);
      return;
    }

    this.selectedFile.set(file as File);
  }

  private isCsv(file: TuiFileLike): boolean {
    const name = file.name?.toLowerCase().trim() ?? '';
    return name.endsWith('.csv');
  }

  protected startUpload(): void {
    const fileToUpload = this.selectedFile();
    if (!fileToUpload || this.isUploading()) return;

    this.isUploading.set(true);
    this.isError.set(false);
    this.result.set(null);

    this.leaveAdjustmentService
      .bulkAssignLeaveAllocations(fileToUpload)
      .pipe(
        tap((response) => {
          const data = response as BulkUploadResult | undefined;
          this.result.set(data ?? null);

          if (data) {
            const hasFailures = data.failureCount > 0;
            this.isError.set(hasFailures || data.successCount === 0);
          } else {
            this.isError.set(true);
          }
        }),
        catchError((error) => {
          this.isError.set(true);
          const message = this.extractErrorMessage(error);
          this.toast.error?.(message);
          return of(null);
        }),
        finalize(() => this.isUploading.set(false)),
      )
      .subscribe();
  }

  protected downloadErrorCsv(): void {
    const data = this.result();
    if (!data?.errorCsvBytes) return;

    const byteCharacters = atob(data.errorCsvBytes);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'text/csv' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = data.errorCsvFileName || 'leave-allocation-upload-errors.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  protected downloadTemplate(): void {
    this.isDownloadingTemplate.set(true);

    this.leaveAdjustmentService.downloadLeaveAllocationTemplate().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'leave_allocation_bulk_template.csv';
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.isDownloadingTemplate.set(false);
      },
      error: () => this.isDownloadingTemplate.set(false),
    });
  }

  private extractErrorMessage(error: any): string {
    return (
      error?.error?.message ??
      error?.error?.title ??
      error?.error?.errors?.[0] ??
      (typeof error?.error === 'string' ? error.error : null) ??
      error?.message ??
      'Request failed'
    );
  }
}
