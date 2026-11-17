package com.maintenance.ticket.ticket.dto;

import com.maintenance.ticket.ticket.entity.TicketStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request for changing ticket status")
public record ChangeTicketStatusRequest(

        @Schema(
                description = "New status of the ticket",
                example = "IN_PROGRESS"
        )
        @NotNull(message = "Status is required")
        TicketStatus status
) {
}