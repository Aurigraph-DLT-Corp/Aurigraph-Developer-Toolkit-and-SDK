package io.aurigraph.v11.contracts.rwa.compliance;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import io.quarkus.logging.Log;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.math.BigDecimal;

import io.aurigraph.v11.contracts.rwa.models.RegulatoryJurisdiction;

/**
 * Automated Regulatory Reporting Service
 * Generates and submits regulatory reports to various financial authorities
 *
 * Supported Reporting Requirements:
 * - US SEC: Form D (Regulation D offerings), Form 13F (institutional holdings)
 * - EU ESMA: MiFID II transaction reporting, EMIR derivative reporting
 * - UK FCA: SUP 16 regulatory reporting, Transaction reporting
 * - Singapore MAS: Notice on Risk Based Capital Adequacy Requirements
 * - Australia ASIC: CHESS reporting, Transaction reporting
 * - Canada OSC: NI 81-106 reporting, NI 31-103 registration reporting
 * - FATF: Suspicious Transaction Reports (STRs)
 * - FinCEN: Currency Transaction Reports (CTRs), Suspicious Activity Reports (SARs)
 *
 * AV11-406: Automated Compliance Monitoring (21 story points)
 */
@ApplicationScoped
public class RegulatoryReportingService {

    @ConfigProperty(name = "compliance.reporting.enabled", defaultValue = "true")
    boolean reportingEnabled;

    @ConfigProperty(name = "compliance.reporting.auto.submit", defaultValue = "false")
    boolean autoSubmitEnabled;

    @ConfigProperty(name = "compliance.reporting.retention.years", defaultValue = "7")
    int reportRetentionYears;

    // Report storage (in production, use database)
    private final Map<String, RegulatoryReport> reports = new ConcurrentHashMap<>();
    private final Map<String, List<SubmissionHistory>> submissionHistory = new ConcurrentHashMap<>();

    public RegulatoryReportingService() {
        Log.info("RegulatoryReportingService initialized");
    }

