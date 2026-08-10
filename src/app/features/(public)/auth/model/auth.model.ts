export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  employeeInfo: {
    employeeId: string;
    firstName: string;
    lastName: string;
    departmentId: string | null;
    branchId: string | null;
  };
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface RegisterCommand {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
}
