package com.maintenance.assignment.assignment.exception;

import java.util.UUID;

public class TicketAlreadyAssignedException
        extends RuntimeException {

    public TicketAlreadyAssignedException(UUID ticketId) {
        super("Ticket is already assigned: " + ticketId);
    }
}

