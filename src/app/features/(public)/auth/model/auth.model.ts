import { Employee } from "../../../(private)/employees/model/employee.model";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  userId: string;
  email: string;
  permissions: string[];
  employeeInfo: Employee;
  /** True if this employee has direct reports - "Manager" is structural, not an Identity role. */
  isManager?: boolean;
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

export interface changePasswordCommand{
  currentPassword: string;
  newPassword:string;
}