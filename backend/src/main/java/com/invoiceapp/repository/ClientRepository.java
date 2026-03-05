package com.invoiceapp.repository;

import com.invoiceapp.entity.Client;
import com.invoiceapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    Page<Client> findByUserAndActiveTrue(User user, Pageable pageable);
    List<Client> findByUserAndActiveTrue(User user);
    Optional<Client> findByIdAndUser(Long id, User user);
    boolean existsByEmailAndUser(String email, User user);

    @Query("SELECT c FROM Client c WHERE c.user = :user AND c.active = true AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.company) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Client> searchClients(@Param("user") User user, @Param("search") String search, Pageable pageable);

    long countByUserAndActiveTrue(User user);
}
