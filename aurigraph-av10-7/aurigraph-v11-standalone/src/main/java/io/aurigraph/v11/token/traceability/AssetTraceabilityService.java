package io.aurigraph.v11.token.traceability;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * AssetTraceabilityService - Comprehensive asset traceability with hash chain and blockchain anchoring.
 *
 * Provides complete provenance tracking for tokenized real-world assets:
 * - SHA-256 hash chain for integrity verification
 * - Blockchain anchoring for immutability proofs
 * - Full audit trail generation
 * - Chain-of-custody tracking
 * - Merkle tree proofs for batch verification
 *
 * Compliance Support:
 * - SEC Rule 17a-4 (Record keeping)
 * - EU MiCA (Markets in Crypto-Assets)
 * - SOC2 Type II (Security, Availability, Processing Integrity)
 * - GDPR (Data protection with audit trails)
 *
 * @author Aurigraph V12 Token Team
 * @version 1.0
 * @since Sprint 12-13
 */
@ApplicationScoped
public class AssetTraceabilityService {

    // Hash chain registry: assetId -> List of TraceabilityRecord
    private final Map<String, List<TraceabilityRecord>> traceabilityChain = new ConcurrentHashMap<>();

    // Blockchain anchors: anchorId -> BlockchainAnchor
    private final Map<String, BlockchainAnchor> blockchainAnchors = new ConcurrentHashMap<>();

    // Asset to anchor mapping: assetId -> List of anchorIds
    private final Map<String, List<String>> assetAnchors = new ConcurrentHashMap<>();

    // Merkle tree roots: batchId -> MerkleRoot
    private final Map<String, MerkleRoot> merkleRoots = new ConcurrentHashMap<>();

    // Chain-of-custody records: assetId -> List of CustodyRecord
    private final Map<String, List<CustodyRecord>> custodyChain = new ConcurrentHashMap<>();

    private static final String HASH_ALGORITHM = "SHA-256";
    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    // ==========================================
    // HASH CHAIN OPERATIONS
    // ==========================================

