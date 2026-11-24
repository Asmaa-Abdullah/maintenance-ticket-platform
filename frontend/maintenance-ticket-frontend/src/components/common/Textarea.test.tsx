import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Textarea from "./Textarea";

describe("Textarea", () => {
  it("renders a textarea with a label associated through its id", () => {
    render(<Textarea id="description" label="Description" />);

    const textarea = screen.getByLabelText("Description");

    expect(textarea).toHaveAttribute("id", "description");
  });

  it("displays the initial value provided by defaultValue", () => {
    render(
      <Textarea aria-label="Description" defaultValue="Initial description" />,
    );

    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Initial description",
    );
  });

  it("updates a controlled value when the user types", async () => {
    function StatefulTextarea() {
      const [value, setValue] = useState("");

      return (
        <Textarea
          aria-label="Description"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      );
    }

    const user = userEvent.setup();
    render(<StatefulTextarea />);

    const textarea = screen.getByRole("textbox", { name: "Description" });
    await user.type(textarea, "Leaking pipe");

    expect(textarea).toHaveValue("Leaking pipe");
  });

  it("forwards native HTML attributes", () => {
    render(
      <Textarea
        name="ticketDescription"
        placeholder="Describe the issue"
        required
        aria-label="Ticket description"
      />,
    );

    const textarea = screen.getByRole("textbox", {
      name: "Ticket description",
    });

    expect(textarea).toHaveAttribute("name", "ticketDescription");
    expect(textarea).toHaveAttribute("placeholder", "Describe the issue");
    expect(textarea).toBeRequired();
  });

  it("does not allow typing when disabled", async () => {
    const user = userEvent.setup();

    render(
      <Textarea
        aria-label="Disabled description"
        defaultValue="Cannot edit this"
        disabled
      />,
    );

    const textarea = screen.getByRole("textbox", {
      name: "Disabled description",
    });

    expect(textarea).toBeDisabled();

    await user.type(textarea, "new text");

    expect(textarea).toHaveValue("Cannot edit this");
  });
});
