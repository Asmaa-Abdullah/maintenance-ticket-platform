import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../auth/services/authApi";
import { getTickets } from "../../tickets/services/ticketApi";
import type { Ticket } from "../../tickets/types/ticket";
import { getAllUsers } from "../../users/services/userApi";
import type { User } from "../../users/types/user";
import { assignTicket } from "../services/assignmentApi";
import Assignments from "./Assignments";

vi.mock("../../auth/services/authApi", () => ({
  getMe: vi.fn(),
}));

vi.mock("../../tickets/services/ticketApi", () => ({
  getTickets: vi.fn(),
}));

vi.mock("../../users/services/userApi", () => ({
  getAllUsers: vi.fn(),
}));

vi.mock("../services/assignmentApi", () => ({
  assignTicket: vi.fn(),
}));

const ticket: Ticket = {
  id: "ticket-1",
  ticketNumber: "MT-1001",
  technicianId: null,
  title: "Repair leaking pipe",
  description: "Pipe leak in kitchen",
  priority: "HIGH",
  status: "OPEN",
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

const tickets: Ticket[] = [
  ticket,
  {
    ...ticket,
    id: "ticket-2",
    ticketNumber: "MT-1002",
    title: "Replace hallway light",
    priority: "MEDIUM",
  },
];

const users: User[] = [
  {
    id: 11,
    employeeNumber: "EMP-11",
    fullName: "Active Technician",
    username: "active",
    role: "TECHNICIAN",
    enabled: true,
  },
  {
    id: 12,
    employeeNumber: "EMP-12",
    fullName: "Disabled Technician",
    username: "disabled",
    role: "TECHNICIAN",
    enabled: false,
  },
  {
    id: 13,
    employeeNumber: "EMP-13",
    fullName: "Active Inspector",
    username: "inspector",
    role: "INSPECTOR",
    enabled: true,
  },
];

const mockedGetMe = vi.mocked(getMe);
const mockedGetTickets = vi.mocked(getTickets);
const mockedGetAllUsers = vi.mocked(getAllUsers);
const mockedAssignTicket = vi.mocked(assignTicket);

function renderAssignments() {
  return render(
    <MemoryRouter>
      <Assignments />
    </MemoryRouter>,
  );
}

describe("Assignments page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading before initial requests resolve and then renders tickets", async () => {
    let resolveCurrentUser: (user: {
      username: string;
      role: string;
    }) => void = () => {};
    const currentUserPromise = new Promise<{
      username: string;
      role: string;
    }>((resolve) => {
      resolveCurrentUser = resolve;
    });

    mockedGetMe.mockReturnValue(currentUserPromise);
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedGetAllUsers.mockResolvedValue(users);
    renderAssignments();

    expect(
      screen.getByRole("cell", { name: "Loading tickets..." }),
    ).toBeInTheDocument();

    await act(async () => {
      resolveCurrentUser({ username: "admin", role: "ADMIN" });
      await currentUserPromise;
    });

    expect(await screen.findByRole("cell", { name: "MT-1001" })).toBeVisible();
    expect(screen.getByText("Repair leaking pipe")).toBeInTheDocument();
    expect(screen.getByText("Mar 1, 2026")).toBeInTheDocument();
    expect(mockedGetTickets).toHaveBeenCalledTimes(1);
    expect(mockedGetAllUsers).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when no tickets are returned", async () => {
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockResolvedValue([]);

    renderAssignments();

    expect(
      await screen.findByText("No open tickets found."),
    ).toBeInTheDocument();
    expect(mockedGetAllUsers).not.toHaveBeenCalled();
  });

  it("shows an error when loading tickets fails", async () => {
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignments();

    expect(
      await screen.findByText("Failed to load assignments. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows an error when loading admin technician data fails", async () => {
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedGetAllUsers.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignments();

    expect(
      await screen.findByText("Failed to load assignments. Please try again."),
    ).toBeInTheDocument();
  });

  it("lets admins assign only enabled technicians to a selected ticket", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedGetAllUsers.mockResolvedValue(users);
    mockedAssignTicket.mockResolvedValue({
      ticketId: ticket.id,
      technicianId: 11,
      assignedAt: "2026-03-02T10:00:00Z",
    });

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign" }));

    const technicianSelect = screen.getByLabelText("Technician");
    expect(technicianSelect).toBeEnabled();
    expect(
      within(technicianSelect).getByRole("option", {
        name: "Active Technician",
      }),
    ).toHaveValue("11");
    expect(
      within(technicianSelect).queryByRole("option", {
        name: "Disabled Technician",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(technicianSelect).queryByRole("option", {
        name: "Active Inspector",
      }),
    ).not.toBeInTheDocument();

    await user.selectOptions(technicianSelect, "11");
    await user.click(
      screen.getByRole("button", { name: "Confirm Assignment" }),
    );

    expect(mockedAssignTicket).toHaveBeenCalledWith({
      ticketId: ticket.id,
      technicianId: 11,
    });
    expect(
      await screen.findByText("No open tickets found."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Assign Ticket" }),
    ).not.toBeInTheDocument();
  });

  it("validates an unselected technician and supports cancelling the modal", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedGetAllUsers.mockResolvedValue(users);

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign" }));
    await user.click(
      screen.getByRole("button", { name: "Confirm Assignment" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please select a technician.",
    );
    expect(mockedAssignTicket).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("heading", { name: "Assign Ticket" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /MT-1001/ })).toBeInTheDocument();
  });

  it("reports when admins have no active technicians and disables the selector", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedGetAllUsers.mockResolvedValue([{ ...users[1] }, { ...users[2] }]);

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign" }));

    expect(
      screen.getByText("No active technicians available."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Technician")).toBeDisabled();
  });

  it("keeps the ticket and modal open and shows an alert when assignment fails", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedGetAllUsers.mockResolvedValue(users);
    mockedAssignTicket.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign" }));
    await user.selectOptions(screen.getByLabelText("Technician"), "11");
    await user.click(
      screen.getByRole("button", { name: "Confirm Assignment" }),
    );

    expect(
      await screen.findByText("Failed to assign ticket. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /MT-1001/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Assign Ticket" }),
    ).toBeInTheDocument();
  });

  it("lets a technician assign a ticket to themselves and removes it on success", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedAssignTicket.mockResolvedValue({
      ticketId: ticket.id,
      technicianId: 20,
      assignedAt: "2026-03-02T10:00:00Z",
    });

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign to Me" }));

    expect(mockedAssignTicket).toHaveBeenCalledWith({ ticketId: ticket.id });
    expect(
      await screen.findByText("No open tickets found."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Assign Ticket" }),
    ).not.toBeInTheDocument();
  });

  it("shows an alert and preserves the ticket when self-assignment fails", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedAssignTicket.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign to Me" }));

    expect(
      await screen.findByText("Failed to assign ticket. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /MT-1001/ })).toBeInTheDocument();
  });

  it("filters by trimmed, case-insensitive ticket title and number", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockResolvedValue(tickets);

    renderAssignments();

    const search = await screen.findByPlaceholderText("Search tickets...");
    await user.type(search, "  REPAIR LEAKING  ");

    expect(screen.getByRole("row", { name: /MT-1001/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /MT-1002/ }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "  mt-1002 ");

    expect(screen.getByRole("row", { name: /MT-1002/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /MT-1001/ }),
    ).not.toBeInTheDocument();
  });

  it("disables admin modal actions and shows progress while assignment is pending", async () => {
    const user = userEvent.setup();
    let resolveAssignment: (value: {
      ticketId: string;
      technicianId: number;
      assignedAt: string;
    }) => void = () => {};
    const pendingAssignment = new Promise<{
      ticketId: string;
      technicianId: number;
      assignedAt: string;
    }>((resolve) => {
      resolveAssignment = resolve;
    });
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetTickets.mockResolvedValue([ticket]);
    mockedGetAllUsers.mockResolvedValue(users);
    mockedAssignTicket.mockReturnValue(pendingAssignment);

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign" }));
    await user.selectOptions(screen.getByLabelText("Technician"), "11");
    const confirmClick = user.click(
      screen.getByRole("button", { name: "Confirm Assignment" }),
    );

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      resolveAssignment({
        ticketId: ticket.id,
        technicianId: 11,
        assignedAt: "2026-03-02T10:00:00Z",
      });
      await pendingAssignment;
    });

    await confirmClick;
    expect(
      await screen.findByText("No open tickets found."),
    ).toBeInTheDocument();
  });

  it("shows an empty result message when the search does not match", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockResolvedValue([ticket]);

    renderAssignments();

    await user.type(
      await screen.findByPlaceholderText("Search tickets..."),
      "not found",
    );

    expect(
      await screen.findByText("No open tickets found."),
    ).toBeInTheDocument();
  });

  it("disables assignment actions and shows progress while a request is pending", async () => {
    const user = userEvent.setup();
    let resolveAssignment: (value: {
      ticketId: string;
      technicianId: number;
      assignedAt: string;
    }) => void = () => {};
    const pendingAssignment = new Promise<{
      ticketId: string;
      technicianId: number;
      assignedAt: string;
    }>((resolve) => {
      resolveAssignment = resolve;
    });

    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockResolvedValue(tickets);
    mockedAssignTicket.mockReturnValue(pendingAssignment);

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Assign to Me" }));

    expect(
      within(row).getByRole("button", { name: "Assigning..." }),
    ).toBeDisabled();
    expect(
      within(screen.getByRole("row", { name: /MT-1002/ })).getByRole("button", {
        name: "Assign to Me",
      }),
    ).toBeDisabled();

    await act(async () => {
      resolveAssignment({
        ticketId: ticket.id,
        technicianId: 20,
        assignedAt: "2026-03-02T10:00:00Z",
      });
      await pendingAssignment;
    });

    expect(
      screen.queryByRole("row", { name: /MT-1001/ }),
    ).not.toBeInTheDocument();
  });

  it("renders invalid creation dates as a dash", async () => {
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetTickets.mockResolvedValue([{ ...ticket, createdAt: "invalid" }]);

    renderAssignments();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    expect(within(row).getByRole("cell", { name: "—" })).toBeInTheDocument();
  });
});
