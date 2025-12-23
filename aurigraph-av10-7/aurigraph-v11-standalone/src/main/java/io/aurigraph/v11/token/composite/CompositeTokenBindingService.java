package io.aurigraph.v11.token.composite;

import io.aurigraph.v11.token.primary.PrimaryToken;
import io.aurigraph.v11.token.secondary.SecondaryToken;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Composite Token Binding Service - Sprint 3-4 Implementation
 *
 * Manages the binding of primary and secondary tokens into immutable composite units.
 * Provides cryptographic guarantees for token bundle integrity using Merkle trees.
 *
 * Key Features:
 * - Bind primary + secondary tokens into composite bundle
 * - Immutability guarantees via cryptographic hashing
 * - Deterministic digital twin hash computation
 * - Support for unbinding in controlled scenarios
 *
 * Performance Requirements:
 * - Binding operation: < 100ms
 * - Hash computation: < 10ms
 * - Bundle validation: < 50ms
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 * @since Sprint 3 (Week 6)
 */
@ApplicationScoped
public class CompositeTokenBindingService {

    private static final Logger LOG = Logger.getLogger(CompositeTokenBindingService.class);

    @Inject
    CompositeMerkleService merkleService;

    // Cache for binding operations
    private final ConcurrentHashMap<String, BindingRecord> bindingCache = new ConcurrentHashMap<>();

    // Performance metrics
    private long bindingCount = 0;
    private long totalBindingTime = 0;
    private long hashComputationCount = 0;
    private long totalHashTime = 0;

