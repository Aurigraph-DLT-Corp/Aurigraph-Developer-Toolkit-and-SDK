package io.aurigraph.v11.models;

import io.aurigraph.v11.merkle.MerkleProof;
import io.aurigraph.v11.merkle.MerkleTreeRegistry;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Token Registry Service with Merkle Tree Support
 *
 * Backend service for token registry with cryptographic verification.
 * Provides searchability, discoverability, analytics, and Merkle tree-based integrity.
 *
 * Features:
 * - Multi-standard token support (ERC20/721/1155)
 * - Real-world asset (RWA) tokenization tracking
 * - Merkle tree cryptographic verification
 * - Proof generation and verification
 * - Root hash tracking for tamper detection
 *
 * @version 11.5.0
 * @since 2025-10-25 - AV11-455: TokenRegistry Merkle Tree
 */
@ApplicationScoped
public class TokenRegistryService extends MerkleTreeRegistry<TokenRegistry> {

    private static final Logger LOGGER = LoggerFactory.getLogger(TokenRegistryService.class);

    @Override
    protected String serializeValue(TokenRegistry token) {
        return String.format("%s|%s|%s|%s|%s|%s|%s|%s",
            token.getTokenAddress(),
            token.getName(),
            token.getSymbol(),
            token.getTokenType(),
            token.getTotalSupply(),
            token.getCirculatingSupply(),
            token.getVerificationStatus(),
            token.getCreatorAddress()
        );
    }

    /**
     * Register a new token
     */
    public Uni<TokenRegistry> registerToken(TokenRegistry token) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Registering token: {} ({})", token.getName(), token.getSymbol());

            // Initialize timestamps and token address
            token.ensureCreatedAt();

