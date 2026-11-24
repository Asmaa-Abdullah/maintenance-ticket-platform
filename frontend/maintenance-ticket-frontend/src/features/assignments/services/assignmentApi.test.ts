import { AxiosHeaders, type AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { assignmentApi } from "../../../services/api/axios";
import { assignTicket, type AssignmentResponse } from "./assignmentApi";

vi.mock("../../../services/api/axios", () => ({
  assignmentApi: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(assignmentApi.post);

function response(data: AssignmentResponse): AxiosResponse<AssignmentResponse> {
  return {
    data,
    status: 201,
    statusText: "Created",
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
}

describe("assignTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts the ticket and selected technician and returns the response data", async () => {
    const assignment: AssignmentResponse = {
      ticketId: "ticket-1",
      technicianId: 12,
      assignedAt: "2026-03-02T10:00:00Z",
    };
    mockedPost.mockResolvedValue(response(assignment));

    await expect(
      assignTicket({ ticketId: "ticket-1", technicianId: 12 }),
    ).resolves.toEqual(assignment);

    expect(mockedPost).toHaveBeenCalledWith("/api/v1/assignments", {
      ticketId: "ticket-1",
      technicianId: 12,
    });
  });

  it("preserves the self-assignment request shape without a technician ID", async () => {
    const assignment: AssignmentResponse = {
      ticketId: "ticket-2",
      technicianId: 5,
      assignedAt: "2026-03-03T10:00:00Z",
    };
    mockedPost.mockResolvedValue(response(assignment));

    await expect(assignTicket({ ticketId: "ticket-2" })).resolves.toEqual(
      assignment,
    );

    expect(mockedPost).toHaveBeenCalledWith("/api/v1/assignments", {
      ticketId: "ticket-2",
    });
  });

  it("propagates request failures to the caller", async () => {
    const failure = new Error("Request failed");
    mockedPost.mockRejectedValue(failure);

    await expect(assignTicket({ ticketId: "ticket-3" })).rejects.toBe(failure);
  });
});
