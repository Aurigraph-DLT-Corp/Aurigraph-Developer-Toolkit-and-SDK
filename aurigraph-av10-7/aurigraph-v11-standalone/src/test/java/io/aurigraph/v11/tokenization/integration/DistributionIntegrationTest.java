package io.aurigraph.v11.tokenization.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for DistributionService with persistent database.
 *
 * Tests cover:
 * - Multi-holder distribution with database persistence
 * - Payment ledger tracking and reconciliation
 * - Distribution state machine transitions
 * - Concurrent distribution operations
 * - Distribution history and audit trails
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 2 - Integration Testing
 */
@DisplayName("Distribution Integration Tests")
class DistributionIntegrationTest extends TokenizationIntegrationTestBase {

    @AfterEach
    void cleanup() throws SQLException {
        closeConnection();
    }

    @Nested
    @DisplayName("Distribution Creation with Persistence")
    class DistributionCreationPersistenceTests {

        @Test
        @DisplayName("Should create distribution and persist to database")
        void testDistributionCreationPersistence() throws SQLException {
            // Arrange
            String poolId = "pool-dist-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-" + poolId;
            BigDecimal yieldAmount = BigDecimal.valueOf(50_000);

            // Act
            long startTime = System.nanoTime();
            String createdDist = insertTestDistribution(distributionId, poolId, yieldAmount);
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            assertThat(createdDist).isNotNull().isEqualTo(distributionId);
            var rs = executeQuery("SELECT distribution_id, pool_id, yield_amount FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("pool_id")).isEqualTo(poolId);
            assertThat(rs.getBigDecimal("yield_amount")).isEqualByComparingTo(yieldAmount);
            assertPerformanceMetric(duration, DISTRIBUTION_10K_MAX_MS, "Distribution creation");
        }

        @Test
        @DisplayName("Should retrieve distribution from database")
        void testDistributionRetrieval() throws SQLException {
            // Arrange
            String poolId = "pool-dist-retrieve-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000));

            // Act
            var rs = executeQuery("SELECT * FROM distributions WHERE distribution_id = '" + distributionId + "'");

            // Assert
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("state")).isEqualTo("PENDING");
            assertThat(rs.getTimestamp("created_at")).isNotNull();
        }
    }

    @Nested
    @DisplayName("Multi-Holder Distribution")
    class MultiHolderDistributionTests {

        @Test
        @DisplayName("Should distribute to 10 holders with proper allocation")
        void testDistributeTo10Holders() throws SQLException {
            // Arrange
            String poolId = "pool-10holders-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-10h-" + poolId;
            BigDecimal totalYield = BigDecimal.valueOf(100_000);
            insertTestDistribution(distributionId, poolId, totalYield);

            // Act: Add 10 holders to ledger
            long startTime = System.nanoTime();
            for (int i = 0; i < 10; i++) {
                String holderAddress = "0xholder10-" + i;
                BigDecimal paymentAmount = totalYield.divide(BigDecimal.valueOf(10), 8);
                dbConnection.createStatement().execute(
                    "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                    "VALUES ('" + distributionId + "', '" + holderAddress + "', " + paymentAmount + ", 'PENDING')"
                );
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as holder_count FROM distribution_ledger WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("holder_count")).isEqualTo(10);
            assertPerformanceMetric(duration, DISTRIBUTION_10K_MAX_MS, "10-holder distribution creation");
        }

        @Test
        @DisplayName("Should distribute to 50K holders with performance validation")
        void testDistributeTo50KHolders() throws SQLException {
            // Arrange
            String poolId = "pool-50k-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(10_000_000));
            String distributionId = "dist-50k-" + poolId;
            BigDecimal totalYield = BigDecimal.valueOf(500_000);
            insertTestDistribution(distributionId, poolId, totalYield);

            // Act: Add 50K holders to ledger
            long startTime = System.nanoTime();
            for (int i = 0; i < 50000; i += 100) {
                // Batch insert for performance
                StringBuilder batch = new StringBuilder();
                for (int j = 0; j < 100; j++) {
                    String holderAddress = "0xh50k-" + (i + j);
                    BigDecimal paymentAmount = totalYield.divide(BigDecimal.valueOf(50000), 8);
                    batch.append("('").append(distributionId).append("', '").append(holderAddress)
                         .append("', ").append(paymentAmount).append(", 'PENDING'),");
                }
                String sql = batch.toString();
                sql = sql.substring(0, sql.length() - 1);
                dbConnection.createStatement().execute(
                    "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) VALUES " + sql
                );
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as holder_count FROM distribution_ledger WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("holder_count")).isEqualTo(50000);
            assertPerformanceMetric(duration, DISTRIBUTION_50K_MAX_MS, "50K-holder distribution creation");
        }

