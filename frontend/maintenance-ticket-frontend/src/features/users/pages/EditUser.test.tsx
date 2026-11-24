import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUserById, updateUser } from "../services/userApi";
import type { UpdateUserRequest, User } from "../types/user";
import EditUser from "./EditUser";

vi.mock("../services/userApi", () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
}));

const existingUser: User = {
  id: 42,
  employeeNumber: "EMP-1042",
  fullName: "Morgan Inspector",
  username: "morgan.i",
  role: "INSPECTOR",
  enabled: true,
};

const mockedGetUserById = vi.mocked(getUserById);
const mockedUpdateUser = vi.mocked(updateUser);

function renderEditUser(entry = "/users/42/edit") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/users/:id/edit" element={<EditUser />} />
        <Route path="/users" element={<p>Users list reached</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditUser page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading, fetches by numeric ID, and populates the editable fields", async () => {
    let resolveUser: (result: User) => void = () => {};
    const pendingUser = new Promise<User>((resolve) => {
      resolveUser = resolve;
    });
    mockedGetUserById.mockReturnValue(pendingUser);

    renderEditUser();

    expect(screen.getByText("Loading user...")).toBeInTheDocument();
    expect(mockedGetUserById).toHaveBeenCalledWith(42);

    await act(async () => {
      resolveUser(existingUser);
      await pendingUser;
    });

    expect(
      await screen.findByRole("heading", { name: "Edit User" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("EMP-1042")).toHaveValue("EMP-1042");
    expect(screen.getByDisplayValue("EMP-1042")).toBeDisabled();
    expect(screen.getByLabelText("Full Name")).toHaveValue("Morgan Inspector");
    expect(screen.getByLabelText("Username")).toHaveValue("morgan.i");
    expect(screen.getByLabelText("New Password")).toHaveValue("");
    expect(screen.getByLabelText("Role")).toHaveValue("INSPECTOR");
    expect(screen.getByLabelText("Full Name")).toBeRequired();
    expect(screen.getByLabelText("Username")).toBeRequired();
    expect(screen.getByLabelText("Role")).toBeRequired();
  });

  it.each(["not-a-number", "0", "-2", "1.5"])(
    "rejects invalid route ID %s without requesting a user",
    async (id) => {
      renderEditUser(`/users/${id}/edit`);

      expect(await screen.findByText("Invalid user ID.")).toBeInTheDocument();
      expect(mockedGetUserById).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "← Back" }),
      ).toBeInTheDocument();
    },
  );

  it("shows a load error and allows returning to the users list", async () => {
    const user = userEvent.setup();
    mockedGetUserById.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderEditUser();

    expect(
      await screen.findByText("Failed to load user. Please try again."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(await screen.findByText("Users list reached")).toBeInTheDocument();
  });

  it("updates the user and navigates to the list when the password is blank", async () => {
    const user = userEvent.setup();
    mockedGetUserById.mockResolvedValue(existingUser);
    mockedUpdateUser.mockResolvedValue({
      ...existingUser,
      fullName: "Morgan Smith",
      username: "morgan.s",
      role: "ADMIN",
    });

    renderEditUser();

    await screen.findByRole("heading", { name: "Edit User" });
    await user.clear(screen.getByLabelText("Full Name"));
    await user.type(screen.getByLabelText("Full Name"), "Morgan Smith");
    await user.clear(screen.getByLabelText("Username"));
    await user.type(screen.getByLabelText("Username"), "morgan.s");
    await user.selectOptions(screen.getByLabelText("Role"), "ADMIN");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    const expectedRequest: UpdateUserRequest = {
      employeeNumber: existingUser.employeeNumber,
      fullName: "Morgan Smith",
      username: "morgan.s",
      role: "ADMIN",
    };
    expect(mockedUpdateUser).toHaveBeenCalledWith(42, expectedRequest);
    expect(await screen.findByText("Users list reached")).toBeInTheDocument();
  });

  it.each(["", "   "])(
    "omits a blank or whitespace-only new password (%j)",
    async (password) => {
      const user = userEvent.setup();
      mockedGetUserById.mockResolvedValue(existingUser);
      mockedUpdateUser.mockResolvedValue(existingUser);

      renderEditUser();

      await screen.findByRole("heading", { name: "Edit User" });
      if (password) {
        await user.type(screen.getByLabelText("New Password"), password);
      }
      await user.click(screen.getByRole("button", { name: "Save Changes" }));

      expect(mockedUpdateUser).toHaveBeenCalledWith(42, {
        employeeNumber: existingUser.employeeNumber,
        fullName: existingUser.fullName,
        username: existingUser.username,
        role: existingUser.role,
      });
    },
  );

  it("includes a nonblank new password exactly as entered", async () => {
    const user = userEvent.setup();
    mockedGetUserById.mockResolvedValue(existingUser);
    mockedUpdateUser.mockResolvedValue(existingUser);

    renderEditUser();

    await screen.findByRole("heading", { name: "Edit User" });
    await user.type(screen.getByLabelText("New Password"), "  new-secret  ");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockedUpdateUser).toHaveBeenCalledWith(42, {
      employeeNumber: existingUser.employeeNumber,
      fullName: existingUser.fullName,
      username: existingUser.username,
      role: existingUser.role,
      password: "  new-secret  ",
    });
  });

  it("does not submit when a required field is empty", async () => {
    const user = userEvent.setup();
    mockedGetUserById.mockResolvedValue(existingUser);

    renderEditUser();

    await screen.findByRole("heading", { name: "Edit User" });
    await user.clear(screen.getByLabelText("Full Name"));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByLabelText("Full Name")).toBeInvalid();
    expect(mockedUpdateUser).not.toHaveBeenCalled();
  });

  it("shows an update error and keeps the entered edits on the page", async () => {
    const user = userEvent.setup();
    mockedGetUserById.mockResolvedValue(existingUser);
    mockedUpdateUser.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderEditUser();

    await screen.findByRole("heading", { name: "Edit User" });
    await user.clear(screen.getByLabelText("Full Name"));
    await user.type(screen.getByLabelText("Full Name"), "Updated Name");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Failed to update user. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toHaveValue("Updated Name");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("disables save and cancel and shows progress while updating", async () => {
    const user = userEvent.setup();
    let resolveUpdate: (result: User) => void = () => {};
    const pendingUpdate = new Promise<User>((resolve) => {
      resolveUpdate = resolve;
    });
    mockedGetUserById.mockResolvedValue(existingUser);
    mockedUpdateUser.mockReturnValue(pendingUpdate);

    renderEditUser();

    await screen.findByRole("heading", { name: "Edit User" });
    const saveClick = user.click(
      screen.getByRole("button", { name: "Save Changes" }),
    );

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      resolveUpdate(existingUser);
      await pendingUpdate;
    });

    await saveClick;
    expect(await screen.findByText("Users list reached")).toBeInTheDocument();
  });

  it("navigates to the users list when cancelled", async () => {
    const user = userEvent.setup();
    mockedGetUserById.mockResolvedValue(existingUser);

    renderEditUser();

    await screen.findByRole("heading", { name: "Edit User" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Users list reached")).toBeInTheDocument();
    expect(mockedUpdateUser).not.toHaveBeenCalled();
  });
});
