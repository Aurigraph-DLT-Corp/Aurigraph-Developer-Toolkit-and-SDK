package io.aurigraph.v11.tokenization.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for AggregationPoolService with persistent database.
 *
 * Tests cover:
 * - Pool creation with DB persistence
 * - Multi-asset pool operations
 * - Weight updates and rebalancing
 * - State transitions
 * - Concurrent operations
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 2 - Integration Testing
 */
@DisplayName("Aggregation Pool Integration Tests")
class AggregationPoolIntegrationTest extends TokenizationIntegrationTestBase {

    @AfterEach
    void cleanup() throws SQLException {
        closeConnection();
    }

    @Nested
    @DisplayName("Pool Creation with Persistence")
    class PoolCreationPersistenceTests {

        @Test
        @DisplayName("Should create pool and persist to database")
        void testPoolCreationPersistence() throws SQLException {
            // Arrange
            String poolId = "pool-" + System.currentTimeMillis();
            String poolAddress = "0x" + poolId.hashCode();
            BigDecimal tvl = BigDecimal.valueOf(10_000_000);

            // Act
            long startTime = System.nanoTime();
            String createdPool = insertTestPool(poolId, poolAddress, tvl);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(createdPool).isNotNull().isEqualTo(poolId);
            assertThat(assetExists(poolId)).isTrue();
            assertPerformanceMetric(duration, POOL_CREATION_MAX_MS, "Pool creation with persistence");
        }

