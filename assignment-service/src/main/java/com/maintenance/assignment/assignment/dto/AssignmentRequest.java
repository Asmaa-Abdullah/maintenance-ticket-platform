package com.maintenance.assignment.assignment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "Request for assigning a ticket to a technician")
public record AssignmentRequest(

        @Schema(
                description = "Unique identifier of the ticket",
                example = "aa5f2b91-6191-4d3e-8b7a-391e387d3c4d"
        )
        @NotNull(message = "Ticket ID is required")
        UUID ticketId,

        @Schema(
                description = "Identity user ID of the technician",
                example = "15"
        )

        Long technicianId
) {
}
