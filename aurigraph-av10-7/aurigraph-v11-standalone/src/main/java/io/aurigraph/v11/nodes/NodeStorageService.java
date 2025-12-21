package io.aurigraph.v11.nodes;

import io.aurigraph.v11.storage.LevelDBService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * NodeStorageService - Unified LevelDB storage service for all Aurigraph V12 nodes.
 *
 * Provides per-node isolated storage with:
 * - Node state persistence
 * - Transaction storage
 * - Block data storage
 * - Contract state storage
 * - Audit log persistence
 * - Cross-node data replication
 *
 * Key prefixes:
 * - node:{nodeId}:state - Node state data
 * - node:{nodeId}:tx - Transactions
 * - node:{nodeId}:block - Block data
 * - node:{nodeId}:contract - Contract states
 * - node:{nodeId}:audit - Audit logs
 * - node:{nodeId}:metrics - Metrics snapshots
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@ApplicationScoped
public class NodeStorageService {

    private static final Logger LOG = Logger.getLogger(NodeStorageService.class);

    @Inject
    LevelDBService levelDBService;

    // Key prefix constants
    private static final String PREFIX_STATE = "node:%s:state:";
    private static final String PREFIX_TX = "node:%s:tx:";
    private static final String PREFIX_BLOCK = "node:%s:block:";
    private static final String PREFIX_CONTRACT = "node:%s:contract:";
    private static final String PREFIX_AUDIT = "node:%s:audit:";
    private static final String PREFIX_METRICS = "node:%s:metrics:";
    private static final String PREFIX_CONFIG = "node:%s:config:";
    private static final String PREFIX_PEER = "node:%s:peer:";

    // In-memory cache for frequently accessed data
    private final Map<String, Object> cache = new ConcurrentHashMap<>();
    private static final int MAX_CACHE_SIZE = 10_000;

    // ============================================
    // NODE STATE PERSISTENCE
    // ============================================

    /**
     * Save node state
     */
    public Uni<Void> saveNodeState(String nodeId, String key, String value) {
        String fullKey = String.format(PREFIX_STATE, nodeId) + key;
        return levelDBService.put(fullKey, value)
            .invoke(() -> {
                cacheIfRoom(fullKey, value);
                LOG.debugf("Saved node state: %s", fullKey);
            });
    }

    /**
     * Get node state
     */
    public Uni<String> getNodeState(String nodeId, String key) {
        String fullKey = String.format(PREFIX_STATE, nodeId) + key;

        // Check cache first
        Object cached = cache.get(fullKey);
        if (cached != null) {
            return Uni.createFrom().item((String) cached);
        }

        return levelDBService.get(fullKey)
            .invoke(value -> {
                if (value != null) {
                    cacheIfRoom(fullKey, value);
                }
            });
    }

    /**
     * Get all state for a node
     */
    public Uni<Map<String, String>> getAllNodeState(String nodeId) {
        String prefix = String.format(PREFIX_STATE, nodeId);
        return levelDBService.scanByPrefix(prefix);
    }

    /**
     * Delete node state
     */
    public Uni<Void> deleteNodeState(String nodeId, String key) {
        String fullKey = String.format(PREFIX_STATE, nodeId) + key;
        cache.remove(fullKey);
        return levelDBService.delete(fullKey);
    }

    // ============================================
    // TRANSACTION STORAGE
    // ============================================

    /**
     * Store a transaction
     */
    public Uni<Void> storeTransaction(String nodeId, String txId, String txData) {
        String fullKey = String.format(PREFIX_TX, nodeId) + txId;
        return levelDBService.put(fullKey, txData);
    }

    /**
     * Get a transaction
     */
    public Uni<String> getTransaction(String nodeId, String txId) {
        String fullKey = String.format(PREFIX_TX, nodeId) + txId;
        return levelDBService.get(fullKey);
    }

    /**
     * Get transactions by prefix (e.g., by block height)
     */
    public Uni<List<String>> getTransactionsByPrefix(String nodeId, String prefix) {
        String fullPrefix = String.format(PREFIX_TX, nodeId) + prefix;
        return levelDBService.getKeysByPrefix(fullPrefix);
    }

    /**
     * Check if transaction exists
     */
    public Uni<Boolean> transactionExists(String nodeId, String txId) {
        String fullKey = String.format(PREFIX_TX, nodeId) + txId;
        return levelDBService.exists(fullKey);
    }

    // ============================================
    // BLOCK STORAGE
    // ============================================

    /**
     * Store a block
     */
    public Uni<Void> storeBlock(String nodeId, long blockHeight, String blockData) {
        String fullKey = String.format(PREFIX_BLOCK, nodeId) + String.format("%020d", blockHeight);
        return levelDBService.put(fullKey, blockData);
    }

