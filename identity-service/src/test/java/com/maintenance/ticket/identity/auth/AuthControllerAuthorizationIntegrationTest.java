package com.maintenance.ticket.identity.auth;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.maintenance.ticket.identity.auth.dto.LoginRequest;
import com.maintenance.ticket.identity.entity.Role;
import com.maintenance.ticket.identity.entity.User;
import com.maintenance.ticket.identity.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.web.bind.annotation.*;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerAuthorizationIntegrationTest {

    private static final String TECHNICIAN_USERNAME =
            "authorization-technician";

    private static final String ADMIN_USERNAME =
            "authorization-admin";

    private static final String PASSWORD =
            "Authorization12345!";

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

        userRepository.findByUsername(TECHNICIAN_USERNAME)
                .ifPresent(userRepository::delete);

        userRepository.findByUsername(ADMIN_USERNAME)
                .ifPresent(userRepository::delete);

        userRepository.save(
                new User(
                        "TEST-TECH-001",
                        "Authorization Technician",
                        TECHNICIAN_USERNAME,
                        passwordEncoder.encode(PASSWORD),
                        Role.TECHNICIAN
                )
        );

        userRepository.save(
                new User(
                        "TEST-ADMIN-001",
                        "Authorization Admin",
                        ADMIN_USERNAME,
                        passwordEncoder.encode(PASSWORD),
                        Role.ADMIN
                )
        );
    }

    @Test
    @DisplayName("should reject admin endpoint without authentication")
    void shouldRejectAdminEndpointWithoutAuthentication()
            throws Exception {

        mockMvc.perform(
                        get("/api/v1/auth/admin")
                )
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("should reject admin endpoint for technician")
    void shouldRejectAdminEndpointForTechnician()
            throws Exception {

        String accessToken =
                loginAndGetAccessToken(TECHNICIAN_USERNAME);

        mockMvc.perform(
                        get("/api/v1/auth/admin")
                                .header(
                                        "Authorization",
                                        "Bearer " + accessToken
                                )
                )
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should allow admin endpoint for admin")
    void shouldAllowAdminEndpointForAdmin()
            throws Exception {

        String accessToken =
                loginAndGetAccessToken(ADMIN_USERNAME);

        mockMvc.perform(
                        get("/api/v1/auth/admin")
                                .header(
                                        "Authorization",
                                        "Bearer " + accessToken
                                )
                )
                .andExpect(status().isOk());
    }

    private String loginAndGetAccessToken(
            String username
    ) throws Exception {

        LoginRequest request = new LoginRequest(
                username,
                PASSWORD
        );

        String responseBody = mockMvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(request)
                                )
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode response =
                objectMapper.readTree(responseBody);

        return response
                .get("accessToken")
                .asText();
    }
}
