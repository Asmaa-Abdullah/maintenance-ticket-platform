package com.maintenance.ticket.ticket.dto;

import com.maintenance.ticket.ticket.entity.TicketPriority;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Request for creating a new maintenance ticket")
public record CreateTicketRequest(

        @Schema(
                description = "Short title describing the maintenance issue",
                example = "Air conditioner is not working"
        )
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        @Schema(
                description = "Detailed description of the maintenance issue",
                example = "The air conditioner in room 201 stopped working."
        )
        @NotBlank(message = "Description is required")
        String description,

        @Schema(
                description = "Priority level of the ticket",
                example = "HIGH"
        )
        @NotNull(message = "Priority is required")
        TicketPriority priority
) {
}