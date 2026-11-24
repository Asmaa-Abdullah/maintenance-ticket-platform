import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTicketById,
  updateTicket,
  type UpdateTicketRequest,
} from "../services/ticketApi";
import type { Ticket } from "../types/ticket";
import EditTicket from "./EditTicket";

vi.mock("../services/ticketApi", () => ({
  getTicketById: vi.fn(),
  updateTicket: vi.fn(),
}));

const ticket: Ticket = {
  id: "ticket-42",
  ticketNumber: "MT-1042",
  technicianId: null,
  title: "Repair leaking pipe",
  description: "Pipe leak in kitchen",
  priority: "HIGH",
  status: "OPEN",
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

const mockedGetTicketById = vi.mocked(getTicketById);
const mockedUpdateTicket = vi.mocked(updateTicket);

function renderEditTicket(entry = "/tickets/ticket-42/edit") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/tickets/:id/edit" element={<EditTicket />} />
        <Route path="/tickets" element={<p>Tickets list reached</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditTicket page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading, fetches the ticket, and prefills the form", async () => {
    let resolveTicket: (result: Ticket) => void = () => {};
    const pendingTicket = new Promise<Ticket>((resolve) => {
      resolveTicket = resolve;
    });
    mockedGetTicketById.mockReturnValue(pendingTicket);

    renderEditTicket();

    expect(screen.getByText("Loading ticket...")).toBeInTheDocument();
    expect(mockedGetTicketById).toHaveBeenCalledWith("ticket-42");

    await act(async () => {
      resolveTicket(ticket);
      await pendingTicket;
    });

    expect(
      await screen.findByRole("heading", { name: "Edit Ticket" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("MT-1042")).toBeDisabled();
    expect(screen.getByLabelText("Title")).toHaveValue(ticket.title);
    expect(screen.getByLabelText("Description")).toHaveValue(
      ticket.description,
    );
    expect(screen.getByLabelText("Priority")).toHaveValue("HIGH");
  });

  it("reports an invalid missing ID without calling the API", async () => {
    render(
      <MemoryRouter>
        <EditTicket />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Invalid ticket ID.")).toBeInTheDocument();
    expect(mockedGetTicketById).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "← Back" })).toBeInTheDocument();
  });

  it("does not render the edit form for a ticket that is not OPEN", async () => {
    mockedGetTicketById.mockResolvedValue({
      ...ticket,
      status: "IN_PROGRESS",
    });

    renderEditTicket();

    expect(
      await screen.findByText("This ticket can no longer be edited."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Edit Ticket" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("shows a load error and allows navigating back to the list", async () => {
    const user = userEvent.setup();
    mockedGetTicketById.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderEditTicket();

    expect(
      await screen.findByText("Failed to load ticket. Please try again."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(await screen.findByText("Tickets list reached")).toBeInTheDocument();
  });

  it("saves the exact edited fields and navigates to the tickets list", async () => {
    const user = userEvent.setup();
    mockedGetTicketById.mockResolvedValue(ticket);
    mockedUpdateTicket.mockResolvedValue({
      ...ticket,
      title: "Replace kitchen pipe",
      description: "Replace leaking pipe under kitchen sink",
      priority: "MEDIUM",
    });

    renderEditTicket();

    await screen.findByRole("heading", { name: "Edit Ticket" });
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Replace kitchen pipe");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(
      screen.getByLabelText("Description"),
      "Replace leaking pipe under kitchen sink",
    );
    await user.selectOptions(screen.getByLabelText("Priority"), "MEDIUM");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const request: UpdateTicketRequest = {
      title: "Replace kitchen pipe",
      description: "Replace leaking pipe under kitchen sink",
      priority: "MEDIUM",
    };
    expect(mockedUpdateTicket).toHaveBeenCalledWith(ticket.id, request);
    expect(await screen.findByText("Tickets list reached")).toBeInTheDocument();
  });

  it("does not update when a required field is empty", async () => {
    const user = userEvent.setup();
    mockedGetTicketById.mockResolvedValue(ticket);

    renderEditTicket();

    await screen.findByRole("heading", { name: "Edit Ticket" });
    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Description")).toBeRequired();
    expect(screen.getByLabelText("Priority")).toBeRequired();

    await user.clear(screen.getByLabelText("Description"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByLabelText("Description")).toBeInvalid();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });

  it("shows an update error and keeps the edited values in the form", async () => {
    const user = userEvent.setup();
    mockedGetTicketById.mockResolvedValue(ticket);
    mockedUpdateTicket.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderEditTicket();

    await screen.findByRole("heading", { name: "Edit Ticket" });
    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Updated title");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Failed to update ticket. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Updated title");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("disables save and cancel and shows progress while the update is pending", async () => {
    const user = userEvent.setup();
    let resolveUpdate: (result: Ticket) => void = () => {};
    const pendingUpdate = new Promise<Ticket>((resolve) => {
      resolveUpdate = resolve;
    });
    mockedGetTicketById.mockResolvedValue(ticket);
    mockedUpdateTicket.mockReturnValue(pendingUpdate);

    renderEditTicket();

    await screen.findByRole("heading", { name: "Edit Ticket" });
    const saveClick = user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      resolveUpdate(ticket);
      await pendingUpdate;
    });

    await saveClick;
    expect(await screen.findByText("Tickets list reached")).toBeInTheDocument();
  });

  it("navigates to the tickets list when cancelled without updating", async () => {
    const user = userEvent.setup();
    mockedGetTicketById.mockResolvedValue(ticket);

    renderEditTicket();

    await screen.findByRole("heading", { name: "Edit Ticket" });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Tickets list reached")).toBeInTheDocument();
    expect(mockedUpdateTicket).not.toHaveBeenCalled();
  });
});
