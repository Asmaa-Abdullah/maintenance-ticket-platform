package com.maintenance.ticket.identity.user.dto;

public record UserResponse(
        Long id,
        String employeeNumber,
        String fullName,
        String username,
        String role,
        boolean enabled
) {
}
