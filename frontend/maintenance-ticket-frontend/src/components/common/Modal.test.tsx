import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Modal from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal
        open={false}
        title="Delete Ticket"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      >
        <p>Are you sure?</p>
      </Modal>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the title and default button labels when open", () => {
    render(
      <Modal
        open
        title="Delete Ticket"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      >
        <p>Are you sure?</p>
      </Modal>,
    );

    expect(
      screen.getByRole("heading", { name: "Delete Ticket" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("renders custom labels and React children", () => {
    render(
      <Modal
        open
        title="Create Ticket"
        confirmText="Save Ticket"
        cancelText="Go Back"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      >
        <div>
          <span>Ticket details</span>
        </div>
      </Modal>,
    );

    expect(
      screen.getByRole("button", { name: "Save Ticket" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go Back" })).toBeInTheDocument();
    expect(screen.getByText("Ticket details")).toBeInTheDocument();
  });

  it("calls Confirm and Cancel exactly once", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <Modal
        open
        title="Ticket Confirmation"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        <p>Please confirm this action.</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons and shows Saving... while loading", () => {
    render(
      <Modal
        open
        title="Save Ticket"
        isLoading
        onConfirm={() => undefined}
        onCancel={() => undefined}
      >
        <p>Saving your changes.</p>
      </Modal>,
    );

    const confirmButton = screen.getByRole("button", {
      name: "Saving...",
    });
    const cancelButton = screen.getByRole("button", {
      name: "Cancel",
    });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
