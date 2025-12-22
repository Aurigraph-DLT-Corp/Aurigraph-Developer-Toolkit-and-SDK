package io.aurigraph.v11.rwa.realestate;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * LienRegistry - Comprehensive encumbrance tracking for real estate titles
 *
 * Provides full lifecycle management for property liens including:
 * - Mortgage liens (first, second, HELOC)
 * - Tax liens (property, IRS, state)
 * - Mechanic's liens / construction liens
 * - HOA/assessment liens
 * - Judgment liens
 * - Easements and restrictions
 * - UCC filings
 *
 * Features:
 * - Lien priority calculation
 * - Subordination tracking
 * - Release/satisfaction processing
 * - Full audit trail
 * - Multi-jurisdiction support
 *
 * @version 1.0.0
 * @author Aurigraph V12 RWA Team
 */
@ApplicationScoped
public class LienRegistry {

    // ============================================
    // Storage
    // ============================================

    // Primary storage by lien ID
    private final Map<String, Lien> liens = new ConcurrentHashMap<>();

    // Index by property (title ID)
    private final Map<String, Set<String>> propertyIndex = new ConcurrentHashMap<>();

    // Index by lienholder
    private final Map<String, Set<String>> lienholderIndex = new ConcurrentHashMap<>();

    // Index by lien type
    private final Map<LienType, Set<String>> typeIndex = new ConcurrentHashMap<>();

    // Easements registry
    private final Map<String, Easement> easements = new ConcurrentHashMap<>();

    // Property easement index
    private final Map<String, Set<String>> propertyEasementIndex = new ConcurrentHashMap<>();

    // Audit trail
    private final List<LienAuditEntry> auditTrail = Collections.synchronizedList(new ArrayList<>());

    // ============================================
    // Lien Records
    // ============================================

    /**
     * Lien record with full encumbrance details
     */
    public record Lien(
        String lienId,
        String propertyId,
        String titleId,
        LienType lienType,
        String lienholder,
        String lienholderAddress,
        BigDecimal amount,
        BigDecimal originalAmount,
        BigDecimal interestRate,
        String currency,
        LienStatus status,
        Integer priority,
        Instant recordingDate,
        String instrumentNumber,
        String book,
        String page,
        Instant maturityDate,
        Instant satisfactionDate,
        String satisfactionInstrument,
        LienPosition position,
        boolean subordinated,
        String subordinatedTo,
        String collateralDescription,
        List<String> attachedDocuments,
        String jurisdiction,
        String legalDescription,
        String txHash,
        Long blockNumber,
        Instant createdAt,
        Instant updatedAt,
        Map<String, Object> metadata
    ) {}

    /**
     * Lien type enumeration
     */
    public enum LienType {
        // Mortgage liens
        MORTGAGE_FIRST("First Mortgage", 1),
        MORTGAGE_SECOND("Second Mortgage", 2),
        MORTGAGE_HELOC("Home Equity Line of Credit", 3),
        MORTGAGE_REVERSE("Reverse Mortgage", 4),
        MORTGAGE_CONSTRUCTION("Construction Loan", 5),

        // Tax liens
        TAX_LIEN("Property Tax Lien", 0),  // Priority 0 = super priority
        TAX_FEDERAL("Federal Tax Lien (IRS)", 6),
        TAX_STATE("State Tax Lien", 7),
        TAX_SPECIAL_ASSESSMENT("Special Assessment Lien", 8),

        // Judgment liens
        JUDGMENT("Judgment Lien", 9),
        JUDGMENT_FEDERAL("Federal Judgment Lien", 10),
        JUDGMENT_CHILD_SUPPORT("Child Support Lien", 11),

        // Mechanic's liens
        MECHANICS_LIEN("Mechanic's Lien", 12),
        MATERIALMAN_LIEN("Materialman's Lien", 13),
        CONSTRUCTION_LIEN("Construction Lien", 14),

        // HOA liens
        HOA_LIEN("HOA Assessment Lien", 15),
        HOA_SPECIAL("HOA Special Assessment", 16),

