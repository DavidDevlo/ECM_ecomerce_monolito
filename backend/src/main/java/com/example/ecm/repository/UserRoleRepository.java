package com.example.ecm.repository;

import com.example.ecm.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    boolean existsByRoleId(Long roleId);
}
