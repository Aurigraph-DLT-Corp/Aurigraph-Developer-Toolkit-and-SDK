package io.aurigraph.v11.grpc;

import io.grpc.ManagedChannel;
import io.grpc.netty.NettyChannelBuilder;
import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

/**
 * Connection Pool Manager for High-Performance gRPC
 * 
 * Provides:
 * - Efficient connection pooling and reuse
 * - Connection health monitoring
 * - Load balancing across connections
 * - Connection lifecycle management
 * - Performance metrics and monitoring
 * 
 * Performance Targets:
 * - 10,000+ concurrent connections
 * - Connection reuse rate >95%
 * - Health check latency <1ms
 * - Pool overhead <2% of total latency
 */
@ApplicationScoped
@Startup
public class ConnectionPoolManager {

    private static final Logger LOG = Logger.getLogger(ConnectionPoolManager.class);

    // Configuration
    @ConfigProperty(name = "grpc.pool.max-connections", defaultValue = "1000")
    int maxConnections;

    @ConfigProperty(name = "grpc.pool.min-connections", defaultValue = "10")
    int minConnections;

    @ConfigProperty(name = "grpc.pool.connection-timeout", defaultValue = "30")
    long connectionTimeoutSeconds;

    @ConfigProperty(name = "grpc.pool.health-check-interval", defaultValue = "10")
    long healthCheckIntervalSeconds;

    @ConfigProperty(name = "grpc.pool.max-idle-time", defaultValue = "300")
    long maxIdleTimeSeconds;

    // Connection pools organized by target (host:port)
    private final ConcurrentHashMap<String, ConnectionPool> connectionPools = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ManagedChannel> managedChannels = new ConcurrentHashMap<>();
    
    // Performance metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong totalConnectionTime = new AtomicLong(0);
    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final AtomicInteger poolMisses = new AtomicInteger(0);
    
    // Health monitoring
    private final ScheduledExecutorService healthCheckExecutor = 
        Executors.newScheduledThreadPool(2, r -> Thread.ofVirtual()
            .name("grpc-health-check")
            .start(r));

    // Thread safety
    private final ReadWriteLock poolLock = new ReentrantReadWriteLock();

    public void initialize() {
        LOG.info("Initializing ConnectionPoolManager");
        
        // Start health check monitoring
        healthCheckExecutor.scheduleAtFixedRate(
            this::performHealthChecks,
            healthCheckIntervalSeconds,
            healthCheckIntervalSeconds,
            TimeUnit.SECONDS
        );

        // Start idle connection cleanup
        healthCheckExecutor.scheduleAtFixedRate(
            this::cleanupIdleConnections,
            maxIdleTimeSeconds / 2,
            maxIdleTimeSeconds / 2,
            TimeUnit.SECONDS
        );

        LOG.infof("ConnectionPoolManager initialized - Max: %d, Min: %d connections",
                 maxConnections, minConnections);
    }

    /**
     * Gets or creates a connection to the specified target
     */
    public ManagedChannel getConnection(String host, int port) {
        String target = host + ":" + port;
        totalRequests.incrementAndGet();
        
        poolLock.readLock().lock();
        try {
            ConnectionPool pool = connectionPools.computeIfAbsent(target, 
                k -> new ConnectionPool(host, port));
            
            ManagedChannel channel = pool.borrowConnection();
            if (channel != null) {
                return channel;
            }
        } finally {
            poolLock.readLock().unlock();
        }
        
        // Pool miss - create new connection
        poolMisses.incrementAndGet();
        return createNewConnection(host, port);
    }

    /**
     * Returns a connection to the pool
     */
    public void returnConnection(String host, int port, ManagedChannel channel) {
        String target = host + ":" + port;
        
        poolLock.readLock().lock();
        try {
            ConnectionPool pool = connectionPools.get(target);
            if (pool != null) {
                pool.returnConnection(channel);
            }
        } finally {
            poolLock.readLock().unlock();
        }
    }