        // Other liens
        ATTACHMENT("Attachment Lien", 17),
        LIS_PENDENS("Lis Pendens", 18),
        BAIL_BOND("Bail Bond Lien", 19),
        UCC_FILING("UCC Filing", 20),
        ENVIRONMENTAL("Environmental Lien", 21),
        MUNICIPAL("Municipal Lien", 22),
        UTILITY("Utility Lien", 23),
        OTHER("Other Lien", 99);

        private final String displayName;
        private final int defaultPriority;

        LienType(String displayName, int defaultPriority) {
            this.displayName = displayName;
            this.defaultPriority = defaultPriority;
        }

        public String getDisplayName() { return displayName; }
        public int getDefaultPriority() { return defaultPriority; }
    }

    /**
     * Lien status enumeration
     */
    public enum LienStatus {
        PENDING("Pending Recording"),
        ACTIVE("Active"),
        PARTIAL_RELEASE("Partial Release"),
        SUBORDINATED("Subordinated"),
        SATISFIED("Satisfied/Released"),
        FORECLOSURE("In Foreclosure"),
        EXPIRED("Expired"),
        DISPUTED("Disputed"),
        VOID("Void");

        private final String displayName;

        LienStatus(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    /**
     * Lien position enumeration
     */
    public enum LienPosition {
        SENIOR("Senior Lien"),
        JUNIOR("Junior Lien"),
        SUBORDINATE("Subordinate"),
        PARI_PASSU("Pari Passu (Equal)");

        private final String displayName;

        LienPosition(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Easement Records
    // ============================================

    /**
     * Easement record
     */
    public record Easement(
        String easementId,
        String propertyId,
        String titleId,
        EasementType easementType,
        String grantee,
        String grantor,
        String purpose,
        String description,
        String legalDescription,
        boolean appurtenant,
        String dominantEstate,
        String servientEstate,
        Instant recordingDate,
        String instrumentNumber,
        String book,
        String page,
        Instant expirationDate,
        boolean perpetual,
        BigDecimal width,
        BigDecimal length,
        String location,
        EasementStatus status,
        List<String> restrictions,
        List<String> attachedDocuments,
        String txHash,
        Instant createdAt,
        Instant updatedAt
    ) {}

    /**
     * Easement type enumeration
     */
    public enum EasementType {
        UTILITY("Utility Easement"),
        ACCESS("Access Easement"),
        DRAINAGE("Drainage Easement"),
        CONSERVATION("Conservation Easement"),
        SCENIC("Scenic Easement"),
        SOLAR("Solar Easement"),
        VIEW("View Easement"),
        PARKING("Parking Easement"),
        INGRESS_EGRESS("Ingress/Egress Easement"),
        RIGHT_OF_WAY("Right of Way"),
        PIPELINE("Pipeline Easement"),
        POWERLINE("Powerline Easement"),
        SEWER("Sewer Easement"),
        SIDEWALK("Sidewalk Easement"),
        SHARED_DRIVEWAY("Shared Driveway"),
        BEACH_ACCESS("Beach Access"),
        HISTORIC_PRESERVATION("Historic Preservation"),
        OTHER("Other Easement");

        private final String displayName;

        EasementType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    /**
     * Easement status enumeration
     */
    public enum EasementStatus {
        ACTIVE("Active"),
        EXPIRED("Expired"),
        TERMINATED("Terminated"),
        MERGED("Merged"),
        ABANDONED("Abandoned"),
        DISPUTED("Disputed");

        private final String displayName;

        EasementStatus(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Audit Entry
    // ============================================

    /**
     * Lien audit entry
     */
    public record LienAuditEntry(
        String entryId,
        String lienId,
        String action,
        String actor,
        Instant timestamp,
        Map<String, Object> details,
        String txHash
    ) {}

    // ============================================
    // Lien Recording Operations
    // ============================================

    /**
     * Record a new lien
     */
    public Uni<Lien> recordLien(LienBuilder builder, String actor) {
        return Uni.createFrom().item(() -> {
            Log.infof("Recording lien: type=%s, lienholder=%s, amount=%s, property=%s",
                builder.lienType, builder.lienholder, builder.amount, builder.propertyId);

            String lienId = builder.lienId != null ? builder.lienId :
                "LIEN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

            // Calculate priority
            int priority = calculatePriority(builder.propertyId, builder.lienType);

            // Determine position
            LienPosition position = determinePosition(builder.propertyId, priority);

            Lien lien = new Lien(
                lienId,
                builder.propertyId,
                builder.titleId,
                builder.lienType,
                builder.lienholder,
                builder.lienholderAddress,
                builder.amount,
                builder.amount, // Original amount
                builder.interestRate,
                builder.currency != null ? builder.currency : "USD",
                LienStatus.ACTIVE,
                priority,
                builder.recordingDate != null ? builder.recordingDate : Instant.now(),
                builder.instrumentNumber != null ? builder.instrumentNumber : generateInstrumentNumber(),
                builder.book,
                builder.page,
                builder.maturityDate,
                null, // Satisfaction date
                null, // Satisfaction instrument
                position,
                false, // Not subordinated
                null,
                builder.collateralDescription,
                builder.attachedDocuments != null ? builder.attachedDocuments : List.of(),
                builder.jurisdiction,
                builder.legalDescription,
                generateTxHash(),
                System.currentTimeMillis() / 1000,
                Instant.now(),
                Instant.now(),
                builder.metadata != null ? builder.metadata : Map.of()
            );

            // Store lien
            liens.put(lienId, lien);

            // Update indexes
            propertyIndex.computeIfAbsent(builder.propertyId, k -> ConcurrentHashMap.newKeySet()).add(lienId);
            lienholderIndex.computeIfAbsent(builder.lienholder, k -> ConcurrentHashMap.newKeySet()).add(lienId);
            typeIndex.computeIfAbsent(builder.lienType, k -> ConcurrentHashMap.newKeySet()).add(lienId);

            // Record audit
            recordAudit(lienId, "LIEN_RECORDED", actor, Map.of(
                "lienType", builder.lienType.name(),
                "amount", builder.amount.toString(),
                "lienholder", builder.lienholder
            ));

            Log.infof("Lien recorded: %s (priority: %d, position: %s)",
                lienId, priority, position.name());
            return lien;
        });
    }

    /**
     * Lien builder for creating liens
     */
    public static class LienBuilder {
        private String lienId;
        private String propertyId;
        private String titleId;
        private LienType lienType;
        private String lienholder;
        private String lienholderAddress;
        private BigDecimal amount;
        private BigDecimal interestRate;
        private String currency;
        private Instant recordingDate;
        private String instrumentNumber;
        private String book;
        private String page;
        private Instant maturityDate;
        private String collateralDescription;
        private List<String> attachedDocuments;
        private String jurisdiction;
        private String legalDescription;
        private Map<String, Object> metadata;

        public LienBuilder lienId(String lienId) { this.lienId = lienId; return this; }
        public LienBuilder propertyId(String propertyId) { this.propertyId = propertyId; return this; }
        public LienBuilder titleId(String titleId) { this.titleId = titleId; return this; }
        public LienBuilder lienType(LienType lienType) { this.lienType = lienType; return this; }
        public LienBuilder lienholder(String lienholder) { this.lienholder = lienholder; return this; }
        public LienBuilder lienholderAddress(String addr) { this.lienholderAddress = addr; return this; }
        public LienBuilder amount(BigDecimal amount) { this.amount = amount; return this; }
        public LienBuilder interestRate(BigDecimal rate) { this.interestRate = rate; return this; }
        public LienBuilder currency(String currency) { this.currency = currency; return this; }
        public LienBuilder recordingDate(Instant date) { this.recordingDate = date; return this; }
        public LienBuilder instrumentNumber(String num) { this.instrumentNumber = num; return this; }
        public LienBuilder book(String book) { this.book = book; return this; }
        public LienBuilder page(String page) { this.page = page; return this; }
        public LienBuilder maturityDate(Instant date) { this.maturityDate = date; return this; }
        public LienBuilder collateralDescription(String desc) { this.collateralDescription = desc; return this; }
        public LienBuilder attachedDocuments(List<String> docs) { this.attachedDocuments = docs; return this; }
        public LienBuilder jurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; return this; }
        public LienBuilder legalDescription(String desc) { this.legalDescription = desc; return this; }
        public LienBuilder metadata(Map<String, Object> metadata) { this.metadata = metadata; return this; }
    }

    public static LienBuilder builder() {
        return new LienBuilder();
    }

    // ============================================
    // Lien Updates
    // ============================================

    /**
     * Satisfy/release a lien
     */
    public Uni<Lien> satisfyLien(String lienId, String satisfactionInstrument, String actor) {
        return Uni.createFrom().item(() -> {
            Lien existing = liens.get(lienId);
            if (existing == null) {
                throw new IllegalArgumentException("Lien not found: " + lienId);
            }

            Log.infof("Satisfying lien: %s", lienId);

            Lien satisfied = new Lien(
                existing.lienId(),
                existing.propertyId(),
                existing.titleId(),
                existing.lienType(),
                existing.lienholder(),
                existing.lienholderAddress(),
                BigDecimal.ZERO, // Current amount is zero
                existing.originalAmount(),
                existing.interestRate(),
                existing.currency(),
                LienStatus.SATISFIED,
                existing.priority(),
                existing.recordingDate(),
                existing.instrumentNumber(),
                existing.book(),
                existing.page(),
                existing.maturityDate(),
                Instant.now(), // Satisfaction date
                satisfactionInstrument,
                existing.position(),
                existing.subordinated(),
                existing.subordinatedTo(),
                existing.collateralDescription(),
                existing.attachedDocuments(),
                existing.jurisdiction(),
                existing.legalDescription(),
                generateTxHash(),
                System.currentTimeMillis() / 1000,
                existing.createdAt(),
                Instant.now(),
                existing.metadata()
            );

            liens.put(lienId, satisfied);

            recordAudit(lienId, "LIEN_SATISFIED", actor, Map.of(
                "satisfactionInstrument", satisfactionInstrument,
                "originalAmount", existing.originalAmount().toString()
            ));

            Log.infof("Lien satisfied: %s", lienId);
            return satisfied;
        });
    }

    /**
     * Partial release of lien
     */
    public Uni<Lien> partialRelease(String lienId, BigDecimal releaseAmount, String actor) {
        return Uni.createFrom().item(() -> {
            Lien existing = liens.get(lienId);
            if (existing == null) {
                throw new IllegalArgumentException("Lien not found: " + lienId);
            }

            BigDecimal newAmount = existing.amount().subtract(releaseAmount);
            if (newAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Release amount exceeds lien balance");
            }

            LienStatus newStatus = newAmount.compareTo(BigDecimal.ZERO) == 0 ?
                LienStatus.SATISFIED : LienStatus.PARTIAL_RELEASE;

            Lien updated = new Lien(
                existing.lienId(),
                existing.propertyId(),
                existing.titleId(),
                existing.lienType(),
                existing.lienholder(),
                existing.lienholderAddress(),
                newAmount,
                existing.originalAmount(),
                existing.interestRate(),
                existing.currency(),
                newStatus,
                existing.priority(),
                existing.recordingDate(),
                existing.instrumentNumber(),
                existing.book(),
                existing.page(),
                existing.maturityDate(),
                newStatus == LienStatus.SATISFIED ? Instant.now() : null,
                existing.satisfactionInstrument(),
                existing.position(),
                existing.subordinated(),
                existing.subordinatedTo(),
                existing.collateralDescription(),
                existing.attachedDocuments(),
                existing.jurisdiction(),
                existing.legalDescription(),
                generateTxHash(),
                System.currentTimeMillis() / 1000,
                existing.createdAt(),
                Instant.now(),
                existing.metadata()
            );

            liens.put(lienId, updated);

            recordAudit(lienId, "PARTIAL_RELEASE", actor, Map.of(
                "releaseAmount", releaseAmount.toString(),
                "newBalance", newAmount.toString()
            ));

            return updated;
        });
    }

    /**
     * Subordinate a lien
     */
    public Uni<Lien> subordinateLien(String lienId, String subordinateTo, String actor) {
        return Uni.createFrom().item(() -> {
            Lien existing = liens.get(lienId);
            if (existing == null) {
                throw new IllegalArgumentException("Lien not found: " + lienId);
            }

            Lien seniorLien = liens.get(subordinateTo);
            if (seniorLien == null) {
                throw new IllegalArgumentException("Senior lien not found: " + subordinateTo);
            }

            Log.infof("Subordinating lien %s to %s", lienId, subordinateTo);

            Lien subordinated = new Lien(
                existing.lienId(),
                existing.propertyId(),
                existing.titleId(),
                existing.lienType(),
                existing.lienholder(),
                existing.lienholderAddress(),
                existing.amount(),
                existing.originalAmount(),
                existing.interestRate(),
                existing.currency(),
                LienStatus.SUBORDINATED,
                seniorLien.priority() + 1, // Move to lower priority
                existing.recordingDate(),
                existing.instrumentNumber(),
                existing.book(),
                existing.page(),
                existing.maturityDate(),
                existing.satisfactionDate(),
                existing.satisfactionInstrument(),
                LienPosition.SUBORDINATE,
                true,
                subordinateTo,
                existing.collateralDescription(),
                existing.attachedDocuments(),
                existing.jurisdiction(),
                existing.legalDescription(),
                generateTxHash(),
                System.currentTimeMillis() / 1000,
                existing.createdAt(),
                Instant.now(),
                existing.metadata()
            );

            liens.put(lienId, subordinated);

            recordAudit(lienId, "LIEN_SUBORDINATED", actor, Map.of(
                "subordinatedTo", subordinateTo,
                "newPriority", subordinated.priority()
            ));

            return subordinated;
        });
    }

    // ============================================
    // Easement Operations
    // ============================================

    /**
     * Record a new easement
     */
    public Uni<Easement> recordEasement(EasementBuilder builder, String actor) {
        return Uni.createFrom().item(() -> {
            Log.infof("Recording easement: type=%s, grantee=%s, property=%s",
                builder.easementType, builder.grantee, builder.propertyId);

            String easementId = "EASE-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

            Easement easement = new Easement(
                easementId,
                builder.propertyId,
                builder.titleId,
                builder.easementType,
                builder.grantee,
                builder.grantor,
                builder.purpose,
                builder.description,
                builder.legalDescription,
                builder.appurtenant,
                builder.dominantEstate,
                builder.servientEstate,
                builder.recordingDate != null ? builder.recordingDate : Instant.now(),
                builder.instrumentNumber != null ? builder.instrumentNumber : generateInstrumentNumber(),
                builder.book,
                builder.page,
                builder.expirationDate,
                builder.perpetual,
                builder.width,
                builder.length,
                builder.location,
                EasementStatus.ACTIVE,
                builder.restrictions != null ? builder.restrictions : List.of(),
                builder.attachedDocuments != null ? builder.attachedDocuments : List.of(),
                generateTxHash(),
                Instant.now(),
                Instant.now()
            );

            easements.put(easementId, easement);
            propertyEasementIndex.computeIfAbsent(builder.propertyId, k -> ConcurrentHashMap.newKeySet()).add(easementId);

            recordAudit(easementId, "EASEMENT_RECORDED", actor, Map.of(
                "easementType", builder.easementType.name(),
                "grantee", builder.grantee
            ));

            Log.infof("Easement recorded: %s", easementId);
            return easement;
        });
    }

    /**
     * Easement builder
     */
    public static class EasementBuilder {
        private String propertyId;
        private String titleId;
        private EasementType easementType;
        private String grantee;
        private String grantor;
        private String purpose;
        private String description;
        private String legalDescription;
        private boolean appurtenant;
        private String dominantEstate;
        private String servientEstate;
        private Instant recordingDate;
        private String instrumentNumber;
        private String book;
        private String page;
        private Instant expirationDate;
        private boolean perpetual = true;
        private BigDecimal width;
        private BigDecimal length;
        private String location;
        private List<String> restrictions;
        private List<String> attachedDocuments;

        public EasementBuilder propertyId(String propertyId) { this.propertyId = propertyId; return this; }
        public EasementBuilder titleId(String titleId) { this.titleId = titleId; return this; }
        public EasementBuilder easementType(EasementType type) { this.easementType = type; return this; }
        public EasementBuilder grantee(String grantee) { this.grantee = grantee; return this; }
        public EasementBuilder grantor(String grantor) { this.grantor = grantor; return this; }
        public EasementBuilder purpose(String purpose) { this.purpose = purpose; return this; }
        public EasementBuilder description(String description) { this.description = description; return this; }
        public EasementBuilder legalDescription(String desc) { this.legalDescription = desc; return this; }
        public EasementBuilder appurtenant(boolean appurtenant) { this.appurtenant = appurtenant; return this; }
        public EasementBuilder dominantEstate(String estate) { this.dominantEstate = estate; return this; }
        public EasementBuilder servientEstate(String estate) { this.servientEstate = estate; return this; }
        public EasementBuilder recordingDate(Instant date) { this.recordingDate = date; return this; }
        public EasementBuilder instrumentNumber(String num) { this.instrumentNumber = num; return this; }
        public EasementBuilder book(String book) { this.book = book; return this; }
        public EasementBuilder page(String page) { this.page = page; return this; }
        public EasementBuilder expirationDate(Instant date) { this.expirationDate = date; return this; }
        public EasementBuilder perpetual(boolean perpetual) { this.perpetual = perpetual; return this; }
        public EasementBuilder width(BigDecimal width) { this.width = width; return this; }
        public EasementBuilder length(BigDecimal length) { this.length = length; return this; }
        public EasementBuilder location(String location) { this.location = location; return this; }
        public EasementBuilder restrictions(List<String> restrictions) { this.restrictions = restrictions; return this; }
        public EasementBuilder attachedDocuments(List<String> docs) { this.attachedDocuments = docs; return this; }
    }

    public static EasementBuilder easementBuilder() {
        return new EasementBuilder();
    }

    // ============================================
    // Query Operations
    // ============================================

    /**
     * Get lien by ID
     */
    public Uni<Optional<Lien>> getLien(String lienId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(liens.get(lienId)));
    }

    /**
     * Get all liens for a property
     */
    public Uni<List<Lien>> getLiensForProperty(String propertyId) {
        return Uni.createFrom().item(() -> {
            Set<String> lienIds = propertyIndex.getOrDefault(propertyId, new HashSet<>());
            return lienIds.stream()
                .map(liens::get)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(Lien::priority))
                .collect(Collectors.toList());
        });
    }

    /**
     * Get active liens for a property
     */
    public Uni<List<Lien>> getActiveLiensForProperty(String propertyId) {
        return getLiensForProperty(propertyId)
            .map(all -> all.stream()
                .filter(l -> l.status() == LienStatus.ACTIVE ||
                             l.status() == LienStatus.PARTIAL_RELEASE ||
                             l.status() == LienStatus.SUBORDINATED)
                .collect(Collectors.toList()));
    }

    /**
     * Get liens by lienholder
     */
    public Uni<List<Lien>> getLiensByLienholder(String lienholder) {
        return Uni.createFrom().item(() -> {
            Set<String> lienIds = lienholderIndex.getOrDefault(lienholder, new HashSet<>());
            return lienIds.stream()
                .map(liens::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        });
    }

    /**
     * Get liens by type
     */
    public Uni<List<Lien>> getLiensByType(LienType type) {
        return Uni.createFrom().item(() -> {
            Set<String> lienIds = typeIndex.getOrDefault(type, new HashSet<>());
            return lienIds.stream()
                .map(liens::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        });
    }

    /**
     * Stream all liens for a property
     */
    public Multi<Lien> streamLiensForProperty(String propertyId) {
        return Multi.createFrom().iterable(
            propertyIndex.getOrDefault(propertyId, new HashSet<>()).stream()
                .map(liens::get)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(Lien::priority))
                .toList()
        );
    }

    /**
     * Get easements for a property
     */
    public Uni<List<Easement>> getEasementsForProperty(String propertyId) {
        return Uni.createFrom().item(() -> {
            Set<String> easementIds = propertyEasementIndex.getOrDefault(propertyId, new HashSet<>());
            return easementIds.stream()
                .map(easements::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        });
    }

    /**
     * Get active easements for a property
     */
    public Uni<List<Easement>> getActiveEasementsForProperty(String propertyId) {
        return getEasementsForProperty(propertyId)
            .map(all -> all.stream()
                .filter(e -> e.status() == EasementStatus.ACTIVE)
                .collect(Collectors.toList()));
    }

    // ============================================
    // Encumbrance Summary
    // ============================================

    /**
     * Get encumbrance summary for a property
     */
    public Uni<EncumbranceSummary> getEncumbranceSummary(String propertyId) {
        return Uni.createFrom().item(() -> {
            List<Lien> propertyLiens = propertyIndex.getOrDefault(propertyId, new HashSet<>()).stream()
                .map(liens::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            List<Easement> propertyEasements = propertyEasementIndex.getOrDefault(propertyId, new HashSet<>()).stream()
                .map(easements::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            // Calculate totals
            BigDecimal totalLienAmount = propertyLiens.stream()
                .filter(l -> l.status() == LienStatus.ACTIVE ||
                             l.status() == LienStatus.PARTIAL_RELEASE ||
                             l.status() == LienStatus.SUBORDINATED)
                .map(Lien::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            int activeLiens = (int) propertyLiens.stream()
                .filter(l -> l.status() == LienStatus.ACTIVE ||
                             l.status() == LienStatus.PARTIAL_RELEASE)
                .count();

            int activeEasements = (int) propertyEasements.stream()
                .filter(e -> e.status() == EasementStatus.ACTIVE)
                .count();

            boolean hasTaxLien = propertyLiens.stream()
                .anyMatch(l -> l.lienType() == LienType.TAX_LIEN && l.status() == LienStatus.ACTIVE);

            boolean hasMechanicsLien = propertyLiens.stream()
                .anyMatch(l -> l.lienType() == LienType.MECHANICS_LIEN && l.status() == LienStatus.ACTIVE);

            boolean hasJudgmentLien = propertyLiens.stream()
                .anyMatch(l -> l.lienType() == LienType.JUDGMENT && l.status() == LienStatus.ACTIVE);

            // Find first lien position holder
            Lien firstPosition = propertyLiens.stream()
                .filter(l -> l.status() == LienStatus.ACTIVE)
                .min(Comparator.comparingInt(Lien::priority))
                .orElse(null);

            return new EncumbranceSummary(
                propertyId,
                activeLiens,
                totalLienAmount,
                activeEasements,
                hasTaxLien,
                hasMechanicsLien,
                hasJudgmentLien,
                firstPosition != null ? firstPosition.lienholder() : null,
                firstPosition != null ? firstPosition.lienType() : null,
                activeLiens == 0 && !hasTaxLien && !hasMechanicsLien && !hasJudgmentLien,
                Instant.now()
            );
        });
    }

    /**
     * Encumbrance summary record
     */
    public record EncumbranceSummary(
        String propertyId,
        int activeLienCount,
        BigDecimal totalLienAmount,
        int activeEasementCount,
        boolean hasTaxLien,
        boolean hasMechanicsLien,
        boolean hasJudgmentLien,
        String firstPositionHolder,
        LienType firstPositionType,
        boolean clearTitle,
        Instant asOfDate
    ) {}

    // ============================================
    // Priority Calculation
    // ============================================

    /**
     * Calculate lien priority for a property
     */
    private int calculatePriority(String propertyId, LienType type) {
        // Tax liens have super priority (0)
        if (type == LienType.TAX_LIEN) {
            return 0;
        }

        // Get existing liens for property
        Set<String> existingLienIds = propertyIndex.getOrDefault(propertyId, new HashSet<>());

        // Count existing liens of same type
        int samePriorityCount = (int) existingLienIds.stream()
            .map(liens::get)
            .filter(Objects::nonNull)
            .filter(l -> l.lienType().getDefaultPriority() == type.getDefaultPriority())
            .count();

        return type.getDefaultPriority() + samePriorityCount;
    }

    /**
     * Determine lien position
     */
    private LienPosition determinePosition(String propertyId, int priority) {
        Set<String> existingLienIds = propertyIndex.getOrDefault(propertyId, new HashSet<>());

        // Check if there are higher priority liens
        boolean hasHigherPriority = existingLienIds.stream()
            .map(liens::get)
            .filter(Objects::nonNull)
            .filter(l -> l.status() == LienStatus.ACTIVE)
            .anyMatch(l -> l.priority() < priority);

        // Check if there are same priority liens
        boolean hasSamePriority = existingLienIds.stream()
            .map(liens::get)
            .filter(Objects::nonNull)
            .filter(l -> l.status() == LienStatus.ACTIVE)
            .anyMatch(l -> l.priority() == priority);

        if (!hasHigherPriority) {
            return LienPosition.SENIOR;
        } else if (hasSamePriority) {
            return LienPosition.PARI_PASSU;
        } else {
            return LienPosition.JUNIOR;
        }
    }

    // ============================================
    // Statistics
    // ============================================

    /**
     * Get registry statistics
     */
    public Uni<LienRegistryStats> getStatistics() {
        return Uni.createFrom().item(() -> {
            long totalLiens = liens.size();
            long activeLiens = liens.values().stream()
                .filter(l -> l.status() == LienStatus.ACTIVE)
                .count();

            BigDecimal totalAmount = liens.values().stream()
                .filter(l -> l.status() == LienStatus.ACTIVE)
                .map(Lien::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<LienType, Long> byType = liens.values().stream()
                .collect(Collectors.groupingBy(Lien::lienType, Collectors.counting()));

            long totalEasements = easements.size();
            long activeEasements = easements.values().stream()
                .filter(e -> e.status() == EasementStatus.ACTIVE)
                .count();

            return new LienRegistryStats(
                totalLiens,
                activeLiens,
                totalAmount,
                byType,
                totalEasements,
                activeEasements,
                propertyIndex.size(),
                auditTrail.size()
            );
        });
    }

    /**
     * Registry statistics
     */
    public record LienRegistryStats(
        long totalLiens,
        long activeLiens,
        BigDecimal totalActiveAmount,
        Map<LienType, Long> liensByType,
        long totalEasements,
        long activeEasements,
        int propertiesWithLiens,
        int auditEntries
    ) {}

    // ============================================
    // Helper Methods
    // ============================================

    private void recordAudit(String entityId, String action, String actor, Map<String, Object> details) {
        LienAuditEntry entry = new LienAuditEntry(
            "AUDIT-" + UUID.randomUUID().toString().substring(0, 8),
            entityId,
            action,
            actor,
            Instant.now(),
            details,
            generateTxHash()
        );
        auditTrail.add(entry);
    }

    private String generateTxHash() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((UUID.randomUUID().toString() + Instant.now().toEpochMilli()).getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return UUID.randomUUID().toString();
        }
    }

    private String generateInstrumentNumber() {
        return String.format("2024%08d", System.currentTimeMillis() % 100000000);
    }

    /**
     * Clear all data (for testing)
     */
    public void clearAll() {
        liens.clear();
        propertyIndex.clear();
        lienholderIndex.clear();
        typeIndex.clear();
        easements.clear();
        propertyEasementIndex.clear();
        auditTrail.clear();
        Log.warn("Lien registry cleared - all data removed");
    }
}
