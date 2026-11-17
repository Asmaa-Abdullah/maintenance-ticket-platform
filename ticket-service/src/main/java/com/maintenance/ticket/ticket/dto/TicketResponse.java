package com.maintenance.ticket.ticket.dto;

import com.maintenance.ticket.ticket.entity.Ticket;
import com.maintenance.ticket.ticket.entity.TicketPriority;
import com.maintenance.ticket.ticket.entity.TicketStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Maintenance ticket response")
public record TicketResponse(

        @Schema(
                description = "Internal unique identifier of the ticket",
                example = "6587e169-230f-4dac-8602-d82edfe4be88"
        )
        UUID id,

        @Schema(
                description = "Human-readable ticket number",
                example = "1001"
        )
        String ticketNumber,

        @Schema(
                description = "Unique identifier of the assigned technician",
                example = "17"
        )
        Long technicianId,

        @Schema(
                description = "Identity of the user who created the ticket",
                example = "admin"
        )
        String createdBy,

        @Schema(
                description = "Short title describing the maintenance issue",
                example = "Air conditioner is not working"
        )
        String title,

        @Schema(
                description = "Detailed description of the maintenance issue",
                example = "The air conditioner in room 201 stopped working."
        )
        String description,

        @Schema(
                description = "Current ticket status",
                example = "OPEN"
        )
        TicketStatus status,

        @Schema(
                description = "Ticket priority",
                example = "HIGH"
        )
        TicketPriority priority,

        @Schema(
                description = "Time when the ticket was created",
                example = "2026-08-26T13:08:12Z"
        )
        Instant createdAt,

        @Schema(
                description = "Time when the ticket was last updated",
                example = "2026-08-26T13:08:12Z"
        )
        Instant updatedAt
) {

    public static TicketResponse from(Ticket ticket) {

        return new TicketResponse(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getTechnicianId(),
                ticket.getCreatedBy(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getStatus(),
                ticket.getPriority(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }
}