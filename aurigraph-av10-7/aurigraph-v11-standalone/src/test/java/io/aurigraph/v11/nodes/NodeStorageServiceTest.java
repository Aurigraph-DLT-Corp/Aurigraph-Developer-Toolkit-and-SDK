package io.aurigraph.v11.nodes;

import io.aurigraph.v11.storage.LevelDBService;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for NodeStorageService LevelDB operations
 * Sprint 1 - Test Coverage Enhancement (AV11-605)
 *
 * Tests cover:
 * - Node state persistence
 * - Transaction storage
 * - Block storage
 * - Contract state storage
 * - Audit log storage
 * - Metrics storage
 * - Node configuration
 * - Peer management
 * - Batch operations
 * - Replication
 * - Cache management
 */
@QuarkusTest
@DisplayName("NodeStorageService Tests")
class NodeStorageServiceTest {

    @Inject
    NodeStorageService storageService;

    private static final String TEST_NODE_ID = "test-node-1";

    @BeforeEach
    void setUp() {
        // Clear cache before each test
        storageService.clearCache();
    }

    @AfterEach
    void tearDown() {
        // Clean up test data
        try {
            storageService.clearNodeData(TEST_NODE_ID).await().indefinitely();
        } catch (Exception e) {
            // Ignore cleanup errors
        }
    }

    // ============================================
    // NODE STATE PERSISTENCE TESTS
    // ============================================

    @Nested
    @DisplayName("Node State Persistence Tests")
    class NodeStatePersistenceTests {

