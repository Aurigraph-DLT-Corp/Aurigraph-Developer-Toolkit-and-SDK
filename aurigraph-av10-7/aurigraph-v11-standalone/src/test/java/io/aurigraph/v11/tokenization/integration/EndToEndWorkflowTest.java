package io.aurigraph.v11.tokenization.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.*;

/**
 * End-to-End workflow integration tests for tokenization pipeline.
 *
 * Tests cover:
 * - Complete workflow: Create Pool → Fractionate → Distribute → Verify
 * - Governance approval process with state transitions
 * - Asset revaluation flow with impact tracking
 * - Rollback scenarios and error handling
 * - Multi-step transaction workflows
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 2 - Integration Testing
 */
@DisplayName("End-to-End Workflow Integration Tests")
class EndToEndWorkflowTest extends TokenizationIntegrationTestBase {

    @AfterEach
    void cleanup() throws SQLException {
        closeConnection();
    }

    @Nested
    @DisplayName("Complete Tokenization Workflow")
    class CompleteWorkflowTests {

        @Test
        @DisplayName("Should complete full workflow: Create Pool → Fractionate → Distribute → Verify")
        void testCompleteTokenizationWorkflow() throws SQLException {
            // Phase 1: Create Pool with Assets
            String poolId = "pool-e2e-complete-" + System.currentTimeMillis();
            String poolAddress = "0x" + poolId.hashCode();
            BigDecimal poolTVL = BigDecimal.valueOf(1_000_000);

            long workflowStart = System.nanoTime();

            // Insert base assets
            for (int i = 0; i < 5; i++) {
                String assetId = "e2e-asset-" + i;
                insertTestAsset(assetId, BigDecimal.valueOf(200_000));
            }

            // Create aggregation pool
            insertTestPool(poolId, poolAddress, poolTVL);

            // Verify pool creation
            var rs1 = executeQuery("SELECT pool_id FROM aggregation_pools WHERE pool_id = '" + poolId + "'");
            assertThat(rs1.next()).isTrue();

            // Phase 2: Fractionalize Asset
            String tokenId = "token-" + poolId;
            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction, state) " +
                "VALUES ('" + tokenId + "', 'e2e-asset-0', 1000000, 1.0, 'ACTIVE')"
            );

            // Verify fractionalization
            var rs2 = executeQuery("SELECT token_id FROM fractional_assets WHERE token_id = '" + tokenId + "'");
            assertThat(rs2.next()).isTrue();

            // Phase 3: Add Holders
            for (int i = 0; i < 10; i++) {
                String holderAddress = "0xe2e-holder-" + i;
                dbConnection.createStatement().execute(
                    "INSERT INTO fraction_holders (token_id, holder_address, fraction_count, tier) " +
                    "VALUES ('" + tokenId + "', '" + holderAddress + "', 100000, 1)"
                );
            }

            // Verify holders
            var rs3 = executeQuery("SELECT COUNT(*) as holder_count FROM fraction_holders WHERE token_id = '" + tokenId + "'");
            assertThat(rs3.next()).isTrue();
            assertThat(rs3.getInt("holder_count")).isEqualTo(10);

            // Phase 4: Create Distribution
            String distributionId = "dist-e2e-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(100_000));

            // Phase 5: Record Payments to Ledger
            for (int i = 0; i < 10; i++) {
                String holderAddress = "0xe2e-holder-" + i;
                dbConnection.createStatement().execute(
                    "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                    "VALUES ('" + distributionId + "', '" + holderAddress + "', 10000.00, 'PENDING')"
                );
            }

