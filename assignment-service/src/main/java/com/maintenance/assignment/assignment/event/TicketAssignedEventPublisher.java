package com.maintenance.assignment.assignment.event;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class TicketAssignedEventPublisher {

    private static final String TOPIC = "ticket-assigned.v1";

    private final KafkaTemplate<String, TicketAssignedEvent> kafkaTemplate;

    public TicketAssignedEventPublisher(
            KafkaTemplate<String, TicketAssignedEvent> kafkaTemplate
    ) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(TicketAssignedEvent event) {
        kafkaTemplate.send(
                TOPIC,
                event.ticketId().toString(),
                event
        );
    }
}