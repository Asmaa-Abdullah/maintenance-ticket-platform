package com.maintenance.ticket.identity.auth.dto;

import com.maintenance.ticket.identity.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Employee number is required")
        @Size(max = 30)
        String employeeNumber,

        @NotBlank(message = "Full name is required")
        @Size(max = 150)
        String fullName,

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 100)
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72)
        String password,

        @NotNull(message = "Role is required")
        Role role
) {
}