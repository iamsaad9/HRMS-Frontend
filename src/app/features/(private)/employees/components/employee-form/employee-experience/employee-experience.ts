import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiCheckbox,
  TuiError,
  TuiInput,
  TuiLabel,
  TuiRadio,
  TuiTitle,
  TuiExpand,
} from '@taiga-ui/core';
import {
  TuiDataListWrapper,
  TuiInputDate,
  TuiInputNumber,
  TuiInputPhone,
  TuiInputSlider,
  TuiSelect,
  TuiCalendarRange,
  TuiTextarea,
} from '@taiga-ui/kit';
import { TuiChevron } from '@taiga-ui/kit';
import { TuiInputDateRange } from '@taiga-ui/kit';
import { TuiElasticContainer } from '@taiga-ui/layout';
@Component({
  selector: 'app-employee-experience',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TuiButton,
    TuiCheckbox,
    TuiDataListWrapper,
    TuiError,
    TuiInput,
    TuiInputDate,
    TuiInputNumber,
    TuiInputPhone,
    TuiInputSlider,
    TuiLabel,
    TuiRadio,
    TuiSelect,
    TuiTitle,
    MatIcon,
    TuiChevron,
    TuiInputDateRange,
    TuiTextarea,
    TuiCalendarRange,
    TuiExpand,
    TuiElasticContainer,
  ],
  templateUrl: './employee-experience.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeExperience {
  readonly formSubmitted = output<typeof this.form.value>();
  readonly stepBack = output<void>();
  protected value = new TuiDayRange(new TuiDay(2017, 0, 15), new TuiDay(2017, 0, 20));
  protected isCurrentJob = signal(false);
  protected experiencesState: { expanded: boolean }[] = [
    {
      expanded: true,
    },
  ];
  protected educationsState: { expanded: boolean }[] = [
    {
      expanded: true,
    },
  ];
  protected form = new FormGroup({
    companyName: new FormControl('', Validators.required),
    jobTitle: new FormControl('', Validators.required),
    experiences: new FormArray<FormGroup>([
      new FormGroup({
        companyName: new FormControl('', Validators.required),
        jobTitle: new FormControl('', Validators.required),
        isCurrent: new FormControl(false),
        employmentPeriod: new FormControl<TuiDayRange | null>(null, Validators.required),
        startDate: new FormControl<TuiDay | null>(null),
        responsibilities: new FormControl(''),
      }),
    ]),
    educations: new FormArray<FormGroup>([
      new FormGroup({
        institution: new FormControl('', Validators.required),
        degree: new FormControl('', Validators.required),
        period: new FormControl<TuiDayRange | null>(null, Validators.required),
      }),
    ]),
    employmentPeriod: new FormControl<TuiDayRange | null>(null), // Range if past job
    startDate: new FormControl<TuiDay | null>(null), // Single date if current job
    isCurrent: new FormControl(false),
    responsibilities: new FormControl('', [Validators.maxLength(500)]),
  });

  get experiences(): FormArray {
    return this.form.get('experiences') as FormArray;
  }

  protected addExperience(): void {
    const expGroup = new FormGroup({
      companyName: new FormControl('', Validators.required),
      jobTitle: new FormControl('', Validators.required),
      isCurrent: new FormControl(false),
      employmentPeriod: new FormControl<TuiDayRange | null>(null, Validators.required),
      startDate: new FormControl<TuiDay | null>(null),
      responsibilities: new FormControl(''),
    });

    this.experiences.push(expGroup);
    this.experiencesState.push({ expanded: true });
  }

  protected removeExperience(index: number): void {
    this.experiences.removeAt(index);
    this.experiencesState.splice(index, 1);
  }

  protected onCurrentJobToggle(isCurrent: boolean, index: number): void {
    const group = this.experiences.at(index) as FormGroup;
    const periodControl = group.controls['employmentPeriod'];
    const startControl = group.controls['startDate'];

    if (isCurrent) {
      periodControl.clearValidators();
      startControl.setValidators(Validators.required);
    } else {
      startControl.clearValidators();
      periodControl.setValidators(Validators.required);
    }

    periodControl.updateValueAndValidity();
    startControl.updateValueAndValidity();
  }

  // --- EDUCATION HANDLERS ---
  get educations(): FormArray {
    return this.form.get('educations') as FormArray;
  }

  protected addEducation(): void {
    const eduGroup = new FormGroup({
      institution: new FormControl('', Validators.required),
      degree: new FormControl('', Validators.required),
      period: new FormControl<TuiDayRange | null>(null, Validators.required),
    });

    this.educations.push(eduGroup);
    this.educationsState.push({ expanded: true });
  }

  protected removeEducation(index: number): void {
    this.educations.removeAt(index);
    this.educationsState.splice(index, 1);
  }

  // --- ACTIONS ---
  protected onSubmit(): void {
    if (this.form.valid) {
      this.formSubmitted.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  protected onBack(): void {
    this.stepBack.emit();
  }
}
