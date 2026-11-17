package com.maintenance.ticket.identity.common.exception;

public class UsernameAlreadyExistsException extends RuntimeException {

    public UsernameAlreadyExistsException(String message) {
        super("Username already exists: " + message);
    }
}
