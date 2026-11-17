CREATE TABLE assignment
(
    ticket_id     UUID PRIMARY KEY,
    technician_id BIGINT NOT NULL,
    assigned_at   TIMESTAMP WITH TIME ZONE NOT NULL
);