import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  output,
  Output,
  signal,
} from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TuiButton, TuiInput, TuiTextfieldComponent, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { MatIcon } from '@angular/material/icon';
import { PasswordValidator } from '../../../../../(public)/auth/components/password-validator/password-validator';

@Component({
  selector: 'app-additional-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TuiTextfieldComponent,
    TuiInput,
    TuiCardLarge,
    TuiTitle,
    TuiButton,
    MatIcon,
    PasswordValidator,
  ],
  templateUrl: './additional-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdditionalDetails {
  readonly formSubmitted = output<AdditionalDetails>();
  protected showValidator = signal(false);

  @Input({ required: true }) form!: FormGroup;
  @Output() next = new EventEmitter<void>();
  readonly stepBack = output<void>();
  protected onSubmit(): void {
    if (this.form.valid) {
      this.next.emit();
    } else {
      this.form.markAllAsTouched();
    }
  }

  protected isRequired(controlPath: string): boolean {
    const control = this.form.get(controlPath);
    if (!control?.validator) return false;

    const validator = control.validator({} as AbstractControl);
    return !!validator?.['required'];
  }

  protected onBack(): void {
    this.stepBack.emit();
  }
}