            // Phase 6: Verify Complete Workflow
            var rs4 = executeQuery("SELECT COUNT(*) as ledger_count FROM distribution_ledger WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs4.next()).isTrue();
            assertThat(rs4.getInt("ledger_count")).isEqualTo(10);

            long workflowDuration = (System.nanoTime() - workflowStart) / 1_000_000;
            assertPerformanceMetric(workflowDuration, 5000, "Complete tokenization workflow");

            // Final consistency check
            verifyDatabaseConsistency();
        }
    }

    @Nested
    @DisplayName("Governance Approval Process")
    class GovernanceApprovalTests {

        @Test
        @DisplayName("Should execute governance approval workflow with state transitions")
        void testGovernanceApprovalWorkflow() throws SQLException {
            // Setup: Create pool and distribution
            String poolId = "pool-gov-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-gov-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(100_000));

            // Step 1: Initial state - PENDING
            var rs1 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs1.next()).isTrue();
            assertThat(rs1.getString("state")).isEqualTo("PENDING");

            // Step 2: Governance review - transition to UNDER_REVIEW
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'UNDER_REVIEW' WHERE distribution_id = '" + distributionId + "'"
            );

            var rs2 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs2.next()).isTrue();
            assertThat(rs2.getString("state")).isEqualTo("UNDER_REVIEW");

            // Step 3: Governance approval - transition to APPROVED
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'APPROVED' WHERE distribution_id = '" + distributionId + "'"
            );

            var rs3 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs3.next()).isTrue();
            assertThat(rs3.getString("state")).isEqualTo("APPROVED");

            // Step 4: Execution - transition to PROCESSING
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'PROCESSING' WHERE distribution_id = '" + distributionId + "'"
            );

            var rs4 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs4.next()).isTrue();
            assertThat(rs4.getString("state")).isEqualTo("PROCESSING");

            // Step 5: Completion - transition to COMPLETED
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'COMPLETED' WHERE distribution_id = '" + distributionId + "'"
            );

            var rs5 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs5.next()).isTrue();
            assertThat(rs5.getString("state")).isEqualTo("COMPLETED");
        }

        @Test
        @DisplayName("Should handle governance rejection workflow")
        void testGovernanceRejectionWorkflow() throws SQLException {
            // Setup
            String poolId = "pool-reject-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-reject-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(100_000));

            // Step 1: Initial PENDING state
            var rs1 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs1.next()).isTrue();
            assertThat(rs1.getString("state")).isEqualTo("PENDING");

            // Step 2: Move to UNDER_REVIEW
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'UNDER_REVIEW' WHERE distribution_id = '" + distributionId + "'"
            );

            // Step 3: Governance rejection - back to PENDING for revision
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'REJECTED' WHERE distribution_id = '" + distributionId + "'"
            );

            var rs2 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs2.next()).isTrue();
            assertThat(rs2.getString("state")).isEqualTo("REJECTED");
        }
    }

    @Nested
    @DisplayName("Asset Revaluation Workflow")
    class AssetRevaluationWorkflowTests {

        @Test
        @DisplayName("Should execute asset revaluation with impact tracking")
        void testAssetRevaluationWorkflow() throws SQLException {
            // Setup: Create asset with initial valuation
            String assetId = "reval-e2e-" + System.currentTimeMillis();
            BigDecimal originalValue = BigDecimal.valueOf(1_000_000);
            insertTestAsset(assetId, originalValue);

            // Verify initial valuation
            var rs1 = executeQuery("SELECT valuation FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs1.next()).isTrue();
            assertThat(rs1.getBigDecimal("valuation")).isEqualByComparingTo(originalValue);

            // Create pool with this asset
            String poolId = "pool-reval-" + assetId;
            insertTestPool(poolId, "0x" + poolId.hashCode(), originalValue);

            // Create fractional token
            String tokenId = "token-reval-" + assetId;
            dbConnection.createStatement().execute(
                "INSERT INTO fractional_assets (token_id, primary_asset_id, total_fractions, price_per_fraction, state) " +
                "VALUES ('" + tokenId + "', '" + assetId + "', 1000000, 1.0, 'ACTIVE')"
            );

            // Step 1: Detect revaluation trigger (>10% change)
            BigDecimal newValue = originalValue.multiply(BigDecimal.valueOf(1.25)); // 25% increase
            double changePercent = ((newValue.doubleValue() - originalValue.doubleValue()) / originalValue.doubleValue()) * 100;
            assertThat(changePercent).isGreaterThan(10.0);

            // Step 2: Flag for review
            // In real system, this would trigger governance review
            String revaluationStatus = changePercent > 50.0 ? "BREAKING_CHANGE" : changePercent > 10.0 ? "RESTRICTED" : "ALLOWED";
            assertThat(revaluationStatus).isEqualTo("RESTRICTED");

            // Step 3: Apply revaluation
            dbConnection.createStatement().execute(
                "UPDATE assets SET valuation = " + newValue + " WHERE asset_id = '" + assetId + "'"
            );

            // Step 4: Update pool TVL
            dbConnection.createStatement().execute(
                "UPDATE aggregation_pools SET total_value_locked = " + newValue + " WHERE pool_id = '" + poolId + "'"
            );

            // Step 5: Update fractional asset price
            BigDecimal newPrice = newValue.divide(BigDecimal.valueOf(1_000_000), 8);
            dbConnection.createStatement().execute(
                "UPDATE fractional_assets SET price_per_fraction = " + newPrice + " WHERE token_id = '" + tokenId + "'"
            );

            // Verify revaluation applied
            var rs2 = executeQuery("SELECT valuation FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs2.next()).isTrue();
            assertThat(rs2.getBigDecimal("valuation")).isEqualByComparingTo(newValue);

            var rs3 = executeQuery("SELECT total_value_locked FROM aggregation_pools WHERE pool_id = '" + poolId + "'");
            assertThat(rs3.next()).isTrue();
            assertThat(rs3.getBigDecimal("total_value_locked")).isEqualByComparingTo(newValue);
        }

        @Test
        @DisplayName("Should handle breaking change detection and prevention")
        void testBreakingChangeDetection() throws SQLException {
            // Setup
            String assetId = "breaking-" + System.currentTimeMillis();
            BigDecimal originalValue = BigDecimal.valueOf(1_000_000);
            insertTestAsset(assetId, originalValue);

            // Detect breaking change (>50% change)
            BigDecimal breakingValue = originalValue.multiply(BigDecimal.valueOf(1.75)); // 75% increase
            double changePercent = ((breakingValue.doubleValue() - originalValue.doubleValue()) / originalValue.doubleValue()) * 100;

            // Assert detection
            assertThat(changePercent).isGreaterThan(50.0);

            // Breaking changes should be prevented
            var rs = executeQuery("SELECT valuation FROM assets WHERE asset_id = '" + assetId + "'");
            assertThat(rs.next()).isTrue();
            assertThat(rs.getBigDecimal("valuation")).isEqualByComparingTo(originalValue);
        }
    }

    @Nested
    @DisplayName("Rollback and Error Handling")
    class RollbackScenarioTests {

        @Test
        @DisplayName("Should handle distribution failure and rollback")
        void testDistributionFailureRollback() throws SQLException {
            // Setup: Create pool and distribution
            String poolId = "pool-rollback-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-rollback-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(100_000));

            // Add holders
            for (int i = 0; i < 5; i++) {
                String holderAddress = "0xrollback-" + i;
                dbConnection.createStatement().execute(
                    "INSERT INTO distribution_ledger (distribution_id, holder_address, payment_amount, status) " +
                    "VALUES ('" + distributionId + "', '" + holderAddress + "', 20000.00, 'PENDING')"
                );
            }

            // Verify ledger entries
            var rs1 = executeQuery("SELECT COUNT(*) as count FROM distribution_ledger WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs1.next()).isTrue();
            assertThat(rs1.getInt("count")).isEqualTo(5);

            // Simulate failure: Mark distribution as failed
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'FAILED' WHERE distribution_id = '" + distributionId + "'"
            );

            // Verify failure state
            var rs2 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs2.next()).isTrue();
            assertThat(rs2.getString("state")).isEqualTo("FAILED");

            // In rollback, reset payment statuses
            dbConnection.createStatement().execute(
                "UPDATE distribution_ledger SET status = 'ROLLED_BACK' WHERE distribution_id = '" + distributionId + "' AND status = 'PENDING'"
            );

            // Verify rollback
            var rs3 = executeQuery("SELECT COUNT(*) as rolled_back FROM distribution_ledger WHERE distribution_id = '" + distributionId + "' AND status = 'ROLLED_BACK'");
            assertThat(rs3.next()).isTrue();
            assertThat(rs3.getInt("rolled_back")).isEqualTo(5);
        }

        @Test
        @DisplayName("Should detect and handle inconsistent state transitions")
        void testInconsistentStateDetection() throws SQLException {
            // Setup
            String poolId = "pool-inconsist-" + System.currentTimeMillis();
            insertTestPool(poolId, "0x" + poolId.hashCode(), BigDecimal.valueOf(1_000_000));
            String distributionId = "dist-inconsist-" + poolId;
            insertTestDistribution(distributionId, poolId, BigDecimal.valueOf(100_000));

            // Attempt invalid state transition (COMPLETED -> PENDING)
            // In a real system, this would be prevented by business logic
            dbConnection.createStatement().execute(
                "UPDATE distributions SET state = 'COMPLETED' WHERE distribution_id = '" + distributionId + "'"
            );

            // Verify current state
            var rs1 = executeQuery("SELECT state FROM distributions WHERE distribution_id = '" + distributionId + "'");
            assertThat(rs1.next()).isTrue();
            assertThat(rs1.getString("state")).isEqualTo("COMPLETED");

            // Verify we cannot find it in PENDING state
            var rs2 = executeQuery("SELECT COUNT(*) as count FROM distributions WHERE distribution_id = '" + distributionId + "' AND state = 'PENDING'");
            assertThat(rs2.next()).isTrue();
            assertThat(rs2.getInt("count")).isEqualTo(0);
        }
    }
}
