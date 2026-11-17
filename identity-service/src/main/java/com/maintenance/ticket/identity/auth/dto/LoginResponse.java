package com.maintenance.ticket.identity.auth.dto;

public record LoginResponse(

        String accessToken,
        String tokenType,
        long expiresIn

) {
}