            return token;
        }).flatMap(t -> add(t.getTokenAddress(), t).map(success -> t));
    }

    /**
     * Get token by address
     */
    public Uni<TokenRegistry> getToken(String tokenAddress) {
        return get(tokenAddress).onItem().ifNull().failWith(() ->
            new TokenNotFoundException("Token not found: " + tokenAddress));
    }

    /**
     * Update token
     */
    public Uni<TokenRegistry> updateToken(String tokenAddress, TokenRegistry updatedToken) {
        return getToken(tokenAddress).map(existing -> {
            // Update timestamp
            updatedToken.updateTimestamp();
            registry.put(tokenAddress, updatedToken);
            LOGGER.info("Token updated: {}", tokenAddress);
            return updatedToken;
        }).flatMap(t -> add(tokenAddress, t).map(success -> t));
    }

    /**
     * Delete token (soft delete)
     */
    public Uni<Boolean> deleteToken(String tokenAddress) {
        return getToken(tokenAddress).map(token -> {
            token.softDelete();
            registry.put(tokenAddress, token);
            LOGGER.info("Token soft-deleted: {}", tokenAddress);
            return true;
        }).flatMap(result -> remove(tokenAddress));
    }

    /**
     * Generate Merkle proof for a token
     */
    public Uni<MerkleProof.ProofData> getProof(String tokenAddress) {
        return generateProof(tokenAddress).map(MerkleProof::toProofData);
    }

    /**
     * Verify a Merkle proof
     */
    public Uni<VerificationResponse> verifyMerkleProof(MerkleProof.ProofData proofData) {
        return verifyProof(proofData.toMerkleProof()).map(valid ->
            new VerificationResponse(valid, valid ? "Proof verified successfully" : "Invalid proof")
        );
    }

    /**
     * Get current Merkle root hash
     */
    public Uni<RootHashResponse> getMerkleRootHash() {
        return getRootHash().flatMap(rootHash ->
            getTreeStats().map(stats -> new RootHashResponse(
                rootHash,
                Instant.now(),
                stats.getEntryCount(),
                stats.getTreeHeight()
            ))
        );
    }

    /**
     * Get Merkle tree statistics
     */
    public Uni<MerkleTreeStats> getMerkleTreeStats() {
        return getTreeStats();
    }

    /**
     * Search tokens by keyword
     */
    public Uni<List<TokenRegistry>> searchTokens(String keyword) {
        return getAll().map(tokens ->
            tokens.stream()
                .filter(t -> matchesKeyword(t, keyword))
                .collect(Collectors.toList())
        );
    }

    /**
     * List tokens by type
     */
    public Uni<List<TokenRegistry>> listByType(TokenType tokenType) {
        return getAll().map(tokens ->
            tokens.stream()
                .filter(t -> t.getTokenType() == tokenType)
                .collect(Collectors.toList())
        );
    }

    /**
     * List verified tokens
     */
    public Uni<List<TokenRegistry>> listVerifiedTokens() {
        return getAll().map(tokens ->
            tokens.stream()
                .filter(t -> t.getVerificationStatus() == VerificationStatus.VERIFIED)
                .collect(Collectors.toList())
        );
    }

    /**
     * List RWA tokens
     */
    public Uni<List<TokenRegistry>> listRWATokens() {
        return getAll().map(tokens ->
            tokens.stream()
                .filter(TokenRegistry::isRealWorldAsset)
                .collect(Collectors.toList())
        );
    }

    /**
     * List tradeable tokens
     */
    public Uni<List<TokenRegistry>> listTradeableTokens() {
        return getAll().map(tokens ->
            tokens.stream()
                .filter(TokenRegistry::isTradeable)
                .collect(Collectors.toList())
        );
    }

    /**
     * List top tokens by market cap
     */
    public Uni<List<TokenRegistry>> listTopByMarketCap(int limit) {
        return getAll().map(tokens ->
            tokens.stream()
                .filter(t -> t.getMarketCap() != null)
                .sorted((a, b) -> b.getMarketCap().compareTo(a.getMarketCap()))
                .limit(limit)
                .collect(Collectors.toList())
        );
    }

    /**
     * List top tokens by trading volume
     */
    public Uni<List<TokenRegistry>> listTopByVolume(int limit) {
        return getAll().map(tokens ->
            tokens.stream()
                .sorted((a, b) -> b.getVolume24h().compareTo(a.getVolume24h()))
                .limit(limit)
                .collect(Collectors.toList())
        );
    }

    /**
     * Update token verification status
     */
    public Uni<TokenRegistry> updateVerificationStatus(
            String tokenAddress,
            VerificationStatus status
    ) {
        return getToken(tokenAddress).map(token -> {
            token.setVerificationStatus(status);
            if (status == VerificationStatus.VERIFIED) {
                token.verify();
            }
            registry.put(tokenAddress, token);
            LOGGER.info("Token verification updated: {} - {}", tokenAddress, status);
            return token;
        });
    }

    /**
     * Update token market data
     */
    public Uni<TokenRegistry> updateMarketData(String tokenAddress, BigDecimal price, BigDecimal volume) {
        return getToken(tokenAddress).map(token -> {
            token.updateMarketData(price, volume);
            registry.put(tokenAddress, token);
            return token;
        });
    }

    /**
     * Mint tokens
     */
    public Uni<TokenRegistry> mintTokens(String tokenAddress, BigDecimal amount) {
        return getToken(tokenAddress).map(token -> {
            token.mint(amount);
            registry.put(tokenAddress, token);
            LOGGER.info("Minted {} tokens for {}", amount, tokenAddress);
            return token;
        });
    }

    /**
     * Burn tokens
     */
    public Uni<TokenRegistry> burnTokens(String tokenAddress, BigDecimal amount) {
        return getToken(tokenAddress).map(token -> {
            token.burn(amount);
            registry.put(tokenAddress, token);
            LOGGER.info("Burned {} tokens for {}", amount, tokenAddress);
            return token;
        });
    }

    /**
     * Get registry statistics
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalTokens", registry.size());
        stats.put("activeTokens", registry.values().stream()
                .filter(t -> !t.getIsDeleted()).count());
        stats.put("verifiedTokens", registry.values().stream()
                .filter(t -> t.getVerificationStatus() == VerificationStatus.VERIFIED).count());

        // Total market cap
        BigDecimal totalMarketCap = registry.values().stream()
                .filter(t -> t.getMarketCap() != null)
                .map(TokenRegistry::getMarketCap)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalMarketCap", totalMarketCap);

        // Total trading volume
        BigDecimal totalVolume = registry.values().stream()
                .map(TokenRegistry::getVolume24h)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalVolume24h", totalVolume);

        // Count by token type
        Map<String, Long> byType = registry.values().stream()
                .collect(Collectors.groupingBy(
                        t -> t.getTokenType().name(),
                        Collectors.counting()
                ));
        stats.put("tokensByType", byType);

        // RWA token count
        long rwaCount = registry.values().stream()
                .filter(TokenRegistry::isRealWorldAsset)
                .count();
        stats.put("rwaTokens", rwaCount);

        return stats;
    }

    // Helper methods
    private boolean matchesKeyword(TokenRegistry token, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return true;
        }

        String lowerKeyword = keyword.toLowerCase();

        return (token.getName() != null && token.getName().toLowerCase().contains(lowerKeyword)) ||
                (token.getSymbol() != null && token.getSymbol().toLowerCase().contains(lowerKeyword)) ||
                (token.getTokenAddress() != null && token.getTokenAddress().toLowerCase().contains(lowerKeyword)) ||
                (token.getCategories() != null && token.getCategories().toLowerCase().contains(lowerKeyword));
    }

    // Custom Exception
    public static class TokenNotFoundException extends RuntimeException {
        public TokenNotFoundException(String message) {
            super(message);
        }
    }

    // Response Classes
    public static class VerificationResponse {
        private final boolean valid;
        private final String message;

        public VerificationResponse(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }

    public static class RootHashResponse {
        private final String rootHash;
        private final Instant timestamp;
        private final int entryCount;
        private final int treeHeight;

        public RootHashResponse(String rootHash, Instant timestamp, int entryCount, int treeHeight) {
            this.rootHash = rootHash;
            this.timestamp = timestamp;
            this.entryCount = entryCount;
            this.treeHeight = treeHeight;
        }

        public String getRootHash() {
            return rootHash;
        }

        public Instant getTimestamp() {
            return timestamp;
        }

        public int getEntryCount() {
            return entryCount;
        }

        public int getTreeHeight() {
            return treeHeight;
        }
    }
}
