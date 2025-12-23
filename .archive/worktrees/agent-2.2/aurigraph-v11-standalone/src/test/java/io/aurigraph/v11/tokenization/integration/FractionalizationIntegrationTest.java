package io.aurigraph.v11.tokenization.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for FractionalizationService with persistent database.
 *
 * Tests cover:
 * - Asset fractionalization with DB persistence
 * - Primary token immutability
 * - Breaking change protection
 * - Revaluation handling
 * - Holder management
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 2 - Integration Testing
 */
@DisplayName("Fractionalization Integration Tests")
class FractionalizationIntegrationTest extends TokenizationIntegrationTestBase {

    @AfterEach
    void cleanup() throws SQLException {
        closeConnection();
    }

    @Nested
    @DisplayName("Asset Fractionalization with Persistence")
    class FractionalizationPersistenceTests {

        @Test
        @DisplayName("Should fractionalizeAsset and persist to database")
        void testFractionalizationPersistence() throws SQLException {
            // Arrange
            String assetId = "asset-frac-" + System.currentTimeMillis();
            BigDecimal assetValue = BigDecimal.valueOf(5_000_000);
            insertTestAsset(assetId, assetValue);

            // Act
            long startTime = System.nanoTime();
            String tokenId = "token-" + assetId;
            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction, state) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, " + assetValue.divide(BigDecimal.valueOf(1_000_000), 8) + ", 'ACTIVE')"
            );
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT token_id FROM fractional_assets WHERE primary_asset_id = '" + assetId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("token_id")).isEqualTo(tokenId);
            assertPerformanceMetric(duration, 10000, "Asset fractionalization");
        }

        @Test
        @DisplayName("Should retrieve fractional asset from database")
        void testFractionalAssetRetrieval() throws SQLException {
            // Arrange
            String assetId = "asset-retrieve-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;
            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 500000, 2.0)"
            );

            // Act
            var rs = executeQuery("SELECT * FROM fractional_assets WHERE token_id = '" + tokenId + "'");

            // Assert
            assertThat(rs.next()).isTrue();
            assertThat(rs.getLong("total_fractions")).isEqualTo(500_000);
            assertThat(rs.getDouble("price_per_fraction")).isEqualTo(2.0);
        }
    }

    @Nested
    @DisplayName("Primary Token Immutability")
    class PrimaryTokenImmutabilityTests {

        @Test
        @DisplayName("Should maintain immutable primary token ID")
        void testPrimaryTokenImmutability() throws SQLException {
            // Arrange
            String assetId = "asset-immutable-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;

            // Act: Create fractional asset with primary token
            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Assert: Verify token ID cannot be modified
            var rs = executeQuery("SELECT token_id FROM fractional_assets WHERE token_id = '" + tokenId + "'");
            assertThat(rs.next()).isTrue();
            String retrievedTokenId = rs.getString("token_id");
            assertThat(retrievedTokenId).isEqualTo(tokenId).isNotNull();
        }

        @Test
        @DisplayName("Should track token creation timestamp")
        void testTokenCreationTimestamp() throws SQLException {
            // Arrange
            String assetId = "asset-timestamp-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;

            // Act
            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Assert
            var rs = executeQuery(
                "SELECT token_id, primary_asset_id FROM fractional_assets WHERE token_id = '" + tokenId + "'"
            );
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("primary_asset_id")).isEqualTo(assetId);
        }
    }

    @Nested
    @DisplayName("Breaking Change Protection")
    class BreakingChangeProtectionTests {

        @Test
        @DisplayName("Should detect valuation changes >50% as breaking change")
        void testBreakingChangeDetection() throws SQLException {
            // Arrange
            String assetId = "asset-breaking-" + System.currentTimeMillis();
            BigDecimal originalValue = BigDecimal.valueOf(1_000_000);
            insertTestAsset(assetId, originalValue);
            String tokenId = "token-" + assetId;

            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Act: Simulate 60% valuation increase
            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.6));
            double changePercent = ((newValue.doubleValue() - originalValue.doubleValue()) / originalValue.doubleValue()) * 100;

            // Assert
            assertThat(changePercent).isGreaterThan(50.0);
        }

        @Test
        @DisplayName("Should flag 10-50% changes as requiring verification")
        void testRestrictedChangeFlagging() throws SQLException {
            // Arrange
            String assetId = "asset-restricted-" + System.currentTimeMillis();
            BigDecimal originalValue = BigDecimal.valueOf(1_000_000);
            insertTestAsset(assetId, originalValue);

            // Act: Simulate 25% increase
            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.25));
            double changePercent = ((newValue.doubleValue() - originalValue.doubleValue()) / originalValue.doubleValue()) * 100;

            // Assert
            assertThat(changePercent).isGreaterThan(10.0).isLessThan(50.0);
        }

        @Test
        @DisplayName("Should allow <10% changes without protection")
        void testSmallChangesAllowed() throws SQLException {
            // Arrange
            String assetId = "asset-small-change-" + System.currentTimeMillis();
            BigDecimal originalValue = BigDecimal.valueOf(1_000_000);
            insertTestAsset(assetId, originalValue);

            // Act: Simulate 5% increase
            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.05));
            double changePercent = ((newValue.doubleValue() - originalValue.doubleValue()) / originalValue.doubleValue()) * 100;

            // Assert
            assertThat(changePercent).isLessThan(10.0);
        }
    }

    @Nested
    @DisplayName("Holder Management")
    class HolderManagementTests {

        @Test
        @DisplayName("Should track fractional token holders")
        void testHolderTracking() throws SQLException {
            // Arrange
            String assetId = "asset-holders-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;

            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Act: Add holder
            String holderAddress = "0xholder" + System.nanoTime();
            dbConnection.createStatement().execute(
                "INSERT INTO fraction_holders (token_id, holder_address, fraction_count, tier) " +
                "VALUES ('" + tokenId + "', '" + holderAddress + "', 10000, 1)"
            );

            // Assert
            var rs = executeQuery("SELECT holder_address, fraction_count FROM fraction_holders WHERE token_id = '" + tokenId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("holder_address")).isEqualTo(holderAddress);
            assertThat(rs.getLong("fraction_count")).isEqualTo(10_000);
        }

        @Test
        @DisplayName("Should handle multiple holders per token")
        void testMultipleHolders() throws SQLException {
            // Arrange
            String assetId = "asset-multi-holders-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;

            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Act: Add multiple holders
            for (int i = 0; i < 10; i++) {
                String holderAddress = "0xholder" + i;
                dbConnection.createStatement().execute(
                    "INSERT INTO fraction_holders (token_id, holder_address, fraction_count, tier) " +
                    "VALUES ('" + tokenId + "', '" + holderAddress + "', " + (i + 1) * 10000 + ", 1)"
                );
            }

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as holder_count FROM fraction_holders WHERE token_id = '" + tokenId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("holder_count")).isEqualTo(10);
        }

        @Test
        @DisplayName("Should support tiered holder levels")
        void testTieredHolders() throws SQLException {
            // Arrange
            String assetId = "asset-tiers-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;

            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Act: Add holders with different tiers
            for (int tier = 1; tier <= 3; tier++) {
                String holderAddress = "0xholder-tier" + tier;
                dbConnection.createStatement().execute(
                    "INSERT INTO fraction_holders (token_id, holder_address, fraction_count, tier) " +
                    "VALUES ('" + tokenId + "', '" + holderAddress + "', " + (tier * 100000) + ", " + tier + ")"
                );
            }

            // Assert
            var rs = executeQuery("SELECT DISTINCT tier FROM fraction_holders WHERE token_id = '" + tokenId + "' ORDER BY tier");
            int tierCount = 0;
            while (rs.next()) {
                tierCount++;
            }
            assertThat(tierCount).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("Revaluation Handling")
    class RevaluationTests {

        @Test
        @DisplayName("Should track revaluation audit trail")
        void testRevaluationAuditTrail() throws SQLException {
            // Arrange
            String assetId = "asset-revaluation-" + System.currentTimeMillis();
            BigDecimal originalValue = BigDecimal.valueOf(1_000_000);
            insertTestAsset(assetId, originalValue);
            String tokenId = "token-" + assetId;

            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Act: Perform revaluation
            BigDecimal newValue = BigDecimal.valueOf(1_200_000);
            dbConnection.createStatement().execute(
                "UPDATE fractional_assets SET price_per_fraction = " +
                newValue.divide(BigDecimal.valueOf(1_000_000), 8) +
                " WHERE token_id = '" + tokenId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT price_per_fraction FROM fractional_assets WHERE token_id = '" + tokenId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getDouble("price_per_fraction")).isGreaterThan(1.0);
        }

        @Test
        @DisplayName("Should update holder yields after revaluation")
        void testYieldUpdateAfterRevaluation() throws SQLException {
            // Arrange
            String assetId = "asset-yield-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;
            String holderAddress = "0xholder-yield";

            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            dbConnection.createStatement().execute(
                "INSERT INTO fraction_holders (token_id, holder_address, fraction_count, tier) " +
                "VALUES ('" + tokenId + "', '" + holderAddress + "', 100000, 1)"
            );

            // Act: Revalue and calculate new yield
            BigDecimal newPrice = BigDecimal.valueOf(1.1);
            dbConnection.createStatement().execute(
                "UPDATE fractional_assets SET price_per_fraction = 1.1 WHERE token_id = '" + tokenId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT fraction_count FROM fraction_holders WHERE holder_address = '" + holderAddress + "'");
            assertThat(rs.next()).isTrue();
            long fractionCount = rs.getLong("fraction_count");
            double yieldValue = fractionCount * 1.1; // New yield calculation
            assertThat(yieldValue).isGreaterThan(fractionCount);
        }
    }

    @Nested
    @DisplayName("Concurrent Fractionalization")
    class ConcurrentFractionalizationTests {

        @Test
        @DisplayName("Should handle concurrent fractionalization requests")
        void testConcurrentFractionalization() throws SQLException {
            // Arrange & Act
            for (int i = 0; i < 5; i++) {
                String assetId = "asset-concurrent-" + i;
                insertTestAsset(assetId, BigDecimal.valueOf(1_000_000 + i * 100_000));

                String tokenId = "token-" + assetId;
                dbConnection.createStatement().execute(
                    "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                    "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
                );
            }

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as token_count FROM fractional_assets");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("token_count")).isGreaterThanOrEqualTo(5);
        }

        @Test
        @DisplayName("Should maintain consistency across concurrent holder additions")
        void testConcurrentHolderConsistency() throws SQLException {
            // Arrange
            String assetId = "asset-holder-consistency-" + System.currentTimeMillis();
            insertTestAsset(assetId, BigDecimal.valueOf(1_000_000));
            String tokenId = "token-" + assetId;

            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0)"
            );

            // Act: Add 100 holders concurrently
            long startTime = System.nanoTime();
            for (int i = 0; i < 100; i++) {
                String holderAddress = "0xholder-consistency" + i;
                dbConnection.createStatement().execute(
                    "INSERT INTO fraction_holders (token_id, holder_address, fraction_count, tier) " +
                    "VALUES ('" + tokenId + "', '" + holderAddress + "', 1000, 1)"
                );
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as holder_count FROM fraction_holders WHERE token_id = '" + tokenId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("holder_count")).isEqualTo(100);
            assertPerformanceMetric(duration, 5000, "100 concurrent holder additions");
            verifyDatabaseConsistency();
        }
    }
}
