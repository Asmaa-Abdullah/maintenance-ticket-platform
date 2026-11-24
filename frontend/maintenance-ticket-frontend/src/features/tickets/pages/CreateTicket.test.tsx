import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTicket, type CreateTicketRequest } from "../services/ticketApi";
import type { Ticket } from "../types/ticket";
import CreateTicket from "./CreateTicket";

vi.mock("../services/ticketApi", () => ({
  createTicket: vi.fn(),
}));

const createdTicket: Ticket = {
  id: "ticket-created",
  ticketNumber: "MT-3001",
  technicianId: null,
  title: "Repair leaking pipe",
  description: "Pipe leak in kitchen",
  priority: "HIGH",
  status: "OPEN",
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

const mockedCreateTicket = vi.mocked(createTicket);

function renderCreateTicket() {
  return render(
    <MemoryRouter initialEntries={["/create-ticket"]}>
      <Routes>
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/tickets" element={<p>Tickets list reached</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>,
  request = {
    title: "Repair leaking pipe",
    description: "Pipe leak in kitchen",
    priority: "HIGH",
  },
) {
  await user.type(screen.getByLabelText("Title"), request.title);
  await user.type(screen.getByLabelText("Description"), request.description);
  await user.selectOptions(screen.getByLabelText("Priority"), request.priority);
  return request;
}

describe("CreateTicket page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders required fields and does not open confirmation for incomplete input", async () => {
    const user = userEvent.setup();
    renderCreateTicket();

    expect(screen.getByLabelText("Title")).toBeRequired();
    expect(screen.getByLabelText("Description")).toBeRequired();
    expect(screen.getByLabelText("Priority")).toBeRequired();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByLabelText("Title")).toBeInvalid();
    expect(
      screen.queryByRole("heading", { name: "Confirm Ticket Creation" }),
    ).not.toBeInTheDocument();
    expect(mockedCreateTicket).not.toHaveBeenCalled();
  });

  it("waits for confirmation, sends the exact request, displays the result, and resets the form", async () => {
    const user = userEvent.setup();
    mockedCreateTicket.mockResolvedValue(createdTicket);
    renderCreateTicket();

    const request = await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByRole("heading", { name: "Confirm Ticket Creation" }),
    ).toBeInTheDocument();
    expect(mockedCreateTicket).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save Ticket" }));

    const expectedRequest: CreateTicketRequest = {
      title: request.title,
      description: request.description,
      priority: request.priority,
    };
    expect(mockedCreateTicket).toHaveBeenCalledWith(expectedRequest);
    expect(
      await screen.findByRole("heading", { name: "Created Tickets" }),
    ).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /MT-3001/ });
    expect(within(row).getByText("Repair leaking pipe")).toBeInTheDocument();
    expect(within(row).getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Priority")).toHaveValue("");
    expect(
      screen.queryByRole("heading", { name: "Confirm Ticket Creation" }),
    ).not.toBeInTheDocument();
  });

  it("cancels the confirmation without submitting or clearing entered values", async () => {
    const user = userEvent.setup();
    renderCreateTicket();

    const request = await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save" }));

    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    await user.click(cancelButtons[1]);

    expect(mockedCreateTicket).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("heading", { name: "Confirm Ticket Creation" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue(request.title);
    expect(screen.getByLabelText("Description")).toHaveValue(
      request.description,
    );
    expect(screen.getByLabelText("Priority")).toHaveValue(request.priority);
  });

  it("clears the form when the form Cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderCreateTicket();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(screen.getByLabelText("Priority")).toHaveValue("");
    expect(mockedCreateTicket).not.toHaveBeenCalled();
  });

  it("shows an API error and preserves the form and confirmation modal", async () => {
    const user = userEvent.setup();
    mockedCreateTicket.mockRejectedValue(new Error("Request failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderCreateTicket();

    const request = await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Save Ticket" }));

    expect(
      await screen.findByText("Failed to create ticket. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Confirm Ticket Creation" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue(request.title);
    expect(screen.getByLabelText("Description")).toHaveValue(
      request.description,
    );
    expect(screen.getByLabelText("Priority")).toHaveValue(request.priority);
  });

  it("disables confirmation actions and shows progress while creation is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: (ticket: Ticket) => void = () => {};
    const pendingCreate = new Promise<Ticket>((resolve) => {
      resolveCreate = resolve;
    });
    mockedCreateTicket.mockReturnValue(pendingCreate);
    renderCreateTicket();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    const saveClick = user.click(
      screen.getByRole("button", { name: "Save Ticket" }),
    );

    expect(
      await screen.findByRole("button", { name: "Saving..." }),
    ).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Cancel" })[1]).toBeDisabled();

    await act(async () => {
      resolveCreate(createdTicket);
      await pendingCreate;
    });

    await saveClick;
    expect(
      await screen.findByRole("row", { name: /MT-3001/ }),
    ).toBeInTheDocument();
  });

  it("navigates back to the tickets list", async () => {
    const user = userEvent.setup();
    renderCreateTicket();

    await user.click(screen.getByRole("button", { name: "← Back" }));
    expect(await screen.findByText("Tickets list reached")).toBeInTheDocument();
  });
});
