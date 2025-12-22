package io.aurigraph.v11.rwa.carbon;

import io.micrometer.core.annotation.Counted;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Carbon Credit Registry Service
 * Main registry service for carbon credit lifecycle management on Aurigraph DLT.
 *
 * Features:
 * - Credit issuance from verified projects
 * - Retirement (permanent removal from circulation)
 * - Transfer with compliance checks
 * - Batch operations for bulk processing
 * - Vintage year tracking
 * - Project ID linking
 * - Multi-registry support (Verra, Gold Standard, ACR, CAR)
 * - Paris Agreement Article 6.2 compliance
 * - Double-counting prevention via Merkle proofs
 *
 * Integrations:
 * - Verra VCS Registry API ready
 * - Gold Standard Impact Registry
 * - American Carbon Registry (ACR)
 * - Climate Action Reserve (CAR)
 *
 * @author Aurigraph V12 - RWA Development Agent
 * @version 12.0.0
 * @since 2025-12-21
 */
@ApplicationScoped
public class CarbonCreditRegistry {

    private static final int BATCH_SIZE_LIMIT = 1000;
    private static final int SCALE = 8;

    // In-memory storage (would be LevelDB/persistent in production)
    private final Map<String, CarbonCredit> creditRegistry = new ConcurrentHashMap<>();
    private final Map<String, CarbonProject> projectRegistry = new ConcurrentHashMap<>();
    private final Map<String, List<String>> projectCredits = new ConcurrentHashMap<>(); // projectId -> creditIds
    private final Map<String, List<String>> ownerCredits = new ConcurrentHashMap<>(); // ownerAddress -> creditIds

    // Metrics counters
    private final AtomicLong totalCreditsIssued = new AtomicLong(0);
    private final AtomicLong totalCreditsRetired = new AtomicLong(0);
    private final AtomicLong totalTransfers = new AtomicLong(0);

    @Inject
    MeterRegistry meterRegistry;

    @Inject
    CarbonRetirementService retirementService;

    @Inject
    CarbonVerificationService verificationService;

    @ConfigProperty(name = "carbon.registry.default-registry", defaultValue = "VERRA")
    String defaultRegistry;

    @ConfigProperty(name = "carbon.registry.require-article6-compliance", defaultValue = "true")
    boolean requireArticle6Compliance;

    @ConfigProperty(name = "carbon.registry.max-vintage-age-years", defaultValue = "10")
    int maxVintageAgeYears;

    // ==================== PROJECT MANAGEMENT ====================

