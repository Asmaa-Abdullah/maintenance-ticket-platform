package com.maintenance.ticket.ticket.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "Request for assigning a ticket to a technician")
public record AssignTicketRequest(

        @Schema(
                description = "Unique identifier of the technician",
                example = "17"
        )
        @NotNull(message = "Technician ID is required")
        Long technicianId
) {
}