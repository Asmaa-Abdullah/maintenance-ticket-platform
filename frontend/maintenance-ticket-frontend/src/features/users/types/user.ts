export type UserRole = "ADMIN" | "INSPECTOR" | "TECHNICIAN";

export interface User {
  id: number;
  employeeNumber: string;
  fullName: string;
  username: string;
  role: UserRole;
  enabled: boolean;
}

export interface CreateUserRequest {
  employeeNumber: string;
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  employeeNumber: string;
  fullName: string;
  username: string;
  role: UserRole;
}
