import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

import Modal from "../../../components/common/Modal";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/DataTable";
import Button from "../../../components/common/Button";
import SearchInput from "../../../components/common/SearchInput";
import BackToDashboardButton from "../../../components/common/BackToDashboardButton";

import type { Ticket } from "../types/ticket";
import { deleteTicket, getTickets } from "../services/ticketApi";
import { getTicketColumns } from "../utils/ticketColumns";

const columns = (
  onEdit: (ticket: Ticket) => void,
  onDelete: (ticket: Ticket) => void,
): DataTableColumn<Ticket>[] => [
  ...getTicketColumns(),
  {
    key: "actions",
    header: "Actions",
    render: (ticket) => (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="success"
          disabled={ticket.status !== "OPEN"}
          onClick={() => onEdit(ticket)}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <Button
          type="button"
          variant="danger"
          disabled={ticket.status !== "OPEN"}
          onClick={() => onDelete(ticket)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    ),
  },
];

function Tickets() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTickets();
        setTickets(data);
      } catch (error) {
        console.error("Failed to load tickets:", error);
        setError("Failed to load tickets. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");

      await deleteTicket(ticketToDelete.id);

      setTickets((currentTickets) =>
        currentTickets.filter((ticket) => ticket.id !== ticketToDelete.id),
      );

      setTicketToDelete(null);
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      setError("Failed to delete ticket. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-800">
              Tickets
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              View and manage maintenance tickets.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <BackToDashboardButton />
        </div>

        <div className="mt-8 flex items-center gap-10 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets..."
          />

          <Button type="button" onClick={() => navigate("/create-ticket")}>
            <span className="text-lg leading-none">+</span>
            Create Ticket
          </Button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          <DataTable
            columns={columns(
              (ticket) => navigate(`/tickets/${ticket.id}/edit`),
              (ticket) => setTicketToDelete(ticket),
            )}
            data={isLoading ? [] : filteredTickets}
            emptyMessage={
              isLoading ? "Loading tickets..." : "No tickets found."
            }
          />
        </div>
      </div>

      <Modal
        open={ticketToDelete !== null}
        title="Confirm Ticket Deletion"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTicketToDelete(null)}
        confirmText="Delete Ticket"
        cancelText="Cancel"
        isLoading={isDeleting}
      >
        <p>
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800">
            {ticketToDelete?.ticketNumber}
          </span>
          ?
        </p>
      </Modal>
    </div>
  );
}

export default Tickets;
