export interface Ticket {
  id: string;
  ticketNumber: string;
  technicianId: string | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
