import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "../../../components/common/Modal";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/DataTable";
import Button from "../../../components/common/Button";
import SearchInput from "../../../components/common/SearchInput";
import Select from "../../../components/common/Select";
import BackToDashboardButton from "../../../components/common/BackToDashboardButton";

import type { Ticket } from "../../tickets/types/ticket";
import { getTickets } from "../../tickets/services/ticketApi";

import { getAllUsers } from "../../users/services/userApi";
import type { User } from "../../users/types/user";

import { assignTicket } from "../services/assignmentApi";
import { getMe } from "../../auth/services/authApi";
import { getAssignmentBaseColumns } from "../utils/assignmentColumns";

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function Assignments() {
  const navigate = useNavigate();

  const [role, setRole] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [ticketToAssign, setTicketToAssign] = useState<Ticket | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");

  const [isAssigning, setIsAssigning] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(
    null,
  );

  // Load initial data.
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const currentUser = await getMe();

        if (cancelled) return;

        setRole(currentUser.role);

        const ticketPromise = getTickets();

        const techniciansPromise =
          currentUser.role === "ADMIN" ? getAllUsers() : Promise.resolve([]);

        const [ticketData, userData] = await Promise.all([
          ticketPromise,
          techniciansPromise,
        ]);

        if (cancelled) return;

        setTickets(ticketData);

        const activeTechnicians = userData.filter(
          (user) => user.role === "TECHNICIAN" && user.enabled,
        );

        setTechnicians(activeTechnicians);
      } catch (error) {
        console.error("Failed to load assignments:", error);

        if (!cancelled) {
          setError("Failed to load assignments. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Assign a ticket to the currently authenticated technician.
  const handleAssignToMe = async (ticket: Ticket) => {
    try {
      setAssigningTicketId(ticket.id);
      setError("");

      await assignTicket({
        ticketId: ticket.id,
      });

      setTickets((current) => current.filter((item) => item.id !== ticket.id));
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      setError("Failed to assign ticket. Please try again.");
    } finally {
      setAssigningTicketId(null);
    }
  };

  // Open assignment modal.
  const handleOpenAssignment = (ticket: Ticket) => {
    setTicketToAssign(ticket);
    setSelectedTechnicianId("");
    setError("");
  };

  // Close assignment modal.
  const handleCloseAssignment = () => {
    if (isAssigning) return;

    setTicketToAssign(null);
    setSelectedTechnicianId("");
  };

  // Confirm assignment to a selected technician.
  const handleConfirmAssignment = async () => {
    if (!ticketToAssign || !selectedTechnicianId) {
      setError("Please select a technician.");
      return;
    }

    const technicianId = Number(selectedTechnicianId);

    if (!Number.isFinite(technicianId)) {
      setError("Invalid technician selection.");
      return;
    }

    try {
      setIsAssigning(true);
      setError("");

      await assignTicket({
        ticketId: ticketToAssign.id,
        technicianId,
      });

      setTickets((current) =>
        current.filter((ticket) => ticket.id !== ticketToAssign.id),
      );

      setTicketToAssign(null);
      setSelectedTechnicianId("");
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      setError("Failed to assign ticket. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter tickets based on ticket number and title.
  const filteredTickets = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return tickets;

    return tickets.filter(
      (ticket) =>
        ticket.ticketNumber.toLowerCase().includes(searchValue) ||
        ticket.title.toLowerCase().includes(searchValue),
    );
  }, [tickets, search]);

  // Table configuration.
  const columns: DataTableColumn<Ticket>[] = [
    ...getAssignmentBaseColumns(),
    {
      key: "createdAt",
      header: "Created",
      render: (ticket) => formatDate(ticket.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (ticket) =>
        role === "ADMIN" ? (
          <Button
            type="button"
            disabled={isAssigning || assigningTicketId !== null || isLoading}
            onClick={() => handleOpenAssignment(ticket)}
          >
            Assign
          </Button>
        ) : (
          <Button
            type="button"
            disabled={assigningTicketId !== null || isAssigning || isLoading}
            onClick={() => handleAssignToMe(ticket)}
          >
            {assigningTicketId === ticket.id ? "Assigning..." : "Assign to Me"}
          </Button>
        ),
    },
  ];

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-800">
            Assignments
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Assign open maintenance tickets to technicians.
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-4">
          <BackToDashboardButton />
        </div>

        {/* Search and actions */}
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets..."
            />
          </div>

          <Button type="button" onClick={() => navigate("/assigned-tickets")}>
            View Assigned Tickets
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Tickets table */}
        <div className="mt-6">
          <DataTable
            columns={columns}
            data={isLoading ? [] : filteredTickets}
            emptyMessage={
              isLoading ? "Loading tickets..." : "No open tickets found."
            }
          />
        </div>
      </div>

      {/* Assignment modal */}
      <Modal
        open={role === "ADMIN" && ticketToAssign !== null}
        title="Assign Ticket"
        onConfirm={handleConfirmAssignment}
        onCancel={handleCloseAssignment}
        confirmText="Confirm Assignment"
        cancelText="Cancel"
        isLoading={isAssigning}
      >
        <div className="space-y-4">
          <p>
            Select a technician for ticket{" "}
            <span className="font-semibold text-slate-800">
              {ticketToAssign?.ticketNumber}
            </span>
          </p>

          <Select
            id="technician"
            label="Technician"
            value={selectedTechnicianId}
            disabled={isAssigning || technicians.length === 0}
            onChange={(event) => setSelectedTechnicianId(event.target.value)}
          >
            <option value="">Select a technician</option>

            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.fullName}
              </option>
            ))}
          </Select>

          {technicians.length === 0 && (
            <p className="text-sm text-amber-600">
              No active technicians available.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Assignments;
