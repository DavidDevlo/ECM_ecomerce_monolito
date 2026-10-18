package com.example.ecm.repository;

import com.example.ecm.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface  UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u " +
            "LEFT JOIN FETCH u.userRoles ur " +
            "LEFT JOIN FETCH ur.role " +
            "WHERE u.username = :username")
    Optional<User> findByUsernameWithRoles(@Param("username") String username);
    Optional<User> findByUsername(String username);



}