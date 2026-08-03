export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  accessToken: string;
  refreshToken: string;
  fullName: string;
  email: string;
  role: string;
}

export interface RegisterCommand {
  //   fullName: string;
  Email: string;
  Password: string;
}

export interface RegisterResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
}
