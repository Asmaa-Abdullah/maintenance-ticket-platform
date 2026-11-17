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

import static org.hamcrest.Matchers.emptyOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerMeIntegrationTest {

    private static final String USERNAME = "me-test-user";
    private static final String PASSWORD = "MeTest12345!";

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

        userRepository.findByUsername(USERNAME)
                .ifPresent(userRepository::delete);

        User user = new User(
                "TEST-EMP-001",
                "Integration Test User",
                USERNAME,
                passwordEncoder.encode(PASSWORD),
                Role.TECHNICIAN
        );

        userRepository.save(user);
    }

    @Test
    @DisplayName("should return current user when valid JWT is provided")
    void shouldReturnCurrentUserWhenValidJwtIsProvided() throws Exception {

        String accessToken = loginAndGetAccessToken();

        mockMvc.perform(
                        get("/api/v1/auth/me")
                                .header(
                                        "Authorization",
                                        "Bearer " + accessToken
                                )
                )
                .andExpect(status().isOk())
                .andExpect(content()
                        .contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username")
                        .value(USERNAME))
                .andExpect(jsonPath("$.role")
                        .value("TECHNICIAN"));
    }

    @Test
    @DisplayName("should reject access to current user without JWT")
    void shouldRejectAccessWithoutJwt() throws Exception {

        mockMvc.perform(
                        get("/api/v1/auth/me")
                )
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("should reject access to current user with invalid JWT")
    void shouldRejectAccessWithInvalidJwt() throws Exception {

        mockMvc.perform(
                        get("/api/v1/auth/me")
                                .header(
                                        "Authorization",
                                        "Bearer invalid-token"
                                )
                )
                .andExpect(status().isUnauthorized());
    }

    private String loginAndGetAccessToken() throws Exception {

        LoginRequest request = new LoginRequest(
                USERNAME,
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
                .andExpect(content()
                        .contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.accessToken")
                        .value(not(emptyOrNullString())))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode response = objectMapper.readTree(responseBody);

        return response
                .get("accessToken")
                .asText();
    }
}
