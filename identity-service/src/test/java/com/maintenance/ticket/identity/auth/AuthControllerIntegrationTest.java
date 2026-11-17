package com.maintenance.ticket.identity.auth;

import com.maintenance.ticket.identity.entity.Role;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import tools.jackson.databind.ObjectMapper;
import com.maintenance.ticket.identity.auth.dto.RegisterRequest;
import com.maintenance.ticket.identity.entity.User;
import com.maintenance.ticket.identity.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterUserSuccessfully() throws Exception {

        RegisterRequest request = new RegisterRequest(
                "TEST-EMP-001",
                "Integration Test User",
                "integration-user",
                "StrongPassword123!",
                Role.TECHNICIAN
        );

        mockMvc.perform(post("/api/v1/users")
                        .with(jwt().authorities(
                                new SimpleGrantedAuthority("ADMIN")
                        ))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.employeeNumber").value("TEST-EMP-001"))
                .andExpect(jsonPath("$.fullName").value("Integration Test User"))
                .andExpect(jsonPath("$.username").value("integration-user"))
                .andExpect(jsonPath("$.role").value("TECHNICIAN"))
                .andExpect(jsonPath("$.enabled").value(true));

        User savedUser = userRepository
                .findByUsername("integration-user")
                .orElseThrow();

        assertThat(savedUser.getEmployeeNumber())
                .isEqualTo("TEST-EMP-001");

        assertThat(savedUser.getFullName())
                .isEqualTo("Integration Test User");

        assertThat(savedUser.getUsername())
                .isEqualTo("integration-user");

        assertThat(savedUser.getRole().name())
                .isEqualTo("TECHNICIAN");

        assertThat(savedUser.isEnabled())
                .isTrue();

        assertThat(savedUser.getPasswordHash())
                .isNotEqualTo("StrongPassword123!");

        assertThat(passwordEncoder.matches(
                "StrongPassword123!",
                savedUser.getPasswordHash()
        )).isTrue();
    }

    @Test
    void shouldRejectRegistrationWithDuplicateUsername() throws Exception {

        User existingUser = new User(
                "TEST-EMP-003",
                "Existing User",
                "existing-user",
                passwordEncoder.encode("Existing123!"),
                Role.TECHNICIAN
        );

        userRepository.save(existingUser);

        RegisterRequest request = new RegisterRequest(
                "TEST-EMP-004",
                "New User",
                "existing-user",
                "StrongPassword123!",
                Role.TECHNICIAN
        );

        mockMvc.perform(post("/api/v1/users")
                        .with(jwt().authorities(
                                new SimpleGrantedAuthority("ADMIN")
                        ))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectRegistrationWithoutAdminAuthority() throws Exception {

        RegisterRequest request = new RegisterRequest(
                "TEST-EMP-002",
                "Unauthorized User",
                "unauthorized-user",
                "StrongPassword123!",
                Role.TECHNICIAN
        );

        mockMvc.perform(post("/api/v1/users")
                        .with(jwt().authorities(
                                new SimpleGrantedAuthority("TECHNICIAN")
                        ))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
