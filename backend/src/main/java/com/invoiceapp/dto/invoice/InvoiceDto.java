package com.invoiceapp.dto.invoice;

import com.invoiceapp.entity.enums.InvoiceStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceDto {
    private Long id;
    private String invoiceNumber;

    @NotNull(message = "Le client est obligatoire")
    private Long clientId;
    private String clientName;
    private String clientEmail;
    private String clientCompany;
    private String clientAddress;

    private InvoiceStatus status;

    @NotNull(message = "La date d'émission est obligatoire")
    private LocalDate issueDate;

    @NotNull(message = "La date d'échéance est obligatoire")
    private LocalDate dueDate;

    private BigDecimal subtotal;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private String notes;
    private String termsAndConditions;

    @NotEmpty(message = "La facture doit contenir au moins un article")
    @Valid
    private List<InvoiceItemDto> items;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
