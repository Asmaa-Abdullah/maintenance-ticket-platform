import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { disableUser, getAllUsers } from "../services/userApi";
import type { User } from "../types/user";
import Users from "./Users";

vi.mock("../services/userApi", () => ({
  disableUser: vi.fn(),
  getAllUsers: vi.fn(),
}));

const users: User[] = [
  {
    id: 1,
    employeeNumber: "EMP-1001",
    fullName: "Alice Technician",
    username: "alice",
    role: "TECHNICIAN",
    enabled: true,
  },
  {
    id: 2,
    employeeNumber: "EMP-1002",
    fullName: "Bob Inspector",
    username: "bob.i",
    role: "INSPECTOR",
    enabled: true,
  },
  {
    id: 3,
    employeeNumber: "EMP-1003",
    fullName: "Disabled Admin",
    username: "disabled-admin",
    role: "ADMIN",
    enabled: false,
  },
];

const mockedGetAllUsers = vi.mocked(getAllUsers);
const mockedDisableUser = vi.mocked(disableUser);

function renderUsers() {
  return render(
    <MemoryRouter>
      <Users />
    </MemoryRouter>,
  );
}

describe("Users page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading then renders enabled users and filters disabled users", async () => {
    let resolveUsers: (result: User[]) => void = () => {};
    const pendingUsers = new Promise<User[]>((resolve) => {
      resolveUsers = resolve;
    });
    mockedGetAllUsers.mockReturnValue(pendingUsers);

    renderUsers();

    expect(
      screen.getByRole("cell", { name: "Loading users..." }),
    ).toBeInTheDocument();

    await act(async () => {
      resolveUsers(users);
      await pendingUsers;
    });

    expect(
      await screen.findByRole("row", { name: /EMP-1001/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice Technician")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("TECHNICIAN")).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /EMP-1001/ })).getByText("Active"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Disabled Admin")).not.toBeInTheDocument();
    expect(mockedGetAllUsers).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when the API returns no users", async () => {
    mockedGetAllUsers.mockResolvedValue([]);

    renderUsers();

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows a load error when the users request fails", async () => {
    mockedGetAllUsers.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderUsers();

    expect(
      await screen.findByText("Failed to load users. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  it("searches full name, username, and employee number case-insensitively", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue(users);

    renderUsers();

    const search = await screen.findByPlaceholderText("Search users...");
    await user.type(search, "ALICE TECH");

    expect(screen.getByRole("row", { name: /EMP-1001/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /EMP-1002/ }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "BOB");
    expect(screen.getByRole("row", { name: /EMP-1002/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /EMP-1001/ }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "bob.i");
    expect(screen.getByRole("row", { name: /EMP-1002/ })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "emp-1001");
    expect(screen.getByRole("row", { name: /EMP-1001/ })).toBeInTheDocument();
  });

  it("does not trim whitespace around a search query", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue(users);

    renderUsers();

    const search = await screen.findByPlaceholderText("Search users...");
    await user.type(search, " alice ");

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows the empty state for an unmatched search", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue(users);

    renderUsers();

    await user.type(
      await screen.findByPlaceholderText("Search users..."),
      "no-such-user",
    );
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("navigates to the create route", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue(users);

    render(
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/users/create" element={<p>Create route reached</p>} />
          <Route path="/users/:id/edit" element={<p>Edit route reached</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Create User/ }));
    expect(await screen.findByText("Create route reached")).toBeInTheDocument();
  });

  it("navigates to the selected user's edit route", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue(users);

    render(
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id/edit" element={<p>Edit route reached</p>} />
        </Routes>
      </MemoryRouter>,
    );

    const editRow = await screen.findByRole("row", { name: /EMP-1001/ });
    await user.click(within(editRow).getByRole("button", { name: "Edit" }));
    expect(await screen.findByText("Edit route reached")).toBeInTheDocument();
  });

  it("navigates back to the dashboard", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/dashboard" element={<p>Dashboard reached</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole("button", { name: /Back to Dashboard/ }),
    );
    expect(await screen.findByText("Dashboard reached")).toBeInTheDocument();
  });

  it("closes the disable confirmation when cancelled without changing the user", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue([users[0]]);

    renderUsers();

    const row = await screen.findByRole("row", { name: /EMP-1001/ });
    await user.click(within(row).getByRole("button", { name: "Disable" }));
    expect(
      screen.getByRole("heading", { name: "Confirm User Deactivation" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Alice Technician")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("heading", { name: "Confirm User Deactivation" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /EMP-1001/ })).toBeInTheDocument();
    expect(mockedDisableUser).not.toHaveBeenCalled();
  });

  it("disables a user after confirmation and removes the row", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue([users[0]]);
    mockedDisableUser.mockResolvedValue(undefined);

    renderUsers();

    const row = await screen.findByRole("row", { name: /EMP-1001/ });
    await user.click(within(row).getByRole("button", { name: "Disable" }));
    await user.click(screen.getByRole("button", { name: "Disable User" }));

    expect(mockedDisableUser).toHaveBeenCalledWith(users[0].id);
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Confirm User Deactivation" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the user and modal open and shows an error when disabling fails", async () => {
    const user = userEvent.setup();
    mockedGetAllUsers.mockResolvedValue([users[0]]);
    mockedDisableUser.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderUsers();

    const row = await screen.findByRole("row", { name: /EMP-1001/ });
    await user.click(within(row).getByRole("button", { name: "Disable" }));
    await user.click(screen.getByRole("button", { name: "Disable User" }));

    expect(
      await screen.findByText("Failed to disable user. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /EMP-1001/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Confirm User Deactivation" }),
    ).toBeInTheDocument();
  });

  it("disables modal actions and shows progress while disabling is pending", async () => {
    const user = userEvent.setup();
    let resolveDisable: () => void = () => {};
    const pendingDisable = new Promise<void>((resolve) => {
      resolveDisable = resolve;
    });
    mockedGetAllUsers.mockResolvedValue([users[0]]);
    mockedDisableUser.mockReturnValue(pendingDisable);

    renderUsers();

    const row = await screen.findByRole("row", { name: /EMP-1001/ });
    await user.click(within(row).getByRole("button", { name: "Disable" }));
    const confirmClick = user.click(
      screen.getByRole("button", { name: "Disable User" }),
    );

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      resolveDisable();
      await pendingDisable;
    });

    await confirmClick;
    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });
});
