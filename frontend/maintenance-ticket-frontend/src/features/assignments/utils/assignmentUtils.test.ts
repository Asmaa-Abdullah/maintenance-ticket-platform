import { describe, expect, it } from "vitest";

import { getPriorityClass } from "./assignmentUtils";

describe("getPriorityClass", () => {
  it.each([
    ["HIGH", "font-medium text-red-600"],
    ["MEDIUM", "font-medium text-amber-600"],
    ["LOW", "font-medium text-green-600"],
    ["UNKNOWN", "font-medium text-slate-600"],
  ])("returns the expected style for %s priority", (priority, className) => {
    expect(getPriorityClass(priority)).toBe(className);
  });
});
