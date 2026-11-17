package com.maintenance.ticket.ticket.event;

import com.maintenance.ticket.ticket.service.TicketService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TicketAssignedEventConsumer {

    private final TicketService ticketService;

    public TicketAssignedEventConsumer(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @KafkaListener(
            topics = "ticket-assigned.v1",
            groupId = "ticket-service"
    )
    public void consume(TicketAssignedEvent event) {

        ticketService.markAsAssigned(
                event.ticketId(),
                event.technicianId()
        );
    }
}
