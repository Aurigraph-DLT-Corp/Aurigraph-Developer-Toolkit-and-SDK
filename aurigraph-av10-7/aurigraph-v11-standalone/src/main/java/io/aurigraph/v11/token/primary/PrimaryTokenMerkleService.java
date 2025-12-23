package io.aurigraph.v11.token.primary;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Primary Token Merkle Service - Sprint 1 Implementation
 *
 * Provides Merkle tree construction, proof generation, and verification
 * specialized for primary tokens. Extends CompositeMerkleService patterns
 * with primary-token-specific hashing.
 *
 * Merkle Hash Structure:
 * Hash = SHA-256(tokenId + faceValue + owner + assetClass + status)
 *
 * Performance Requirements:
 * - Merkle tree construction: < 100ms for 1,000 tokens
 * - Merkle proof generation: < 50ms
 * - Proof verification: < 10ms
 * - Registry integrity validation: < 500ms
 *
 * @author Composite Token System - Sprint 1
 * @version 1.0
 * @since Sprint 1 (Week 1)
 */
@ApplicationScoped
public class PrimaryTokenMerkleService {

    private static final Logger LOG = Logger.getLogger(PrimaryTokenMerkleService.class);

    // Cache for Merkle trees and proofs
    private final ConcurrentHashMap<String, MerkleTree> treeCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, MerkleProof> proofCache = new ConcurrentHashMap<>();

    // Performance metrics
    private long treeConstructionCount = 0;
    private long totalTreeConstructionTime = 0;
    private long proofGenerationCount = 0;
    private long totalProofGenerationTime = 0;
    private long verificationCount = 0;
    private long totalVerificationTime = 0;
    private long hashCount = 0;
    private long totalHashTime = 0;

    /**
     * Hash a primary token using all relevant fields
     * Hash = SHA-256(tokenId|faceValue|owner|assetClass|status)
     *
     * @param token The primary token to hash
     * @return 64-character lowercase hex hash
     */
    public String hashPrimaryToken(PrimaryToken token) {
        long startTime = System.nanoTime();

        if (token == null) {
            throw new IllegalArgumentException("Token cannot be null");
        }

        // Combine all relevant fields for hashing
        String tokenData = String.format("%s|%s|%s|%s|%s",
                token.tokenId != null ? token.tokenId : "",
                token.faceValue != null ? token.faceValue.toPlainString() : "0",
                token.owner != null ? token.owner : "",
                token.assetClass != null ? token.assetClass : "",
                token.status != null ? token.status.toString() : "UNKNOWN"
        );

        String hash = sha256Hash(tokenData);

        // Update metrics
        long duration = (System.nanoTime() - startTime) / 1_000;
        synchronized (this) {
            hashCount++;
            totalHashTime += duration;
        }

        return hash;
    }

    /**
     * Build a Merkle tree from a list of primary tokens
     *
     * @param tokens List of primary tokens
     * @return MerkleTree with root hash and structure
     */
    public MerkleTree buildPrimaryTokenTree(List<PrimaryToken> tokens) {
        long startTime = System.nanoTime();

        if (tokens == null || tokens.isEmpty()) {
            return new MerkleTree("", new ArrayList<>(), 0);
        }

        // Hash all tokens
        List<String> leaves = tokens.stream()
                .map(this::hashPrimaryToken)
                .collect(Collectors.toList());

        // Build tree levels
        List<List<String>> treeLevels = new ArrayList<>();
        treeLevels.add(new ArrayList<>(leaves));

        List<String> currentLevel = new ArrayList<>(leaves);
        while (currentLevel.size() > 1) {
            List<String> nextLevel = new ArrayList<>();

            for (int i = 0; i < currentLevel.size(); i += 2) {
                String left = currentLevel.get(i);
                String right = (i + 1 < currentLevel.size()) ? currentLevel.get(i + 1) : left;
                nextLevel.add(sha256Hash(left + right));
            }

            treeLevels.add(nextLevel);
            currentLevel = nextLevel;
        }

        String root = currentLevel.get(0);

        // Update metrics
        long duration = (System.nanoTime() - startTime) / 1_000_000;
        synchronized (this) {
            treeConstructionCount++;
            totalTreeConstructionTime += duration;
        }

        LOG.debugf("Built primary token Merkle tree with %d tokens, depth %d in %dms",
                leaves.size(), treeLevels.size(), duration);

        return new MerkleTree(root, treeLevels, leaves.size());
    }

