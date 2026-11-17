package com.maintenance.ticket.identity.user.service;

import com.maintenance.ticket.identity.auth.dto.MeResponse;
import com.maintenance.ticket.identity.auth.dto.RegisterRequest;
import com.maintenance.ticket.identity.auth.dto.RegisterResponse;
import com.maintenance.ticket.identity.common.exception.UsernameAlreadyExistsException;
import com.maintenance.ticket.identity.entity.User;
import com.maintenance.ticket.identity.user.dto.TechnicianResponse;
import com.maintenance.ticket.identity.user.dto.UpdateUserRequest;
import com.maintenance.ticket.identity.user.dto.UserResponse;
import com.maintenance.ticket.identity.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }

        if (userRepository.existsByEmployeeNumber(request.employeeNumber())) {
            throw new IllegalArgumentException("Employee number already exists");
        }

        String passwordHash = passwordEncoder.encode(request.password());

        User user = new User(
                request.employeeNumber(),
                request.fullName(),
                request.username(),
                passwordHash,
                request.role()
        );

        User savedUser = userRepository.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getEmployeeNumber(),
                savedUser.getFullName(),
                savedUser.getUsername(),
                savedUser.getRole().name(),
                savedUser.isEnabled()
        );
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );

        return new MeResponse(
                user.getId(),
                user.getEmployeeNumber(),
                user.getFullName(),
                user.getUsername(),
                user.getRole().name()
        );
    }

    @Transactional
    public void resetAdminPassword() {

        User admin = userRepository.findByUsername("admin")
                .orElseThrow(() ->
                        new UsernameNotFoundException("Admin not found")
                );

        admin.changePassword(
                passwordEncoder.encode("Admin@12345")
        );

        userRepository.save(admin);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getEmployeeNumber(),
                        user.getFullName(),
                        user.getUsername(),
                        user.getRole().name(),
                        user.isEnabled()
                ))
                .toList();
    }
    
    @Transactional(readOnly = true)
    public List<TechnicianResponse> getTechnicians() {

        return userRepository.findAll()
                .stream()
                .filter(user -> user.getRole().name().equals("TECHNICIAN"))
                .filter(User::isEnabled)
                .map(user -> new TechnicianResponse(
                        user.getId(),
                        user.getFullName()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );

        return new UserResponse(
                user.getId(),
                user.getEmployeeNumber(),
                user.getFullName(),
                user.getUsername(),
                user.getRole().name(),
                user.isEnabled()
        );
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );

        if (userRepository.existsByUsernameAndIdNot(request.username(), id)) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }

        if (userRepository.existsByEmployeeNumberAndIdNot(request.employeeNumber(), id)) {
            throw new IllegalArgumentException("Employee number already exists");
        }

        user.updateDetails(
                request.employeeNumber(),
                request.fullName(),
                request.username(),
                request.role()
        );

        return new UserResponse(
                user.getId(),
                user.getEmployeeNumber(),
                user.getFullName(),
                user.getUsername(),
                user.getRole().name(),
                user.isEnabled()
        );
    }

    @Transactional
    public void disableUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found")
                );

        user.disable();
    }
}
