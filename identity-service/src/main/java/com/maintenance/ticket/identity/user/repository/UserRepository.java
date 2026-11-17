package com.maintenance.ticket.identity.user.repository;

import com.maintenance.ticket.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmployeeNumber(String employeeNumber);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmployeeNumberAndIdNot(String employeeNumber, Long id);
}