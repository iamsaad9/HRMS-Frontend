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

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string | null;
  department: string | null;
  status: string | null;
  tags: string[] | null;
  workload: number | null; // 0-100, percent capacity
}

export interface EmployeeFilter {
  search: string;
  department: string | null;
  status: string | null;
  role: string | null;
}

export const EMPTY_EMPLOYEE_FILTER: EmployeeFilter = {
  search: '',
  department: null,
  status: null,
  role: '',
};

/** Pure filter fn — reuse it wherever the list needs to be narrowed (component, resolver, tests). */
export function filterEmployees(
  employees: readonly Employee[],
  filter: EmployeeFilter,
): Employee[] {
  const search = filter.search.trim().toLowerCase();

  return employees.filter((employee) => {
    const matchesSearch =
      !search ||
      employee.name.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search);
    const matchesDepartment = !filter.department || employee.department === filter.department;
    const matchesStatus = !filter.status || employee.status === filter.status;

    return matchesSearch && matchesDepartment && matchesStatus;
  });
}

export interface AddEmployeeCommand extends EmployeeDetailsForm, ExperienceForm {}
