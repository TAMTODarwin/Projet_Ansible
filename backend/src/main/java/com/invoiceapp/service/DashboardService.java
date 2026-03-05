package com.invoiceapp.service;

import com.invoiceapp.dto.dashboard.DashboardStatsDto;
import com.invoiceapp.entity.Invoice;
import com.invoiceapp.entity.User;
import com.invoiceapp.entity.enums.InvoiceStatus;
import com.invoiceapp.repository.ClientRepository;
import com.invoiceapp.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;

    public DashboardStatsDto getStats(User user) {
        // Counts
        long totalClients = clientRepository.countByUserAndActiveTrue(user);
        long totalInvoices = invoiceRepository.countByUser(user);
        long draftCount = invoiceRepository.countByUserAndStatus(user, InvoiceStatus.DRAFT);
        long sentCount = invoiceRepository.countByUserAndStatus(user, InvoiceStatus.SENT);
        long paidCount = invoiceRepository.countByUserAndStatus(user, InvoiceStatus.PAID);
        long cancelledCount = invoiceRepository.countByUserAndStatus(user, InvoiceStatus.CANCELLED);

        // Overdue: mark overdue invoices and count
        LocalDate today = LocalDate.now();
        List<Invoice> overdueInvoices = invoiceRepository.findOverdueInvoices(user, today);
        long overdueCount = overdueInvoices.size();

        // Revenue
        BigDecimal totalRevenue = invoiceRepository.sumTotalByUserAndStatus(user, InvoiceStatus.PAID);
        BigDecimal pendingAmount = invoiceRepository.sumTotalByUserAndStatus(user, InvoiceStatus.SENT);
        BigDecimal overdueAmount = overdueInvoices.stream()
                .map(Invoice::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Monthly revenue (last 12 months)
        List<DashboardStatsDto.MonthlyRevenueDto> monthlyRevenue = buildMonthlyRevenue(user);

        // Status breakdown
        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        statusBreakdown.put("DRAFT", draftCount);
        statusBreakdown.put("SENT", sentCount);
        statusBreakdown.put("PAID", paidCount);
        statusBreakdown.put("OVERDUE", overdueCount);
        statusBreakdown.put("CANCELLED", cancelledCount);

        // Recent invoices
        List<DashboardStatsDto.RecentInvoiceDto> recentInvoices = invoiceRepository
                .findTop5ByUserOrderByCreatedAtDesc(user, PageRequest.of(0, 5))
                .stream()
                .map(inv -> DashboardStatsDto.RecentInvoiceDto.builder()
                        .id(inv.getId())
                        .invoiceNumber(inv.getInvoiceNumber())
                        .clientName(inv.getClient().getName())
                        .total(inv.getTotal())
                        .status(inv.getStatus().name())
                        .issueDate(inv.getIssueDate().toString())
                        .build())
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .totalClients(totalClients)
                .totalInvoices(totalInvoices)
                .draftCount(draftCount)
                .sentCount(sentCount)
                .paidCount(paidCount)
                .overdueCount(overdueCount)
                .cancelledCount(cancelledCount)
                .totalRevenue(totalRevenue)
                .pendingAmount(pendingAmount)
                .overdueAmount(overdueAmount)
                .monthlyRevenue(monthlyRevenue)
                .statusBreakdown(statusBreakdown)
                .recentInvoices(recentInvoices)
                .build();
    }

    private List<DashboardStatsDto.MonthlyRevenueDto> buildMonthlyRevenue(User user) {
        List<DashboardStatsDto.MonthlyRevenueDto> result = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 11; i >= 0; i--) {
            LocalDate date = now.minusMonths(i);
            BigDecimal amount = invoiceRepository.sumPaidByUserAndYearAndMonth(
                    user, date.getYear(), date.getMonthValue());
            String monthLabel = Month.of(date.getMonthValue())
                    .getDisplayName(TextStyle.SHORT, Locale.FRENCH) + " " + date.getYear();
            result.add(DashboardStatsDto.MonthlyRevenueDto.builder()
                    .month(monthLabel)
                    .amount(amount != null ? amount : BigDecimal.ZERO)
                    .build());
        }
        return result;
    }
}
