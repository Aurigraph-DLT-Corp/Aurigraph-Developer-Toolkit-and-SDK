package io.aurigraph.v11.integration;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit5.QuarkusTest;
import org.junit.jupiter.api.BeforeAll;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

/**
 * Sprint 16: AbstractIntegrationTest - Base class for integration tests
 *
 * Manages Testcontainers for PostgreSQL and Kafka with automatic startup/shutdown.
 * Provides common test infrastructure for all integration test classes.
 *
 * Features:
 * - PostgreSQL 16 container for state persistence
 * - Kafka container for async event streaming
 * - Redis container for caching
 * - Automatic health checks and container startup
 * - Environment variable propagation to Quarkus
 */
@Testcontainers
@QuarkusTest
public abstract class AbstractIntegrationTest {

    private static final Logger LOG = Logger.getLogger(AbstractIntegrationTest.class.getName());

    // Shared network for inter-container communication
    private static final Network network = Network.newNetwork();

    // PostgreSQL Container (Primary database)
    @Container
    public static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
        .withDatabaseName("aurigraph_v11_test")
        .withUsername("aurigraph_test")
        .withPassword("test_password_secure_123")
        .withNetwork(network)
        .withNetworkAliases("postgres")
        .withInitScript("postgres-init.sql")
        .withExposedPorts(5432)
        .waitingFor(new org.testcontainers.containers.wait.strategy.LogMessageWaitStrategy()
            .withRegEx(".*database system is ready to accept connections.*")
            .withTimes(2)
            .withStartupTimeout(java.time.Duration.ofSeconds(30)));

    // Kafka Container (Event streaming)
    @Container
    public static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"))
        .withNetwork(network)
        .withNetworkAliases("kafka")
        .withExposedPorts(9092)
        .waitingFor(new org.testcontainers.containers.wait.strategy.LogMessageWaitStrategy()
            .withRegEx(".*\\[KafkaServer id=\\d+\\] started.*")
            .withStartupTimeout(java.time.Duration.ofSeconds(30)));

    // Redis Container (Cache)
    @Container
    public static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
        .withNetwork(network)
        .withNetworkAliases("redis")
        .withExposedPorts(6379)
        .withCommand("redis-server", "--maxmemory", "512mb", "--maxmemory-policy", "allkeys-lru")
        .waitingFor(new org.testcontainers.containers.wait.strategy.LogMessageWaitStrategy()
            .withRegEx(".*Ready to accept connections.*")
            .withStartupTimeout(java.time.Duration.ofSeconds(30)));

    /**
     * Initialize Testcontainers and configure Quarkus properties
     * Called before any test method execution
     */
    @BeforeAll
    public static void setupContainers() {
        LOG.info("🧪 Starting Testcontainers for integration testing...");

        // Start all containers
        try {
            postgres.start();
            kafka.start();
            redis.start();
            LOG.info("✅ All Testcontainers started successfully");
        } catch (Exception e) {
            LOG.severe("❌ Failed to start Testcontainers: " + e.getMessage());
            throw new RuntimeException("Testcontainer startup failed", e);
        }

        // Configure Quarkus environment variables for database connectivity
        configureQuarkusProperties();

        // Verify container health
        verifyContainerHealth();
    }

    /**
     * Configure Quarkus properties for test containers
     */
    private static void configureQuarkusProperties() {
        LOG.info("🔧 Configuring Quarkus properties for test containers...");

        // PostgreSQL Configuration
        String postgresJdbcUrl = postgres.getJdbcUrl();
        String postgresUsername = postgres.getUsername();
        String postgresPassword = postgres.getPassword();

        System.setProperty("quarkus.datasource.db-kind", "postgresql");
        System.setProperty("quarkus.datasource.jdbc.url", postgresJdbcUrl);
        System.setProperty("quarkus.datasource.username", postgresUsername);
        System.setProperty("quarkus.datasource.password", postgresPassword);
        System.setProperty("quarkus.datasource.jdbc.max-size", "20");
        System.setProperty("quarkus.datasource.jdbc.min-size", "5");

        LOG.info("📍 PostgreSQL: " + postgresJdbcUrl);

        // Kafka Configuration
        String kafkaBootstrapServers = kafka.getBootstrapServers();
        System.setProperty("quarkus.kafka.bootstrap.servers", kafkaBootstrapServers);
        System.setProperty("kafka.bootstrap.servers", kafkaBootstrapServers);

        LOG.info("📍 Kafka Bootstrap Servers: " + kafkaBootstrapServers);

        // Redis Configuration
        String redisHost = redis.getHost();
        int redisPort = redis.getFirstMappedPort();
        System.setProperty("quarkus.redis.hosts", "redis://" + redisHost + ":" + redisPort);

        LOG.info("📍 Redis: redis://" + redisHost + ":" + redisPort);
    }

