package com.maintenance.ticket.identity.auth.controller;

import com.maintenance.ticket.identity.auth.service.AuthService;
import com.maintenance.ticket.identity.auth.dto.LoginRequest;
import com.maintenance.ticket.identity.auth.dto.LoginResponse;
import com.maintenance.ticket.identity.auth.dto.MeResponse;
import com.maintenance.ticket.identity.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.*;

@Tag(
        name = "Authentication",
        description = "Authentication and user identity endpoints"
)
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @Operation(
            summary = "User Login",
            description = "Authenticates a user using username and password and returns a JWT access token.",
            security = {}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful"),
            @ApiResponse(responseCode = "400", description = "Invalid login request"),
            @ApiResponse(responseCode = "401", description = "Invalid username or password")
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Get Current User",
            description = "Returns the profile information of the currently authenticated user."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User profile retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Authentication required or token invalid")
    })
    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        return userService.getMe(authentication.getName());
    }

    @Operation(
            summary = "Admin Only",
            description = "Accessible only to users with the ADMIN role."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Admin access granted"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Access denied. ADMIN role required.")
    })
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/admin")
    public String adminOnly() {
        return "admin";
    }
}
