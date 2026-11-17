package com.maintenance.assignment.assignment.controller;

import com.maintenance.assignment.assignment.dto.AssignmentRequest;
import com.maintenance.assignment.assignment.dto.AssignmentResponse;
import com.maintenance.assignment.assignment.exception.GlobalExceptionHandler.ErrorResponse;
import com.maintenance.assignment.assignment.service.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
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

@RestController
@RequestMapping("/api/v1/assignments")
@Tag(
        name = "Assignments",
        description = "Operations for assigning maintenance tickets to technicians"
)
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @Operation(
            summary = "Assign a ticket to a technician",
            description = "Assigns an available ticket to a technician. "
                    + "A ticket can only be assigned to one technician."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Ticket assigned successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid assignment request",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(
                                    implementation = ErrorResponse.class
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Ticket is already assigned",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(
                                    implementation = ErrorResponse.class
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Authentication required or token invalid"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Access denied. ADMIN or TECHNICIAN role required."
            )
    })
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TECHNICIAN')")
    @PostMapping
    public ResponseEntity<AssignmentResponse> assignTicket(
            @Valid @RequestBody AssignmentRequest request,
            Authentication authentication
    ) {

        AssignmentResponse response = assignmentService.assignTicket(request, authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