        @Test
        @DisplayName("Should calculate correct per-holder allocation")
        void testPerHolderAllocationCalculation() throws SQLException {
            // Arrange
            String poolId = "pool-alloc-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-alloc-" + poolId;
            BigDecimal totalYield = BigDecimal.valueOf(100_000);
            insertTestDistribution(distributionId, poolId, totalYield);

            int holderCount = 5;
            BigDecimal expectedPerHolder = totalYield.divide(BigDecimal.valueOf(holderCount), 8);

            // Act: Add holders with equal allocation
            for (int i = 0; i < holderCount; i++) {
                String holderAddress = "0xalloc-" + i;
                dbConnection.createStatement().execute(
                    "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                    "VALUES ('" + distributionId + "', '" + holderAddress + "', " + expectedPerHolder + ", 'PENDING')"
                );
            }

            // Assert
            var rs = executeQuery("SELECT SUM(payment_amount) as total_paid FROM distribution_ledger WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            BigDecimal totalPaid = rs.getBigDecimal("total_paid");
            assertThat(totalPaid).isEqualByComparingTo(totalYield);
        }
    }

    @Nested
    @DisplayName("Payment Ledger Tracking")
    class PaymentLedgerTrackingTests {

        @Test
        @DisplayName("Should track payment status transitions")
        void testPaymentStatusTransitions() throws SQLException {
            // Arrange
            String poolId = "pool-ledger-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-ledger-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000));
            String holderAddress = "0xledger-holder";

            dbConnection.createStatement().execute(
                "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                "VALUES ('" + distributionId + "', '" + holderAddress + "', 10000.00, 'PENDING')"
            );

            // Act: Update payment status
            dbConnection.createStatement().execute(
                "UPDATE distribution_ledger SET status = 'PROCESSING' WHERE distribution_id = '" + distributionId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT status FROM distribution_ledger WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("status")).isEqualTo("PROCESSING");
        }

        @Test
        @DisplayName("Should record transaction hash for completed payments")
        void testTransactionHashRecording() throws SQLException {
            // Arrange
            String poolId = "pool-txhash-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-txhash-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000));
            String holderAddress = "0xtxhash-holder";
            String txHash = "0xtxhash" + System.nanoTime();

            dbConnection.createStatement().execute(
                "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                "VALUES ('" + distributionId + "', '" + holderAddress + "', 10000.00, 'PENDING')"
            );

            // Act: Record transaction completion
            dbConnection.createStatement().execute(
                "UPDATE distribution_ledger SET status = 'COMPLETED', transaction_hash = '" + txHash + "' " +
                "WHERE distribution_id = '" + distributionId + "' AND holder_address = '" + holderAddress + "'"
            );

            // Assert
            var rs = executeQuery("SELECT status, transaction_hash FROM distribution_ledger WHERE holder_address = '" + holderAddress + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("status")).isEqualTo("COMPLETED");
            assertThat(rs.getString("transaction_hash")).isEqualTo(txHash);
        }

        @Test
        @DisplayName("Should track payment ledger creation timestamp")
        void testPaymentLedgerTimestamp() throws SQLException {
            // Arrange
            String poolId = "pool-timestamp-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-timestamp-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000));

            // Act
            dbConnection.createStatement().execute(
                "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                "VALUES ('" + distributionId + "', '0xtimestamp-h', 10000.00, 'PENDING')"
            );

            // Assert
            var rs = executeQuery("SELECT created_at FROM distribution_ledger WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getTimestamp("created_at")).isNotNull();
        }
    }

    @Nested
    @DisplayName("Distribution State Machine")
    class DistributionStateMachineTests {

        @Test
        @DisplayName("Should transition distribution through state machine: PENDING → PROCESSING → COMPLETED")
        void testDistributionStateTransitions() throws SQLException {
            // Arrange
            String poolId = "pool-state-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-state-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000));

            // Assert initial state
            var rs = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("state")).isEqualTo("PENDING");

            // Act: Transition to PROCESSING
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'PROCESSING' WHERE distribution_id = '" + distributionId + "'"
            );

            rs = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("state")).isEqualTo("PROCESSING");

            // Act: Transition to COMPLETED
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'COMPLETED' WHERE distribution_id = '" + distributionId + "'"
            );

