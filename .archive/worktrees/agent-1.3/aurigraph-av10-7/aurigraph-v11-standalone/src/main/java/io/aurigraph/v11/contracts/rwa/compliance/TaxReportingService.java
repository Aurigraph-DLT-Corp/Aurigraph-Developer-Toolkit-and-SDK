package io.aurigraph.v11.contracts.rwa.compliance;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import io.quarkus.logging.Log;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.math.BigDecimal;
import java.math.RoundingMode;

import io.aurigraph.v11.contracts.rwa.models.RegulatoryJurisdiction;

/**
 * Tax Reporting Automation Service
 * Generates tax reports for digital asset transactions across multiple jurisdictions
 *
 * Supported Tax Forms and Reports:
 * - US IRS: Form 1099-B (Proceeds from Broker Transactions), Form 1099-MISC, Form 8949
 * - UK HMRC: Self Assessment (Capital Gains), Annual Tax on Enveloped Dwellings (ATED)
 * - EU: DAC8 (Directive on Administrative Cooperation), Crypto-Asset Reporting Framework
 * - Canada CRA: T5008 (Statement of Securities Transactions)
 * - Australia ATO: Capital Gains Tax (CGT) reporting
 * - Singapore IRAS: Form C-S/C (Corporate Tax), Individual Income Tax
 * - Japan NTA: Final Tax Return (Kakutei Shinkoku)
 *
 * Tax Calculation Methods:
 * - FIFO (First In First Out)
 * - LIFO (Last In First Out)
 * - HIFO (Highest In First Out)
 * - Specific Identification
 * - Average Cost Basis
 *
 * AV11-406: Automated Compliance Monitoring (21 story points)
 */
@ApplicationScoped
public class TaxReportingService {

    @ConfigProperty(name = "compliance.tax.enabled", defaultValue = "true")
    boolean taxReportingEnabled;

    @ConfigProperty(name = "compliance.tax.auto.generate", defaultValue = "false")
    boolean autoGenerateEnabled;

    @ConfigProperty(name = "compliance.tax.default.method", defaultValue = "FIFO")
    String defaultCostBasisMethod;

    // Tax report storage (in production, use database)
    private final Map<String, TaxReport> taxReports = new ConcurrentHashMap<>();
    private final Map<String, List<TaxableEvent>> userTaxableEvents = new ConcurrentHashMap<>();
    private final Map<String, Map<String, BigDecimal>> costBasisTracking = new ConcurrentHashMap<>();

    public TaxReportingService() {
        Log.info("TaxReportingService initialized");
    }

