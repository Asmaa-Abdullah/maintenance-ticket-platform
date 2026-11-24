import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders OPEN with the blue styles", () => {
    render(<StatusBadge status="OPEN" />);

    const badge = screen.getByText("OPEN");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-blue-50", "text-blue-700");
  });

  it("renders IN_PROGRESS with the amber styles", () => {
    render(<StatusBadge status="IN_PROGRESS" />);

    const badge = screen.getByText("IN_PROGRESS");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-amber-50", "text-amber-700");
  });

  it("renders COMPLETED with the green styles", () => {
    render(<StatusBadge status="COMPLETED" />);

    const badge = screen.getByText("COMPLETED");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-emerald-50", "text-emerald-700");
  });

  it("renders CANCELLED with the default gray styles", () => {
    render(<StatusBadge status="CANCELLED" />);

    const badge = screen.getByText("CANCELLED");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-slate-100", "text-slate-600");
  });

  it("uses the default gray styles for lowercase open", () => {
    render(<StatusBadge status="open" />);

    const badge = screen.getByText("open");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-slate-100", "text-slate-600");
  });
});
