package io.aurigraph.v11.rwa.realestate;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import io.aurigraph.v11.rwa.realestate.PropertyTitle.*;

/**
 * RealEstateTitleRegistry - Main registry for real estate property titles
 *
 * Provides comprehensive title management including:
 * - Property title registration and storage
 * - Fractional ownership token management
 * - Title transfer with compliance checks
 * - Lien and encumbrance tracking
 * - Complete chain of title (ownership history)
 * - Multi-jurisdiction support (US states, international)
 *
 * Features:
 * - In-memory storage with ConcurrentHashMap for high performance
 * - Full audit trail for all operations
 * - SEC Regulation D/A+ compliance hooks
 * - Title insurance integration ready
 * - REITs and DST support
 *
 * @version 1.0.0
 * @author Aurigraph V12 RWA Team
 */
@ApplicationScoped
public class RealEstateTitleRegistry {

    // ============================================
    // Dependencies
    // ============================================

    @Inject
    LienRegistry lienRegistry;

    @Inject
    PropertyValuationService valuationService;

    @Inject
    FractionalOwnershipService fractionalOwnershipService;

    @Inject
    TitleTransferService titleTransferService;

    // ============================================
    // Storage
    // ============================================

    // Primary storage by title ID
    private final Map<String, TitleRecord> titleRegistry = new ConcurrentHashMap<>();

    // Index by property ID (APN)
    private final Map<String, String> apnIndex = new ConcurrentHashMap<>();

    // Index by owner
    private final Map<String, Set<String>> ownerIndex = new ConcurrentHashMap<>();

    // Index by jurisdiction (state/country)
    private final Map<String, Set<String>> jurisdictionIndex = new ConcurrentHashMap<>();

    // Index by property type
    private final Map<PropertyType, Set<String>> propertyTypeIndex = new ConcurrentHashMap<>();

    // Index by token contract
    private final Map<String, String> tokenContractIndex = new ConcurrentHashMap<>();

    // Audit trail
    private final List<RegistryAuditEntry> auditTrail = Collections.synchronizedList(new ArrayList<>());

    // ============================================
    // Audit Entry Record
    // ============================================

    /**
     * Registry audit entry for compliance tracking
     */
    public record RegistryAuditEntry(
        String entryId,
        String titleId,
        String action,
        String actor,
        Instant timestamp,
        Map<String, Object> details,
        String transactionHash,
        String status
    ) {}

    // ============================================
    // Title Registration
    // ============================================

