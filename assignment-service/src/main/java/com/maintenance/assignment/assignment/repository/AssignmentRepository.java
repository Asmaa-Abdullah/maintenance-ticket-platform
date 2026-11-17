package com.maintenance.assignment.assignment.repository;

import com.maintenance.assignment.assignment.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    boolean existsByTicketId(UUID ticketId);
}