    /**
     * Build a Merkle tree from a list of token IDs (with database lookup)
     *
     * @param tokenIds List of token IDs
     * @return Uni containing the MerkleTree
     */
    public Uni<MerkleTree> buildTreeFromTokenIds(List<String> tokenIds) {
        return Uni.createFrom().item(() -> {
            if (tokenIds == null || tokenIds.isEmpty()) {
                return new MerkleTree("", new ArrayList<>(), 0);
            }

            // In a real implementation, would lookup tokens from database
            // For now, hash the token IDs directly
            List<String> leaves = tokenIds.stream()
                    .map(this::sha256Hash)
                    .collect(Collectors.toList());

            List<List<String>> treeLevels = new ArrayList<>();
            treeLevels.add(new ArrayList<>(leaves));

            List<String> currentLevel = new ArrayList<>(leaves);
            while (currentLevel.size() > 1) {
                List<String> nextLevel = new ArrayList<>();

                for (int i = 0; i < currentLevel.size(); i += 2) {
                    String left = currentLevel.get(i);
                    String right = (i + 1 < currentLevel.size()) ? currentLevel.get(i + 1) : left;
                    nextLevel.add(sha256Hash(left + right));
                }

                treeLevels.add(nextLevel);
                currentLevel = nextLevel;
            }

            String root = currentLevel.get(0);
            return new MerkleTree(root, treeLevels, leaves.size());
        });
    }

    /**
     * Generate a Merkle proof for a specific token
     *
     * @param tree The Merkle tree
     * @param tokenIndex Index of the token in the tree
     * @return MerkleProof containing sibling hashes
     */
    public MerkleProof generateTokenProof(MerkleTree tree, int tokenIndex) {
        long startTime = System.nanoTime();

        if (tree == null || tree.levels.isEmpty()) {
            throw new IllegalArgumentException("Invalid Merkle tree");
        }

        if (tokenIndex < 0 || tokenIndex >= tree.leafCount) {
            throw new IllegalArgumentException("Invalid token index: " + tokenIndex);
        }

        List<String> siblings = new ArrayList<>();
        List<Boolean> directions = new ArrayList<>();

        int index = tokenIndex;
        for (int level = 0; level < tree.levels.size() - 1; level++) {
            List<String> currentLevel = tree.levels.get(level);

            int siblingIndex = (index % 2 == 0) ? index + 1 : index - 1;

            if (siblingIndex < currentLevel.size()) {
                siblings.add(currentLevel.get(siblingIndex));
                directions.add(index % 2 == 0);
            } else {
                siblings.add(currentLevel.get(index));
                directions.add(true);
            }

            index = index / 2;
        }

        MerkleProof proof = new MerkleProof(
                tree.levels.get(0).get(tokenIndex),
                tree.root,
                siblings,
                directions,
                tokenIndex
        );

        // Cache the proof
        String proofKey = tree.root + ":" + tokenIndex;
        proofCache.put(proofKey, proof);

        // Update metrics
        long duration = (System.nanoTime() - startTime) / 1_000_000;
        synchronized (this) {
            proofGenerationCount++;
            totalProofGenerationTime += duration;
        }

        LOG.debugf("Generated primary token Merkle proof for token %d with %d siblings in %dms",
                tokenIndex, siblings.size(), duration);

        return proof;
    }

