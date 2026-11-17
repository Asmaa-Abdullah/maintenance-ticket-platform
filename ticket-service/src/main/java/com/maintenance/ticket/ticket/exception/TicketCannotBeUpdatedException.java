package com.maintenance.ticket.ticket.exception;

import java.util.UUID;

public class TicketCannotBeUpdatedException extends RuntimeException {

    public TicketCannotBeUpdatedException(UUID ticketId) {
        super("Ticket cannot be updated unless it is OPEN: " + ticketId);
    }
}