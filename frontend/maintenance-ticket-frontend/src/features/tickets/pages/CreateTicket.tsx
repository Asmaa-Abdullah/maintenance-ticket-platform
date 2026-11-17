import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";
import Textarea from "../../../components/common/Textarea";
import Select from "../../../components/common/Select";
import Modal from "../../../components/common/Modal";
import DataTable from "../../../components/common/DataTable";

import { createTicket, type CreateTicketRequest } from "../services/ticketApi";

import type { Ticket } from "../types/ticket";
import { getTicketColumns } from "../utils/ticketColumns";

function CreateTicket() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");

  // Tickets created during the current visit to this page.
  const [createdTickets, setCreatedTickets] = useState<Ticket[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    setError("");

    const request: CreateTicketRequest = {
      title,
      description,
      priority,
    };

    try {
      const createdTicket = await createTicket(request);

      setCreatedTickets((currentTickets) => [createdTicket, ...currentTickets]);

      setTitle("");
      setDescription("");
      setPriority("");

      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create ticket:", error);

      setError("Failed to create ticket. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleClearForm = () => {
    setTitle("");
    setDescription("");
    setPriority("");
    setError("");
  };

  const handleBack = () => {
    navigate("/tickets");
  };

  return (
    <div className="px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* Back to Tickets */}
        <div className="mb-6">
          <Button type="button" variant="back" onClick={handleBack}>
            ← Back
          </Button>
        </div>

        {/* Create Ticket Form */}
        <Card title="Create Ticket" className="w-full max-w-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="title"
              name="title"
              type="text"
              label="Title"
              placeholder="Enter ticket title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <Textarea
              id="description"
              name="description"
              label="Description"
              placeholder="Describe the maintenance issue..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />

            <Select
              id="priority"
              name="priority"
              label="Priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              required
            >
              <option value="" disabled>
                Select priority
              </option>

              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </Select>

            {error && !isModalOpen && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Form Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearForm}
              >
                Cancel
              </Button>

              <Button type="submit">Save</Button>
            </div>
          </form>
        </Card>

        {/* Created Tickets Table */}
        {createdTickets.length > 0 && (
          <div className="mt-10">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
                Created Tickets
              </h2>
            </div>

            <DataTable
              columns={getTicketColumns()}
              data={createdTickets}
              emptyMessage="No tickets created yet."
            />
          </div>
        )}

        {/* Confirmation Modal */}
        <Modal
          open={isModalOpen}
          title="Confirm Ticket Creation"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Save Ticket"
          cancelText="Cancel"
          isLoading={isSaving}
        >
          <p>Are you sure you want to create this ticket?</p>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </Modal>
      </div>
    </div>
  );
}

export default CreateTicket;
