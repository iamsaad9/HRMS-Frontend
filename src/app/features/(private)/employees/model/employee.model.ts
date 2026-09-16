// Dropdown Items

export interface DesignationItem {
  id: string;
  title: string;
  isActive: boolean;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface RoleItem {
  id: string;
  name: string;
}

export interface ManagerItem {
  id: string;
  fullName: string;
  workEmail: string;
}

export interface BrancheItem {
  id: string;
  name: string;
  code: string;
  latitude: string | null;
  longitude: string | null;
  radiusInMeters: number;
  address: string;
  isActive: boolean;
}

// Employee Form

export enum CategoryType {
  Administrative = 1,
  Academic = 2,
}

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

export interface CreateEmployeeCommand {
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  designationId: string;
  branchId: string;
  category: string;
  isActive: boolean;
  useDefaultPassword: boolean;
  managerId: string | null;
  password: string | null;
  roles: string[];
  title: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  mobile: string | null;
  niNumber: string | null;
  startDate: string | null;
  employmentType: string | null;
}

export interface UpdateEmployeeCommand {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  workEmail: string;
  mobile: string | null;
  niNumber: string | null;
  startDate: string | null;
  department: string | null;
  isActive: boolean;
  employmentType: string | null;
  departmentId: string | null;
  branchId: string | null;
  designationId: string | null;
  managerId: string | null;
  newPassword?: string | null;
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
  title: string;
  category?:string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  workEmail: string;
  mobile: string;
  niNumber: string;
  startDate: string;
  employmentType: string | null;
  isActive: boolean;
  createdAtUtc: Date | null;
  departmentId?: string;
  departmentName?: string;
  branchId?: string;
  branchName?: string;
  designationId?: string;
  designationTitle?: string;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  shiftCode?: string;
  roles?:string[]
  profilePictureUrl?: string | null;
}

export interface EmployeeFilter {
  search: string;
  departmentId: string | null;
  branchId: string | null;
  managerId: string | null;
  designationId: string | null;
  // null = no status filter applied (show both active and inactive)
  isActive: boolean | null;
  status: string | null;
  role: string | null;
}

export const EMPTY_EMPLOYEE_FILTER: EmployeeFilter = {
  search: '',
  departmentId: null,
  branchId: null,
  managerId: null,
  designationId: null,
  isActive: null,
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
      employee.workEmail.toLowerCase().includes(search);
    const matchesDepartment = !filter.departmentId || employee.departmentId === filter.departmentId;
    const matchesBranch = !filter.branchId || employee.branchId === filter.branchId;
    const matchesManager = !filter.managerId || employee.managerId === filter.managerId;
    const matchesRole = !role || employee.designationTitle?.toLowerCase() === role;
    const isActive =
      filter.isActive === null ||
      filter.isActive === undefined ||
      employee.isActive === filter.isActive;

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesBranch &&
      matchesManager &&
      matchesRole &&
      isActive
    );
  });
}

export interface AddEmployeeCommand extends EmployeeDetailsForm, ExperienceForm {}
