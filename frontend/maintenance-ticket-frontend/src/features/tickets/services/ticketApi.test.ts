import { AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ticketApi } from "../../../services/api/axios";
import {
  createTicket,
  deleteTicket,
  getAssignedTickets,
  getTicketById,
  getTicketCounts,
  getTickets,
  updateTicket,
  updateTicketStatus,
  type ChangeTicketStatusRequest,
  type CreateTicketRequest,
  type UpdateTicketRequest,
  type TicketCounts,
} from "./ticketApi";
import type { Ticket } from "../types/ticket";

vi.mock("../../../services/api/axios", () => ({
  ticketApi: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(ticketApi.get);
const mockedPost = vi.mocked(ticketApi.post);
const mockedPatch = vi.mocked(ticketApi.patch);
const mockedDelete = vi.mocked(ticketApi.delete);

function response<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
}

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

describe("ticketApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets tickets and returns the response data", async () => {
    mockedGet.mockResolvedValue(response([ticket]));

    await expect(getTickets()).resolves.toEqual([ticket]);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/tickets");
  });

  it("gets assigned tickets and returns the response data", async () => {
    mockedGet.mockResolvedValue(response([ticket]));

    await expect(getAssignedTickets()).resolves.toEqual([ticket]);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/tickets/assigned");
  });

  it("gets a ticket by ID and returns the response data", async () => {
    mockedGet.mockResolvedValue(response(ticket));

    await expect(getTicketById(ticket.id)).resolves.toEqual(ticket);

    expect(mockedGet).toHaveBeenCalledWith(`/api/v1/tickets/${ticket.id}`);
  });

  it("creates a ticket with the request body and returns the created ticket", async () => {
    const request: CreateTicketRequest = {
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
    };
    mockedPost.mockResolvedValue(response(ticket));

    await expect(createTicket(request)).resolves.toEqual(ticket);

    expect(mockedPost).toHaveBeenCalledWith("/api/v1/tickets", request);
  });

  it("deletes a ticket and resolves without response data", async () => {
    mockedDelete.mockResolvedValue(response(undefined));

    await expect(deleteTicket(ticket.id)).resolves.toBeUndefined();

    expect(mockedDelete).toHaveBeenCalledWith(`/api/v1/tickets/${ticket.id}`);
  });

  it("updates a ticket using PATCH with the request body", async () => {
    const request: UpdateTicketRequest = {
      title: "Replace kitchen pipe",
      description: "Replace the leaking pipe",
      priority: "MEDIUM",
    };
    const updatedTicket = { ...ticket, ...request };
    mockedPatch.mockResolvedValue(response(updatedTicket));

    await expect(updateTicket(ticket.id, request)).resolves.toEqual(
      updatedTicket,
    );

    expect(mockedPatch).toHaveBeenCalledWith(
      `/api/v1/tickets/${ticket.id}`,
      request,
    );
  });

  it("updates ticket status using the status endpoint and request body", async () => {
    const request: ChangeTicketStatusRequest = { status: "IN_PROGRESS" };
    const updatedTicket = { ...ticket, status: request.status };
    mockedPatch.mockResolvedValue(response(updatedTicket));

    await expect(updateTicketStatus(ticket.id, request)).resolves.toEqual(
      updatedTicket,
    );

    expect(mockedPatch).toHaveBeenCalledWith(
      `/api/v1/tickets/${ticket.id}/status`,
      request,
    );
  });

  it("gets ticket counts and returns the response data", async () => {
    const counts: TicketCounts = {
      open: 1,
      assigned: 2,
      inProgress: 3,
      completed: 4,
    };
    mockedGet.mockResolvedValue(response(counts));

    await expect(getTicketCounts()).resolves.toEqual(counts);

    expect(mockedGet).toHaveBeenCalledWith("/api/v1/tickets/dashboard/counts");
  });

  it("propagates API errors to the caller", async () => {
    const failure = new Error("Request failed");
    mockedGet.mockRejectedValue(failure);

    await expect(getTickets()).rejects.toBe(failure);
  });
});
