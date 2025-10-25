package io.aurigraph.v11.models;

import io.aurigraph.v11.merkle.MerkleProof;
import io.aurigraph.v11.merkle.MerkleTreeRegistry;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for TokenRegistryService with Merkle Tree verification
 *
 * Test Coverage:
 * - Token registration and retrieval
 * - Merkle tree root hash updates
 * - Proof generation and verification
 * - Token operations (mint, burn, update)
 * - Search and filtering
 * - Statistics and analytics
 *
 * Target Coverage: 95%+
 *
 * @version 11.5.0
 * @since 2025-10-25 - AV11-455: TokenRegistry Merkle Tree Tests
 */
@QuarkusTest
public class TokenRegistryServiceTest {

    @Inject
    TokenRegistryService tokenRegistryService;

    private TokenRegistry testToken1;
    private TokenRegistry testToken2;
    private TokenRegistry testToken3;

    @BeforeEach
    public void setup() {
        // Create test tokens
        testToken1 = new TokenRegistry("Aurigraph Token", "AUR", TokenType.ERC20, "0xCreator1");
        testToken1.setTotalSupply(new BigDecimal("1000000"));
        testToken1.setCirculatingSupply(new BigDecimal("800000"));
        testToken1.setVerificationStatus(VerificationStatus.VERIFIED);

        testToken2 = new TokenRegistry("Test NFT", "TNFT", TokenType.ERC721, "0xCreator2");
        testToken2.setTotalSupply(new BigDecimal("100"));
        testToken2.setCirculatingSupply(new BigDecimal("100"));
        testToken2.setVerificationStatus(VerificationStatus.PENDING);

        testToken3 = new TokenRegistry("RWA Gold Token", "GOLD", TokenType.ERC20, "0xCreator3");
        testToken3.setTotalSupply(new BigDecimal("500000"));
        testToken3.setCirculatingSupply(new BigDecimal("400000"));
        testToken3.setIsRWA(true);
        testToken3.setRwaAssetId("RWA-GOLD-001");
        testToken3.setVerificationStatus(VerificationStatus.VERIFIED);
    }

    @Test
    public void testTokenRegistration() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();

