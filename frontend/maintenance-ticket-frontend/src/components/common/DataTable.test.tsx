import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DataTable, { type DataTableColumn } from "./DataTable";

interface Ticket {
  ticketNumber: string;
  title: string;
  status: string;
}

interface TicketWithNullableStatus {
  ticketNumber: string;
  status: string | null;
}

describe("DataTable", () => {
  const columns: DataTableColumn<Ticket>[] = [
    { key: "ticketNumber", header: "Ticket #" },
    { key: "title", header: "Title" },
    { key: "status", header: "Status" },
  ];

  it("renders all configured column headers", () => {
    render(<DataTable columns={columns} data={[]} />);

    const table = screen.getByRole("table");

    expect(
      within(table).getByRole("columnheader", { name: "Ticket #" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Title" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Status" }),
    ).toBeInTheDocument();
  });

  it("renders default values from typed data objects", () => {
    const tickets: Ticket[] = [
      {
        ticketNumber: "MT-1024",
        title: "Repair leaking pipe",
        status: "OPEN",
      },
    ];

    render(<DataTable columns={columns} data={tickets} />);

    const row = screen.getByRole("row", {
      name: "MT-1024 Repair leaking pipe OPEN",
    });

    expect(
      within(row).getByRole("cell", { name: "MT-1024" }),
    ).toBeInTheDocument();
    expect(
      within(row).getByRole("cell", { name: "Repair leaking pipe" }),
    ).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: "OPEN" })).toBeInTheDocument();
  });

  it("renders custom column renderers, including JSX content", () => {
    const customColumns: DataTableColumn<Ticket>[] = [
      { key: "ticketNumber", header: "Ticket #" },
      {
        key: "status",
        header: "Status",
        render: (ticket) => <strong>{ticket.status}</strong>,
      },
    ];

    render(
      <DataTable
        columns={customColumns}
        data={[
          {
            ticketNumber: "MT-2048",
            title: "Replace hallway light",
            status: "IN_PROGRESS",
          },
        ]}
      />,
    );

    const row = screen.getByRole("row", {
      name: "MT-2048 IN_PROGRESS",
    });

    expect(
      within(row).getByRole("cell", { name: "MT-2048" }),
    ).toBeInTheDocument();
    expect(within(row).getByText("IN_PROGRESS").tagName).toBe("STRONG");
  });

  it("displays the default empty message with a spanning cell", () => {
    render(<DataTable columns={columns} data={[]} />);

    const emptyCell = screen.getByRole("cell", {
      name: "No data available.",
    });

    expect(emptyCell).toBeInTheDocument();
    expect(emptyCell).toHaveAttribute("colspan", "3");
  });

  it("displays a custom empty message with a spanning cell", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="No tickets match your search."
      />,
    );

    const emptyCell = screen.getByRole("cell", {
      name: "No tickets match your search.",
    });

    expect(emptyCell).toBeInTheDocument();
    expect(emptyCell).toHaveAttribute("colspan", "3");
  });

  it("renders an empty cell when a default value is null", () => {
    const nullableColumns: DataTableColumn<TicketWithNullableStatus>[] = [
      { key: "ticketNumber", header: "Ticket #" },
      { key: "status", header: "Status" },
    ];

    render(
      <DataTable
        columns={nullableColumns}
        data={[{ ticketNumber: "MT-4096", status: null }]}
      />,
    );

    const row = screen.getByRole("row", { name: "MT-4096" });
    const cells = within(row).getAllByRole("cell");

    expect(cells[1]).toBeEmptyDOMElement();
  });
});
