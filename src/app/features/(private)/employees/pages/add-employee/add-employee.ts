import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber, TuiTabs } from '@taiga-ui/kit';
import { EmployeeDetails } from '../../components/employee-form/employee-details/employee-details';
import { EmployeeExperience } from '../../components/employee-form/employee-experience/employee-experience';
import { AddEmployeeForm, EmployeeDetailsForm, ExperienceForm } from '../../model/employee-model';

export interface StepConfig {
  id: number;
  title: string;
}

@Component({
  selector: 'app-add-employee',
  imports: [
    FormsModule,
    TuiIcon,
    TuiInputNumber,
    TuiTabs,
    TuiTextfield,
    EmployeeDetails,
    EmployeeExperience,
  ],
  templateUrl: './add-employee.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEmployee {
  protected readonly steps: StepConfig[] = [
    { id: 0, title: 'Employee Details' },
    { id: 1, title: 'Work Experience' },
    { id: 2, title: 'Additional Documents' },
  ];

  protected addEmployeeForm = signal<AddEmployeeForm>({
    fullName: '',
    email: '',
    phone: '',
    dob: new Date(),
    department: '',
    employmentType: '',
    isRemote: false,
    requireVisa: false,
    experiences: [],
    educations: [],
  });

  protected employeeDetailsData = signal<EmployeeDetailsForm | null>(null);
  protected workExperienceData = signal<ExperienceForm | null>(null);
  protected activeStepIndex = signal<number>(0);
  protected unlockedSteps = signal<Set<number>>(new Set([0]));

  protected isStepDisabled(stepId: number): boolean {
    return !this.unlockedSteps().has(stepId);
  }

  protected selectStep(stepId: number): void {
    if (this.unlockedSteps().has(stepId)) {
      this.activeStepIndex.set(stepId);
    }
  }

  protected unlockAndNavigateTo(nextStepId: number): void {
    this.unlockedSteps.update((current) => new Set(current).add(nextStepId));
    this.activeStepIndex.set(nextStepId);
  }

  protected previousStep(): void {
    this.activeStepIndex.update((curr) => Math.max(0, curr - 1));
  }

  protected onEmployeeDetailsSubmission(data: EmployeeDetailsForm): void {
    console.log('Employee Details Data:', data);
    this.addEmployeeForm.update((current) => ({
      ...current,
      ...data,
    }));
    this.unlockAndNavigateTo(1);
  }

  protected onWorkExperienceSubmission(data: ExperienceForm) {
    console.log('Work Experience Data:', data);
    this.addEmployeeForm.update((current) => ({
      ...current,
      workExperience: data.experiences ?? [],
      education: data.educations ?? [],
    }));
    this.unlockAndNavigateTo(2);
  }

  protected submitFullPayload(): void {
    const payload = this.addEmployeeForm();
    console.log('Final Payload ready for backend:', payload);
  }
}
