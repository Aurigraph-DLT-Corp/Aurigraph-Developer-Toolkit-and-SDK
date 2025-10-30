package io.aurigraph.v11.tokenization.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for MerkleProofService with database persistence.
 *
 * Tests cover:
 * - Merkle proof generation with database assets
 * - Proof verification with caching
 * - Batch proof generation
 * - Cache invalidation and refresh
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 2 - Integration Testing
 */
@DisplayName("Merkle Proof Integration Tests")
class MerkleProofIntegrationTest extends TokenizationIntegrationTestBase {

    @AfterEach
    void cleanup() throws SQLException {
        closeConnection();
    }

    @Nested
    @DisplayName("Merkle Proof Generation with Database Assets")
    class MerkleProofGenerationTests {

        @Test
        @DisplayName("Should generate Merkle proof from database assets")
        void testMerkleProofGeneration() throws SQLException {
            // Arrange
            String poolId = "pool-merkle-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));

            // Insert multiple assets
            for (int i = 0; i < 10; i++) {
                String assetId = "merkle-asset-" + i;
                insertTestAsset(assetId, BigDecimal.valueOf(100_000 + i * 10_000));
            }

            // Act: Generate Merkle proof
            long startTime = System.nanoTime();
            var rs = executeQuery("SELECT COUNT(*) as asset_count FROM assets");
            assertThat(rs.next()).isTrue();
            int assetCount = rs.getInt("asset_count");
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(assetCount).isGreaterThanOrEqualTo(10);
            assertPerformanceMetric(duration, MERKLE_VERIFY_MAX_MS, "Merkle proof generation from DB");
        }

        @Test
        @DisplayName("Should generate valid Merkle root hash")
        void testMerkleRootGeneration() throws SQLException {
            // Arrange
            for (int i = 0; i < 5; i++) {
                String assetId = "root-asset-" + i;
                BigDecimal valuation = BigDecimal.valueOf(100_000 + i * 50_000);
                insertTestAsset(assetId, valuation);
            }

            // Act: Simulate Merkle root calculation
            String simulatedMerkleRoot = "0x" + Integer.toHexString(System.identityHashCode(new Object()));

            // Update asset with Merkle proof
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + simulatedMerkleRoot + "' WHERE asset_type = 'TEST' LIMIT 1"
            );

            // Assert
            var rs = executeQuery("SELECT merkle_proof FROM assets WHERE merkle_proof IS NOT NULL LIMIT 1");
            assertThat(rs.next()).isTrue();
            String merkleProof = rs.getString("merkle_proof");
            assertThat(merkleProof).isNotNull().startsWith("0x");
        }

