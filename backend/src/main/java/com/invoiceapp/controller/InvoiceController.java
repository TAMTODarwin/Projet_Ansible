package com.invoiceapp.controller;

import com.invoiceapp.dto.invoice.InvoiceDto;
import com.invoiceapp.dto.invoice.StatusUpdateRequest;
import com.invoiceapp.entity.User;
import com.invoiceapp.entity.enums.InvoiceStatus;
import com.invoiceapp.service.InvoiceService;
import com.invoiceapp.service.PdfService;
import com.itextpdf.text.DocumentException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", exposedHeaders = "Content-Disposition", allowCredentials = "true")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PdfService pdfService;

    @GetMapping
    public ResponseEntity<Page<InvoiceDto>> getInvoices(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction dir = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(dir, sort));
        return ResponseEntity.ok(invoiceService.getInvoices(user, search, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDto> getInvoice(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id, user));
    }

    @PostMapping
    public ResponseEntity<InvoiceDto> createInvoice(
            @Valid @RequestBody InvoiceDto dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(invoiceService.createInvoice(dto, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceDto> updateInvoice(
            @PathVariable Long id,
            @Valid @RequestBody InvoiceDto dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, dto, user));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InvoiceDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(invoiceService.updateStatus(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id, @AuthenticationPrincipal User user) {
        invoiceService.deleteInvoice(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id, @AuthenticationPrincipal User user) {
        InvoiceDto invoice = invoiceService.getInvoiceById(id, user);
        try {
            byte[] pdf = pdfService.generateInvoicePdf(invoice, user);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                ContentDisposition.attachment()
                    .filename(invoice.getInvoiceNumber() + ".pdf", StandardCharsets.UTF_8)
                    .build()
            );
            return ResponseEntity.ok().headers(headers).body(pdf);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
