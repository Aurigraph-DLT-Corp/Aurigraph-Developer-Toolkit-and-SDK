package io.aurigraph.v11.rwa.carbon;

import io.micrometer.core.annotation.Counted;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Carbon Verification Service
 * Handles VVB (Validation and Verification Body) integration for carbon
 * projects.
 *
 * Features:
 * - Third-party verification management
 * - Audit trail maintenance
 * - Re-verification scheduling
 * - VVB accreditation verification
 * - Verification report storage
 * - MRV (Monitoring, Reporting, Verification) coordination
 *
 * VVB Integration:
 * - RINA (Italy)
 * - SGS (Switzerland)
 * - DNV (Norway)
 * - TUV (Germany)
 * - SCS Global Services
 * - Ruby Canyon Environmental
 * - Aster Global Environmental Solutions
 *
 * Standards Support:
 * - ISO 14064-3 (GHG Validation/Verification)
 * - Verra VCS Program Guidelines
 * - Gold Standard Requirements
 * - CDM Validation/Verification Manual
 *
 * @author Aurigraph V12 - RWA Development Agent
 * @version 12.0.0
 * @since 2025-12-21
 */
@ApplicationScoped
public class CarbonVerificationService {

    // Verification records storage
    private final Map<String, VerificationRecord> verificationRecords = new ConcurrentHashMap<>();
    private final Map<String, List<String>> projectVerifications = new ConcurrentHashMap<>(); // projectId ->
                                                                                              // verificationIds
    private final Map<String, VVBProfile> vvbRegistry = new ConcurrentHashMap<>();
    private final Map<String, AuditTrailEntry> auditTrail = new ConcurrentHashMap<>();

    @Inject
    MeterRegistry meterRegistry;

    @Inject
    CarbonCreditRegistry creditRegistry;

    @ConfigProperty(name = "carbon.verification.require-accredited-vvb", defaultValue = "true")
    boolean requireAccreditedVVB;

    @ConfigProperty(name = "carbon.verification.default-period-years", defaultValue = "5")
    int defaultVerificationPeriodYears;

    @ConfigProperty(name = "carbon.verification.grace-period-days", defaultValue = "90")
    int verificationGracePeriodDays;

    /**
     * Initialize VVB registry with known verification bodies
     */
    public void initializeVVBRegistry() {
        registerVVB(new VVBProfile(
                "VVB-RINA-001",
                "RINA Services S.p.A.",
                "Italy",
                List.of(AccreditationStandard.ISO_14064_3, AccreditationStandard.VCS,
                        AccreditationStandard.GOLD_STANDARD),
                List.of(CarbonProject.ProjectType.AVOIDED_DEFORESTATION, CarbonProject.ProjectType.SOLAR_ENERGY,
                        CarbonProject.ProjectType.WIND_ENERGY, CarbonProject.ProjectType.AFFORESTATION),
                VVBStatus.ACTIVE,
                "https://www.rina.org",
                LocalDate.of(2020, 1, 1),
                LocalDate.of(2025, 12, 31)));

        registerVVB(new VVBProfile(
                "VVB-SGS-001",
                "SGS SA",
                "Switzerland",
                List.of(AccreditationStandard.ISO_14064_3, AccreditationStandard.VCS, AccreditationStandard.CDM,
                        AccreditationStandard.GOLD_STANDARD),
                List.of(CarbonProject.ProjectType.values()),
                VVBStatus.ACTIVE,
                "https://www.sgs.com",
                LocalDate.of(2019, 6, 1),
                LocalDate.of(2026, 5, 31)));

        registerVVB(new VVBProfile(
                "VVB-DNV-001",
                "DNV GL",
                "Norway",
                List.of(AccreditationStandard.ISO_14064_3, AccreditationStandard.VCS, AccreditationStandard.CDM),
                List.of(CarbonProject.ProjectType.SOLAR_ENERGY, CarbonProject.ProjectType.WIND_ENERGY,
                        CarbonProject.ProjectType.INDUSTRIAL_GAS, CarbonProject.ProjectType.INDUSTRIAL_EFFICIENCY),
                VVBStatus.ACTIVE,
                "https://www.dnv.com",
                LocalDate.of(2018, 3, 1),
                LocalDate.of(2025, 2, 28)));

        registerVVB(new VVBProfile(
                "VVB-TUV-001",
                "TUV SUD",
                "Germany",
                List.of(AccreditationStandard.ISO_14064_3, AccreditationStandard.VCS, AccreditationStandard.CDM,
                        AccreditationStandard.GOLD_STANDARD),
                List.of(CarbonProject.ProjectType.values()),
                VVBStatus.ACTIVE,
                "https://www.tuvsud.com",
                LocalDate.of(2017, 1, 1),
                LocalDate.of(2027, 12, 31)));

        registerVVB(new VVBProfile(
                "VVB-SCS-001",
                "SCS Global Services",
                "USA",
                List.of(AccreditationStandard.ISO_14064_3, AccreditationStandard.VCS, AccreditationStandard.ACR,
                        AccreditationStandard.CAR),
                List.of(CarbonProject.ProjectType.AVOIDED_DEFORESTATION, CarbonProject.ProjectType.AFFORESTATION,
                        CarbonProject.ProjectType.IMPROVED_FOREST_MANAGEMENT),
                VVBStatus.ACTIVE,
                "https://www.scsglobalservices.com",
                LocalDate.of(2016, 7, 1),
                LocalDate.of(2026, 6, 30)));

        Log.infof("VVB registry initialized with %d verification bodies", vvbRegistry.size());
    }