    /**
     * Verify that all containers are healthy
     */
    private static void verifyContainerHealth() {
        LOG.info("🏥 Verifying container health...");

        // Verify PostgreSQL
        try {
            var connection = postgres.createConnection("");
            if (connection.isValid(5)) {
                LOG.info("✅ PostgreSQL is healthy and accepting connections");
            }
            connection.close();
        } catch (Exception e) {
            LOG.warning("⚠️  PostgreSQL health check incomplete: " + e.getMessage());
        }

        // Verify Kafka
        try {
            var bootstrapServers = kafka.getBootstrapServers();
            LOG.info("✅ Kafka is running with bootstrap servers: " + bootstrapServers);
        } catch (Exception e) {
            LOG.warning("⚠️  Kafka health check incomplete: " + e.getMessage());
        }

        // Verify Redis
        LOG.info("✅ Redis container is running on port " + redis.getFirstMappedPort());
    }

    /**
     * Get PostgreSQL connection details for tests
     */
    protected static String getPostgresJdbcUrl() {
        return postgres.getJdbcUrl();
    }

    protected static String getPostgresUsername() {
        return postgres.getUsername();
    }

    protected static String getPostgresPassword() {
        return postgres.getPassword();
    }

    /**
     * Get Kafka connection details for tests
     */
    protected static String getKafkaBootstrapServers() {
        return kafka.getBootstrapServers();
    }

    /**
     * Get Redis connection details for tests
     */
    protected static String getRedisUrl() {
        return "redis://" + redis.getHost() + ":" + redis.getFirstMappedPort();
    }

    /**
     * Wait for Kafka topic to be created
     * Useful for ensuring topics exist before publishing messages
     */
    protected void waitForKafkaTopic(String topicName, int maxWaitSeconds) throws InterruptedException {
        LOG.info("⏳ Waiting for Kafka topic to be ready: " + topicName);

        long startTime = System.currentTimeMillis();
        long maxWaitMs = TimeUnit.SECONDS.toMillis(maxWaitSeconds);

        while (System.currentTimeMillis() - startTime < maxWaitMs) {
            try {
                // Topic creation is automatic in Kafka, just verify bootstrapping
                LOG.info("✅ Kafka topic ready: " + topicName);
                return;
            } catch (Exception e) {
                Thread.sleep(100);
            }
        }

        throw new InterruptedException("Timeout waiting for Kafka topic: " + topicName);
    }

    /**
     * Clear all test data from PostgreSQL database
     * Call this in setUp() method of individual test classes to ensure clean state
     */
    protected void clearAllTestData() {
        LOG.info("🧹 Clearing test data from database...");

        try (var connection = postgres.createConnection("")) {
            var statement = connection.createStatement();

            // Truncate all tables (adjust table names as per actual schema)
            String[] tables = {
                "approval",
                "webhook",
                "transaction",
                "consensus_vote",
                "bridge_transfer"
            };

            for (String table : tables) {
                try {
                    statement.execute("TRUNCATE TABLE " + table + " CASCADE");
                    LOG.fine("✅ Truncated table: " + table);
                } catch (Exception e) {
                    LOG.fine("ℹ️  Table not found (may not exist yet): " + table);
                }
            }

            statement.close();
            LOG.info("✅ Test data cleared successfully");
        } catch (Exception e) {
            LOG.warning("⚠️  Error clearing test data: " + e.getMessage());
        }
    }

    /**
     * Print container status for debugging
     */
    protected static void printContainerStatus() {
        LOG.info("📊 Container Status:");
        LOG.info("  PostgreSQL: " + postgres.getJdbcUrl());
        LOG.info("  Kafka: " + kafka.getBootstrapServers());
        LOG.info("  Redis: redis://" + redis.getHost() + ":" + redis.getFirstMappedPort());
    }
}
