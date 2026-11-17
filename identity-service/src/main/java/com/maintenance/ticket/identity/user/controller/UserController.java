package com.maintenance.ticket.identity.user.controller;

import com.maintenance.ticket.identity.auth.dto.RegisterRequest;
import com.maintenance.ticket.identity.auth.dto.RegisterResponse;
import com.maintenance.ticket.identity.user.dto.TechnicianResponse;
import com.maintenance.ticket.identity.user.dto.UpdateUserRequest;
import com.maintenance.ticket.identity.user.dto.UserResponse;
import com.maintenance.ticket.identity.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<RegisterResponse> createUser(
            @Valid @RequestBody RegisterRequest request
    ) {
        RegisterResponse response = userService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PreAuthorize("hasAnyAuthority('ADMIN', 'TECHNICIAN')")
    @GetMapping("/technicians")
    public ResponseEntity<List<TechnicianResponse>> getTechnicians() {
        return ResponseEntity.ok(userService.getTechnicians());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<Void> disableUser(@PathVariable Long id) {
        userService.disableUser(id);
        return ResponseEntity.noContent().build();
    }
}
