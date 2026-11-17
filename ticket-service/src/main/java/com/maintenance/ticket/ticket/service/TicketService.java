package com.maintenance.ticket.ticket.service;

import com.maintenance.ticket.ticket.dto.ChangeTicketStatusRequest;
import com.maintenance.ticket.ticket.dto.CreateTicketRequest;
import com.maintenance.ticket.ticket.dto.TicketResponse;
import com.maintenance.ticket.ticket.dto.UpdateTicketRequest;
import com.maintenance.ticket.ticket.entity.Ticket;
import com.maintenance.ticket.ticket.entity.TicketStatus;
import com.maintenance.ticket.ticket.exception.TicketCannotBeDeletedException;
import com.maintenance.ticket.ticket.exception.TicketCannotBeUpdatedException;
import com.maintenance.ticket.ticket.exception.TicketNotFoundException;
import com.maintenance.ticket.ticket.repository.TicketRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketNumberGenerator ticketNumberGenerator;

    public TicketService(
            TicketRepository ticketRepository,
            TicketNumberGenerator ticketNumberGenerator

    ) {
        this.ticketRepository = ticketRepository;
        this.ticketNumberGenerator = ticketNumberGenerator;
    }

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, String createdBy) {

        String ticketNumber = ticketNumberGenerator.generate();

        Ticket ticket = new Ticket(
                ticketNumber,
                request.title(),
                request.description(),
                request.priority(),
                createdBy
        );

        Ticket savedTicket = ticketRepository.save(ticket);

        return TicketResponse.from(savedTicket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAvailableTickets() {

        return ticketRepository
                .findByStatus(TicketStatus.OPEN)
                .stream()
                .map(TicketResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAssignedTickets() {

        return ticketRepository
                .findByStatusNot(TicketStatus.OPEN)
                .stream()
                .map(TicketResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID ticketId) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        return TicketResponse.from(ticket);
    }

    @Transactional
    public TicketResponse assignTicket(
            UUID ticketId,
            Long technicianId
    ) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        ticket.assignTo(technicianId);

        Ticket savedTicket = ticketRepository.save(ticket);

        return TicketResponse.from(savedTicket);
    }

    @Transactional
    public TicketResponse updateTicket(
            UUID ticketId,
            UpdateTicketRequest request
    ) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new TicketCannotBeUpdatedException(ticketId);
        }

        ticket.updateDetails(
                request.title(),
                request.description()
        );

        ticket.updatePriority(request.priority());

        Ticket savedTicket = ticketRepository.save(ticket);

        return TicketResponse.from(savedTicket);
    }

    @Transactional
    public TicketResponse updateTicketStatus(
            UUID ticketId,
            ChangeTicketStatusRequest request,
            Authentication authentication
    ) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

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

        if ("TECHNICIAN".equals(role)) {

            // Technician can update only own assigned tickets
            if (!userId.equals(ticket.getTechnicianId())) {
                throw new AccessDeniedException(
                        "You can only update tickets assigned to you"
                );
            }

            // Validate status transition
            boolean validTransition =
                    (ticket.getStatus() == TicketStatus.ASSIGNED
                            && (request.status() == TicketStatus.IN_PROGRESS
                            || request.status() == TicketStatus.OPEN))
                            ||
                            (ticket.getStatus() == TicketStatus.IN_PROGRESS
                                    && request.status() == TicketStatus.RESOLVED);

            if (!validTransition) {
                throw new IllegalArgumentException(
                        "Invalid ticket status transition"
                );
            }

        } else if (!"ADMIN".equals(role)) {
            throw new AccessDeniedException(
                    "You cannot update ticket status"
            );
        }


        ticket.updateStatus(request.status());

        System.out.println("Status: " + ticket.getStatus());
        System.out.println("Technician ID: " + ticket.getTechnicianId());

        Ticket savedTicket = ticketRepository.save(ticket);
        ticketRepository.flush();

        return TicketResponse.from(savedTicket);
    }

    @Transactional
    public void deleteTicket(UUID ticketId) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new TicketCannotBeDeletedException(ticketId);
        }

        ticketRepository.delete(ticket);
    }

    @Transactional
    public void markAsAssigned(
            UUID ticketId,
            Long technicianId
    ) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException(ticketId));

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.assignFromEvent(technicianId);
        } else {
            ticket.reassignFromEvent(technicianId);
        }

        ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTicketCounts() {

        return Map.of(
                "open", ticketRepository.countByStatus(TicketStatus.OPEN),
                "assigned", ticketRepository.countByStatus(TicketStatus.ASSIGNED),
                "inProgress", ticketRepository.countByStatus(TicketStatus.IN_PROGRESS),
                "completed", ticketRepository.countByStatus(TicketStatus.RESOLVED)
        );
    }
}