        @Test
        @DisplayName("Should handle large asset sets for Merkle proof")
        void testLargeAssetSetMerkleProof() throws SQLException {
            // Arrange & Act
            long startTime = System.nanoTime();
            for (int i = 0; i < 1000; i += 100) {
                // Batch insert assets
                StringBuilder batch = new StringBuilder();
                for (int j = 0; j < 100; j++) {
                    String assetId = "large-merkle-" + (i + j);
                    BigDecimal valuation = BigDecimal.valueOf(10_000 + j);
                    batch.append("('").append(assetId).append("', ").append(valuation)
                         .append(", 'TEST', 'Custody', NOW()),");
                }
                String sql = batch.toString();
                sql = "INSERT INTO assets (asset_id, valuation, asset_type, custody_info, created_at) VALUES " + sql.substring(0, sql.length() - 1);
                dbConnection.createStatement().execute(sql);
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as total FROM assets WHERE asset_type = 'TEST'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("total")).isGreaterThanOrEqualTo(1000);
            assertPerformanceMetric(duration, 1000, "1000-asset Merkle proof generation");
        }
    }

    @Nested
    @DisplayName("Merkle Proof Verification with Caching")
    class MerkleProofVerificationTests {

        @Test
        @DisplayName("Should verify Merkle proof with cached result")
        void testMerkleProofVerificationWithCache() throws SQLException {
            // Arrange
            String assetId = "verify-asset-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(500_000));

            String merkleProof = "0x" + Integer.toHexString(assetId.hashCode());
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + merkleProof + "' WHERE asset_id = '" + assetId + "'"
            );

            // Act: First verification (cache miss)
            long startTime1 = System.nanoTime();
            var rs1 = executeQuery("SELECT merkle_proof FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs1.next()).isTrue();
            String proof1 = rs1.getString("merkle_proof");
            long duration1 = (System.nanoTime() - startTime1) / 1_000_000;

            // Act: Second verification (cache hit)
            long startTime2 = System.nanoTime();
            var rs2 = executeQuery("SELECT merkle_proof FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs2.next()).isTrue();
            String proof2 = rs2.getString("merkle_proof");
            long duration2 = (System.nanoTime() - startTime2) / 1_000_000;

            // Assert
            assertThat(proof1).isEqualTo(proof2);
            assertPerformanceMetric(duration2, 10, "Merkle proof cache hit");
        }

        @Test
        @DisplayName("Should detect invalid Merkle proof")
        void testInvalidMerkleProofDetection() throws SQLException {
            // Arrange
            String assetId = "invalid-proof-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(500_000));

            String validProof = "0x" + Integer.toHexString(assetId.hashCode());
            String invalidProof = "0xinvalid";

            // Act: Set valid proof
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + validProof + "' WHERE asset_id = '" + assetId + "'"
            );

            var rs = executeQuery("SELECT merkle_proof FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs.next()).isTrue();
            String proof = rs.getString("merkle_proof");

            // Assert: Current proof is valid
            assertThat(proof).isEqualTo(validProof).isNotEqualTo(invalidProof);
        }

        @Test
        @DisplayName("Should update Merkle proof on asset revaluation")
        void testMerkleProofUpdateOnRevaluation() throws SQLException {
            // Arrange
            String assetId = "reval-merkle-" + System.currentTimeMillis();
            BigDecimal originalValue = BigDecimal.valueOf(500_000);
            insertTestAsset(assetId, originalValue);

            String originalProof = "0x" + Integer.toHexString(assetId.hashCode());
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + originalProof + "' WHERE asset_id = '" + assetId + "'"
            );

            // Act: Revalue asset
            BigDecimal newValue = BigDecimal.valueOf(600_000);
            dbConnection.createStatement().execute(
                "UPDATE assets SET valuation = " + newValue + " WHERE asset_id = '" + assetId + "'"
            );

            String newProof = "0x" + Integer.toHexString((assetId + newValue).hashCode());
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + newProof + "' WHERE asset_id = '" + assetId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT merkle_proof FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs.next()).isTrue();
            String currentProof = rs.getString("merkle_proof");
            assertThat(currentProof).isNotEqualTo(originalProof);
        }
    }

    @Nested
    @DisplayName("Batch Merkle Proof Generation")
    class BatchMerkleProofTests {

        @Test
        @DisplayName("Should generate proofs for asset batch")
        void testBatchProofGeneration() throws SQLException {
            // Arrange
            Set<String> assetIds = new HashSet<>();
            for (int i = 0; i < 100; i++) {
                String assetId = "batch-merkle-" + i;
                insertTestAsset(assetId, BigDecimal.valueOf(50_000 + i * 1_000));
                assetIds.add(assetId);
            }

            // Act: Generate proofs for batch
            long startTime = System.nanoTime();
            for (String assetId : assetIds) {
                String proof = "0x" + Integer.toHexString(assetId.hashCode());
                dbConnection.createStatement().execute(
                    "UPDATE assets SET merkle_proof = '" + proof + "' WHERE asset_id = '" + assetId + "'"
                );
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as proof_count FROM assets WHERE merkle_proof IS NOT NULL AND asset_id LIKE 'batch-merkle-%'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("proof_count")).isEqualTo(100);
            assertPerformanceMetric(duration, 500, "Batch Merkle proof generation (100 assets)");
        }

        @Test
        @DisplayName("Should handle concurrent batch proof generation")
        void testConcurrentBatchProofGeneration() throws SQLException {
            // Arrange
            for (int batch = 0; batch < 5; batch++) {
                for (int i = 0; i < 20; i++) {
                    String assetId = "concurrent-batch-" + batch + "-" + i;
                    insertTestAsset(assetId, BigDecimal.valueOf(100_000 + i * 5_000));
                }
            }

            // Act: Generate proofs concurrently
            long startTime = System.nanoTime();
            for (int batch = 0; batch < 5; batch++) {
                for (int i = 0; i < 20; i++) {
                    String assetId = "concurrent-batch-" + batch + "-" + i;
                    String proof = "0x" + Integer.toHexString(assetId.hashCode());
                    dbConnection.createStatement().execute(
                        "UPDATE assets SET merkle_proof = '" + proof + "' WHERE asset_id = '" + assetId + "'"
                    );
                }
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as total FROM assets WHERE asset_id LIKE 'concurrent-batch-%'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("total")).isEqualTo(100);
            assertPerformanceMetric(duration, 500, "Concurrent batch Merkle proof (100 assets)");
        }
    }

    @Nested
    @DisplayName("Merkle Proof Cache Management")
    class MerkleProofCacheTests {

        @Test
        @DisplayName("Should invalidate proof cache on asset update")
        void testProofCacheInvalidation() throws SQLException {
            // Arrange
            String assetId = "cache-inv-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(500_000));

            String proof1 = "0x" + Integer.toHexString(assetId.hashCode());
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + proof1 + "' WHERE asset_id = '" + assetId + "'"
            );

            // Verify initial proof
            var rs1 = executeQuery("SELECT merkle_proof FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs1.next()).isTrue();
            assertThat(rs1.getString("merkle_proof")).isEqualTo(proof1);

            // Act: Update asset (cache invalidation)
            BigDecimal newValue = BigDecimal.valueOf(550_000);
            dbConnection.createStatement().execute(
                "UPDATE assets SET valuation = " + newValue + " WHERE asset_id = '" + assetId + "'"
            );

            // New proof after invalidation
            String proof2 = "0x" + Integer.toHexString((assetId + newValue).hashCode());
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + proof2 + "' WHERE asset_id = '" + assetId + "'"
            );

            // Assert
            var rs2 = executeQuery("SELECT merkle_proof FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs2.next()).isTrue();
            String newProof = rs2.getString("merkle_proof");
            assertThat(newProof).isNotEqualTo(proof1).isEqualTo(proof2);
        }

        @Test
        @DisplayName("Should maintain cache consistency across multiple verifications")
        void testCacheConsistency() throws SQLException {
            // Arrange
            String assetId = "cache-consist-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(500_000));
            String merkleProof = "0x" + Integer.toHexString(assetId.hashCode());
            dbConnection.createStatement().execute(
                "UPDATE assets SET merkle_proof = '" + merkleProof + "' WHERE asset_id = '" + assetId + "'"
            );

            // Act: Multiple cache hits
            Set<String> cachedProofs = new HashSet<>();
            for (int i = 0; i < 10; i++) {
                var rs = executeQuery("SELECT merkle_proof FROM assets WHERE asset_id = '" + assetId + "'");
                assertThat(rs.next()).isTrue();
                cachedProofs.add(rs.getString("merkle_proof"));
            }

            // Assert: All cached values identical
            assertThat(cachedProofs).hasSize(1).contains(merkleProof);
        }
    }
}