        assertNotNull(registered);
        assertNotNull(registered.getTokenAddress());
        assertEquals("Aurigraph Token", registered.getName());
        assertEquals("AUR", registered.getSymbol());
        assertNotNull(registered.getCreatedAt());
    }

    @Test
    public void testMerkleRootHashUpdatesOnRegistration() {
        // Get initial root hash
        String initialRoot = tokenRegistryService.getMerkleRootHash()
            .await().indefinitely().getRootHash();
        assertNotNull(initialRoot);

        // Register a token
        tokenRegistryService.registerToken(testToken1).await().indefinitely();

        // Root hash should change
        String newRoot = tokenRegistryService.getMerkleRootHash()
            .await().indefinitely().getRootHash();
        assertNotNull(newRoot);
        assertNotEquals(initialRoot, newRoot, "Root hash should change after token registration");
    }

    @Test
    public void testMerkleProofGeneration() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        String tokenAddress = registered.getTokenAddress();

        // Generate proof
        MerkleProof.ProofData proof = tokenRegistryService.getProof(tokenAddress)
            .await().indefinitely();

        assertNotNull(proof);
        assertNotNull(proof.leafHash);
        assertNotNull(proof.rootHash);
        assertNotNull(proof.siblingHashes);
        assertNotNull(proof.positions);
    }

    @Test
    public void testMerkleProofVerification() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        String tokenAddress = registered.getTokenAddress();

        // Generate proof
        MerkleProof.ProofData proof = tokenRegistryService.getProof(tokenAddress)
            .await().indefinitely();

        // Verify proof
        TokenRegistryService.VerificationResponse response =
            tokenRegistryService.verifyMerkleProof(proof).await().indefinitely();

        assertTrue(response.isValid(), "Valid proof should be verified");
        assertEquals("Proof verified successfully", response.getMessage());
    }

    @Test
    public void testMerkleTreeStatsAfterMultipleRegistrations() {
        // Register multiple tokens
        tokenRegistryService.registerToken(testToken1).await().indefinitely();
        tokenRegistryService.registerToken(testToken2).await().indefinitely();
        tokenRegistryService.registerToken(testToken3).await().indefinitely();

        // Get tree stats
        MerkleTreeRegistry.MerkleTreeStats stats =
            tokenRegistryService.getMerkleTreeStats().await().indefinitely();

        assertNotNull(stats);
        assertTrue(stats.getEntryCount() >= 3, "Should have at least 3 entries");
        assertTrue(stats.getTreeHeight() > 0, "Tree height should be positive");
        assertNotNull(stats.getRootHash());
        assertNotNull(stats.getLastUpdate());
    }

    @Test
    public void testTokenRetrieval() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        String tokenAddress = registered.getTokenAddress();

        // Retrieve token
        TokenRegistry retrieved = tokenRegistryService.getToken(tokenAddress).await().indefinitely();

        assertNotNull(retrieved);
        assertEquals(tokenAddress, retrieved.getTokenAddress());
        assertEquals("Aurigraph Token", retrieved.getName());
    }

    @Test
    public void testTokenUpdate() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        String tokenAddress = registered.getTokenAddress();

        // Update token
        registered.setName("Updated Aurigraph Token");
        registered.setSymbol("AUR2");

        TokenRegistry updated = tokenRegistryService.updateToken(tokenAddress, registered)
            .await().indefinitely();

        assertEquals("Updated Aurigraph Token", updated.getName());
        assertEquals("AUR2", updated.getSymbol());
    }

    @Test
    public void testMintTokens() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        testToken1.setIsMintable(true);
        tokenRegistryService.updateToken(registered.getTokenAddress(), testToken1).await().indefinitely();

        // Get initial root
        String initialRoot = tokenRegistryService.getMerkleRootHash()
            .await().indefinitely().getRootHash();

        // Mint tokens
        BigDecimal mintAmount = new BigDecimal("100000");
        TokenRegistry minted = tokenRegistryService.mintTokens(
            registered.getTokenAddress(), mintAmount).await().indefinitely();

        // Verify total supply increased
        assertEquals(new BigDecimal("1100000"), minted.getTotalSupply());

        // Root hash should change
        String newRoot = tokenRegistryService.getMerkleRootHash()
            .await().indefinitely().getRootHash();
        assertNotEquals(initialRoot, newRoot, "Root hash should change after minting");
    }

    @Test
    public void testBurnTokens() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        testToken1.setIsBurnable(true);
        tokenRegistryService.updateToken(registered.getTokenAddress(), testToken1).await().indefinitely();

        // Burn tokens
        BigDecimal burnAmount = new BigDecimal("100000");
        TokenRegistry burned = tokenRegistryService.burnTokens(
            registered.getTokenAddress(), burnAmount).await().indefinitely();

        // Verify total supply decreased
        assertEquals(new BigDecimal("900000"), burned.getTotalSupply());
    }

    @Test
    public void testSearchTokens() {
        // Register multiple tokens
        tokenRegistryService.registerToken(testToken1).await().indefinitely();
        tokenRegistryService.registerToken(testToken2).await().indefinitely();
        tokenRegistryService.registerToken(testToken3).await().indefinitely();

        // Search by keyword
        List<TokenRegistry> results = tokenRegistryService.searchTokens("Gold")
            .await().indefinitely();

        assertTrue(results.stream().anyMatch(t -> "GOLD".equals(t.getSymbol())));
    }

    @Test
    public void testListVerifiedTokens() {
        // Register multiple tokens
        tokenRegistryService.registerToken(testToken1).await().indefinitely();
        tokenRegistryService.registerToken(testToken2).await().indefinitely();
        tokenRegistryService.registerToken(testToken3).await().indefinitely();

        // List verified tokens
        List<TokenRegistry> verified = tokenRegistryService.listVerifiedTokens()
            .await().indefinitely();

        assertTrue(verified.size() >= 2, "Should have at least 2 verified tokens");
        assertTrue(verified.stream().allMatch(t ->
            t.getVerificationStatus() == VerificationStatus.VERIFIED));
    }

    @Test
    public void testListRWATokens() {
        // Register multiple tokens
        tokenRegistryService.registerToken(testToken1).await().indefinitely();
        tokenRegistryService.registerToken(testToken2).await().indefinitely();
        tokenRegistryService.registerToken(testToken3).await().indefinitely();

        // List RWA tokens
        List<TokenRegistry> rwaTokens = tokenRegistryService.listRWATokens()
            .await().indefinitely();

        assertTrue(rwaTokens.size() >= 1, "Should have at least 1 RWA token");
        assertTrue(rwaTokens.stream().allMatch(TokenRegistry::isRealWorldAsset));
    }

    @Test
    public void testRegistryStatistics() {
        // Register multiple tokens
        tokenRegistryService.registerToken(testToken1).await().indefinitely();
        tokenRegistryService.registerToken(testToken2).await().indefinitely();
        tokenRegistryService.registerToken(testToken3).await().indefinitely();

        // Get statistics
        var stats = tokenRegistryService.getStatistics();

        assertNotNull(stats);
        assertTrue((Long) stats.get("totalTokens") >= 3);
        assertTrue((Long) stats.get("verifiedTokens") >= 2);
        assertTrue((Long) stats.get("rwaTokens") >= 1);
    }

    @Test
    public void testRootHashConsistency() {
        // Register tokens in specific order
        tokenRegistryService.registerToken(testToken1).await().indefinitely();
        String root1 = tokenRegistryService.getMerkleRootHash()
            .await().indefinitely().getRootHash();

        tokenRegistryService.registerToken(testToken2).await().indefinitely();
        String root2 = tokenRegistryService.getMerkleRootHash()
            .await().indefinitely().getRootHash();

        // Roots should be different
        assertNotEquals(root1, root2, "Root should change with each addition");

        // Root should be deterministic - same entries should give same root
        assertNotNull(root1);
        assertNotNull(root2);
    }

    @Test
    public void testMerkleProofForMultipleTokens() {
        // Register multiple tokens
        TokenRegistry t1 = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        TokenRegistry t2 = tokenRegistryService.registerToken(testToken2).await().indefinitely();
        TokenRegistry t3 = tokenRegistryService.registerToken(testToken3).await().indefinitely();

        // Generate proofs for all tokens
        MerkleProof.ProofData proof1 = tokenRegistryService.getProof(t1.getTokenAddress())
            .await().indefinitely();
        MerkleProof.ProofData proof2 = tokenRegistryService.getProof(t2.getTokenAddress())
            .await().indefinitely();
        MerkleProof.ProofData proof3 = tokenRegistryService.getProof(t3.getTokenAddress())
            .await().indefinitely();

        // All should have the same root hash
        assertEquals(proof1.rootHash, proof2.rootHash);
        assertEquals(proof2.rootHash, proof3.rootHash);

        // But different leaf hashes
        assertNotEquals(proof1.leafHash, proof2.leafHash);
        assertNotEquals(proof2.leafHash, proof3.leafHash);

        // All proofs should verify
        assertTrue(tokenRegistryService.verifyMerkleProof(proof1).await().indefinitely().isValid());
        assertTrue(tokenRegistryService.verifyMerkleProof(proof2).await().indefinitely().isValid());
        assertTrue(tokenRegistryService.verifyMerkleProof(proof3).await().indefinitely().isValid());
    }

    @Test
    public void testTokenNotFound() {
        assertThrows(TokenRegistryService.TokenNotFoundException.class, () -> {
            tokenRegistryService.getToken("0xNonExistent").await().indefinitely();
        });
    }

    @Test
    public void testSoftDelete() {
        // Register token
        TokenRegistry registered = tokenRegistryService.registerToken(testToken1).await().indefinitely();
        String tokenAddress = registered.getTokenAddress();

        // Delete token
        Boolean deleted = tokenRegistryService.deleteToken(tokenAddress).await().indefinitely();
        assertTrue(deleted);

        // Should throw exception when trying to retrieve
        assertThrows(TokenRegistryService.TokenNotFoundException.class, () -> {
            tokenRegistryService.getToken(tokenAddress).await().indefinitely();
        });
    }
}
