export interface EmployeeDetailsForm {
  fullName: string;
  email: string;
  phone: string;
  dob: Date | null;
  department: string;
  employmentType: string;
  isRemote: boolean;
  requireVisa: boolean;
}

export interface ExperienceForm {
  experiences: Experience[];
  educations: Education[];
}

interface Experience {
  companyName: string;
  jobTitle: string;
  isCurrent: boolean;
  startDate: Date;
  endDate?: Date;
  keyResponsibilities: string;
}

interface Education {
  institute: string;
  degree: string;
  startDate: Date;
  endDate?: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  tags: string[];
  workload: number; // 0-100, percent capacity
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

export interface AddEmployeeForm extends EmployeeDetailsForm, ExperienceForm {}
