import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { login } from "../../features/auth/services/authApi";
import { useAuthStore } from "../../features/auth/store/authStore";
import LoginForm from "./LoginForm";

vi.mock("../../features/auth/services/authApi", () => ({
  login: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

function renderLoginForm() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<p>Dashboard reached</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ accessToken: null });
  });

  afterEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null });
    vi.restoreAllMocks();
  });

  it("renders labeled username and password fields without client-side required validation", () => {
    renderLoginForm();

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText("Username")).not.toBeRequired();
    expect(screen.getByLabelText("Password")).not.toBeRequired();
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  });

  it("submits empty credentials to the API instead of applying unimplemented validation", async () => {
    const user = userEvent.setup();
    mockedLogin.mockRejectedValue(new Error("Unauthorized"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderLoginForm();

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(mockedLogin).toHaveBeenCalledWith({ username: "", password: "" });
    expect(
      await screen.findByText("Invalid username or password"),
    ).toBeInTheDocument();
  });

  it("stores the returned access token and navigates to the dashboard", async () => {
    const user = userEvent.setup();
    mockedLogin.mockResolvedValue({
      accessToken: "access-token-123",
      tokenType: "Bearer",
      expiresIn: 3600,
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    renderLoginForm();

    await user.type(screen.getByLabelText("Username"), "casey");
    await user.type(screen.getByLabelText("Password"), "password-value");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(mockedLogin).toHaveBeenCalledWith({
      username: "casey",
      password: "password-value",
    });
    expect(await screen.findByText("Dashboard reached")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBe("access-token-123");
    expect(localStorage.getItem("accessToken")).toBe("access-token-123");
  });

  it.each([
    ["invalid credentials", { response: { status: 401 } }],
    ["generic API failure", new Error("Network unavailable")],
  ])("shows the invalid-credentials message for %s", async (_label, error) => {
    const user = userEvent.setup();
    mockedLogin.mockRejectedValue(error);
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderLoginForm();

    await user.type(screen.getByLabelText("Username"), "casey");
    await user.type(screen.getByLabelText("Password"), "incorrect");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Invalid username or password"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveValue("casey");
    expect(screen.getByLabelText("Password")).toHaveValue("incorrect");
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("clears the previous error while retrying the login request", async () => {
    const user = userEvent.setup();
    let resolveLogin: (result: {
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    }) => void = () => {};
    const pendingLogin = new Promise<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    }>((resolve) => {
      resolveLogin = resolve;
    });
    mockedLogin
      .mockRejectedValueOnce(new Error("Unauthorized"))
      .mockReturnValueOnce(pendingLogin);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    renderLoginForm();

    await user.type(screen.getByLabelText("Username"), "casey");
    await user.type(screen.getByLabelText("Password"), "password-value");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(
      await screen.findByText("Invalid username or password"),
    ).toBeInTheDocument();

    const retryClick = user.click(
      screen.getByRole("button", { name: "Login" }),
    );
    expect(
      await screen.findByRole("button", { name: "Logging in..." }),
    ).toBeDisabled();
    expect(
      screen.queryByText("Invalid username or password"),
    ).not.toBeInTheDocument();

    await act(async () => {
      resolveLogin({
        accessToken: "retry-token",
        tokenType: "Bearer",
        expiresIn: 3600,
      });
      await pendingLogin;
    });

    await retryClick;
    expect(await screen.findByText("Dashboard reached")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBe("retry-token");
  });

  it("disables both inputs and the submit button while login is pending", async () => {
    const user = userEvent.setup();
    let resolveLogin: (result: {
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    }) => void = () => {};
    const pendingLogin = new Promise<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    }>((resolve) => {
      resolveLogin = resolve;
    });
    mockedLogin.mockReturnValue(pendingLogin);
    renderLoginForm();

    await user.type(screen.getByLabelText("Username"), "casey");
    await user.type(screen.getByLabelText("Password"), "password-value");
    const submitClick = user.click(
      screen.getByRole("button", { name: "Login" }),
    );

    expect(
      await screen.findByRole("button", { name: "Logging in..." }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Username")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();

    await act(async () => {
      resolveLogin({
        accessToken: "pending-token",
        tokenType: "Bearer",
        expiresIn: 3600,
      });
      await pendingLogin;
    });

    await submitClick;
    expect(await screen.findByText("Dashboard reached")).toBeInTheDocument();
  });
});
