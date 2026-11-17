package com.maintenance.ticket.identity.auth.dto;

public record MeResponse(
        Long id,
        String employeeNumber,
        String fullName,
        String username,
        String role
) {
}
