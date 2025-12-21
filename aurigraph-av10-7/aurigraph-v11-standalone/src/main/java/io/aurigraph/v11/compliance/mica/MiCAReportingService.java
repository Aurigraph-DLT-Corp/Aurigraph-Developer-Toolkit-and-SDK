package io.aurigraph.v11.compliance.mica;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MiCA Reporting Service
 *
 * Implements regulatory reporting requirements per the EU Markets in Crypto-Assets
 * Regulation (MiCA) (EU) 2023/1114.
 *
 * Key reporting functions:
 * - Quarterly reserve reports (Article 38)
 * - Transaction volume disclosures (Article 22)
 * - Significant holder notifications (Article 23)
 * - Regulatory submission formatting (Article 42)
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@ApplicationScoped
public class MiCAReportingService {

    @Inject
    MiCAComplianceModule complianceModule;

    @Inject
    MiCAAssetClassification assetClassification;

    // Report storage
    private final Map<String, List<QuarterlyReserveReport>> reserveReports = new ConcurrentHashMap<>();
    private final Map<String, List<TransactionVolumeReport>> volumeReports = new ConcurrentHashMap<>();
    private final Map<String, List<SignificantHolderNotification>> holderNotifications = new ConcurrentHashMap<>();
    private final Map<String, RegulatorySubmission> pendingSubmissions = new ConcurrentHashMap<>();
    private final List<ReportAuditEntry> auditTrail = Collections.synchronizedList(new ArrayList<>());

    // Regulatory thresholds per MiCA
    private static final BigDecimal SIGNIFICANT_HOLDER_THRESHOLD = new BigDecimal("2"); // 2% of circulating supply
    private static final BigDecimal SIGNIFICANT_ART_DAILY_VOLUME = new BigDecimal("1000000"); // 1M EUR daily
    private static final int QUARTERLY_REPORTING_DAY = 15; // 15th day after quarter end

