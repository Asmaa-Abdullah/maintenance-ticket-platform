import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";
import Textarea from "../../../components/common/Textarea";
import Select from "../../../components/common/Select";
import Button from "../../../components/common/Button";

import type { Ticket } from "../types/ticket";
import { getTicketById, updateTicket } from "../services/ticketApi";

function EditTicket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) {
        setError("Invalid ticket ID.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const data = await getTicketById(id);

        if (data.status !== "OPEN") {
          setError("This ticket can no longer be edited.");
          return;
        }

        setTicket(data);
        setTitle(data.title);
        setDescription(data.description);
        setPriority(data.priority);
      } catch (error) {
        console.error("Failed to load ticket:", error);
        setError("Failed to load ticket. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();
  }, [id]);

  const handleSave = async () => {
    if (!id) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await updateTicket(id, {
        title,
        description,
        priority,
      });

      navigate("/tickets");
    } catch (error) {
      console.error("Failed to update ticket:", error);
      setError("Failed to update ticket. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/tickets");
  };

  if (isLoading) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm text-slate-500">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm text-red-600">{error || "Ticket not found."}</p>

          <div className="mb-6">
            <Button type="button" variant="back" onClick={handleCancel}>
              ← Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Button type="button" variant="back" onClick={handleCancel}>
            ← Back
          </Button>
        </div>

        <Card title="Edit Ticket" className="w-full max-w-none">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            <Input
              label="Ticket"
              value={ticket.ticketNumber}
              disabled
              className="disabled:border-blue-200 disabled:bg-blue-50 disabled:font-medium disabled:text-blue-700 disabled:opacity-100"
            />

            <Input
              id="title"
              name="title"
              type="text"
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <Textarea
              id="description"
              name="description"
              label="Description"
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default EditTicket;
