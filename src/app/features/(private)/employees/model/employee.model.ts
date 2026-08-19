export interface EmployeeDetailsForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dob: Date | null;
  department: string | null;
  employmentType: string | null;
  isRemote: boolean | null;
  requireVisa: boolean | null;
}

export interface AdditionalDetailsForm {
  password: string;
}

export interface ExperienceForm {
  experiences: Experience[];
  educations: Education[];
}

interface Experience {
  companyName: string | null;
  jobTitle: string | null;
  isCurrent: boolean | null;
  startDate: Date | null;
  endDate?: Date | null;
  keyResponsibilities: string | null;
}

interface Education {
  institute: string | null;
  degree: string | null;
  startDate: Date | null;
  endDate?: Date | null;
}

export interface CreateEmployeeResponse {
  employeeId: string;
  userId: string;
  staffNo: string;
  email: string;
}

export interface Employee {
  id: string;
  userId: string;
  staffNo: string;
  firstName: string;
  fullName: string;
  lastName: string;
  email: string;
  departmentId?: string;
  departmentName?: string;
  branchId?: string;
  branchName?: string;
  jobTitleId?: string;
  jobTitleName?: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
  createdAtUtc: Date;
  role: string | null;
  status: string | null;
}

export interface EmployeeFilter {
  search: string;
  departmentId: string | null;
  branchId: string | null;
  managerId: string | null;
  isActive: boolean;
  status: string | null;
  role: string | null;
}

export const EMPTY_EMPLOYEE_FILTER: EmployeeFilter = {
  search: '',
  departmentId: null,
  branchId: null,
  managerId: null,
  isActive: true,
  status: null,
  role: '',
};

export interface BulkUploadResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: {
    rowNumber: number;
    workEmail: string;
    errorReason: string;
    rawCsvLine: string;
  }[];
  errorCsvBytes: string;
  errorCsvFileName: string;
}

export function filterEmployees(
  employees: readonly Employee[],
  filter: EmployeeFilter,
): Employee[] {
  const search = filter.search.trim().toLowerCase();
  const role = filter.role?.trim().toLowerCase();

  return employees.filter((employee) => {
    const matchesSearch =
      !search ||
      employee.firstName.toLowerCase().includes(search) ||
      employee.lastName.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search);
    const matchesDepartment = !filter.departmentId || employee.departmentId === filter.departmentId;
    const matchesBranch = !filter.branchId || employee.branchId === filter.branchId;
    const matchesManager = !filter.managerId || employee.managerId === filter.managerId;
    const matchesStatus = !filter.status || employee.status === filter.status;
    const matchesRole = !role || employee.role?.toLowerCase() === role;
    const isActive =
      filter.isActive === null ||
      filter.isActive === undefined ||
      employee.isActive === filter.isActive;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesStatus &&
      matchesBranch &&
      matchesManager &&
      matchesRole &&
      isActive
    );
  });
}

export interface AddEmployeeCommand extends EmployeeDetailsForm, ExperienceForm {}
