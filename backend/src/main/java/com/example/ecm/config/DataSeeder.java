package com.example.ecm.config;

import com.example.ecm.model.Role;
import com.example.ecm.model.User;
import com.example.ecm.model.UserRole;
import com.example.ecm.repository.RoleRepository;
import com.example.ecm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Datos iniciales. Se ejecuta en cada arranque y es idempotente:
 * 1. Crea los roles CLIENTE, VENDEDOR y ADMIN si no existen.
 * 2. Crea el usuario administrador si ADMIN_PASSWORD está definido y el usuario aún no existe.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    public static final String ROLE_CLIENTE = "CLIENTE";
    public static final String ROLE_VENDEDOR = "VENDEDOR";
    public static final String ROLE_ADMIN = "ADMIN";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.email:admin@ecm.com}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        List.of(ROLE_CLIENTE, ROLE_VENDEDOR, ROLE_ADMIN).forEach(this::ensureRole);
        seedAdmin();
    }

    private Role ensureRole(String name) {
        return roleRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            log.info("Seeder: rol {} creado", name);
            return roleRepository.save(role);
        });
    }

    private void seedAdmin() {
        if (userRepository.findByUsername(adminUsername).isPresent()) {
            return;
        }
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("Seeder: ADMIN_PASSWORD no está definido; no se creó el usuario administrador '{}'.",
                    adminUsername);
            return;
        }

        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setUserRoles(new ArrayList<>());

        admin.getUserRoles().add(buildUserRole(admin, ensureRole(ROLE_ADMIN)));
        admin.getUserRoles().add(buildUserRole(admin, ensureRole(ROLE_CLIENTE)));

        userRepository.save(admin);
        log.info("Seeder: usuario administrador '{}' creado", adminUsername);
    }

    private UserRole buildUserRole(User user, Role role) {
        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setAssignedAt(LocalDateTime.now());
        userRole.setStatus(true);
        return userRole;
    }
}
