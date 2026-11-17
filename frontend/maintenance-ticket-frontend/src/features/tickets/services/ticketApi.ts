import { ticketApi } from "../../../services/api/axios";
import type { Ticket } from "../types/ticket";

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: string;
}

export interface UpdateTicketRequest {
  title: string;
  description: string;
  priority: string;
}

export const getTickets = async (): Promise<Ticket[]> => {
  const response = await ticketApi.get<Ticket[]>("/api/v1/tickets");

  return response.data;
};

export const getAssignedTickets = async (): Promise<Ticket[]> => {
  const response = await ticketApi.get<Ticket[]>("/api/v1/tickets/assigned");

  return response.data;
};

export const getTicketById = async (id: string): Promise<Ticket> => {
  const response = await ticketApi.get<Ticket>(`/api/v1/tickets/${id}`);

  return response.data;
};

export const createTicket = async (
  request: CreateTicketRequest,
): Promise<Ticket> => {
  const response = await ticketApi.post<Ticket>("/api/v1/tickets", request);

  return response.data;
};

export const deleteTicket = async (id: string): Promise<void> => {
  await ticketApi.delete(`/api/v1/tickets/${id}`);
};

export const updateTicket = async (
  id: string,
  request: UpdateTicketRequest,
): Promise<Ticket> => {
  const response = await ticketApi.patch<Ticket>(
    `/api/v1/tickets/${id}`,
    request,
  );

  return response.data;
};

export interface ChangeTicketStatusRequest {
  status: string;
}

export const updateTicketStatus = async (
  id: string,
  request: ChangeTicketStatusRequest,
): Promise<Ticket> => {
  const response = await ticketApi.patch<Ticket>(
    `/api/v1/tickets/${id}/status`,
    request,
  );

  return response.data;
};

export interface TicketCounts {
  open: number;
  assigned: number;
  inProgress: number;
  completed: number;
}

export const getTicketCounts = async (): Promise<TicketCounts> => {
  const response = await ticketApi.get<TicketCounts>(
    "/api/v1/tickets/dashboard/counts",
  );

  return response.data;
};
