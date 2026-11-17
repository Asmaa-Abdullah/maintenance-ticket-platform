import type { DataTableColumn } from "../../../components/common/DataTable";
import type { Ticket } from "../../tickets/types/ticket";

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "font-medium text-red-600",
  MEDIUM: "font-medium text-amber-600",
  LOW: "font-medium text-green-600",
};

export const getAssignmentBaseColumns = (): DataTableColumn<Ticket>[] => [
  {
    key: "ticketNumber",
    header: "Ticket #",
  },
  {
    key: "title",
    header: "Title",
  },
  {
    key: "priority",
    header: "Priority",
    render: (ticket) => (
      <span
        className={
          PRIORITY_STYLES[ticket.priority] ?? "font-medium text-slate-600"
        }
      >
        {ticket.priority}
      </span>
    ),
  },
];
