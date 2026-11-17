import { assignmentApi } from "../../../services/api/axios";

export interface AssignmentRequest {
  ticketId: string;
  technicianId?: number;
}

export interface AssignmentResponse {
  ticketId: string;
  technicianId: number;
  assignedAt: string;
}

export const assignTicket = async (
  request: AssignmentRequest,
): Promise<AssignmentResponse> => {
  const response = await assignmentApi.post<AssignmentResponse>(
    "/api/v1/assignments",
    request,
  );

  return response.data;
};
