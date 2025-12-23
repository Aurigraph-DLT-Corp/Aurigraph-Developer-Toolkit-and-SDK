package io.aurigraph.v11.token.composite;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Composite Merkle Service - Sprint 3-4 Implementation
 *
 * Provides Merkle tree construction, proof generation, and verification
 * for composite token bundles. Implements a 4-level tree structure per
 * the architecture specification.
 *
 * Tree Structure (4-Level):
 * - Level 1: Primary Token hash
 * - Level 2: Secondary Tokens Merkle Root
 * - Level 3: Contract Binding hash (if bound)
 * - Level 4: Composite Root Hash
 *
 * Performance Requirements:
 * - Merkle proof generation: < 50ms
 * - Proof verification: < 10ms
 * - Tree construction: < 100ms for 1000 leaves
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 * @since Sprint 3 (Week 6)
 */
@ApplicationScoped
public class CompositeMerkleService {

    private static final Logger LOG = Logger.getLogger(CompositeMerkleService.class);

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

    /**
     * Build a Merkle tree from a list of data items
     *
     * @param dataItems List of data items to include in the tree
     * @return MerkleTree object containing root and node structure
     */
    public MerkleTree buildMerkleTree(List<String> dataItems) {
        long startTime = System.nanoTime();

        if (dataItems == null || dataItems.isEmpty()) {
            return new MerkleTree("", new ArrayList<>(), 0);
        }

        // Hash all leaf nodes
        List<String> leaves = new ArrayList<>();
        for (String data : dataItems) {
            leaves.add(sha256Hash(data));
        }

        // Build tree levels
        List<List<String>> treeLevels = new ArrayList<>();
        treeLevels.add(new ArrayList<>(leaves));

        List<String> currentLevel = leaves;
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

        LOG.debugf("Built Merkle tree with %d leaves, depth %d in %dms",
                leaves.size(), treeLevels.size(), duration);

        return new MerkleTree(root, treeLevels, leaves.size());
    }

    /**
     * Build a 4-level composite token Merkle tree
     *
     * @param primaryTokenHash Hash of the primary token
     * @param secondaryTokenHashes List of secondary token hashes
     * @param bindingHash Contract binding hash (optional)
     * @return MerkleTree with 4-level structure
     */
    public MerkleTree buildCompositeTree(
            String primaryTokenHash,
            List<String> secondaryTokenHashes,
            String bindingHash) {

        long startTime = System.nanoTime();

        // Level 1: Primary Token
        String level1 = primaryTokenHash;

        // Level 2: Secondary Tokens Merkle Root
        String level2;
        if (secondaryTokenHashes == null || secondaryTokenHashes.isEmpty()) {
            level2 = sha256Hash("EMPTY_SECONDARY");
        } else {
            MerkleTree secondaryTree = buildMerkleTree(secondaryTokenHashes);
            level2 = secondaryTree.root;
        }

        // Level 3: Contract Binding
        String level3 = (bindingHash != null && !bindingHash.isEmpty())
                ? bindingHash
                : sha256Hash("UNBOUND");

        // Level 4: Composite Root
        String intermediate1 = sha256Hash(level1 + level2);
        String intermediate2 = sha256Hash(level3 + sha256Hash("AURIGRAPH_COMPOSITE_V1"));
        String compositeRoot = sha256Hash(intermediate1 + intermediate2);

        // Build tree levels structure
        List<List<String>> treeLevels = new ArrayList<>();
        treeLevels.add(List.of(level1, level2, level3, sha256Hash("AURIGRAPH_COMPOSITE_V1")));
        treeLevels.add(List.of(intermediate1, intermediate2));
        treeLevels.add(List.of(compositeRoot));

        long duration = (System.nanoTime() - startTime) / 1_000_000;

        LOG.debugf("Built composite 4-level Merkle tree in %dms", duration);

        return new MerkleTree(compositeRoot, treeLevels, 4);
    }

    /**
     * Generate a Merkle proof for a specific leaf
     *
     * @param tree The Merkle tree
     * @param leafIndex Index of the leaf to prove
     * @return MerkleProof containing sibling hashes
     */
    public MerkleProof generateProof(MerkleTree tree, int leafIndex) {
        long startTime = System.nanoTime();

        if (tree == null || tree.levels.isEmpty()) {
            throw new IllegalArgumentException("Invalid Merkle tree");
        }

        List<String> siblings = new ArrayList<>();
        List<Boolean> directions = new ArrayList<>(); // true = right, false = left

        int index = leafIndex;
        for (int level = 0; level < tree.levels.size() - 1; level++) {
            List<String> currentLevel = tree.levels.get(level);

            int siblingIndex = (index % 2 == 0) ? index + 1 : index - 1;

            if (siblingIndex < currentLevel.size()) {
                siblings.add(currentLevel.get(siblingIndex));
                directions.add(index % 2 == 0); // true if sibling is on right
            } else {
                // Duplicate case - sibling is same as current
                siblings.add(currentLevel.get(index));
                directions.add(true);
            }

            index = index / 2;
        }

        MerkleProof proof = new MerkleProof(
                tree.levels.get(0).get(leafIndex),
                tree.root,
                siblings,
                directions,
                leafIndex
        );

        // Cache the proof
        String proofKey = tree.root + ":" + leafIndex;
        proofCache.put(proofKey, proof);

        // Update metrics
        long duration = (System.nanoTime() - startTime) / 1_000_000;
        synchronized (this) {
            proofGenerationCount++;
            totalProofGenerationTime += duration;
        }

        LOG.debugf("Generated Merkle proof for leaf %d with %d siblings in %dms",
                leafIndex, siblings.size(), duration);

        return proof;
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

        LOG.debugf("Verified Merkle proof: %s in %dms", valid ? "VALID" : "INVALID", duration);

        return valid;
    }

