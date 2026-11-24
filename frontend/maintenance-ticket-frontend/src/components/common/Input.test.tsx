import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Input from "./Input";

describe("Input", () => {
  it("renders an input with an associated label and default type", () => {
    render(<Input id="username" label="Username" />);

    const input = screen.getByLabelText("Username");

    expect(input).toHaveAttribute("id", "username");
    expect(input).toHaveProperty("type", "text");
  });

  it("renders without a label and has no accessible name", () => {
    render(<Input placeholder="Enter a value" />);

    const input = screen.getByPlaceholderText("Enter a value");

    expect(input).toBeInTheDocument();
    expect(input).not.toHaveAccessibleName();
  });

  it("displays a controlled value supplied by the parent", () => {
    render(
      <Input
        aria-label="Controlled input"
        value="Parent value"
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "Controlled input" }),
    ).toHaveValue("Parent value");
  });

  it("accepts user input through a stateful wrapper", async () => {
    function StatefulInput() {
      const [value, setValue] = useState("");

      return (
        <Input
          aria-label="Search"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      );
    }

    const user = userEvent.setup();
    render(<StatefulInput />);

    const input = screen.getByRole("textbox", { name: "Search" });
    await user.type(input, "pump repair");

    expect(input).toHaveValue("pump repair");
  });

  it("forwards native HTML attributes", () => {
    render(
      <Input
        type="email"
        name="email"
        placeholder="name@example.com"
        required
        disabled
        aria-label="Email address"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email address" });

    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("placeholder", "name@example.com");
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
