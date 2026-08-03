import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TuiButton, TuiError, TuiTitle } from '@taiga-ui/core';
import { TuiFile, TuiFiles, TuiInputFiles, tuiFilesAccepted } from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { map } from 'rxjs';

type DocSection = 'education' | 'experience' | 'identity' | 'other';

type DocumentsFormControls = {
  educationFiles: FormControl<File[]>;
  experienceFiles: FormControl<File[]>;
  identityFiles: FormControl<File[]>;
  otherFiles: FormControl<File[]>;
};

@Component({
  selector: 'app-employee-documents',
  imports: [
    AsyncPipe,
    TuiTitle,
    ReactiveFormsModule,
    TuiButton,
    TuiCardLarge,
    TuiError,
    TuiFile,
    TuiFiles,
    TuiInputFiles,
    MatIcon,
  ],
  templateUrl: './employee-documents.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDocuments {
  readonly stepBack = output<void>();
  @Output() next = new EventEmitter<void>();

  @Input({ required: true }) form!: FormGroup<DocumentsFormControls>;

  protected get educationAccepted$() {
    return this.form.controls['educationFiles'].valueChanges.pipe(
      map(() => tuiFilesAccepted(this.form.controls['educationFiles'])),
    );
  }

  protected get experienceAccepted$() {
    return this.form.controls['experienceFiles'].valueChanges.pipe(
      map(() => tuiFilesAccepted(this.form.controls['experienceFiles'])),
    );
  }

  protected get identityAccepted$() {
    return this.form.controls['identityFiles'].valueChanges.pipe(
      map(() => tuiFilesAccepted(this.form.controls['identityFiles'])),
    );
  }

  protected get otherAccepted$() {
    return this.form.controls['otherFiles'].valueChanges.pipe(
      map(() => tuiFilesAccepted(this.form.controls['otherFiles'])),
    );
  }

  protected rejected: Record<DocSection, File[]> = {
    education: [],
    experience: [],
    identity: [],
    other: [],
  };

  protected onReject(section: DocSection, files: readonly File[]): void {
    this.rejected[section] = Array.from(new Set([...this.rejected[section], ...files]));
  }

  protected getDocumentControl(section: DocSection): FormControl<File[]> {
    return this.form.controls[`${section}Files` as keyof DocumentsFormControls] as FormControl<
      File[]
    >;
  }

  protected onRemove(section: DocSection, file: File): void {
    this.rejected[section] = this.rejected[section].filter((currentFile) => currentFile !== file);
    const control = this.getDocumentControl(section);
    const currentFiles = control.value ?? [];
    control.setValue(currentFiles.filter((currentFile) => currentFile !== file));
  }

  protected onBack(): void {
    this.stepBack.emit();
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    this.next.emit();
  }
}

function maxFilesLength(maxLength: number): ValidatorFn {
  return ({ value }: { value: File[] }) =>
    value && value.length > maxLength
      ? { maxLength: `Error: maximum limit - ${maxLength} files for upload` }
      : null;
}