    /**
     * Generate a Merkle proof for a specific token by ID
     *
     * @param tree The Merkle tree
     * @param tokenHash The hash of the token to prove
     * @return MerkleProof if found, null otherwise
     */
    public MerkleProof generateProofByTokenHash(MerkleTree tree, String tokenHash) {
        if (tree == null || tree.levels.isEmpty()) {
            return null;
        }

        List<String> leaves = tree.levels.get(0);
        int tokenIndex = -1;

        for (int i = 0; i < leaves.size(); i++) {
            if (leaves.get(i).equals(tokenHash)) {
                tokenIndex = i;
                break;
            }
        }

        if (tokenIndex < 0) {
            return null;
        }

        return generateTokenProof(tree, tokenIndex);
    }

    /**
     * Verify a Merkle proof
     *
     * @param proof The Merkle proof to verify
     * @return true if the proof is valid
     */
    public boolean verifyProof(MerkleProof proof) {
        long startTime = System.nanoTime();

        if (proof == null) {
            return false;
        }

        String currentHash = proof.leafHash;

        for (int i = 0; i < proof.siblings.size(); i++) {
            String sibling = proof.siblings.get(i);
            boolean siblingOnRight = proof.directions.get(i);

            if (siblingOnRight) {
                currentHash = sha256Hash(currentHash + sibling);
            } else {
                currentHash = sha256Hash(sibling + currentHash);
            }
        }

        boolean valid = currentHash.equals(proof.root);

        // Update metrics
        long duration = (System.nanoTime() - startTime) / 1_000_000;
        synchronized (this) {
            verificationCount++;
            totalVerificationTime += duration;
        }

        LOG.debugf("Verified primary token Merkle proof: %s in %dms",
                valid ? "VALID" : "INVALID", duration);

        return valid;
    }

    /**
     * Verify that a token is part of a tree with given root
     *
     * @param token The token to verify
     * @param proof The Merkle proof
     * @return true if the token is part of the tree
     */
    public boolean verifyTokenInclusion(PrimaryToken token, MerkleProof proof) {
        String tokenHash = hashPrimaryToken(token);
        if (!tokenHash.equals(proof.leafHash)) {
            LOG.debug("Token hash mismatch");
            return false;
        }
        return verifyProof(proof);
    }

    /**
     * Add a new token to an existing tree (incremental update)
     *
     * @param existingTree The existing Merkle tree
     * @param newToken The new token to add
     * @return Updated MerkleTree with new token included
     */
    public MerkleTree addTokenToTree(MerkleTree existingTree, PrimaryToken newToken) {
        if (existingTree == null) {
            return buildPrimaryTokenTree(List.of(newToken));
        }

        List<String> currentLeaves = new ArrayList<>(existingTree.levels.get(0));
        currentLeaves.add(hashPrimaryToken(newToken));

        return buildMerkleTreeFromLeaves(currentLeaves);
    }

    /**
     * Remove a token from an existing tree (incremental update)
     *
     * @param existingTree The existing Merkle tree
     * @param tokenIndex The index of the token to remove
     * @return Updated MerkleTree without the token
     */
    public MerkleTree removeTokenFromTree(MerkleTree existingTree, int tokenIndex) {
        if (existingTree == null || existingTree.levels.isEmpty()) {
            return new MerkleTree("", new ArrayList<>(), 0);
        }

        List<String> currentLeaves = new ArrayList<>(existingTree.levels.get(0));
        if (tokenIndex < 0 || tokenIndex >= currentLeaves.size()) {
            throw new IllegalArgumentException("Invalid token index");
        }

        currentLeaves.remove(tokenIndex);

        if (currentLeaves.isEmpty()) {
            return new MerkleTree("", new ArrayList<>(), 0);
        }

        return buildMerkleTreeFromLeaves(currentLeaves);
    }