    /**
     * Initialize traceability for a new asset.
     *
     * @param assetId Unique asset identifier
     * @param assetType Type of asset (REAL_ESTATE, CARBON_CREDIT, etc.)
     * @param originData Origin metadata for the asset
     * @param creator Address of the creator
     * @return Genesis traceability record
     */
    public Uni<TraceabilityRecord> initializeAssetTraceability(
            String assetId,
            AssetType assetType,
            Map<String, Object> originData,
            String creator) {

        return Uni.createFrom().item(() -> {
            Log.infof("Initializing traceability for asset %s of type %s", assetId, assetType);

            validateAssetId(assetId);

            if (traceabilityChain.containsKey(assetId)) {
                throw new TraceabilityException("Asset traceability already initialized: " + assetId);
            }

            String recordId = generateRecordId();
            String dataHash = computeHash(originData.toString());

            TraceabilityRecord genesisRecord = new TraceabilityRecord(
                    recordId,
                    assetId,
                    GENESIS_HASH,
                    dataHash,
                    computeChainHash(GENESIS_HASH, dataHash),
                    RecordType.GENESIS,
                    assetType,
                    originData,
                    creator,
                    null,
                    Instant.now(),
                    0,
                    VerificationStatus.VERIFIED,
                    Collections.emptyList()
            );

            List<TraceabilityRecord> chain = Collections.synchronizedList(new ArrayList<>());
            chain.add(genesisRecord);
            traceabilityChain.put(assetId, chain);

            // Initialize custody chain
            custodyChain.put(assetId, Collections.synchronizedList(new ArrayList<>()));

            Log.infof("Asset traceability initialized: %s with hash %s",
                    assetId, genesisRecord.chainHash());

            return genesisRecord;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add a new record to the asset's traceability chain.
     *
     * @param assetId Asset identifier
     * @param recordType Type of record (TRANSFER, VERIFICATION, etc.)
     * @param eventData Event-specific data
     * @param actor Address performing the action
     * @param witnesses List of witness addresses
     * @return New traceability record
     */
    public Uni<TraceabilityRecord> addTraceabilityRecord(
            String assetId,
            RecordType recordType,
            Map<String, Object> eventData,
            String actor,
            List<String> witnesses) {

        return Uni.createFrom().item(() -> {
            Log.infof("Adding %s record to asset %s by %s", recordType, assetId, actor);

            List<TraceabilityRecord> chain = getChainOrThrow(assetId);
            TraceabilityRecord previousRecord = chain.get(chain.size() - 1);

            String recordId = generateRecordId();
            String dataHash = computeHash(eventData.toString());
            String chainHash = computeChainHash(previousRecord.chainHash(), dataHash);

            TraceabilityRecord newRecord = new TraceabilityRecord(
                    recordId,
                    assetId,
                    previousRecord.chainHash(),
                    dataHash,
                    chainHash,
                    recordType,
                    previousRecord.assetType(),
                    eventData,
                    actor,
                    previousRecord.actor(),
                    Instant.now(),
                    previousRecord.sequenceNumber() + 1,
                    VerificationStatus.PENDING,
                    witnesses
            );

            chain.add(newRecord);

            Log.infof("Added record %s to chain, sequence %d, hash %s",
                    recordId, newRecord.sequenceNumber(), chainHash);

            return newRecord;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verify the integrity of an asset's traceability chain.
     *
     * @param assetId Asset identifier
     * @return Verification result with details
     */
    public Uni<ChainVerificationResult> verifyChainIntegrity(String assetId) {
        return Uni.createFrom().item(() -> {
            Log.infof("Verifying chain integrity for asset %s", assetId);

            List<TraceabilityRecord> chain = getChainOrThrow(assetId);
            List<ChainVerificationError> errors = new ArrayList<>();

            for (int i = 0; i < chain.size(); i++) {
                TraceabilityRecord record = chain.get(i);

                // Verify genesis record
                if (i == 0) {
                    if (!GENESIS_HASH.equals(record.previousHash())) {
                        errors.add(new ChainVerificationError(
                                record.recordId(),
                                0,
                                "Genesis record has invalid previous hash",
                                ErrorSeverity.CRITICAL
                        ));
                    }
                    continue;
                }

                // Verify chain link
                TraceabilityRecord previousRecord = chain.get(i - 1);
                if (!previousRecord.chainHash().equals(record.previousHash())) {
                    errors.add(new ChainVerificationError(
                            record.recordId(),
                            i,
                            "Chain hash mismatch at sequence " + i,
                            ErrorSeverity.CRITICAL
                    ));
                }

                // Verify computed chain hash
                String expectedChainHash = computeChainHash(record.previousHash(), record.dataHash());
                if (!expectedChainHash.equals(record.chainHash())) {
                    errors.add(new ChainVerificationError(
                            record.recordId(),
                            i,
                            "Chain hash computation mismatch",
                            ErrorSeverity.CRITICAL
                    ));
                }

                // Verify sequence number
                if (record.sequenceNumber() != i) {
                    errors.add(new ChainVerificationError(
                            record.recordId(),
                            i,
                            "Sequence number mismatch: expected " + i + ", got " + record.sequenceNumber(),
                            ErrorSeverity.WARNING
                    ));
                }
            }

            boolean isValid = errors.stream().noneMatch(e -> e.severity() == ErrorSeverity.CRITICAL);

            return new ChainVerificationResult(
                    assetId,
                    isValid,
                    chain.size(),
                    chain.get(0).timestamp(),
                    chain.get(chain.size() - 1).timestamp(),
                    chain.get(chain.size() - 1).chainHash(),
                    errors,
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // BLOCKCHAIN ANCHORING
    // ==========================================

    /**
     * Create a blockchain anchor for asset traceability data.
     *
     * @param assetId Asset identifier
     * @param blockchain Target blockchain (ETHEREUM, POLYGON, etc.)
     * @param anchorData Additional anchor metadata
     * @return Blockchain anchor record
     */
    public Uni<BlockchainAnchor> createBlockchainAnchor(
            String assetId,
            BlockchainType blockchain,
            Map<String, Object> anchorData) {

        return Uni.createFrom().item(() -> {
            Log.infof("Creating blockchain anchor for asset %s on %s", assetId, blockchain);

            List<TraceabilityRecord> chain = getChainOrThrow(assetId);
            TraceabilityRecord latestRecord = chain.get(chain.size() - 1);

            String anchorId = generateAnchorId();
            String merkleRoot = computeMerkleRoot(chain);

            // Simulate transaction hash (in production, this would be actual blockchain tx)
            String transactionHash = "0x" + computeHash(
                    anchorId + merkleRoot + blockchain.name() + Instant.now().toString()
            ).substring(0, 64);

            BlockchainAnchor anchor = new BlockchainAnchor(
                    anchorId,
                    assetId,
                    blockchain,
                    transactionHash,
                    null, // Block number set after confirmation
                    merkleRoot,
                    latestRecord.chainHash(),
                    chain.size(),
                    AnchorStatus.PENDING,
                    anchorData,
                    Instant.now(),
                    null,
                    null
            );

            blockchainAnchors.put(anchorId, anchor);
            assetAnchors.computeIfAbsent(assetId, k -> Collections.synchronizedList(new ArrayList<>()))
                    .add(anchorId);

            Log.infof("Created anchor %s with tx %s", anchorId, transactionHash);

            // Simulate async confirmation (in production, would wait for blockchain confirmation)
            confirmAnchor(anchorId, 12345678L);

            return anchor;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Confirm a blockchain anchor after transaction is mined.
     *
     * @param anchorId Anchor identifier
     * @param blockNumber Block number where transaction was included
     * @return Updated anchor record
     */
    public Uni<BlockchainAnchor> confirmAnchor(String anchorId, Long blockNumber) {
        return Uni.createFrom().item(() -> {
            BlockchainAnchor anchor = blockchainAnchors.get(anchorId);
            if (anchor == null) {
                throw new TraceabilityException("Anchor not found: " + anchorId);
            }

            BlockchainAnchor confirmed = new BlockchainAnchor(
                    anchor.anchorId(),
                    anchor.assetId(),
                    anchor.blockchain(),
                    anchor.transactionHash(),
                    blockNumber,
                    anchor.merkleRoot(),
                    anchor.latestChainHash(),
                    anchor.recordCount(),
                    AnchorStatus.CONFIRMED,
                    anchor.metadata(),
                    anchor.createdAt(),
                    Instant.now(),
                    null
            );

            blockchainAnchors.put(anchorId, confirmed);

            Log.infof("Anchor %s confirmed at block %d", anchorId, blockNumber);

            return confirmed;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verify an asset's blockchain anchor.
     *
     * @param assetId Asset identifier
     * @param anchorId Anchor identifier
     * @return Verification result
     */
    public Uni<AnchorVerificationResult> verifyBlockchainAnchor(String assetId, String anchorId) {
        return Uni.createFrom().item(() -> {
            Log.infof("Verifying anchor %s for asset %s", anchorId, assetId);

            BlockchainAnchor anchor = blockchainAnchors.get(anchorId);
            if (anchor == null) {
                throw new TraceabilityException("Anchor not found: " + anchorId);
            }

            List<TraceabilityRecord> chain = getChainOrThrow(assetId);
            String currentMerkleRoot = computeMerkleRoot(chain);

            boolean rootMatches = anchor.merkleRoot().equals(currentMerkleRoot) ||
                    chain.size() > anchor.recordCount();

            boolean hashMatches = chain.stream()
                    .anyMatch(r -> r.chainHash().equals(anchor.latestChainHash()));

            return new AnchorVerificationResult(
                    anchorId,
                    assetId,
                    anchor.blockchain(),
                    anchor.status() == AnchorStatus.CONFIRMED,
                    rootMatches,
                    hashMatches,
                    anchor.transactionHash(),
                    anchor.blockNumber(),
                    anchor.confirmedAt(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all blockchain anchors for an asset.
     *
     * @param assetId Asset identifier
     * @return List of blockchain anchors
     */
    public Uni<List<BlockchainAnchor>> getAssetAnchors(String assetId) {
        return Uni.createFrom().item(() -> {
            List<String> anchorIds = assetAnchors.getOrDefault(assetId, Collections.emptyList());
            return anchorIds.stream()
                    .map(blockchainAnchors::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // AUDIT TRAIL GENERATION
    // ==========================================

    /**
     * Generate a complete audit trail for an asset.
     *
     * @param assetId Asset identifier
     * @param fromDate Start date (optional)
     * @param toDate End date (optional)
     * @return Complete audit trail
     */
    public Uni<AssetAuditTrail> generateAuditTrail(
            String assetId,
            Instant fromDate,
            Instant toDate) {

        return Uni.createFrom().item(() -> {
            Log.infof("Generating audit trail for asset %s", assetId);

            List<TraceabilityRecord> chain = getChainOrThrow(assetId);
            List<CustodyRecord> custody = custodyChain.getOrDefault(assetId, Collections.emptyList());
            List<BlockchainAnchor> anchors = assetAnchors.getOrDefault(assetId, Collections.emptyList())
                    .stream()
                    .map(blockchainAnchors::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // Filter by date range
            List<TraceabilityRecord> filteredRecords = chain.stream()
                    .filter(r -> fromDate == null || !r.timestamp().isBefore(fromDate))
                    .filter(r -> toDate == null || !r.timestamp().isAfter(toDate))
                    .collect(Collectors.toList());

            List<CustodyRecord> filteredCustody = custody.stream()
                    .filter(c -> fromDate == null || !c.timestamp().isBefore(fromDate))
                    .filter(c -> toDate == null || !c.timestamp().isAfter(toDate))
                    .collect(Collectors.toList());

            // Compute statistics
            Map<RecordType, Long> recordTypeCounts = filteredRecords.stream()
                    .collect(Collectors.groupingBy(TraceabilityRecord::recordType, Collectors.counting()));

            Set<String> uniqueActors = filteredRecords.stream()
                    .map(TraceabilityRecord::actor)
                    .collect(Collectors.toSet());

            return new AssetAuditTrail(
                    assetId,
                    chain.get(0).assetType(),
                    filteredRecords,
                    filteredCustody,
                    anchors,
                    chain.get(0).timestamp(),
                    chain.get(chain.size() - 1).timestamp(),
                    chain.size(),
                    uniqueActors.size(),
                    recordTypeCounts,
                    chain.get(chain.size() - 1).chainHash(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Export audit trail in specified format.
     *
     * @param assetId Asset identifier
     * @param format Export format (JSON, CSV, PDF)
     * @return Exported audit trail data
     */
    public Uni<ExportedAuditTrail> exportAuditTrail(String assetId, ExportFormat format) {
        return generateAuditTrail(assetId, null, null)
                .map(trail -> {
                    String content = switch (format) {
                        case JSON -> serializeToJson(trail);
                        case CSV -> serializeToCsv(trail);
                        case PDF -> serializeToPdfPlaceholder(trail);
                        case XML -> serializeToXml(trail);
                    };

                    return new ExportedAuditTrail(
                            assetId,
                            format,
                            content,
                            computeHash(content),
                            Instant.now()
                    );
                });
    }

    // ==========================================
    // CHAIN-OF-CUSTODY TRACKING
    // ==========================================

    /**
     * Record a custody change for an asset.
     *
     * @param assetId Asset identifier
     * @param fromCustodian Previous custodian
     * @param toCustodian New custodian
     * @param custodyType Type of custody arrangement
     * @param metadata Additional custody metadata
     * @return Custody record
     */
    public Uni<CustodyRecord> recordCustodyChange(
            String assetId,
            String fromCustodian,
            String toCustodian,
            CustodyType custodyType,
            Map<String, Object> metadata) {

        return Uni.createFrom().item(() -> {
            Log.infof("Recording custody change for %s: %s -> %s",
                    assetId, fromCustodian, toCustodian);

            List<CustodyRecord> custody = custodyChain.get(assetId);
            if (custody == null) {
                throw new TraceabilityException("Asset traceability not initialized: " + assetId);
            }

            String recordId = generateRecordId();

            CustodyRecord record = new CustodyRecord(
                    recordId,
                    assetId,
                    fromCustodian,
                    toCustodian,
                    custodyType,
                    metadata,
                    Instant.now(),
                    CustodyStatus.PENDING
            );

            custody.add(record);

            // Also add to traceability chain
            addTraceabilityRecord(
                    assetId,
                    RecordType.CUSTODY_CHANGE,
                    Map.of(
                            "from", fromCustodian != null ? fromCustodian : "null",
                            "to", toCustodian,
                            "type", custodyType.name()
                    ),
                    toCustodian,
                    Collections.emptyList()
            ).await().indefinitely();

            return record;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get current custodian for an asset.
     *
     * @param assetId Asset identifier
     * @return Current custodian information
     */
    public Uni<Optional<CustodyRecord>> getCurrentCustodian(String assetId) {
        return Uni.createFrom().<Optional<CustodyRecord>>item(() -> {
            List<CustodyRecord> custody = custodyChain.get(assetId);
            if (custody == null || custody.isEmpty()) {
                return Optional.empty();
            }
            return Optional.of(custody.get(custody.size() - 1));
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // MERKLE TREE OPERATIONS
    // ==========================================

    /**
     * Create a Merkle tree for batch verification.
     *
     * @param assetIds List of asset IDs to include
     * @return Merkle root with proof data
     */
    public Uni<MerkleRoot> createMerkleTree(List<String> assetIds) {
        return Uni.createFrom().item(() -> {
            Log.infof("Creating Merkle tree for %d assets", assetIds.size());

            List<String> leafHashes = new ArrayList<>();
            for (String assetId : assetIds) {
                List<TraceabilityRecord> chain = traceabilityChain.get(assetId);
                if (chain != null && !chain.isEmpty()) {
                    leafHashes.add(chain.get(chain.size() - 1).chainHash());
                }
            }

            if (leafHashes.isEmpty()) {
                throw new TraceabilityException("No valid assets found for Merkle tree");
            }

            String rootHash = computeMerkleRootFromLeaves(leafHashes);
            String batchId = generateBatchId();

            MerkleRoot merkleRoot = new MerkleRoot(
                    batchId,
                    rootHash,
                    assetIds,
                    leafHashes.size(),
                    computeTreeDepth(leafHashes.size()),
                    Instant.now()
            );

            merkleRoots.put(batchId, merkleRoot);

            Log.infof("Created Merkle root %s for batch %s", rootHash, batchId);

            return merkleRoot;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Generate Merkle proof for a specific asset.
     *
     * @param batchId Batch identifier
     * @param assetId Asset to prove
     * @return Merkle proof
     */
    public Uni<MerkleProof> generateMerkleProof(String batchId, String assetId) {
        return Uni.createFrom().item(() -> {
            MerkleRoot root = merkleRoots.get(batchId);
            if (root == null) {
                throw new TraceabilityException("Merkle batch not found: " + batchId);
            }

            int index = root.assetIds().indexOf(assetId);
            if (index < 0) {
                throw new TraceabilityException("Asset not in batch: " + assetId);
            }

            List<TraceabilityRecord> chain = getChainOrThrow(assetId);
            String leafHash = chain.get(chain.size() - 1).chainHash();

            // Generate sibling hashes (simplified - in production would compute actual proof path)
            List<String> proofPath = generateSimplifiedProofPath(root.assetIds(), index);

            return new MerkleProof(
                    batchId,
                    assetId,
                    leafHash,
                    root.rootHash(),
                    proofPath,
                    index,
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // QUERY OPERATIONS
    // ==========================================

    /**
     * Get the complete traceability chain for an asset.
     *
     * @param assetId Asset identifier
     * @return List of traceability records
     */
    public Uni<List<TraceabilityRecord>> getTraceabilityChain(String assetId) {
        return Uni.createFrom().<List<TraceabilityRecord>>item(() -> {
            List<TraceabilityRecord> chain = traceabilityChain.get(assetId);
            if (chain == null) {
                return Collections.emptyList();
            }
            return new ArrayList<>(chain);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get a specific traceability record.
     *
     * @param assetId Asset identifier
     * @param recordId Record identifier
     * @return Traceability record if found
     */
    public Uni<Optional<TraceabilityRecord>> getRecord(String assetId, String recordId) {
        return Uni.createFrom().<Optional<TraceabilityRecord>>item(() -> {
            List<TraceabilityRecord> chain = traceabilityChain.get(assetId);
            if (chain == null) {
                return Optional.empty();
            }
            return chain.stream()
                    .filter(r -> r.recordId().equals(recordId))
                    .findFirst();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Search traceability records by actor.
     *
     * @param actor Actor address
     * @return List of records involving the actor
     */
    public Uni<List<TraceabilityRecord>> searchByActor(String actor) {
        return Uni.createFrom().item(() ->
            traceabilityChain.values().stream()
                    .flatMap(List::stream)
                    .filter(r -> actor.equals(r.actor()) || actor.equals(r.previousActor()))
                    .collect(Collectors.toList())
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Search traceability records by record type.
     *
     * @param recordType Type of record
     * @return List of matching records
     */
    public Uni<List<TraceabilityRecord>> searchByType(RecordType recordType) {
        return Uni.createFrom().item(() ->
            traceabilityChain.values().stream()
                    .flatMap(List::stream)
                    .filter(r -> r.recordType() == recordType)
                    .collect(Collectors.toList())
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Search traceability records by date range.
     *
     * @param fromDate Start date
     * @param toDate End date
     * @return List of records within date range
     */
    public Uni<List<TraceabilityRecord>> searchByDateRange(Instant fromDate, Instant toDate) {
        return Uni.createFrom().item(() ->
            traceabilityChain.values().stream()
                    .flatMap(List::stream)
                    .filter(r -> !r.timestamp().isBefore(fromDate) && !r.timestamp().isAfter(toDate))
                    .collect(Collectors.toList())
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    private void validateAssetId(String assetId) {
        if (assetId == null || assetId.isBlank()) {
            throw new TraceabilityException("Asset ID cannot be null or blank");
        }
    }

    private List<TraceabilityRecord> getChainOrThrow(String assetId) {
        List<TraceabilityRecord> chain = traceabilityChain.get(assetId);
        if (chain == null || chain.isEmpty()) {
            throw new TraceabilityException("Asset traceability not found: " + assetId);
        }
        return chain;
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
            throw new TraceabilityException("Hash algorithm not available: " + HASH_ALGORITHM);
        }
    }

    private String computeChainHash(String previousHash, String dataHash) {
        return computeHash(previousHash + dataHash);
    }

    private String computeMerkleRoot(List<TraceabilityRecord> chain) {
        List<String> hashes = chain.stream()
                .map(TraceabilityRecord::chainHash)
                .collect(Collectors.toList());
        return computeMerkleRootFromLeaves(hashes);
    }

    private String computeMerkleRootFromLeaves(List<String> leaves) {
        if (leaves.isEmpty()) {
            return GENESIS_HASH;
        }
        if (leaves.size() == 1) {
            return leaves.get(0);
        }

        List<String> nextLevel = new ArrayList<>();
        for (int i = 0; i < leaves.size(); i += 2) {
            String left = leaves.get(i);
            String right = (i + 1 < leaves.size()) ? leaves.get(i + 1) : left;
            nextLevel.add(computeHash(left + right));
        }
        return computeMerkleRootFromLeaves(nextLevel);
    }

    private int computeTreeDepth(int leafCount) {
        return (int) Math.ceil(Math.log(leafCount) / Math.log(2));
    }

    private List<String> generateSimplifiedProofPath(List<String> assetIds, int index) {
        // Simplified proof path generation
        List<String> path = new ArrayList<>();
        int siblingIndex = (index % 2 == 0) ? index + 1 : index - 1;
        if (siblingIndex >= 0 && siblingIndex < assetIds.size()) {
            List<TraceabilityRecord> siblingChain = traceabilityChain.get(assetIds.get(siblingIndex));
            if (siblingChain != null && !siblingChain.isEmpty()) {
                path.add(siblingChain.get(siblingChain.size() - 1).chainHash());
            }
        }
        return path;
    }

    private String generateRecordId() {
        return "TRC-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }

    private String generateAnchorId() {
        return "ANC-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }

    private String generateBatchId() {
        return "BATCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String serializeToJson(AssetAuditTrail trail) {
        // Simplified JSON serialization
        return "{\"assetId\":\"" + trail.assetId() +
               "\",\"recordCount\":" + trail.totalRecords() +
               ",\"hash\":\"" + trail.latestChainHash() + "\"}";
    }

    private String serializeToCsv(AssetAuditTrail trail) {
        StringBuilder csv = new StringBuilder();
        csv.append("RecordId,AssetId,RecordType,Actor,Timestamp,ChainHash\n");
        for (TraceabilityRecord record : trail.records()) {
            csv.append(record.recordId()).append(",")
               .append(record.assetId()).append(",")
               .append(record.recordType()).append(",")
               .append(record.actor()).append(",")
               .append(record.timestamp()).append(",")
               .append(record.chainHash()).append("\n");
        }
        return csv.toString();
    }

    private String serializeToPdfPlaceholder(AssetAuditTrail trail) {
        return "PDF_PLACEHOLDER:" + trail.assetId() + ":" + trail.totalRecords();
    }

    private String serializeToXml(AssetAuditTrail trail) {
        return "<auditTrail><assetId>" + trail.assetId() + "</assetId>" +
               "<recordCount>" + trail.totalRecords() + "</recordCount></auditTrail>";
    }

    // ==========================================
    // RECORD TYPES
    // ==========================================

    /**
     * Traceability record in the hash chain.
     */
    public record TraceabilityRecord(
            String recordId,
            String assetId,
            String previousHash,
            String dataHash,
            String chainHash,
            RecordType recordType,
            AssetType assetType,
            Map<String, Object> eventData,
            String actor,
            String previousActor,
            Instant timestamp,
            int sequenceNumber,
            VerificationStatus verificationStatus,
            List<String> witnesses
    ) {}

    /**
     * Blockchain anchor for immutability proofs.
     */
    public record BlockchainAnchor(
            String anchorId,
            String assetId,
            BlockchainType blockchain,
            String transactionHash,
            Long blockNumber,
            String merkleRoot,
            String latestChainHash,
            int recordCount,
            AnchorStatus status,
            Map<String, Object> metadata,
            Instant createdAt,
            Instant confirmedAt,
            String errorMessage
    ) {}

    /**
     * Chain-of-custody record.
     */
    public record CustodyRecord(
            String recordId,
            String assetId,
            String fromCustodian,
            String toCustodian,
            CustodyType custodyType,
            Map<String, Object> metadata,
            Instant timestamp,
            CustodyStatus status
    ) {}

    /**
     * Complete audit trail for an asset.
     */
    public record AssetAuditTrail(
            String assetId,
            AssetType assetType,
            List<TraceabilityRecord> records,
            List<CustodyRecord> custodyRecords,
            List<BlockchainAnchor> anchors,
            Instant firstRecordTime,
            Instant lastRecordTime,
            int totalRecords,
            int uniqueActors,
            Map<RecordType, Long> recordTypeCounts,
            String latestChainHash,
            Instant generatedAt
    ) {}

    /**
     * Exported audit trail.
     */
    public record ExportedAuditTrail(
            String assetId,
            ExportFormat format,
            String content,
            String contentHash,
            Instant exportedAt
    ) {}

    /**
     * Chain verification result.
     */
    public record ChainVerificationResult(
            String assetId,
            boolean isValid,
            int recordCount,
            Instant firstRecordTime,
            Instant lastRecordTime,
            String latestHash,
            List<ChainVerificationError> errors,
            Instant verifiedAt
    ) {}

    /**
     * Chain verification error.
     */
    public record ChainVerificationError(
            String recordId,
            int sequenceNumber,
            String message,
            ErrorSeverity severity
    ) {}

    /**
     * Anchor verification result.
     */
    public record AnchorVerificationResult(
            String anchorId,
            String assetId,
            BlockchainType blockchain,
            boolean isConfirmed,
            boolean merkleRootMatches,
            boolean chainHashMatches,
            String transactionHash,
            Long blockNumber,
            Instant confirmedAt,
            Instant verifiedAt
    ) {}

    /**
     * Merkle tree root.
     */
    public record MerkleRoot(
            String batchId,
            String rootHash,
            List<String> assetIds,
            int leafCount,
            int treeDepth,
            Instant createdAt
    ) {}

    /**
     * Merkle proof for verification.
     */
    public record MerkleProof(
            String batchId,
            String assetId,
            String leafHash,
            String rootHash,
            List<String> proofPath,
            int leafIndex,
            Instant generatedAt
    ) {}

    // ==========================================
    // ENUMS
    // ==========================================

    public enum RecordType {
        GENESIS,
        CREATION,
        TRANSFER,
        VERIFICATION,
        VALUATION,
        CUSTODY_CHANGE,
        COMPLIANCE_CHECK,
        AUDIT,
        MODIFICATION,
        REDEMPTION,
        SPLIT,
        MERGE,
        DIVIDEND,
        CORPORATE_ACTION
    }

    public enum AssetType {
        REAL_ESTATE,
        CARBON_CREDIT,
        SECURITY,
        COMMODITY,
        VEHICLE,
        INTELLECTUAL_PROPERTY,
        ART_COLLECTIBLE,
        TRADE_FINANCE,
        INFRASTRUCTURE
    }

    public enum VerificationStatus {
        PENDING,
        VERIFIED,
        REJECTED,
        EXPIRED
    }

    public enum BlockchainType {
        ETHEREUM,
        POLYGON,
        ARBITRUM,
        OPTIMISM,
        AVALANCHE,
        SOLANA,
        BITCOIN,
        COSMOS,
        POLKADOT,
        AURIGRAPH
    }

    public enum AnchorStatus {
        PENDING,
        SUBMITTED,
        CONFIRMED,
        FAILED
    }

    public enum CustodyType {
        SELF_CUSTODY,
        CUSTODIAL,
        ESCROW,
        TRUST,
        NOMINEE,
        COLLATERAL
    }

    public enum CustodyStatus {
        PENDING,
        ACTIVE,
        TRANSFERRED,
        RELEASED
    }

    public enum ExportFormat {
        JSON,
        CSV,
        PDF,
        XML
    }

    public enum ErrorSeverity {
        INFO,
        WARNING,
        CRITICAL
    }

    /**
     * Traceability exception.
     */
    public static class TraceabilityException extends RuntimeException {
        public TraceabilityException(String message) {
            super(message);
        }
    }
}
