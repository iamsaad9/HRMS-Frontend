import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  TuiButton,
  TuiIcon,
  TuiTextfieldComponent,
  TuiErrorComponent,
  TuiCalendar,
  TuiSelectLike,
  TuiDropdownDirective,
  TuiDataListComponent,
  TuiOption,
  TuiDataList,
} from '@taiga-ui/core';
import {
  TuiTabs,
  TuiToast,
  TuiToastService,
  TuiDataListWrapperComponent,
  TuiInputChip,
  TuiMultiSelect,
} from '@taiga-ui/kit';
import { TuiDay } from '@taiga-ui/cdk';
import { EmployeeService } from '../../services/employee.service';
import { MainHeading } from '../../../../../shared/components/main-heading/main-heading';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TuiCheckbox, TuiError, TuiGroup, TuiInput, TuiLabel, TuiRadio } from '@taiga-ui/core';
import {
  TuiBlock,
  TuiChevron,
  TuiDataListWrapper,
  TuiInputDate,
  TuiInputNumber,
  TuiInputPhone,
  TuiInputSlider,
  TuiSelect,
} from '@taiga-ui/kit';
import { TuiCardLarge } from '@taiga-ui/layout';
import { PasswordValidator } from '../../../../(public)/auth/components/password-validator/password-validator';
import { finalize, forkJoin } from 'rxjs';
import { CategoryType, CreateEmployeeCommand, Employee } from '../../model/employee.model';
import { AuthService } from '../../../../(public)/auth/services/auth.service';