    /**
     * Verify that a leaf is part of a tree with given root
     *
     * @param leafData The leaf data (will be hashed)
     * @param proof The Merkle proof
     * @return true if the leaf is part of the tree
     */
    public boolean verifyLeafInclusion(String leafData, MerkleProof proof) {
        String leafHash = sha256Hash(leafData);
        if (!leafHash.equals(proof.leafHash)) {
            LOG.debug("Leaf hash mismatch");
            return false;
        }
        return verifyProof(proof);
    }

    /**
     * Generate consistency proof between two tree versions
     *
     * @param oldTree The older/smaller tree
     * @param newTree The newer/larger tree
     * @return ConsistencyProof if trees are consistent
     */
    public ConsistencyProof generateConsistencyProof(MerkleTree oldTree, MerkleTree newTree) {
        if (oldTree.leafCount > newTree.leafCount) {
            throw new IllegalArgumentException("Old tree cannot be larger than new tree");
        }

        // For consistency, all leaves in old tree must be at same positions in new tree
        List<String> oldLeaves = oldTree.levels.get(0);
        List<String> newLeaves = newTree.levels.get(0);

        boolean consistent = true;
        for (int i = 0; i < oldLeaves.size(); i++) {
            if (!oldLeaves.get(i).equals(newLeaves.get(i))) {
                consistent = false;
                break;
            }
        }

        return new ConsistencyProof(
                oldTree.root,
                newTree.root,
                oldTree.leafCount,
                newTree.leafCount,
                consistent,
                Instant.now()
        );
    }

    /**
     * Cache a Merkle tree for later retrieval
     *
     * @param treeId Unique identifier for the tree
     * @param tree The Merkle tree to cache
     */
    public void cacheTree(String treeId, MerkleTree tree) {
        treeCache.put(treeId, tree);
        LOG.debugf("Cached Merkle tree: %s", treeId);
    }

    /**
     * Retrieve a cached Merkle tree
     *
     * @param treeId The tree identifier
     * @return The cached tree, or null if not found
     */
    public MerkleTree getCachedTree(String treeId) {
        return treeCache.get(treeId);
    }

    /**
     * Get a cached proof
     *
     * @param root The Merkle root
     * @param leafIndex The leaf index
     * @return The cached proof, or null if not found
     */
    public MerkleProof getCachedProof(String root, int leafIndex) {
        return proofCache.get(root + ":" + leafIndex);
    }

    /**
     * Clear all caches
     */
    public void clearCaches() {
        int treesBefore = treeCache.size();
        int proofsBefore = proofCache.size();
        treeCache.clear();
        proofCache.clear();
        LOG.infof("Cleared Merkle caches: %d trees, %d proofs", treesBefore, proofsBefore);
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
                    treeCache.size(),
                    proofCache.size()
            );
        }
    }

    // =============== HASH UTILITIES ===============

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
     * Merkle tree structure
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
            return String.format("MerkleTree{root=%s..., leaves=%d, depth=%d}",
                    root.substring(0, Math.min(16, root.length())), leafCount, getDepth());
        }
    }

    /**
     * Merkle proof for a specific leaf
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
            return String.format("MerkleProof{leaf=%d, depth=%d, root=%s...}",
                    leafIndex, siblings.size(), root.substring(0, Math.min(16, root.length())));
        }
    }

    /**
     * Consistency proof between two tree versions
     */
    public static class ConsistencyProof {
        public final String oldRoot;
        public final String newRoot;
        public final int oldSize;
        public final int newSize;
        public final boolean consistent;
        public final Instant generatedAt;

        public ConsistencyProof(String oldRoot, String newRoot, int oldSize,
                               int newSize, boolean consistent, Instant generatedAt) {
            this.oldRoot = oldRoot;
            this.newRoot = newRoot;
            this.oldSize = oldSize;
            this.newSize = newSize;
            this.consistent = consistent;
            this.generatedAt = generatedAt;
        }

        @Override
        public String toString() {
            return String.format("ConsistencyProof{%d->%d, consistent=%s}",
                    oldSize, newSize, consistent);
        }
    }

    /**
     * Service metrics
     */
    public static class MerkleMetrics {
        public final long treeCount;
        public final long avgTreeTimeMs;
        public final long proofCount;
        public final long avgProofTimeMs;
        public final long verifyCount;
        public final long avgVerifyTimeMs;
        public final int treeCacheSize;
        public final int proofCacheSize;

        public MerkleMetrics(long treeCount, long avgTreeTimeMs, long proofCount,
                            long avgProofTimeMs, long verifyCount, long avgVerifyTimeMs,
                            int treeCacheSize, int proofCacheSize) {
            this.treeCount = treeCount;
            this.avgTreeTimeMs = avgTreeTimeMs;
            this.proofCount = proofCount;
            this.avgProofTimeMs = avgProofTimeMs;
            this.verifyCount = verifyCount;
            this.avgVerifyTimeMs = avgVerifyTimeMs;
            this.treeCacheSize = treeCacheSize;
            this.proofCacheSize = proofCacheSize;
        }

        @Override
        public String toString() {
            return String.format("MerkleMetrics{trees=%d (%dms), proofs=%d (%dms), verifies=%d (%dms)}",
                    treeCount, avgTreeTimeMs, proofCount, avgProofTimeMs, verifyCount, avgVerifyTimeMs);
        }
    }
}