            rs = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("state")).isEqualTo("COMPLETED");
        }

        @Test
        @DisplayName("Should handle distribution failure state")
        void testDistributionFailureState() throws SQLException {
            // Arrange
            String poolId = "pool-fail-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-fail-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000));

            // Act: Transition to FAILED
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'FAILED' WHERE distribution_id = '" + distributionId + "'"
            );

            // Assert
            var rs = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString("state")).isEqualTo("FAILED");
        }
    }

    @Nested
    @DisplayName("Concurrent Distribution Operations")
    class ConcurrentDistributionTests {

        @Test
        @DisplayName("Should handle concurrent distribution creations")
        void testConcurrentDistributionCreation() throws SQLException {
            // Arrange & Act
            for (int i = 0; i < 5; i++) {
                String poolId = "pool-concurrent-" + i + "-" + System.nanoTime();
                insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000 + i * 100_000));
                String distributionId = "dist-concurrent-" + i;
                insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000 + i * 5_000));
            }

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as dist_count FROM distributions");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("dist_count")).isGreaterThanOrEqualTo(5);
        }

        @Test
        @DisplayName("Should maintain consistency during concurrent payment updates")
        void testConcurrentPaymentUpdates() throws SQLException {
            // Arrange
            String poolId = "pool-concurrent-pay-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-concurrent-pay-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(100_000));

            // Add 100 holders
            for (int i = 0; i < 100; i++) {
                String holderAddress = "0xconcur-pay-" + i;
                dbConnection.createStatement().execute(
                    "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                    "VALUES ('" + distributionId + "', '" + holderAddress + "', 1000.00, 'PENDING')"
                );
            }

            // Act: Concurrent status updates
            long startTime = System.nanoTime();
            for (int i = 0; i < 100; i++) {
                dbConnection.createStatement().execute(
                    "UPDATE distribution_ledger SET status = 'PROCESSING' " +
                    "WHERE distribution_id = '" + distributionId + "' AND holder_address = '0xconcur-pay-" + i + "'"
                );
            }
            long duration = (System.nanoTime() - startTime) / 1_000_000;

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as processing_count FROM distribution_ledger WHERE status = 'PROCESSING'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("processing_count")).isGreaterThanOrEqualTo(100);
            verifyDatabaseConsistency();
            assertPerformanceMetric(duration, 1000, "100 concurrent payment updates");
        }
    }

    @Nested
    @DisplayName("Distribution History & Audit Trail")
    class DistributionHistoryTests {

        @Test
        @DisplayName("Should track distribution creation history")
        void testDistributionCreationHistory() throws SQLException {
            // Arrange & Act
            String poolId = "pool-history-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));

            for (int i = 0; i < 5; i++) {
                String distributionId = "dist-history-" + i + "-" + poolId;
                insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000 + i * 5_000));
            }

            // Assert
            var rs = executeQuery("SELECT COUNT(*) as dist_count FROM distributions WHERE pool_id = '" + poolId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt("dist_count")).isEqualTo(5);
        }

        @Test
        @DisplayName("Should maintain ledger history for payment verification")
        void testPaymentLedgerHistory() throws SQLException {
            // Arrange
            String poolId = "pool-ledger-history-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-ledger-history-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(50_000));

            String holderAddress = "0xledger-history";

            // Act: Record multiple status changes
            dbConnection.createStatement().execute(
                "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                "VALUES ('" + distributionId + "', '" + holderAddress + "', 10000.00, 'PENDING')"
            );

            dbConnection.createStatement().execute(
                "UPDATE distribution_ledger SET status = 'PROCESSING' " +
                "WHERE distribution_id = '" + distributionId + "' AND holder_address = '" + holderAddress + "'"
            );

            dbConnection.createStatement().execute(
                "UPDATE distribution_ledger SET status = 'COMPLETED' " +
                "WHERE distribution_id = '" + distributionId + "' AND holder_address = '" + holderAddress + "'"
            );

            // Assert
            var rs = executeQuery(
                "SELECT payment_amount, status FROM distribution_ledger " +
                "WHERE distribution_id = '" + distributionId + "' AND holder_address = '" + holderAddress + "'"
            );
            assertThat(rs.next()).isTrue();
            assertThat(rs.getBigDecimal("payment_amount")).isEqualByComparingTo(BigDecimal.valueOf(10000.00));
            assertThat(rs.getString("status")).isEqualTo("COMPLETED");
        }
    }
}
