package io.aurigraph.v11.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.aurigraph.v11.demo.model.DemoDTO;
import io.quarkus.redis.datasource.ReactiveRedisDataSource;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.value.ValueCommands;
import io.quarkus.scheduler.Scheduled;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Redis-backed Demo Service with 24-hour TTL
 *
 * Unified service replacing both DemoResource (database) and FilesystemDemoResource.
 * Uses Redis for persistent in-memory storage with automatic expiration.
 *
 * Features:
 * - 24-hour default TTL for all demos
 * - In-memory cache for fast reads
 * - Automatic cleanup of expired demos
 * - Survives application restarts (Redis persistence)
 *
 * @version 2.0.0 (Dec 18, 2025)
 * @author Aurigraph DLT Development Team
 */
@ApplicationScoped
public class RedisDemoService {

    private static final Logger LOG = Logger.getLogger(RedisDemoService.class);
    private static final String DEMO_PREFIX = "demo:";
    private static final String DEMO_INDEX_KEY = "demo:index";

    @ConfigProperty(name = "aurigraph.demo.ttl-hours", defaultValue = "24")
    int ttlHours;

    @ConfigProperty(name = "aurigraph.demo.default-duration-minutes", defaultValue = "1440")
    int defaultDurationMinutes;

    @Inject
    RedisDataSource redisDataSource;

    private ValueCommands<String, String> valueCommands;
    private KeyCommands<String> keyCommands;
    private final ObjectMapper objectMapper;

    // Local cache for fast reads (synchronized with Redis)
    private final Map<String, DemoDTO> localCache = new ConcurrentHashMap<>();

    public RedisDemoService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @PostConstruct
    void init() {
        try {
            this.valueCommands = redisDataSource.value(String.class, String.class);
            this.keyCommands = redisDataSource.key(String.class);

            // Load existing demos from Redis into local cache
            loadDemosFromRedis();

            LOG.infof("RedisDemoService initialized - TTL: %d hours, Loaded %d demos from Redis",
                     ttlHours, localCache.size());
        } catch (Exception e) {
            LOG.warnf("Redis not available, falling back to local-only cache: %s", e.getMessage());
            // Service will work with local cache only
        }
    }

    /**
     * Load all demos from Redis into local cache
     */
    private void loadDemosFromRedis() {
        try {
            List<String> keys = keyCommands.keys(DEMO_PREFIX + "*");
            for (String key : keys) {
                if (key.equals(DEMO_INDEX_KEY)) continue;

                String json = valueCommands.get(key);
                if (json != null) {
                    DemoDTO demo = objectMapper.readValue(json, DemoDTO.class);
                    localCache.put(demo.id, demo);
                }
            }
        } catch (Exception e) {
            LOG.warnf("Error loading demos from Redis: %s", e.getMessage());
        }
    }

