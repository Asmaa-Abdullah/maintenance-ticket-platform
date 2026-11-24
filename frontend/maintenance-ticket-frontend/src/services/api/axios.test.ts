import {
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../features/auth/store/authStore";
import { assignmentApi, identityApi, ticketApi } from "./axios";

const clients: Array<[string, AxiosInstance, string]> = [
  ["identityApi", identityApi, "/api/v1/auth/me"],
  ["ticketApi", ticketApi, "/api/v1/tickets"],
  ["assignmentApi", assignmentApi, "/api/v1/assignments"],
];

async function sendIsolatedRequest(
  client: AxiosInstance,
  url: string,
  method: "get" | "post" = "get",
) {
  let capturedConfig: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = async (config) => {
    capturedConfig = config;
    return {
      data: {},
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    };
  };

  await client.request({ url, method, adapter });

  if (!capturedConfig) {
    throw new Error("Axios adapter did not receive a request.");
  }

  return capturedConfig;
}

describe("API auth interceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null });
  });

  afterEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null });
  });

  it.each(clients)(
    "adds the Bearer token to %s requests",
    async (_name, client, url) => {
      useAuthStore.getState().setAccessToken("interceptor-token");

      const config = await sendIsolatedRequest(client, url);

      expect(config.headers.get("Authorization")).toBe(
        "Bearer interceptor-token",
      );
    },
  );

  it.each(clients)(
    "omits Authorization from %s requests when no token exists",
    async (_name, client, url) => {
      const config = await sendIsolatedRequest(client, url);

      expect(config.headers.get("Authorization")).toBeUndefined();
    },
  );

  it("omits Authorization on login requests even when a token exists", async () => {
    useAuthStore.getState().setAccessToken("existing-token");

    const config = await sendIsolatedRequest(
      identityApi,
      "/api/v1/auth/login",
      "post",
    );

    expect(config.headers.get("Authorization")).toBeUndefined();
  });
});
