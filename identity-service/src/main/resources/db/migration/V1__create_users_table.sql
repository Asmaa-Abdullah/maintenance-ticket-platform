CREATE TABLE users
(
    id              BIGSERIAL PRIMARY KEY,

    employee_number VARCHAR(30)  NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    username        VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,

    role            VARCHAR(20)  NOT NULL,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,

    CONSTRAINT uk_users_username
        UNIQUE (username),

    CONSTRAINT uk_users_employee_number
        UNIQUE (employee_number),

    CONSTRAINT chk_users_role
        CHECK (role IN ('ADMIN', 'TECHNICIAN', 'INSPECTOR'))
);