    /**
     * Get a block by height
     */
    public Uni<String> getBlock(String nodeId, long blockHeight) {
        String fullKey = String.format(PREFIX_BLOCK, nodeId) + String.format("%020d", blockHeight);
        return levelDBService.get(fullKey);
    }

    /**
     * Get latest block height
     */
    public Uni<Long> getLatestBlockHeight(String nodeId) {
        String prefix = String.format(PREFIX_BLOCK, nodeId);
        return levelDBService.getKeysByPrefix(prefix)
            .map(keys -> {
                if (keys.isEmpty()) {
                    return 0L;
                }
                String lastKey = keys.get(keys.size() - 1);
                String heightStr = lastKey.substring(lastKey.lastIndexOf(':') + 1);
                return Long.parseLong(heightStr);
            });
    }

    /**
     * Get blocks in range
     */
    public Uni<List<String>> getBlocksInRange(String nodeId, long fromHeight, long toHeight) {
        String prefix = String.format(PREFIX_BLOCK, nodeId);
        return levelDBService.scanByPrefix(prefix)
            .map(blocks -> {
                List<String> result = new ArrayList<>();
                for (Map.Entry<String, String> entry : blocks.entrySet()) {
                    String heightStr = entry.getKey().substring(entry.getKey().lastIndexOf(':') + 1);
                    long height = Long.parseLong(heightStr);
                    if (height >= fromHeight && height <= toHeight) {
                        result.add(entry.getValue());
                    }
                }
                return result;
            });
    }

    // ============================================
    // CONTRACT STATE STORAGE
    // ============================================

    /**
     * Store contract state
     */
    public Uni<Void> storeContractState(String nodeId, String contractId, String stateData) {
        String fullKey = String.format(PREFIX_CONTRACT, nodeId) + contractId;
        return levelDBService.put(fullKey, stateData);
    }

    /**
     * Get contract state
     */
    public Uni<String> getContractState(String nodeId, String contractId) {
        String fullKey = String.format(PREFIX_CONTRACT, nodeId) + contractId;
        return levelDBService.get(fullKey);
    }

    /**
     * Get all contracts for a node
     */
    public Uni<Map<String, String>> getAllContracts(String nodeId) {
        String prefix = String.format(PREFIX_CONTRACT, nodeId);
        return levelDBService.scanByPrefix(prefix);
    }

    /**
     * Delete contract state
     */
    public Uni<Void> deleteContractState(String nodeId, String contractId) {
        String fullKey = String.format(PREFIX_CONTRACT, nodeId) + contractId;
        return levelDBService.delete(fullKey);
    }

    // ============================================
    // AUDIT LOG STORAGE
    // ============================================

    /**
     * Store audit entry
     */
    public Uni<Void> storeAuditEntry(String nodeId, String entryId, String auditData) {
        String fullKey = String.format(PREFIX_AUDIT, nodeId) + entryId;
        return levelDBService.put(fullKey, auditData);
    }

    /**
     * Get audit entries
     */
    public Uni<List<String>> getAuditEntries(String nodeId, int limit) {
        String prefix = String.format(PREFIX_AUDIT, nodeId);
        return levelDBService.scanByPrefix(prefix)
            .map(entries -> {
                List<String> values = new ArrayList<>(entries.values());
                if (values.size() > limit) {
                    return values.subList(values.size() - limit, values.size());
                }
                return values;
            });
    }

    // ============================================
    // METRICS STORAGE
    // ============================================