    /**
     * Create a new composite token by binding primary and secondary tokens
     *
     * @param primaryToken The anchor primary token
     * @param secondaryTokens List of secondary tokens to include
     * @param owner The owner of the composite token
     * @return Uni containing the created composite token
     */
    @Transactional
    public Uni<CompositeToken> createCompositeToken(
            PrimaryToken primaryToken,
            List<SecondaryToken> secondaryTokens,
            String owner) {

        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            // Validate inputs
            validateBindingInputs(primaryToken, secondaryTokens, owner);

            // Generate composite token ID
            String compositeTokenId = generateCompositeTokenId(primaryToken.tokenId);

            // Create composite token
            CompositeToken composite = new CompositeToken(
                    compositeTokenId,
                    primaryToken.tokenId,
                    owner
            );

            // Add secondary tokens
            if (secondaryTokens != null && !secondaryTokens.isEmpty()) {
                List<String> secondaryIds = new ArrayList<>();
                BigDecimal totalValue = primaryToken.faceValue;

                for (SecondaryToken secondary : secondaryTokens) {
                    validateSecondaryToken(secondary, primaryToken.tokenId);
                    secondaryIds.add(secondary.tokenId);
                    totalValue = totalValue.add(secondary.faceValue);
                }

                composite.setSecondaryTokenIdList(secondaryIds);
                composite.totalValue = totalValue;
            } else {
                composite.totalValue = primaryToken.faceValue;
            }

            // Compute digital twin hash
            String digitalTwinHash = computeDigitalTwinHash(primaryToken, secondaryTokens);
            composite.digitalTwinHash = digitalTwinHash;

            // Compute Merkle root
            String merkleRoot = computeMerkleRoot(primaryToken, secondaryTokens);
            composite.merkleRoot = merkleRoot;

            // Persist the composite token
            composite.persist();

            // Cache the binding record
            BindingRecord record = new BindingRecord(
                    compositeTokenId,
                    primaryToken.tokenId,
                    secondaryTokens != null ? secondaryTokens.size() : 0,
                    Instant.now()
            );
            bindingCache.put(compositeTokenId, record);

            // Update metrics
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            synchronized (this) {
                bindingCount++;
                totalBindingTime += duration;
            }

            LOG.infof("Created composite token %s with %d secondary tokens in %dms",
                    compositeTokenId,
                    secondaryTokens != null ? secondaryTokens.size() : 0,
                    duration);

            return composite;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add a secondary token to an existing composite token
     *
     * @param compositeTokenId The composite token ID
     * @param secondaryToken The secondary token to add
     * @return Uni containing the updated composite token
     */
    @Transactional
    public Uni<CompositeToken> addSecondaryToken(
            String compositeTokenId,
            SecondaryToken secondaryToken) {

        return Uni.createFrom().item(() -> {
            CompositeToken composite = CompositeToken.findByCompositeTokenId(compositeTokenId);
            if (composite == null) {
                throw new IllegalArgumentException("Composite token not found: " + compositeTokenId);
            }

            // Only allow adding to CREATED status
            if (composite.status != CompositeToken.CompositeTokenStatus.CREATED) {
                throw new IllegalStateException("Cannot modify composite token with status: " + composite.status);
            }

            // Validate secondary token belongs to the same primary
            validateSecondaryToken(secondaryToken, composite.primaryTokenId);

            // Add secondary token
            composite.addSecondaryTokenId(secondaryToken.tokenId);
            composite.totalValue = composite.totalValue.add(secondaryToken.faceValue);

            // Recompute hashes
            PrimaryToken primary = PrimaryToken.findByTokenId(composite.primaryTokenId);
            List<SecondaryToken> secondaries = loadSecondaryTokens(composite.getSecondaryTokenIdList());

            composite.digitalTwinHash = computeDigitalTwinHash(primary, secondaries);
            composite.merkleRoot = computeMerkleRoot(primary, secondaries);
            composite.updatedAt = Instant.now();

            LOG.infof("Added secondary token %s to composite %s", secondaryToken.tokenId, compositeTokenId);

            return composite;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Compute the deterministic digital twin hash for a composite bundle
     *
     * @param primaryToken The primary token
     * @param secondaryTokens List of secondary tokens
     * @return SHA-256 hash representing the digital twin
     */
    public String computeDigitalTwinHash(
            PrimaryToken primaryToken,
            List<SecondaryToken> secondaryTokens) {

        long startTime = System.nanoTime();

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // Hash primary token data
            String primaryData = buildPrimaryTokenData(primaryToken);
            digest.update(primaryData.getBytes(StandardCharsets.UTF_8));

            // Hash secondary tokens in sorted order for determinism
            if (secondaryTokens != null && !secondaryTokens.isEmpty()) {
                List<SecondaryToken> sorted = new ArrayList<>(secondaryTokens);
                sorted.sort(Comparator.comparing(t -> t.tokenId));

                for (SecondaryToken secondary : sorted) {
                    String secondaryData = buildSecondaryTokenData(secondary);
                    digest.update(secondaryData.getBytes(StandardCharsets.UTF_8));
                }
            }

            // Add timestamp for uniqueness
            digest.update(Long.toString(System.currentTimeMillis()).getBytes(StandardCharsets.UTF_8));

            byte[] hashBytes = digest.digest();
            String hash = bytesToHex(hashBytes);

            // Update metrics
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            synchronized (this) {
                hashComputationCount++;
                totalHashTime += duration;
            }

            return hash;

        } catch (Exception e) {
            LOG.error("Failed to compute digital twin hash", e);
            throw new RuntimeException("Hash computation failed", e);
        }
    }

    /**
     * Compute the Merkle root for the composite bundle
     *
     * @param primaryToken The primary token
     * @param secondaryTokens List of secondary tokens
     * @return Merkle root hash
     */
    public String computeMerkleRoot(
            PrimaryToken primaryToken,
            List<SecondaryToken> secondaryTokens) {

        List<String> leaves = new ArrayList<>();

        // Add primary token hash as first leaf
        leaves.add(hashTokenData(buildPrimaryTokenData(primaryToken)));

        // Add secondary token hashes
        if (secondaryTokens != null) {
            for (SecondaryToken secondary : secondaryTokens) {
                leaves.add(hashTokenData(buildSecondaryTokenData(secondary)));
            }
        }

        // Build Merkle tree
        return buildMerkleRoot(leaves);
    }

    /**
     * Verify the binding integrity of a composite token
     *
     * @param compositeTokenId The composite token ID to verify
     * @return Uni containing the verification result
     */
    public Uni<BindingVerificationResult> verifyBinding(String compositeTokenId) {
        return Uni.createFrom().item(() -> {
            CompositeToken composite = CompositeToken.findByCompositeTokenId(compositeTokenId);
            if (composite == null) {
                return new BindingVerificationResult(false, "Composite token not found", null);
            }

            // Load tokens
            PrimaryToken primary = PrimaryToken.findByTokenId(composite.primaryTokenId);
            if (primary == null) {
                return new BindingVerificationResult(false, "Primary token not found", null);
            }

            List<SecondaryToken> secondaries = loadSecondaryTokens(composite.getSecondaryTokenIdList());

            // Recompute hashes
            String computedMerkleRoot = computeMerkleRoot(primary, secondaries);

            // Verify Merkle root matches
            boolean merkleValid = computedMerkleRoot.equals(composite.merkleRoot);

            if (!merkleValid) {
                return new BindingVerificationResult(false, "Merkle root mismatch", computedMerkleRoot);
            }

            return new BindingVerificationResult(true, "Binding verified successfully", computedMerkleRoot);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Unbind a composite token (controlled scenario, requires authorization)
     *
     * @param compositeTokenId The composite token ID
     * @param reason The reason for unbinding
     * @return Uni containing the unbinding result
     */
    @Transactional
    public Uni<UnbindingResult> unbindCompositeToken(String compositeTokenId, String reason) {
        return Uni.createFrom().item(() -> {
            CompositeToken composite = CompositeToken.findByCompositeTokenId(compositeTokenId);
            if (composite == null) {
                throw new IllegalArgumentException("Composite token not found: " + compositeTokenId);
            }

            // Can only unbind CREATED or VERIFIED tokens
            if (composite.status == CompositeToken.CompositeTokenStatus.BOUND ||
                composite.status == CompositeToken.CompositeTokenStatus.RETIRED) {
                throw new IllegalStateException("Cannot unbind token with status: " + composite.status);
            }

            // Store unbinding record
            String unbindingProof = generateUnbindingProof(composite, reason);

            // Retire the composite token
            composite.retire();
            composite.metadata = String.format("{\"unbindingReason\":\"%s\",\"unbindingProof\":\"%s\"}",
                    reason, unbindingProof);

            // Remove from cache
            bindingCache.remove(compositeTokenId);

            LOG.infof("Unbound composite token %s: %s", compositeTokenId, reason);

            return new UnbindingResult(compositeTokenId, composite.primaryTokenId,
                    composite.getSecondaryTokenIdList(), unbindingProof);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get binding record from cache
     */
    public BindingRecord getBindingRecord(String compositeTokenId) {
        return bindingCache.get(compositeTokenId);
    }

    /**
     * Get service metrics
     */
    public BindingMetrics getMetrics() {
        synchronized (this) {
            return new BindingMetrics(
                    bindingCount,
                    bindingCount > 0 ? totalBindingTime / bindingCount : 0,
                    hashComputationCount,
                    hashComputationCount > 0 ? totalHashTime / hashComputationCount : 0,
                    bindingCache.size()
            );
        }
    }

    // =============== PRIVATE HELPER METHODS ===============

    private void validateBindingInputs(PrimaryToken primary, List<SecondaryToken> secondaries, String owner) {
        if (primary == null) {
            throw new IllegalArgumentException("Primary token cannot be null");
        }
        if (primary.status != PrimaryToken.PrimaryTokenStatus.VERIFIED &&
            primary.status != PrimaryToken.PrimaryTokenStatus.TRANSFERRED) {
            throw new IllegalStateException("Primary token must be verified or transferred");
        }
        if (owner == null || owner.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner cannot be null or empty");
        }
    }

    private void validateSecondaryToken(SecondaryToken secondary, String expectedPrimaryId) {
        if (secondary == null) {
            throw new IllegalArgumentException("Secondary token cannot be null");
        }
        if (!secondary.parentTokenId.equals(expectedPrimaryId)) {
            throw new IllegalArgumentException(
                    "Secondary token parent mismatch. Expected: " + expectedPrimaryId +
                    ", Got: " + secondary.parentTokenId);
        }
    }

    private String generateCompositeTokenId(String primaryTokenId) {
        return "CT-" + UUID.randomUUID().toString();
    }

    private String buildPrimaryTokenData(PrimaryToken token) {
        return String.format("%s|%s|%s|%s|%s",
                token.tokenId,
                token.digitalTwinId,
                token.assetClass,
                token.faceValue.toPlainString(),
                token.owner);
    }

    private String buildSecondaryTokenData(SecondaryToken token) {
        return String.format("%s|%s|%s|%s|%s",
                token.tokenId,
                token.parentTokenId,
                token.tokenType,
                token.faceValue.toPlainString(),
                token.owner);
    }

    private String hashTokenData(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("Hash computation failed", e);
        }
    }

    private String buildMerkleRoot(List<String> leaves) {
        if (leaves.isEmpty()) {
            return "";
        }
        if (leaves.size() == 1) {
            return leaves.get(0);
        }

        List<String> nextLevel = new ArrayList<>();
        for (int i = 0; i < leaves.size(); i += 2) {
            String left = leaves.get(i);
            String right = (i + 1 < leaves.size()) ? leaves.get(i + 1) : left;
            nextLevel.add(hashTokenData(left + right));
        }

        return buildMerkleRoot(nextLevel);
    }

    private List<SecondaryToken> loadSecondaryTokens(List<String> tokenIds) {
        List<SecondaryToken> tokens = new ArrayList<>();
        for (String tokenId : tokenIds) {
            SecondaryToken token = SecondaryToken.findByTokenId(tokenId);
            if (token != null) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private String generateUnbindingProof(CompositeToken composite, String reason) {
        String proofData = String.format("%s|%s|%s|%d",
                composite.compositeTokenId,
                composite.merkleRoot,
                reason,
                System.currentTimeMillis());
        return hashTokenData(proofData);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // =============== INNER CLASSES ===============

    /**
     * Binding record for caching
     */
    public static class BindingRecord {
        public final String compositeTokenId;
        public final String primaryTokenId;
        public final int secondaryCount;
        public final Instant boundAt;

        public BindingRecord(String compositeTokenId, String primaryTokenId,
                           int secondaryCount, Instant boundAt) {
            this.compositeTokenId = compositeTokenId;
            this.primaryTokenId = primaryTokenId;
            this.secondaryCount = secondaryCount;
            this.boundAt = boundAt;
        }
    }

    /**
     * Binding verification result
     */
    public static class BindingVerificationResult {
        public final boolean valid;
        public final String message;
        public final String computedMerkleRoot;

        public BindingVerificationResult(boolean valid, String message, String computedMerkleRoot) {
            this.valid = valid;
            this.message = message;
            this.computedMerkleRoot = computedMerkleRoot;
        }
    }

    /**
     * Unbinding result
     */
    public static class UnbindingResult {
        public final String compositeTokenId;
        public final String primaryTokenId;
        public final List<String> secondaryTokenIds;
        public final String unbindingProof;

        public UnbindingResult(String compositeTokenId, String primaryTokenId,
                             List<String> secondaryTokenIds, String unbindingProof) {
            this.compositeTokenId = compositeTokenId;
            this.primaryTokenId = primaryTokenId;
            this.secondaryTokenIds = secondaryTokenIds;
            this.unbindingProof = unbindingProof;
        }
    }

    /**
     * Service metrics
     */
    public static class BindingMetrics {
        public final long bindingCount;
        public final long avgBindingTimeMs;
        public final long hashCount;
        public final long avgHashTimeMs;
        public final int cacheSize;

        public BindingMetrics(long bindingCount, long avgBindingTimeMs,
                            long hashCount, long avgHashTimeMs, int cacheSize) {
            this.bindingCount = bindingCount;
            this.avgBindingTimeMs = avgBindingTimeMs;
            this.hashCount = hashCount;
            this.avgHashTimeMs = avgHashTimeMs;
            this.cacheSize = cacheSize;
        }

        @Override
        public String toString() {
            return String.format("BindingMetrics{bindings=%d (avg %dms), hashes=%d (avg %dms), cache=%d}",
                    bindingCount, avgBindingTimeMs, hashCount, avgHashTimeMs, cacheSize);
        }
    }
}
