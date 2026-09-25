package com.startx.repository;

import com.startx.entity.AuthorizedEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthorizedEmailRepository extends JpaRepository<AuthorizedEmail, UUID> {

    Optional<AuthorizedEmail> findByEmail(String email);

    List<AuthorizedEmail> findByRole(String role);

    List<AuthorizedEmail> findByStatus(String status);

    boolean existsByEmail(String email);

    @Modifying
    @Transactional
    @Query("UPDATE AuthorizedEmail ae SET ae.status = :status, ae.linkedUserId = :linkedUserId WHERE ae.email = :email")
    int linkUser(@Param("email") String email,
                 @Param("linkedUserId") UUID linkedUserId,
                 @Param("status") String status);
}
