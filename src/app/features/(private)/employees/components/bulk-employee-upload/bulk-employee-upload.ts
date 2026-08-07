import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiAppearance, TuiButton } from '@taiga-ui/core';
import {
  TuiBadge,
  TuiChip,
  TuiFiles,
  TuiProgress,
  TuiToastService,
  type TuiFileLike,
} from '@taiga-ui/kit';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import * as Papa from 'papaparse';
import {
  catchError,
  concatMap,
  finalize,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { DynamicToast } from '../../../../../shared/components/toast/DynamicToast';
import { TuiCardLarge, TuiSurface } from '@taiga-ui/layout';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';

interface CsvEmployeeRow {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  employmentType?: string;
  jobTitle?: string;
  password: string;
}

type RowStatus = 'pending' | 'uploading' | 'success' | 'error';

interface UploadRow {
  data: CsvEmployeeRow;
  status: RowStatus;
  error?: string;
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
  ],
  templateUrl: './bulk-employee-upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkEmployeeUpload {
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(TuiToastService);

  protected readonly control = new FormControl<TuiFileLike | null>(null, Validators.required);

  protected readonly failedFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadingFiles$ = new Subject<TuiFileLike | null>();
  protected readonly loadedFiles$ = this.control.valueChanges.pipe(
    switchMap((file) => this.processFile(file)),
  );

  protected readonly rows = signal<UploadRow[]>([]);
  protected readonly isUploading = signal(false);
  protected readonly successCount = signal(0);
  protected readonly errorCount = signal(0);

  // Progress driven by real upload counts, not a simulated timer.
  protected readonly max = 100;
  protected readonly progressValue = computed(() => {
    const total = this.rows().length;
    if (total === 0) {
      return 0;
    }
    const done = this.successCount() + this.errorCount();
    return Math.round((done / total) * this.max);
  });

  protected readonly progressColor = computed(() => {
    const value = this.progressValue();
    if (value < 33) {
      return 'red';
    }
    return value < 66 ? 'yellow' : 'green';
  });

  protected removeFile(): void {
    this.control.setValue(null);
    this.rows.set([]);
    this.successCount.set(0);
    this.errorCount.set(0);
  }

  protected processFile(file: TuiFileLike | null): Observable<TuiFileLike | null> {
    this.failedFiles$.next(null);

    if (this.control.invalid || !file) {
      return of(null);
    }

    if (!this.isCsv(file)) {
      this.failedFiles$.next(file);
      this.showDynamicToast('negative', 'Please upload a .csv file.');
      return of(null);
    }

    this.loadingFiles$.next(file);

    return this.parseCsv(file as File).pipe(
      map((parsedRows) => {
        this.rows.set(parsedRows);
        this.successCount.set(0);
        this.errorCount.set(0);
        return file;
      }),
      catchError((error) => {
        this.failedFiles$.next(file);
        this.showDynamicToast('negative', `Failed to parse CSV: ${error.message}`);
        return of(null);
      }),
      finalize(() => this.loadingFiles$.next(null)),
    );
  }

  private isCsv(file: TuiFileLike): boolean {
    const name = file.name?.toLowerCase() ?? '';
    return name.endsWith('.csv') || file.type === 'text/csv';
  }

  private parseCsv(file: File): Observable<UploadRow[]> {
    return new Observable<UploadRow[]>((subscriber) => {
      Papa.parse<CsvEmployeeRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (result) => {
          const parsedRows: UploadRow[] = result.data
            .filter((row) => row.email)
            .map((row) => ({ data: row, status: 'pending' }));

          subscriber.next(parsedRows);
          subscriber.complete();
        },
        error: (error) => subscriber.error(error),
      });
    });
  }

  protected startUpload(): void {
    const currentRows = this.rows();
    if (!currentRows.length || this.isUploading()) {
      return;
    }

    this.isUploading.set(true);
    this.successCount.set(0);
    this.errorCount.set(0);

    from(currentRows)
      .pipe(
        concatMap((row) => {
          this.updateRowStatus(row, 'uploading');
          const payload = this.mapToCommand(row.data);

          return this.employeeService.addEmployee(payload).pipe(
            tap((response) => {
              if (response.isSuccess) {
                this.updateRowStatus(row, 'success');
                this.successCount.update((c) => c + 1);
              } else {
                const message = response.message ?? 'This employee could not be added.';
                this.updateRowStatus(row, 'error', message);
                this.errorCount.update((c) => c + 1);
              }
            }),
            catchError((error) => {
              const message = this.extractErrorMessage(error);
              this.updateRowStatus(row, 'error', message);
              this.errorCount.update((c) => c + 1);
              return of(null);
            }),
            // Safety net: if for any reason (e.g. an interceptor swallowing the
            // error and completing silently) neither tap nor catchError fired,
            // don't leave the row stuck on "uploading" forever.
            finalize(() => {
              const current = this.rows().find((r) => r === row);
              if (current?.status === 'uploading') {
                this.updateRowStatus(row, 'error', 'Something went wrong. Please retry this row.');
                this.errorCount.update((c) => c + 1);
              }
            }),
          );
        }),
      )
      .subscribe({
        complete: () => {
          this.isUploading.set(false);
          this.showSummaryToast();
        },
      });
  }

  // Tries the common shapes backends use for error payloads so messages like
  // "Employee already exists" surface instead of a generic fallback.
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

  protected fullName(row: UploadRow): string {
    return `${row.data.firstName ?? ''} ${row.data.lastName ?? ''}`.trim();
  }

  // Maps a row's status to a tuiBadge appearance so the template stays simple.
  protected badgeAppearance(status: RowStatus): string {
    switch (status) {
      case 'success':
        return 'positive';
      case 'error':
        return 'negative';
      case 'uploading':
        return 'info';
      default:
        return 'neutral';
    }
  }

  protected badgeLabel(status: RowStatus): string {
    switch (status) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Failed';
      case 'uploading':
        return 'Uploading…';
      default:
        return 'Pending';
    }
  }

  private mapToCommand(row: CsvEmployeeRow): Record<string, unknown> {
    return {
      firstName: row.firstName?.trim(),
      lastName: row.lastName?.trim(),
      email: row.email?.trim(),
      phone: row.phone?.trim() ?? '',
      department: row.department?.trim() ?? '',
      employmentType: row.employmentType?.trim() ?? '',
      jobTitle: row.jobTitle?.trim() ?? '',
      password: row.password ?? '',
    };
  }

  private updateRowStatus(target: UploadRow, status: RowStatus, error?: string): void {
    this.rows.update((current) =>
      current.map((row) => (row === target ? { ...row, status, error } : row)),
    );
  }

  private showSummaryToast(): void {
    const success = this.successCount();
    const failed = this.errorCount();

    if (failed === 0) {
      this.showDynamicToast('positive', `All ${success} employees added successfully.`);
    } else if (success === 0) {
      this.showDynamicToast('negative', `All ${failed} rows failed.`);
    } else {
      this.showDynamicToast('negative', `${success} succeeded, ${failed} failed.`);
    }
  }

  protected showDynamicToast(appearance: 'positive' | 'negative', message: string): void {
    this.toast
      .open(new PolymorpheusComponent(DynamicToast), {
        data: { message, appearance },
        autoClose: 3000,
      })
      .subscribe();
  }
}
