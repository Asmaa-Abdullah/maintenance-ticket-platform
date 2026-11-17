package com.maintenance.ticket.ticket.exception;

import java.util.UUID;

public class TicketCannotBeDeletedException extends RuntimeException {

    public TicketCannotBeDeletedException(UUID ticketId) {
        super("Ticket cannot be deleted unless it is OPEN: " + ticketId);
    }
}