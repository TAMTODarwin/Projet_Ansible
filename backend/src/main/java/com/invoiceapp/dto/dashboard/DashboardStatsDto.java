package com.invoiceapp.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatsDto {

    // Summary cards
    private long totalClients;
    private long totalInvoices;
    private long draftCount;
    private long sentCount;
    private long paidCount;
    private long overdueCount;
    private long cancelledCount;

    // Revenue
    private BigDecimal totalRevenue;
    private BigDecimal pendingAmount;
    private BigDecimal overdueAmount;

    // Monthly revenue for chart (last 12 months)
    private List<MonthlyRevenueDto> monthlyRevenue;

    // Status breakdown for pie chart
    private Map<String, Long> statusBreakdown;

    // Recent invoices
    private List<RecentInvoiceDto> recentInvoices;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonthlyRevenueDto {
        private String month;
        private BigDecimal amount;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecentInvoiceDto {
        private Long id;
        private String invoiceNumber;
        private String clientName;
        private BigDecimal total;
        private String status;
        private String issueDate;
    }
}