    /**
     * Registers a channel for management
     */
    public void registerChannel(String channelId, ManagedChannel channel) {
        managedChannels.put(channelId, channel);
        activeConnections.incrementAndGet();
        LOG.debugf("Registered channel %s", channelId);
    }

    /**
     * Creates a new optimized connection
     */
    private ManagedChannel createNewConnection(String host, int port) {
        long startTime = System.nanoTime();
        
        try {
            ManagedChannel channel = NettyChannelBuilder.forAddress(host, port)
                .keepAliveTime(30, TimeUnit.SECONDS)
                .keepAliveTimeout(5, TimeUnit.SECONDS)
                .keepAliveWithoutCalls(true)
                .maxInboundMessageSize(16 * 1024 * 1024)  // 16MB
                .initialFlowControlWindow(1024 * 1024)    // 1MB
                .usePlaintext()
                .build();

            long connectionTime = System.nanoTime() - startTime;
            totalConnectionTime.addAndGet(connectionTime);
            activeConnections.incrementAndGet();
            
            LOG.debugf("Created new connection to %s:%d in %.2fms", 
                      host, port, connectionTime / 1_000_000.0);
            
            return channel;
        } catch (Exception e) {
            LOG.errorf("Failed to create connection to %s:%d - %s", host, port, e.getMessage());
            throw new RuntimeException("Connection creation failed", e);
        }
    }

    /**
     * Performs health checks on all connections
     */
    private void performHealthChecks() {
        poolLock.readLock().lock();
        try {
            for (Map.Entry<String, ConnectionPool> entry : connectionPools.entrySet()) {
                String target = entry.getKey();
                ConnectionPool pool = entry.getValue();
                
                try {
                    pool.performHealthCheck();
                } catch (Exception e) {
                    LOG.warnf("Health check failed for target %s: %s", target, e.getMessage());
                }
            }
        } finally {
            poolLock.readLock().unlock();
        }
    }

    /**
     * Cleans up idle connections
     */
    private void cleanupIdleConnections() {
        poolLock.writeLock().lock();
        try {
            for (Map.Entry<String, ConnectionPool> entry : connectionPools.entrySet()) {
                entry.getValue().cleanupIdleConnections();
            }
        } finally {
            poolLock.writeLock().unlock();
        }
    }

    /**
     * Gets the number of active channels
     */
    public int getActiveChannelCount() {
        return activeConnections.get();
    }

    /**
     * Gets total number of requests
     */
    public long getTotalRequests() {
        return totalRequests.get();
    }

    /**
     * Gets average connection latency
     */
    public double getAverageLatency() {
        long requests = totalRequests.get();
        if (requests == 0) return 0.0;
        return (totalConnectionTime.get() / 1_000_000.0) / requests;
    }

    /**
     * Gets pool efficiency metrics
     */
    public PoolMetrics getPoolMetrics() {
        int totalConnections = connectionPools.values().stream()
            .mapToInt(ConnectionPool::getPoolSize)
            .sum();
        
        double hitRate = totalRequests.get() > 0 ? 
            1.0 - (poolMisses.get() / (double) totalRequests.get()) : 0.0;
        
        return new PoolMetrics(
            totalConnections,
            activeConnections.get(),
            hitRate,
            getAverageLatency(),
            connectionPools.size()
        );
    }

