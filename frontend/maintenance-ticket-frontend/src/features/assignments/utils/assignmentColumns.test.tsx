import { describe, expect, it } from "vitest";

import type { Ticket } from "../../tickets/types/ticket";
import { getAssignmentBaseColumns } from "./assignmentColumns";

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

describe("getAssignmentBaseColumns", () => {
  it("provides ticket number, title, and priority columns in order", () => {
    expect(
      getAssignmentBaseColumns().map(({ key, header }) => [key, header]),
    ).toEqual([
      ["ticketNumber", "Ticket #"],
      ["title", "Title"],
      ["priority", "Priority"],
    ]);
  });

  it("renders known and fallback priority styles", () => {
    const priorityColumn = getAssignmentBaseColumns().find(
      (column) => column.key === "priority",
    );

    expect(priorityColumn?.render?.(ticket)).toMatchObject({
      props: { className: "font-medium text-red-600", children: "HIGH" },
    });
    expect(
      priorityColumn?.render?.({ ...ticket, priority: "UNKNOWN" }),
    ).toMatchObject({
      props: {
        className: "font-medium text-slate-600",
        children: "UNKNOWN",
      },
    });
  });
});
