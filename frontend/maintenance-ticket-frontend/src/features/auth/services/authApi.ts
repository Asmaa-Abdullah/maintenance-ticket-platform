import { identityApi } from "../../../services/api/axios";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  username: string;
}

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const response = await identityApi.post<LoginResponse>(
    "/api/v1/auth/login",
    credentials,
  );

  return response.data;
};

export const register = async (
  credentials: RegisterRequest,
): Promise<RegisterResponse> => {
  const response = await identityApi.post<RegisterResponse>(
    "/api/v1/auth/register",
    credentials,
  );

  return response.data;
};

export interface MeResponse {
  username: string;
  role: string | null;
}

export const getMe = async (): Promise<MeResponse> => {
  const response = await identityApi.get<MeResponse>("/api/v1/auth/me");

  return response.data;
};