    /**
     * Register a new property title
     *
     * @param titleRecord The title record to register
     * @param actor The registering party
     * @return Registered TitleRecord with generated IDs
     */
    public Uni<TitleRecord> registerTitle(TitleRecord titleRecord, String actor) {
        return Uni.createFrom().item(() -> {
            Log.infof("Registering property title: APN=%s, Type=%s, Actor=%s",
                titleRecord.propertyId() != null ? titleRecord.propertyId().assessorParcelNumber() : "N/A",
                titleRecord.propertyType(),
                actor);

            // Validate title record
            validateTitleRecord(titleRecord);

            // Check for duplicate APN
            String apn = titleRecord.propertyId().assessorParcelNumber();
            if (apn != null && apnIndex.containsKey(apn)) {
                throw new IllegalStateException("Property with APN " + apn + " already registered");
            }

            // Generate title ID if not present
            String titleId = titleRecord.titleId() != null ? titleRecord.titleId() :
                "TITLE-" + UUID.randomUUID().toString();

            // Create updated record with new ID
            TitleRecord registeredTitle = new TitleRecord(
                titleId,
                titleRecord.propertyId(),
                titleRecord.propertyType(),
                titleRecord.address(),
                titleRecord.location(),
                titleRecord.legalDescription(),
                titleRecord.currentOwners(),
                titleRecord.chainOfTitle(),
                titleRecord.currentValuation(),
                titleRecord.valuationHistory(),
                titleRecord.compliance(),
                titleRecord.tokenization(),
                titleRecord.titleInsurance(),
                TitleStatus.PENDING_VERIFICATION,
                Instant.now(),
                Instant.now(),
                actor,
                titleRecord.metadata()
            );

            // Store in primary registry
            titleRegistry.put(titleId, registeredTitle);

            // Update indexes
            if (apn != null) {
                apnIndex.put(apn, titleId);
            }

            // Index by jurisdiction
            String jurisdiction = getJurisdiction(titleRecord);
            jurisdictionIndex.computeIfAbsent(jurisdiction, k -> ConcurrentHashMap.newKeySet()).add(titleId);

            // Index by property type
            if (titleRecord.propertyType() != null) {
                propertyTypeIndex.computeIfAbsent(titleRecord.propertyType(), k -> ConcurrentHashMap.newKeySet()).add(titleId);
            }

            // Index by owners
            if (titleRecord.currentOwners() != null) {
                for (Owner owner : titleRecord.currentOwners()) {
                    ownerIndex.computeIfAbsent(owner.ownerId(), k -> ConcurrentHashMap.newKeySet()).add(titleId);
                }
            }

            // Create audit entry
            recordAudit(titleId, "TITLE_REGISTERED", actor, Map.of(
                "apn", apn != null ? apn : "N/A",
                "propertyType", titleRecord.propertyType().getDisplayName(),
                "jurisdiction", jurisdiction
            ));

            Log.infof("Property title registered successfully: %s", titleId);
            return registeredTitle;
        });
    }

    /**
     * Register title from builder with validation
     */
    public Uni<TitleRecord> registerTitle(TitleRecordBuilder builder, String actor) {
        return registerTitle(builder.build(), actor);
    }

    // ============================================
    // Title Retrieval
    // ============================================

    /**
     * Get title by ID
     */
    public Uni<Optional<TitleRecord>> getTitleById(String titleId) {
        return Uni.createFrom().item(() -> {
            Log.debugf("Retrieving title: %s", titleId);
            return Optional.ofNullable(titleRegistry.get(titleId));
        });
    }

    /**
     * Get title by APN (Assessor's Parcel Number)
     */
    public Uni<Optional<TitleRecord>> getTitleByApn(String apn) {
        return Uni.createFrom().item(() -> {
            String titleId = apnIndex.get(apn);
            if (titleId == null) {
                return Optional.empty();
            }
            return Optional.ofNullable(titleRegistry.get(titleId));
        });
    }

