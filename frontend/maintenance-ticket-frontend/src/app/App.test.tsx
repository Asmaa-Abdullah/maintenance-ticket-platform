import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../features/auth/store/authStore";
import App from "./App";

vi.mock("../features/dashboard/pages/Dashboard", () => ({
  default: () => <p>Protected dashboard reached</p>,
}));

describe("App routes", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null });
  });

  afterEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null });
  });

  it("redirects unauthenticated users from a protected route to Login", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.queryByText("Protected dashboard reached"),
    ).not.toBeInTheDocument();
  });

  it("allows a user with an access token to enter a protected route", () => {
    useAuthStore.getState().setAccessToken("valid-token");

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected dashboard reached")).toBeInTheDocument();
  });

  it("redirects unknown routes to Login", () => {
    useAuthStore.getState().setAccessToken("valid-token");

    render(
      <MemoryRouter initialEntries={["/not-a-route"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.queryByText("Protected dashboard reached"),
    ).not.toBeInTheDocument();
  });
});
