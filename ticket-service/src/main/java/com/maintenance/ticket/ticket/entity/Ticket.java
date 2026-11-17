package com.maintenance.ticket.ticket.entity;

import com.maintenance.ticket.ticket.exception.TicketAlreadyAssignedException;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "tickets",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tickets_ticket_number",
                        columnNames = "ticket_number"
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(
            name = "ticket_number",
            nullable = false,
            updatable = false,
            length = 20
    )
    private String ticketNumber;

    @Column(name = "technician_id")
    private Long technicianId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketPriority priority;

    @Column(name = "created_by")
    private String createdBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    public Ticket(
            String ticketNumber,
            String title,
            String description,
            TicketPriority priority,
            String createdBy
    ) {
        this.ticketNumber = ticketNumber;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.createdBy = createdBy;
        this.status = TicketStatus.OPEN;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void updateStatus(TicketStatus status) {
        this.status = status;

        if (status == TicketStatus.OPEN) {
            this.technicianId = null;
        }
    }

    public void updatePriority(TicketPriority priority) {
        this.priority = priority;
    }

    public void updateDetails(
            String title,
            String description
    ) {
        this.title = title;
        this.description = description;
    }

    public void assignTo(Long technicianId) {
        if (this.status != TicketStatus.OPEN) {
            throw new TicketAlreadyAssignedException(this.id);
        }

        this.technicianId = technicianId;
        this.status = TicketStatus.ASSIGNED;
    }

    public void assignFromEvent(Long technicianId) {
        this.technicianId = technicianId;
        this.status = TicketStatus.ASSIGNED;
    }

    public void reassignFromEvent(Long technicianId) {
        this.technicianId = technicianId;
    }
}