    /**
     * Get all titles for an owner
     */
    public Uni<List<TitleRecord>> getTitlesByOwner(String ownerId) {
        return Uni.createFrom().item(() -> {
            Set<String> titleIds = ownerIndex.getOrDefault(ownerId, new HashSet<>());
            return titleIds.stream()
                .map(titleRegistry::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        });
    }

    /**
     * Get titles by jurisdiction with pagination
     */
    public Uni<List<TitleRecord>> getTitlesByJurisdiction(String jurisdiction, int limit, int offset) {
        return Uni.createFrom().item(() -> {
            Set<String> titleIds = jurisdictionIndex.getOrDefault(jurisdiction, new HashSet<>());
            return titleIds.stream()
                .map(titleRegistry::get)
                .filter(Objects::nonNull)
                .skip(offset)
                .limit(limit)
                .collect(Collectors.toList());
        });
    }

    /**
     * Stream all titles as Multi
     */
    public Multi<TitleRecord> streamAllTitles() {
        return Multi.createFrom().iterable(titleRegistry.values());
    }

    // ============================================
    // Title Search
    // ============================================

    /**
     * Search titles with multiple filters
     */
    public Uni<List<TitleRecord>> searchTitles(TitleSearchCriteria criteria) {
        return Uni.createFrom().item(() -> {
            Log.debugf("Searching titles with criteria: %s", criteria);

            Stream<TitleRecord> stream = titleRegistry.values().stream();

            // Filter by property type
            if (criteria.propertyType() != null) {
                stream = stream.filter(t -> t.propertyType() == criteria.propertyType());
            }

            // Filter by jurisdiction
            if (criteria.jurisdiction() != null) {
                stream = stream.filter(t -> {
                    String j = getJurisdiction(t);
                    return j != null && j.equalsIgnoreCase(criteria.jurisdiction());
                });
            }

            // Filter by status
            if (criteria.status() != null) {
                stream = stream.filter(t -> t.status() == criteria.status());
            }

            // Filter by tokenized
            if (criteria.tokenized() != null) {
                stream = stream.filter(t -> t.isTokenized() == criteria.tokenized());
            }

            // Filter by min valuation
            if (criteria.minValuation() != null && criteria.minValuation().compareTo(BigDecimal.ZERO) > 0) {
                stream = stream.filter(t ->
                    t.currentValuation() != null &&
                    t.currentValuation().value() != null &&
                    t.currentValuation().value().compareTo(criteria.minValuation()) >= 0
                );
            }

            // Filter by max valuation
            if (criteria.maxValuation() != null) {
                stream = stream.filter(t ->
                    t.currentValuation() != null &&
                    t.currentValuation().value() != null &&
                    t.currentValuation().value().compareTo(criteria.maxValuation()) <= 0
                );
            }

            // Filter by city
            if (criteria.city() != null) {
                stream = stream.filter(t ->
                    t.address() != null &&
                    criteria.city().equalsIgnoreCase(t.address().city())
                );
            }

            // Filter by SEC regulation
            if (criteria.secRegulation() != null) {
                stream = stream.filter(t ->
                    t.compliance() != null &&
                    t.compliance().secRegulation() == criteria.secRegulation()
                );
            }

            // Apply pagination
            return stream
                .skip(criteria.offset())
                .limit(criteria.limit())
                .collect(Collectors.toList());
        });
    }

    /**
     * Search criteria record
     */
    public record TitleSearchCriteria(
        PropertyType propertyType,
        String jurisdiction,
        TitleStatus status,
        Boolean tokenized,
        BigDecimal minValuation,
        BigDecimal maxValuation,
        String city,
        SECRegulation secRegulation,
        int limit,
        int offset
    ) {
        public static TitleSearchCriteria defaults() {
            return new TitleSearchCriteria(null, null, null, null, null, null, null, null, 50, 0);
        }
    }

    // ============================================
    // Title Updates
    // ============================================

    /**
     * Update title status
     */
    public Uni<TitleRecord> updateTitleStatus(String titleId, TitleStatus newStatus, String actor, String reason) {
        return Uni.createFrom().item(() -> {
            TitleRecord existing = titleRegistry.get(titleId);
            if (existing == null) {
                throw new IllegalArgumentException("Title not found: " + titleId);
            }

            TitleStatus oldStatus = existing.status();

            // Create updated record
            TitleRecord updated = new TitleRecord(
                existing.titleId(),
                existing.propertyId(),
                existing.propertyType(),
                existing.address(),
                existing.location(),
                existing.legalDescription(),
                existing.currentOwners(),
                existing.chainOfTitle(),
                existing.currentValuation(),
                existing.valuationHistory(),
                existing.compliance(),
                existing.tokenization(),
                existing.titleInsurance(),
                newStatus,
                existing.createdAt(),
                Instant.now(),
                existing.createdBy(),
                existing.metadata()
            );

            titleRegistry.put(titleId, updated);

            recordAudit(titleId, "STATUS_UPDATED", actor, Map.of(
                "oldStatus", oldStatus.name(),
                "newStatus", newStatus.name(),
                "reason", reason
            ));

            Log.infof("Title status updated: %s -> %s (Title: %s)", oldStatus, newStatus, titleId);
            return updated;
        });
    }

    /**
     * Update title valuation
     */
    public Uni<TitleRecord> updateValuation(String titleId, Valuation newValuation, String actor) {
        return Uni.createFrom().item(() -> {
            TitleRecord existing = titleRegistry.get(titleId);
            if (existing == null) {
                throw new IllegalArgumentException("Title not found: " + titleId);
            }

            // Add current valuation to history
            List<Valuation> newHistory = new ArrayList<>(existing.valuationHistory());
            if (existing.currentValuation() != null) {
                newHistory.add(existing.currentValuation());
            }

            TitleRecord updated = new TitleRecord(
                existing.titleId(),
                existing.propertyId(),
                existing.propertyType(),
                existing.address(),
                existing.location(),
                existing.legalDescription(),
                existing.currentOwners(),
                existing.chainOfTitle(),
                newValuation,
                newHistory,
                existing.compliance(),
                existing.tokenization(),
                existing.titleInsurance(),
                existing.status(),
                existing.createdAt(),
                Instant.now(),
                existing.createdBy(),
                existing.metadata()
            );

            titleRegistry.put(titleId, updated);

            recordAudit(titleId, "VALUATION_UPDATED", actor, Map.of(
                "newValue", newValuation.value().toString(),
                "valuationType", newValuation.valuationType().name(),
                "currency", newValuation.currency()
            ));

            Log.infof("Title valuation updated: %s = %s %s",
                titleId, newValuation.value(), newValuation.currency());
            return updated;
        });
    }

    /**
     * Add owner to title (for fractional ownership)
     */
    public Uni<TitleRecord> addOwner(String titleId, Owner newOwner, String actor) {
        return Uni.createFrom().item(() -> {
            TitleRecord existing = titleRegistry.get(titleId);
            if (existing == null) {
                throw new IllegalArgumentException("Title not found: " + titleId);
            }

            // Validate ownership percentage
            BigDecimal currentTotal = existing.totalOwnershipPercentage();
            BigDecimal newTotal = currentTotal.add(newOwner.ownershipPercentage());
            if (newTotal.compareTo(new BigDecimal("100")) > 0) {
                throw new IllegalStateException(
                    "Cannot add owner: total ownership would exceed 100% (current: " + currentTotal + "%)");
            }

            List<Owner> newOwners = new ArrayList<>(existing.currentOwners());
            newOwners.add(newOwner);

            TitleRecord updated = new TitleRecord(
                existing.titleId(),
                existing.propertyId(),
                existing.propertyType(),
                existing.address(),
                existing.location(),
                existing.legalDescription(),
                newOwners,
                existing.chainOfTitle(),
                existing.currentValuation(),
                existing.valuationHistory(),
                existing.compliance(),
                existing.tokenization(),
                existing.titleInsurance(),
                existing.status(),
                existing.createdAt(),
                Instant.now(),
                existing.createdBy(),
                existing.metadata()
            );

            titleRegistry.put(titleId, updated);

            // Update owner index
            ownerIndex.computeIfAbsent(newOwner.ownerId(), k -> ConcurrentHashMap.newKeySet()).add(titleId);

            recordAudit(titleId, "OWNER_ADDED", actor, Map.of(
                "newOwnerId", newOwner.ownerId(),
                "ownershipPercentage", newOwner.ownershipPercentage().toString(),
                "ownerType", newOwner.ownerType().name()
            ));

            Log.infof("Owner added to title %s: %s (%.2f%%)",
                titleId, newOwner.ownerId(), newOwner.ownershipPercentage());
            return updated;
        });
    }

    /**
     * Add chain of title entry
     */
    public Uni<TitleRecord> addChainOfTitleEntry(String titleId, ChainOfTitleEntry entry, String actor) {
        return Uni.createFrom().item(() -> {
            TitleRecord existing = titleRegistry.get(titleId);
            if (existing == null) {
                throw new IllegalArgumentException("Title not found: " + titleId);
            }

            List<ChainOfTitleEntry> newChain = new ArrayList<>(existing.chainOfTitle());
            newChain.add(entry);

            TitleRecord updated = new TitleRecord(
                existing.titleId(),
                existing.propertyId(),
                existing.propertyType(),
                existing.address(),
                existing.location(),
                existing.legalDescription(),
                existing.currentOwners(),
                newChain,
                existing.currentValuation(),
                existing.valuationHistory(),
                existing.compliance(),
                existing.tokenization(),
                existing.titleInsurance(),
                existing.status(),
                existing.createdAt(),
                Instant.now(),
                existing.createdBy(),
                existing.metadata()
            );

            titleRegistry.put(titleId, updated);

            recordAudit(titleId, "CHAIN_OF_TITLE_UPDATED", actor, Map.of(
                "entryId", entry.entryId(),
                "grantor", entry.grantor(),
                "grantee", entry.grantee(),
                "deedType", entry.deedType().name()
            ));

            return updated;
        });
    }

    /**
     * Update tokenization details
     */
    public Uni<TitleRecord> updateTokenization(String titleId, TokenizationDetails tokenization, String actor) {
        return Uni.createFrom().item(() -> {
            TitleRecord existing = titleRegistry.get(titleId);
            if (existing == null) {
                throw new IllegalArgumentException("Title not found: " + titleId);
            }

            TitleRecord updated = new TitleRecord(
                existing.titleId(),
                existing.propertyId(),
                existing.propertyType(),
                existing.address(),
                existing.location(),
                existing.legalDescription(),
                existing.currentOwners(),
                existing.chainOfTitle(),
                existing.currentValuation(),
                existing.valuationHistory(),
                existing.compliance(),
                tokenization,
                existing.titleInsurance(),
                TitleStatus.TOKENIZED,
                existing.createdAt(),
                Instant.now(),
                existing.createdBy(),
                existing.metadata()
            );

            titleRegistry.put(titleId, updated);

            // Index by token contract
            if (tokenization.tokenContractAddress() != null) {
                tokenContractIndex.put(tokenization.tokenContractAddress(), titleId);
            }

            recordAudit(titleId, "TOKENIZED", actor, Map.of(
                "tokenContract", tokenization.tokenContractAddress(),
                "tokenSymbol", tokenization.tokenSymbol(),
                "totalSupply", tokenization.totalSupply().toString()
            ));

            Log.infof("Title tokenized: %s with contract %s",
                titleId, tokenization.tokenContractAddress());
            return updated;
        });
    }

    // ============================================
    // Chain of Title Operations
    // ============================================

    /**
     * Get complete chain of title for a property
     */
    public Uni<List<ChainOfTitleEntry>> getChainOfTitle(String titleId) {
        return Uni.createFrom().item(() -> {
            TitleRecord title = titleRegistry.get(titleId);
            if (title == null) {
                return List.of();
            }
            return new ArrayList<>(title.chainOfTitle());
        });
    }

    /**
     * Verify chain of title integrity
     */
    public Uni<ChainVerificationResult> verifyChainOfTitle(String titleId) {
        return Uni.createFrom().item(() -> {
            TitleRecord title = titleRegistry.get(titleId);
            if (title == null) {
                return new ChainVerificationResult(false, List.of("Title not found"), List.of());
            }

            List<String> issues = new ArrayList<>();
            List<String> warnings = new ArrayList<>();

            List<ChainOfTitleEntry> chain = title.chainOfTitle();
            if (chain.isEmpty()) {
                issues.add("Chain of title is empty");
                return new ChainVerificationResult(false, issues, warnings);
            }

            // Verify chain continuity (grantee becomes next grantor)
            for (int i = 0; i < chain.size() - 1; i++) {
                ChainOfTitleEntry current = chain.get(i);
                ChainOfTitleEntry next = chain.get(i + 1);

                if (!current.grantee().equals(next.grantor())) {
                    issues.add(String.format(
                        "Chain break at entry %d: %s (grantee) != %s (next grantor)",
                        i, current.grantee(), next.grantor()
                    ));
                }
            }

            // Check for gaps in dates
            for (int i = 0; i < chain.size() - 1; i++) {
                ChainOfTitleEntry current = chain.get(i);
                ChainOfTitleEntry next = chain.get(i + 1);

                if (current.recordingDate() != null && next.recordingDate() != null) {
                    if (next.recordingDate().isBefore(current.recordingDate())) {
                        warnings.add(String.format(
                            "Date inconsistency at entry %d: recording date is before previous entry", i + 1
                        ));
                    }
                }
            }

            // Check for quitclaim deeds (potential issues)
            for (int i = 0; i < chain.size(); i++) {
                if (chain.get(i).deedType() == DeedType.QUITCLAIM_DEED) {
                    warnings.add(String.format(
                        "Quitclaim deed at entry %d - may not provide full title warranty", i
                    ));
                }
            }

            boolean valid = issues.isEmpty();
            return new ChainVerificationResult(valid, issues, warnings);
        });
    }

    /**
     * Chain verification result record
     */
    public record ChainVerificationResult(
        boolean valid,
        List<String> issues,
        List<String> warnings
    ) {}

    // ============================================
    // Multi-Jurisdiction Support
    // ============================================

    /**
     * Get jurisdiction-specific requirements
     */
    public Uni<JurisdictionRequirements> getJurisdictionRequirements(String jurisdiction) {
        return Uni.createFrom().item(() -> {
            // Return requirements based on jurisdiction
            return JURISDICTION_REQUIREMENTS.getOrDefault(
                jurisdiction.toUpperCase(),
                JurisdictionRequirements.DEFAULT
            );
        });
    }

    /**
     * Jurisdiction requirements record
     */
    public record JurisdictionRequirements(
        String jurisdiction,
        BigDecimal transferTaxRate,
        BigDecimal documentaryStampRate,
        boolean attorneyRequired,
        boolean titleInsuranceRequired,
        int recordingFeeBase,
        String titleCompanyLicenseRequired,
        List<String> requiredDocuments,
        boolean wetSignatureRequired,
        boolean notarizationRequired
    ) {
        public static final JurisdictionRequirements DEFAULT = new JurisdictionRequirements(
            "DEFAULT",
            new BigDecimal("0.01"),      // 1% transfer tax
            new BigDecimal("0.00"),      // No documentary stamps
            false,                        // Attorney not required
            true,                         // Title insurance required
            50,                           // $50 base recording fee
            null,                         // No specific license
            List.of("Deed", "Settlement Statement"),
            false,                        // e-signature allowed
            true                          // Notarization required
        );
    }

    // State-specific requirements (examples)
    private static final Map<String, JurisdictionRequirements> JURISDICTION_REQUIREMENTS = Map.of(
        "FL", new JurisdictionRequirements(
            "FL", new BigDecimal("0.007"), new BigDecimal("0.0035"), false, true, 10,
            "FL Title Agent License", List.of("Warranty Deed", "HUD-1/CD", "Documentary Stamps"), false, true
        ),
        "NY", new JurisdictionRequirements(
            "NY", new BigDecimal("0.004"), new BigDecimal("0.0"), true, true, 75,
            "NY Title Insurance License", List.of("Bargain and Sale Deed", "TP-584", "Transfer Tax"), false, true
        ),
        "CA", new JurisdictionRequirements(
            "CA", new BigDecimal("0.0011"), new BigDecimal("0.0"), false, true, 15,
            "CA Escrow License", List.of("Grant Deed", "Preliminary Change of Ownership"), false, true
        ),
        "TX", new JurisdictionRequirements(
            "TX", new BigDecimal("0.0"), new BigDecimal("0.0"), true, true, 25,
            "TX Title Insurance Agent", List.of("General Warranty Deed", "T-47 Affidavit"), true, true
        )
    );

    // ============================================
    // Statistics and Analytics
    // ============================================

    /**
     * Get registry statistics
     */
    public Uni<RegistryStatistics> getStatistics() {
        return Uni.createFrom().item(() -> {
            long totalTitles = titleRegistry.size();
            long tokenizedTitles = titleRegistry.values().stream()
                .filter(TitleRecord::isTokenized)
                .count();

            BigDecimal totalValue = titleRegistry.values().stream()
                .filter(t -> t.currentValuation() != null && t.currentValuation().value() != null)
                .map(t -> t.currentValuation().value())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<PropertyType, Long> byPropertyType = titleRegistry.values().stream()
                .filter(t -> t.propertyType() != null)
                .collect(Collectors.groupingBy(TitleRecord::propertyType, Collectors.counting()));

            Map<TitleStatus, Long> byStatus = titleRegistry.values().stream()
                .collect(Collectors.groupingBy(TitleRecord::status, Collectors.counting()));

            long totalOwners = ownerIndex.size();
            int jurisdictionCount = jurisdictionIndex.size();

            return new RegistryStatistics(
                totalTitles,
                tokenizedTitles,
                totalValue,
                byPropertyType,
                byStatus,
                totalOwners,
                jurisdictionCount,
                auditTrail.size()
            );
        });
    }

    /**
     * Registry statistics record
     */
    public record RegistryStatistics(
        long totalTitles,
        long tokenizedTitles,
        BigDecimal totalValue,
        Map<PropertyType, Long> byPropertyType,
        Map<TitleStatus, Long> byStatus,
        long totalOwners,
        int jurisdictionCount,
        int auditEntries
    ) {}

    // ============================================
    // Audit Trail
    // ============================================

    /**
     * Get audit trail for a title
     */
    public Uni<List<RegistryAuditEntry>> getAuditTrail(String titleId) {
        return Uni.createFrom().item(() ->
            auditTrail.stream()
                .filter(e -> e.titleId().equals(titleId))
                .collect(Collectors.toList())
        );
    }

    /**
     * Get recent audit entries
     */
    public Uni<List<RegistryAuditEntry>> getRecentAuditEntries(int limit) {
        return Uni.createFrom().item(() -> {
            int size = auditTrail.size();
            int start = Math.max(0, size - limit);
            return new ArrayList<>(auditTrail.subList(start, size));
        });
    }

    // ============================================
    // Helper Methods
    // ============================================

    private void validateTitleRecord(TitleRecord title) {
        if (title.propertyId() == null) {
            throw new IllegalArgumentException("Property ID is required");
        }
        if (title.propertyType() == null) {
            throw new IllegalArgumentException("Property type is required");
        }
        if (title.address() == null) {
            throw new IllegalArgumentException("Property address is required");
        }
    }

    private String getJurisdiction(TitleRecord title) {
        if (title.address() == null) {
            return "UNKNOWN";
        }
        if (title.address().stateCode() != null) {
            return title.address().stateCode().toUpperCase();
        }
        if (title.address().countryCode() != null) {
            return title.address().countryCode().toUpperCase();
        }
        return "UNKNOWN";
    }

    private void recordAudit(String titleId, String action, String actor, Map<String, Object> details) {
        String txHash = generateTransactionHash(titleId + action + Instant.now().toEpochMilli());
        RegistryAuditEntry entry = new RegistryAuditEntry(
            "AUDIT-" + UUID.randomUUID().toString(),
            titleId,
            action,
            actor,
            Instant.now(),
            details,
            txHash,
            "SUCCESS"
        );
        auditTrail.add(entry);
    }

    private String generateTransactionHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return UUID.randomUUID().toString();
        }
    }

    // ============================================
    // Cleanup and Maintenance
    // ============================================

    /**
     * Clear all data (for testing)
     */
    public void clearAll() {
        titleRegistry.clear();
        apnIndex.clear();
        ownerIndex.clear();
        jurisdictionIndex.clear();
        propertyTypeIndex.clear();
        tokenContractIndex.clear();
        auditTrail.clear();
        Log.warn("Registry cleared - all data removed");
    }
}
