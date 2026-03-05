package com.invoiceapp.dto.invoice;

import com.invoiceapp.entity.enums.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "Le statut est obligatoire")
    private InvoiceStatus status;
}
