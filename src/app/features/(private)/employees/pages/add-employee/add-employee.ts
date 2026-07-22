import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { TuiIcon, TuiNumberFormat, TuiTextfield } from '@taiga-ui/core';
import { TuiInputNumber, TuiTabs } from '@taiga-ui/kit';
import { EmployeeDetails } from '../../components/employee-form/employee-details/employee-details';
import { EmployeeExperience } from '../../components/employee-form/employee-experience/employee-experience';

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
    TuiNumberFormat,
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

  protected employeeDetailsData = signal<any>(null);
  protected workExperienceData = signal<any>(null);

  // Active step index
  protected activeStepIndex = signal<number>(0);

  // Set of unlocked step IDs for O(1) checks and immutability
  protected unlockedSteps = signal<Set<number>>(new Set([0, 1, 2]));

  // --- Step Navigation Helpers ---

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
}
