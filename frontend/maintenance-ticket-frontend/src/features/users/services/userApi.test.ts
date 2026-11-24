import { AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { identityApi } from "../../../services/api/axios";
import {
  createUser,
  disableUser,
  getAllUsers,
  getTechnicians,
  getUserById,
  updateUser,
  type Technician,
} from "./userApi";
import type { CreateUserRequest, UpdateUserRequest, User } from "../types/user";

vi.mock("../../../services/api/axios", () => ({
  identityApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = vi.mocked(identityApi.get);
const mockedPost = vi.mocked(identityApi.post);
const mockedPut = vi.mocked(identityApi.put);
const mockedPatch = vi.mocked(identityApi.patch);

function response<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
}

const user: User = {
  id: 8,
  employeeNumber: "EMP-1008",
  fullName: "Casey Technician",
  username: "casey.t",
  role: "TECHNICIAN",
  enabled: true,
};

describe("userApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets all users and returns the response data", async () => {
    mockedGet.mockResolvedValue(response([user]));

    await expect(getAllUsers()).resolves.toEqual([user]);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/users");
  });

  it("gets a user by ID and returns the response data", async () => {
    mockedGet.mockResolvedValue(response(user));

    await expect(getUserById(8)).resolves.toEqual(user);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/users/8");
  });

  it("gets technicians and returns the response data", async () => {
    const technicians: Technician[] = [{ id: 8, fullName: "Casey Technician" }];
    mockedGet.mockResolvedValue(response(technicians));

    await expect(getTechnicians()).resolves.toEqual(technicians);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/users/technicians");
  });

  it("creates a user with the exact request body and returns the created user", async () => {
    const request: CreateUserRequest = {
      employeeNumber: "EMP-1008",
      fullName: "Casey Technician",
      username: "casey.t",
      password: "secure-password",
      role: "TECHNICIAN",
    };
    mockedPost.mockResolvedValue(response(user));

    await expect(createUser(request)).resolves.toEqual(user);

    expect(mockedPost).toHaveBeenCalledWith("/api/v1/users", request);
  });

  it("updates a user with the exact request body and returns the response data", async () => {
    const request: UpdateUserRequest = {
      employeeNumber: "EMP-1008",
      fullName: "Casey Updated",
      username: "casey.updated",
      role: "ADMIN",
    };
    const updatedUser: User = {
      ...user,
      fullName: request.fullName,
      username: request.username,
      role: request.role,
    };
    mockedPut.mockResolvedValue(response(updatedUser));

    await expect(updateUser(user.id, request)).resolves.toEqual(updatedUser);

    expect(mockedPut).toHaveBeenCalledWith("/api/v1/users/8", request);
  });

  it("disables a user with PATCH and resolves without a response body", async () => {
    mockedPatch.mockResolvedValue(response(undefined));

    await expect(disableUser(user.id)).resolves.toBeUndefined();

    expect(mockedPatch).toHaveBeenCalledWith("/api/v1/users/8/disable");
  });

  it("propagates API errors to the caller", async () => {
    const failure = new Error("Request failed");
    mockedGet.mockRejectedValue(failure);

    await expect(getAllUsers()).rejects.toBe(failure);
  });
});
