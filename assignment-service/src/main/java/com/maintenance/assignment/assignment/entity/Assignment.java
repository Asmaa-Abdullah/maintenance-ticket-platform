package com.maintenance.assignment.assignment.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Assignment {

    @Id
    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "technician_id", nullable = false)
    private Long technicianId;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    public Assignment(UUID ticketId, Long technicianId) {
        this.ticketId = ticketId;
        this.technicianId = technicianId;
        this.assignedAt = Instant.now();
    }

    public void reassignTo(Long technicianId) {
        this.technicianId = technicianId;
        this.assignedAt = Instant.now();
    }
}

