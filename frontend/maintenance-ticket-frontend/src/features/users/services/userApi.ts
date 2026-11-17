import { identityApi } from "../../../services/api/axios";

import type { User, CreateUserRequest, UpdateUserRequest } from "../types/user";

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  const response = await identityApi.get<User[]>("/api/v1/users");
  return response.data;
};

// Get user by ID
export const getUserById = async (id: number): Promise<User> => {
  const response = await identityApi.get<User>(`/api/v1/users/${id}`);
  return response.data;
};

export interface Technician {
  id: number;
  fullName: string;
}

export const getTechnicians = async (): Promise<Technician[]> => {
  const response = await identityApi.get<Technician[]>(
    "/api/v1/users/technicians",
  );
  return response.data;
};

// Create user
export const createUser = async (user: CreateUserRequest): Promise<User> => {
  const response = await identityApi.post<User>("/api/v1/users", user);
  return response.data;
};

// Update user
export const updateUser = async (
  id: number,
  user: UpdateUserRequest,
): Promise<User> => {
  const response = await identityApi.put<User>(`/api/v1/users/${id}`, user);
  return response.data;
};

// Disable user
export const disableUser = async (id: number): Promise<void> => {
  await identityApi.patch<void>(`/api/v1/users/${id}/disable`);
};
