package com.invoiceapp.dto.invoice;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceItemDto {
    private Long id;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    private String unit;

    @NotNull(message = "La quantité est obligatoire")
    @DecimalMin(value = "0.01", message = "La quantité doit être supérieure à 0")
    private BigDecimal quantity;

    @NotNull(message = "Le prix unitaire est obligatoire")
    @DecimalMin(value = "0.00", message = "Le prix unitaire ne peut pas être négatif")
    private BigDecimal unitPrice;

    private BigDecimal total;
}