    /**
     * Create a new demo
     */
    public DemoDTO createDemo(DemoDTO demo) {
        // Generate ID if not provided
        if (demo.id == null || demo.id.isEmpty()) {
            demo.id = "demo_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Set timestamps
        demo.createdAt = LocalDateTime.now();
        demo.lastActivity = LocalDateTime.now();

        // Set default duration if not specified
        if (demo.durationMinutes <= 0) {
            demo.durationMinutes = defaultDurationMinutes;
        }

        // Calculate expiration
        demo.expiresAt = LocalDateTime.now().plusMinutes(demo.durationMinutes);

        // Set default status
        if (demo.status == null || demo.status.isEmpty()) {
            demo.status = "PENDING";
        }

        // Save to Redis and local cache
        saveDemo(demo);

        LOG.infof("Demo created: %s (ID: %s, Duration: %d min, Expires: %s)",
                 demo.demoName, demo.id, demo.durationMinutes, demo.expiresAt);

        return demo;
    }

    /**
     * Save demo to Redis with TTL
     */
    private void saveDemo(DemoDTO demo) {
        try {
            String key = DEMO_PREFIX + demo.id;
            String json = objectMapper.writeValueAsString(demo);

            // Calculate remaining TTL based on expiration
            long remainingSeconds = Duration.between(LocalDateTime.now(), demo.expiresAt).getSeconds();
            if (remainingSeconds > 0) {
                valueCommands.setex(key, remainingSeconds, json);
            } else {
                // Already expired, but save with minimum TTL for cleanup
                valueCommands.setex(key, 60, json);
            }

            // Update local cache
            localCache.put(demo.id, demo);

            LOG.debugf("Demo saved to Redis: %s (TTL: %d seconds)", demo.id, remainingSeconds);
        } catch (JsonProcessingException e) {
            LOG.errorf("Error serializing demo: %s", e.getMessage());
            // Still save to local cache
            localCache.put(demo.id, demo);
        } catch (Exception e) {
            LOG.warnf("Redis save failed, using local cache only: %s", e.getMessage());
            localCache.put(demo.id, demo);
        }
    }

    /**
     * Find demo by ID
     */
    public Optional<DemoDTO> findById(String id) {
        // Check local cache first
        DemoDTO demo = localCache.get(id);
        if (demo != null) {
            // Check if expired
            if (demo.isExpired() && !"EXPIRED".equals(demo.status)) {
                demo.expire();
                saveDemo(demo);
            }
            return Optional.of(demo);
        }

        // Try Redis
        try {
            String key = DEMO_PREFIX + id;
            String json = valueCommands.get(key);
            if (json != null) {
                demo = objectMapper.readValue(json, DemoDTO.class);
                localCache.put(id, demo);
                return Optional.of(demo);
            }
        } catch (Exception e) {
            LOG.warnf("Error reading demo from Redis: %s", e.getMessage());
        }

        return Optional.empty();
    }

    /**
     * Get all demos
     */
    public List<DemoDTO> findAll() {
        return new ArrayList<>(localCache.values()).stream()
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .collect(Collectors.toList());
    }

    /**
     * Get active (non-expired) demos
     */
    public List<DemoDTO> findAllActive() {
        return localCache.values().stream()
                .filter(d -> !"EXPIRED".equals(d.status) && !d.isExpired())
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .collect(Collectors.toList());
    }

    /**
     * Get running demos
     */
    public List<DemoDTO> findRunning() {
        return localCache.values().stream()
                .filter(d -> "RUNNING".equals(d.status) && !d.isExpired())
                .collect(Collectors.toList());
    }

    /**
     * Get expired demos (not yet marked as EXPIRED)
     */
    public List<DemoDTO> findExpired() {
        return localCache.values().stream()
                .filter(d -> d.isExpired() && !"EXPIRED".equals(d.status))
                .collect(Collectors.toList());
    }

    /**
     * Update demo
     */
    public DemoDTO updateDemo(DemoDTO demo) {
        demo.lastActivity = LocalDateTime.now();
        saveDemo(demo);
        return demo;
    }

    /**
     * Start demo
     */
    public Optional<DemoDTO> startDemo(String id) {
        return findById(id).map(demo -> {
            demo.status = "RUNNING";
            demo.lastActivity = LocalDateTime.now();
            saveDemo(demo);
            LOG.infof("Demo started: %s", demo.demoName);
            return demo;
        });
    }

    /**
     * Stop demo
     */
    public Optional<DemoDTO> stopDemo(String id) {
        return findById(id).map(demo -> {
            demo.status = "STOPPED";
            demo.lastActivity = LocalDateTime.now();
            saveDemo(demo);
            LOG.infof("Demo stopped: %s", demo.demoName);
            return demo;
        });
    }

    /**
     * Extend demo duration (admin only)
     */
    public Optional<DemoDTO> extendDemo(String id, int additionalMinutes) {
        return findById(id).map(demo -> {
            demo.extend(additionalMinutes);
            saveDemo(demo);
            LOG.infof("Demo extended: %s - now expires at %s", demo.demoName, demo.expiresAt);
            return demo;
        });
    }

    /**
     * Add transactions to demo
     */
    public Optional<DemoDTO> addTransactions(String id, long count, String merkleRoot) {
        return findById(id).map(demo -> {
            demo.addTransactions(count);
            if (merkleRoot != null) {
                demo.merkleRoot = merkleRoot;
            }
            saveDemo(demo);
            return demo;
        });
    }

    /**
     * Delete demo
     */
    public boolean deleteDemo(String id) {
        try {
            String key = DEMO_PREFIX + id;
            keyCommands.del(key);
            localCache.remove(id);
            LOG.infof("Demo deleted: %s", id);
            return true;
        } catch (Exception e) {
            LOG.warnf("Error deleting demo from Redis: %s", e.getMessage());
            localCache.remove(id);
            return true;
        }
    }

    /**
     * Count all demos
     */
    public long count() {
        return localCache.size();
    }

    /**
     * Count active demos
     */
    public long countActive() {
        return localCache.values().stream()
                .filter(d -> !"EXPIRED".equals(d.status) && !d.isExpired())
                .count();
    }

    /**
     * Scheduled task: Check and mark expired demos every minute
     */
    @Scheduled(every = "60s")
    void checkExpiredDemos() {
        List<DemoDTO> expiredDemos = findExpired();
        if (!expiredDemos.isEmpty()) {
            LOG.infof("Found %d expired demos, marking as EXPIRED", expiredDemos.size());
            for (DemoDTO demo : expiredDemos) {
                demo.expire();
                saveDemo(demo);
            }
        }
    }

    /**
     * Scheduled task: Auto-generate transactions for RUNNING demos every 5 seconds
     */
    @Scheduled(every = "5s")
    void autoGenerateTransactions() {
        List<DemoDTO> runningDemos = findRunning();
        if (!runningDemos.isEmpty()) {
            for (DemoDTO demo : runningDemos) {
                // Generate 1-5 random transactions per demo
                int txCount = (int) (Math.random() * 5) + 1;
                demo.addTransactions(txCount);
                saveDemo(demo);
            }
            LOG.debugf("Auto-generated transactions for %d running demos", runningDemos.size());
        }
    }

    /**
     * Scheduled task: Sync with Redis every 5 minutes
     */
    @Scheduled(every = "5m")
    void syncWithRedis() {
        try {
            loadDemosFromRedis();
            LOG.debugf("Synced with Redis: %d demos in cache", localCache.size());
        } catch (Exception e) {
            LOG.warnf("Redis sync failed: %s", e.getMessage());
        }
    }
}
