import { AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { identityApi } from "../../../services/api/axios";
import {
  getMe,
  login,
  register,
  type LoginResponse,
  type MeResponse,
  type RegisterResponse,
} from "./authApi";

vi.mock("../../../services/api/axios", () => ({
  identityApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedGet = vi.mocked(identityApi.get);
const mockedPost = vi.mocked(identityApi.post);

function response<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
}

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts login credentials and returns the token response", async () => {
    const credentials = { username: "casey", password: "secret" };
    const result: LoginResponse = {
      accessToken: "access-token",
      tokenType: "Bearer",
      expiresIn: 3600,
    };
    mockedPost.mockResolvedValue(response(result));

    await expect(login(credentials)).resolves.toEqual(result);

    expect(mockedPost).toHaveBeenCalledWith("/api/v1/auth/login", credentials);
  });

  it("posts registration credentials and returns the response data", async () => {
    const credentials = { username: "new-user", password: "secret" };
    const result: RegisterResponse = { username: "new-user" };
    mockedPost.mockResolvedValue(response(result));

    await expect(register(credentials)).resolves.toEqual(result);

    expect(mockedPost).toHaveBeenCalledWith(
      "/api/v1/auth/register",
      credentials,
    );
  });

  it("gets the current user and returns the response data", async () => {
    const result: MeResponse = { username: "casey", role: "ADMIN" };
    mockedGet.mockResolvedValue(response(result));

    await expect(getMe()).resolves.toEqual(result);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/auth/me");
  });

  it("propagates API errors to the caller", async () => {
    const failure = new Error("Request failed");
    mockedPost.mockRejectedValue(failure);

    await expect(login({ username: "casey", password: "secret" })).rejects.toBe(
      failure,
    );
  });
});
