package com.invoiceapp.service;

import com.invoiceapp.dto.invoice.InvoiceDto;
import com.invoiceapp.dto.invoice.InvoiceItemDto;
import com.invoiceapp.dto.invoice.StatusUpdateRequest;
import com.invoiceapp.entity.Client;
import com.invoiceapp.entity.Invoice;
import com.invoiceapp.entity.InvoiceItem;
import com.invoiceapp.entity.User;
import com.invoiceapp.entity.enums.InvoiceStatus;
import com.invoiceapp.repository.ClientRepository;
import com.invoiceapp.repository.InvoiceRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;

    public Page<InvoiceDto> getInvoices(User user, String search, InvoiceStatus status, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return invoiceRepository.searchInvoices(user, search, pageable).map(this::mapToDto);
        }
        if (status != null) {
            return invoiceRepository.findByUserAndStatus(user, status, pageable).map(this::mapToDto);
        }
        return invoiceRepository.findByUser(user, pageable).map(this::mapToDto);
    }

    public InvoiceDto getInvoiceById(Long id, User user) {
        return invoiceRepository.findByIdAndUser(id, user)
                .map(this::mapToDto)
                .orElseThrow(() -> new EntityNotFoundException("Facture non trouvée avec l'id: " + id));
    }

    public InvoiceDto createInvoice(InvoiceDto dto, User user) {
        Client client = clientRepository.findByIdAndUser(dto.getClientId(), user)
                .orElseThrow(() -> new EntityNotFoundException("Client non trouvé"));

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .client(client)
                .user(user)
                .status(InvoiceStatus.DRAFT)
                .issueDate(dto.getIssueDate())
                .dueDate(dto.getDueDate())
                .taxRate(dto.getTaxRate() != null ? dto.getTaxRate() : new BigDecimal("20.00"))
                .notes(dto.getNotes())
                .termsAndConditions(dto.getTermsAndConditions())
                .build();

        List<InvoiceItem> items = dto.getItems().stream()
                .map(itemDto -> {
                    InvoiceItem item = mapItemToEntity(itemDto);
                    item.setInvoice(invoice);
                    return item;
                }).collect(Collectors.toList());

        invoice.getItems().addAll(items);
        calculateTotals(invoice);

        return mapToDto(invoiceRepository.save(invoice));
    }

    public InvoiceDto updateInvoice(Long id, InvoiceDto dto, User user) {
        Invoice invoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EntityNotFoundException("Facture non trouvée avec l'id: " + id));

        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new RuntimeException("Impossible de modifier une facture payée ou annulée");
        }

        Client client = clientRepository.findByIdAndUser(dto.getClientId(), user)
                .orElseThrow(() -> new EntityNotFoundException("Client non trouvé"));

        invoice.setClient(client);
        invoice.setIssueDate(dto.getIssueDate());
        invoice.setDueDate(dto.getDueDate());
        invoice.setTaxRate(dto.getTaxRate() != null ? dto.getTaxRate() : new BigDecimal("20.00"));
        invoice.setNotes(dto.getNotes());
        invoice.setTermsAndConditions(dto.getTermsAndConditions());

        invoice.getItems().clear();
        List<InvoiceItem> items = dto.getItems().stream()
                .map(itemDto -> {
                    InvoiceItem item = mapItemToEntity(itemDto);
                    item.setInvoice(invoice);
                    return item;
                }).collect(Collectors.toList());
        invoice.getItems().addAll(items);
        calculateTotals(invoice);

        return mapToDto(invoiceRepository.save(invoice));
    }

    public InvoiceDto updateStatus(Long id, StatusUpdateRequest request, User user) {
        Invoice invoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EntityNotFoundException("Facture non trouvée avec l'id: " + id));
        invoice.setStatus(request.getStatus());
        return mapToDto(invoiceRepository.save(invoice));
    }

    public void deleteInvoice(Long id, User user) {
        Invoice invoice = invoiceRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new EntityNotFoundException("Facture non trouvée avec l'id: " + id));
        invoiceRepository.delete(invoice);
    }

    private void calculateTotals(Invoice invoice) {
        BigDecimal subtotal = invoice.getItems().stream()
                .map(item -> item.getQuantity().multiply(item.getUnitPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        invoice.setSubtotal(subtotal);

        BigDecimal taxAmount = subtotal.multiply(invoice.getTaxRate())
                .divide(new BigDecimal("100"));
        invoice.setTaxAmount(taxAmount);
        invoice.setTotal(subtotal.add(taxAmount));
    }

    private String generateInvoiceNumber() {
        int year = Year.now().getValue();
        long count = invoiceRepository.count() + 1;
        return String.format("FAC-%d-%04d", year, count);
    }

    private InvoiceItem mapItemToEntity(InvoiceItemDto dto) {
        InvoiceItem item = InvoiceItem.builder()
                .description(dto.getDescription())
                .unit(dto.getUnit())
                .quantity(dto.getQuantity())
                .unitPrice(dto.getUnitPrice())
                .total(dto.getQuantity().multiply(dto.getUnitPrice()))
                .build();
        return item;
    }

    public InvoiceDto mapToDto(Invoice invoice) {
        return InvoiceDto.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .clientId(invoice.getClient().getId())
                .clientName(invoice.getClient().getName())
                .clientEmail(invoice.getClient().getEmail())
                .clientCompany(invoice.getClient().getCompany())
                .clientAddress(buildClientAddress(invoice.getClient()))
                .status(invoice.getStatus())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .taxRate(invoice.getTaxRate())
                .taxAmount(invoice.getTaxAmount())
                .total(invoice.getTotal())
                .notes(invoice.getNotes())
                .termsAndConditions(invoice.getTermsAndConditions())
                .items(invoice.getItems().stream().map(this::mapItemToDto).collect(Collectors.toList()))
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }

    private InvoiceItemDto mapItemToDto(InvoiceItem item) {
        return InvoiceItemDto.builder()
                .id(item.getId())
                .description(item.getDescription())
                .unit(item.getUnit())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .total(item.getTotal())
                .build();
    }

    private String buildClientAddress(Client client) {
        StringBuilder sb = new StringBuilder();
        if (client.getAddress() != null) sb.append(client.getAddress());
        if (client.getPostalCode() != null) sb.append(", ").append(client.getPostalCode());
        if (client.getCity() != null) sb.append(" ").append(client.getCity());
        if (client.getCountry() != null) sb.append(", ").append(client.getCountry());
        return sb.toString();
    }
}
