package com.maintenance.ticket.ticket.controller;

import com.maintenance.ticket.ticket.dto.*;
import com.maintenance.ticket.ticket.exception.ErrorResponse;
import com.maintenance.ticket.ticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@Tag(
        name = "Tickets",
        description = "Operations for managing maintenance tickets"
)
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @Operation(
            summary = "Create a new ticket",
            description = "Creates a new maintenance ticket with OPEN status."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Ticket created successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid ticket data",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PreAuthorize("hasAnyAuthority('ADMIN', 'INSPECTOR')")
    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication
    ) {

        TicketResponse response = ticketService.createTicket(
                request,
                authentication.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @Operation(
            summary = "Get available tickets",
            description = "Returns all tickets currently in OPEN status."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Available tickets retrieved successfully"
    )
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAvailableTickets() {

        List<TicketResponse> tickets =
                ticketService.getAvailableTickets();

        return ResponseEntity.ok(tickets);
    }

    @Operation(
            summary = "Get ticket by ID",
            description = "Returns the details of a specific maintenance ticket."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ticket found successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Ticket not found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @Parameter(
                    description = "Unique identifier of the ticket",
                    required = true
            )
            @PathVariable UUID id
    ) {

        TicketResponse response =
                ticketService.getTicketById(id);

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Get assigned tickets",
            description = "Returns the maintenance tickets that have been assigned to technicians."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Assigned tickets retrieved successfully")
    })
    @GetMapping("/assigned")
    public ResponseEntity<List<TicketResponse>> getAssignedTickets() {

        List<TicketResponse> tickets =
                ticketService.getAssignedTickets();

        return ResponseEntity.ok(tickets);
    }

    @Operation(
            summary = "Get ticket dashboard counts",
            description = "Returns ticket counts grouped by their current status."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ticket counts retrieved successfully")
    })
    @GetMapping("/dashboard/counts")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TECHNICIAN', 'INSPECTOR')")
    public ResponseEntity<Map<String, Long>> getTicketCounts() {
        return ResponseEntity.ok(ticketService.getTicketCounts());
    }

    @Operation(
            summary = "Assign ticket to a technician",
            description = "Assigns an open ticket to a technician and changes its status to ASSIGNED."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ticket assigned successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid request",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Ticket not found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Ticket is already assigned",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PostMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable UUID id,
            @Valid @RequestBody AssignTicketRequest request
    ) {
        TicketResponse response = ticketService.assignTicket(
                id,
                request.technicianId()
        );

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Delete ticket",
            description = "Deletes an open maintenance ticket."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Ticket deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Ticket not found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @Parameter(
                    description = "Unique identifier of the ticket",
                    required = true
            )
            @PathVariable UUID id
    ) {
        ticketService.deleteTicket(id);

        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Update ticket details",
            description = "Updates the title, description, and priority of an existing maintenance ticket."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ticket updated successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid ticket data",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Ticket not found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    @PatchMapping("/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
            @Parameter(
                    description = "Unique identifier of the ticket",
                    required = true
            )
            @PathVariable UUID id,

            @Valid @RequestBody UpdateTicketRequest request
    ) {

        TicketResponse response =
                ticketService.updateTicket(id, request);

        return ResponseEntity.ok(response);
    }


    @Operation(
            summary = "Change ticket status",
            description = "Changes the current status of an existing maintenance ticket."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Ticket status updated successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid ticket status",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Ticket not found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })

    @PreAuthorize("hasAnyAuthority('ADMIN', 'TECHNICIAN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @Parameter(
                    description = "Unique identifier of the ticket",
                    required = true
            )
            @PathVariable UUID id,

            @Valid @RequestBody ChangeTicketStatusRequest request,

            Authentication authentication
    ) {

        TicketResponse response =
                ticketService.updateTicketStatus(id, request, authentication);

        return ResponseEntity.ok(response);
    }

}