    /**
     * Register a VVB (Validation/Verification Body)
     *
     * @param vvb VVB profile to register
     */
    public void registerVVB(VVBProfile vvb) {
        vvbRegistry.put(vvb.vvbId(), vvb);
        meterRegistry.counter("carbon.verification.vvb.registered").increment();
    }

    /**
     * Request project validation (initial design review)
     *
     * @param request Validation request
     * @return Validation record
     */
    @Timed(value = "carbon.verification.request-validation", description = "Time to request validation")
    @Counted(value = "carbon.verification.request-validation.count", description = "Number of validation requests")
    public Uni<VerificationRecord> requestValidation(ValidationRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Requesting validation for project: %s by VVB: %s",
                    request.projectId(), request.vvbId());

            // Validate VVB
            VVBProfile vvb = validateAndGetVVB(request.vvbId(), request.projectType());

            // Create verification record
            String verificationId = generateVerificationId(VerificationType.VALIDATION, request.projectId());

            VerificationRecord record = new VerificationRecord(
                    verificationId,
                    request.projectId(),
                    VerificationType.VALIDATION,
                    request.vvbId(),
                    vvb.name(),
                    VerificationStatus.REQUESTED,
                    null, // No result yet
                    request.scope(),
                    request.methodology(),
                    request.estimatedReductions(),
                    null, // No verified reductions yet
                    null, // No verification period for validation
                    Instant.now(),
                    null, // Not completed
                    null, // No next due
                    null, // No report
                    null, // No findings
                    new ArrayList<>() // No audit entries yet
            );

            verificationRecords.put(verificationId, record);
            projectVerifications.computeIfAbsent(request.projectId(), k -> new ArrayList<>()).add(verificationId);

            // Add audit trail entry
            addAuditEntry(verificationId, "VALIDATION_REQUESTED",
                    String.format("Validation requested for project %s by VVB %s", request.projectId(), vvb.name()),
                    request.requestedBy());

            meterRegistry.counter("carbon.verification.validations.requested").increment();