        @Test
        @DisplayName("Should save node state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldSaveNodeState() {
            assertDoesNotThrow(() ->
                storageService.saveNodeState(TEST_NODE_ID, "status", "running")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get node state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetNodeState() {
            storageService.saveNodeState(TEST_NODE_ID, "key1", "value1").await().indefinitely();

            String value = storageService.getNodeState(TEST_NODE_ID, "key1").await().indefinitely();
            assertEquals("value1", value);
        }

        @Test
        @DisplayName("Should return null for non-existent state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldReturnNullForNonExistentState() {
            String value = storageService.getNodeState(TEST_NODE_ID, "non-existent")
                .await().indefinitely();
            assertNull(value);
        }

        @Test
        @DisplayName("Should get all node state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetAllNodeState() {
            storageService.saveNodeState(TEST_NODE_ID, "key1", "value1").await().indefinitely();
            storageService.saveNodeState(TEST_NODE_ID, "key2", "value2").await().indefinitely();

            Map<String, String> allState = storageService.getAllNodeState(TEST_NODE_ID)
                .await().indefinitely();

            assertNotNull(allState);
            assertTrue(allState.size() >= 2);
        }

        @Test
        @DisplayName("Should delete node state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldDeleteNodeState() {
            storageService.saveNodeState(TEST_NODE_ID, "delete-key", "delete-value")
                .await().indefinitely();
            storageService.deleteNodeState(TEST_NODE_ID, "delete-key").await().indefinitely();

            String value = storageService.getNodeState(TEST_NODE_ID, "delete-key")
                .await().indefinitely();
            assertNull(value);
        }

        @Test
        @DisplayName("Should update existing state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldUpdateExistingState() {
            storageService.saveNodeState(TEST_NODE_ID, "update-key", "initial")
                .await().indefinitely();
            storageService.saveNodeState(TEST_NODE_ID, "update-key", "updated")
                .await().indefinitely();

            String value = storageService.getNodeState(TEST_NODE_ID, "update-key")
                .await().indefinitely();
            assertEquals("updated", value);
        }

        @Test
        @DisplayName("Should cache state for faster retrieval")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldCacheStateForFasterRetrieval() {
            storageService.saveNodeState(TEST_NODE_ID, "cache-key", "cache-value")
                .await().indefinitely();

            // First read populates cache
            storageService.getNodeState(TEST_NODE_ID, "cache-key").await().indefinitely();

            // Second read should use cache
            String value = storageService.getNodeState(TEST_NODE_ID, "cache-key")
                .await().indefinitely();
            assertEquals("cache-value", value);
            assertTrue(storageService.getCacheSize() > 0);
        }
    }

    // ============================================
    // TRANSACTION STORAGE TESTS
    // ============================================

    @Nested
    @DisplayName("Transaction Storage Tests")
    class TransactionStorageTests {

        @Test
        @DisplayName("Should store transaction")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStoreTransaction() {
            assertDoesNotThrow(() ->
                storageService.storeTransaction(TEST_NODE_ID, "tx-001", "{\"amount\": 100}")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get transaction")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetTransaction() {
            String txData = "{\"from\": \"A\", \"to\": \"B\", \"amount\": 50}";
            storageService.storeTransaction(TEST_NODE_ID, "tx-get", txData)
                .await().indefinitely();

            String retrieved = storageService.getTransaction(TEST_NODE_ID, "tx-get")
                .await().indefinitely();
            assertEquals(txData, retrieved);
        }

        @Test
        @DisplayName("Should return null for non-existent transaction")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldReturnNullForNonExistentTransaction() {
            String tx = storageService.getTransaction(TEST_NODE_ID, "non-existent-tx")
                .await().indefinitely();
            assertNull(tx);
        }

        @Test
        @DisplayName("Should get transactions by prefix")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetTransactionsByPrefix() {
            storageService.storeTransaction(TEST_NODE_ID, "block1:tx1", "data1")
                .await().indefinitely();
            storageService.storeTransaction(TEST_NODE_ID, "block1:tx2", "data2")
                .await().indefinitely();
            storageService.storeTransaction(TEST_NODE_ID, "block2:tx1", "data3")
                .await().indefinitely();

            List<String> block1Txs = storageService.getTransactionsByPrefix(TEST_NODE_ID, "block1:")
                .await().indefinitely();

            assertNotNull(block1Txs);
            assertTrue(block1Txs.size() >= 2);
        }

        @Test
        @DisplayName("Should check if transaction exists")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldCheckIfTransactionExists() {
            storageService.storeTransaction(TEST_NODE_ID, "tx-exists", "data")
                .await().indefinitely();

            Boolean exists = storageService.transactionExists(TEST_NODE_ID, "tx-exists")
                .await().indefinitely();
            Boolean notExists = storageService.transactionExists(TEST_NODE_ID, "tx-not-exists")
                .await().indefinitely();

            assertTrue(exists);
            assertFalse(notExists);
        }
    }

    // ============================================
    // BLOCK STORAGE TESTS
    // ============================================

    @Nested
    @DisplayName("Block Storage Tests")
    class BlockStorageTests {

        @Test
        @DisplayName("Should store block")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStoreBlock() {
            assertDoesNotThrow(() ->
                storageService.storeBlock(TEST_NODE_ID, 1L, "{\"hash\": \"0x123\"}")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get block by height")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetBlockByHeight() {
            String blockData = "{\"hash\": \"0xabc\", \"transactions\": []}";
            storageService.storeBlock(TEST_NODE_ID, 100L, blockData).await().indefinitely();

            String retrieved = storageService.getBlock(TEST_NODE_ID, 100L).await().indefinitely();
            assertEquals(blockData, retrieved);
        }

        @Test
        @DisplayName("Should return null for non-existent block")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldReturnNullForNonExistentBlock() {
            String block = storageService.getBlock(TEST_NODE_ID, 999999L).await().indefinitely();
            assertNull(block);
        }

        @Test
        @DisplayName("Should get latest block height")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetLatestBlockHeight() {
            storageService.storeBlock(TEST_NODE_ID, 1L, "block1").await().indefinitely();
            storageService.storeBlock(TEST_NODE_ID, 2L, "block2").await().indefinitely();
            storageService.storeBlock(TEST_NODE_ID, 3L, "block3").await().indefinitely();

            Long latestHeight = storageService.getLatestBlockHeight(TEST_NODE_ID)
                .await().indefinitely();

            assertTrue(latestHeight >= 3L);
        }

        @Test
        @DisplayName("Should get blocks in range")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetBlocksInRange() {
            for (int i = 1; i <= 5; i++) {
                storageService.storeBlock(TEST_NODE_ID, (long) i, "block" + i)
                    .await().indefinitely();
            }

            List<String> blocks = storageService.getBlocksInRange(TEST_NODE_ID, 2L, 4L)
                .await().indefinitely();

            assertNotNull(blocks);
            assertTrue(blocks.size() >= 3);
        }
    }

    // ============================================
    // CONTRACT STATE STORAGE TESTS
    // ============================================

    @Nested
    @DisplayName("Contract State Storage Tests")
    class ContractStateStorageTests {

        @Test
        @DisplayName("Should store contract state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStoreContractState() {
            assertDoesNotThrow(() ->
                storageService.storeContractState(TEST_NODE_ID, "contract-1", "{\"balance\": 1000}")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get contract state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetContractState() {
            String state = "{\"owner\": \"0x123\", \"totalSupply\": 1000000}";
            storageService.storeContractState(TEST_NODE_ID, "token-contract", state)
                .await().indefinitely();

            String retrieved = storageService.getContractState(TEST_NODE_ID, "token-contract")
                .await().indefinitely();
            assertEquals(state, retrieved);
        }

        @Test
        @DisplayName("Should get all contracts")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetAllContracts() {
            storageService.storeContractState(TEST_NODE_ID, "c1", "state1").await().indefinitely();
            storageService.storeContractState(TEST_NODE_ID, "c2", "state2").await().indefinitely();

            Map<String, String> contracts = storageService.getAllContracts(TEST_NODE_ID)
                .await().indefinitely();

            assertNotNull(contracts);
            assertTrue(contracts.size() >= 2);
        }

        @Test
        @DisplayName("Should delete contract state")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldDeleteContractState() {
            storageService.storeContractState(TEST_NODE_ID, "delete-contract", "state")
                .await().indefinitely();
            storageService.deleteContractState(TEST_NODE_ID, "delete-contract")
                .await().indefinitely();

            String state = storageService.getContractState(TEST_NODE_ID, "delete-contract")
                .await().indefinitely();
            assertNull(state);
        }
    }

    // ============================================
    // AUDIT LOG STORAGE TESTS
    // ============================================

    @Nested
    @DisplayName("Audit Log Storage Tests")
    class AuditLogStorageTests {

        @Test
        @DisplayName("Should store audit entry")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStoreAuditEntry() {
            assertDoesNotThrow(() ->
                storageService.storeAuditEntry(TEST_NODE_ID, "audit-001", "{\"action\": \"CREATE\"}")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get audit entries with limit")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetAuditEntriesWithLimit() {
            for (int i = 0; i < 10; i++) {
                storageService.storeAuditEntry(TEST_NODE_ID, "audit-" + i, "entry" + i)
                    .await().indefinitely();
            }

            List<String> entries = storageService.getAuditEntries(TEST_NODE_ID, 5)
                .await().indefinitely();

            assertNotNull(entries);
            assertEquals(5, entries.size());
        }

        @Test
        @DisplayName("Should return all entries if less than limit")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldReturnAllEntriesIfLessThanLimit() {
            storageService.storeAuditEntry(TEST_NODE_ID, "few-audit-1", "entry1")
                .await().indefinitely();
            storageService.storeAuditEntry(TEST_NODE_ID, "few-audit-2", "entry2")
                .await().indefinitely();

            List<String> entries = storageService.getAuditEntries(TEST_NODE_ID, 100)
                .await().indefinitely();

            assertNotNull(entries);
            assertTrue(entries.size() >= 2);
        }
    }

    // ============================================
    // METRICS STORAGE TESTS
    // ============================================

    @Nested
    @DisplayName("Metrics Storage Tests")
    class MetricsStorageTests {

        @Test
        @DisplayName("Should store metrics snapshot")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStoreMetricsSnapshot() {
            assertDoesNotThrow(() ->
                storageService.storeMetricsSnapshot(TEST_NODE_ID, "{\"tps\": 500000}")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get latest metrics snapshots")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetLatestMetricsSnapshots() throws InterruptedException {
            for (int i = 0; i < 5; i++) {
                storageService.storeMetricsSnapshot(TEST_NODE_ID, "{\"tps\": " + (i * 100) + "}")
                    .await().indefinitely();
                Thread.sleep(10); // Ensure different timestamps
            }

            List<String> snapshots = storageService.getMetricsSnapshots(TEST_NODE_ID, 3)
                .await().indefinitely();

            assertNotNull(snapshots);
            assertEquals(3, snapshots.size());
        }
    }

    // ============================================
    // NODE CONFIGURATION TESTS
    // ============================================

    @Nested
    @DisplayName("Node Configuration Tests")
    class NodeConfigurationTests {

        @Test
        @DisplayName("Should store node configuration")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStoreNodeConfiguration() {
            assertDoesNotThrow(() ->
                storageService.storeNodeConfig(TEST_NODE_ID, "max_tps", "1000000")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get node configuration")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetNodeConfiguration() {
            storageService.storeNodeConfig(TEST_NODE_ID, "block_time", "1000")
                .await().indefinitely();

            String value = storageService.getNodeConfig(TEST_NODE_ID, "block_time")
                .await().indefinitely();
            assertEquals("1000", value);
        }

        @Test
        @DisplayName("Should get all node configuration")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetAllNodeConfiguration() {
            storageService.storeNodeConfig(TEST_NODE_ID, "config1", "value1")
                .await().indefinitely();
            storageService.storeNodeConfig(TEST_NODE_ID, "config2", "value2")
                .await().indefinitely();

            Map<String, String> allConfig = storageService.getAllNodeConfig(TEST_NODE_ID)
                .await().indefinitely();

            assertNotNull(allConfig);
            assertTrue(allConfig.size() >= 2);
        }
    }

    // ============================================
    // PEER MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Peer Management Tests")
    class PeerManagementTests {

        @Test
        @DisplayName("Should store peer info")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldStorePeerInfo() {
            assertDoesNotThrow(() ->
                storageService.storePeerInfo(TEST_NODE_ID, "peer-1", "{\"address\": \"192.168.1.1\"}")
                    .await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should get peer info")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetPeerInfo() {
            String peerData = "{\"address\": \"10.0.0.1\", \"port\": 8080}";
            storageService.storePeerInfo(TEST_NODE_ID, "peer-get", peerData)
                .await().indefinitely();

            String retrieved = storageService.getPeerInfo(TEST_NODE_ID, "peer-get")
                .await().indefinitely();
            assertEquals(peerData, retrieved);
        }

        @Test
        @DisplayName("Should get all peers")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetAllPeers() {
            storageService.storePeerInfo(TEST_NODE_ID, "all-peer-1", "data1")
                .await().indefinitely();
            storageService.storePeerInfo(TEST_NODE_ID, "all-peer-2", "data2")
                .await().indefinitely();

            Map<String, String> peers = storageService.getAllPeers(TEST_NODE_ID)
                .await().indefinitely();

            assertNotNull(peers);
            assertTrue(peers.size() >= 2);
        }

        @Test
        @DisplayName("Should delete peer info")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldDeletePeerInfo() {
            storageService.storePeerInfo(TEST_NODE_ID, "delete-peer", "data")
                .await().indefinitely();
            storageService.deletePeerInfo(TEST_NODE_ID, "delete-peer").await().indefinitely();

            String info = storageService.getPeerInfo(TEST_NODE_ID, "delete-peer")
                .await().indefinitely();
            assertNull(info);
        }
    }

    // ============================================
    // BATCH OPERATIONS TESTS
    // ============================================

    @Nested
    @DisplayName("Batch Operations Tests")
    class BatchOperationsTests {

        @Test
        @DisplayName("Should batch store node data")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldBatchStoreNodeData() {
            Map<String, String> data = new HashMap<>();
            data.put("key1", "value1");
            data.put("key2", "value2");
            data.put("key3", "value3");

            assertDoesNotThrow(() ->
                storageService.batchStore(TEST_NODE_ID, data, "batch").await().indefinitely()
            );
        }

        @Test
        @DisplayName("Should clear all node data")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldClearAllNodeData() {
            // Store some data first
            storageService.saveNodeState(TEST_NODE_ID, "clear-state", "value")
                .await().indefinitely();
            storageService.storeTransaction(TEST_NODE_ID, "clear-tx", "data")
                .await().indefinitely();

            // Clear all data
            storageService.clearNodeData(TEST_NODE_ID).await().indefinitely();

            // Verify data is cleared
            String state = storageService.getNodeState(TEST_NODE_ID, "clear-state")
                .await().indefinitely();
            assertNull(state);
        }
    }

    // ============================================
    // REPLICATION TESTS
    // ============================================

    @Nested
    @DisplayName("Replication Tests")
    class ReplicationTests {

        private static final String SOURCE_NODE = "source-node";
        private static final String TARGET_NODE = "target-node";

        @BeforeEach
        void setupNodes() throws Exception {
            // Store data on source node
            storageService.saveNodeState(SOURCE_NODE, "replicate-key1", "replicate-value1")
                .await().indefinitely();
            storageService.saveNodeState(SOURCE_NODE, "replicate-key2", "replicate-value2")
                .await().indefinitely();
        }

        @AfterEach
        void cleanupNodes() {
            try {
                storageService.clearNodeData(SOURCE_NODE).await().indefinitely();
                storageService.clearNodeData(TARGET_NODE).await().indefinitely();
            } catch (Exception e) {
                // Ignore cleanup errors
            }
        }

        @Test
        @DisplayName("Should replicate node data to another node")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldReplicateNodeDataToAnotherNode() {
            Integer replicated = storageService.replicateNodeData(SOURCE_NODE, TARGET_NODE, "state")
                .await().indefinitely();

            assertTrue(replicated >= 2);
        }
    }

    // ============================================
    // STORAGE STATISTICS TESTS
    // ============================================

    @Nested
    @DisplayName("Storage Statistics Tests")
    class StorageStatisticsTests {

        @Test
        @DisplayName("Should get node storage stats")
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        void shouldGetNodeStorageStats() {
            // Store some data first
            storageService.saveNodeState(TEST_NODE_ID, "stats-state", "value")
                .await().indefinitely();
            storageService.storeTransaction(TEST_NODE_ID, "stats-tx", "data")
                .await().indefinitely();
            storageService.storeBlock(TEST_NODE_ID, 1L, "block").await().indefinitely();

            Map<String, Long> stats = storageService.getNodeStorageStats(TEST_NODE_ID)
                .await().indefinitely();

            assertNotNull(stats);
            assertTrue(stats.containsKey("stateEntries"));
            assertTrue(stats.containsKey("transactions"));
            assertTrue(stats.containsKey("blocks"));
            assertTrue(stats.containsKey("contracts"));
            assertTrue(stats.containsKey("auditEntries"));
            assertTrue(stats.containsKey("metricsSnapshots"));
        }
    }

    // ============================================
    // CACHE MANAGEMENT TESTS
    // ============================================

    @Nested
    @DisplayName("Cache Management Tests")
    class CacheManagementTests {

        @Test
        @DisplayName("Should clear cache")
        void shouldClearCache() {
            // Populate cache
            storageService.saveNodeState(TEST_NODE_ID, "cache-clear", "value")
                .await().indefinitely();
            storageService.getNodeState(TEST_NODE_ID, "cache-clear").await().indefinitely();

            assertTrue(storageService.getCacheSize() > 0);

            storageService.clearCache();

            assertEquals(0, storageService.getCacheSize());
        }

        @Test
        @DisplayName("Should get cache size")
        void shouldGetCacheSize() {
            storageService.clearCache();

            int initialSize = storageService.getCacheSize();
            assertEquals(0, initialSize);

            // Add to cache
            storageService.saveNodeState(TEST_NODE_ID, "size-test", "value")
                .await().indefinitely();

            // Read to populate cache
            storageService.getNodeState(TEST_NODE_ID, "size-test").await().indefinitely();

            assertTrue(storageService.getCacheSize() > 0);
        }
    }
}
