import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createUser } from "../services/userApi";
import type { CreateUserRequest, User } from "../types/user";
import CreateUser from "./CreateUser";

vi.mock("../services/userApi", () => ({
  createUser: vi.fn(),
}));

const createdUser: User = {
  id: 21,
  employeeNumber: "EMP-2021",
  fullName: "Taylor Technician",
  username: "taylor.t",
  role: "TECHNICIAN",
  enabled: true,
};

const mockedCreateUser = vi.mocked(createUser);

function renderCreateUser() {
  return render(
    <MemoryRouter>
      <CreateUser />
    </MemoryRouter>,
  );
}

async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  values = {
    employeeNumber: "EMP-2021",
    fullName: "Taylor Technician",
    username: "taylor.t",
    password: "secure-password",
    role: "TECHNICIAN",
  },
) {
  await user.type(
    screen.getByLabelText("Employee Number"),
    values.employeeNumber,
  );
  await user.type(screen.getByLabelText("Full Name"), values.fullName);
  await user.type(screen.getByLabelText("Username"), values.username);
  await user.type(screen.getByLabelText("Password"), values.password);
  await user.selectOptions(screen.getByLabelText("User Role"), values.role);
  return values;
}

describe("CreateUser page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders required fields and all supported user roles", () => {
    renderCreateUser();

    expect(screen.getByLabelText("Employee Number")).toBeRequired();
    expect(screen.getByLabelText("Full Name")).toBeRequired();
    expect(screen.getByLabelText("Username")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(screen.getByLabelText("User Role")).toBeRequired();

    expect(
      within(screen.getByLabelText("User Role")).getByRole("option", {
        name: "Admin",
      }),
    ).toHaveValue("ADMIN");
    expect(
      within(screen.getByLabelText("User Role")).getByRole("option", {
        name: "Inspector",
      }),
    ).toHaveValue("INSPECTOR");
    expect(
      within(screen.getByLabelText("User Role")).getByRole("option", {
        name: "Technician",
      }),
    ).toHaveValue("TECHNICIAN");
  });

  it("does not open confirmation or call the API when required values are missing", async () => {
    const user = userEvent.setup();
    renderCreateUser();

    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      screen.queryByRole("heading", { name: "Confirm User Creation" }),
    ).not.toBeInTheDocument();
    expect(mockedCreateUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Employee Number")).toBeInvalid();
  });

  it("confirms and creates a valid user, displays the result, and resets the form", async () => {
    const user = userEvent.setup();
    mockedCreateUser.mockResolvedValue(createdUser);
    renderCreateUser();

    const values = await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(
      screen.getByRole("heading", { name: "Confirm User Creation" }),
    ).toBeInTheDocument();
    expect(mockedCreateUser).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save User" }));

    const expectedRequest: CreateUserRequest = {
      employeeNumber: values.employeeNumber,
      fullName: values.fullName,
      username: values.username,
      password: values.password,
      role: "TECHNICIAN",
    };
    expect(mockedCreateUser).toHaveBeenCalledWith(expectedRequest);
    expect(
      await screen.findByRole("heading", { name: "Created Users" }),
    ).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /EMP-2021/ });
    expect(within(row).getByText("Taylor Technician")).toBeInTheDocument();
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(screen.getByLabelText("Employee Number")).toHaveValue("");
    expect(screen.getByLabelText("Full Name")).toHaveValue("");
    expect(screen.getByLabelText("Username")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("User Role")).toHaveValue("");
    expect(
      screen.queryByRole("heading", { name: "Confirm User Creation" }),
    ).not.toBeInTheDocument();
  });

  it("cancels confirmation without submitting or clearing entered values", async () => {
    const user = userEvent.setup();
    renderCreateUser();

    const values = await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockedCreateUser).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Confirm User Creation" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Employee Number")).toHaveValue(
      values.employeeNumber,
    );
    expect(screen.getByLabelText("Full Name")).toHaveValue(values.fullName);
    expect(screen.getByLabelText("Username")).toHaveValue(values.username);
    expect(screen.getByLabelText("Password")).toHaveValue(values.password);
    expect(screen.getByLabelText("User Role")).toHaveValue(values.role);
  });

  it("shows a create error and preserves the form when the API fails", async () => {
    const user = userEvent.setup();
    mockedCreateUser.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderCreateUser();

    const values = await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));
    await user.click(screen.getByRole("button", { name: "Save User" }));

    expect(
      await screen.findByText("Failed to create user. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Confirm User Creation" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Employee Number")).toHaveValue(
      values.employeeNumber,
    );
    expect(screen.getByLabelText("Full Name")).toHaveValue(values.fullName);
    expect(screen.getByLabelText("Username")).toHaveValue(values.username);
    expect(screen.getByLabelText("Password")).toHaveValue(values.password);
    expect(screen.getByLabelText("User Role")).toHaveValue(values.role);
  });

  it("disables confirmation actions and shows progress while creation is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: (result: User) => void = () => {};
    const pendingCreate = new Promise<User>((resolve) => {
      resolveCreate = resolve;
    });
    mockedCreateUser.mockReturnValue(pendingCreate);
    renderCreateUser();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));
    const saveClick = user.click(
      screen.getByRole("button", { name: "Save User" }),
    );

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      resolveCreate(createdUser);
      await pendingCreate;
    });

    await saveClick;
    expect(
      await screen.findByRole("heading", { name: "Created Users" }),
    ).toBeInTheDocument();
  });

  it("clears all fields when Clear Form is clicked", async () => {
    const user = userEvent.setup();
    renderCreateUser();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Clear Form" }));

    expect(screen.getByLabelText("Employee Number")).toHaveValue("");
    expect(screen.getByLabelText("Full Name")).toHaveValue("");
    expect(screen.getByLabelText("Username")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByLabelText("User Role")).toHaveValue("");
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("navigates back to the users list", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/users/create"]}>
        <Routes>
          <Route path="/users/create" element={<CreateUser />} />
          <Route path="/users" element={<p>Users list reached</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Back to Users/ }));
    expect(await screen.findByText("Users list reached")).toBeInTheDocument();
  });
});