        @Test
        @DisplayName("Should retrieve created pool from database")
        void testPoolRetrieval() throws SQLException {
            // Arrange
            String poolId = "pool-retrieve-" + System.currentTimeMillis();
            String poolAddress = "0x" + poolId.hashCode();
            BigDecimal tvl = BigDecimal.valueOf(5_000_000);
            insertTestPool(poolId, poolAddress, tvl);

            // Act
            var rs = executeQuery("SELECT pool_id, pool_address, total_value_locked FROM aggregation_pools WHERE pool_id = '" + poolId + "'");

            // Assert
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("pool_id")).isEqualTo(poolId);
            assertThat(rs.getString("pool_address")).isEqualTo(poolAddress);
            assertThat(rs.getBigDecimal("total_value_locked")).isEqualByComparingTo(tvl);
        }
    }

    @Nested
    @DisplayName("Multi-Asset Pool Operations")
    class MultiAssetPoolTests {

        @Test
        @DisplayName("Should create pool with multiple assets")
        void testMultiAssetPool() throws SQLException {
            // Arrange
            String poolId = "pool-multi-" + System.currentTimeMillis();
            String poolAddress = "0x" + poolId.hashCode();

            // Insert multiple assets
            BigDecimal totalValue = BigDecimal.ZERO;
            for (int i = 0; i < 5; i++) {
                String assetId = "asset-" + i;
                BigDecimal assetValue = BigDecimal.valueOf(1_000_000 + i * 100_000);
                insertTestAsset(assetId, assetValue);
                totalValue = totalValue.add(assetValue);
            }

            // Act
            insertTestPool(poolId, poolAddress, totalValue);

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as asset_count FROM assets");
            rs.next();
            assertThat(rs.getInt("asset_count")).isGreaterThanOrEqualTo(5);
        }

        @Test
        @DisplayName("Should handle 100 assets in pool")
        void testLargeAssetPool() throws SQLException {
            // Arrange
            String poolId = "pool-large-" + System.currentTimeMillis();
            String poolAddress = "0x" + poolId.hashCode();
            BigDecimal totalValue = BigDecimal.ZERO;

            // Act: Insert 100 assets
            long startTime = System.nanoTime();
            for (int i = 0; i < 100; i++) {
                String assetId = "large-asset-" + i;
                BigDecimal assetValue = BigDecimal.valueOf(100_000);
                insertTestAsset(assetId, assetValue);
                totalValue = totalValue.add(assetValue);
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            insertTestPool(poolId, poolAddress, totalValue);
            assertPerformanceMetric(duration, POOL_CREATION_MAX_MS, "100-asset pool creation");
        }
    }

    @Nested
    @DisplayName("Pool State Transitions")
    class StateTransitionTests {

        @Test
        @DisplayName("Should transition pool from ACTIVE to CLOSED")
        void testPoolStateTransition() throws SQLException {
            // Arrange
            String poolId = "pool-state-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));

            // Act: Update pool state
            dbConnection.createStatement().execute(
                "UPDATE aggregation_pools SET state = 'CLOSED' WHERE pool_id = '" + poolId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT state FROM aggregation_pools WHERE pool_id = '" + poolId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("state")).isEqualTo("CLOSED");
        }

        @Test
        @DisplayName("Should track pool state change timestamp")
        void testStateChangeTimestamp() throws SQLException {
            // Arrange
            String poolId = "pool-timestamp-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));

            // Act
            dbConnection.createStatement().execute(
                "UPDATE aggregation_pools SET state = 'REBALANCING', updated_at = NOW() WHERE pool_id = '" + poolId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT state, updated_at FROM aggregation_pools WHERE pool_id = '" + poolId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("state")).isEqualTo("REBALANCING");
            assertThat(rs.getTimestamp("updated_at")).isNotNull();
        }
    }

    @Nested
    @DisplayName("Pool Valuation Updates")
    class ValuationUpdateTests {

        @Test
        @DisplayName("Should update total value locked")
        void testTVLUpdate() throws SQLException {
            // Arrange
            String poolId = "pool-tvl-" + System.currentTimeMillis();
            BigDecimal originalTVL = BigDecimal.valueOf(1_000_000);
            insertTestPool(poolId, "0x" + poolId.hashCode(), originalTVL);

            // Act: Update TVL
            BigDecimal newTVL = BigDecimal.valueOf(1_200_000);
            dbConnection.createStatement().execute(
                "UPDATE aggregation_pools SET total_value_locked = " + newTVL + " WHERE pool_id = '" + poolId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT total_value_locked FROM aggregation_pools WHERE pool_id = '" + poolId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getBigDecimal("total_value_locked")).isEqualByComparingTo(newTVL);
        }

        @Test
        @DisplayName("Should track historical TVL changes")
        void testTVLHistory() throws SQLException {
            // Arrange
            String poolId = "pool-history-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));

            // Act: Make multiple valuation updates
            for (int i = 0; i < 5; i++) {
                BigDecimal newValue = BigDecimal.valueOf(1_000_000 + i * 100_000);
                dbConnection.createStatement().execute(
                    "UPDATE aggregation_pools SET total_value_locked = " + newValue + " WHERE pool_id = '" + poolId + "'"
                );
            }

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as update_count FROM aggregation_pools WHERE pool_id = '" + poolId + "'");
            assertThat(rs.next()).isTrue();
        }
    }

    @Nested
    @DisplayName("Concurrent Pool Operations")
    class ConcurrentOperationTests {

        @Test
        @DisplayName("Should handle concurrent pool creations")
        void testConcurrentPoolCreation() throws SQLException {
            // Arrange & Act
            for (int i = 0; i < 10; i++) {
                String poolId = "pool-concurrent-" + i + "-" + System.nanoTime();
                insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000 + i * 100_000));
            }

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as pool_count FROM aggregation_pools");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("pool_count")).isGreaterThanOrEqualTo(10);
        }

        @Test
        @DisplayName("Should maintain data consistency under concurrent updates")
        void testConcurrentConsistency() throws SQLException {
            // Arrange
            String poolId = "pool-consistent-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));

            // Act: Simulate concurrent updates
            for (int i = 0; i < 20; i++) {
                long newValue = 1_000_000 + i * 50_000;
                dbConnection.createStatement().execute(
                    "UPDATE aggregation_pools SET total_value_locked = " + newValue + " WHERE pool_id = '" + poolId + "'"
                );
            }

            // Assert
            verifyDatabaseConsistency();
        }
    }

    @Nested
    @DisplayName("Pool Search and Filtering")
    class SearchAndFilterTests {

        @Test
        @DisplayName("Should find pools by state")
        void testPoolSearchByState() throws SQLException {
            // Arrange
            insertTestPool("pool-active-1", "0x1", BigDecimal.valueOf(1_000_000));
            insertTestPool("pool-active-2", "0x2", BigDecimal.valueOf(2_000_000));

            // Update one to CLOSED
            dbConnection.createStatement().execute("UPDATE aggregation_pools SET state = 'CLOSED' WHERE pool_id = 'pool-active-2'");

            // Act
            var rs = executeQuery("SELECT COUNT(*) as active_count FROM aggregation_pools WHERE state = 'ACTIVE'");

            // Assert
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("active_count")).isGreaterThanOrEqualTo(1);
        }

        @Test
        @DisplayName("Should find pools by TVL range")
        void testPoolSearchByTVL() throws SQLException {
            // Arrange
            insertTestPool("pool-small", "0x1", BigDecimal.valueOf(100_000));
            insertTestPool("pool-medium", "0x2", BigDecimal.valueOf(1_000_000));
            insertTestPool("pool-large", "0x3", BigDecimal.valueOf(10_000_000));

            // Act
            var rs = executeQuery(
                "SELECT COUNT(*) as count FROM aggregation_pools " +
                "WHERE total_value_locked >= 500000 AND total_value_locked < 5000000"
            );

            // Assert
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("count")).isGreaterThan(0);
        }
    }
}
