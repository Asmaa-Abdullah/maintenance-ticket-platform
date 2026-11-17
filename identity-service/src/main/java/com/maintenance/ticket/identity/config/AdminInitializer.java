package com.maintenance.ticket.identity.config;

import com.maintenance.ticket.identity.entity.Role;
import com.maintenance.ticket.identity.entity.User;
import com.maintenance.ticket.identity.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final String username;
    private final String password;
    private final String employeeNumber;
    private final String fullName;

    public AdminInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.initial-admin.username:admin}") String username,
            @Value("${app.initial-admin.password:}") String password,
            @Value("${app.initial-admin.employee-number:ADMIN-001}") String employeeNumber,
            @Value("${app.initial-admin.full-name:System Administrator}") String fullName
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
        this.employeeNumber = employeeNumber;
        this.fullName = fullName;
    }

    @Override
    public void run(ApplicationArguments args) {

        if (userRepository.existsByUsername(username)) {
            log.info("Admin account already exists. No changes made.");
            return;
        }

        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "INITIAL_ADMIN_PASSWORD must be configured "
                            + "when the initial Admin account does not exist."
            );
        }

        if (userRepository.existsByEmployeeNumber(employeeNumber)) {
            throw new IllegalStateException(
                    "The configured initial Admin employee number already exists."
            );
        }

        User admin = new User(
                employeeNumber,
                fullName,
                username,
                passwordEncoder.encode(password),
                Role.ADMIN
        );

        userRepository.save(admin);

        log.info("Initial Admin account created successfully.");
    }
}

