import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Button from "./Button";

describe("Button", () => {
  it("renders children with an accessible button role and name", () => {
    render(<Button>Save Ticket</Button>);

    const button = screen.getByRole("button", { name: "Save Ticket" });

    expect(button).toBeInTheDocument();
  });

  it("calls onClick exactly once when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Create</Button>);

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Delete
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Delete" });

    expect(button).toBeDisabled();

    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("forwards native attributes such as type, name, and aria-label", () => {
    render(
      <Button
        type="submit"
        name="ticketAction"
        aria-label="Confirm ticket action"
      >
        Save
      </Button>,
    );

    const button = screen.getByRole("button", {
      name: "Confirm ticket action",
    });

    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("name", "ticketAction");
  });

  it("preserves a custom className", () => {
    render(<Button className="custom-test-class">Continue</Button>);

    const button = screen.getByRole("button", { name: "Continue" });

    expect(button).toHaveClass("custom-test-class");
  });
});