            return record;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Request project verification (emission reduction verification)
     *
     * @param request Verification request
     * @return Verification record
     */
    @Timed(value = "carbon.verification.request-verification", description = "Time to request verification")
    @Counted(value = "carbon.verification.request-verification.count", description = "Number of verification requests")
    public Uni<VerificationRecord> requestVerification(VerificationRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Requesting verification for project: %s, period: %s to %s",
                    request.projectId(), request.periodStart(), request.periodEnd());

            // Validate VVB
            VVBProfile vvb = validateAndGetVVB(request.vvbId(), request.projectType());

            // Create verification record
            String verificationId = generateVerificationId(VerificationType.VERIFICATION, request.projectId());

            VerificationPeriod period = new VerificationPeriod(
                    request.periodStart(),
                    request.periodEnd(),
                    request.monitoringReportRef());

            VerificationRecord record = new VerificationRecord(
                    verificationId,
                    request.projectId(),
                    VerificationType.VERIFICATION,
                    request.vvbId(),
                    vvb.name(),
                    VerificationStatus.REQUESTED,
                    null,
                    request.scope(),
                    request.methodology(),
                    request.claimedReductions(),
                    null, // verifiedReductions
                    period,
                    Instant.now(),
                    null,
                    null,
                    null,
                    null,
                    new ArrayList<>());

            verificationRecords.put(verificationId, record);
            projectVerifications.computeIfAbsent(request.projectId(), k -> new ArrayList<>()).add(verificationId);

            addAuditEntry(verificationId, "VERIFICATION_REQUESTED",
                    String.format("Verification requested for period %s to %s", request.periodStart(),
                            request.periodEnd()),
                    request.requestedBy());

            meterRegistry.counter("carbon.verification.verifications.requested").increment();

