CREATE TABLE tickets
(
    id            UUID PRIMARY KEY,

    ticket_number VARCHAR(20)  NOT NULL UNIQUE,

    technician_id UUID,

    title         VARCHAR(255) NOT NULL,
    description   TEXT         NOT NULL,

    status        VARCHAR(20)  NOT NULL,
    priority      VARCHAR(20)  NOT NULL,

    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL,

    CONSTRAINT chk_tickets_status
        CHECK (status IN (
                          'OPEN',
                          'ASSIGNED',
                          'IN_PROGRESS',
                          'RESOLVED'
            )),

    CONSTRAINT chk_tickets_priority
        CHECK (priority IN (
                            'LOW',
                            'MEDIUM',
                            'HIGH',
                            'CRITICAL'
            ))
);