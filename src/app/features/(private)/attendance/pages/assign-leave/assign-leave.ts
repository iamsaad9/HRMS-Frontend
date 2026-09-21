import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiError,
  TuiErrorComponent,
  TuiIcon,
  TuiLabel,
  TuiOption,
  TuiTextfield,
  TuiTextfieldComponent,
} from '@taiga-ui/core';
import { TuiChevron, TuiFiles, TuiInputNumber, TuiSelect, TuiTextarea, type TuiFileLike } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { catchError, finalize, of, Subject, tap } from 'rxjs';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ToastService } from '../../../../../core/services/toast.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { LeaveRequestsService } from '../../../leave-management/service/leave-requests.service';
import { LeaveAdjustmentService } from '../../service/leave-adjustment.service';
import { BulkUploadResult } from '../../../employees/model/employee.model';

@Component({
  selector: 'app-assign-leave',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    TuiButton,
    TuiError,
    TuiErrorComponent,
    TuiLabel,
    TuiTextfieldComponent,
    TuiInputNumber,
    TuiTextarea,
    TuiChevron,
    TuiDataList,
    TuiDropdown,
    TuiOption,
    TuiSelect,
    TuiTextfield,
    TuiIcon,
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

  // Single-assign form: this page's whole purpose is giving Academic employees an initial leave
  // allocation, which nothing else in the app can do - self-service apply and the "Adjust Balance"
  // flow are both Administrative-only - so the employee picker is scoped to Active Academic staff.
  protected readonly academicEmployees = computed(() =>
    (this.employeeService.allEmployees() ?? []).filter((e) => e.isActive && e.category === 'Academic'),
  );

  protected readonly activeLeaveTypes = computed(() => this.leaveTypesService.leaveTypes().filter((t) => t.isActive));

  protected readonly form = new FormGroup({
    employeeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    leaveTypeId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    year: new FormControl<number | null>(new Date().getFullYear(), { validators: [Validators.required] }),
    allocatedDays: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
  });

  protected readonly isSubmitting = signal(false);

  // Bulk-upload state - mirrors the Employee Bulk Upload page's UX exactly.
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

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSubmitting.set(true);

    this.leaveAdjustmentService
      .adjustBalance({
        employeeId: raw.employeeId,
        leaveTypeId: raw.leaveTypeId,
        adjustmentDays: 0,
        reason: raw.reason,
        year: raw.year!,
        allocatedDays: raw.allocatedDays!,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toast.success('Leave allocation assigned successfully.', 'Saved');
            this.form.reset({
              employeeId: '',
              leaveTypeId: '',
              year: new Date().getFullYear(),
              allocatedDays: null,
              reason: '',
            });
          } else {
            this.toast.error(response.message || 'Could not assign leave.', 'Save Failed');
          }
        },
        error: (err) => this.toast.error(err?.error?.message || 'Could not assign leave.', 'Save Failed'),
      });
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