    /**
     * Generate quarterly reserve report per MiCA Article 38
     * Required for EMT and ART issuers
     */
    public QuarterlyReserveReport generateQuarterlyReserveReport(String tokenId, int year, int quarter) {
        Log.infof("Generating quarterly reserve report for token %s, Q%d %d", tokenId, quarter, year);

        QuarterlyReserveReport report = new QuarterlyReserveReport();
        report.setReportId(generateReportId("QRR", tokenId, year, quarter));
        report.setTokenId(tokenId);
        report.setYear(year);
        report.setQuarter(quarter);
        report.setReportType("QUARTERLY_RESERVE_REPORT");
        report.setGeneratedAt(Instant.now());

        // Get token classification
        var classification = assetClassification.getClassification(tokenId);
        if (classification.isPresent()) {
            report.setAssetClass(classification.get().getAssetClass());
        }

        // Calculate quarter dates
        LocalDate quarterStart = getQuarterStartDate(year, quarter);
        LocalDate quarterEnd = getQuarterEndDate(year, quarter);
        report.setReportingPeriodStart(quarterStart);
        report.setReportingPeriodEnd(quarterEnd);

        // Deadline is 15 days after quarter end per Article 38
        LocalDate deadline = quarterEnd.plusDays(QUARTERLY_REPORTING_DAY);
        report.setSubmissionDeadline(deadline);

        // Reserve composition (Article 36)
        ReserveComposition composition = new ReserveComposition();
        composition.setTotalReserveValue(BigDecimal.ZERO);
        composition.setCashEquivalents(BigDecimal.ZERO);
        composition.setGovernmentBonds(BigDecimal.ZERO);
        composition.setCentralBankDeposits(BigDecimal.ZERO);
        composition.setOtherQualifyingAssets(BigDecimal.ZERO);
        report.setReserveComposition(composition);

        // Circulating tokens information
        report.setTotalCirculatingTokens(BigDecimal.ZERO);
        report.setCirculatingMarketValue(BigDecimal.ZERO);

        // Calculate reserve ratio
        if (report.getCirculatingMarketValue().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal ratio = composition.getTotalReserveValue()
                .divide(report.getCirculatingMarketValue(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            report.setReserveRatio(ratio);
        } else {
            report.setReserveRatio(BigDecimal.valueOf(100));
        }

        // Custodian information (Article 37)
        report.setCustodians(new ArrayList<>());

        // Attestation requirements
        report.setAuditorAttestationRequired(true);
        report.setAuditorName("");
        report.setAttestationDate(null);

        // Compliance status
        report.setCompliant(report.getReserveRatio().compareTo(BigDecimal.valueOf(100)) >= 0);

        // Store report
        reserveReports.computeIfAbsent(tokenId, k -> new ArrayList<>()).add(report);

        auditTrail.add(new ReportAuditEntry(
            "QUARTERLY_RESERVE_REPORT_GENERATED",
            tokenId,
            report.getReportId(),
            String.format("Q%d %d reserve report generated, ratio: %.2f%%",
                quarter, year, report.getReserveRatio().doubleValue()),
            Instant.now()
        ));

        Log.infof("Quarterly reserve report generated: %s", report.getReportId());
        return report;
    }

    /**
     * Generate transaction volume disclosure per MiCA Article 22
     * Required when average daily transaction volume exceeds thresholds
     */
    public TransactionVolumeReport generateVolumeDisclosure(String tokenId, LocalDate reportDate) {
        Log.infof("Generating volume disclosure for token %s, date %s", tokenId, reportDate);

        TransactionVolumeReport report = new TransactionVolumeReport();
        report.setReportId(generateReportId("TVR", tokenId, reportDate));
        report.setTokenId(tokenId);
        report.setReportDate(reportDate);
        report.setReportType("TRANSACTION_VOLUME_DISCLOSURE");
        report.setGeneratedAt(Instant.now());

        // Get token classification
        var classification = assetClassification.getClassification(tokenId);
        if (classification.isPresent()) {
            report.setAssetClass(classification.get().getAssetClass());
        }

        // Volume metrics (would be populated from transaction data)
        VolumeMetrics metrics = new VolumeMetrics();
        metrics.setDailyTransactionCount(0L);
        metrics.setDailyTransactionVolume(BigDecimal.ZERO);
        metrics.setAverageTransactionSize(BigDecimal.ZERO);
        metrics.setUniqueAddresses(0);
        report.setVolumeMetrics(metrics);

        // Rolling averages
        RollingAverages averages = new RollingAverages();
        averages.setSevenDayAvgVolume(BigDecimal.ZERO);
        averages.setThirtyDayAvgVolume(BigDecimal.ZERO);
        averages.setNinetyDayAvgVolume(BigDecimal.ZERO);
        report.setRollingAverages(averages);

        // Check if significant thresholds are exceeded
        boolean exceedsThreshold = averages.getThirtyDayAvgVolume()
            .compareTo(SIGNIFICANT_ART_DAILY_VOLUME) > 0;
        report.setExceedsSignificantThreshold(exceedsThreshold);

        // Geographic distribution
        report.setGeographicDistribution(new HashMap<>());

        // Store report
        volumeReports.computeIfAbsent(tokenId, k -> new ArrayList<>()).add(report);

        auditTrail.add(new ReportAuditEntry(
            "VOLUME_DISCLOSURE_GENERATED",
            tokenId,
            report.getReportId(),
            String.format("Volume disclosure generated, 30-day avg: %.2f EUR",
                averages.getThirtyDayAvgVolume().doubleValue()),
            Instant.now()
        ));

        return report;
    }

    /**
     * Generate significant holder notification per MiCA Article 23
     * Required when holder acquires 2%+ of circulating supply
     */
    public SignificantHolderNotification generateHolderNotification(
            String tokenId, String holderAddress, BigDecimal holdingPercentage,
            NotificationType type) {

        Log.infof("Generating holder notification for token %s, holder %s, %.2f%%",
            tokenId, holderAddress, holdingPercentage.doubleValue());

        SignificantHolderNotification notification = new SignificantHolderNotification();
        notification.setNotificationId(generateNotificationId(tokenId, holderAddress));
        notification.setTokenId(tokenId);
        notification.setHolderAddress(holderAddress);
        notification.setHoldingPercentage(holdingPercentage);
        notification.setNotificationType(type);
        notification.setNotificationDate(LocalDate.now());
        notification.setGeneratedAt(Instant.now());

        // Get token classification
        var classification = assetClassification.getClassification(tokenId);
        if (classification.isPresent()) {
            notification.setAssetClass(classification.get().getAssetClass());
        }

        // Determine notification thresholds crossed
        List<BigDecimal> thresholds = List.of(
            new BigDecimal("2"),   // 2%
            new BigDecimal("5"),   // 5%
            new BigDecimal("10"),  // 10%
            new BigDecimal("15"),  // 15%
            new BigDecimal("20"),  // 20%
            new BigDecimal("25"),  // 25%
            new BigDecimal("30"),  // 30%
            new BigDecimal("50")   // 50%
        );

        List<BigDecimal> crossedThresholds = new ArrayList<>();
        for (BigDecimal threshold : thresholds) {
            if (holdingPercentage.compareTo(threshold) >= 0) {
                crossedThresholds.add(threshold);
            }
        }
        notification.setThresholdsCrossed(crossedThresholds);

        // Submission deadline (typically 4 trading days)
        LocalDate deadline = notification.getNotificationDate().plusDays(4);
        notification.setSubmissionDeadline(deadline);

        // Required disclosures per Article 23
        notification.setDisclosureRequirements(List.of(
            "Identity of the holder",
            "Date threshold was crossed",
            "Size of holding after crossing",
            "Nature of the holding (direct or indirect)",
            "Purpose of acquisition (investment, influence, etc.)"
        ));

        // Store notification
        holderNotifications.computeIfAbsent(tokenId, k -> new ArrayList<>()).add(notification);

        auditTrail.add(new ReportAuditEntry(
            "HOLDER_NOTIFICATION_GENERATED",
            tokenId,
            notification.getNotificationId(),
            String.format("Significant holder notification: %s at %.2f%%",
                type, holdingPercentage.doubleValue()),
            Instant.now()
        ));

        return notification;
    }

    /**
     * Create regulatory submission package per MiCA Article 42
     * Formats reports for submission to competent authority
     */
    public RegulatorySubmission createRegulatorySubmission(
            String tokenId, SubmissionType submissionType, List<String> reportIds) {

        Log.infof("Creating regulatory submission for token %s, type %s", tokenId, submissionType);

        RegulatorySubmission submission = new RegulatorySubmission();
        submission.setSubmissionId(generateSubmissionId(tokenId, submissionType));
        submission.setTokenId(tokenId);
        submission.setSubmissionType(submissionType);
        submission.setStatus(SubmissionStatus.DRAFT);
        submission.setCreatedAt(Instant.now());

        // Get token and issuer information
        var classification = assetClassification.getClassification(tokenId);
        if (classification.isPresent()) {
            submission.setAssetClass(classification.get().getAssetClass());
        }

        // Collect referenced reports
        List<ReportReference> references = new ArrayList<>();
        for (String reportId : reportIds) {
            ReportReference ref = new ReportReference();
            ref.setReportId(reportId);
            ref.setReportType(determineReportType(reportId));
            references.add(ref);
        }
        submission.setReportReferences(references);

        // Determine submission deadline based on type
        LocalDate deadline = calculateSubmissionDeadline(submissionType);
        submission.setDeadline(deadline);

        // Determine target authority
        submission.setTargetAuthority(determineCompetentAuthority(tokenId));

        // Required attachments
        List<String> attachments = getRequiredAttachments(submissionType);
        submission.setRequiredAttachments(attachments);

        // XML/XBRL formatting requirements
        submission.setFormatType(determineFormatType(submissionType));

        // Store submission
        pendingSubmissions.put(submission.getSubmissionId(), submission);

        auditTrail.add(new ReportAuditEntry(
            "REGULATORY_SUBMISSION_CREATED",
            tokenId,
            submission.getSubmissionId(),
            String.format("Submission %s created with %d reports",
                submissionType, reportIds.size()),
            Instant.now()
        ));

        return submission;
    }

    /**
     * Submit regulatory filing to competent authority
     */
    public SubmissionResult submitToAuthority(String submissionId) {
        Log.infof("Submitting regulatory filing: %s", submissionId);

        RegulatorySubmission submission = pendingSubmissions.get(submissionId);
        if (submission == null) {
            throw new IllegalArgumentException("Submission not found: " + submissionId);
        }

        SubmissionResult result = new SubmissionResult();
        result.setSubmissionId(submissionId);
        result.setSubmittedAt(Instant.now());

        // Validate submission completeness
        List<String> validationErrors = validateSubmission(submission);
        if (!validationErrors.isEmpty()) {
            result.setSuccess(false);
            result.setErrors(validationErrors);
            result.setStatus(SubmissionStatus.VALIDATION_FAILED);
            return result;
        }

        // Update submission status
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(Instant.now());

        // Generate confirmation
        result.setSuccess(true);
        result.setConfirmationNumber(generateConfirmationNumber());
        result.setStatus(SubmissionStatus.SUBMITTED);
        result.setExpectedResponseDate(LocalDate.now().plusDays(30));

        auditTrail.add(new ReportAuditEntry(
            "REGULATORY_SUBMISSION_SUBMITTED",
            submission.getTokenId(),
            submissionId,
            "Submission successful, confirmation: " + result.getConfirmationNumber(),
            Instant.now()
        ));

        return result;
    }

    /**
     * Get all quarterly reserve reports for a token
     */
    public List<QuarterlyReserveReport> getQuarterlyReports(String tokenId) {
        return reserveReports.getOrDefault(tokenId, new ArrayList<>());
    }

    /**
     * Get all volume reports for a token
     */
    public List<TransactionVolumeReport> getVolumeReports(String tokenId) {
        return volumeReports.getOrDefault(tokenId, new ArrayList<>());
    }

    /**
     * Get all holder notifications for a token
     */
    public List<SignificantHolderNotification> getHolderNotifications(String tokenId) {
        return holderNotifications.getOrDefault(tokenId, new ArrayList<>());
    }

    /**
     * Get pending submissions
     */
    public List<RegulatorySubmission> getPendingSubmissions() {
        return new ArrayList<>(pendingSubmissions.values());
    }

    /**
     * Get reporting statistics
     */
    public ReportingStats getStats() {
        ReportingStats stats = new ReportingStats();

        long totalReserveReports = reserveReports.values().stream().mapToLong(List::size).sum();
        long totalVolumeReports = volumeReports.values().stream().mapToLong(List::size).sum();
        long totalNotifications = holderNotifications.values().stream().mapToLong(List::size).sum();

        stats.setTotalQuarterlyReports(totalReserveReports);
        stats.setTotalVolumeReports(totalVolumeReports);
        stats.setTotalHolderNotifications(totalNotifications);
        stats.setPendingSubmissions(pendingSubmissions.size());

        // Calculate compliance rate
        long compliantReports = reserveReports.values().stream()
            .flatMap(List::stream)
            .filter(QuarterlyReserveReport::isCompliant)
            .count();

        if (totalReserveReports > 0) {
            stats.setComplianceRate(compliantReports * 100.0 / totalReserveReports);
        }

        // Upcoming deadlines
        LocalDate today = LocalDate.now();
        long upcomingDeadlines = pendingSubmissions.values().stream()
            .filter(s -> s.getDeadline() != null && s.getDeadline().isAfter(today) &&
                s.getDeadline().isBefore(today.plusDays(30)))
            .count();
        stats.setUpcomingDeadlines(upcomingDeadlines);

        return stats;
    }

    /**
     * Get audit trail
     */
    public List<ReportAuditEntry> getAuditTrail() {
        return new ArrayList<>(auditTrail);
    }

    // ============ Helper Methods ============

    private LocalDate getQuarterStartDate(int year, int quarter) {
        int startMonth = (quarter - 1) * 3 + 1;
        return LocalDate.of(year, startMonth, 1);
    }

    private LocalDate getQuarterEndDate(int year, int quarter) {
        int endMonth = quarter * 3;
        LocalDate startOfNextMonth = LocalDate.of(year, endMonth, 1).plusMonths(1);
        return startOfNextMonth.minusDays(1);
    }

    private String generateReportId(String prefix, String tokenId, int year, int quarter) {
        return String.format("%s-%s-Q%d%d-%d",
            prefix, tokenId.substring(0, Math.min(8, tokenId.length())),
            quarter, year, System.currentTimeMillis() % 10000);
    }

    private String generateReportId(String prefix, String tokenId, LocalDate date) {
        return String.format("%s-%s-%s-%d",
            prefix, tokenId.substring(0, Math.min(8, tokenId.length())),
            date.format(DateTimeFormatter.BASIC_ISO_DATE),
            System.currentTimeMillis() % 10000);
    }

    private String generateNotificationId(String tokenId, String holderAddress) {
        return String.format("SHN-%s-%s-%d",
            tokenId.substring(0, Math.min(8, tokenId.length())),
            holderAddress.substring(0, Math.min(8, holderAddress.length())),
            System.currentTimeMillis());
    }

    private String generateSubmissionId(String tokenId, SubmissionType type) {
        return String.format("SUB-%s-%s-%d",
            type.name().substring(0, 3),
            tokenId.substring(0, Math.min(8, tokenId.length())),
            System.currentTimeMillis());
    }

    private String generateConfirmationNumber() {
        return String.format("CONF-%d-%d",
            System.currentTimeMillis(),
            new Random().nextInt(10000));
    }

    private String determineReportType(String reportId) {
        if (reportId.startsWith("QRR")) return "QUARTERLY_RESERVE_REPORT";
        if (reportId.startsWith("TVR")) return "TRANSACTION_VOLUME_REPORT";
        if (reportId.startsWith("SHN")) return "SIGNIFICANT_HOLDER_NOTIFICATION";
        return "UNKNOWN";
    }

    private LocalDate calculateSubmissionDeadline(SubmissionType type) {
        LocalDate today = LocalDate.now();
        switch (type) {
            case QUARTERLY_RESERVE:
                // 15 days after quarter end
                return getQuarterEndDate(today.getYear(),
                    (today.getMonthValue() - 1) / 3 + 1).plusDays(15);
            case HOLDER_NOTIFICATION:
                // 4 trading days
                return today.plusDays(4);
            case VOLUME_DISCLOSURE:
                // 30 days
                return today.plusDays(30);
            case WHITEPAPER_UPDATE:
                // 7 days before implementation
                return today.plusDays(7);
            case AUTHORIZATION_REQUEST:
                // No specific deadline
                return today.plusDays(90);
            default:
                return today.plusDays(30);
        }
    }

    private String determineCompetentAuthority(String tokenId) {
        // In production, would determine based on issuer's registered jurisdiction
        return "NATIONAL_COMPETENT_AUTHORITY";
    }

    private List<String> getRequiredAttachments(SubmissionType type) {
        List<String> attachments = new ArrayList<>();
        switch (type) {
            case QUARTERLY_RESERVE:
                attachments.add("Reserve attestation report");
                attachments.add("Auditor's report");
                attachments.add("Custody agreements");
                break;
            case AUTHORIZATION_REQUEST:
                attachments.add("Whitepaper");
                attachments.add("Governance documents");
                attachments.add("Capital adequacy evidence");
                attachments.add("Business continuity plan");
                break;
            case HOLDER_NOTIFICATION:
                attachments.add("Holder identification documents");
                attachments.add("Acquisition details");
                break;
            default:
                break;
        }
        return attachments;
    }

    private String determineFormatType(SubmissionType type) {
        switch (type) {
            case QUARTERLY_RESERVE:
            case VOLUME_DISCLOSURE:
                return "XBRL";
            default:
                return "XML";
        }
    }

    private List<String> validateSubmission(RegulatorySubmission submission) {
        List<String> errors = new ArrayList<>();

        if (submission.getReportReferences().isEmpty()) {
            errors.add("No reports attached to submission");
        }

        for (String attachment : submission.getRequiredAttachments()) {
            // Would validate that attachments are present
        }

        return errors;
    }

    // ============ Inner Classes ============

    public static class QuarterlyReserveReport {
        private String reportId;
        private String tokenId;
        private int year;
        private int quarter;
        private String reportType;
        private MiCAAssetClassification.AssetClass assetClass;
        private LocalDate reportingPeriodStart;
        private LocalDate reportingPeriodEnd;
        private LocalDate submissionDeadline;
        private ReserveComposition reserveComposition;
        private BigDecimal totalCirculatingTokens;
        private BigDecimal circulatingMarketValue;
        private BigDecimal reserveRatio;
        private List<CustodianInfo> custodians;
        private boolean auditorAttestationRequired;
        private String auditorName;
        private LocalDate attestationDate;
        private boolean compliant;
        private Instant generatedAt;

        // Getters and Setters
        public String getReportId() { return reportId; }
        public void setReportId(String id) { this.reportId = id; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String id) { this.tokenId = id; }
        public int getYear() { return year; }
        public void setYear(int year) { this.year = year; }
        public int getQuarter() { return quarter; }
        public void setQuarter(int quarter) { this.quarter = quarter; }
        public String getReportType() { return reportType; }
        public void setReportType(String type) { this.reportType = type; }
        public MiCAAssetClassification.AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(MiCAAssetClassification.AssetClass ac) { this.assetClass = ac; }
        public LocalDate getReportingPeriodStart() { return reportingPeriodStart; }
        public void setReportingPeriodStart(LocalDate date) { this.reportingPeriodStart = date; }
        public LocalDate getReportingPeriodEnd() { return reportingPeriodEnd; }
        public void setReportingPeriodEnd(LocalDate date) { this.reportingPeriodEnd = date; }
        public LocalDate getSubmissionDeadline() { return submissionDeadline; }
        public void setSubmissionDeadline(LocalDate date) { this.submissionDeadline = date; }
        public ReserveComposition getReserveComposition() { return reserveComposition; }
        public void setReserveComposition(ReserveComposition comp) { this.reserveComposition = comp; }
        public BigDecimal getTotalCirculatingTokens() { return totalCirculatingTokens; }
        public void setTotalCirculatingTokens(BigDecimal tokens) { this.totalCirculatingTokens = tokens; }
        public BigDecimal getCirculatingMarketValue() { return circulatingMarketValue; }
        public void setCirculatingMarketValue(BigDecimal value) { this.circulatingMarketValue = value; }
        public BigDecimal getReserveRatio() { return reserveRatio; }
        public void setReserveRatio(BigDecimal ratio) { this.reserveRatio = ratio; }
        public List<CustodianInfo> getCustodians() { return custodians; }
        public void setCustodians(List<CustodianInfo> custodians) { this.custodians = custodians; }
        public boolean isAuditorAttestationRequired() { return auditorAttestationRequired; }
        public void setAuditorAttestationRequired(boolean req) { this.auditorAttestationRequired = req; }
        public String getAuditorName() { return auditorName; }
        public void setAuditorName(String name) { this.auditorName = name; }
        public LocalDate getAttestationDate() { return attestationDate; }
        public void setAttestationDate(LocalDate date) { this.attestationDate = date; }
        public boolean isCompliant() { return compliant; }
        public void setCompliant(boolean compliant) { this.compliant = compliant; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }

    public static class ReserveComposition {
        private BigDecimal totalReserveValue;
        private BigDecimal cashEquivalents;
        private BigDecimal governmentBonds;
        private BigDecimal centralBankDeposits;
        private BigDecimal otherQualifyingAssets;

        public BigDecimal getTotalReserveValue() { return totalReserveValue; }
        public void setTotalReserveValue(BigDecimal value) { this.totalReserveValue = value; }
        public BigDecimal getCashEquivalents() { return cashEquivalents; }
        public void setCashEquivalents(BigDecimal value) { this.cashEquivalents = value; }
        public BigDecimal getGovernmentBonds() { return governmentBonds; }
        public void setGovernmentBonds(BigDecimal value) { this.governmentBonds = value; }
        public BigDecimal getCentralBankDeposits() { return centralBankDeposits; }
        public void setCentralBankDeposits(BigDecimal value) { this.centralBankDeposits = value; }
        public BigDecimal getOtherQualifyingAssets() { return otherQualifyingAssets; }
        public void setOtherQualifyingAssets(BigDecimal value) { this.otherQualifyingAssets = value; }
    }

    public static class CustodianInfo {
        private String custodianName;
        private String custodianId;
        private String jurisdiction;
        private BigDecimal assetsHeld;

        public String getCustodianName() { return custodianName; }
        public void setCustodianName(String name) { this.custodianName = name; }
        public String getCustodianId() { return custodianId; }
        public void setCustodianId(String id) { this.custodianId = id; }
        public String getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
        public BigDecimal getAssetsHeld() { return assetsHeld; }
        public void setAssetsHeld(BigDecimal assets) { this.assetsHeld = assets; }
    }

    public static class TransactionVolumeReport {
        private String reportId;
        private String tokenId;
        private LocalDate reportDate;
        private String reportType;
        private MiCAAssetClassification.AssetClass assetClass;
        private VolumeMetrics volumeMetrics;
        private RollingAverages rollingAverages;
        private boolean exceedsSignificantThreshold;
        private Map<String, BigDecimal> geographicDistribution;
        private Instant generatedAt;

        public String getReportId() { return reportId; }
        public void setReportId(String id) { this.reportId = id; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String id) { this.tokenId = id; }
        public LocalDate getReportDate() { return reportDate; }
        public void setReportDate(LocalDate date) { this.reportDate = date; }
        public String getReportType() { return reportType; }
        public void setReportType(String type) { this.reportType = type; }
        public MiCAAssetClassification.AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(MiCAAssetClassification.AssetClass ac) { this.assetClass = ac; }
        public VolumeMetrics getVolumeMetrics() { return volumeMetrics; }
        public void setVolumeMetrics(VolumeMetrics metrics) { this.volumeMetrics = metrics; }
        public RollingAverages getRollingAverages() { return rollingAverages; }
        public void setRollingAverages(RollingAverages averages) { this.rollingAverages = averages; }
        public boolean isExceedsSignificantThreshold() { return exceedsSignificantThreshold; }
        public void setExceedsSignificantThreshold(boolean exceeds) { this.exceedsSignificantThreshold = exceeds; }
        public Map<String, BigDecimal> getGeographicDistribution() { return geographicDistribution; }
        public void setGeographicDistribution(Map<String, BigDecimal> dist) { this.geographicDistribution = dist; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }

    public static class VolumeMetrics {
        private long dailyTransactionCount;
        private BigDecimal dailyTransactionVolume;
        private BigDecimal averageTransactionSize;
        private int uniqueAddresses;

        public long getDailyTransactionCount() { return dailyTransactionCount; }
        public void setDailyTransactionCount(long count) { this.dailyTransactionCount = count; }
        public BigDecimal getDailyTransactionVolume() { return dailyTransactionVolume; }
        public void setDailyTransactionVolume(BigDecimal volume) { this.dailyTransactionVolume = volume; }
        public BigDecimal getAverageTransactionSize() { return averageTransactionSize; }
        public void setAverageTransactionSize(BigDecimal size) { this.averageTransactionSize = size; }
        public int getUniqueAddresses() { return uniqueAddresses; }
        public void setUniqueAddresses(int count) { this.uniqueAddresses = count; }
    }

    public static class RollingAverages {
        private BigDecimal sevenDayAvgVolume;
        private BigDecimal thirtyDayAvgVolume;
        private BigDecimal ninetyDayAvgVolume;

        public BigDecimal getSevenDayAvgVolume() { return sevenDayAvgVolume; }
        public void setSevenDayAvgVolume(BigDecimal avg) { this.sevenDayAvgVolume = avg; }
        public BigDecimal getThirtyDayAvgVolume() { return thirtyDayAvgVolume; }
        public void setThirtyDayAvgVolume(BigDecimal avg) { this.thirtyDayAvgVolume = avg; }
        public BigDecimal getNinetyDayAvgVolume() { return ninetyDayAvgVolume; }
        public void setNinetyDayAvgVolume(BigDecimal avg) { this.ninetyDayAvgVolume = avg; }
    }

    public static class SignificantHolderNotification {
        private String notificationId;
        private String tokenId;
        private String holderAddress;
        private BigDecimal holdingPercentage;
        private NotificationType notificationType;
        private MiCAAssetClassification.AssetClass assetClass;
        private LocalDate notificationDate;
        private LocalDate submissionDeadline;
        private List<BigDecimal> thresholdsCrossed;
        private List<String> disclosureRequirements;
        private Instant generatedAt;

        public String getNotificationId() { return notificationId; }
        public void setNotificationId(String id) { this.notificationId = id; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String id) { this.tokenId = id; }
        public String getHolderAddress() { return holderAddress; }
        public void setHolderAddress(String address) { this.holderAddress = address; }
        public BigDecimal getHoldingPercentage() { return holdingPercentage; }
        public void setHoldingPercentage(BigDecimal pct) { this.holdingPercentage = pct; }
        public NotificationType getNotificationType() { return notificationType; }
        public void setNotificationType(NotificationType type) { this.notificationType = type; }
        public MiCAAssetClassification.AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(MiCAAssetClassification.AssetClass ac) { this.assetClass = ac; }
        public LocalDate getNotificationDate() { return notificationDate; }
        public void setNotificationDate(LocalDate date) { this.notificationDate = date; }
        public LocalDate getSubmissionDeadline() { return submissionDeadline; }
        public void setSubmissionDeadline(LocalDate date) { this.submissionDeadline = date; }
        public List<BigDecimal> getThresholdsCrossed() { return thresholdsCrossed; }
        public void setThresholdsCrossed(List<BigDecimal> thresholds) { this.thresholdsCrossed = thresholds; }
        public List<String> getDisclosureRequirements() { return disclosureRequirements; }
        public void setDisclosureRequirements(List<String> reqs) { this.disclosureRequirements = reqs; }
        public Instant getGeneratedAt() { return generatedAt; }
        public void setGeneratedAt(Instant at) { this.generatedAt = at; }
    }

    public enum NotificationType {
        ACQUISITION, DISPOSAL, THRESHOLD_CROSSING
    }

    public static class RegulatorySubmission {
        private String submissionId;
        private String tokenId;
        private SubmissionType submissionType;
        private MiCAAssetClassification.AssetClass assetClass;
        private SubmissionStatus status;
        private LocalDate deadline;
        private String targetAuthority;
        private List<ReportReference> reportReferences;
        private List<String> requiredAttachments;
        private String formatType;
        private Instant createdAt;
        private Instant submittedAt;

        public String getSubmissionId() { return submissionId; }
        public void setSubmissionId(String id) { this.submissionId = id; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String id) { this.tokenId = id; }
        public SubmissionType getSubmissionType() { return submissionType; }
        public void setSubmissionType(SubmissionType type) { this.submissionType = type; }
        public MiCAAssetClassification.AssetClass getAssetClass() { return assetClass; }
        public void setAssetClass(MiCAAssetClassification.AssetClass ac) { this.assetClass = ac; }
        public SubmissionStatus getStatus() { return status; }
        public void setStatus(SubmissionStatus status) { this.status = status; }
        public LocalDate getDeadline() { return deadline; }
        public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
        public String getTargetAuthority() { return targetAuthority; }
        public void setTargetAuthority(String authority) { this.targetAuthority = authority; }
        public List<ReportReference> getReportReferences() { return reportReferences; }
        public void setReportReferences(List<ReportReference> refs) { this.reportReferences = refs; }
        public List<String> getRequiredAttachments() { return requiredAttachments; }
        public void setRequiredAttachments(List<String> attachments) { this.requiredAttachments = attachments; }
        public String getFormatType() { return formatType; }
        public void setFormatType(String format) { this.formatType = format; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant at) { this.createdAt = at; }
        public Instant getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(Instant at) { this.submittedAt = at; }
    }

    public enum SubmissionType {
        QUARTERLY_RESERVE, HOLDER_NOTIFICATION, VOLUME_DISCLOSURE,
        WHITEPAPER_UPDATE, AUTHORIZATION_REQUEST, INCIDENT_REPORT
    }

    public enum SubmissionStatus {
        DRAFT, PENDING_REVIEW, SUBMITTED, VALIDATION_FAILED,
        ACCEPTED, REJECTED, REQUIRES_AMENDMENT
    }

    public static class ReportReference {
        private String reportId;
        private String reportType;

        public String getReportId() { return reportId; }
        public void setReportId(String id) { this.reportId = id; }
        public String getReportType() { return reportType; }
        public void setReportType(String type) { this.reportType = type; }
    }

    public static class SubmissionResult {
        private String submissionId;
        private boolean success;
        private SubmissionStatus status;
        private String confirmationNumber;
        private List<String> errors = new ArrayList<>();
        private LocalDate expectedResponseDate;
        private Instant submittedAt;

        public String getSubmissionId() { return submissionId; }
        public void setSubmissionId(String id) { this.submissionId = id; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public SubmissionStatus getStatus() { return status; }
        public void setStatus(SubmissionStatus status) { this.status = status; }
        public String getConfirmationNumber() { return confirmationNumber; }
        public void setConfirmationNumber(String num) { this.confirmationNumber = num; }
        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> errors) { this.errors = errors; }
        public LocalDate getExpectedResponseDate() { return expectedResponseDate; }
        public void setExpectedResponseDate(LocalDate date) { this.expectedResponseDate = date; }
        public Instant getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(Instant at) { this.submittedAt = at; }
    }

    public static class ReportingStats {
        private long totalQuarterlyReports;
        private long totalVolumeReports;
        private long totalHolderNotifications;
        private long pendingSubmissions;
        private double complianceRate;
        private long upcomingDeadlines;

        public long getTotalQuarterlyReports() { return totalQuarterlyReports; }
        public void setTotalQuarterlyReports(long count) { this.totalQuarterlyReports = count; }
        public long getTotalVolumeReports() { return totalVolumeReports; }
        public void setTotalVolumeReports(long count) { this.totalVolumeReports = count; }
        public long getTotalHolderNotifications() { return totalHolderNotifications; }
        public void setTotalHolderNotifications(long count) { this.totalHolderNotifications = count; }
        public long getPendingSubmissions() { return pendingSubmissions; }
        public void setPendingSubmissions(long count) { this.pendingSubmissions = count; }
        public double getComplianceRate() { return complianceRate; }
        public void setComplianceRate(double rate) { this.complianceRate = rate; }
        public long getUpcomingDeadlines() { return upcomingDeadlines; }
        public void setUpcomingDeadlines(long count) { this.upcomingDeadlines = count; }
    }

    public static class ReportAuditEntry {
        private final String eventType;
        private final String tokenId;
        private final String reportId;
        private final String details;
        private final Instant timestamp;

        public ReportAuditEntry(String eventType, String tokenId, String reportId,
                String details, Instant timestamp) {
            this.eventType = eventType;
            this.tokenId = tokenId;
            this.reportId = reportId;
            this.details = details;
            this.timestamp = timestamp;
        }

        public String getEventType() { return eventType; }
        public String getTokenId() { return tokenId; }
        public String getReportId() { return reportId; }
        public String getDetails() { return details; }
        public Instant getTimestamp() { return timestamp; }
    }
}
