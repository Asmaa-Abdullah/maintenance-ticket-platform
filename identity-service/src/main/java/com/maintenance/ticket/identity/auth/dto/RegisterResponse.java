package com.maintenance.ticket.identity.auth.dto;

public record RegisterResponse(

        Long id,
        String employeeNumber,
        String fullName,
        String username,
        String role,
        boolean enabled
) {
}
