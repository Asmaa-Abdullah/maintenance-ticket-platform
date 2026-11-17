package com.maintenance.assignment.assignment.controller;

import com.maintenance.assignment.assignment.entity.Assignment;
import com.maintenance.assignment.assignment.repository.AssignmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

@SpringBootTest
@AutoConfigureMockMvc
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class AssignmentControllerIntegrationTest {

    private final MockMvc mockMvc;
    private final AssignmentRepository assignmentRepository;

    AssignmentControllerIntegrationTest(
            MockMvc mockMvc,
            AssignmentRepository assignmentRepository
    ) {
        this.mockMvc = mockMvc;
        this.assignmentRepository = assignmentRepository;
    }

    @BeforeEach
    void setUp() {
        assignmentRepository.deleteAll();
    }

    @Test
    void shouldAssignTicket() throws Exception {

        UUID ticketId = UUID.randomUUID();
        Long technicianId = 15L;

        String requestBody = """
                {
                    "ticketId": "%s",
                    "technicianId": %d
                }
                """.formatted(ticketId, technicianId);

        mockMvc.perform(
                        post("/api/v1/assignments")
                                .with(jwt()
                                        .jwt(token -> token
                                                .claim("role", "ADMIN")
                                                .claim("userId", "1")
                                        )
                                        .authorities(new SimpleGrantedAuthority("ADMIN"))
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON
                ))
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.ticketId")
                        .value(ticketId.toString()))
                .andExpect(jsonPath("$.technicianId")
                        .value(technicianId.intValue()))
                .andExpect(jsonPath("$.assignedAt").exists());
    }

    @Test
    void shouldReassignTicketToAnotherTechnician() throws Exception {

        UUID ticketId = UUID.randomUUID();
        Long firstTechnicianId = 15L;
        Long secondTechnicianId = 20L;

        assignmentRepository.save(
                new Assignment(ticketId, firstTechnicianId)
        );

        String requestBody = """
                {
                    "ticketId": "%s",
                    "technicianId": %d
                }
                """.formatted(ticketId, secondTechnicianId);

        mockMvc.perform(
                        post("/api/v1/assignments")
                                .with(jwt()
                                        .jwt(token -> token
                                                .claim("role", "ADMIN")
                                                .claim("userId", "1")
                                        )
                                        .authorities(new SimpleGrantedAuthority("ADMIN"))
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.ticketId").value(ticketId.toString()))
                .andExpect(jsonPath("$.technicianId").value(secondTechnicianId));
    }
}
