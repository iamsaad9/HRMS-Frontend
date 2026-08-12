import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAppearance, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiBadge, TuiChip, TuiFiles, TuiProgress, type TuiFileLike } from '@taiga-ui/kit';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { catchError, finalize, of, Subject, tap } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ToastService } from '../../../../../core/services/toast.service';

interface BulkUploadResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

@Component({
  selector: 'app-bulk-employee-upload',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    TuiButton,
    TuiFiles,
    TuiProgress,
    TuiSurface,
    TuiAppearance,
    TuiBadge,
    MainHeading,
    TuiCardLarge,
    TuiChip,
    TuiIcon,
  ],
  templateUrl: './bulk-employee-upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkEmployeeUpload {
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);

  protected readonly control = new FormControl<TuiFileLike | null>(null, Validators.required);

  protected readonly failedFiles$ = new Subject<TuiFileLike | null>();

  protected readonly selectedFile = signal<File | null>(null);

  protected readonly isUploading = signal(false);
  protected readonly isSuccess = signal(false);
  protected readonly isError = signal(false);
  
  // NEW: holds the structured result so the template can render counts + errors
  protected readonly result = signal<BulkUploadResult | null>(null);
  protected readonly showErrors = signal(false);

  protected readonly isDownloadingTemplate = signal(false);

  constructor() {
    this.control.valueChanges.subscribe((file) => this.processFile(file));
  }

  protected removeFile(): void {
    this.control.setValue(null);
    this.selectedFile.set(null);
    this.isUploading.set(false);
    this.isSuccess.set(false);
    this.isError.set(false);
    this.result.set(null);
    this.showErrors.set(false);
    this.failedFiles$.next(null);
  }

  protected processFile(file: TuiFileLike | null): void {
    this.failedFiles$.next(null);
    this.isSuccess.set(false);
    this.isError.set(false);
    this.result.set(null);
    this.showErrors.set(false);

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

    if (!fileToUpload || this.isUploading()) {
      return;
    }

    this.isUploading.set(true);
    this.isSuccess.set(false);
    this.isError.set(false);
    this.result.set(null);
    this.showErrors.set(false);

    this.employeeService
      .bulkUpload(fileToUpload)
      .pipe(
        tap((response) => {
          const data = response?.data as BulkUploadResult | undefined;
          this.result.set(data ?? null);

          // Treat as "success" only if at least one row succeeded
          // and there were no failures — tweak this rule to match
          // how you want partial successes (some rows ok, some not) treated.
          const allSucceeded = !!data && data.failureCount === 0 && data.successCount > 0;
          const partialOrFullFailure = !!data && data.failureCount > 0;

          this.isSuccess.set(allSucceeded);
          this.isError.set(partialOrFullFailure || !response?.isSuccess);
        }),
        catchError((error) => {
          this.isError.set(true);
          const message = this.extractErrorMessage(error);
          this.toast.error?.(message);
          return of(null);
        }),
        finalize(() => {
          this.isUploading.set(false);
        }),
      )
      .subscribe();
  }

  protected downloadTemplate(): void {
    this.isDownloadingTemplate.set(true);

    this.employeeService.downloadTemplate().subscribe({
      next: (blob: Blob) => {
        // Create a blob URL and trigger browser download
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'employee_upload_template.csv';
        anchor.click();

        // Clean up memory
        window.URL.revokeObjectURL(url);
        this.isDownloadingTemplate.set(false);
      },
      error: (err) => {
        console.error('Failed to download template:', err);
        this.isDownloadingTemplate.set(false);
      }
    });
  }

  protected toggleErrors(): void {
    this.showErrors.update((v) => !v);
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