@Component({
  selector: 'app-add-employee',
  imports: [
    TuiIcon,
    TuiTabs,
    TuiToast,
    TuiButton,
    MainHeading,
    TuiButton,
    TuiTextfieldComponent,
    TuiErrorComponent,
    TuiCalendar,
    TuiDataListWrapperComponent,
    FormsModule,
    TuiButton,
    TuiCheckbox,
    TuiChevron,
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
    ReactiveFormsModule,
    TuiCardLarge,
    PasswordValidator,
    TuiInputChip,
    TuiSelectLike,
    TuiDropdownDirective,
    TuiMultiSelect,
    TuiDataList,
  ],

  templateUrl: './add-employee.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEmployee implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected isSubmiting = signal<boolean>(false);
  protected showValidator = signal<boolean>(false);
  protected form!: FormGroup;
  protected employeeId = signal<string | null>(null);
  protected currentUser = this.authService.currentUser();
  protected currentUserId = this.authService.currentUser()?.employeeInfo?.employeeId;
  protected isEditMode = computed(() => !!this.employeeId());
  protected pageTitle = computed(() => (this.isEditMode() ? 'Edit Employee' : 'Create Employee'));
  protected pageDescription = computed(() =>
    this.isEditMode()
      ? 'Update an existing employee details'
      : 'Create an employee using the form below',
  );
  protected submitLabel = computed(() =>
    this.isEditMode() ? 'Update Employee' : 'Create Employee',
  );
  protected readonly titles = ['Mr', 'Miss'];
  protected readonly genders = ['Male', 'Female'];
  protected departmentsOptions = computed(
    () => this.employeeService.allDepartments()?.map((item) => item.name) ?? [],
  );
  protected designationsOptions = computed(
    () => this.employeeService.allDesignations()?.map((item) => item.title) ?? [],
  );
  protected managersOptions = computed(
    () => this.employeeService.allManagers()?.map((item) => item.fullName) ?? [],
  );
  protected rolesOptions = computed(
    () => this.employeeService.allRoles()?.map((item) => item.name) ?? [],
  );
  protected branchesOptions = computed(
    () => this.employeeService.allBranches()?.map((item) => item.name) ?? [],
  );

  ngOnInit(): void {
    this.buildForm();
    this.checkRouteMode();
    this.loadDropdownData();
  }

  private loadDropdownData(): void {
    forkJoin({
      departments: this.employeeService.getDepartments(),
      designations: this.employeeService.getDesignations(),
      managers: this.employeeService.getManagers(),
      roles: this.employeeService.getRoles(),
      branches: this.employeeService.getBranches(),
    }).subscribe({
      error: (err) => {
        console.error('Failed to load form dropdown options:', err);
      },
    });
  }

  private checkRouteMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId.set(id);
      console.log('Id Present');
      this.loadLeaveRequest(id);
    }
  }

  private loadLeaveRequest(id: string): void {
    this.employeeService
      .getEmployeeById(id)
      .pipe()
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.patchForm(response.data);
          }
        },
        error: (error) => {
          const msg = error.error?.message || 'Failed to load leave request.';
          this.toast.error(msg, 'Load Failed');
          this.router.navigate(['/leave-requests/all']);
        },
      });
  }

  private buildForm(): void {
    const isEdit = this.isEditMode();

    this.form = this.fb.group({
      staffNo: [{ value: '', disabled: true }],
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      dateOfBirth: new FormControl<TuiDay | null>(null, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      gender: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      mobile: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      niNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      departmentId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      designationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      branchId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      managerId: new FormControl<string | null>(null, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      startDate: new FormControl<TuiDay | null>(null, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      employmentType: new FormControl('FULL_TIME', {
        nonNullable: true,
        validators: [Validators.required],
      }), // Default value set here
      category: new FormControl('Academic', {
        nonNullable: true,
        validators: [Validators.required],
      }), // Default value set here
      isActive: new FormControl(true, { nonNullable: true, validators: [Validators.required] }), // Replaced 'status' with 'isActive'
      useDefaultPassword: new FormControl(false),
      roles: new FormControl<string[]>([]),
      password: new FormControl('', {
        validators: isEdit
          ? []
          : [
              Validators.minLength(8),
              Validators.pattern(/(?=.*[a-z])/),
              Validators.pattern(/(?=.*[A-Z])/),
              Validators.pattern(/(?=.*\d)/),
              Validators.pattern(/(?=.*[@$!%*?&])/),
            ],
      }),
    });

    this.form.get('useDefaultPassword')?.valueChanges.subscribe((useDefault) => {
      const passwordControl = this.form.get('password');

      if (useDefault) {
        passwordControl?.disable();
        passwordControl?.reset();
      } else {
        passwordControl?.enable();
      }
    });
  }

  private patchForm(data: Employee): void {
    // 1. Find the name/title from the service arrays using the incoming IDs
    const departmentName =
      this.employeeService.allDepartments()?.find((d) => d.id === data.departmentId)?.name ?? '';
    const designationTitle =
      this.employeeService.allDesignations()?.find((deg) => deg.id === data.designationId)?.title ??
      '';
    const branchName =
      this.employeeService.allBranches()?.find((b) => b.id === data.branchId)?.name ?? '';
    const managerName =
      this.employeeService.allManagers()?.find((m) => m.id === data.managerId)?.fullName ?? null;

    // 2. Handle category enum conversion (whether incoming is number or string)
    // let categoryValue = 'Academic'; // default
    // if (typeof data.category === 'number') {
    //   categoryValue = CategoryType[data.category] ?? 'Academic';
    // } else if (typeof data.category === 'string') {
    //   categoryValue = data.category;
    // }

    // 3. Patch the form
    this.form.patchValue({
      staffNo: data.staffNo ?? '',
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      title: data.title ?? '',
      dateOfBirth: data.dateOfBirth,
      email: data.workEmail ?? '',
      gender: data.gender ?? '',
      mobile: data.mobile ?? '',
      niNumber: data.niNumber ?? '',
      departmentId: departmentName,
      designationId: designationTitle,
      branchId: branchName,
      managerId: managerName,
      startDate: data.startDate,
      employmentType: data.employmentType ?? 'full-time',
      // category: categoryValue,
      isActive: data.isActive ?? true,
      useDefaultPassword: false,
      // roles: data.roles ?? [],
    });
  }

  protected isRequired(controlPath: string): boolean {
    const control = this.form.get(controlPath);
    if (!control) return false;
    return control.hasValidator(Validators.required);
  }

  protected submitFullPayload(): void {
    if (this.isSubmiting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.updateValueAndValidity();
      return;
    }

    this.isSubmiting.set(true);
    const rawValue = this.form.getRawValue();

    if (this.isEditMode() && !rawValue.password) {
      delete rawValue.password;
    }
    const payload: CreateEmployeeCommand = {
      ...rawValue,
      departmentId: this.employeeService
        .allDepartments()
        ?.find((b) => b.name == rawValue.departmentId)?.id,
      designationId: this.employeeService
        .allDesignations()
        ?.find((b) => b.title == rawValue.designationId)?.id,
      branchId: this.employeeService.allBranches()?.find((b) => b.name == rawValue.branchId)?.id,
      managerId: this.employeeService.allManagers()?.find((b) => b.fullName == rawValue.managerId)
        ?.id,
      category:
        CategoryType[rawValue.category as keyof typeof CategoryType] ?? CategoryType.Administrative, // dateOfBirth: rawValue.dob ? rawValue.dob.toLocalNativeDate().toISOString() : null,
    };

    if (this.isEditMode()) {
      console.log('Edit Payload: ', payload);
    } else {
      console.log('New Payload: ', payload);
      this.employeeService
        .addEmployee(payload)
        .pipe(finalize(() => this.isSubmiting.set(false)))
        .subscribe({
          next: () => {
            this.toast.success(`Employee created successfully!`, 'Employee Created');
            this.router.navigate(['/employee/all']);
          },
          error: (err) => {
            this.toast.error(`${err}`, 'Creation Failed');
          },
        });
    }
  }
}
