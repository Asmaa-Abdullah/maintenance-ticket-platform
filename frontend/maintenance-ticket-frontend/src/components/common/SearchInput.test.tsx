import { useState, type ChangeEvent } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SearchInput from "./SearchInput";

interface StatefulSearchInputProps {
  placeholder?: string;
  initialValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

function StatefulSearchInput({
  placeholder,
  initialValue = "",
  onChange,
}: StatefulSearchInputProps) {
  const [value, setValue] = useState(initialValue);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    setValue(event.target.value);
  };

  return (
    <SearchInput
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
}

describe("SearchInput", () => {
  it("renders the default placeholder", () => {
    render(<StatefulSearchInput />);

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Search...",
    );
  });

  it("renders a custom placeholder", () => {
    render(<StatefulSearchInput placeholder="Search tickets..." />);

    expect(
      screen.getByPlaceholderText("Search tickets..."),
    ).toBeInTheDocument();
  });

  it("updates the value and calls onChange while typing", async () => {
    const user = userEvent.setup();
    const receivedValues: string[] = [];

    const handleChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      receivedValues.push(event.target.value);
    });

    render(<StatefulSearchInput onChange={handleChange} />);

    await user.type(screen.getByRole("textbox"), "Pump 2");

    expect(screen.getByRole("textbox")).toHaveValue("Pump 2");
    expect(handleChange).toHaveBeenCalled();
    expect(receivedValues[receivedValues.length - 1]).toBe("Pump 2");
  });

  it("clears the controlled value and reports an empty value", async () => {
    const user = userEvent.setup();
    const receivedValues: string[] = [];

    const handleChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      receivedValues.push(event.target.value);
    });

    render(
      <StatefulSearchInput
        initialValue="Existing search"
        onChange={handleChange}
      />,
    );

    const input = screen.getByRole("textbox");
    await user.clear(input);

    expect(input).toHaveValue("");
    expect(handleChange).toHaveBeenCalled();
    expect(receivedValues[receivedValues.length - 1]).toBe("");
  });

  it("keeps the input value controlled by the parent", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn(
      (_event: ChangeEvent<HTMLInputElement>) => undefined,
    );

    render(<SearchInput value="Initial" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "x");

    expect(input).toHaveValue("Initial");
  });
});