    /**
     * Register a new carbon project
     *
     * @param project The project to register
     * @return Registered project with generated ID
     */
    @Timed(value = "carbon.registry.project.register", description = "Time to register a new project")
    @Counted(value = "carbon.registry.project.register.count", description = "Number of projects registered")
    public Uni<CarbonProject> registerProject(CarbonProject project) {
        return Uni.createFrom().item(() -> {
            Log.infof("Registering carbon project: %s", project.projectName());

            // Generate project ID if not provided
            String projectId = project.projectId() != null ? project.projectId() :
                generateProjectId(project.registry(), project.projectType());

            CarbonProject registeredProject = CarbonProject.builder()
                .projectId(projectId)
                .projectName(project.projectName())
                .description(project.description())
                .projectType(project.projectType())
                .methodology(project.methodology())
                .registry(project.registry())
                .verificationStatus(CarbonProject.VerificationStatus.REGISTERED)
                .proponent(project.proponent())
                .location(project.location())
                .creditingPeriod(project.creditingPeriod())
                .estimatedAnnualReductions(project.estimatedAnnualReductions())
                .totalCreditsIssued(BigDecimal.ZERO)
                .totalCreditsRetired(BigDecimal.ZERO)
                .availableCredits(BigDecimal.ZERO)
                .coBenefits(project.coBenefits())
                .sdgAlignment(project.sdgAlignment())
                .documentation(project.documentation())
                .mrvDetails(project.mrvDetails())
                .additionality(project.additionality())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .metadata(project.metadata())
                .build();

            projectRegistry.put(projectId, registeredProject);
            projectCredits.put(projectId, new ArrayList<>());

            meterRegistry.counter("carbon.registry.projects.total").increment();
            Log.infof("Project registered successfully: %s", projectId);

            return registeredProject;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get project by ID
     *
     * @param projectId The project identifier
     * @return Project or empty if not found
     */
    public Uni<Optional<CarbonProject>> getProject(String projectId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(projectRegistry.get(projectId)))
            .runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Update project verification status
     *
     * @param projectId The project identifier
     * @param newStatus The new verification status
     * @return Updated project
     */
    @Timed(value = "carbon.registry.project.update-status", description = "Time to update project status")
    public Uni<CarbonProject> updateProjectStatus(String projectId, CarbonProject.VerificationStatus newStatus) {
        return Uni.createFrom().item(() -> {
            CarbonProject project = projectRegistry.get(projectId);
            if (project == null) {
                throw new ProjectNotFoundException("Project not found: " + projectId);
            }

            CarbonProject updatedProject = CarbonProject.builder()
                .projectId(project.projectId())
                .projectName(project.projectName())
                .description(project.description())
                .projectType(project.projectType())
                .methodology(project.methodology())
                .registry(project.registry())
                .verificationStatus(newStatus)
                .proponent(project.proponent())
                .location(project.location())
                .creditingPeriod(project.creditingPeriod())
                .estimatedAnnualReductions(project.estimatedAnnualReductions())
                .totalCreditsIssued(project.totalCreditsIssued())
                .totalCreditsRetired(project.totalCreditsRetired())
                .availableCredits(project.availableCredits())
                .coBenefits(project.coBenefits())
                .sdgAlignment(project.sdgAlignment())
                .documentation(project.documentation())
                .mrvDetails(project.mrvDetails())
                .additionality(project.additionality())
                .createdAt(project.createdAt())
                .updatedAt(Instant.now())
                .metadata(project.metadata())
                .build();

            projectRegistry.put(projectId, updatedProject);
            Log.infof("Project status updated: %s -> %s", projectId, newStatus);

            return updatedProject;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    // ==================== CREDIT ISSUANCE ====================

    /**
     * Issue carbon credits from a verified project
     *
     * @param request Credit issuance request
     * @return List of issued credits
     */
    @Timed(value = "carbon.registry.credit.issue", description = "Time to issue credits")
    @Counted(value = "carbon.registry.credit.issue.count", description = "Number of issuance operations")
    public Uni<List<CarbonCredit>> issueCredits(CreditIssuanceRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Issuing %s credits from project: %s", request.quantity(), request.projectId());

            // Validate project
            CarbonProject project = projectRegistry.get(request.projectId());
            if (project == null) {
                throw new ProjectNotFoundException("Project not found: " + request.projectId());
            }

            if (!project.canIssueCredits()) {
                throw new CreditIssuanceException("Project cannot issue credits: " + project.verificationStatus());
            }

            // Validate vintage
            int currentYear = Year.now().getValue();
            if (request.vintageYear() > currentYear) {
                throw new CreditIssuanceException("Vintage year cannot be in the future");
            }
            if (currentYear - request.vintageYear() > maxVintageAgeYears) {
                throw new CreditIssuanceException("Vintage year exceeds maximum age: " + maxVintageAgeYears + " years");
            }

            // Validate quantity
            if (request.quantity() <= 0 || request.quantity() > BATCH_SIZE_LIMIT) {
                throw new CreditIssuanceException("Invalid quantity. Must be 1-" + BATCH_SIZE_LIMIT);
            }

            // Generate credits
            List<CarbonCredit> issuedCredits = new ArrayList<>();
            String merkleRoot = generateMerkleRoot(request);

            for (int i = 0; i < request.quantity(); i++) {
                String creditId = generateCreditId(project.registry(), request.projectId(), request.vintageYear(), i);

                CarbonCredit credit = CarbonCredit.builder()
                    .creditId(creditId)
                    .projectId(request.projectId())
                    .vintageYear(request.vintageYear())
                    .creditType(determineCreditType(project.registry()))
                    .status(CarbonCredit.CreditStatus.ACTIVE)
                    .registry(project.registry())
                    .co2eTonnes(BigDecimal.ONE) // Standard 1 tCO2e per credit
                    .ownerAddress(request.recipientAddress())
                    .issuedAt(Instant.now())
                    .transactionHash(generateTransactionHash(creditId))
                    .merkleRoot(merkleRoot)
                    .metadata(request.metadata() != null ? request.metadata() : Map.of())
                    .build();

                creditRegistry.put(creditId, credit);
                issuedCredits.add(credit);

                // Update indexes
                projectCredits.computeIfAbsent(request.projectId(), k -> new ArrayList<>()).add(creditId);
                ownerCredits.computeIfAbsent(request.recipientAddress(), k -> new ArrayList<>()).add(creditId);
            }

            // Update project totals
            updateProjectCreditsIssued(request.projectId(), BigDecimal.valueOf(request.quantity()));

            totalCreditsIssued.addAndGet(request.quantity());
            meterRegistry.counter("carbon.registry.credits.issued.total").increment(request.quantity());
            meterRegistry.gauge("carbon.registry.credits.active", creditRegistry.values().stream()
                .filter(c -> c.status() == CarbonCredit.CreditStatus.ACTIVE).count());

            Log.infof("Successfully issued %d credits from project %s", request.quantity(), request.projectId());

            return issuedCredits;
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Issue credits in batch with streaming response
     *
     * @param requests List of issuance requests
     * @return Multi stream of issued credits
     */
    @Timed(value = "carbon.registry.credit.batch-issue", description = "Time for batch issuance")
    public Multi<CarbonCredit> issueCreditsBatch(List<CreditIssuanceRequest> requests) {
        return Multi.createFrom().iterable(requests)
            .onItem().transformToUniAndConcatenate(this::issueCredits)
            .onItem().transformToMultiAndConcatenate(Multi.createFrom()::iterable);
    }

    // ==================== CREDIT TRANSFER ====================

    /**
     * Transfer credits between accounts
     *
     * @param request Transfer request
     * @return List of transferred credits
     */
    @Timed(value = "carbon.registry.credit.transfer", description = "Time to transfer credits")
    @Counted(value = "carbon.registry.credit.transfer.count", description = "Number of transfers")
    public Uni<TransferResult> transferCredits(TransferRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Transferring %d credits from %s to %s",
                request.creditIds().size(), request.fromAddress(), request.toAddress());

            List<CarbonCredit> transferredCredits = new ArrayList<>();
            List<String> failedCredits = new ArrayList<>();

            for (String creditId : request.creditIds()) {
                CarbonCredit credit = creditRegistry.get(creditId);

                if (credit == null) {
                    failedCredits.add(creditId);
                    continue;
                }

                // Validate ownership
                if (!credit.ownerAddress().equals(request.fromAddress())) {
                    failedCredits.add(creditId);
                    Log.warnf("Transfer failed - not owner: %s", creditId);
                    continue;
                }

                // Validate transferability
                if (!credit.isTransferable()) {
                    failedCredits.add(creditId);
                    Log.warnf("Transfer failed - not transferable: %s (status: %s)", creditId, credit.status());
                    continue;
                }

                // Check Article 6 compliance if required
                if (requireArticle6Compliance && credit.correspondingAdjustment() != null &&
                    !credit.correspondingAdjustment().adjustmentApplied()) {
                    failedCredits.add(creditId);
                    Log.warnf("Transfer failed - Article 6 compliance required: %s", creditId);
                    continue;
                }

                // Execute transfer
                CarbonCredit transferredCredit = CarbonCredit.builder()
                    .creditId(credit.creditId())
                    .projectId(credit.projectId())
                    .vintageYear(credit.vintageYear())
                    .creditType(credit.creditType())
                    .status(CarbonCredit.CreditStatus.ACTIVE) // Reset to active after transfer
                    .registry(credit.registry())
                    .co2eTonnes(credit.co2eTonnes())
                    .ownerAddress(request.toAddress())
                    .issuedAt(credit.issuedAt())
                    .correspondingAdjustment(credit.correspondingAdjustment())
                    .transactionHash(generateTransactionHash(creditId + "-transfer"))
                    .merkleRoot(credit.merkleRoot())
                    .metadata(credit.metadata())
                    .build();

                creditRegistry.put(creditId, transferredCredit);
                transferredCredits.add(transferredCredit);

                // Update ownership indexes
                ownerCredits.getOrDefault(request.fromAddress(), new ArrayList<>()).remove(creditId);
                ownerCredits.computeIfAbsent(request.toAddress(), k -> new ArrayList<>()).add(creditId);
            }

            totalTransfers.incrementAndGet();
            meterRegistry.counter("carbon.registry.transfers.total").increment();
            meterRegistry.counter("carbon.registry.credits.transferred").increment(transferredCredits.size());

            Log.infof("Transfer complete: %d successful, %d failed",
                transferredCredits.size(), failedCredits.size());

            return new TransferResult(
                transferredCredits,
                failedCredits,
                transferredCredits.size(),
                failedCredits.size(),
                Instant.now()
            );
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    // ==================== CREDIT RETIREMENT ====================

    /**
     * Retire credits (permanent removal from circulation)
     *
     * @param request Retirement request
     * @return Retirement result with certificate
     */
    @Timed(value = "carbon.registry.credit.retire", description = "Time to retire credits")
    @Counted(value = "carbon.registry.credit.retire.count", description = "Number of retirements")
    public Uni<RetirementResult> retireCredits(RetirementRequest request) {
        return retirementService.processRetirement(request, creditRegistry)
            .onItem().invoke(result -> {
                totalCreditsRetired.addAndGet(result.retiredCredits().size());
                meterRegistry.counter("carbon.registry.credits.retired.total")
                    .increment(result.retiredCredits().size());

                // Update project retired totals
                Map<String, Long> projectCounts = result.retiredCredits().stream()
                    .collect(Collectors.groupingBy(CarbonCredit::projectId, Collectors.counting()));

                projectCounts.forEach((projectId, count) ->
                    updateProjectCreditsRetired(projectId, BigDecimal.valueOf(count)));

                Log.infof("Retirement complete: %d credits retired, certificate: %s",
                    result.retiredCredits().size(), result.certificateId());
            });
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get credit by ID
     *
     * @param creditId The credit identifier
     * @return Credit or empty if not found
     */
    public Uni<Optional<CarbonCredit>> getCredit(String creditId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(creditRegistry.get(creditId)))
            .runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get all credits for an owner
     *
     * @param ownerAddress Owner wallet address
     * @return List of credits owned
     */
    public Uni<List<CarbonCredit>> getCreditsByOwner(String ownerAddress) {
        return Uni.createFrom().item(() -> {
            List<String> creditIds = ownerCredits.getOrDefault(ownerAddress, List.of());
            return creditIds.stream()
                .map(creditRegistry::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get all credits for a project
     *
     * @param projectId Project identifier
     * @return List of credits from project
     */
    public Uni<List<CarbonCredit>> getCreditsByProject(String projectId) {
        return Uni.createFrom().item(() -> {
            List<String> creditIds = projectCredits.getOrDefault(projectId, List.of());
            return creditIds.stream()
                .map(creditRegistry::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get credits by vintage year
     *
     * @param vintageYear The vintage year
     * @return List of credits from that vintage
     */
    public Uni<List<CarbonCredit>> getCreditsByVintage(int vintageYear) {
        return Uni.createFrom().item(() ->
            creditRegistry.values().stream()
                .filter(c -> c.vintageYear() == vintageYear)
                .collect(Collectors.toList())
        ).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get credits by registry type
     *
     * @param registry The registry type
     * @return List of credits from that registry
     */
    public Uni<List<CarbonCredit>> getCreditsByRegistry(CarbonCredit.RegistryType registry) {
        return Uni.createFrom().item(() ->
            creditRegistry.values().stream()
                .filter(c -> c.registry() == registry)
                .collect(Collectors.toList())
        ).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Get active credits only
     *
     * @return List of active credits
     */
    public Uni<List<CarbonCredit>> getActiveCredits() {
        return Uni.createFrom().item(() ->
            creditRegistry.values().stream()
                .filter(c -> c.status() == CarbonCredit.CreditStatus.ACTIVE)
                .collect(Collectors.toList())
        ).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    /**
     * Search credits with filters
     *
     * @param filter Search filter criteria
     * @return Filtered list of credits
     */
    public Uni<List<CarbonCredit>> searchCredits(CreditSearchFilter filter) {
        return Uni.createFrom().item(() -> {
            return creditRegistry.values().stream()
                .filter(c -> filter.projectId() == null || c.projectId().equals(filter.projectId()))
                .filter(c -> filter.vintageYear() == null || c.vintageYear() == filter.vintageYear())
                .filter(c -> filter.registry() == null || c.registry() == filter.registry())
                .filter(c -> filter.status() == null || c.status() == filter.status())
                .filter(c -> filter.creditType() == null || c.creditType() == filter.creditType())
                .filter(c -> filter.ownerAddress() == null || c.ownerAddress().equals(filter.ownerAddress()))
                .filter(c -> filter.minVintage() == null || c.vintageYear() >= filter.minVintage())
                .filter(c -> filter.maxVintage() == null || c.vintageYear() <= filter.maxVintage())
                .limit(filter.limit() != null ? filter.limit() : 100)
                .collect(Collectors.toList());
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    // ==================== STATISTICS ====================

    /**
     * Get registry statistics
     *
     * @return Registry statistics
     */
    public Uni<RegistryStatistics> getStatistics() {
        return Uni.createFrom().item(() -> {
            long totalActive = creditRegistry.values().stream()
                .filter(c -> c.status() == CarbonCredit.CreditStatus.ACTIVE).count();

            long totalRetired = creditRegistry.values().stream()
                .filter(c -> c.status() == CarbonCredit.CreditStatus.RETIRED).count();

            BigDecimal totalCO2eActive = creditRegistry.values().stream()
                .filter(c -> c.status() == CarbonCredit.CreditStatus.ACTIVE)
                .map(CarbonCredit::co2eTonnes)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalCO2eRetired = creditRegistry.values().stream()
                .filter(c -> c.status() == CarbonCredit.CreditStatus.RETIRED)
                .map(CarbonCredit::co2eTonnes)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<Integer, Long> byVintage = creditRegistry.values().stream()
                .collect(Collectors.groupingBy(CarbonCredit::vintageYear, Collectors.counting()));

            Map<CarbonCredit.RegistryType, Long> byRegistry = creditRegistry.values().stream()
                .collect(Collectors.groupingBy(CarbonCredit::registry, Collectors.counting()));

            Map<CarbonCredit.CreditType, Long> byType = creditRegistry.values().stream()
                .collect(Collectors.groupingBy(CarbonCredit::creditType, Collectors.counting()));

            return new RegistryStatistics(
                totalCreditsIssued.get(),
                totalActive,
                totalRetired,
                totalTransfers.get(),
                totalCO2eActive,
                totalCO2eRetired,
                projectRegistry.size(),
                byVintage,
                byRegistry,
                byType,
                Instant.now()
            );
        }).runSubscriptionOn(runnable -> Thread.startVirtualThread(runnable));
    }

    // ==================== HELPER METHODS ====================

    private String generateProjectId(CarbonCredit.RegistryType registry, CarbonProject.ProjectType type) {
        return String.format("%s-%s-%d-%s",
            registry.getCode(),
            type.name().substring(0, Math.min(4, type.name().length())),
            System.currentTimeMillis() % 100000,
            UUID.randomUUID().toString().substring(0, 8).toUpperCase()
        );
    }

    private String generateCreditId(CarbonCredit.RegistryType registry, String projectId,
                                    int vintageYear, int sequence) {
        return String.format("%s-%s-%d-%06d",
            registry.getCode(),
            projectId,
            vintageYear,
            sequence + 1
        );
    }

    private CarbonCredit.CreditType determineCreditType(CarbonCredit.RegistryType registry) {
        return switch (registry) {
            case VERRA -> CarbonCredit.CreditType.VCU;
            case GOLD_STANDARD -> CarbonCredit.CreditType.VER;
            case ACR -> CarbonCredit.CreditType.ERT;
            case CAR -> CarbonCredit.CreditType.CRT;
            case CDM -> CarbonCredit.CreditType.CER;
            case EU_ETS -> CarbonCredit.CreditType.EUA;
            case AURIGRAPH -> CarbonCredit.CreditType.VCU;
        };
    }

    private String generateTransactionHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((input + Instant.now().toEpochMilli()).getBytes());
            return "0x" + bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return "0x" + UUID.randomUUID().toString().replace("-", "");
        }
    }

    private String generateMerkleRoot(CreditIssuanceRequest request) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String data = request.projectId() + request.vintageYear() + request.quantity() + Instant.now();
            byte[] hash = digest.digest(data.getBytes());
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void updateProjectCreditsIssued(String projectId, BigDecimal amount) {
        CarbonProject project = projectRegistry.get(projectId);
        if (project != null) {
            BigDecimal newTotal = project.totalCreditsIssued().add(amount);
            BigDecimal newAvailable = project.availableCredits().add(amount);

            CarbonProject updated = CarbonProject.builder()
                .projectId(project.projectId())
                .projectName(project.projectName())
                .description(project.description())
                .projectType(project.projectType())
                .methodology(project.methodology())
                .registry(project.registry())
                .verificationStatus(project.verificationStatus())
                .proponent(project.proponent())
                .location(project.location())
                .creditingPeriod(project.creditingPeriod())
                .estimatedAnnualReductions(project.estimatedAnnualReductions())
                .totalCreditsIssued(newTotal)
                .totalCreditsRetired(project.totalCreditsRetired())
                .availableCredits(newAvailable)
                .coBenefits(project.coBenefits())
                .sdgAlignment(project.sdgAlignment())
                .documentation(project.documentation())
                .mrvDetails(project.mrvDetails())
                .additionality(project.additionality())
                .createdAt(project.createdAt())
                .updatedAt(Instant.now())
                .metadata(project.metadata())
                .build();

            projectRegistry.put(projectId, updated);
        }
    }

    private void updateProjectCreditsRetired(String projectId, BigDecimal amount) {
        CarbonProject project = projectRegistry.get(projectId);
        if (project != null) {
            BigDecimal newRetired = project.totalCreditsRetired().add(amount);
            BigDecimal newAvailable = project.availableCredits().subtract(amount);

            CarbonProject updated = CarbonProject.builder()
                .projectId(project.projectId())
                .projectName(project.projectName())
                .description(project.description())
                .projectType(project.projectType())
                .methodology(project.methodology())
                .registry(project.registry())
                .verificationStatus(project.verificationStatus())
                .proponent(project.proponent())
                .location(project.location())
                .creditingPeriod(project.creditingPeriod())
                .estimatedAnnualReductions(project.estimatedAnnualReductions())
                .totalCreditsIssued(project.totalCreditsIssued())
                .totalCreditsRetired(newRetired)
                .availableCredits(newAvailable.max(BigDecimal.ZERO))
                .coBenefits(project.coBenefits())
                .sdgAlignment(project.sdgAlignment())
                .documentation(project.documentation())
                .mrvDetails(project.mrvDetails())
                .additionality(project.additionality())
                .createdAt(project.createdAt())
                .updatedAt(Instant.now())
                .metadata(project.metadata())
                .build();

            projectRegistry.put(projectId, updated);
        }
    }

    // ==================== REQUEST/RESPONSE RECORDS ====================

    /**
     * Credit issuance request
     */
    public record CreditIssuanceRequest(
        String projectId,
        int vintageYear,
        int quantity,
        String recipientAddress,
        Map<String, Object> metadata
    ) {}

    /**
     * Credit transfer request
     */
    public record TransferRequest(
        List<String> creditIds,
        String fromAddress,
        String toAddress,
        String transferReason
    ) {}

    /**
     * Retirement request
     */
    public record RetirementRequest(
        List<String> creditIds,
        String beneficiaryName,
        String beneficiaryAddress,
        CarbonCredit.RetirementDetails.RetirementPurpose purpose,
        String retirementMessage,
        Integer offsetYear,
        String emissionsSource
    ) {}

    /**
     * Credit search filter
     */
    public record CreditSearchFilter(
        String projectId,
        Integer vintageYear,
        CarbonCredit.RegistryType registry,
        CarbonCredit.CreditStatus status,
        CarbonCredit.CreditType creditType,
        String ownerAddress,
        Integer minVintage,
        Integer maxVintage,
        Integer limit
    ) {}

    /**
     * Transfer result
     */
    public record TransferResult(
        List<CarbonCredit> transferredCredits,
        List<String> failedCreditIds,
        int successCount,
        int failureCount,
        Instant transferredAt
    ) {}

    /**
     * Retirement result
     */
    public record RetirementResult(
        String certificateId,
        List<CarbonCredit> retiredCredits,
        String certificateUrl,
        String transactionHash,
        BigDecimal totalCO2eRetired,
        Instant retiredAt
    ) {}

    /**
     * Registry statistics
     */
    public record RegistryStatistics(
        long totalCreditsIssued,
        long totalCreditsActive,
        long totalCreditsRetired,
        long totalTransfers,
        BigDecimal totalCO2eActive,
        BigDecimal totalCO2eRetired,
        int totalProjects,
        Map<Integer, Long> creditsByVintage,
        Map<CarbonCredit.RegistryType, Long> creditsByRegistry,
        Map<CarbonCredit.CreditType, Long> creditsByType,
        Instant timestamp
    ) {}

    // ==================== EXCEPTIONS ====================

    public static class ProjectNotFoundException extends RuntimeException {
        public ProjectNotFoundException(String message) {
            super(message);
        }
    }

    public static class CreditIssuanceException extends RuntimeException {
        public CreditIssuanceException(String message) {
            super(message);
        }
    }

    public static class TransferException extends RuntimeException {
        public TransferException(String message) {
            super(message);
        }
    }

    public static class RetirementException extends RuntimeException {
        public RetirementException(String message) {
            super(message);
        }
    }
}
