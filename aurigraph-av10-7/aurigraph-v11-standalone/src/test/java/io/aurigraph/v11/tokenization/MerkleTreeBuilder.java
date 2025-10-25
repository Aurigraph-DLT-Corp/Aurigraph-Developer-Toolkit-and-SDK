package io.aurigraph.v11.tokenization;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;

/**
 * Test utility for building Merkle trees in tokenization tests.
 *
 * Provides fluent API for:
 * - Adding leaves (assets, transactions, data)
 * - Building complete Merkle tree
 * - Generating Merkle root
 * - Creating Merkle proofs for verification
 *
 * Uses SHA3-256 hashing for cryptographic integrity.
 *
 * Usage:
 * ```java
 * MerkleTree tree = merkleTreeBuilder
 *     .addAssets(assetList)
 *     .build();
 *
 * String root = tree.getRoot();
 * MerkleProof proof = tree.generateProof("asset-123");
 * ```
 *
 * @author Quality Assurance Agent (QAA)
 * @version 1.0
 * @since Phase 1 - Foundation Testing
 */
public class MerkleTreeBuilder {

    private final List<String> leaves = new ArrayList<>();
    private final MessageDigest digest;

    public MerkleTreeBuilder() {
        try {
            // Use SHA3-256 for quantum-resistant hashing
            this.digest = MessageDigest.getInstance("SHA3-256");
        } catch (NoSuchAlgorithmException e) {
            // Fallback to SHA-256 if SHA3 not available
            try {
                this.digest = MessageDigest.getInstance("SHA-256");
            } catch (NoSuchAlgorithmException ex) {
                throw new RuntimeException("No suitable hash algorithm available", ex);
            }
        }
    }

    /**
     * Adds a single leaf to the Merkle tree
     */
    public MerkleTreeBuilder addLeaf(String data) {
        leaves.add(data);
        return this;
    }

    /**
     * Adds multiple leaves to the Merkle tree
     */
    public MerkleTreeBuilder addLeaves(List<String> data) {
        leaves.addAll(data);
        return this;
    }

    /**
     * Adds assets as leaves using their IDs
     */
    public MerkleTreeBuilder addAssets(List<TestDataBuilder.Asset> assets) {
        assets.forEach(asset -> addLeaf(asset.id()));
        return this;
    }

    /**
     * Adds token holders as leaves using their holder IDs
     */
    public MerkleTreeBuilder addHolders(List<TestDataBuilder.TokenHolder> holders) {
        holders.forEach(holder -> addLeaf(holder.holderId()));
        return this;
    }

    /**
     * Clears all leaves
     */
    public MerkleTreeBuilder clear() {
        leaves.clear();
        return this;
    }

    /**
     * Builds a complete Merkle tree from the current leaves
     */
    public MerkleTree build() {
        if (leaves.isEmpty()) {
            throw new IllegalStateException("Cannot build Merkle tree with no leaves");
        }

        // Hash all leaves
        List<String> currentLevel = leaves.stream()
            .map(this::hash)
            .toList();

        // Build tree bottom-up
        List<List<String>> levels = new ArrayList<>();
        levels.add(new ArrayList<>(currentLevel));

        while (currentLevel.size() > 1) {
            currentLevel = buildNextLevel(currentLevel);
            levels.add(new ArrayList<>(currentLevel));
        }

        String root = currentLevel.get(0);

        return new MerkleTree(leaves, levels, root);
    }

    /**
     * Builds the Merkle root directly without constructing the full tree
     */
    public String buildRoot() {
        return build().getRoot();
    }

    /**
     * Builds the next level of the Merkle tree by pairing and hashing nodes
     */
    private List<String> buildNextLevel(List<String> currentLevel) {
        List<String> nextLevel = new ArrayList<>();

        for (int i = 0; i < currentLevel.size(); i += 2) {
            String left = currentLevel.get(i);
            String right = (i + 1 < currentLevel.size()) ? currentLevel.get(i + 1) : left;

            // Concatenate and hash
            String combined = left + right;
            nextLevel.add(hash(combined));
        }

        return nextLevel;
    }

    /**
     * Hashes data using SHA3-256 (or SHA-256 fallback)
     */
    private String hash(String data) {
        byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hashBytes);
    }

    /**
     * Converts byte array to hexadecimal string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder();
        for (byte b : bytes) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }

    /**
     * Represents a constructed Merkle tree with verification capabilities
     */
    public static class MerkleTree {
        private final List<String> leaves;
        private final List<List<String>> levels;
        private final String root;

        public MerkleTree(List<String> leaves, List<List<String>> levels, String root) {
            this.leaves = List.copyOf(leaves);
            this.levels = levels.stream()
                .map(List::copyOf)
                .toList();
            this.root = root;
        }

        public String getRoot() {
            return root;
        }

        public List<String> getLeaves() {
            return leaves;
        }

        public int getDepth() {
            return levels.size();
        }

        public int getLeafCount() {
            return leaves.size();
        }

        /**
         * Generates a Merkle proof for a specific leaf
         */
        public MerkleProof generateProof(String leaf) {
            int leafIndex = leaves.indexOf(leaf);
            if (leafIndex == -1) {
                throw new IllegalArgumentException("Leaf not found in tree: " + leaf);
            }

            List<String> proofPath = new ArrayList<>();
            int currentIndex = leafIndex;

            // Traverse from leaf to root, collecting sibling hashes
            for (int level = 0; level < levels.size() - 1; level++) {
                List<String> currentLevel = levels.get(level);

                // Find sibling
                int siblingIndex = (currentIndex % 2 == 0) ? currentIndex + 1 : currentIndex - 1;

                if (siblingIndex < currentLevel.size()) {
                    proofPath.add(currentLevel.get(siblingIndex));
                } else {
                    // No sibling (odd number of nodes), duplicate current
                    proofPath.add(currentLevel.get(currentIndex));
                }

                currentIndex = currentIndex / 2;
            }

            return new MerkleProof(leaf, proofPath, root);
        }

        /**
         * Verifies a Merkle proof against the root
         */
        public boolean verifyProof(MerkleProof proof) {
            if (!proof.getRoot().equals(root)) {
                return false;
            }

            String currentHash = hashData(proof.getLeaf());

            for (String sibling : proof.getPath()) {
                String combined = currentHash + sibling;
                currentHash = hashData(combined);
            }

            return currentHash.equals(root);
        }

        private String hashData(String data) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA3-256");
                byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
                return bytesToHex(hashBytes);
            } catch (NoSuchAlgorithmException e) {
                throw new RuntimeException("Hash algorithm not available", e);
            }
        }

        private String bytesToHex(byte[] bytes) {
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        }
    }

    /**
     * Represents a Merkle proof for a specific leaf
     */
    public static class MerkleProof {
        private final String leaf;
        private final List<String> path;
        private final String root;

        public MerkleProof(String leaf, List<String> path, String root) {
            this.leaf = leaf;
            this.path = List.copyOf(path);
            this.root = root;
        }

        public String getLeaf() {
            return leaf;
        }

        public List<String> getPath() {
            return path;
        }

        public String getRoot() {
            return root;
        }

        public int getProofLength() {
            return path.size();
        }
    }
}
