import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "../../../components/common/Modal";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/DataTable";
import Button from "../../../components/common/Button";
import SearchInput from "../../../components/common/SearchInput";
import Select from "../../../components/common/Select";

import type { Ticket } from "../../tickets/types/ticket";
import {
  getAssignedTickets,
  updateTicketStatus,
} from "../../tickets/services/ticketApi";

import { getTechnicians } from "../../users/services/userApi";
import type { Technician } from "../../users/services/userApi";

import { assignTicket } from "../services/assignmentApi";
import { getMe } from "../../auth/services/authApi";
import { getAssignmentBaseColumns } from "../utils/assignmentColumns";
import axios from "axios";

const ADMIN_STATUS_OPTIONS = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

const getStatusOptions = (role: string | null, currentStatus: string) => {
  if (role === "ADMIN") {
    return ADMIN_STATUS_OPTIONS;
  }

  if (currentStatus === "ASSIGNED") {
    return ["ASSIGNED", "IN_PROGRESS", "OPEN"];
  }

  if (currentStatus === "IN_PROGRESS") {
    return ["IN_PROGRESS", "RESOLVED"];
  }

  return [currentStatus];
};

function AssignedTickets() {
  const navigate = useNavigate();

  const [role, setRole] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [ticketToReassign, setTicketToReassign] = useState<Ticket | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");

  const [isReassigning, setIsReassigning] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [currentUser, ticketData, technicianData] = await Promise.all([
          getMe(),
          getAssignedTickets(),
          getTechnicians(),
        ]);

        if (cancelled) return;

        setRole(currentUser.role);
        setTickets(ticketData);
        setTechnicians(technicianData);
      } catch (error) {
        console.error("Failed to load assigned tickets:", error);

        if (!cancelled) {
          setError("Failed to load assigned tickets. Please try again.");
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

  // Update ticket status.
  const handleStatusChange = async (ticket: Ticket, status: string) => {
    try {
      setUpdatingTicketId(ticket.id);
      setError("");

      const updatedTicket = await updateTicketStatus(ticket.id, { status });

      if (updatedTicket.status === "OPEN") {
        setTickets((current) =>
          current.filter((item) => item.id !== updatedTicket.id),
        );
      } else {
        setTickets((current) =>
          current.map((item) =>
            item.id === updatedTicket.id ? updatedTicket : item,
          ),
        );
      }
    } catch (error: unknown) {
      console.error("Failed to update ticket status:", error);

      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setError(
          "You are not authorized to update this ticket. You can only update tickets assigned to you.",
        );
      } else {
        setError("Failed to update ticket status. Please try again.");
      }
    } finally {
      setUpdatingTicketId(null);
    }
  };

  // Open reassignment modal.
  const handleOpenReassignment = (ticket: Ticket) => {
    setTicketToReassign(ticket);
    setSelectedTechnicianId(String(ticket.technicianId ?? ""));
    setError("");
  };

  // Close reassignment modal.
  const handleCloseReassignment = () => {
    if (isReassigning) return;

    setTicketToReassign(null);
    setSelectedTechnicianId("");
  };

  const handleConfirmReassignment = async () => {
    if (!ticketToReassign || !selectedTechnicianId) {
      setError("Please select a technician.");
      return;
    }

    const technicianId = Number(selectedTechnicianId);

    if (!Number.isFinite(technicianId)) {
      setError("Invalid technician selection.");
      return;
    }

    try {
      setIsReassigning(true);
      setError("");

      await assignTicket({
        ticketId: ticketToReassign.id,
        technicianId,
      });

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketToReassign.id
            ? { ...ticket, technicianId: String(technicianId) }
            : ticket,
        ),
      );

      setTicketToReassign(null);
      setSelectedTechnicianId("");
    } catch (error) {
      console.error("Failed to reassign ticket:", error);
      setError("Failed to reassign ticket. Please try again.");
    } finally {
      setIsReassigning(false);
    }
  };

  // Filter tickets.
  const filteredTickets = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) return tickets;

    return tickets.filter(
      (ticket) =>
        ticket.ticketNumber.toLowerCase().includes(searchValue) ||
        ticket.title.toLowerCase().includes(searchValue) ||
        ticket.status.toLowerCase().includes(searchValue),
    );
  }, [tickets, search]);

  // Check whether the current role can update a ticket.
  const canChangeTicketStatus = (ticket: Ticket) => {
    return role === "ADMIN" || role === "TECHNICIAN";
  };

  // Table columns.
  const columns: DataTableColumn<Ticket>[] = [
    ...getAssignmentBaseColumns(),
    {
      key: "technicianId",
      header: "Technician",
      render: (ticket) => {
        const technician = technicians.find(
          (user) => String(user.id) === String(ticket.technicianId),
        );

        return technician
          ? technician.fullName
          : ticket.technicianId
            ? `ID: ${ticket.technicianId}`
            : "Unassigned";
      },
    },
    {
      key: "status",
      header: "Status",
      render: (ticket) => {
        const canUpdate = canChangeTicketStatus(ticket);
        const statusOptions = getStatusOptions(role, ticket.status);

        return canUpdate ? (
          <Select
            id={`status-${ticket.id}`}
            value={ticket.status}
            disabled={updatingTicketId !== null}
            onChange={(event) => handleStatusChange(ticket, event.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </Select>
        ) : (
          <span className="font-medium text-slate-600">
            {ticket.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (ticket) =>
        role === "ADMIN" ? (
          <Button
            type="button"
            onClick={() => handleOpenReassignment(ticket)}
            disabled={isReassigning}
          >
            Reassign
          </Button>
        ) : (
          <span className="text-sm text-slate-400">-</span>
        ),
    },
  ];

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-800">
            Assigned Tickets
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            View assigned maintenance tickets and manage their status.
          </p>
        </div>

        <div className="mb-6 mt-6">
          <Button
            type="button"
            variant="back"
            onClick={() => navigate("/assignments")}
          >
            ← Back
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assigned tickets..."
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6">
          <DataTable
            columns={columns}
            data={isLoading ? [] : filteredTickets}
            emptyMessage={
              isLoading
                ? "Loading assigned tickets..."
                : "No assigned tickets found."
            }
          />
        </div>
      </div>

      <Modal
        open={role === "ADMIN" && ticketToReassign !== null}
        title="Reassign Ticket"
        onConfirm={handleConfirmReassignment}
        onCancel={handleCloseReassignment}
        confirmText="Confirm Reassignment"
        cancelText="Cancel"
        isLoading={isReassigning}
      >
        <div className="space-y-4">
          <p>
            Select a technician for ticket{" "}
            <span className="font-semibold text-slate-800">
              {ticketToReassign?.ticketNumber}
            </span>
          </p>

          <Select
            id="technician"
            label="Technician"
            value={selectedTechnicianId}
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

export default AssignedTickets;
