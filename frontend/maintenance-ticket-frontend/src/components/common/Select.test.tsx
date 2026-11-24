import { useState, type ChangeEvent } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Select from "./Select";

describe("Select", () => {
  it("renders options and an associated label", () => {
    render(
      <Select id="priority" label="Priority">
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>,
    );

    const select = screen.getByLabelText("Priority");

    expect(select).toHaveAttribute("id", "priority");
    expect(within(select).getByRole("option", { name: "Low" })).toHaveValue(
      "LOW",
    );
    expect(within(select).getByRole("option", { name: "Medium" })).toHaveValue(
      "MEDIUM",
    );
    expect(within(select).getByRole("option", { name: "High" })).toHaveValue(
      "HIGH",
    );
  });

  it("uses the default selected value", () => {
    render(
      <Select id="priority" label="Priority" defaultValue="MEDIUM">
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>,
    );

    const select = screen.getByLabelText("Priority");

    expect(select).toHaveValue("MEDIUM");
    expect(
      (
        within(select).getByRole("option", {
          name: "Medium",
        }) as HTMLOptionElement
      ).selected,
    ).toBe(true);
  });

  it("displays a parent-controlled selected value", () => {
    render(
      <Select id="priority" label="Priority" value="LOW" onChange={vi.fn()}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>,
    );

    expect(screen.getByLabelText("Priority")).toHaveValue("LOW");
  });

  it("handles user selection and reports the selected value", async () => {
    const user = userEvent.setup();
    const receivedValues: string[] = [];

    const handleChange = vi.fn((event: ChangeEvent<HTMLSelectElement>) => {
      receivedValues.push(event.target.value);
    });

    function StatefulSelect() {
      const [value, setValue] = useState("LOW");

      return (
        <Select
          id="priority"
          label="Priority"
          value={value}
          onChange={(event) => {
            handleChange(event);
            setValue(event.target.value);
          }}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </Select>
      );
    }

    render(<StatefulSelect />);

    const select = screen.getByLabelText("Priority");
    await user.selectOptions(select, "HIGH");

    expect(select).toHaveValue("HIGH");
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(receivedValues[receivedValues.length - 1]).toBe("HIGH");
  });

  it("forwards native attributes and prevents changes while disabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Select
        id="priority"
        name="ticketPriority"
        aria-label="Ticket priority"
        required
        disabled
        defaultValue="LOW"
        onChange={handleChange}
      >
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>,
    );

    const select = screen.getByRole("combobox", {
      name: "Ticket priority",
    });

    expect(select).toHaveAttribute("name", "ticketPriority");
    expect(select).toBeRequired();
    expect(select).toBeDisabled();

    await user.selectOptions(select, "HIGH");

    expect(select).toHaveValue("LOW");
    expect(handleChange).not.toHaveBeenCalled();
  });
});
