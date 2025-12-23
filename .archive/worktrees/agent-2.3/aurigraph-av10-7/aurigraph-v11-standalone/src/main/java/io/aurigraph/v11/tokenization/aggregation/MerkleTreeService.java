package io.aurigraph.v11.tokenization.aggregation;

import io.aurigraph.v11.tokenization.aggregation.models.Asset;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Merkle Tree Service for Asset Composition Verification
 * Generates SHA3-256 Merkle roots for cryptographic proof of asset composition
 *
 * Performance Target: <500ms per 100 assets
 *
 * @author Backend Development Agent (BDA)
 * @since Phase 1 Foundation - Week 1-2
 */
@ApplicationScoped
public class MerkleTreeService {

    private static final String HASH_ALGORITHM = "SHA3-256";

    /**
     * Generate Merkle root from list of assets
     *
     * @param assets List of assets in pool
     * @return Hex-encoded Merkle root hash
     */
    public String generateMerkleRoot(List<Asset> assets) {
        long startTime = System.nanoTime();

        if (assets == null || assets.isEmpty()) {
            throw new IllegalArgumentException("Asset list cannot be null or empty");
        }

        try {
            // Generate leaf hashes for each asset
            List<String> leafHashes = assets.stream()
                .map(this::hashAsset)
                .collect(Collectors.toList());

            // Build Merkle tree
            String merkleRoot = buildMerkleTree(leafHashes);

            long endTime = System.nanoTime();
            double timeMs = (endTime - startTime) / 1_000_000.0;

            Log.infof("Generated Merkle root for %d assets in %.2f ms", assets.size(), timeMs);

            return merkleRoot;

        } catch (NoSuchAlgorithmException e) {
            throw new MerkleTreeException("Failed to generate Merkle root: " + e.getMessage(), e);
        }
    }

    /**
     * Generate Merkle proof for specific asset in tree
     *
     * @param assets All assets in pool
     * @param assetId Target asset ID
     * @return Merkle proof path
     */
    public MerkleProof generateMerkleProof(List<Asset> assets, String assetId) {
        try {
            // Find asset index
            int assetIndex = -1;
            for (int i = 0; i < assets.size(); i++) {
                if (assets.get(i).getAssetId().equals(assetId)) {
                    assetIndex = i;
                    break;
                }
            }

            if (assetIndex == -1) {
                throw new IllegalArgumentException("Asset not found in pool: " + assetId);
            }

            // Generate leaf hashes
            List<String> leafHashes = assets.stream()
                .map(this::hashAsset)
                .collect(Collectors.toList());

            // Build proof path
            List<MerkleProofNode> proofPath = buildProofPath(leafHashes, assetIndex);

            // Get Merkle root
            String merkleRoot = buildMerkleTree(leafHashes);

            return MerkleProof.builder()
                .assetId(assetId)
                .assetIndex(assetIndex)
                .merkleRoot(merkleRoot)
                .proofPath(proofPath)
                .build();

        } catch (NoSuchAlgorithmException e) {
            throw new MerkleTreeException("Failed to generate Merkle proof: " + e.getMessage(), e);
        }
    }

    /**
     * Verify Merkle proof for asset
     *
     * @param asset Asset to verify
     * @param proof Merkle proof
     * @return true if proof is valid
     */
    public boolean verifyMerkleProof(Asset asset, MerkleProof proof) {
        try {
            long startTime = System.nanoTime();

            String assetHash = hashAsset(asset);
            String computedRoot = computeRootFromProof(assetHash, proof.getProofPath(), proof.getAssetIndex());

            boolean isValid = computedRoot.equals(proof.getMerkleRoot());

            long endTime = System.nanoTime();
            double timeMs = (endTime - startTime) / 1_000_000.0;

            if (timeMs > 50.0) {
                Log.warnf("Merkle proof verification took %.2f ms (target: <50ms)", timeMs);
            }

            return isValid;

        } catch (NoSuchAlgorithmException e) {
            throw new MerkleTreeException("Failed to verify Merkle proof: " + e.getMessage(), e);
        }
    }

    // Private helper methods