    /**
     * Gracefully shutdown all connections
     */
    public void shutdown() {
        LOG.info("Shutting down ConnectionPoolManager");
        
        healthCheckExecutor.shutdown();
        
        try {
            if (!healthCheckExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                healthCheckExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            healthCheckExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }

        poolLock.writeLock().lock();
        try {
            // Shutdown all connection pools
            for (ConnectionPool pool : connectionPools.values()) {
                pool.shutdown();
            }
            connectionPools.clear();

            // Shutdown managed channels
            for (ManagedChannel channel : managedChannels.values()) {
                try {
                    channel.shutdown();
                    if (!channel.awaitTermination(5, TimeUnit.SECONDS)) {
                        channel.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    channel.shutdownNow();
                    Thread.currentThread().interrupt();
                }
            }
            managedChannels.clear();
        } finally {
            poolLock.writeLock().unlock();
        }
        
        LOG.info("ConnectionPoolManager shutdown completed");
    }

    /**
     * Individual connection pool for a specific target
     */
    private class ConnectionPool {
        private final String host;
        private final int port;
        private final List<PooledConnection> availableConnections = new ArrayList<>();
        private final AtomicInteger poolSize = new AtomicInteger(0);
        private final AtomicLong lastUsed = new AtomicLong(System.currentTimeMillis());

        public ConnectionPool(String host, int port) {
            this.host = host;
            this.port = port;
            
            // Pre-create minimum connections
            for (int i = 0; i < minConnections; i++) {
                try {
                    ManagedChannel channel = createNewConnection(host, port);
                    availableConnections.add(new PooledConnection(channel));
                    poolSize.incrementAndGet();
                } catch (Exception e) {
                    LOG.warnf("Failed to pre-create connection %d for %s:%d", i, host, port);
                }
            }
        }

        public synchronized ManagedChannel borrowConnection() {
            lastUsed.set(System.currentTimeMillis());
            
            if (!availableConnections.isEmpty()) {
                PooledConnection pooled = availableConnections.remove(availableConnections.size() - 1);
                if (pooled.isHealthy()) {
                    return pooled.channel;
                } else {
                    // Connection is unhealthy, close it
                    pooled.channel.shutdown();
                    poolSize.decrementAndGet();
                }
            }
            
            return null; // Pool miss
        }

        public synchronized void returnConnection(ManagedChannel channel) {
            if (poolSize.get() < maxConnections && !channel.isShutdown()) {
                availableConnections.add(new PooledConnection(channel));
            } else {
                // Pool is full or channel is shutdown
                channel.shutdown();
                if (!channel.isShutdown()) {
                    poolSize.decrementAndGet();
                }
            }
        }

        public void performHealthCheck() {
            synchronized (this) {
                availableConnections.removeIf(conn -> {
                    if (!conn.isHealthy()) {
                        conn.channel.shutdown();
                        poolSize.decrementAndGet();
                        return true;
                    }
                    return false;
                });
            }
        }

        public void cleanupIdleConnections() {
            long currentTime = System.currentTimeMillis();
            long idleThreshold = currentTime - (maxIdleTimeSeconds * 1000);
            
            synchronized (this) {
                if (lastUsed.get() < idleThreshold && poolSize.get() > minConnections) {
                    // Remove excess connections
                    while (availableConnections.size() > minConnections && !availableConnections.isEmpty()) {
                        PooledConnection conn = availableConnections.remove(availableConnections.size() - 1);
                        conn.channel.shutdown();
                        poolSize.decrementAndGet();
                    }
                }
            }
        }

        public int getPoolSize() {
            return poolSize.get();
        }

        public void shutdown() {
            synchronized (this) {
                for (PooledConnection conn : availableConnections) {
                    conn.channel.shutdown();
                }
                availableConnections.clear();
                poolSize.set(0);
            }
        }
    }

    /**
     * Wrapper for pooled connections with health tracking
     */
    private static class PooledConnection {
        private final ManagedChannel channel;
        private final long createdAt;
        private volatile long lastHealthCheck;

        public PooledConnection(ManagedChannel channel) {
            this.channel = channel;
            this.createdAt = System.currentTimeMillis();
            this.lastHealthCheck = createdAt;
        }

        public boolean isHealthy() {
            long currentTime = System.currentTimeMillis();
            
            // Check if channel is shutdown
            if (channel.isShutdown() || channel.isTerminated()) {
                return false;
            }
            
            // Basic connectivity state check
            try {
                var state = channel.getState(false);
                lastHealthCheck = currentTime;
                return state != io.grpc.ConnectivityState.SHUTDOWN && 
                       state != io.grpc.ConnectivityState.TRANSIENT_FAILURE;
            } catch (Exception e) {
                return false;
            }
        }
    }

    /**
     * Pool performance metrics
     */
    public record PoolMetrics(
        int totalConnections,
        int activeConnections,
        double hitRate,
        double averageLatencyMs,
        int poolCount
    ) {}
}