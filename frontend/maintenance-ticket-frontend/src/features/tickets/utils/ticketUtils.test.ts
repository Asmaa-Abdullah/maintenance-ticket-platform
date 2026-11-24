import { describe, expect, it } from "vitest";

import { formatTicketDate, getPriorityClass } from "./ticketUtils";

describe("getPriorityClass", () => {
  it("returns the amber style for MEDIUM priority", () => {
    expect(getPriorityClass("MEDIUM")).toBe("font-medium text-amber-600");
  });

  it("returns the green style for LOW priority", () => {
    expect(getPriorityClass("LOW")).toBe("font-medium text-green-600");
  });

  it("returns the default style for an unknown priority", () => {
    expect(getPriorityClass("UNKNOWN")).toBe("font-medium text-slate-600");
  });

  it("formats a date with an abbreviated month, day, and year", () => {
    expect(formatTicketDate("2026-03-01T12:00:00")).toBe("Mar 1, 2026");
  });
});
