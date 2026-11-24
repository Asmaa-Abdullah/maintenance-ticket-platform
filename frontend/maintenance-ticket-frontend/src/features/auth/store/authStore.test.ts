import { beforeEach, describe, expect, it, vi } from "vitest";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("initializes the access token from localStorage when the module loads", async () => {
    localStorage.setItem("accessToken", "persisted-token");

    const { useAuthStore } = await import("./authStore");

    expect(useAuthStore.getState().accessToken).toBe("persisted-token");
  });

  it("initializes with a null token when localStorage is empty", async () => {
    const { useAuthStore } = await import("./authStore");

    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("updates store state and persists the token", async () => {
    const { useAuthStore } = await import("./authStore");

    useAuthStore.getState().setAccessToken("new-token");

    expect(useAuthStore.getState().accessToken).toBe("new-token");
    expect(localStorage.getItem("accessToken")).toBe("new-token");
  });

  it("clears store state and removes the persisted token", async () => {
    localStorage.setItem("accessToken", "old-token");
    const { useAuthStore } = await import("./authStore");

    useAuthStore.getState().clearAccessToken();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
  });
});
