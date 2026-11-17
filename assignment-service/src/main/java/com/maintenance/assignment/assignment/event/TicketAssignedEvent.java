package com.maintenance.assignment.assignment.event;

import java.time.Instant;
import java.util.UUID;

public record TicketAssignedEvent(

        UUID id,

        String eventType,

        int version,

        Instant timestamp,

        UUID ticketId,

        Long technicianId

) {
}