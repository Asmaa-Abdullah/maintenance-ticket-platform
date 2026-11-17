package com.maintenance.ticket.ticket.repository;

import com.maintenance.ticket.ticket.entity.Ticket;
import com.maintenance.ticket.ticket.entity.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findByStatus(TicketStatus status);

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    boolean existsByTicketNumber(String ticketNumber);

    List<Ticket> findByStatusNot(TicketStatus status);

    long countByStatus(TicketStatus status);
}