package com.invoiceapp.repository;

import com.invoiceapp.entity.Invoice;
import com.invoiceapp.entity.User;
import com.invoiceapp.entity.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

@Query("SELECT DISTINCT i FROM Invoice i JOIN FETCH i.client WHERE i.user = :user")
    Page<Invoice> findByUser(@Param("user") User user, Pageable pageable);

    @Query("SELECT i FROM Invoice i JOIN FETCH i.client LEFT JOIN FETCH i.items WHERE i.id = :id AND i.user = :user")
    Optional<Invoice> findByIdAndUser(@Param("id") Long id, @Param("user") User user);

    Optional<Invoice> findByInvoiceNumberAndUser(String invoiceNumber, User user);

    boolean existsByInvoiceNumber(String invoiceNumber);

    @Query("SELECT DISTINCT i FROM Invoice i JOIN FETCH i.client WHERE i.user = :user AND i.status = :status")
    Page<Invoice> findByUserAndStatus(@Param("user") User user, @Param("status") InvoiceStatus status, Pageable pageable);

    @Query("SELECT DISTINCT i FROM Invoice i JOIN FETCH i.client WHERE i.user = :user AND " +
           "(LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.client.name) LIKE LOWER(CONCAT('%', :search, '%')))") 
    Page<Invoice> searchInvoices(@Param("user") User user, @Param("search") String search, Pageable pageable);

    long countByUser(User user);

    long countByUserAndStatus(User user, InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.user = :user AND i.status = :status")
    BigDecimal sumTotalByUserAndStatus(@Param("user") User user, @Param("status") InvoiceStatus status);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.user = :user AND i.status = 'PAID' AND " +
           "YEAR(i.issueDate) = :year AND MONTH(i.issueDate) = :month")
    BigDecimal sumPaidByUserAndYearAndMonth(@Param("user") User user, @Param("year") int year, @Param("month") int month);

    @Query("SELECT i FROM Invoice i WHERE i.user = :user AND i.status = 'SENT' AND i.dueDate < :today")
    List<Invoice> findOverdueInvoices(@Param("user") User user, @Param("today") LocalDate today);

    @Query("SELECT i FROM Invoice i WHERE i.user = :user ORDER BY i.createdAt DESC")
    List<Invoice> findTop5ByUserOrderByCreatedAtDesc(@Param("user") User user, Pageable pageable);
}
