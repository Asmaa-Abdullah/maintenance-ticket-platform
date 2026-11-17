package com.maintenance.assignment.assignment.dto;

import com.maintenance.assignment.assignment.entity.Assignment;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Ticket assignment response")
public record AssignmentResponse(

        @Schema(
                description = "Unique identifier of the ticket",
                example = "aa5f2b91-6191-4d3e-8b7a-391e387d3c4d"
        )
        UUID ticketId,

        @Schema(
                description = "Identity user ID of the technician",
                example = "15"
        )
        Long technicianId,

        @Schema(
                description = "Time when the ticket was assigned",
                example = "2026-08-27T10:30:00Z"
        )
        Instant assignedAt
) {

    public static AssignmentResponse from(Assignment assignment) {
        return new AssignmentResponse(
                assignment.getTicketId(),
                assignment.getTechnicianId(),
                assignment.getAssignedAt()
        );
    }
}

