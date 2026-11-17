package com.maintenance.ticket.ticket.controller;

import com.maintenance.ticket.ticket.entity.Ticket;
import com.maintenance.ticket.ticket.entity.TicketPriority;
import com.maintenance.ticket.ticket.entity.TicketStatus;
import com.maintenance.ticket.ticket.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.UUID;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class TicketControllerIntegrationTest {

    private final MockMvc mockMvc;
    private final TicketRepository ticketRepository;

    TicketControllerIntegrationTest(
            MockMvc mockMvc,
            TicketRepository ticketRepository
    ) {
        this.mockMvc = mockMvc;
        this.ticketRepository = ticketRepository;
    }

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
    }

    @Test
    void shouldCreateTicket() throws Exception {

        String requestBody = """
                {
                    "title": "Air conditioner is not working",
                    "description": "The air conditioner in room 201 stopped working.",
                    "priority": "HIGH"
                }
                """;

        mockMvc.perform(
                        post("/api/v1/tickets")
                                .with(user("test-user").authorities(
                                        () -> "INSPECTOR"
                                ))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.ticketNumber").exists())
                .andExpect(jsonPath("$.ticketNumber").value(startsWith("MT-")))
                .andExpect(jsonPath("$.title").value("Air conditioner is not working"))
                .andExpect(jsonPath("$.description").value("The air conditioner in room 201 stopped working."))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void shouldGetTicketById() throws Exception {

        Ticket ticket = new Ticket(
                "MT-1001",
                "Air conditioner is not working",
                "The air conditioner in room 201 stopped working.",
                TicketPriority.HIGH,
                "test-user"
        );

        Ticket savedTicket = ticketRepository.save(ticket);

        mockMvc.perform(
                        get("/api/v1/tickets/{id}", savedTicket.getId())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedTicket.getId().toString()))
                .andExpect(jsonPath("$.ticketNumber").value("MT-1001"))
                .andExpect(jsonPath("$.title").value("Air conditioner is not working"))
                .andExpect(jsonPath("$.description").value("The air conditioner in room 201 stopped working."))
                .andExpect(jsonPath("$.priority").value("HIGH"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void shouldReturn404WhenTicketDoesNotExist() throws Exception {

        UUID nonExistingTicketId = UUID.randomUUID();

        mockMvc.perform(
                        get("/api/v1/tickets/{id}", nonExistingTicketId)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("TICKET_NOT_FOUND"))
                .andExpect(jsonPath("$.message")
                        .value("Ticket not found with id: " + nonExistingTicketId))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void shouldGetAvailableTickets() throws Exception {

        Ticket openTicket1 = new Ticket(
                "MT-1001",
                "Air conditioner is not working",
                "The air conditioner in room 201 stopped working.",
                TicketPriority.HIGH,
                "test-user"
        );

        Ticket openTicket2 = new Ticket(
                "MT-1002",
                "Water leakage in bathroom",
                "There is a water leak under the bathroom sink.",
                TicketPriority.CRITICAL,
                "test-user"
        );

        Ticket assignedTicket = new Ticket(
                "MT-1003",
                "Broken elevator",
                "The elevator is not working on the third floor.",
                TicketPriority.MEDIUM,
                "test-user"
        );

        assignedTicket.updateStatus(TicketStatus.ASSIGNED);

        ticketRepository.save(openTicket1);
        ticketRepository.save(openTicket2);
        ticketRepository.save(assignedTicket);

        mockMvc.perform(
                        get("/api/v1/tickets")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].status").value("OPEN"))
                .andExpect(jsonPath("$[1].status").value("OPEN"));
    }

    @Test
    void shouldAssignTicket() throws Exception {

        Ticket ticket = new Ticket(
                "MT-1001",
                "Air conditioner is not working",
                "The air conditioner in room 201 stopped working.",
                TicketPriority.HIGH,
                "test-user"
        );

        Ticket savedTicket = ticketRepository.save(ticket);

        Long technicianId = 15L;

        String requestBody = """
                {
                    "technicianId": 15
                }
                """;

        mockMvc.perform(
                        post("/api/v1/tickets/{id}/assign", savedTicket.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedTicket.getId().toString()))
                .andExpect(jsonPath("$.ticketNumber").value("MT-1001"))
                .andExpect(jsonPath("$.technicianId").value(technicianId.toString()))
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.priority").value("HIGH"));
    }

    @Test
    void shouldReturn404WhenAssigningNonExistingTicket() throws Exception {

        UUID ticketId = UUID.randomUUID();

        String requestBody = """
                {
                    "technicianId": 15
                }
                """;

        mockMvc.perform(
                        post("/api/v1/tickets/{id}/assign", ticketId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("TICKET_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Ticket not found with id: " + ticketId));
    }

    @Test
    void shouldReturn409WhenAssigningAlreadyAssignedTicket() throws Exception {

        Ticket ticket = new Ticket(
                "MT-1001",
                "Elevator is not working",
                "The elevator stopped working on the third floor.",
                TicketPriority.CRITICAL,
                "test-user"
        );

        Long technicianId = 15L;

        ticket.assignTo(technicianId);

        Ticket savedTicket = ticketRepository.save(ticket);

        String requestBody = """
                {
                    "technicianId": 15
                }
                """;

        mockMvc.perform(
                        post("/api/v1/tickets/{id}/assign", savedTicket.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("TICKET_ALREADY_ASSIGNED"))
                .andExpect(jsonPath("$.message")
                        .value(
                                "Ticket is already assigned: "
                                        + savedTicket.getId()
                        ));
    }

    @Test
    void shouldUpdateTicket() throws Exception {

        Ticket ticket = new Ticket(
                "MT-1001",
                "Air conditioner is not working",
                "The air conditioner in room 201 stopped working.",
                TicketPriority.HIGH,
                "test-user"
        );

        Ticket savedTicket = ticketRepository.save(ticket);

        String requestBody = """
                {
                    "title": "Air conditioner requires replacement",
                    "description": "The air conditioner in room 201 requires replacement.",
                    "priority": "CRITICAL"
                }
                """;

        mockMvc.perform(
                        patch("/api/v1/tickets/{id}", savedTicket.getId())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedTicket.getId().toString()))
                .andExpect(jsonPath("$.ticketNumber").value("MT-1001"))
                .andExpect(jsonPath("$.title").value("Air conditioner requires replacement"))
                .andExpect(jsonPath("$.description").value("The air conditioner in room 201 requires replacement."))
                .andExpect(jsonPath("$.priority").value("CRITICAL"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void shouldReturn404WhenUpdatingNonExistingTicket() throws Exception {

        UUID ticketId = UUID.randomUUID();

        String requestBody = """
                {
                    "title": "Updated title",
                    "description": "Updated description",
                    "priority": "HIGH"
                }
                """;

        mockMvc.perform(
                        patch("/api/v1/tickets/{id}", ticketId)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("TICKET_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Ticket not found with id: " + ticketId));
    }

    @Test
    void shouldChangeTicketStatus() throws Exception {

        Ticket ticket = new Ticket(
                "MT-1001",
                "Water leak",
                "There is a water leak under the sink.",
                TicketPriority.HIGH,
                "test-user"
        );

        Ticket savedTicket = ticketRepository.save(ticket);

        String requestBody = """
                {
                    "status": "IN_PROGRESS"
                }
                """;

        mockMvc.perform(
                        patch("/api/v1/tickets/{id}/status", savedTicket.getId())
                                .with(jwt().jwt(token -> token
                                        .claim("role", "ADMIN")
                                        .claim("userId", "1")
                                ).authorities(
                                        new SimpleGrantedAuthority("ADMIN")
                                ))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedTicket.getId().toString()))
                .andExpect(jsonPath("$.ticketNumber").value("MT-1001"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.priority").value("HIGH"));
    }

    @Test
    void shouldReturn404WhenChangingStatusOfNonExistingTicket() throws Exception {

        UUID ticketId = UUID.randomUUID();

        String requestBody = """
                {
                    "status": "IN_PROGRESS"
                }
                """;

        mockMvc.perform(
                        patch("/api/v1/tickets/{id}/status", ticketId)
                                .with(jwt().jwt(token -> token
                                        .claim("role", "ADMIN")
                                        .claim("userId", "1")
                                ).authorities(
                                        new SimpleGrantedAuthority("ADMIN")
                                ))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody)
                )
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("TICKET_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Ticket not found with id: " + ticketId));
    }
}