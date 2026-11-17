package com.maintenance.ticket.ticket.exception;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Error response returned by the API")
public record ErrorResponse(

        @Schema(
                description = "Timestamp when the error occurred",
                example = "2026-08-26T13:08:12.393Z"
        )
        Instant timestamp,

        @Schema(
                description = "HTTP status code",
                example = "404"
        )
        int status,

        @Schema(
                description = "Application-specific error code",
                example = "TICKET_NOT_FOUND"
        )
        String error,

        @Schema(
                description = "Human-readable error message",
                example = "Ticket not found with id: 6587e169-230f-4dac-8602-d82edfe4be88"
        )
        String message
) {
}