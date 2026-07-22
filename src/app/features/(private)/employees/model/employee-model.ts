interface AddEmployeeForm {
  fullName: string;
  email: string;
  phone: number;
  dob: Date;
  department: string;
  employementType: string;
  isRemote: boolean;
  requireVisa: boolean;
  workExperience: Experience[];
  education: Education[];
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
