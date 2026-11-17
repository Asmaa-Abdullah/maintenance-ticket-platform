import type { DataTableColumn } from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import type { Ticket } from "../types/ticket";

import { getPriorityClass, formatTicketDate } from "./ticketUtils";

export const getTicketColumns = (): DataTableColumn<Ticket>[] => [
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
      <span className={getPriorityClass(ticket.priority)}>
        {ticket.priority}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (ticket) => <StatusBadge status={ticket.status} />,
  },
  {
    key: "createdAt",
    header: "Created",
    render: (ticket) => formatTicketDate(ticket.createdAt),
  },
];