    /**
     * Hash individual asset to leaf node
     */
    private String hashAsset(Asset asset) {
        try {
            // Create deterministic asset representation
            String assetData = String.format("%s|%s|%s|%s",
                asset.getAssetId(),
                asset.getAssetType(),
                asset.getCurrentValuation().toPlainString(),
                asset.getWeight() != null ? asset.getWeight().toPlainString() : "0");

            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hashBytes = digest.digest(assetData.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);

        } catch (NoSuchAlgorithmException e) {
            throw new MerkleTreeException("Hash algorithm not available: " + HASH_ALGORITHM, e);
        }
    }

    /**
     * Build Merkle tree from leaf hashes
     */
    private String buildMerkleTree(List<String> leafHashes) throws NoSuchAlgorithmException {
        if (leafHashes.isEmpty()) {
            throw new IllegalArgumentException("Cannot build Merkle tree from empty list");
        }

        List<String> currentLevel = new ArrayList<>(leafHashes);

        // Build tree bottom-up
        while (currentLevel.size() > 1) {
            List<String> nextLevel = new ArrayList<>();

            for (int i = 0; i < currentLevel.size(); i += 2) {
                String left = currentLevel.get(i);
                String right = (i + 1 < currentLevel.size()) ? currentLevel.get(i + 1) : left;

                String combined = hashPair(left, right);
                nextLevel.add(combined);
            }

            currentLevel = nextLevel;
        }

        return currentLevel.get(0);
    }

    /**
     * Build proof path for specific leaf index
     */
    private List<MerkleProofNode> buildProofPath(List<String> leafHashes, int targetIndex)
            throws NoSuchAlgorithmException {

        List<MerkleProofNode> proofPath = new ArrayList<>();
        List<String> currentLevel = new ArrayList<>(leafHashes);
        int currentIndex = targetIndex;

        while (currentLevel.size() > 1) {
            List<String> nextLevel = new ArrayList<>();

            for (int i = 0; i < currentLevel.size(); i += 2) {
                String left = currentLevel.get(i);
                String right = (i + 1 < currentLevel.size()) ? currentLevel.get(i + 1) : left;

                // Add sibling to proof path
                if (i == currentIndex || i + 1 == currentIndex) {
                    boolean isLeft = (currentIndex % 2 == 0);
                    String siblingHash = isLeft ? right : left;
                    proofPath.add(new MerkleProofNode(siblingHash, isLeft));
                }

                String combined = hashPair(left, right);
                nextLevel.add(combined);
            }

            currentIndex = currentIndex / 2;
            currentLevel = nextLevel;
        }

        return proofPath;
    }

    /**
     * Compute root hash from proof path
     */
    private String computeRootFromProof(String leafHash, List<MerkleProofNode> proofPath, int leafIndex)
            throws NoSuchAlgorithmException {

        String currentHash = leafHash;
        int currentIndex = leafIndex;

        for (MerkleProofNode node : proofPath) {
            boolean isLeft = (currentIndex % 2 == 0);

            if (isLeft) {
                currentHash = hashPair(currentHash, node.getHash());
            } else {
                currentHash = hashPair(node.getHash(), currentHash);
            }

            currentIndex = currentIndex / 2;
        }

        return currentHash;
    }

    /**
     * Hash pair of nodes
     */
    private String hashPair(String left, String right) throws NoSuchAlgorithmException {
        String combined = left + right;
        MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
        byte[] hashBytes = digest.digest(combined.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hashBytes);
    }

    /**
     * Convert byte array to hex string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    // Supporting classes

    /**
     * Merkle proof for asset ownership
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class MerkleProof {
        private String assetId;
        private int assetIndex;
        private String merkleRoot;
        private List<MerkleProofNode> proofPath;
    }

    /**
     * Individual node in Merkle proof path
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class MerkleProofNode {
        private String hash;
        private boolean isLeftSibling;
    }

    /**
     * Merkle tree exception
     */
    public static class MerkleTreeException extends RuntimeException {
        public MerkleTreeException(String message) {
            super(message);
        }

        public MerkleTreeException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