            return record;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Submit verification result (by VVB)
     *
     * @param verificationId Verification ID
     * @param result         Verification result
     * @return Updated verification record
     */
    @Timed(value = "carbon.verification.submit-result", description = "Time to submit verification result")
    public Uni<VerificationRecord> submitVerificationResult(String verificationId,
            VerificationResultSubmission result) {
        return Uni.createFrom().item(() -> {
            VerificationRecord record = verificationRecords.get(verificationId);
            if (record == null) {
                throw new VerificationNotFoundException("Verification not found: " + verificationId);
            }

            // Verify VVB authorization
            if (!record.vvbId().equals(result.vvbId())) {
                throw new UnauthorizedVVBException("VVB not authorized for this verification");
            }

            // Calculate next verification due date
            LocalDate nextDue = null;
            if (result.status() == VerificationStatus.APPROVED) {
                nextDue = LocalDate.now().plusYears(defaultVerificationPeriodYears);
            }

            // Create findings list
            List<VerificationFinding> findings = result.findings() != null ? result.findings() : List.of();

            // Generate report reference
            String reportRef = generateReportReference(verificationId);

            VerificationReport report = new VerificationReport(
                    reportRef,
                    result.reportHash(),
                    result.reportUrl(),
                    result.verificationStandard(),
                    Instant.now(),
                    result.auditorName(),
                    result.auditorCredentials());

            // Create updated record
            VerificationRecord updated = new VerificationRecord(
                    record.verificationId(),
                    record.projectId(),
                    record.verificationType(),
                    record.vvbId(),
                    record.vvbName(),
                    result.status(),
                    result.status() == VerificationStatus.APPROVED ? VerificationResult.POSITIVE
                            : result.status() == VerificationStatus.REJECTED ? VerificationResult.NEGATIVE
                                    : VerificationResult.CONDITIONAL,
                    record.scope(),
                    record.methodology(),
                    record.claimedReductions(),
                    result.verifiedReductions() != null ? result.verifiedReductions() : record.claimedReductions(),
                    record.verificationPeriod(),
                    record.requestedAt(),
                    Instant.now(),
                    nextDue,
                    report,
                    findings,
                    record.auditTrail());

            verificationRecords.put(verificationId, updated);

            // Update project status if validation approved
            if (updated.verificationType() == VerificationType.VALIDATION &&
                    updated.status() == VerificationStatus.APPROVED) {
                creditRegistry.updateProjectStatus(record.projectId(), CarbonProject.VerificationStatus.VALIDATED);
            }

            // Update project status if verification approved
            if (updated.verificationType() == VerificationType.VERIFICATION &&
                    updated.status() == VerificationStatus.APPROVED) {
                creditRegistry.updateProjectStatus(record.projectId(), CarbonProject.VerificationStatus.VERIFIED);
            }

            addAuditEntry(verificationId, "RESULT_SUBMITTED",
                    String.format("Verification result: %s, verified reductions: %s tCO2e",
                            result.status(), result.verifiedReductions()),
                    result.vvbId());

            meterRegistry.counter("carbon.verification.results.submitted").increment();
            if (result.status() == VerificationStatus.APPROVED) {
                meterRegistry.counter("carbon.verification.approved").increment();
            } else if (result.status() == VerificationStatus.REJECTED) {
                meterRegistry.counter("carbon.verification.rejected").increment();
            }

            Log.infof("Verification result submitted: %s - %s", verificationId, result.status());

            return updated;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Schedule re-verification for a project
     *
     * @param projectId     Project ID
     * @param scheduledDate Scheduled date
     * @return Scheduled verification record
     */
    @Timed(value = "carbon.verification.schedule-reverification", description = "Time to schedule re-verification")
    public Uni<VerificationRecord> scheduleReverification(String projectId, LocalDate scheduledDate, String vvbId) {
        return Uni.createFrom().item(() -> {
            Log.infof("Scheduling re-verification for project: %s on %s", projectId, scheduledDate);

            // Get last verification for reference
            List<String> verificationIds = projectVerifications.getOrDefault(projectId, List.of());
            VerificationRecord lastVerification = verificationIds.stream()
                    .map(verificationRecords::get)
                    .filter(v -> v.verificationType() == VerificationType.VERIFICATION)
                    .max(Comparator.comparing(VerificationRecord::completedAt,
                            Comparator.nullsFirst(Comparator.naturalOrder())))
                    .orElse(null);

            // Validate VVB
            VVBProfile vvb = validateAndGetVVB(vvbId, null);

            String verificationId = generateVerificationId(VerificationType.RE_VERIFICATION, projectId);

            LocalDate periodStart = lastVerification != null && lastVerification.verificationPeriod() != null
                    ? lastVerification.verificationPeriod().endDate()
                    : LocalDate.now().minusYears(1);
            LocalDate periodEnd = LocalDate.now();

            VerificationPeriod period = new VerificationPeriod(periodStart, periodEnd, null);

            VerificationRecord record = new VerificationRecord(
                    verificationId,
                    projectId,
                    VerificationType.RE_VERIFICATION,
                    vvbId,
                    vvb.name(),
                    VerificationStatus.SCHEDULED,
                    null,
                    "Re-verification scope",
                    lastVerification != null ? lastVerification.methodology() : null,
                    null, // claimedReductions
                    null, // verifiedReductions
                    period,
                    Instant.now(),
                    null,
                    scheduledDate,
                    null,
                    null,
                    new ArrayList<>());

            verificationRecords.put(verificationId, record);
            projectVerifications.computeIfAbsent(projectId, k -> new ArrayList<>()).add(verificationId);

            addAuditEntry(verificationId, "REVERIFICATION_SCHEDULED",
                    String.format("Re-verification scheduled for %s", scheduledDate), "SYSTEM");

            meterRegistry.counter("carbon.verification.reverifications.scheduled").increment();

            return record;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get verification record by ID
     *
     * @param verificationId Verification ID
     * @return Verification record
     */
    public Uni<Optional<VerificationRecord>> getVerification(String verificationId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(verificationRecords.get(verificationId)))
                .runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get all verifications for a project
     *
     * @param projectId Project ID
     * @return List of verification records
     */
    public Uni<List<VerificationRecord>> getProjectVerifications(String projectId) {
        return Uni.createFrom().item(() -> {
            List<String> verificationIds = projectVerifications.getOrDefault(projectId, List.of());
            return verificationIds.stream()
                    .map(verificationRecords::get)
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparing(VerificationRecord::requestedAt).reversed())
                    .collect(Collectors.toList());
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get audit trail for a verification
     *
     * @param verificationId Verification ID
     * @return Audit trail entries
     */
    public Uni<List<AuditTrailEntry>> getAuditTrail(String verificationId) {
        return Uni.createFrom().item(() -> {
            VerificationRecord record = verificationRecords.get(verificationId);
            if (record == null) {
                return (List<AuditTrailEntry>) Collections.<AuditTrailEntry>emptyList();
            }
            return (List<AuditTrailEntry>) new ArrayList<>(record.auditTrail());
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get verifications due for renewal
     *
     * @param withinDays Within how many days
     * @return List of projects needing re-verification
     */
    public Uni<List<VerificationRecord>> getVerificationsDue(int withinDays) {
        return Uni.createFrom().item(() -> {
            LocalDate cutoff = LocalDate.now().plusDays(withinDays);
            return verificationRecords.values().stream()
                    .filter(v -> v.nextVerificationDue() != null)
                    .filter(v -> !v.nextVerificationDue().isAfter(cutoff))
                    .filter(v -> v.status() == VerificationStatus.APPROVED)
                    .collect(Collectors.toList());
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get VVB profile
     *
     * @param vvbId VVB ID
     * @return VVB profile
     */
    public Uni<Optional<VVBProfile>> getVVB(String vvbId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(vvbRegistry.get(vvbId)));
    }

    /**
     * Get all active VVBs
     *
     * @return List of active VVBs
     */
    public Uni<List<VVBProfile>> getActiveVVBs() {
        return Uni.createFrom().item(() -> vvbRegistry.values().stream()
                .filter(v -> v.status() == VVBStatus.ACTIVE)
                .filter(v -> !v.accreditationEnd().isBefore(LocalDate.now()))
                .collect(Collectors.toList()));
    }

    /**
     * Get verification statistics
     *
     * @return Verification statistics
     */
    public Uni<VerificationStatistics> getStatistics() {
        return Uni.createFrom().item(() -> {
            long totalValidations = verificationRecords.values().stream()
                    .filter(v -> v.verificationType() == VerificationType.VALIDATION).count();

            long totalVerifications = verificationRecords.values().stream()
                    .filter(v -> v.verificationType() == VerificationType.VERIFICATION).count();

            long approved = verificationRecords.values().stream()
                    .filter(v -> v.status() == VerificationStatus.APPROVED).count();

            long rejected = verificationRecords.values().stream()
                    .filter(v -> v.status() == VerificationStatus.REJECTED).count();

            long pending = verificationRecords.values().stream()
                    .filter(v -> v.status() == VerificationStatus.REQUESTED ||
                            v.status() == VerificationStatus.IN_PROGRESS)
                    .count();

            BigDecimal totalVerifiedReductions = verificationRecords.values().stream()
                    .filter(v -> v.status() == VerificationStatus.APPROVED)
                    .filter(v -> v.verifiedReductions() != null)
                    .map(VerificationRecord::verifiedReductions)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Long> byVVB = verificationRecords.values().stream()
                    .collect(Collectors.groupingBy(VerificationRecord::vvbName, Collectors.counting()));

            return new VerificationStatistics(
                    totalValidations,
                    totalVerifications,
                    approved,
                    rejected,
                    pending,
                    totalVerifiedReductions,
                    vvbRegistry.size(),
                    byVVB,
                    Instant.now());
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    // ==================== HELPER METHODS ====================

    private VVBProfile validateAndGetVVB(String vvbId, CarbonProject.ProjectType projectType) {
        VVBProfile vvb = vvbRegistry.get(vvbId);

        if (vvb == null) {
            throw new VVBNotFoundException("VVB not found: " + vvbId);
        }

        if (requireAccreditedVVB && vvb.status() != VVBStatus.ACTIVE) {
            throw new VVBNotActiveException("VVB is not active: " + vvbId);
        }

        if (vvb.accreditationEnd().isBefore(LocalDate.now())) {
            throw new VVBAccreditationExpiredException("VVB accreditation expired: " + vvbId);
        }

        if (projectType != null && !vvb.projectTypeScope().contains(projectType)) {
            throw new VVBScopeException("VVB not accredited for project type: " + projectType);
        }

        return vvb;
    }

    private String generateVerificationId(VerificationType type, String projectId) {
        String typeCode = switch (type) {
            case VALIDATION -> "VAL";
            case VERIFICATION -> "VER";
            case RE_VERIFICATION -> "REV";
        };

        return String.format("%s-%s-%d-%s",
                typeCode,
                projectId.substring(0, Math.min(8, projectId.length())),
                System.currentTimeMillis() % 100000,
                UUID.randomUUID().toString().substring(0, 6).toUpperCase());
    }

    private String generateReportReference(String verificationId) {
        return String.format("RPT-%s-%d", verificationId, Instant.now().toEpochMilli() % 1000000);
    }

    private void addAuditEntry(String verificationId, String action, String details, String actor) {
        String entryId = UUID.randomUUID().toString();
        AuditTrailEntry entry = new AuditTrailEntry(
                entryId,
                verificationId,
                action,
                details,
                actor,
                Instant.now());

        auditTrail.put(entryId, entry);

        VerificationRecord record = verificationRecords.get(verificationId);
        if (record != null) {
            List<AuditTrailEntry> updatedTrail = new ArrayList<>(record.auditTrail());
            updatedTrail.add(entry);

            VerificationRecord updated = new VerificationRecord(
                    record.verificationId(),
                    record.projectId(),
                    record.verificationType(),
                    record.vvbId(),
                    record.vvbName(),
                    record.status(),
                    record.result(),
                    record.scope(),
                    record.methodology(),
                    record.claimedReductions(),
                    record.verifiedReductions(),
                    record.verificationPeriod(),
                    record.requestedAt(),
                    record.completedAt(),
                    record.nextVerificationDue(),
                    record.report(),
                    record.findings(),
                    updatedTrail);

            verificationRecords.put(verificationId, updated);
        }
    }

    // ==================== ENUMS ====================

    public enum VerificationType {
        VALIDATION, // Initial project design validation
        VERIFICATION, // Emission reduction verification
        RE_VERIFICATION // Periodic re-verification
    }

    public enum VerificationStatus {
        REQUESTED, // Verification requested
        SCHEDULED, // Scheduled for future date
        IN_PROGRESS, // VVB is conducting verification
        UNDER_REVIEW, // Final review by VVB
        APPROVED, // Verification approved
        REJECTED, // Verification rejected
        CONDITIONAL, // Approved with conditions
        CANCELLED // Verification cancelled
    }

    public enum VerificationResult {
        POSITIVE, // Full approval
        NEGATIVE, // Rejection
        CONDITIONAL // Approval with corrective actions required
    }

    public enum VVBStatus {
        ACTIVE,
        SUSPENDED,
        EXPIRED,
        REVOKED
    }

    public enum AccreditationStandard {
        ISO_14064_3, // ISO GHG verification standard
        VCS, // Verra VCS
        GOLD_STANDARD, // Gold Standard
        CDM, // Clean Development Mechanism
        ACR, // American Carbon Registry
        CAR // Climate Action Reserve
    }

    // ==================== RECORDS ====================

    /**
     * VVB (Validation and Verification Body) profile
     */
    public record VVBProfile(
            String vvbId,
            String name,
            String country,
            List<AccreditationStandard> accreditations,
            List<CarbonProject.ProjectType> projectTypeScope,
            VVBStatus status,
            String website,
            LocalDate accreditationStart,
            LocalDate accreditationEnd) {
    }

    /**
     * Verification record
     */
    public record VerificationRecord(
            String verificationId,
            String projectId,
            VerificationType verificationType,
            String vvbId,
            String vvbName,
            VerificationStatus status,
            VerificationResult result,
            String scope,
            String methodology,
            BigDecimal claimedReductions,
            BigDecimal verifiedReductions,
            VerificationPeriod verificationPeriod,
            Instant requestedAt,
            Instant completedAt,
            LocalDate nextVerificationDue,
            VerificationReport report,
            List<VerificationFinding> findings,
            List<AuditTrailEntry> auditTrail) {
    }

    /**
     * Verification period
     */
    public record VerificationPeriod(
            LocalDate startDate,
            LocalDate endDate,
            String monitoringReportRef) {
    }

    /**
     * Verification report
     */
    public record VerificationReport(
            String reportRef,
            String reportHash,
            String reportUrl,
            String verificationStandard,
            Instant issuedAt,
            String auditorName,
            String auditorCredentials) {
    }

    /**
     * Verification finding (issue/observation)
     */
    public record VerificationFinding(
            String findingId,
            FindingType type,
            FindingSeverity severity,
            String description,
            String correctiveAction,
            boolean resolved,
            LocalDate resolutionDeadline) {
        public enum FindingType {
            NON_CONFORMITY, // Major issue requiring correction
            OBSERVATION, // Minor issue for improvement
            CLARIFICATION, // Request for more information
            FORWARD_ACTION // Action for next verification
        }

        public enum FindingSeverity {
            MAJOR,
            MINOR,
            OBSERVATION
        }
    }

    /**
     * Audit trail entry
     */
    public record AuditTrailEntry(
            String entryId,
            String verificationId,
            String action,
            String details,
            String actor,
            Instant timestamp) {
    }

    /**
     * Validation request
     */
    public record ValidationRequest(
            String projectId,
            String vvbId,
            CarbonProject.ProjectType projectType,
            String scope,
            String methodology,
            BigDecimal estimatedReductions,
            String requestedBy) {
    }

    /**
     * Verification request
     */
    public record VerificationRequest(
            String projectId,
            String vvbId,
            CarbonProject.ProjectType projectType,
            LocalDate periodStart,
            LocalDate periodEnd,
            String scope,
            String methodology,
            BigDecimal claimedReductions,
            String monitoringReportRef,
            String requestedBy) {
    }

    /**
     * Verification result submission
     */
    public record VerificationResultSubmission(
            String vvbId,
            VerificationStatus status,
            BigDecimal verifiedReductions,
            String reportHash,
            String reportUrl,
            String verificationStandard,
            String auditorName,
            String auditorCredentials,
            List<VerificationFinding> findings) {
    }

    /**
     * Verification statistics
     */
    public record VerificationStatistics(
            long totalValidations,
            long totalVerifications,
            long approved,
            long rejected,
            long pending,
            BigDecimal totalVerifiedReductions,
            int registeredVVBs,
            Map<String, Long> verificationsByVVB,
            Instant timestamp) {
    }

    // ==================== EXCEPTIONS ====================

    public static class VerificationNotFoundException extends RuntimeException {
        public VerificationNotFoundException(String message) {
            super(message);
        }
    }

    public static class VVBNotFoundException extends RuntimeException {
        public VVBNotFoundException(String message) {
            super(message);
        }
    }

    public static class VVBNotActiveException extends RuntimeException {
        public VVBNotActiveException(String message) {
            super(message);
        }
    }

    public static class VVBAccreditationExpiredException extends RuntimeException {
        public VVBAccreditationExpiredException(String message) {
            super(message);
        }
    }

    public static class VVBScopeException extends RuntimeException {
        public VVBScopeException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedVVBException extends RuntimeException {
        public UnauthorizedVVBException(String message) {
            super(message);
        }
    }
}
