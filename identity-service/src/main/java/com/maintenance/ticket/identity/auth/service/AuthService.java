package com.maintenance.ticket.identity.auth.service;

import com.maintenance.ticket.identity.auth.dto.LoginRequest;
import com.maintenance.ticket.identity.auth.dto.LoginResponse;
import com.maintenance.ticket.identity.common.exception.InvalidCredentialsException;
import com.maintenance.ticket.identity.entity.User;
import com.maintenance.ticket.identity.security.JwtService;
import com.maintenance.ticket.identity.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() ->
                        new InvalidCredentialsException(
                                "Invalid username or password"
                        )
                );

        if (!user.isEnabled()) {
            throw new InvalidCredentialsException(
                    "Invalid username or password"
            );
        }

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException(
                    "Invalid username or password"
            );
        }

        String accessToken = jwtService.generateToken(user);

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtService.getExpirationSeconds()
        );
    }
}