    /**
     * Validate registry integrity by checking computed root against expected root
     *
     * @param tokens List of tokens to validate
     * @param expectedRoot Expected Merkle root
     * @return IntegrityResult with validation details
     */
    public Uni<IntegrityResult> validateRegistryIntegrity(List<PrimaryToken> tokens, String expectedRoot) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            MerkleTree computedTree = buildPrimaryTokenTree(tokens);
            boolean valid = computedTree.root.equals(expectedRoot);

            long duration = (System.nanoTime() - startTime) / 1_000_000;

            List<String> issues = new ArrayList<>();
            if (!valid) {
                issues.add("Root mismatch: expected " + expectedRoot + " but got " + computedTree.root);
            }

            LOG.infof("Registry integrity check: %s in %dms", valid ? "VALID" : "INVALID", duration);

            return new IntegrityResult(valid, computedTree.root, expectedRoot, issues);
        });
    }

    /**
     * Cache a Merkle tree for later retrieval
     *
     * @param registryId Unique identifier for the registry
     * @param tree The Merkle tree to cache
     */
    public void cacheTokenTree(String registryId, MerkleTree tree) {
        treeCache.put(registryId, tree);
        LOG.debugf("Cached primary token Merkle tree: %s", registryId);
    }

    /**
     * Retrieve a cached Merkle tree
     *
     * @param registryId The registry identifier
     * @return The cached tree, or null if not found
     */
    public MerkleTree getCachedTokenTree(String registryId) {
        return treeCache.get(registryId);
    }

    /**
     * Get a cached proof
     *
     * @param root The Merkle root
     * @param tokenIndex The token index
     * @return The cached proof, or null if not found
     */
    public MerkleProof getCachedProof(String root, int tokenIndex) {
        return proofCache.get(root + ":" + tokenIndex);
    }

    /**
     * Clear all caches
     */
    public void clearTokenTreeCache() {
        int treesBefore = treeCache.size();
        int proofsBefore = proofCache.size();
        treeCache.clear();
        proofCache.clear();
        LOG.infof("Cleared primary token Merkle caches: %d trees, %d proofs",
                treesBefore, proofsBefore);
    }

    /**
     * Get service metrics
     */
    public MerkleMetrics getMetrics() {
        synchronized (this) {
            return new MerkleMetrics(
                    treeConstructionCount,
                    treeConstructionCount > 0 ? totalTreeConstructionTime / treeConstructionCount : 0,
                    proofGenerationCount,
                    proofGenerationCount > 0 ? totalProofGenerationTime / proofGenerationCount : 0,
                    verificationCount,
                    verificationCount > 0 ? totalVerificationTime / verificationCount : 0,
                    hashCount,
                    hashCount > 0 ? totalHashTime / hashCount : 0,
                    treeCache.size(),
                    proofCache.size()
            );
        }
    }

    // =============== HELPER METHODS ===============

    private MerkleTree buildMerkleTreeFromLeaves(List<String> leaves) {
        if (leaves == null || leaves.isEmpty()) {
            return new MerkleTree("", new ArrayList<>(), 0);
        }

        List<List<String>> treeLevels = new ArrayList<>();
        treeLevels.add(new ArrayList<>(leaves));

        List<String> currentLevel = new ArrayList<>(leaves);
        while (currentLevel.size() > 1) {
            List<String> nextLevel = new ArrayList<>();

            for (int i = 0; i < currentLevel.size(); i += 2) {
                String left = currentLevel.get(i);
                String right = (i + 1 < currentLevel.size()) ? currentLevel.get(i + 1) : left;
                nextLevel.add(sha256Hash(left + right));
            }

            treeLevels.add(nextLevel);
            currentLevel = nextLevel;
        }

        String root = currentLevel.get(0);
        return new MerkleTree(root, treeLevels, leaves.size());
    }

    /**
     * Compute SHA-256 hash of input string
     */
    public String sha256Hash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hash failed", e);
        }
    }

    /**
     * Compute SHA-256 hash of byte array
     */
    public String sha256Hash(byte[] input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input);
            return bytesToHex(hashBytes);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 hash failed", e);
        }
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
     * Merkle tree structure for primary tokens
     */
    public static class MerkleTree {
        public final String root;
        public final List<List<String>> levels;
        public final int leafCount;
        public final Instant createdAt;

        public MerkleTree(String root, List<List<String>> levels, int leafCount) {
            this.root = root;
            this.levels = levels;
            this.leafCount = leafCount;
            this.createdAt = Instant.now();
        }

        public int getDepth() {
            return levels.size();
        }

        @Override
        public String toString() {
            if (root.isEmpty()) {
                return "MerkleTree{empty}";
            }
            return String.format("MerkleTree{root=%s..., tokens=%d, depth=%d}",
                    root.substring(0, Math.min(16, root.length())), leafCount, getDepth());
        }
    }

    /**
     * Merkle proof for a specific token
     */
    public static class MerkleProof {
        public final String leafHash;
        public final String root;
        public final List<String> siblings;
        public final List<Boolean> directions;
        public final int leafIndex;
        public final Instant generatedAt;

        public MerkleProof(String leafHash, String root, List<String> siblings,
                          List<Boolean> directions, int leafIndex) {
            this.leafHash = leafHash;
            this.root = root;
            this.siblings = new ArrayList<>(siblings);
            this.directions = new ArrayList<>(directions);
            this.leafIndex = leafIndex;
            this.generatedAt = Instant.now();
        }

        public int getProofLength() {
            return siblings.size();
        }

        @Override
        public String toString() {
            return String.format("MerkleProof{token=%d, depth=%d, root=%s...}",
                    leafIndex, siblings.size(), root.substring(0, Math.min(16, root.length())));
        }
    }

    /**
     * Integrity validation result
     */
    public static class IntegrityResult {
        public final boolean valid;
        public final String computedRoot;
        public final String expectedRoot;
        public final List<String> issues;
        public final Instant generatedAt;

        public IntegrityResult(boolean valid, String computedRoot, String expectedRoot, List<String> issues) {
            this.valid = valid;
            this.computedRoot = computedRoot;
            this.expectedRoot = expectedRoot;
            this.issues = new ArrayList<>(issues);
            this.generatedAt = Instant.now();
        }

        @Override
        public String toString() {
            return String.format("IntegrityResult{valid=%s, issues=%d}", valid, issues.size());
        }
    }

    /**
     * Service metrics for monitoring
     */
    public static class MerkleMetrics {
        public final long treeCount;
        public final long avgTreeTimeMs;
        public final long proofCount;
        public final long avgProofTimeMs;
        public final long verifyCount;
        public final long avgVerifyTimeMs;
        public final long hashCount;
        public final long avgHashTimeUs;
        public final int treeCacheSize;
        public final int proofCacheSize;

        public MerkleMetrics(long treeCount, long avgTreeTimeMs, long proofCount,
                            long avgProofTimeMs, long verifyCount, long avgVerifyTimeMs,
                            long hashCount, long avgHashTimeUs, int treeCacheSize, int proofCacheSize) {
            this.treeCount = treeCount;
            this.avgTreeTimeMs = avgTreeTimeMs;
            this.proofCount = proofCount;
            this.avgProofTimeMs = avgProofTimeMs;
            this.verifyCount = verifyCount;
            this.avgVerifyTimeMs = avgVerifyTimeMs;
            this.hashCount = hashCount;
            this.avgHashTimeUs = avgHashTimeUs;
            this.treeCacheSize = treeCacheSize;
            this.proofCacheSize = proofCacheSize;
        }

        @Override
        public String toString() {
            return String.format("MerkleMetrics{trees=%d (%dms), proofs=%d (%dms), hashes=%d (%dµs)}",
                    treeCount, avgTreeTimeMs, proofCount, avgProofTimeMs, hashCount, avgHashTimeUs);
        }
    }
}