    /**
     * Generate transaction report for a jurisdiction
     */
    public Uni<TransactionReport> generateTransactionReport(RegulatoryJurisdiction jurisdiction,
                                                            LocalDate startDate,
                                                            LocalDate endDate,
                                                            List<TransactionData> transactions) {
        return Uni.createFrom().item(() -> {
            Log.infof("Generating transaction report for %s from %s to %s",
                     jurisdiction, startDate, endDate);

            TransactionReport report = new TransactionReport();
            report.setReportId(generateReportId("TXN", jurisdiction));
            report.setJurisdiction(jurisdiction);
            report.setStartDate(startDate);
            report.setEndDate(endDate);
            report.setGeneratedDate(LocalDate.now());
            report.setReportType(ReportType.TRANSACTION_REPORT);

            // Calculate statistics
            BigDecimal totalVolume = transactions.stream()
                .map(TransactionData::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            report.setTransactionCount(transactions.size());
            report.setTotalVolume(totalVolume);
            report.setTransactions(transactions);

            // Format based on jurisdiction requirements
            String formattedReport = formatTransactionReport(jurisdiction, report);
            report.setFormattedContent(formattedReport);

            // Store report
            reports.put(report.getReportId(), report);

            Log.infof("Transaction report generated: %s (%d transactions, volume: %s)",
                     report.getReportId(), transactions.size(), totalVolume);

            return report;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Generate Suspicious Activity Report (SAR)
     */
    public Uni<SuspiciousActivityReport> generateSAR(String userId,
                                                     RegulatoryJurisdiction jurisdiction,
                                                     String suspicionReason,
                                                     List<TransactionData> suspiciousTransactions) {
        return Uni.createFrom().item(() -> {
            Log.infof("Generating SAR for user %s in jurisdiction %s", userId, jurisdiction);

            SuspiciousActivityReport sar = new SuspiciousActivityReport();
            sar.setReportId(generateReportId("SAR", jurisdiction));
            sar.setUserId(userId);
            sar.setJurisdiction(jurisdiction);
            sar.setSuspicionReason(suspicionReason);
            sar.setTransactions(suspiciousTransactions);
            sar.setGeneratedDate(LocalDate.now());
            sar.setReportType(ReportType.SUSPICIOUS_ACTIVITY);
            sar.setUrgency(determineUrgency(suspicionReason));

            // Calculate risk indicators
            BigDecimal totalAmount = suspiciousTransactions.stream()
                .map(TransactionData::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            sar.setTotalSuspiciousAmount(totalAmount);
            sar.setTransactionCount(suspiciousTransactions.size());

            // Format for FinCEN (US) or equivalent authority
            String formattedReport = formatSAR(jurisdiction, sar);
            sar.setFormattedContent(formattedReport);

            // Store and flag for immediate review
            reports.put(sar.getReportId(), sar);

            Log.warnf("SAR generated: %s (user: %s, amount: %s, transactions: %d)",
                     sar.getReportId(), userId, totalAmount, suspiciousTransactions.size());

            return sar;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Generate Currency Transaction Report (CTR) for large transactions
     */
    public Uni<CurrencyTransactionReport> generateCTR(String userId,
                                                      RegulatoryJurisdiction jurisdiction,
                                                      BigDecimal amount,
                                                      String currency,
                                                      TransactionData transaction) {
        return Uni.createFrom().item(() -> {
            Log.infof("Generating CTR for user %s, amount: %s %s", userId, amount, currency);

            CurrencyTransactionReport ctr = new CurrencyTransactionReport();
            ctr.setReportId(generateReportId("CTR", jurisdiction));
            ctr.setUserId(userId);
            ctr.setJurisdiction(jurisdiction);
            ctr.setAmount(amount);
            ctr.setCurrency(currency);
            ctr.setTransaction(transaction);
            ctr.setGeneratedDate(LocalDate.now());
            ctr.setReportType(ReportType.CURRENCY_TRANSACTION);

            // Format for FinCEN Form 112 or equivalent
            String formattedReport = formatCTR(jurisdiction, ctr);
            ctr.setFormattedContent(formattedReport);

            // Store report
            reports.put(ctr.getReportId(), ctr);

            Log.infof("CTR generated: %s (amount: %s %s)", ctr.getReportId(), amount, currency);

            return ctr;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Generate periodic compliance report
     */
    public Uni<CompliancePeriodicReport> generatePeriodicReport(RegulatoryJurisdiction jurisdiction,
                                                                ReportingPeriod period,
                                                                LocalDate periodStart,
                                                                LocalDate periodEnd) {
        return Uni.createFrom().item(() -> {
            Log.infof("Generating %s periodic report for %s (%s to %s)",
                     period, jurisdiction, periodStart, periodEnd);

            CompliancePeriodicReport report = new CompliancePeriodicReport();
            report.setReportId(generateReportId(period.toString(), jurisdiction));
            report.setJurisdiction(jurisdiction);
            report.setPeriod(period);
            report.setPeriodStart(periodStart);
            report.setPeriodEnd(periodEnd);
            report.setGeneratedDate(LocalDate.now());
            report.setReportType(ReportType.PERIODIC_COMPLIANCE);

            // Gather statistics for the period
            ComplianceStatistics stats = gatherComplianceStatistics(jurisdiction, periodStart, periodEnd);
            report.setStatistics(stats);

            // Format based on jurisdiction requirements
            String formattedReport = formatPeriodicReport(jurisdiction, period, report);
            report.setFormattedContent(formattedReport);

            // Store report
            reports.put(report.getReportId(), report);

            Log.infof("Periodic report generated: %s", report.getReportId());

            return report;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Submit report to regulatory authority
     */
    public Uni<SubmissionResult> submitReport(String reportId) {
        return Uni.createFrom().item(() -> {
            Log.infof("Submitting report %s to regulatory authority", reportId);

            RegulatoryReport report = reports.get(reportId);
            if (report == null) {
                throw new IllegalArgumentException("Report not found: " + reportId);
            }

            SubmissionResult result = new SubmissionResult();
            result.setReportId(reportId);
            result.setSubmissionTime(Instant.now());

            if (!reportingEnabled) {
                result.setSuccess(false);
                result.setErrorMessage("Reporting is disabled");
                return result;
            }

            try {
                // Determine submission endpoint based on jurisdiction
                String endpoint = getSubmissionEndpoint(report.getJurisdiction(), report.getReportType());

                // In production: submit to actual regulatory API
                // For now, simulate successful submission
                boolean submitted = simulateSubmission(endpoint, report);

                result.setSuccess(submitted);
                result.setConfirmationNumber(generateConfirmationNumber());
                result.setSubmissionEndpoint(endpoint);

                // Record submission history
                recordSubmission(reportId, result);

                Log.infof("Report %s submitted successfully: %s", reportId, result.getConfirmationNumber());

            } catch (Exception e) {
                result.setSuccess(false);
                result.setErrorMessage(e.getMessage());
                Log.errorf(e, "Failed to submit report %s", reportId);
            }

            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get report by ID
     */
    public Uni<RegulatoryReport> getReport(String reportId) {
        return Uni.createFrom().item(() -> {
            RegulatoryReport report = reports.get(reportId);
            if (report == null) {
                throw new IllegalArgumentException("Report not found: " + reportId);
            }
            return report;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all reports for a jurisdiction
     */
    public Uni<List<RegulatoryReport>> getReportsByJurisdiction(RegulatoryJurisdiction jurisdiction) {
        return Uni.createFrom().item(() -> {
            return reports.values().stream()
                .filter(r -> r.getJurisdiction() == jurisdiction)
                .sorted((a, b) -> b.getGeneratedDate().compareTo(a.getGeneratedDate()))
                .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get submission history for a report
     */
    public Uni<List<SubmissionHistory>> getSubmissionHistory(String reportId) {
        return Uni.createFrom().item(() -> {
            return submissionHistory.getOrDefault(reportId, new ArrayList<>());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Formatting Methods ====================

    private String formatTransactionReport(RegulatoryJurisdiction jurisdiction, TransactionReport report) {
        StringBuilder sb = new StringBuilder();

        switch (jurisdiction) {
            case US -> {
                // SEC format
                sb.append("U.S. Securities and Exchange Commission\n");
                sb.append("Transaction Report\n");
                sb.append("Report ID: ").append(report.getReportId()).append("\n");
                sb.append("Period: ").append(report.getStartDate()).append(" to ").append(report.getEndDate()).append("\n");
                sb.append("Total Transactions: ").append(report.getTransactionCount()).append("\n");
                sb.append("Total Volume: $").append(report.getTotalVolume()).append("\n\n");
                sb.append("Transactions:\n");
                for (TransactionData txn : report.getTransactions()) {
                    sb.append(String.format("  - %s: %s %s\n", txn.getDate(), txn.getType(), txn.getAmount()));
                }
            }
            case EU -> {
                // ESMA MiFID II format
                sb.append("European Securities and Markets Authority\n");
                sb.append("MiFID II Transaction Report\n");
                sb.append("Report ID: ").append(report.getReportId()).append("\n");
                sb.append("Period: ").append(report.getStartDate()).append(" to ").append(report.getEndDate()).append("\n");
                sb.append("Total Transactions: ").append(report.getTransactionCount()).append("\n");
                sb.append("Total Volume: €").append(report.getTotalVolume()).append("\n");
            }
            case UK -> {
                // FCA format
                sb.append("Financial Conduct Authority\n");
                sb.append("Transaction Report\n");
                sb.append("Report ID: ").append(report.getReportId()).append("\n");
                sb.append("Period: ").append(report.getStartDate()).append(" to ").append(report.getEndDate()).append("\n");
                sb.append("Total Transactions: ").append(report.getTransactionCount()).append("\n");
                sb.append("Total Volume: £").append(report.getTotalVolume()).append("\n");
            }
            default -> {
                // Generic format
                sb.append("Regulatory Transaction Report\n");
                sb.append("Jurisdiction: ").append(jurisdiction.getName()).append("\n");
                sb.append("Report ID: ").append(report.getReportId()).append("\n");
                sb.append("Period: ").append(report.getStartDate()).append(" to ").append(report.getEndDate()).append("\n");
                sb.append("Total Transactions: ").append(report.getTransactionCount()).append("\n");
                sb.append("Total Volume: ").append(report.getTotalVolume()).append("\n");
            }
        }

        return sb.toString();
    }

    private String formatSAR(RegulatoryJurisdiction jurisdiction, SuspiciousActivityReport sar) {
        StringBuilder sb = new StringBuilder();

        sb.append("SUSPICIOUS ACTIVITY REPORT\n");
        sb.append("Report ID: ").append(sar.getReportId()).append("\n");
        sb.append("Jurisdiction: ").append(jurisdiction.getName()).append("\n");
        sb.append("Date: ").append(sar.getGeneratedDate()).append("\n");
        sb.append("Urgency: ").append(sar.getUrgency()).append("\n\n");

        sb.append("Subject Information:\n");
        sb.append("User ID: ").append(sar.getUserId()).append("\n");
        sb.append("Suspicious Amount: ").append(sar.getTotalSuspiciousAmount()).append("\n");
        sb.append("Transaction Count: ").append(sar.getTransactionCount()).append("\n\n");

        sb.append("Reason for Suspicion:\n");
        sb.append(sar.getSuspicionReason()).append("\n\n");

        sb.append("Suspicious Transactions:\n");
        for (TransactionData txn : sar.getTransactions()) {
            sb.append(String.format("  - %s: %s %s\n", txn.getDate(), txn.getType(), txn.getAmount()));
        }

        return sb.toString();
    }

    private String formatCTR(RegulatoryJurisdiction jurisdiction, CurrencyTransactionReport ctr) {
        StringBuilder sb = new StringBuilder();

        sb.append("CURRENCY TRANSACTION REPORT\n");
        sb.append("Report ID: ").append(ctr.getReportId()).append("\n");
        sb.append("Jurisdiction: ").append(jurisdiction.getName()).append("\n");
        sb.append("Date: ").append(ctr.getGeneratedDate()).append("\n\n");

        sb.append("Transaction Information:\n");
        sb.append("User ID: ").append(ctr.getUserId()).append("\n");
        sb.append("Amount: ").append(ctr.getAmount()).append(" ").append(ctr.getCurrency()).append("\n");
        sb.append("Date: ").append(ctr.getTransaction().getDate()).append("\n");
        sb.append("Type: ").append(ctr.getTransaction().getType()).append("\n");

        return sb.toString();
    }

    private String formatPeriodicReport(RegulatoryJurisdiction jurisdiction,
                                       ReportingPeriod period,
                                       CompliancePeriodicReport report) {
        StringBuilder sb = new StringBuilder();

        sb.append(String.format("%s COMPLIANCE REPORT - %s\n", period.toString().toUpperCase(), jurisdiction.getName()));
        sb.append("Report ID: ").append(report.getReportId()).append("\n");
        sb.append("Period: ").append(report.getPeriodStart()).append(" to ").append(report.getPeriodEnd()).append("\n\n");

        ComplianceStatistics stats = report.getStatistics();
        if (stats != null) {
            sb.append("Compliance Statistics:\n");
            sb.append("Total Users: ").append(stats.getTotalUsers()).append("\n");
            sb.append("Verified Users: ").append(stats.getVerifiedUsers()).append("\n");
            sb.append("Total Transactions: ").append(stats.getTotalTransactions()).append("\n");
            sb.append("Total Volume: ").append(stats.getTotalVolume()).append("\n");
            sb.append("SARs Filed: ").append(stats.getSarsCount()).append("\n");
            sb.append("CTRs Filed: ").append(stats.getCtrsCount()).append("\n");
        }

        return sb.toString();
    }

    // ==================== Helper Methods ====================

    private String generateReportId(String prefix, RegulatoryJurisdiction jurisdiction) {
        String timestamp = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(
            Instant.now().atZone(ZoneId.systemDefault())
        );
        return String.format("%s-%s-%s", prefix, jurisdiction.getCode(), timestamp);
    }

    private String getSubmissionEndpoint(RegulatoryJurisdiction jurisdiction, ReportType reportType) {
        // In production: return actual regulatory API endpoints
        return switch (jurisdiction) {
            case US -> "https://www.fincen.gov/api/reports"; // FinCEN
            case EU -> "https://www.esma.europa.eu/api/reports"; // ESMA
            case UK -> "https://www.fca.org.uk/api/reports"; // FCA
            case SINGAPORE -> "https://www.mas.gov.sg/api/reports"; // MAS
            case AUSTRALIA -> "https://www.asic.gov.au/api/reports"; // ASIC
            case CANADA -> "https://www.securities-administrators.ca/api/reports"; // CSA
            default -> "https://regulatory-reports.example.com/api/" + jurisdiction.getCode();
        };
    }

    private boolean simulateSubmission(String endpoint, RegulatoryReport report) {
        // In production: actual HTTP POST to regulatory API
        Log.infof("Simulating submission to %s for report %s", endpoint, report.getReportId());
        return true;
    }

    private String generateConfirmationNumber() {
        return "CONF-" + UUID.randomUUID().toString();
    }

    private void recordSubmission(String reportId, SubmissionResult result) {
        SubmissionHistory history = new SubmissionHistory();
        history.setReportId(reportId);
        history.setSubmissionTime(result.getSubmissionTime());
        history.setSuccess(result.isSuccess());
        history.setConfirmationNumber(result.getConfirmationNumber());
        history.setErrorMessage(result.getErrorMessage());

        submissionHistory.computeIfAbsent(reportId, k -> new ArrayList<>()).add(history);
    }

    private Urgency determineUrgency(String reason) {
        if (reason.toLowerCase().contains("terrorist") || reason.toLowerCase().contains("terrorism")) {
            return Urgency.CRITICAL;
        } else if (reason.toLowerCase().contains("structuring") || reason.toLowerCase().contains("money laundering")) {
            return Urgency.HIGH;
        } else {
            return Urgency.NORMAL;
        }
    }

    private ComplianceStatistics gatherComplianceStatistics(RegulatoryJurisdiction jurisdiction,
                                                           LocalDate periodStart,
                                                           LocalDate periodEnd) {
        // In production: query database for actual statistics
        ComplianceStatistics stats = new ComplianceStatistics();
        stats.setTotalUsers(1000);
        stats.setVerifiedUsers(950);
        stats.setTotalTransactions(50000);
        stats.setTotalVolume(new BigDecimal("1000000.00"));
        stats.setSarsCount(5);
        stats.setCtrsCount(25);
        return stats;
    }

    // ==================== Enums ====================

    public enum ReportType {
        TRANSACTION_REPORT,
        SUSPICIOUS_ACTIVITY,
        CURRENCY_TRANSACTION,
        PERIODIC_COMPLIANCE,
        AUDIT_REPORT,
        HOLDINGS_REPORT
    }

    public enum ReportingPeriod {
        DAILY,
        WEEKLY,
        MONTHLY,
        QUARTERLY,
        ANNUAL
    }

    public enum Urgency {
        NORMAL,
        HIGH,
        CRITICAL
    }

    // ==================== Data Classes ====================

    public static class RegulatoryReport {
        protected String reportId;
        protected RegulatoryJurisdiction jurisdiction;
        protected LocalDate generatedDate;
        protected ReportType reportType;
        protected String formattedContent;

        // Getters and setters
        public String getReportId() { return reportId; }
        public void setReportId(String reportId) { this.reportId = reportId; }
        public RegulatoryJurisdiction getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(RegulatoryJurisdiction jurisdiction) { this.jurisdiction = jurisdiction; }
        public LocalDate getGeneratedDate() { return generatedDate; }
        public void setGeneratedDate(LocalDate generatedDate) { this.generatedDate = generatedDate; }
        public ReportType getReportType() { return reportType; }
        public void setReportType(ReportType reportType) { this.reportType = reportType; }
        public String getFormattedContent() { return formattedContent; }
        public void setFormattedContent(String formattedContent) { this.formattedContent = formattedContent; }
    }

    public static class TransactionReport extends RegulatoryReport {
        private LocalDate startDate;
        private LocalDate endDate;
        private int transactionCount;
        private BigDecimal totalVolume;
        private List<TransactionData> transactions;

        // Getters and setters
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public int getTransactionCount() { return transactionCount; }
        public void setTransactionCount(int transactionCount) { this.transactionCount = transactionCount; }
        public BigDecimal getTotalVolume() { return totalVolume; }
        public void setTotalVolume(BigDecimal totalVolume) { this.totalVolume = totalVolume; }
        public List<TransactionData> getTransactions() { return transactions; }
        public void setTransactions(List<TransactionData> transactions) { this.transactions = transactions; }
    }

    public static class SuspiciousActivityReport extends RegulatoryReport {
        private String userId;
        private String suspicionReason;
        private BigDecimal totalSuspiciousAmount;
        private int transactionCount;
        private List<TransactionData> transactions;
        private Urgency urgency;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getSuspicionReason() { return suspicionReason; }
        public void setSuspicionReason(String suspicionReason) { this.suspicionReason = suspicionReason; }
        public BigDecimal getTotalSuspiciousAmount() { return totalSuspiciousAmount; }
        public void setTotalSuspiciousAmount(BigDecimal totalSuspiciousAmount) { this.totalSuspiciousAmount = totalSuspiciousAmount; }
        public int getTransactionCount() { return transactionCount; }
        public void setTransactionCount(int transactionCount) { this.transactionCount = transactionCount; }
        public List<TransactionData> getTransactions() { return transactions; }
        public void setTransactions(List<TransactionData> transactions) { this.transactions = transactions; }
        public Urgency getUrgency() { return urgency; }
        public void setUrgency(Urgency urgency) { this.urgency = urgency; }
    }

    public static class CurrencyTransactionReport extends RegulatoryReport {
        private String userId;
        private BigDecimal amount;
        private String currency;
        private TransactionData transaction;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public TransactionData getTransaction() { return transaction; }
        public void setTransaction(TransactionData transaction) { this.transaction = transaction; }
    }

    public static class CompliancePeriodicReport extends RegulatoryReport {
        private ReportingPeriod period;
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private ComplianceStatistics statistics;

        // Getters and setters
        public ReportingPeriod getPeriod() { return period; }
        public void setPeriod(ReportingPeriod period) { this.period = period; }
        public LocalDate getPeriodStart() { return periodStart; }
        public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }
        public LocalDate getPeriodEnd() { return periodEnd; }
        public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
        public ComplianceStatistics getStatistics() { return statistics; }
        public void setStatistics(ComplianceStatistics statistics) { this.statistics = statistics; }
    }

    public static class TransactionData {
        private String transactionId;
        private LocalDate date;
        private String type;
        private BigDecimal amount;
        private String currency;

        // Getters and setters
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
    }

    public static class ComplianceStatistics {
        private int totalUsers;
        private int verifiedUsers;
        private int totalTransactions;
        private BigDecimal totalVolume;
        private int sarsCount;
        private int ctrsCount;

        // Getters and setters
        public int getTotalUsers() { return totalUsers; }
        public void setTotalUsers(int totalUsers) { this.totalUsers = totalUsers; }
        public int getVerifiedUsers() { return verifiedUsers; }
        public void setVerifiedUsers(int verifiedUsers) { this.verifiedUsers = verifiedUsers; }
        public int getTotalTransactions() { return totalTransactions; }
        public void setTotalTransactions(int totalTransactions) { this.totalTransactions = totalTransactions; }
        public BigDecimal getTotalVolume() { return totalVolume; }
        public void setTotalVolume(BigDecimal totalVolume) { this.totalVolume = totalVolume; }
        public int getSarsCount() { return sarsCount; }
        public void setSarsCount(int sarsCount) { this.sarsCount = sarsCount; }
        public int getCtrsCount() { return ctrsCount; }
        public void setCtrsCount(int ctrsCount) { this.ctrsCount = ctrsCount; }
    }

    public static class SubmissionResult {
        private String reportId;
        private boolean success;
        private String confirmationNumber;
        private Instant submissionTime;
        private String submissionEndpoint;
        private String errorMessage;

        // Getters and setters
        public String getReportId() { return reportId; }
        public void setReportId(String reportId) { this.reportId = reportId; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getConfirmationNumber() { return confirmationNumber; }
        public void setConfirmationNumber(String confirmationNumber) { this.confirmationNumber = confirmationNumber; }
        public Instant getSubmissionTime() { return submissionTime; }
        public void setSubmissionTime(Instant submissionTime) { this.submissionTime = submissionTime; }
        public String getSubmissionEndpoint() { return submissionEndpoint; }
        public void setSubmissionEndpoint(String submissionEndpoint) { this.submissionEndpoint = submissionEndpoint; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    public static class SubmissionHistory {
        private String reportId;
        private Instant submissionTime;
        private boolean success;
        private String confirmationNumber;
        private String errorMessage;

        // Getters and setters
        public String getReportId() { return reportId; }
        public void setReportId(String reportId) { this.reportId = reportId; }
        public Instant getSubmissionTime() { return submissionTime; }
        public void setSubmissionTime(Instant submissionTime) { this.submissionTime = submissionTime; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getConfirmationNumber() { return confirmationNumber; }
        public void setConfirmationNumber(String confirmationNumber) { this.confirmationNumber = confirmationNumber; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
}
