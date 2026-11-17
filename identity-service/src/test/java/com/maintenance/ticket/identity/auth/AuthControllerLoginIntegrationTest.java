package com.maintenance.ticket.identity.auth;

import org.junit.jupiter.api.DisplayName;
import tools.jackson.databind.ObjectMapper;
import com.maintenance.ticket.identity.auth.dto.LoginRequest;
import com.maintenance.ticket.identity.entity.Role;
import com.maintenance.ticket.identity.entity.User;
import com.maintenance.ticket.identity.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerLoginIntegrationTest {

    private static final String USERNAME = "login-test-user";
    private static final String PASSWORD = "Login12345!";

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
    @DisplayName("should login successfully and return JWT")
    void shouldLoginSuccessfully() throws Exception {

        LoginRequest request = new LoginRequest(
                USERNAME,
                PASSWORD
        );

        mockMvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.accessToken")
                        .value(not(emptyOrNullString())))
                .andExpect(jsonPath("$.tokenType")
                        .value("Bearer"))
                .andExpect(jsonPath("$.expiresIn")
                        .isNumber());
    }

    @Test
    @DisplayName("should reject login with invalid password")
    void shouldRejectInvalidPassword() throws Exception {

        LoginRequest request = new LoginRequest(
                USERNAME,
                "WrongPassword123!"
        );

        mockMvc.perform(
                        post("/api/v1/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request))
                )
                .andDo(result ->
                        System.out.println(
                                "STATUS = " + result.getResponse().getStatus()
                        )
                )
                .andExpect(status().isUnauthorized());
    }
}