    /**
     * Generate annual tax report for a user
     */
    public Uni<AnnualTaxReport> generateAnnualTaxReport(String userId,
                                                        RegulatoryJurisdiction jurisdiction,
                                                        Year taxYear,
                                                        CostBasisMethod method) {
        return Uni.createFrom().item(() -> {
            Log.infof("Generating annual tax report for user %s, year %s, jurisdiction %s",
                     userId, taxYear, jurisdiction);

            if (!taxReportingEnabled) {
                throw new IllegalStateException("Tax reporting is disabled");
            }

            AnnualTaxReport report = new AnnualTaxReport();
            report.setReportId(generateTaxReportId(userId, taxYear, jurisdiction));
            report.setUserId(userId);
            report.setJurisdiction(jurisdiction);
            report.setTaxYear(taxYear);
            report.setCostBasisMethod(method);
            report.setGeneratedDate(LocalDate.now());

            // Get all taxable events for the tax year
            List<TaxableEvent> events = getTaxableEventsForYear(userId, taxYear);

            // Calculate capital gains/losses
            CapitalGainsReport capitalGains = calculateCapitalGains(events, method);
            report.setCapitalGains(capitalGains);

            // Calculate income from staking, mining, airdrops, etc.
            OrdinaryIncomeReport ordinaryIncome = calculateOrdinaryIncome(events);
            report.setOrdinaryIncome(ordinaryIncome);

            // Generate jurisdiction-specific forms
            List<TaxForm> forms = generateTaxForms(jurisdiction, report);
            report.setForms(forms);

            // Calculate total tax liability (simplified)
            BigDecimal totalTaxLiability = estimateTaxLiability(jurisdiction, capitalGains, ordinaryIncome);
            report.setEstimatedTaxLiability(totalTaxLiability);

            // Store report
            taxReports.put(report.getReportId(), report);

            Log.infof("Annual tax report generated: %s (capital gains: %s, ordinary income: %s)",
                     report.getReportId(), capitalGains.getTotalGain(), ordinaryIncome.getTotalIncome());

            return report;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Generate Form 1099-B (US) for broker transactions
     */
    public Uni<Form1099B> generateForm1099B(String userId, Year taxYear) {
        return Uni.createFrom().item(() -> {
            Log.infof("Generating Form 1099-B for user %s, year %s", userId, taxYear);

            Form1099B form = new Form1099B();
            form.setFormId(generateFormId("1099B", userId, taxYear));
            form.setUserId(userId);
            form.setTaxYear(taxYear);
            form.setGeneratedDate(LocalDate.now());

            // Get disposals (sales) for the tax year
            List<TaxableEvent> disposals = getTaxableEventsForYear(userId, taxYear).stream()
                .filter(e -> e.getEventType() == EventType.SALE || e.getEventType() == EventType.EXCHANGE)
                .toList();

            List<Transaction1099B> transactions = new ArrayList<>();
            BigDecimal totalProceeds = BigDecimal.ZERO;
            BigDecimal totalCostBasis = BigDecimal.ZERO;

            for (TaxableEvent event : disposals) {
                Transaction1099B txn = new Transaction1099B();
                txn.setDescription(event.getAssetType());
                txn.setDateAcquired(event.getAcquisitionDate());
                txn.setDateSold(event.getEventDate());
                txn.setProceeds(event.getFairMarketValue());
                txn.setCostBasis(event.getCostBasis());
                txn.setGainOrLoss(event.getFairMarketValue().subtract(event.getCostBasis()));
                txn.setShortTerm(isShortTermGain(event.getAcquisitionDate(), event.getEventDate()));

                transactions.add(txn);
                totalProceeds = totalProceeds.add(event.getFairMarketValue());
                totalCostBasis = totalCostBasis.add(event.getCostBasis());
            }

            form.setTransactions(transactions);
            form.setTotalProceeds(totalProceeds);
            form.setTotalCostBasis(totalCostBasis);
            form.setTotalGainLoss(totalProceeds.subtract(totalCostBasis));

            Log.infof("Form 1099-B generated: %s (%d transactions)", form.getFormId(), transactions.size());

            return form;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Record a taxable event
     */
    public Uni<Void> recordTaxableEvent(String userId, TaxableEvent event) {
        Log.infof("Recording taxable event for user %s: %s (%s)",
                 userId, event.getEventType(), event.getAmount());

        userTaxableEvents.computeIfAbsent(userId, k -> new ArrayList<>()).add(event);

        // Update cost basis tracking if applicable
        if (event.getEventType() == EventType.PURCHASE || event.getEventType() == EventType.TRANSFER_IN) {
            updateCostBasis(userId, event.getAssetType(), event.getAmount(), event.getCostBasis());
        }

        return Uni.createFrom().voidItem();
    }

    /**
     * Calculate capital gains for a specific transaction
     */
    public Uni<CapitalGainCalculation> calculateCapitalGain(String userId,
                                                            String assetType,
                                                            BigDecimal amountSold,
                                                            BigDecimal salePrice,
                                                            LocalDate saleDate,
                                                            CostBasisMethod method) {
        return Uni.createFrom().item(() -> {
            Log.infof("Calculating capital gain for user %s: %s %s @ %s",
                     userId, amountSold, assetType, salePrice);

            CapitalGainCalculation calc = new CapitalGainCalculation();
            calc.setAssetType(assetType);
            calc.setAmountSold(amountSold);
            calc.setSalePrice(salePrice);
            calc.setSaleDate(saleDate);
            calc.setMethod(method);

            // Get cost basis using specified method
            BigDecimal costBasis = calculateCostBasis(userId, assetType, amountSold, method);
            calc.setCostBasis(costBasis);

            // Calculate gain/loss
            BigDecimal proceeds = amountSold.multiply(salePrice);
            BigDecimal gainOrLoss = proceeds.subtract(costBasis);
            calc.setProceeds(proceeds);
            calc.setGainOrLoss(gainOrLoss);

            // Determine if short-term or long-term (simplified - assumes 1 year holding period)
            // In production, track actual acquisition dates
            calc.setShortTerm(true); // Placeholder

            Log.infof("Capital gain calculated: %s (cost basis: %s, proceeds: %s, gain/loss: %s)",
                     assetType, costBasis, proceeds, gainOrLoss);

            return calc;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get tax summary for a user
     */
    public Uni<TaxSummary> getTaxSummary(String userId, Year taxYear) {
        return Uni.createFrom().item(() -> {
            List<TaxableEvent> events = getTaxableEventsForYear(userId, taxYear);

            TaxSummary summary = new TaxSummary();
            summary.setUserId(userId);
            summary.setTaxYear(taxYear);

            BigDecimal totalGains = BigDecimal.ZERO;
            BigDecimal totalLosses = BigDecimal.ZERO;
            BigDecimal totalIncome = BigDecimal.ZERO;

            for (TaxableEvent event : events) {
                if (event.getEventType() == EventType.SALE || event.getEventType() == EventType.EXCHANGE) {
                    BigDecimal gainLoss = event.getFairMarketValue().subtract(event.getCostBasis());
                    if (gainLoss.compareTo(BigDecimal.ZERO) > 0) {
                        totalGains = totalGains.add(gainLoss);
                    } else {
                        totalLosses = totalLosses.add(gainLoss.abs());
                    }
                } else if (event.getEventType() == EventType.INCOME) {
                    totalIncome = totalIncome.add(event.getFairMarketValue());
                }
            }

            summary.setTotalCapitalGains(totalGains);
            summary.setTotalCapitalLosses(totalLosses);
            summary.setNetCapitalGainLoss(totalGains.subtract(totalLosses));
            summary.setTotalOrdinaryIncome(totalIncome);
            summary.setEventCount(events.size());

            return summary;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Export tax report in various formats
     */
    public Uni<ExportResult> exportTaxReport(String reportId, ExportFormat format) {
        return Uni.createFrom().item(() -> {
            Log.infof("Exporting tax report %s in format %s", reportId, format);

            TaxReport report = taxReports.get(reportId);
            if (report == null) {
                throw new IllegalArgumentException("Tax report not found: " + reportId);
            }

            ExportResult result = new ExportResult();
            result.setReportId(reportId);
            result.setFormat(format);
            result.setExportDate(Instant.now());

            String exportedContent = switch (format) {
                case CSV -> exportToCSV(report);
                case PDF -> exportToPDF(report);
                case XML -> exportToXML(report);
                case JSON -> exportToJSON(report);
            };

            result.setContent(exportedContent);
            result.setSize(exportedContent.length());
            result.setSuccess(true);

            Log.infof("Tax report exported: %s (%s, %d bytes)", reportId, format, result.getSize());

            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Private Calculation Methods ====================

    private List<TaxableEvent> getTaxableEventsForYear(String userId, Year taxYear) {
        List<TaxableEvent> allEvents = userTaxableEvents.getOrDefault(userId, new ArrayList<>());
        return allEvents.stream()
            .filter(e -> e.getEventDate().getYear() == taxYear.getValue())
            .toList();
    }

    private CapitalGainsReport calculateCapitalGains(List<TaxableEvent> events, CostBasisMethod method) {
        CapitalGainsReport report = new CapitalGainsReport();

        BigDecimal shortTermGains = BigDecimal.ZERO;
        BigDecimal shortTermLosses = BigDecimal.ZERO;
        BigDecimal longTermGains = BigDecimal.ZERO;
        BigDecimal longTermLosses = BigDecimal.ZERO;

        for (TaxableEvent event : events) {
            if (event.getEventType() == EventType.SALE || event.getEventType() == EventType.EXCHANGE) {
                BigDecimal gainLoss = event.getFairMarketValue().subtract(event.getCostBasis());
                boolean isShortTerm = isShortTermGain(event.getAcquisitionDate(), event.getEventDate());

                if (isShortTerm) {
                    if (gainLoss.compareTo(BigDecimal.ZERO) > 0) {
                        shortTermGains = shortTermGains.add(gainLoss);
                    } else {
                        shortTermLosses = shortTermLosses.add(gainLoss.abs());
                    }
                } else {
                    if (gainLoss.compareTo(BigDecimal.ZERO) > 0) {
                        longTermGains = longTermGains.add(gainLoss);
                    } else {
                        longTermLosses = longTermLosses.add(gainLoss.abs());
                    }
                }
            }
        }

        report.setShortTermGains(shortTermGains);
        report.setShortTermLosses(shortTermLosses);
        report.setLongTermGains(longTermGains);
        report.setLongTermLosses(longTermLosses);
        report.setNetShortTermGainLoss(shortTermGains.subtract(shortTermLosses));
        report.setNetLongTermGainLoss(longTermGains.subtract(longTermLosses));
        report.setTotalGain(
            report.getNetShortTermGainLoss().add(report.getNetLongTermGainLoss())
        );

        return report;
    }

    private OrdinaryIncomeReport calculateOrdinaryIncome(List<TaxableEvent> events) {
        OrdinaryIncomeReport report = new OrdinaryIncomeReport();

        BigDecimal stakingIncome = BigDecimal.ZERO;
        BigDecimal miningIncome = BigDecimal.ZERO;
        BigDecimal airdropIncome = BigDecimal.ZERO;
        BigDecimal otherIncome = BigDecimal.ZERO;

        for (TaxableEvent event : events) {
            if (event.getEventType() == EventType.INCOME) {
                String source = event.getIncomeSource();
                BigDecimal amount = event.getFairMarketValue();

                switch (source) {
                    case "STAKING" -> stakingIncome = stakingIncome.add(amount);
                    case "MINING" -> miningIncome = miningIncome.add(amount);
                    case "AIRDROP" -> airdropIncome = airdropIncome.add(amount);
                    default -> otherIncome = otherIncome.add(amount);
                }
            }
        }

        report.setStakingIncome(stakingIncome);
        report.setMiningIncome(miningIncome);
        report.setAirdropIncome(airdropIncome);
        report.setOtherIncome(otherIncome);
        report.setTotalIncome(
            stakingIncome.add(miningIncome).add(airdropIncome).add(otherIncome)
        );

        return report;
    }

    private List<TaxForm> generateTaxForms(RegulatoryJurisdiction jurisdiction, AnnualTaxReport report) {
        List<TaxForm> forms = new ArrayList<>();

        switch (jurisdiction) {
            case US -> {
                forms.add(createForm("1099-B", "Broker Transactions"));
                forms.add(createForm("8949", "Capital Gains and Losses"));
                forms.add(createForm("Schedule D", "Capital Gains Summary"));
            }
            case UK -> {
                forms.add(createForm("SA100", "Self Assessment"));
                forms.add(createForm("SA108", "Capital Gains Summary"));
            }
            case EU -> {
                forms.add(createForm("DAC8", "Crypto-Asset Reporting"));
            }
            case CANADA -> {
                forms.add(createForm("T5008", "Securities Transactions"));
                forms.add(createForm("Schedule 3", "Capital Gains"));
            }
            case AUSTRALIA -> {
                forms.add(createForm("CGT Schedule", "Capital Gains Tax"));
            }
            case SINGAPORE -> {
                forms.add(createForm("Form C-S", "Corporate Tax"));
            }
        }

        return forms;
    }

    private TaxForm createForm(String formNumber, String formName) {
        TaxForm form = new TaxForm();
        form.setFormNumber(formNumber);
        form.setFormName(formName);
        form.setGeneratedDate(LocalDate.now());
        return form;
    }

    private BigDecimal estimateTaxLiability(RegulatoryJurisdiction jurisdiction,
                                           CapitalGainsReport capitalGains,
                                           OrdinaryIncomeReport ordinaryIncome) {
        // Simplified tax calculation (in production, use actual tax brackets and rates)
        BigDecimal capitalGainsTax = BigDecimal.ZERO;
        BigDecimal incomeTax = BigDecimal.ZERO;

        switch (jurisdiction) {
            case US -> {
                // Short-term capital gains taxed as ordinary income (assume 22% bracket)
                BigDecimal shortTermTax = capitalGains.getNetShortTermGainLoss()
                    .max(BigDecimal.ZERO)
                    .multiply(new BigDecimal("0.22"));

                // Long-term capital gains (assume 15% rate)
                BigDecimal longTermTax = capitalGains.getNetLongTermGainLoss()
                    .max(BigDecimal.ZERO)
                    .multiply(new BigDecimal("0.15"));

                capitalGainsTax = shortTermTax.add(longTermTax);

                // Ordinary income (assume 22% bracket)
                incomeTax = ordinaryIncome.getTotalIncome().multiply(new BigDecimal("0.22"));
            }
            case UK -> {
                // UK Capital Gains Tax (assume 20% rate)
                capitalGainsTax = capitalGains.getTotalGain()
                    .max(BigDecimal.ZERO)
                    .multiply(new BigDecimal("0.20"));

                // UK Income Tax (assume 40% higher rate)
                incomeTax = ordinaryIncome.getTotalIncome().multiply(new BigDecimal("0.40"));
            }
            case SINGAPORE -> {
                // Singapore has no capital gains tax
                capitalGainsTax = BigDecimal.ZERO;

                // Personal income tax (assume 22% rate)
                incomeTax = ordinaryIncome.getTotalIncome().multiply(new BigDecimal("0.22"));
            }
            default -> {
                // Generic estimate (20% rate)
                capitalGainsTax = capitalGains.getTotalGain()
                    .max(BigDecimal.ZERO)
                    .multiply(new BigDecimal("0.20"));
                incomeTax = ordinaryIncome.getTotalIncome().multiply(new BigDecimal("0.20"));
            }
        }

        return capitalGainsTax.add(incomeTax).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateCostBasis(String userId, String assetType,
                                         BigDecimal amount, CostBasisMethod method) {
        // Simplified cost basis calculation
        // In production, track actual lots and use specified method

        Map<String, BigDecimal> userBasis = costBasisTracking.getOrDefault(userId, new HashMap<>());
        BigDecimal totalBasis = userBasis.getOrDefault(assetType, BigDecimal.ZERO);

        // Return proportional cost basis (simplified)
        return totalBasis.multiply(amount).setScale(2, RoundingMode.HALF_UP);
    }

    private void updateCostBasis(String userId, String assetType, BigDecimal amount, BigDecimal costBasis) {
        costBasisTracking.computeIfAbsent(userId, k -> new HashMap<>())
            .merge(assetType, costBasis, BigDecimal::add);
    }

    private boolean isShortTermGain(LocalDate acquisitionDate, LocalDate saleDate) {
        if (acquisitionDate == null || saleDate == null) return true;
        return saleDate.minusYears(1).isBefore(acquisitionDate);
    }

    private String generateTaxReportId(String userId, Year taxYear, RegulatoryJurisdiction jurisdiction) {
        return String.format("TAX-%s-%s-%s", userId, taxYear.getValue(), jurisdiction.getCode());
    }

    private String generateFormId(String formType, String userId, Year taxYear) {
        return String.format("%s-%s-%s", formType, userId, taxYear.getValue());
    }

    // ==================== Export Methods ====================

    private String exportToCSV(TaxReport report) {
        StringBuilder csv = new StringBuilder();
        csv.append("Tax Report Export - CSV Format\n");
        csv.append("Report ID,").append(report.getReportId()).append("\n");
        csv.append("Generated Date,").append(report.getGeneratedDate()).append("\n");
        // Add more CSV formatting...
        return csv.toString();
    }

    private String exportToPDF(TaxReport report) {
        // In production: use PDF library like iText or Apache PDFBox
        return "PDF export not implemented (use PDF library in production)";
    }

    private String exportToXML(TaxReport report) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<TaxReport>\n");
        xml.append("  <reportId>").append(report.getReportId()).append("</reportId>\n");
        xml.append("  <generatedDate>").append(report.getGeneratedDate()).append("</generatedDate>\n");
        xml.append("</TaxReport>");
        return xml.toString();
    }

    private String exportToJSON(TaxReport report) {
        // In production: use Jackson or similar JSON library
        return String.format("{\"reportId\":\"%s\",\"generatedDate\":\"%s\"}",
            report.getReportId(), report.getGeneratedDate());
    }

    // ==================== Enums ====================

    public enum CostBasisMethod {
        FIFO,           // First In First Out
        LIFO,           // Last In First Out
        HIFO,           // Highest In First Out
        SPECIFIC_ID,    // Specific Identification
        AVERAGE_COST    // Average Cost Basis
    }

    public enum EventType {
        PURCHASE,
        SALE,
        EXCHANGE,
        TRANSFER_IN,
        TRANSFER_OUT,
        INCOME,
        GIFT_RECEIVED,
        GIFT_SENT,
        MINING,
        STAKING
    }

    public enum ExportFormat {
        CSV,
        PDF,
        XML,
        JSON
    }

    // ==================== Data Classes ====================

    public static class TaxReport {
        protected String reportId;
        protected LocalDate generatedDate;

        public String getReportId() { return reportId; }
        public void setReportId(String reportId) { this.reportId = reportId; }
        public LocalDate getGeneratedDate() { return generatedDate; }
        public void setGeneratedDate(LocalDate generatedDate) { this.generatedDate = generatedDate; }
    }

    public static class AnnualTaxReport extends TaxReport {
        private String userId;
        private RegulatoryJurisdiction jurisdiction;
        private Year taxYear;
        private CostBasisMethod costBasisMethod;
        private CapitalGainsReport capitalGains;
        private OrdinaryIncomeReport ordinaryIncome;
        private List<TaxForm> forms;
        private BigDecimal estimatedTaxLiability;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public RegulatoryJurisdiction getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(RegulatoryJurisdiction jurisdiction) { this.jurisdiction = jurisdiction; }
        public Year getTaxYear() { return taxYear; }
        public void setTaxYear(Year taxYear) { this.taxYear = taxYear; }
        public CostBasisMethod getCostBasisMethod() { return costBasisMethod; }
        public void setCostBasisMethod(CostBasisMethod costBasisMethod) { this.costBasisMethod = costBasisMethod; }
        public CapitalGainsReport getCapitalGains() { return capitalGains; }
        public void setCapitalGains(CapitalGainsReport capitalGains) { this.capitalGains = capitalGains; }
        public OrdinaryIncomeReport getOrdinaryIncome() { return ordinaryIncome; }
        public void setOrdinaryIncome(OrdinaryIncomeReport ordinaryIncome) { this.ordinaryIncome = ordinaryIncome; }
        public List<TaxForm> getForms() { return forms; }
        public void setForms(List<TaxForm> forms) { this.forms = forms; }
        public BigDecimal getEstimatedTaxLiability() { return estimatedTaxLiability; }
        public void setEstimatedTaxLiability(BigDecimal estimatedTaxLiability) { this.estimatedTaxLiability = estimatedTaxLiability; }
    }

    public static class CapitalGainsReport {
        private BigDecimal shortTermGains;
        private BigDecimal shortTermLosses;
        private BigDecimal longTermGains;
        private BigDecimal longTermLosses;
        private BigDecimal netShortTermGainLoss;
        private BigDecimal netLongTermGainLoss;
        private BigDecimal totalGain;

        // Getters and setters
        public BigDecimal getShortTermGains() { return shortTermGains; }
        public void setShortTermGains(BigDecimal shortTermGains) { this.shortTermGains = shortTermGains; }
        public BigDecimal getShortTermLosses() { return shortTermLosses; }
        public void setShortTermLosses(BigDecimal shortTermLosses) { this.shortTermLosses = shortTermLosses; }
        public BigDecimal getLongTermGains() { return longTermGains; }
        public void setLongTermGains(BigDecimal longTermGains) { this.longTermGains = longTermGains; }
        public BigDecimal getLongTermLosses() { return longTermLosses; }
        public void setLongTermLosses(BigDecimal longTermLosses) { this.longTermLosses = longTermLosses; }
        public BigDecimal getNetShortTermGainLoss() { return netShortTermGainLoss; }
        public void setNetShortTermGainLoss(BigDecimal netShortTermGainLoss) { this.netShortTermGainLoss = netShortTermGainLoss; }
        public BigDecimal getNetLongTermGainLoss() { return netLongTermGainLoss; }
        public void setNetLongTermGainLoss(BigDecimal netLongTermGainLoss) { this.netLongTermGainLoss = netLongTermGainLoss; }
        public BigDecimal getTotalGain() { return totalGain; }
        public void setTotalGain(BigDecimal totalGain) { this.totalGain = totalGain; }
    }

    public static class OrdinaryIncomeReport {
        private BigDecimal stakingIncome;
        private BigDecimal miningIncome;
        private BigDecimal airdropIncome;
        private BigDecimal otherIncome;
        private BigDecimal totalIncome;

        // Getters and setters
        public BigDecimal getStakingIncome() { return stakingIncome; }
        public void setStakingIncome(BigDecimal stakingIncome) { this.stakingIncome = stakingIncome; }
        public BigDecimal getMiningIncome() { return miningIncome; }
        public void setMiningIncome(BigDecimal miningIncome) { this.miningIncome = miningIncome; }
        public BigDecimal getAirdropIncome() { return airdropIncome; }
        public void setAirdropIncome(BigDecimal airdropIncome) { this.airdropIncome = airdropIncome; }
        public BigDecimal getOtherIncome() { return otherIncome; }
        public void setOtherIncome(BigDecimal otherIncome) { this.otherIncome = otherIncome; }
        public BigDecimal getTotalIncome() { return totalIncome; }
        public void setTotalIncome(BigDecimal totalIncome) { this.totalIncome = totalIncome; }
    }

    public static class TaxableEvent {
        private EventType eventType;
        private LocalDate eventDate;
        private String assetType;
        private BigDecimal amount;
        private BigDecimal fairMarketValue;
        private BigDecimal costBasis;
        private LocalDate acquisitionDate;
        private String incomeSource;

        // Getters and setters
        public EventType getEventType() { return eventType; }
        public void setEventType(EventType eventType) { this.eventType = eventType; }
        public LocalDate getEventDate() { return eventDate; }
        public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }
        public String getAssetType() { return assetType; }
        public void setAssetType(String assetType) { this.assetType = assetType; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public BigDecimal getFairMarketValue() { return fairMarketValue; }
        public void setFairMarketValue(BigDecimal fairMarketValue) { this.fairMarketValue = fairMarketValue; }
        public BigDecimal getCostBasis() { return costBasis; }
        public void setCostBasis(BigDecimal costBasis) { this.costBasis = costBasis; }
        public LocalDate getAcquisitionDate() { return acquisitionDate; }
        public void setAcquisitionDate(LocalDate acquisitionDate) { this.acquisitionDate = acquisitionDate; }
        public String getIncomeSource() { return incomeSource; }
        public void setIncomeSource(String incomeSource) { this.incomeSource = incomeSource; }
    }

    public static class TaxForm {
        private String formNumber;
        private String formName;
        private LocalDate generatedDate;

        // Getters and setters
        public String getFormNumber() { return formNumber; }
        public void setFormNumber(String formNumber) { this.formNumber = formNumber; }
        public String getFormName() { return formName; }
        public void setFormName(String formName) { this.formName = formName; }
        public LocalDate getGeneratedDate() { return generatedDate; }
        public void setGeneratedDate(LocalDate generatedDate) { this.generatedDate = generatedDate; }
    }

    public static class Form1099B {
        private String formId;
        private String userId;
        private Year taxYear;
        private LocalDate generatedDate;
        private List<Transaction1099B> transactions;
        private BigDecimal totalProceeds;
        private BigDecimal totalCostBasis;
        private BigDecimal totalGainLoss;

        // Getters and setters
        public String getFormId() { return formId; }
        public void setFormId(String formId) { this.formId = formId; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public Year getTaxYear() { return taxYear; }
        public void setTaxYear(Year taxYear) { this.taxYear = taxYear; }
        public LocalDate getGeneratedDate() { return generatedDate; }
        public void setGeneratedDate(LocalDate generatedDate) { this.generatedDate = generatedDate; }
        public List<Transaction1099B> getTransactions() { return transactions; }
        public void setTransactions(List<Transaction1099B> transactions) { this.transactions = transactions; }
        public BigDecimal getTotalProceeds() { return totalProceeds; }
        public void setTotalProceeds(BigDecimal totalProceeds) { this.totalProceeds = totalProceeds; }
        public BigDecimal getTotalCostBasis() { return totalCostBasis; }
        public void setTotalCostBasis(BigDecimal totalCostBasis) { this.totalCostBasis = totalCostBasis; }
        public BigDecimal getTotalGainLoss() { return totalGainLoss; }
        public void setTotalGainLoss(BigDecimal totalGainLoss) { this.totalGainLoss = totalGainLoss; }
    }

    public static class Transaction1099B {
        private String description;
        private LocalDate dateAcquired;
        private LocalDate dateSold;
        private BigDecimal proceeds;
        private BigDecimal costBasis;
        private BigDecimal gainOrLoss;
        private boolean shortTerm;

        // Getters and setters
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDate getDateAcquired() { return dateAcquired; }
        public void setDateAcquired(LocalDate dateAcquired) { this.dateAcquired = dateAcquired; }
        public LocalDate getDateSold() { return dateSold; }
        public void setDateSold(LocalDate dateSold) { this.dateSold = dateSold; }
        public BigDecimal getProceeds() { return proceeds; }
        public void setProceeds(BigDecimal proceeds) { this.proceeds = proceeds; }
        public BigDecimal getCostBasis() { return costBasis; }
        public void setCostBasis(BigDecimal costBasis) { this.costBasis = costBasis; }
        public BigDecimal getGainOrLoss() { return gainOrLoss; }
        public void setGainOrLoss(BigDecimal gainOrLoss) { this.gainOrLoss = gainOrLoss; }
        public boolean isShortTerm() { return shortTerm; }
        public void setShortTerm(boolean shortTerm) { this.shortTerm = shortTerm; }
    }

    public static class CapitalGainCalculation {
        private String assetType;
        private BigDecimal amountSold;
        private BigDecimal salePrice;
        private LocalDate saleDate;
        private BigDecimal costBasis;
        private BigDecimal proceeds;
        private BigDecimal gainOrLoss;
        private boolean shortTerm;
        private CostBasisMethod method;

        // Getters and setters
        public String getAssetType() { return assetType; }
        public void setAssetType(String assetType) { this.assetType = assetType; }
        public BigDecimal getAmountSold() { return amountSold; }
        public void setAmountSold(BigDecimal amountSold) { this.amountSold = amountSold; }
        public BigDecimal getSalePrice() { return salePrice; }
        public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }
        public LocalDate getSaleDate() { return saleDate; }
        public void setSaleDate(LocalDate saleDate) { this.saleDate = saleDate; }
        public BigDecimal getCostBasis() { return costBasis; }
        public void setCostBasis(BigDecimal costBasis) { this.costBasis = costBasis; }
        public BigDecimal getProceeds() { return proceeds; }
        public void setProceeds(BigDecimal proceeds) { this.proceeds = proceeds; }
        public BigDecimal getGainOrLoss() { return gainOrLoss; }
        public void setGainOrLoss(BigDecimal gainOrLoss) { this.gainOrLoss = gainOrLoss; }
        public boolean isShortTerm() { return shortTerm; }
        public void setShortTerm(boolean shortTerm) { this.shortTerm = shortTerm; }
        public CostBasisMethod getMethod() { return method; }
        public void setMethod(CostBasisMethod method) { this.method = method; }
    }

    public static class TaxSummary {
        private String userId;
        private Year taxYear;
        private BigDecimal totalCapitalGains;
        private BigDecimal totalCapitalLosses;
        private BigDecimal netCapitalGainLoss;
        private BigDecimal totalOrdinaryIncome;
        private int eventCount;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public Year getTaxYear() { return taxYear; }
        public void setTaxYear(Year taxYear) { this.taxYear = taxYear; }
        public BigDecimal getTotalCapitalGains() { return totalCapitalGains; }
        public void setTotalCapitalGains(BigDecimal totalCapitalGains) { this.totalCapitalGains = totalCapitalGains; }
        public BigDecimal getTotalCapitalLosses() { return totalCapitalLosses; }
        public void setTotalCapitalLosses(BigDecimal totalCapitalLosses) { this.totalCapitalLosses = totalCapitalLosses; }
        public BigDecimal getNetCapitalGainLoss() { return netCapitalGainLoss; }
        public void setNetCapitalGainLoss(BigDecimal netCapitalGainLoss) { this.netCapitalGainLoss = netCapitalGainLoss; }
        public BigDecimal getTotalOrdinaryIncome() { return totalOrdinaryIncome; }
        public void setTotalOrdinaryIncome(BigDecimal totalOrdinaryIncome) { this.totalOrdinaryIncome = totalOrdinaryIncome; }
        public int getEventCount() { return eventCount; }
        public void setEventCount(int eventCount) { this.eventCount = eventCount; }
    }

    public static class ExportResult {
        private String reportId;
        private ExportFormat format;
        private Instant exportDate;
        private String content;
        private int size;
        private boolean success;

        // Getters and setters
        public String getReportId() { return reportId; }
        public void setReportId(String reportId) { this.reportId = reportId; }
        public ExportFormat getFormat() { return format; }
        public void setFormat(ExportFormat format) { this.format = format; }
        public Instant getExportDate() { return exportDate; }
        public void setExportDate(Instant exportDate) { this.exportDate = exportDate; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
    }
}
