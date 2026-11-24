import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { Ticket } from "../types/ticket";
import { deleteTicket, getTickets } from "../services/ticketApi";
import Tickets from "./Tickets";

vi.mock("../services/ticketApi", () => ({
  getTickets: vi.fn(),
  deleteTicket: vi.fn(),
}));

const mockedGetTickets = vi.mocked(getTickets);

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

function renderTickets() {
  return render(
    <MemoryRouter>
      <Tickets />
    </MemoryRouter>,
  );
}

describe("Tickets page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading while tickets are pending, then renders the returned ticket", async () => {
    let resolveTickets: (tickets: Ticket[]) => void = () => {};
    const pendingTickets = new Promise<Ticket[]>((resolve) => {
      resolveTickets = resolve;
    });

    mockedGetTickets.mockReturnValue(pendingTickets);

    renderTickets();

    expect(
      screen.getByRole("cell", { name: "Loading tickets..." }),
    ).toBeInTheDocument();

    await act(async () => {
      resolveTickets([ticket]);
      await pendingTickets;
    });

    expect(
      await screen.findByRole("cell", { name: "MT-1001" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "Repair leaking pipe" }),
    ).toBeInTheDocument();
  });

  it("shows the empty state when no tickets are returned", async () => {
    mockedGetTickets.mockResolvedValue([]);

    renderTickets();

    expect(await screen.findByText("No tickets found.")).toBeInTheDocument();
  });

  it("shows an error when loading tickets fails", async () => {
    mockedGetTickets.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderTickets();

    expect(
      await screen.findByText("Failed to load tickets. Please try again."),
    ).toBeInTheDocument();
  });

  it("filters tickets by title without case sensitivity", async () => {
    const user = userEvent.setup();
    const tickets: Ticket[] = [
      {
        ...ticket,
        id: "ticket-match",
        ticketNumber: "MT-1001",
        title: "Repair leaking pipe",
      },
      {
        ...ticket,
        id: "ticket-other",
        ticketNumber: "MT-1002",
        title: "Replace hallway light",
      },
      {
        ...ticket,
        id: "ticket-electrical",
        ticketNumber: "MT-1003",
        title: "Inspect electrical panel",
      },
    ];

    mockedGetTickets.mockResolvedValue(tickets);

    renderTickets();

    const searchInput = await screen.findByPlaceholderText("Search tickets...");
    await user.type(searchInput, "REPAIR LEAKING");

    expect(await screen.findByText("Repair leaking pipe")).toBeInTheDocument();
    expect(screen.queryByText("Replace hallway light")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Inspect electrical panel"),
    ).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, "MT-1003");

    expect(
      screen.queryByText("Inspect electrical panel"),
    ).not.toBeInTheDocument();
  });

  it("enables Edit and Delete only for OPEN tickets", async () => {
    const tickets: Ticket[] = [
      {
        ...ticket,
        id: "ticket-open",
        ticketNumber: "MT-1001",
        title: "Open ticket",
        status: "OPEN",
      },
      {
        ...ticket,
        id: "ticket-in-progress",
        ticketNumber: "MT-1002",
        title: "Ticket in progress",
        status: "IN_PROGRESS",
      },
      {
        ...ticket,
        id: "ticket-completed",
        ticketNumber: "MT-1003",
        title: "Completed ticket",
        status: "COMPLETED",
      },
    ];

    mockedGetTickets.mockResolvedValue(tickets);

    renderTickets();

    const openRow = await screen.findByRole("row", { name: /MT-1001/ });
    const inProgressRow = await screen.findByRole("row", { name: /MT-1002/ });
    const completedRow = await screen.findByRole("row", { name: /MT-1003/ });

    expect(within(openRow).getByRole("button", { name: "Edit" })).toBeEnabled();
    expect(
      within(openRow).getByRole("button", { name: "Delete" }),
    ).toBeEnabled();

    expect(
      within(inProgressRow).getByRole("button", { name: "Edit" }),
    ).toBeDisabled();
    expect(
      within(inProgressRow).getByRole("button", { name: "Delete" }),
    ).toBeDisabled();

    expect(
      within(completedRow).getByRole("button", { name: "Edit" }),
    ).toBeDisabled();
    expect(
      within(completedRow).getByRole("button", { name: "Delete" }),
    ).toBeDisabled();
  });

  it("navigates to the edit route when Edit is clicked", async () => {
    const user = userEvent.setup();

    mockedGetTickets.mockResolvedValue([
      {
        ...ticket,
        id: "ticket-edit",
        ticketNumber: "MT-1001",
        status: "OPEN",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/tickets"]}>
        <Routes>
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/:id/edit" element={<p>Edit route reached</p>} />
        </Routes>
      </MemoryRouter>,
    );

    const row = await screen.findByRole("row", { name: /MT-1001/ });
    await user.click(within(row).getByRole("button", { name: "Edit" }));

    expect(await screen.findByText("Edit route reached")).toBeInTheDocument();
  });

  it("keeps the ticket when deletion is cancelled", async () => {
    const user = userEvent.setup();
    const openTicket: Ticket = {
      ...ticket,
      id: "ticket-cancel-delete",
      ticketNumber: "MT-2001",
      status: "OPEN",
    };

    mockedGetTickets.mockResolvedValue([openTicket]);

    renderTickets();

    const row = await screen.findByRole("row", { name: /MT-2001/ });
    await user.click(within(row).getByRole("button", { name: "Delete" }));

    expect(
      screen.getByRole("heading", { name: "Confirm Ticket Deletion" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("heading", { name: "Confirm Ticket Deletion" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("row", { name: /MT-2001/ })).toBeInTheDocument();
    expect(deleteTicket).not.toHaveBeenCalled();
  });

  it("deletes a ticket after confirmation", async () => {
    const user = userEvent.setup();
    const openTicket: Ticket = {
      ...ticket,
      id: "ticket-confirm-delete",
      ticketNumber: "MT-2002",
      status: "OPEN",
    };

    mockedGetTickets.mockResolvedValue([openTicket]);
    vi.mocked(deleteTicket).mockResolvedValue(undefined);

    renderTickets();

    const row = await screen.findByRole("row", { name: /MT-2002/ });
    await user.click(within(row).getByRole("button", { name: "Delete" }));

    expect(
      screen.getByRole("heading", { name: "Confirm Ticket Deletion" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Ticket" }));

    expect(deleteTicket).toHaveBeenCalledWith(openTicket.id);
    expect(await screen.findByText("No tickets found.")).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /MT-2002/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Confirm Ticket Deletion" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the ticket and confirmation modal open when deletion fails", async () => {
    const user = userEvent.setup();
    const openTicket: Ticket = {
      ...ticket,
      id: "ticket-delete-error",
      ticketNumber: "MT-2003",
      status: "OPEN",
    };

    mockedGetTickets.mockResolvedValue([openTicket]);
    vi.mocked(deleteTicket).mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderTickets();

    const row = await screen.findByRole("row", { name: /MT-2003/ });
    await user.click(within(row).getByRole("button", { name: "Delete" }));

    await user.click(screen.getByRole("button", { name: "Delete Ticket" }));

    expect(
      await screen.findByText("Failed to delete ticket. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /MT-2003/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Confirm Ticket Deletion" }),
    ).toBeInTheDocument();
  });

  it("navigates to the create ticket page", async () => {
    const user = userEvent.setup();

    mockedGetTickets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/tickets"]}>
        <Routes>
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/create-ticket" element={<p>Create route reached</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Create Ticket/ }));

    expect(await screen.findByText("Create route reached")).toBeInTheDocument();
  });

  it("navigates to the dashboard when Back to Dashboard is clicked", async () => {
    const user = userEvent.setup();

    mockedGetTickets.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/tickets"]}>
        <Routes>
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/dashboard" element={<p>Dashboard route reached</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Back to Dashboard/ }));

    expect(
      await screen.findByText("Dashboard route reached"),
    ).toBeInTheDocument();
  });
});
