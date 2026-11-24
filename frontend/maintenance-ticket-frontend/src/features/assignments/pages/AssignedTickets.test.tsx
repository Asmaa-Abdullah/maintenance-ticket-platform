import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "../../auth/services/authApi";
import {
  getAssignedTickets,
  updateTicketStatus,
} from "../../tickets/services/ticketApi";
import type { Ticket } from "../../tickets/types/ticket";
import { getTechnicians } from "../../users/services/userApi";
import type { Technician } from "../../users/services/userApi";
import { assignTicket } from "../services/assignmentApi";
import AssignedTickets from "./AssignedTickets";

vi.mock("../../auth/services/authApi", () => ({
  getMe: vi.fn(),
}));

vi.mock("../../tickets/services/ticketApi", () => ({
  getAssignedTickets: vi.fn(),
  updateTicketStatus: vi.fn(),
}));

vi.mock("../../users/services/userApi", () => ({
  getTechnicians: vi.fn(),
}));

vi.mock("../services/assignmentApi", () => ({
  assignTicket: vi.fn(),
}));

const ticket: Ticket = {
  id: "ticket-1",
  ticketNumber: "MT-1001",
  technicianId: "11",
  title: "Repair leaking pipe",
  description: "Pipe leak in kitchen",
  priority: "HIGH",
  status: "ASSIGNED",
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

const technicians: Technician[] = [
  { id: 11, fullName: "Alex Technician" },
  { id: 12, fullName: "Sam Technician" },
];

const mockedGetMe = vi.mocked(getMe);
const mockedGetAssignedTickets = vi.mocked(getAssignedTickets);
const mockedUpdateTicketStatus = vi.mocked(updateTicketStatus);
const mockedGetTechnicians = vi.mocked(getTechnicians);
const mockedAssignTicket = vi.mocked(assignTicket);

function renderAssignedTickets() {
  return render(
    <MemoryRouter>
      <AssignedTickets />
    </MemoryRouter>,
  );
}

function optionValues(select: HTMLElement) {
  return Array.from(select.querySelectorAll("option")).map(
    (option) => (option as HTMLOptionElement).value,
  );
}

describe("AssignedTickets page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading before initial requests resolve and then renders assigned tickets", async () => {
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
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    renderAssignedTickets();

    expect(
      screen.getByRole("cell", { name: "Loading assigned tickets..." }),
    ).toBeInTheDocument();

    await act(async () => {
      resolveCurrentUser({ username: "tech", role: "TECHNICIAN" });
      await currentUserPromise;
    });

    expect(await screen.findByRole("row", { name: /MT-1001/ })).toBeVisible();
    expect(screen.getByText("Repair leaking pipe")).toBeInTheDocument();
    expect(screen.getByText("Alex Technician")).toBeInTheDocument();
    expect(mockedGetMe).toHaveBeenCalledTimes(1);
    expect(mockedGetAssignedTickets).toHaveBeenCalledTimes(1);
    expect(mockedGetTechnicians).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when no assigned tickets are returned", async () => {
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([]);
    mockedGetTechnicians.mockResolvedValue([]);

    renderAssignedTickets();

    expect(
      await screen.findByText("No assigned tickets found."),
    ).toBeInTheDocument();
  });

  it("shows an error when any initial API request fails", async () => {
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockRejectedValue(new Error("Request failed"));
    mockedGetTechnicians.mockResolvedValue([]);
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignedTickets();

    expect(
      await screen.findByText(
        "Failed to load assigned tickets. Please try again.",
      ),
    ).toBeInTheDocument();
  });

  it("gives admins all supported status options and a reassignment action", async () => {
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    expect(optionValues(within(row).getByRole("combobox"))).toEqual([
      "OPEN",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
    ]);
    expect(within(row).getByRole("button", { name: "Reassign" })).toBeEnabled();
  });

  it("limits technician status options according to each ticket's current status", async () => {
    const inProgressTicket: Ticket = {
      ...ticket,
      id: "ticket-2",
      ticketNumber: "MT-1002",
      status: "IN_PROGRESS",
    };
    const resolvedTicket: Ticket = {
      ...ticket,
      id: "ticket-3",
      ticketNumber: "MT-1003",
      status: "RESOLVED",
    };
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([
      ticket,
      inProgressTicket,
      resolvedTicket,
    ]);
    mockedGetTechnicians.mockResolvedValue(technicians);

    renderAssignedTickets();

    const assignedRow = await screen.findByRole("row", { name: /MT-1001/ });
    const inProgressRow = screen.getByRole("row", { name: /MT-1002/ });
    const resolvedRow = screen.getByRole("row", { name: /MT-1003/ });

    expect(optionValues(within(assignedRow).getByRole("combobox"))).toEqual([
      "ASSIGNED",
      "IN_PROGRESS",
      "OPEN",
    ]);
    expect(optionValues(within(inProgressRow).getByRole("combobox"))).toEqual([
      "IN_PROGRESS",
      "RESOLVED",
    ]);
    expect(optionValues(within(resolvedRow).getByRole("combobox"))).toEqual([
      "RESOLVED",
    ]);
    expect(
      within(assignedRow).queryByRole("button", { name: "Reassign" }),
    ).not.toBeInTheDocument();
    expect(within(assignedRow).getByText("-")).toBeInTheDocument();
  });

  it("shows status as text for roles that cannot change it", async () => {
    mockedGetMe.mockResolvedValue({ username: "inspector", role: "INSPECTOR" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    expect(within(row).queryByRole("combobox")).not.toBeInTheDocument();
    expect(within(row).getByText("ASSIGNED")).toBeInTheDocument();
  });

  it("updates the ticket after a successful status change", async () => {
    const user = userEvent.setup();
    const updatedTicket = { ...ticket, status: "IN_PROGRESS" };
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedUpdateTicketStatus.mockResolvedValue(updatedTicket);

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.selectOptions(within(row).getByRole("combobox"), "IN_PROGRESS");

    expect(mockedUpdateTicketStatus).toHaveBeenCalledWith(ticket.id, {
      status: "IN_PROGRESS",
    });
    await waitFor(() =>
      expect(within(row).getByRole("combobox")).toHaveValue("IN_PROGRESS"),
    );
  });

  it("removes a ticket from the assigned list when it is returned to OPEN", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedUpdateTicketStatus.mockResolvedValue({ ...ticket, status: "OPEN" });

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.selectOptions(within(row).getByRole("combobox"), "OPEN");

    expect(mockedUpdateTicketStatus).toHaveBeenCalledWith(ticket.id, {
      status: "OPEN",
    });
    expect(
      await screen.findByText("No assigned tickets found."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /MT-1001/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the specific authorization alert and preserves status for Axios 403 errors", async () => {
    const user = userEvent.setup();
    const forbiddenError = Object.assign(new Error("Forbidden"), {
      isAxiosError: true,
      response: { status: 403 },
    });
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedUpdateTicketStatus.mockRejectedValue(forbiddenError);
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.selectOptions(within(row).getByRole("combobox"), "IN_PROGRESS");

    expect(
      await screen.findByText(
        "You are not authorized to update this ticket. You can only update tickets assigned to you.",
      ),
    ).toBeInTheDocument();
    expect(within(row).getByRole("combobox")).toHaveValue("ASSIGNED");
  });

  it("shows a generic status alert and preserves status for non-403 failures", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedUpdateTicketStatus.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.selectOptions(within(row).getByRole("combobox"), "IN_PROGRESS");

    expect(
      await screen.findByText(
        "Failed to update ticket status. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(within(row).getByRole("combobox")).toHaveValue("ASSIGNED");
  });

  it("opens an admin reassign modal with the current technician selected and updates the row", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedAssignTicket.mockResolvedValue({
      ticketId: ticket.id,
      technicianId: 12,
      assignedAt: "2026-03-03T10:00:00Z",
    });

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Reassign" }));

    const technicianSelect = screen.getByLabelText("Technician");
    expect(technicianSelect).toHaveValue("11");
    await user.selectOptions(technicianSelect, "12");
    await user.click(
      screen.getByRole("button", { name: "Confirm Reassignment" }),
    );

    expect(mockedAssignTicket).toHaveBeenCalledWith({
      ticketId: ticket.id,
      technicianId: 12,
    });
    expect(await within(row).findByText("Sam Technician")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Reassign Ticket" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the existing technician and modal open when reassignment fails", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedAssignTicket.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Reassign" }));
    await user.selectOptions(screen.getByLabelText("Technician"), "12");
    await user.click(
      screen.getByRole("button", { name: "Confirm Reassignment" }),
    );

    expect(
      await screen.findByText("Failed to reassign ticket. Please try again."),
    ).toBeInTheDocument();
    expect(within(row).getByText("Alex Technician")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reassign Ticket" }),
    ).toBeInTheDocument();
  });

  it("validates a missing reassignment selection and allows cancelling", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Reassign" }));
    await user.selectOptions(screen.getByLabelText("Technician"), "");
    await user.click(
      screen.getByRole("button", { name: "Confirm Reassignment" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please select a technician.",
    );
    expect(mockedAssignTicket).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("heading", { name: "Reassign Ticket" }),
    ).not.toBeInTheDocument();
  });

  it("shows a warning when no technicians are available for reassignment", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue([]);

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Reassign" }));

    expect(
      screen.getByText("No active technicians available."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Technician")).toBeEnabled();
  });

  it("filters by trimmed, case-insensitive ticket number, title, and status", async () => {
    const user = userEvent.setup({ delay: 0 });
    const searchTickets: Ticket[] = [
      ticket,
      {
        ...ticket,
        id: "ticket-2",
        ticketNumber: "MT-1002",
        title: "Replace hallway light",
        status: "IN_PROGRESS",
      },
      {
        ...ticket,
        id: "ticket-3",
        ticketNumber: "MT-1003",
        title: "Inspect roof",
        status: "RESOLVED",
      },
    ];
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue(searchTickets);
    mockedGetTechnicians.mockResolvedValue(technicians);

    renderAssignedTickets();

    const search = await screen.findByPlaceholderText(
      "Search assigned tickets...",
    );

    await user.type(search, "  mt-1002 ");
    expect(screen.getByRole("row", { name: /MT-1002/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /MT-1001/ }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "  REPLACE HALLWAY ");
    expect(screen.getByRole("row", { name: /MT-1002/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /MT-1003/ }),
    ).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "  resolved ");
    expect(screen.getByRole("row", { name: /MT-1003/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /MT-1001/ }),
    ).not.toBeInTheDocument();
  }, 15000);

  it("shows the empty state for unmatched searches", async () => {
    const user = userEvent.setup();
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);

    renderAssignedTickets();

    await user.type(
      await screen.findByPlaceholderText("Search assigned tickets..."),
      "does not exist",
    );

    expect(
      await screen.findByText("No assigned tickets found."),
    ).toBeInTheDocument();
  });

  it("falls back to the technician ID or Unassigned when a name is unavailable", async () => {
    mockedGetMe.mockResolvedValue({ username: "admin", role: "ADMIN" });
    mockedGetAssignedTickets.mockResolvedValue([
      { ...ticket, technicianId: "999" },
      {
        ...ticket,
        id: "ticket-unassigned",
        ticketNumber: "MT-1002",
        technicianId: null,
      },
    ]);
    mockedGetTechnicians.mockResolvedValue(technicians);

    renderAssignedTickets();

    const unknownRow = await screen.findByRole("row", { name: /MT-1001/ });
    const unassignedRow = screen.getByRole("row", { name: /MT-1002/ });
    expect(within(unknownRow).getByText("ID: 999")).toBeInTheDocument();
    expect(within(unassignedRow).getByText("Unassigned")).toBeInTheDocument();
  });

  it("disables all status controls while a status update is pending", async () => {
    const user = userEvent.setup();
    let resolveUpdate: (updatedTicket: Ticket) => void = () => {};
    const pendingUpdate = new Promise<Ticket>((resolve) => {
      resolveUpdate = resolve;
    });
    mockedGetMe.mockResolvedValue({ username: "tech", role: "TECHNICIAN" });
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedUpdateTicketStatus.mockReturnValue(pendingUpdate);

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    const select = within(row).getByRole("combobox");
    await user.selectOptions(select, "IN_PROGRESS");

    expect(select).toBeDisabled();
    await act(async () => {
      resolveUpdate({ ...ticket, status: "IN_PROGRESS" });
      await pendingUpdate;
    });
    await waitFor(() => expect(select).toBeEnabled());
    expect(select).toHaveValue("IN_PROGRESS");
  });

  it("disables modal actions and shows progress while reassignment is pending", async () => {
    const user = userEvent.setup();
    let resolveAssignment: (response: {
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
    mockedGetAssignedTickets.mockResolvedValue([ticket]);
    mockedGetTechnicians.mockResolvedValue(technicians);
    mockedAssignTicket.mockReturnValue(pendingAssignment);

    renderAssignedTickets();

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Reassign" }));
    await user.selectOptions(screen.getByLabelText("Technician"), "12");
    const confirmClick = user.click(
      screen.getByRole("button", { name: "Confirm Reassignment" }),
    );

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      resolveAssignment({
        ticketId: ticket.id,
        technicianId: 12,
        assignedAt: "2026-03-03T10:00:00Z",
      });
      await pendingAssignment;
    });

    await confirmClick;
    expect(await within(row).findByText("Sam Technician")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Reassign Ticket" }),
    ).not.toBeInTheDocument();
  });
});
