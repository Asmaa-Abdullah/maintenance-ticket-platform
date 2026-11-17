package com.maintenance.ticket.ticket.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class TicketNumberGenerator {

    private static final String PREFIX = "MT-";
    private static final String SEQUENCE_QUERY = "SELECT nextval('ticket_number_seq')";

    private final JdbcTemplate jdbcTemplate;

    public TicketNumberGenerator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String generate() {
        Long sequenceValue = jdbcTemplate.queryForObject(
                SEQUENCE_QUERY,
                Long.class
        );

        return PREFIX + sequenceValue;
    }
}