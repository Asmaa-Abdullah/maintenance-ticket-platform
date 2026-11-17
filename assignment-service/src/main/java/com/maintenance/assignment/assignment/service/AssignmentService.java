package com.maintenance.assignment.assignment.service;

import com.maintenance.assignment.assignment.dto.AssignmentRequest;
import com.maintenance.assignment.assignment.dto.AssignmentResponse;
import com.maintenance.assignment.assignment.entity.Assignment;
import com.maintenance.assignment.assignment.event.TicketAssignedEvent;
import com.maintenance.assignment.assignment.event.TicketAssignedEventPublisher;
import com.maintenance.assignment.assignment.exception.TicketAlreadyAssignedException;
import com.maintenance.assignment.assignment.repository.AssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.UUID;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final TicketAssignedEventPublisher eventPublisher;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            TicketAssignedEventPublisher eventPublisher
    ) {
        this.assignmentRepository = assignmentRepository;
        this.eventPublisher = eventPublisher;
    }


    @Transactional
    public AssignmentResponse assignTicket(
            AssignmentRequest request,
            Authentication authentication
    ) {
        // Check JWT authentication
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            throw new AccessDeniedException("Invalid authentication");
        }

        Jwt jwt = jwtAuth.getToken();

        String role = jwt.getClaimAsString("role");
        String userIdClaim = jwt.getClaimAsString("userId");

        if (userIdClaim == null) {
            throw new AccessDeniedException("User ID not found in token");
        }

        Long userId = Long.valueOf(userIdClaim);
        Long technicianId;

        if ("ADMIN".equals(role)) {
            if (request.technicianId() == null) {
                throw new IllegalArgumentException("Technician ID is required for ADMIN");
            }
            technicianId = request.technicianId();

        } else if ("TECHNICIAN".equals(role)) {
            technicianId = userId;

        } else {
            throw new AccessDeniedException("You cannot assign tickets");
        }

        Assignment savedAssignment;

        var existingAssignment = assignmentRepository.findById(request.ticketId());

        if (existingAssignment.isPresent()) {

            if (!"ADMIN".equals(role) && !"TECHNICIAN".equals(role)) {
                throw new TicketAlreadyAssignedException(request.ticketId());
            }

            Assignment assignment = existingAssignment.get();
            assignment.reassignTo(technicianId);

            savedAssignment = assignmentRepository.save(assignment);

        } else {

            Assignment assignment = new Assignment(
                    request.ticketId(),
                    technicianId
            );

            savedAssignment = assignmentRepository.save(assignment);
        }

        TicketAssignedEvent event = new TicketAssignedEvent(
                UUID.randomUUID(),
                "TicketAssignedEvent",
                1,
                Instant.now(),
                savedAssignment.getTicketId(),
                savedAssignment.getTechnicianId()
        );

        eventPublisher.publish(event);

        return AssignmentResponse.from(savedAssignment);
    }

}