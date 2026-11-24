import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../auth/services/authApi";
import {
  getTicketCounts,
  type TicketCounts,
} from "../../tickets/services/ticketApi";
import { useAuthStore } from "../../auth/store/authStore";
import Dashboard from "./Dashboard";

vi.mock("../../auth/services/authApi", () => ({
  getMe: vi.fn(),
}));

vi.mock("../../tickets/services/ticketApi", () => ({
  getTicketCounts: vi.fn(),
}));

const mockedGetMe = vi.mocked(getMe);
const mockedGetTicketCounts = vi.mocked(getTicketCounts);

const admin = { username: "casey", role: "ADMIN" };
const counts: TicketCounts = {
  open: 7,
  assigned: 4,
  inProgress: 2,
  completed: 11,
};

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<p>Tickets route reached</p>} />
        <Route path="/assignments" element={<p>Assignments route reached</p>} />
        <Route path="/users" element={<p>Users route reached</p>} />
        <Route path="/login" element={<p>Login route reached</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
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

  it("keeps the loading UI until user and ticket count requests both resolve", async () => {
    let resolveUser: (user: {
      username: string;
      role: string | null;
    }) => void = () => {};
    let resolveCounts: (result: TicketCounts) => void = () => {};
    const pendingUser = new Promise<{
      username: string;
      role: string | null;
    }>((resolve) => {
      resolveUser = resolve;
    });
    const pendingCounts = new Promise<TicketCounts>((resolve) => {
      resolveCounts = resolve;
    });
    mockedGetMe.mockReturnValue(pendingUser);
    mockedGetTicketCounts.mockReturnValue(pendingCounts);

    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Loading..." }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("...")).toHaveLength(4);

    await act(async () => {
      resolveUser(admin);
      await pendingUser;
    });
    expect(
      screen.getByRole("heading", { name: "Loading..." }),
    ).toBeInTheDocument();

    await act(async () => {
      resolveCounts(counts);
      await pendingCounts;
    });

    expect(await screen.findByText("Welcome back, casey")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("renders the user, role, and all four ticket counts", async () => {
    mockedGetMe.mockResolvedValue(admin);
    mockedGetTicketCounts.mockResolvedValue(counts);

    renderDashboard();

    expect(await screen.findByText("Welcome back, casey")).toBeInTheDocument();
    expect(screen.getByText("Role: ADMIN")).toBeInTheDocument();
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("Assigned Tickets")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("renders zero counts and omits the role label when the role is null", async () => {
    mockedGetMe.mockResolvedValue({ username: "unknown", role: null });
    mockedGetTicketCounts.mockResolvedValue({
      open: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
    });

    renderDashboard();

    expect(
      await screen.findByText("Welcome back, unknown"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Role:/)).not.toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(4);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it.each([
    ["ADMIN", ["Tickets", "Assignments", "Users"]],
    ["INSPECTOR", ["Tickets"]],
    ["TECHNICIAN", ["Assignments"]],
  ])("shows the navigation links allowed for role %s", async (role, links) => {
    mockedGetMe.mockResolvedValue({ username: "casey", role });
    mockedGetTicketCounts.mockResolvedValue(counts);

    renderDashboard();

    await screen.findByText(`Role: ${role}`);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();

    for (const link of links) {
      expect(screen.getByRole("link", { name: link })).toBeInTheDocument();
    }

    for (const link of ["Tickets", "Assignments", "Users"]) {
      if (!links.includes(link)) {
        expect(
          screen.queryByRole("link", { name: link }),
        ).not.toBeInTheDocument();
      }
    }
  });

  it("navigates from the dashboard sidebar to a feature route", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue(admin);
    mockedGetTicketCounts.mockResolvedValue(counts);

    renderDashboard();

    await screen.findByRole("link", { name: "Tickets" });
    await user.click(screen.getByRole("link", { name: "Tickets" }));

    expect(
      await screen.findByText("Tickets route reached"),
    ).toBeInTheDocument();
  });

  it("clears auth state and localStorage and navigates to Login on logout", async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken("logout-token");
    mockedGetMe.mockResolvedValue(admin);
    mockedGetTicketCounts.mockResolvedValue(counts);

    renderDashboard();

    await screen.findByText("Welcome back, casey");
    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByText("Login route reached")).toBeInTheDocument();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("uses the existing username and zero-count fallbacks when ticket counts fail", async () => {
    mockedGetMe.mockResolvedValue(admin);
    mockedGetTicketCounts.mockRejectedValue(new Error("Counts unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderDashboard();

    expect(await screen.findByText("Welcome back, User")).toBeInTheDocument();
    expect(screen.queryByText("Role: ADMIN")).not.toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(4);
    expect(
      screen.queryByText("Failed to load dashboard"),
    ).not.toBeInTheDocument();
  });

  it("uses the existing username and zero-count fallbacks when getMe fails", async () => {
    mockedGetMe.mockRejectedValue(new Error("User unavailable"));
    mockedGetTicketCounts.mockResolvedValue(counts);
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderDashboard();

    expect(await screen.findByText("Welcome back, User")).toBeInTheDocument();
    expect(screen.queryByText(/Role:/)).not.toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(4);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
