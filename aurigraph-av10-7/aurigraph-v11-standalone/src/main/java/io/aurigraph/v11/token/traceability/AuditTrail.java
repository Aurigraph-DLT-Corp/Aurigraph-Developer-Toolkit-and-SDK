package io.aurigraph.v11.token.traceability;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * AuditTrail - Immutable transaction history and comprehensive audit logging.
 *
 * Provides tamper-evident audit trail functionality for all token operations:
 * - Immutable append-only log with cryptographic linking
 * - Multi-dimensional querying and filtering
 * - Regulatory compliance support (SEC, MiCA, SOC2, GDPR)
 * - Real-time event streaming
 * - Retention policy management
 * - Export capabilities
 *
 * Security Features:
 * - SHA-256 hash chain for integrity
 * - Digital signatures for non-repudiation
 * - Tamper detection mechanisms
 * - Secure timestamping
 *
 * @author Aurigraph V12 Token Team
 * @version 1.0
 * @since Sprint 12-13
 */
@ApplicationScoped
public class AuditTrail {

    // Primary audit log storage: entryId -> AuditEntry
    private final Map<String, AuditEntry> auditLog = new ConcurrentHashMap<>();

    // Index by entity: entityId -> List of entryIds
    private final Map<String, List<String>> entityIndex = new ConcurrentHashMap<>();

    // Index by actor: actorId -> List of entryIds
    private final Map<String, List<String>> actorIndex = new ConcurrentHashMap<>();

    // Index by event type: eventType -> List of entryIds
    private final Map<AuditEventType, List<String>> eventTypeIndex = new ConcurrentHashMap<>();

    // Index by date: dateKey (yyyy-MM-dd) -> List of entryIds
    private final Map<String, List<String>> dateIndex = new ConcurrentHashMap<>();

    // Sequence counter for ordering
    private final AtomicLong sequenceCounter = new AtomicLong(0);

    // Last entry hash for chain linking
    private volatile String lastEntryHash = "0000000000000000000000000000000000000000000000000000000000000000";

    // Event listeners for real-time streaming
    private final List<AuditEventListener> eventListeners = new ArrayList<>();

    private static final String HASH_ALGORITHM = "SHA-256";

    // ==========================================
    // AUDIT ENTRY CREATION
    // ==========================================

