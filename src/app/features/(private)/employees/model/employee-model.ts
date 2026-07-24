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

export interface AddEmployeeForm extends EmployeeDetailsForm, ExperienceForm {}
