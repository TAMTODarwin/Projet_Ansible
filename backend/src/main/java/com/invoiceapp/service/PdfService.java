package com.invoiceapp.service;

import com.invoiceapp.dto.invoice.InvoiceDto;
import com.invoiceapp.dto.invoice.InvoiceItemDto;
import com.invoiceapp.entity.User;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfService {

    private static final Font TITLE_FONT = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD, new BaseColor(37, 99, 235));
    private static final Font HEADER_FONT = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE);
    private static final Font BODY_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(55, 65, 81));
    private static final Font LABEL_FONT = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, new BaseColor(107, 114, 128));
    private static final Font VALUE_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, new BaseColor(17, 24, 39));
    private static final Font TOTAL_FONT = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, new BaseColor(37, 99, 235));

    private static final BaseColor PRIMARY_COLOR = new BaseColor(37, 99, 235);
    private static final BaseColor LIGHT_BLUE = new BaseColor(239, 246, 255);
    private static final BaseColor LIGHT_GRAY = new BaseColor(249, 250, 251);
    private static final BaseColor BORDER_COLOR = new BaseColor(229, 231, 235);

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generateInvoicePdf(InvoiceDto invoice, User user) throws DocumentException {
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, baos);

        document.open();

        // Header
        addHeader(document, invoice, user);

        // Client & Invoice Info table
        addInfoSection(document, invoice);

        document.add(Chunk.NEWLINE);

        // Items table
        addItemsTable(document, invoice);

        document.add(Chunk.NEWLINE);

        // Totals
        addTotals(document, invoice);

        // Payment Method
        if (user.getPaymentMethod() != null && !user.getPaymentMethod().isBlank()) {
            document.add(Chunk.NEWLINE);
            Paragraph paymentTitle = new Paragraph("MÉTHODE DE PAIEMENT", LABEL_FONT);
            document.add(paymentTitle);
            Paragraph paymentMethod = new Paragraph(user.getPaymentMethod(), BODY_FONT);
            document.add(paymentMethod);
        }

        // Notes
        if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
            addNotes(document, invoice.getNotes());
        }

        // Footer
        addFooter(writer, document);

        document.close();
        return baos.toByteArray();
    }

    private void addHeader(Document document, InvoiceDto invoice, User user) throws DocumentException {
        // Creation d'une table a 3 colonnes
        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        // Ex: Gauche 35%, Milieu 35%, Droite 30%
        headerTable.setWidths(new float[]{35, 35, 30});

        // --------------------------------------------------------
        // 1) Left Cell : Title, Invoice Num, Company, Dir, Email, Phone
        // --------------------------------------------------------
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(10);

        Paragraph title = new Paragraph("FACTURE", TITLE_FONT);
        leftCell.addElement(title);

        Paragraph invoiceNum = new Paragraph(invoice.getInvoiceNumber(),
                new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, new BaseColor(107, 114, 128)));
        leftCell.addElement(invoiceNum);

        leftCell.addElement(new Paragraph(" "));

        // Emmetteur Info
        // 1. Nom de l'entreprise suivi du statut
        String companyName = (user.getCompany() != null && !user.getCompany().isBlank()) ? user.getCompany() : (user.getFirstName() + " " + user.getLastName());
        if (user.getCompanyType() != null && !user.getCompanyType().equals("NONE")) {
            String status = user.getCompanyType();
            if ("MICRO".equals(status)) status = "EI";
            companyName += " " + status;
        }
        leftCell.addElement(new Paragraph(companyName, new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, new BaseColor(17, 24, 39))));

        // 2. Nom du directeur
        leftCell.addElement(new Paragraph(user.getFirstName() + " " + user.getLastName(), BODY_FONT));

        // 3. Email
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            leftCell.addElement(new Paragraph(user.getEmail(), BODY_FONT));
        }

        // 4. Téléphone
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            leftCell.addElement(new Paragraph(user.getPhone(), BODY_FONT));
        }

        headerTable.addCell(leftCell);

        // --------------------------------------------------------
        // 2) Middle Cell : Address
        // --------------------------------------------------------
        PdfPCell middleCell = new PdfPCell();
        middleCell.setBorder(Rectangle.NO_BORDER);
        // Aligning it down to match the visual level of company name exactly
        middleCell.setPaddingTop(84); 
        middleCell.setPaddingLeft(10);
        middleCell.setPaddingRight(10);

        // Adresse de l'entreprise
        if (user.getAddress() != null && !user.getAddress().isBlank()) {
            middleCell.addElement(new Paragraph(user.getAddress(), BODY_FONT));
        }

        // Code postal et Ville
        String cpCity = "";
        if (user.getZipCode() != null && !user.getZipCode().isBlank()) cpCity += user.getZipCode() + " ";
        if (user.getCity() != null && !user.getCity().isBlank()) cpCity += user.getCity();
        if (!cpCity.isBlank()) {
            middleCell.addElement(new Paragraph(cpCity.trim(), BODY_FONT));
        }

        headerTable.addCell(middleCell);

        // --------------------------------------------------------
        // 3) Right Cell : Status badge, SIRET, RCS
        // --------------------------------------------------------
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setPaddingTop(10);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

        String statusText = getStatusLabel(invoice.getStatus().name());
        BaseColor statusColor = getStatusColor(invoice.getStatus().name());
        Font statusFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, statusColor);
        Paragraph statusPara = new Paragraph(statusText, statusFont);
        statusPara.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(statusPara);

        // Adjusted spacing to perfectly align SIRET and RCS lines with middle and left contents
        Paragraph spacingParagraph = new Paragraph(" ", new Font(Font.FontFamily.HELVETICA, 39, Font.NORMAL));
        rightCell.addElement(spacingParagraph);

        // N° SIRET et N° RCS
        if (user.getSiret() != null && !user.getSiret().isBlank()) {
            Paragraph pSiret = new Paragraph("N° SIRET : " + user.getSiret(), BODY_FONT);
            pSiret.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pSiret);
        }
        if (user.getRcs() != null && !user.getRcs().isBlank()) {
            Paragraph pRcs = new Paragraph("N° RCS : " + user.getRcs(), BODY_FONT);
            pRcs.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(pRcs);
        }
        headerTable.addCell(rightCell);

        // Separator line
        PdfPTable separator = new PdfPTable(1);
        separator.setWidthPercentage(100);
        PdfPCell sepCell = new PdfPCell();
        sepCell.setBackgroundColor(PRIMARY_COLOR);
        sepCell.setFixedHeight(3f);
        sepCell.setBorder(Rectangle.NO_BORDER);
        separator.addCell(sepCell);

        document.add(headerTable);
        document.add(separator);
        document.add(Chunk.NEWLINE);
    }

    private void addInfoSection(Document document, InvoiceDto invoice) throws DocumentException {
        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{50, 50});

        // Client info
        PdfPCell clientCell = new PdfPCell();
        clientCell.setBackgroundColor(LIGHT_GRAY);
        clientCell.setBorderColor(BORDER_COLOR);
        clientCell.setPadding(15);

        Paragraph clientLabel = new Paragraph("FACTURER À", LABEL_FONT);
        clientCell.addElement(clientLabel);
        clientCell.addElement(new Paragraph(invoice.getClientName(),
                new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, new BaseColor(17, 24, 39))));
        if (invoice.getClientCompany() != null && !invoice.getClientCompany().isBlank()) {
            clientCell.addElement(new Paragraph(invoice.getClientCompany(), BODY_FONT));
        }
        clientCell.addElement(new Paragraph(invoice.getClientEmail(), BODY_FONT));
        if (invoice.getClientAddress() != null && !invoice.getClientAddress().isBlank()) {
            clientCell.addElement(new Paragraph(invoice.getClientAddress(), BODY_FONT));
        }
        infoTable.addCell(clientCell);

        // Invoice details
        PdfPCell detailsCell = new PdfPCell();
        detailsCell.setBackgroundColor(LIGHT_BLUE);
        detailsCell.setBorderColor(BORDER_COLOR);
        detailsCell.setPadding(15);

        Paragraph detailsLabel = new Paragraph("DÉTAILS DE LA FACTURE", LABEL_FONT);
        detailsCell.addElement(detailsLabel);

        addDetailRow(detailsCell, "Date d'émission :", invoice.getIssueDate().format(dateFormatter));
        addDetailRow(detailsCell, "Date d'échéance :", invoice.getDueDate().format(dateFormatter));
        addDetailRow(detailsCell, "N° Facture :", invoice.getInvoiceNumber());

        infoTable.addCell(detailsCell);
        document.add(infoTable);
    }

    private void addDetailRow(PdfPCell cell, String label, String value) {
        PdfPTable row = new PdfPTable(2);
        try {
            row.setWidths(new float[]{45, 55});
        } catch (DocumentException e) { /* ignore */ }
        row.setWidthPercentage(100);

        PdfPCell labelCell = new PdfPCell(new Phrase(label, LABEL_FONT));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingTop(3);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, VALUE_FONT));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPaddingTop(3);

        row.addCell(labelCell);
        row.addCell(valueCell);
        cell.addElement(row);
    }

    private void addItemsTable(Document document, InvoiceDto invoice) throws DocumentException {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{40, 10, 15, 15, 20});

        // Headers
        String[] headers = {"Description", "Unité", "Quantité", "Prix unitaire", "Total HT"};
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, HEADER_FONT));
            cell.setBackgroundColor(PRIMARY_COLOR);
            cell.setPadding(10);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setBorder(Rectangle.NO_BORDER);
            table.addCell(cell);
        }

        // Items
        boolean alternate = false;
        for (InvoiceItemDto item : invoice.getItems()) {
            BaseColor rowBg = alternate ? LIGHT_GRAY : BaseColor.WHITE;

            addTableCell(table, item.getDescription(), BODY_FONT, Element.ALIGN_LEFT, rowBg);
            addTableCell(table, item.getUnit() != null ? item.getUnit() : "", BODY_FONT, Element.ALIGN_CENTER, rowBg);
            double qty = item.getQuantity() != null ? item.getQuantity().doubleValue() : 0;
            double price = item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0;
            double lineTotal = item.getTotal() != null ? item.getTotal().doubleValue() : qty * price;
            addTableCell(table, formatNumber(qty), BODY_FONT, Element.ALIGN_CENTER, rowBg);
            addTableCell(table, formatCurrency(price), BODY_FONT, Element.ALIGN_RIGHT, rowBg);
            addTableCell(table, formatCurrency(lineTotal), BODY_FONT, Element.ALIGN_RIGHT, rowBg);

            alternate = !alternate;
        }

        document.add(table);
    }

    private void addTableCell(PdfPTable table, String text, Font font, int alignment, BaseColor bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(8);
        cell.setHorizontalAlignment(alignment);
        cell.setBorderColor(BORDER_COLOR);
        table.addCell(cell);
    }

    private void addTotals(Document document, InvoiceDto invoice) throws DocumentException {
        // Compute from items as fallback if stored totals are null
        double subtotalVal;
        if (invoice.getSubtotal() != null) {
            subtotalVal = invoice.getSubtotal().doubleValue();
        } else {
            subtotalVal = invoice.getItems().stream()
                    .mapToDouble(i -> {
                        double q = i.getQuantity() != null ? i.getQuantity().doubleValue() : 0;
                        double p = i.getUnitPrice() != null ? i.getUnitPrice().doubleValue() : 0;
                        return q * p;
                    }).sum();
        }
        double taxRate = invoice.getTaxRate() != null ? invoice.getTaxRate().doubleValue() : 0;
        double taxAmountVal = invoice.getTaxAmount() != null ? invoice.getTaxAmount().doubleValue() : subtotalVal * taxRate / 100;
        double totalVal = invoice.getTotal() != null ? invoice.getTotal().doubleValue() : subtotalVal + taxAmountVal;

        PdfPTable totalsWrapper = new PdfPTable(2);
        totalsWrapper.setWidthPercentage(100);
        totalsWrapper.setWidths(new float[]{55, 45});

        // Left empty
        PdfPCell emptyCell = new PdfPCell();
        emptyCell.setBorder(Rectangle.NO_BORDER);
        totalsWrapper.addCell(emptyCell);

        // Right: totals
        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(100);

        addTotalRow(totalsTable, "Sous-total HT", formatCurrency(subtotalVal), false);
        
        if (taxRate == 0) {
            addTotalRow(totalsTable, "TVA 0%", formatCurrency(0), false);
            
            // Add the legal mention dynamically
            PdfPCell legalCell = new PdfPCell(new Phrase("TVA non applicable, art. 293 B du CGI", new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, BaseColor.DARK_GRAY)));
            legalCell.setColspan(2);
            legalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            legalCell.setBorder(Rectangle.NO_BORDER);
            legalCell.setPaddingRight(0);
            legalCell.setPaddingTop(4);
            legalCell.setPaddingBottom(4);
            totalsTable.addCell(legalCell);
            
            addTotalRow(totalsTable, "TOTAL", formatCurrency(totalVal), true);
        } else {
            addTotalRow(totalsTable, "TVA (" + (int) taxRate + "%)", formatCurrency(taxAmountVal), false);
            addTotalRow(totalsTable, "TOTAL TTC", formatCurrency(totalVal), true);
        }

        PdfPCell totalsCell = new PdfPCell(totalsTable);
        totalsCell.setBorder(Rectangle.NO_BORDER);
        totalsWrapper.addCell(totalsCell);

        document.add(totalsWrapper);
    }

    private void addTotalRow(PdfPTable table, String label, String value, boolean isTotal) {
        Font lFont = isTotal ? TOTAL_FONT : LABEL_FONT;
        Font vFont = isTotal ? TOTAL_FONT : VALUE_FONT;
        BaseColor bg = isTotal ? LIGHT_BLUE : BaseColor.WHITE;

        PdfPCell labelCell = new PdfPCell(new Phrase(label, lFont));
        labelCell.setBackgroundColor(bg);
        labelCell.setPadding(8);
        labelCell.setBorderColor(BORDER_COLOR);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, vFont));
        valueCell.setBackgroundColor(bg);
        valueCell.setPadding(8);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setBorderColor(BORDER_COLOR);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addNotes(Document document, String notes) throws DocumentException {
        document.add(Chunk.NEWLINE);
        Paragraph noteTitle = new Paragraph("Notes", LABEL_FONT);
        document.add(noteTitle);
        Paragraph notePara = new Paragraph(notes, BODY_FONT);
        document.add(notePara);
    }

    private void addFooter(PdfWriter writer, Document document) {
        PdfContentByte canvas = writer.getDirectContent();
        float y = document.bottom() + 20;

        canvas.setColorFill(PRIMARY_COLOR);
        canvas.rectangle(document.left(), y - 2, document.right() - document.left(), 2);
        canvas.fill();

        ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER,
                new Phrase("Merci pour votre confiance", BODY_FONT),
                (document.left() + document.right()) / 2, y + 8, 0);
    }

    private String getStatusLabel(String status) {
        return switch (status) {
            case "DRAFT" -> "BROUILLON";
            case "SENT" -> "ENVOYÉE";
            case "PAID" -> "PAYÉE";
            case "OVERDUE" -> "EN RETARD";
            case "CANCELLED" -> "ANNULÉE";
            default -> status;
        };
    }

    private BaseColor getStatusColor(String status) {
        return switch (status) {
            case "PAID" -> new BaseColor(22, 163, 74);
            case "SENT" -> new BaseColor(37, 99, 235);
            case "OVERDUE" -> new BaseColor(220, 38, 38);
            case "CANCELLED" -> new BaseColor(107, 114, 128);
            default -> new BaseColor(161, 98, 7);
        };
    }

    private String formatCurrency(double value) {
        return String.format("%.2f €", value);
    }

    private String formatNumber(double value) {
        if (value == Math.floor(value)) {
            return String.format("%.0f", value);
        }
        return String.format("%.2f", value);
    }
}
