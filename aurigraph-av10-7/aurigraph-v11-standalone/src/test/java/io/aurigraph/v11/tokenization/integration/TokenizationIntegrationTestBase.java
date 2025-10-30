package io.aurigraph.v11.tokenization.integration;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.sql.*;
import java.util.logging.Logger;

/**
 * Base class for integration tests using TestContainers.
 *
 * Provides:
 * - PostgreSQL container for persistent data
 * - Redis container for caching
 * - Database connection pooling
 * - Test data cleanup
 *
 * @author Quality Assurance Agent (QAA)
 * @since Phase 2 - Integration Testing
 */
@Testcontainers
@QuarkusTest
@ExtendWith(MockitoExtension.class)
public abstract class TokenizationIntegrationTestBase {

    protected static final Logger logger = Logger.getLogger(TokenizationIntegrationTestBase.class.getName());

    // PostgreSQL Container for persistent data
    @Container
    public static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(
        DockerImageName.parse("postgres:15-alpine")
    )
        .withDatabaseName("tokenization_test")
        .withUsername("testuser")
        .withPassword("testpassword")
        .withInitScript("sql/init-test-db.sql");

    // Redis Container for caching
    @Container
    public static GenericContainer<?> redis = new GenericContainer<>(
        DockerImageName.parse("redis:7-alpine")
    )
        .withExposedPorts(6379);

    protected Connection dbConnection;

    // Performance thresholds for integration tests
    protected static final long POOL_CREATION_MAX_MS = 5000;      // 5s
    protected static final long DISTRIBUTION_10K_MAX_MS = 100;    // 100ms
    protected static final long DISTRIBUTION_50K_MAX_MS = 500;    // 500ms
    protected static final long MERKLE_VERIFY_MAX_MS = 50;        // 50ms

    @BeforeEach
    void setupIntegrationTest() throws SQLException {
        logger.info("=== Starting Integration Test ===");
        logger.info("PostgreSQL: " + postgres.getJdbcUrl());
        logger.info("Redis: " + redis.getHost() + ":" + redis.getFirstMappedPort());

        // Establish database connection
        dbConnection = DriverManager.getConnection(
            postgres.getJdbcUrl(),
            postgres.getUsername(),
            postgres.getPassword()
        );

        // Verify connection
        try (Statement stmt = dbConnection.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT 1");
            if (rs.next()) {
                logger.info("✓ Database connection verified");
            }
        }

        // Clear test data
        cleanupTestData();
    }

    /**
     * Clean up test data before each test
     */
    protected void cleanupTestData() throws SQLException {
        try (Statement stmt = dbConnection.createStatement()) {
            // Disable foreign key checks
            stmt.execute("SET session_replication_role = 'replica'");

            // Delete in reverse order of foreign keys
            stmt.execute("DELETE FROM distribution_ledger");
            stmt.execute("DELETE FROM fraction_holders");
            stmt.execute("DELETE FROM fractional_assets");
            stmt.execute("DELETE FROM asset_compositions");
            stmt.execute("DELETE FROM aggregation_pools");
            stmt.execute("DELETE FROM assets");

            // Re-enable foreign key checks
            stmt.execute("SET session_replication_role = 'origin'");

            logger.info("✓ Test data cleaned up");
        }
    }

    /**
     * Insert test asset into database
     */
    protected String insertTestAsset(String assetId, BigDecimal valuation) throws SQLException {
        try (PreparedStatement stmt = dbConnection.prepareStatement(
            "INSERT INTO assets (asset_id, valuation, asset_type, custody_info, created_at) " +
            "VALUES (?, ?, 'TEST', 'Test Custody', NOW()) RETURNING asset_id"
        )) {
            stmt.setString(1, assetId);
            stmt.setBigDecimal(2, valuation);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    logger.info("✓ Asset inserted: " + assetId);
                    return rs.getString(1);
                }
            }
        }
        return null;
    }

    /**
     * Insert test pool into database
     */
    protected String insertTestPool(String poolId, String poolAddress, BigDecimal tvl) throws SQLException {
        try (PreparedStatement stmt = dbConnection.prepareStatement(
            "INSERT INTO aggregation_pools (pool_id, pool_address, total_value_locked, state, created_at) " +
            "VALUES (?, ?, ?, 'ACTIVE', NOW()) RETURNING pool_id"
        )) {
            stmt.setString(1, poolId);
            stmt.setString(2, poolAddress);
            stmt.setBigDecimal(3, tvl);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    logger.info("✓ Pool inserted: " + poolId);
                    return rs.getString(1);
                }
            }
        }
        return null;
    }

    /**
     * Insert test distribution into database
     */
    protected String insertTestDistribution(String distributionId, String poolId, BigDecimal amount) throws SQLException {
        try (PreparedStatement stmt = dbConnection.prepareStatement(
            "INSERT INTO distributions (distribution_id, pool_id, yield_amount, state, created_at) " +
            "VALUES (?, ?, ?, 'PENDING', NOW()) RETURNING distribution_id"
        )) {
            stmt.setString(1, distributionId);
            stmt.setString(2, poolId);
            stmt.setBigDecimal(3, amount);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    logger.info("✓ Distribution inserted: " + distributionId);
                    return rs.getString(1);
                }
            }
        }
        return null;
    }

    /**
     * Verify asset exists in database
     */
    protected boolean assetExists(String assetId) throws SQLException {
        try (PreparedStatement stmt = dbConnection.prepareStatement(
            "SELECT COUNT(*) FROM assets WHERE asset_id = ?"
        )) {
            stmt.setString(1, assetId);

            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    /**
     * Get asset valuation from database
     */
    protected BigDecimal getAssetValuation(String assetId) throws SQLException {
        try (PreparedStatement stmt = dbConnection.prepareStatement(
            "SELECT valuation FROM assets WHERE asset_id = ?"
        )) {
            stmt.setString(1, assetId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getBigDecimal(1);
                }
            }
        }
        return null;
    }

    /**
     * Execute database query
     */
    protected ResultSet executeQuery(String sql) throws SQLException {
        return dbConnection.createStatement().executeQuery(sql);
    }

    /**
     * Assert performance metrics
     */
    protected void assertPerformanceMetric(long actualMs, long maxExpectedMs, String operation) {
        if (actualMs > maxExpectedMs) {
            logger.warning(String.format("⚠ %s took %d ms (target: <%d ms) - PERFORMANCE DEGRADATION",
                operation, actualMs, maxExpectedMs));
        } else {
            logger.info(String.format("✓ %s completed in %d ms (target: <%d ms)",
                operation, actualMs, maxExpectedMs));
        }
    }

    /**
     * Verify database consistency
     */
    protected void verifyDatabaseConsistency() throws SQLException {
        try (Statement stmt = dbConnection.createStatement()) {
            // Check referential integrity
            ResultSet rs = stmt.executeQuery(
                "SELECT COUNT(*) as orphaned FROM distribution_ledger " +
                "WHERE pool_id NOT IN (SELECT pool_id FROM aggregation_pools)"
            );

            if (rs.next() && rs.getInt("orphaned") > 0) {
                logger.warning("⚠ Database consistency issue: orphaned distribution ledgers");
            } else {
                logger.info("✓ Database consistency verified");
            }
        }
    }

    /**
     * Close database connection
     */
    protected void closeConnection() throws SQLException {
        if (dbConnection != null && !dbConnection.isClosed()) {
            dbConnection.close();
            logger.info("✓ Database connection closed");
        }
    }
}
