package com.maintenance.ticket.ticket.dto;

import com.maintenance.ticket.ticket.entity.TicketPriority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request for updating ticket details")
public record UpdateTicketRequest(

        @Schema(
                description = "Short title describing the maintenance issue",
                example = "Air conditioner requires replacement"
        )
        @NotBlank(message = "Title is required")
        String title,

        @Schema(
                description = "Detailed description of the maintenance issue",
                example = "The air conditioner in room 201 requires replacement."
        )
        @NotBlank(message = "Description is required")
        String description,

        @Schema(
                description = "Ticket priority",
                example = "CRITICAL"
        )
        @NotNull(message = "Priority is required")
        TicketPriority priority
) {
}