    /**
     * Store metrics snapshot
     */
    public Uni<Void> storeMetricsSnapshot(String nodeId, String metricsData) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String fullKey = String.format(PREFIX_METRICS, nodeId) + timestamp;
        return levelDBService.put(fullKey, metricsData);
    }

    /**
     * Get latest metrics snapshots
     */
    public Uni<List<String>> getMetricsSnapshots(String nodeId, int count) {
        String prefix = String.format(PREFIX_METRICS, nodeId);
        return levelDBService.getKeysByPrefix(prefix)
            .flatMap(keys -> {
                int start = Math.max(0, keys.size() - count);
                List<String> recentKeys = keys.subList(start, keys.size());

                return levelDBService.scanByPrefix(prefix)
                    .map(all -> {
                        List<String> result = new ArrayList<>();
                        for (String key : recentKeys) {
                            String value = all.get(key);
                            if (value != null) {
                                result.add(value);
                            }
                        }
                        return result;
                    });
            });
    }

    // ============================================
    // NODE CONFIGURATION
    // ============================================

    /**
     * Store node configuration
     */
    public Uni<Void> storeNodeConfig(String nodeId, String configKey, String configValue) {
        String fullKey = String.format(PREFIX_CONFIG, nodeId) + configKey;
        return levelDBService.put(fullKey, configValue);
    }

    /**
     * Get node configuration
     */
    public Uni<String> getNodeConfig(String nodeId, String configKey) {
        String fullKey = String.format(PREFIX_CONFIG, nodeId) + configKey;
        return levelDBService.get(fullKey);
    }

    /**
     * Get all configuration for a node
     */
    public Uni<Map<String, String>> getAllNodeConfig(String nodeId) {
        String prefix = String.format(PREFIX_CONFIG, nodeId);
        return levelDBService.scanByPrefix(prefix);
    }

    // ============================================
    // PEER MANAGEMENT
    // ============================================

    /**
     * Store peer connection info
     */
    public Uni<Void> storePeerInfo(String nodeId, String peerId, String peerData) {
        String fullKey = String.format(PREFIX_PEER, nodeId) + peerId;
        return levelDBService.put(fullKey, peerData);
    }

    /**
     * Get peer info
     */
    public Uni<String> getPeerInfo(String nodeId, String peerId) {
        String fullKey = String.format(PREFIX_PEER, nodeId) + peerId;
        return levelDBService.get(fullKey);
    }

    /**
     * Get all peers for a node
     */
    public Uni<Map<String, String>> getAllPeers(String nodeId) {
        String prefix = String.format(PREFIX_PEER, nodeId);
        return levelDBService.scanByPrefix(prefix);
    }

    /**
     * Delete peer info
     */
    public Uni<Void> deletePeerInfo(String nodeId, String peerId) {
        String fullKey = String.format(PREFIX_PEER, nodeId) + peerId;
        return levelDBService.delete(fullKey);
    }

    // ============================================
    // BATCH OPERATIONS
    // ============================================

    /**
     * Batch store node data
     */
    public Uni<Void> batchStore(String nodeId, Map<String, String> data, String prefix) {
        Map<String, String> prefixedData = new HashMap<>();
        String nodePrefix = "node:" + nodeId + ":" + prefix + ":";

        data.forEach((key, value) -> prefixedData.put(nodePrefix + key, value));

        return levelDBService.batchWrite(prefixedData, null);
    }

    /**
     * Clear all data for a node
     */
    public Uni<Void> clearNodeData(String nodeId) {
        String nodePrefix = "node:" + nodeId + ":";
        return levelDBService.getKeysByPrefix(nodePrefix)
            .flatMap(keys -> levelDBService.batchWrite(null, keys));
    }

    // ============================================
    // REPLICATION
    // ============================================

    /**
     * Replicate data from one node to another
     */
    public Uni<Integer> replicateNodeData(String sourceNodeId, String targetNodeId, String dataType) {
        String sourcePrefix = "node:" + sourceNodeId + ":" + dataType + ":";
        String targetPrefix = "node:" + targetNodeId + ":" + dataType + ":";

        return levelDBService.scanByPrefix(sourcePrefix)
            .flatMap(data -> {
                Map<String, String> targetData = new HashMap<>();
                data.forEach((key, value) -> {
                    String targetKey = key.replace(sourcePrefix, targetPrefix);
                    targetData.put(targetKey, value);
                });

                return levelDBService.batchWrite(targetData, null)
                    .replaceWith(targetData.size());
            });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get storage statistics for a node
     */
    public Uni<Map<String, Long>> getNodeStorageStats(String nodeId) {
        Map<String, Long> stats = new ConcurrentHashMap<>();

        return Uni.combine().all().unis(
            levelDBService.getKeysByPrefix(String.format(PREFIX_STATE, nodeId)).map(List::size),
            levelDBService.getKeysByPrefix(String.format(PREFIX_TX, nodeId)).map(List::size),
            levelDBService.getKeysByPrefix(String.format(PREFIX_BLOCK, nodeId)).map(List::size),
            levelDBService.getKeysByPrefix(String.format(PREFIX_CONTRACT, nodeId)).map(List::size),
            levelDBService.getKeysByPrefix(String.format(PREFIX_AUDIT, nodeId)).map(List::size),
            levelDBService.getKeysByPrefix(String.format(PREFIX_METRICS, nodeId)).map(List::size)
        ).asTuple().map(tuple -> {
            stats.put("stateEntries", (long) tuple.getItem1());
            stats.put("transactions", (long) tuple.getItem2());
            stats.put("blocks", (long) tuple.getItem3());
            stats.put("contracts", (long) tuple.getItem4());
            stats.put("auditEntries", (long) tuple.getItem5());
            stats.put("metricsSnapshots", (long) tuple.getItem6());
            return stats;
        });
    }

    /**
     * Cache value if room available
     */
    private void cacheIfRoom(String key, Object value) {
        if (cache.size() < MAX_CACHE_SIZE) {
            cache.put(key, value);
        }
    }

    /**
     * Clear cache
     */
    public void clearCache() {
        cache.clear();
        LOG.info("Node storage cache cleared");
    }

    /**
     * Get cache size
     */
    public int getCacheSize() {
        return cache.size();
    }
}