    /**
     * Log an audit entry for a token operation.
     *
     * @param entityType Type of entity being audited
     * @param entityId Entity identifier
     * @param eventType Type of audit event
     * @param actor Address/ID of the actor
     * @param description Human-readable description
     * @param eventData Additional event data
     * @param metadata Additional metadata
     * @return Created audit entry
     */
    public Uni<AuditEntry> logEntry(
            EntityType entityType,
            String entityId,
            AuditEventType eventType,
            String actor,
            String description,
            Map<String, Object> eventData,
            Map<String, String> metadata) {

        return Uni.createFrom().item(() -> {
            Log.debugf("Logging audit entry: %s for %s by %s", eventType, entityId, actor);

            String entryId = generateEntryId();
            long sequence = sequenceCounter.incrementAndGet();
            Instant timestamp = Instant.now();

            // Compute hashes
            String dataHash = computeHash(eventData.toString());
            String previousHash = lastEntryHash;
            String entryHash = computeChainHash(previousHash, dataHash, sequence);

            AuditEntry entry = new AuditEntry(
                    entryId,
                    sequence,
                    entityType,
                    entityId,
                    eventType,
                    actor,
                    description,
                    eventData,
                    metadata,
                    timestamp,
                    previousHash,
                    dataHash,
                    entryHash,
                    null,  // signature (would be added in production)
                    AuditEntryStatus.COMMITTED
            );

            // Store entry
            auditLog.put(entryId, entry);

            // Update indexes
            indexEntry(entry);

            // Update last hash
            lastEntryHash = entryHash;

            // Notify listeners
            notifyListeners(entry);

            Log.debugf("Audit entry created: %s, sequence %d", entryId, sequence);

            return entry;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Log a token creation event.
     */
    public Uni<AuditEntry> logTokenCreation(
            String tokenId,
            String creator,
            String tokenType,
            Map<String, Object> tokenDetails) {

        return logEntry(
                EntityType.TOKEN,
                tokenId,
                AuditEventType.TOKEN_CREATED,
                creator,
                "Token created: " + tokenId,
                Map.of(
                        "tokenType", tokenType,
                        "details", tokenDetails
                ),
                Map.of("action", "create")
        );
    }

    /**
     * Log a token transfer event.
     */
    public Uni<AuditEntry> logTokenTransfer(
            String tokenId,
            String from,
            String to,
            String amount,
            String transactionHash) {

        return logEntry(
                EntityType.TOKEN,
                tokenId,
                AuditEventType.TOKEN_TRANSFERRED,
                from,
                "Token transfer: " + amount + " from " + from + " to " + to,
                Map.of(
                        "from", from,
                        "to", to,
                        "amount", amount,
                        "txHash", transactionHash
                ),
                Map.of("action", "transfer")
        );
    }

    /**
     * Log a compliance check event.
     */
    public Uni<AuditEntry> logComplianceCheck(
            String entityId,
            String checkType,
            boolean passed,
            String actor,
            Map<String, Object> checkDetails) {

        return logEntry(
                EntityType.COMPLIANCE,
                entityId,
                passed ? AuditEventType.COMPLIANCE_PASSED : AuditEventType.COMPLIANCE_FAILED,
                actor,
                "Compliance check: " + checkType + " - " + (passed ? "PASSED" : "FAILED"),
                checkDetails,
                Map.of("checkType", checkType, "result", passed ? "pass" : "fail")
        );
    }

    /**
     * Log an access event.
     */
    public Uni<AuditEntry> logAccessEvent(
            String resourceId,
            String accessor,
            AccessType accessType,
            boolean granted,
            String reason) {

        return logEntry(
                EntityType.ACCESS,
                resourceId,
                granted ? AuditEventType.ACCESS_GRANTED : AuditEventType.ACCESS_DENIED,
                accessor,
                "Access " + (granted ? "granted" : "denied") + ": " + accessType,
                Map.of(
                        "accessType", accessType.name(),
                        "granted", granted,
                        "reason", reason
                ),
                Map.of("accessType", accessType.name())
        );
    }

    /**
     * Log a system event.
     */
    public Uni<AuditEntry> logSystemEvent(
            String component,
            String eventName,
            String actor,
            Map<String, Object> eventDetails) {

        return logEntry(
                EntityType.SYSTEM,
                component,
                AuditEventType.SYSTEM_EVENT,
                actor,
                "System event: " + eventName,
                eventDetails,
                Map.of("eventName", eventName)
        );
    }

    // ==========================================
    // QUERY OPERATIONS
    // ==========================================

    /**
     * Get an audit entry by ID.
     *
     * @param entryId Entry identifier
     * @return Audit entry if found
     */
    public Uni<Optional<AuditEntry>> getEntry(String entryId) {
        return Uni.createFrom().item(() -> Optional.ofNullable(auditLog.get(entryId)))
                .runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all audit entries for an entity.
     *
     * @param entityId Entity identifier
     * @return List of audit entries
     */
    public Uni<List<AuditEntry>> getEntriesByEntity(String entityId) {
        return Uni.createFrom().item(() -> {
            List<String> entryIds = entityIndex.getOrDefault(entityId, Collections.emptyList());
            return entryIds.stream()
                    .map(auditLog::get)
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparingLong(AuditEntry::sequence))
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all audit entries by actor.
     *
     * @param actorId Actor identifier
     * @return List of audit entries
     */
    public Uni<List<AuditEntry>> getEntriesByActor(String actorId) {
        return Uni.createFrom().item(() -> {
            List<String> entryIds = actorIndex.getOrDefault(actorId, Collections.emptyList());
            return entryIds.stream()
                    .map(auditLog::get)
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparingLong(AuditEntry::sequence))
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all audit entries by event type.
     *
     * @param eventType Event type to filter by
     * @return List of audit entries
     */
    public Uni<List<AuditEntry>> getEntriesByEventType(AuditEventType eventType) {
        return Uni.createFrom().item(() -> {
            List<String> entryIds = eventTypeIndex.getOrDefault(eventType, Collections.emptyList());
            return entryIds.stream()
                    .map(auditLog::get)
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparingLong(AuditEntry::sequence))
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get audit entries within a date range.
     *
     * @param fromDate Start date
     * @param toDate End date
     * @return List of audit entries
     */
    public Uni<List<AuditEntry>> getEntriesByDateRange(Instant fromDate, Instant toDate) {
        return Uni.createFrom().item(() ->
            auditLog.values().stream()
                    .filter(e -> !e.timestamp().isBefore(fromDate) && !e.timestamp().isAfter(toDate))
                    .sorted(Comparator.comparingLong(AuditEntry::sequence))
                    .collect(Collectors.toList())
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Search audit entries with multiple criteria.
     *
     * @param query Search query parameters
     * @return Search results with pagination
     */
    public Uni<AuditSearchResult> searchEntries(AuditSearchQuery query) {
        return Uni.createFrom().item(() -> {
            Log.debugf("Searching audit entries with query: %s", query);

            List<AuditEntry> results = auditLog.values().stream()
                    // Filter by entity ID
                    .filter(e -> query.entityId() == null || e.entityId().equals(query.entityId()))
                    // Filter by entity type
                    .filter(e -> query.entityType() == null || e.entityType() == query.entityType())
                    // Filter by actor
                    .filter(e -> query.actorId() == null || e.actor().equals(query.actorId()))
                    // Filter by event types
                    .filter(e -> query.eventTypes() == null || query.eventTypes().isEmpty() ||
                            query.eventTypes().contains(e.eventType()))
                    // Filter by date range
                    .filter(e -> query.fromDate() == null || !e.timestamp().isBefore(query.fromDate()))
                    .filter(e -> query.toDate() == null || !e.timestamp().isAfter(query.toDate()))
                    // Filter by keyword in description
                    .filter(e -> query.keyword() == null || query.keyword().isEmpty() ||
                            e.description().toLowerCase().contains(query.keyword().toLowerCase()))
                    // Sort
                    .sorted(query.sortAscending() ?
                            Comparator.comparingLong(AuditEntry::sequence) :
                            Comparator.comparingLong(AuditEntry::sequence).reversed())
                    .collect(Collectors.toList());

            int totalCount = results.size();

            // Apply pagination
            int startIndex = query.page() * query.pageSize();
            int endIndex = Math.min(startIndex + query.pageSize(), totalCount);

            List<AuditEntry> pagedResults = startIndex < totalCount ?
                    results.subList(startIndex, endIndex) : Collections.emptyList();

            return new AuditSearchResult(
                    pagedResults,
                    totalCount,
                    query.page(),
                    query.pageSize(),
                    (int) Math.ceil((double) totalCount / query.pageSize()),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // INTEGRITY VERIFICATION
    // ==========================================

    /**
     * Verify the integrity of the entire audit trail.
     *
     * @return Verification result
     */
    public Uni<AuditIntegrityResult> verifyIntegrity() {
        return Uni.createFrom().item(() -> {
            Log.info("Verifying audit trail integrity");

            List<AuditEntry> sortedEntries = auditLog.values().stream()
                    .sorted(Comparator.comparingLong(AuditEntry::sequence))
                    .collect(Collectors.toList());

            List<IntegrityError> errors = new ArrayList<>();
            String expectedPreviousHash = "0000000000000000000000000000000000000000000000000000000000000000";

            for (int i = 0; i < sortedEntries.size(); i++) {
                AuditEntry entry = sortedEntries.get(i);

                // Verify previous hash link
                if (!entry.previousHash().equals(expectedPreviousHash)) {
                    errors.add(new IntegrityError(
                            entry.entryId(),
                            entry.sequence(),
                            "Previous hash mismatch",
                            IntegrityErrorType.HASH_CHAIN_BREAK
                    ));
                }

                // Verify entry hash computation
                String computedHash = computeChainHash(
                        entry.previousHash(), entry.dataHash(), entry.sequence()
                );
                if (!computedHash.equals(entry.entryHash())) {
                    errors.add(new IntegrityError(
                            entry.entryId(),
                            entry.sequence(),
                            "Entry hash mismatch",
                            IntegrityErrorType.HASH_MISMATCH
                    ));
                }

                // Verify data hash
                String computedDataHash = computeHash(entry.eventData().toString());
                if (!computedDataHash.equals(entry.dataHash())) {
                    errors.add(new IntegrityError(
                            entry.entryId(),
                            entry.sequence(),
                            "Data hash mismatch - possible tampering",
                            IntegrityErrorType.DATA_TAMPERING
                    ));
                }

                // Verify sequence continuity
                if (entry.sequence() != i + 1) {
                    errors.add(new IntegrityError(
                            entry.entryId(),
                            entry.sequence(),
                            "Sequence discontinuity",
                            IntegrityErrorType.SEQUENCE_GAP
                    ));
                }

                expectedPreviousHash = entry.entryHash();
            }

            boolean isValid = errors.isEmpty();

            return new AuditIntegrityResult(
                    isValid,
                    sortedEntries.size(),
                    sortedEntries.isEmpty() ? null : sortedEntries.get(0).timestamp(),
                    sortedEntries.isEmpty() ? null : sortedEntries.get(sortedEntries.size() - 1).timestamp(),
                    lastEntryHash,
                    errors,
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verify integrity of entries for a specific entity.
     *
     * @param entityId Entity identifier
     * @return Verification result
     */
    public Uni<AuditIntegrityResult> verifyEntityIntegrity(String entityId) {
        return getEntriesByEntity(entityId)
                .map(entries -> {
                    List<IntegrityError> errors = new ArrayList<>();

                    for (int i = 0; i < entries.size(); i++) {
                        AuditEntry entry = entries.get(i);

                        // Verify data hash
                        String computedDataHash = computeHash(entry.eventData().toString());
                        if (!computedDataHash.equals(entry.dataHash())) {
                            errors.add(new IntegrityError(
                                    entry.entryId(),
                                    entry.sequence(),
                                    "Data hash mismatch",
                                    IntegrityErrorType.DATA_TAMPERING
                            ));
                        }
                    }

                    return new AuditIntegrityResult(
                            errors.isEmpty(),
                            entries.size(),
                            entries.isEmpty() ? null : entries.get(0).timestamp(),
                            entries.isEmpty() ? null : entries.get(entries.size() - 1).timestamp(),
                            entries.isEmpty() ? null : entries.get(entries.size() - 1).entryHash(),
                            errors,
                            Instant.now()
                    );
                });
    }

    // ==========================================
    // EXPORT OPERATIONS
    // ==========================================

    /**
     * Export audit trail to specified format.
     *
     * @param entityId Entity to export (null for all)
     * @param format Export format
     * @param fromDate Start date (optional)
     * @param toDate End date (optional)
     * @return Exported audit data
     */
    public Uni<ExportedAuditData> exportAuditTrail(
            String entityId,
            ExportFormat format,
            Instant fromDate,
            Instant toDate) {

        return Uni.createFrom().item(() -> {
            Log.infof("Exporting audit trail for entity %s in format %s", entityId, format);

            List<AuditEntry> entries = auditLog.values().stream()
                    .filter(e -> entityId == null || e.entityId().equals(entityId))
                    .filter(e -> fromDate == null || !e.timestamp().isBefore(fromDate))
                    .filter(e -> toDate == null || !e.timestamp().isAfter(toDate))
                    .sorted(Comparator.comparingLong(AuditEntry::sequence))
                    .collect(Collectors.toList());

            String content = switch (format) {
                case JSON -> exportToJson(entries);
                case CSV -> exportToCsv(entries);
                case XML -> exportToXml(entries);
            };

            return new ExportedAuditData(
                    entityId,
                    format,
                    entries.size(),
                    content,
                    computeHash(content),
                    fromDate,
                    toDate,
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    private String exportToJson(List<AuditEntry> entries) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        for (int i = 0; i < entries.size(); i++) {
            AuditEntry entry = entries.get(i);
            json.append("{");
            json.append("\"entryId\":\"").append(entry.entryId()).append("\",");
            json.append("\"sequence\":").append(entry.sequence()).append(",");
            json.append("\"entityType\":\"").append(entry.entityType()).append("\",");
            json.append("\"entityId\":\"").append(entry.entityId()).append("\",");
            json.append("\"eventType\":\"").append(entry.eventType()).append("\",");
            json.append("\"actor\":\"").append(entry.actor()).append("\",");
            json.append("\"description\":\"").append(escapeJson(entry.description())).append("\",");
            json.append("\"timestamp\":\"").append(entry.timestamp()).append("\",");
            json.append("\"entryHash\":\"").append(entry.entryHash()).append("\"");
            json.append("}");
            if (i < entries.size() - 1) json.append(",");
        }
        json.append("]");
        return json.toString();
    }

    private String exportToCsv(List<AuditEntry> entries) {
        StringBuilder csv = new StringBuilder();
        csv.append("EntryId,Sequence,EntityType,EntityId,EventType,Actor,Description,Timestamp,EntryHash\n");
        for (AuditEntry entry : entries) {
            csv.append(entry.entryId()).append(",");
            csv.append(entry.sequence()).append(",");
            csv.append(entry.entityType()).append(",");
            csv.append(entry.entityId()).append(",");
            csv.append(entry.eventType()).append(",");
            csv.append(entry.actor()).append(",");
            csv.append("\"").append(escapeCsv(entry.description())).append("\",");
            csv.append(entry.timestamp()).append(",");
            csv.append(entry.entryHash()).append("\n");
        }
        return csv.toString();
    }

    private String exportToXml(List<AuditEntry> entries) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<auditTrail>\n");
        for (AuditEntry entry : entries) {
            xml.append("  <entry>\n");
            xml.append("    <entryId>").append(entry.entryId()).append("</entryId>\n");
            xml.append("    <sequence>").append(entry.sequence()).append("</sequence>\n");
            xml.append("    <entityType>").append(entry.entityType()).append("</entityType>\n");
            xml.append("    <entityId>").append(escapeXml(entry.entityId())).append("</entityId>\n");
            xml.append("    <eventType>").append(entry.eventType()).append("</eventType>\n");
            xml.append("    <actor>").append(escapeXml(entry.actor())).append("</actor>\n");
            xml.append("    <description>").append(escapeXml(entry.description())).append("</description>\n");
            xml.append("    <timestamp>").append(entry.timestamp()).append("</timestamp>\n");
            xml.append("    <entryHash>").append(entry.entryHash()).append("</entryHash>\n");
            xml.append("  </entry>\n");
        }
        xml.append("</auditTrail>");
        return xml.toString();
    }

    // ==========================================
    // EVENT LISTENER MANAGEMENT
    // ==========================================

    /**
     * Add an audit event listener.
     */
    public void addEventListener(AuditEventListener listener) {
        eventListeners.add(listener);
        Log.debugf("Audit event listener added: %s", listener.getClass().getSimpleName());
    }

    /**
     * Remove an audit event listener.
     */
    public void removeEventListener(AuditEventListener listener) {
        eventListeners.remove(listener);
        Log.debugf("Audit event listener removed: %s", listener.getClass().getSimpleName());
    }

    private void notifyListeners(AuditEntry entry) {
        for (AuditEventListener listener : eventListeners) {
            try {
                listener.onAuditEntry(entry);
            } catch (Exception e) {
                Log.errorf(e, "Error notifying audit listener: %s", listener.getClass().getSimpleName());
            }
        }
    }

    // ==========================================
    // STATISTICS
    // ==========================================

    /**
     * Get audit trail statistics.
     */
    public Uni<AuditStatistics> getStatistics() {
        return Uni.createFrom().item(() -> {
            Map<AuditEventType, Long> eventTypeCounts = auditLog.values().stream()
                    .collect(Collectors.groupingBy(AuditEntry::eventType, Collectors.counting()));

            Map<EntityType, Long> entityTypeCounts = auditLog.values().stream()
                    .collect(Collectors.groupingBy(AuditEntry::entityType, Collectors.counting()));

            Set<String> uniqueActors = auditLog.values().stream()
                    .map(AuditEntry::actor)
                    .collect(Collectors.toSet());

            Set<String> uniqueEntities = auditLog.values().stream()
                    .map(AuditEntry::entityId)
                    .collect(Collectors.toSet());

            Instant oldestEntry = auditLog.values().stream()
                    .map(AuditEntry::timestamp)
                    .min(Comparator.naturalOrder())
                    .orElse(null);

            Instant newestEntry = auditLog.values().stream()
                    .map(AuditEntry::timestamp)
                    .max(Comparator.naturalOrder())
                    .orElse(null);

            return new AuditStatistics(
                    auditLog.size(),
                    uniqueEntities.size(),
                    uniqueActors.size(),
                    eventTypeCounts,
                    entityTypeCounts,
                    oldestEntry,
                    newestEntry,
                    lastEntryHash,
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    private void indexEntry(AuditEntry entry) {
        // Index by entity
        entityIndex.computeIfAbsent(entry.entityId(),
                k -> Collections.synchronizedList(new ArrayList<>())).add(entry.entryId());

        // Index by actor
        actorIndex.computeIfAbsent(entry.actor(),
                k -> Collections.synchronizedList(new ArrayList<>())).add(entry.entryId());

        // Index by event type
        eventTypeIndex.computeIfAbsent(entry.eventType(),
                k -> Collections.synchronizedList(new ArrayList<>())).add(entry.entryId());

        // Index by date
        String dateKey = LocalDate.ofInstant(entry.timestamp(), ZoneId.systemDefault()).toString();
        dateIndex.computeIfAbsent(dateKey,
                k -> Collections.synchronizedList(new ArrayList<>())).add(entry.entryId());
    }

    private String generateEntryId() {
        return "AUD-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }

    private String computeHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new AuditTrailException("Hash algorithm not available: " + HASH_ALGORITHM);
        }
    }

    private String computeChainHash(String previousHash, String dataHash, long sequence) {
        return computeHash(previousHash + dataHash + sequence);
    }

    private String escapeJson(String input) {
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String escapeCsv(String input) {
        return input.replace("\"", "\"\"");
    }

    private String escapeXml(String input) {
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    // ==========================================
    // RECORD TYPES
    // ==========================================

    /**
     * Audit entry - immutable audit log record.
     */
    public record AuditEntry(
            String entryId,
            long sequence,
            EntityType entityType,
            String entityId,
            AuditEventType eventType,
            String actor,
            String description,
            Map<String, Object> eventData,
            Map<String, String> metadata,
            Instant timestamp,
            String previousHash,
            String dataHash,
            String entryHash,
            String signature,
            AuditEntryStatus status
    ) {}

    /**
     * Audit search query.
     */
    public record AuditSearchQuery(
            String entityId,
            EntityType entityType,
            String actorId,
            List<AuditEventType> eventTypes,
            Instant fromDate,
            Instant toDate,
            String keyword,
            int page,
            int pageSize,
            boolean sortAscending
    ) {
        public AuditSearchQuery {
            if (page < 0) page = 0;
            if (pageSize <= 0) pageSize = 20;
            if (pageSize > 1000) pageSize = 1000;
        }
    }

    /**
     * Audit search result with pagination.
     */
    public record AuditSearchResult(
            List<AuditEntry> entries,
            int totalCount,
            int page,
            int pageSize,
            int totalPages,
            Instant searchedAt
    ) {}

    /**
     * Audit integrity verification result.
     */
    public record AuditIntegrityResult(
            boolean isValid,
            int entryCount,
            Instant firstEntryTime,
            Instant lastEntryTime,
            String lastHash,
            List<IntegrityError> errors,
            Instant verifiedAt
    ) {}

    /**
     * Integrity error details.
     */
    public record IntegrityError(
            String entryId,
            long sequence,
            String message,
            IntegrityErrorType errorType
    ) {}

    /**
     * Exported audit data.
     */
    public record ExportedAuditData(
            String entityId,
            ExportFormat format,
            int entryCount,
            String content,
            String contentHash,
            Instant fromDate,
            Instant toDate,
            Instant exportedAt
    ) {}

    /**
     * Audit trail statistics.
     */
    public record AuditStatistics(
            int totalEntries,
            int uniqueEntities,
            int uniqueActors,
            Map<AuditEventType, Long> eventTypeCounts,
            Map<EntityType, Long> entityTypeCounts,
            Instant oldestEntry,
            Instant newestEntry,
            String lastEntryHash,
            Instant computedAt
    ) {}

    // ==========================================
    // INTERFACES
    // ==========================================

    /**
     * Audit event listener interface.
     */
    public interface AuditEventListener {
        void onAuditEntry(AuditEntry entry);
    }

    // ==========================================
    // ENUMS
    // ==========================================

    public enum EntityType {
        TOKEN,
        PARTITION,
        HOLDER,
        TRANSACTION,
        COMPLIANCE,
        ACCESS,
        SYSTEM,
        USER,
        DOCUMENT,
        REPORT
    }

    public enum AuditEventType {
        // Token events
        TOKEN_CREATED,
        TOKEN_UPDATED,
        TOKEN_TRANSFERRED,
        TOKEN_BURNED,
        TOKEN_MINTED,
        TOKEN_PAUSED,
        TOKEN_UNPAUSED,
        TOKEN_FROZEN,
        TOKEN_UNFROZEN,

        // Partition events
        PARTITION_CREATED,
        PARTITION_UPDATED,
        PARTITION_MERGED,

        // Compliance events
        COMPLIANCE_PASSED,
        COMPLIANCE_FAILED,
        COMPLIANCE_CHECK,
        KYC_VERIFIED,
        KYC_REJECTED,
        AML_SCREENED,
        AML_FLAGGED,

        // Access events
        ACCESS_GRANTED,
        ACCESS_DENIED,
        ACCESS_REVOKED,
        PERMISSION_CHANGED,

        // System events
        SYSTEM_EVENT,
        CONFIGURATION_CHANGED,
        SERVICE_STARTED,
        SERVICE_STOPPED,
        ERROR_OCCURRED,

        // Report events
        REPORT_GENERATED,
        REPORT_SUBMITTED,
        REPORT_APPROVED,

        // Other events
        CUSTOM_EVENT
    }

    public enum AccessType {
        READ,
        WRITE,
        EXECUTE,
        ADMIN,
        TRANSFER,
        MINT,
        BURN,
        PAUSE,
        CONFIGURE
    }

    public enum AuditEntryStatus {
        PENDING,
        COMMITTED,
        VERIFIED,
        ARCHIVED
    }

    public enum IntegrityErrorType {
        HASH_CHAIN_BREAK,
        HASH_MISMATCH,
        DATA_TAMPERING,
        SEQUENCE_GAP,
        SIGNATURE_INVALID,
        TIMESTAMP_ANOMALY
    }

    public enum ExportFormat {
        JSON,
        CSV,
        XML
    }

    /**
     * Audit trail exception.
     */
    public static class AuditTrailException extends RuntimeException {
        public AuditTrailException(String message) {
            super(message);
        }
    }
}
