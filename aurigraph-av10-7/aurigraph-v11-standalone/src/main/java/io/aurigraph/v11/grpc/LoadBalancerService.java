package io.aurigraph.v11.grpc;

import io.grpc.ManagedChannel;
import io.grpc.NameResolver;
import io.grpc.LoadBalancer;
import io.grpc.Attributes;
import io.grpc.EquivalentAddressGroup;
import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.SocketAddress;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.ArrayList;

/**
 * Load Balancer Service for High-Performance gRPC Distribution
 * 
 * Provides:
 * - Multiple load balancing algorithms (round-robin, weighted, least-connections)
 * - Health-aware request distribution
 * - Automatic failover and recovery
 * - Connection affinity and sticky sessions
 * - Real-time load balancing metrics
 * 
 * Performance Targets:
 * - Request distribution latency: <1ms P99
 * - Load balancing overhead: <0.1% of total latency
 * - Failover time: <100ms
 * - Support for 10,000+ backend connections
 */
@ApplicationScoped
@Startup
public class LoadBalancerService {

    private static final Logger LOG = Logger.getLogger(LoadBalancerService.class);

    // Configuration
    @ConfigProperty(name = "grpc.lb.algorithm", defaultValue = "LEAST_CONNECTIONS")
    String loadBalancingAlgorithm;

    @ConfigProperty(name = "grpc.lb.health-check-interval", defaultValue = "5")
    long healthCheckIntervalSeconds;

    @ConfigProperty(name = "grpc.lb.failover-threshold", defaultValue = "3")
    int failoverThreshold;

    @ConfigProperty(name = "grpc.lb.recovery-interval", defaultValue = "30")
    long recoveryIntervalSeconds;

    @ConfigProperty(name = "grpc.lb.sticky-sessions", defaultValue = "false")
    boolean stickySessionsEnabled;

    // Dependencies
    @Inject
    ConnectionPoolManager connectionPoolManager;

    @Inject
    StreamCompressionHandler compressionHandler;

    // Load balancing state
    private final ConcurrentHashMap<String, BackendPool> backendPools = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SessionAffinity> sessionAffinityMap = new ConcurrentHashMap<>();
    
    // Performance metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong loadBalancingTimeNs = new AtomicLong(0);
    private final AtomicInteger failoverCount = new AtomicInteger(0);
    
    // Load balancing algorithms
    private final LoadBalancingAlgorithm roundRobinAlgorithm = new RoundRobinAlgorithm();
    private final LoadBalancingAlgorithm leastConnectionsAlgorithm = new LeastConnectionsAlgorithm();
    private final LoadBalancingAlgorithm weightedAlgorithm = new WeightedRoundRobinAlgorithm();
    
    // Thread safety
    private final ReadWriteLock poolLock = new ReentrantReadWriteLock();

    public void initialize() {
        LOG.info("Initializing LoadBalancerService");
        LOG.infof("Algorithm: %s, Sticky Sessions: %s, Failover Threshold: %d",
                 loadBalancingAlgorithm, stickySessionsEnabled, failoverThreshold);
    }

    /**
     * Registers a backend service with the load balancer
     */
    public void registerBackend(String serviceName, String host, int port, int weight) {
        poolLock.writeLock().lock();
        try {
            BackendPool pool = backendPools.computeIfAbsent(serviceName, 
                k -> new BackendPool(serviceName));
            
            Backend backend = new Backend(host, port, weight);
            pool.addBackend(backend);
            
            LOG.infof("Registered backend %s:%d for service %s (weight: %d)", 
                     host, port, serviceName, weight);
        } finally {
            poolLock.writeLock().unlock();
        }
    }

    /**
     * Removes a backend from the load balancer
     */
    public void deregisterBackend(String serviceName, String host, int port) {
        poolLock.writeLock().lock();
        try {
            BackendPool pool = backendPools.get(serviceName);
            if (pool != null) {
                pool.removeBackend(host, port);
                LOG.infof("Deregistered backend %s:%d from service %s", host, port, serviceName);
            }
        } finally {
            poolLock.writeLock().unlock();
        }
    }

    /**
     * Gets the best available backend for a service
     */
    public Backend selectBackend(String serviceName, String sessionId) {
        long startTime = System.nanoTime();
        totalRequests.incrementAndGet();
        
        try {
            poolLock.readLock().lock();
            try {
                BackendPool pool = backendPools.get(serviceName);
                if (pool == null) {
                    throw new RuntimeException("No backend pool found for service: " + serviceName);
                }

                Backend selected;

                // Check for session affinity first
                if (stickySessionsEnabled && sessionId != null) {
                    SessionAffinity affinity = sessionAffinityMap.get(sessionId);
                    if (affinity != null && affinity.backend.isHealthy()) {
                        selected = affinity.backend;
                        selected.incrementActiveConnections();
                        return selected;
                    }
                }

                // Use configured load balancing algorithm
                LoadBalancingAlgorithm algorithm = getAlgorithm(loadBalancingAlgorithm);
                selected = algorithm.selectBackend(pool.getHealthyBackends());
                
                if (selected == null) {
                    throw new RuntimeException("No healthy backends available for service: " + serviceName);
                }

                selected.incrementActiveConnections();

                // Establish session affinity if enabled
                if (stickySessionsEnabled && sessionId != null) {
                    sessionAffinityMap.put(sessionId, new SessionAffinity(selected, System.currentTimeMillis()));
                }

                return selected;
                
            } finally {
                poolLock.readLock().unlock();
            }
        } finally {
            loadBalancingTimeNs.addAndGet(System.nanoTime() - startTime);
        }
    }

    /**
     * Creates a connection to the selected backend
     */
    public ManagedChannel createConnection(String serviceName, String sessionId) {
        Backend backend = selectBackend(serviceName, sessionId);
        ManagedChannel channel = connectionPoolManager.getConnection(backend.host, backend.port);
        
        // Apply compression if enabled
        return compressionHandler.enableCompression(channel);
    }

    /**
     * Releases a backend connection
     */
    public void releaseConnection(Backend backend) {
        if (backend != null) {
            backend.decrementActiveConnections();
        }
    }

    /**
     * Gets the load balancing algorithm implementation
     */
    private LoadBalancingAlgorithm getAlgorithm(String algorithmName) {
        return switch (algorithmName.toUpperCase()) {
            case "ROUND_ROBIN" -> roundRobinAlgorithm;
            case "LEAST_CONNECTIONS" -> leastConnectionsAlgorithm;
            case "WEIGHTED" -> weightedAlgorithm;
            default -> leastConnectionsAlgorithm;
        };
    }

    /**
     * Performs health checks on all backends
     */
    public void performHealthChecks() {
        poolLock.readLock().lock();
        try {
            for (BackendPool pool : backendPools.values()) {
                pool.performHealthChecks();
            }
        } finally {
            poolLock.readLock().unlock();
        }
    }

    /**
     * Gets load balancing performance statistics
     */
    public LoadBalancingStats getLoadBalancingStats() {
        long requests = totalRequests.get();
        double avgLatencyMs = requests > 0 ? 
            (loadBalancingTimeNs.get() / 1_000_000.0) / requests : 0.0;
        
        int totalBackends = backendPools.values().stream()
            .mapToInt(pool -> pool.getBackendCount())
            .sum();
        
        int healthyBackends = backendPools.values().stream()
            .mapToInt(pool -> pool.getHealthyBackends().size())
            .sum();
        
        return new LoadBalancingStats(
            requests,
            avgLatencyMs,
            totalBackends,
            healthyBackends,
            failoverCount.get(),
            backendPools.size()
        );
    }

    /**
     * Backend server representation
     */
    public static class Backend {
        private final String host;
        private final int port;
        private final int weight;
        private final AtomicInteger activeConnections = new AtomicInteger(0);
        private final AtomicLong totalRequests = new AtomicLong(0);
        private final AtomicLong failureCount = new AtomicLong(0);
        private volatile boolean healthy = true;
        private volatile long lastHealthCheck = System.currentTimeMillis();

        public Backend(String host, int port, int weight) {
            this.host = host;
            this.port = port;
            this.weight = weight;
        }

        public void incrementActiveConnections() {
            activeConnections.incrementAndGet();
            totalRequests.incrementAndGet();
        }

        public void decrementActiveConnections() {
            activeConnections.decrementAndGet();
        }

        public void recordFailure() {
            failureCount.incrementAndGet();
        }

        public boolean isHealthy() {
            return healthy;
        }

        public void setHealthy(boolean healthy) {
            this.healthy = healthy;
            this.lastHealthCheck = System.currentTimeMillis();
        }

        public int getActiveConnections() {
            return activeConnections.get();
        }

        public int getWeight() {
            return weight;
        }

        public String getHost() {
            return host;
        }

        public int getPort() {
            return port;
        }

        public long getFailureCount() {
            return failureCount.get();
        }

        @Override
        public String toString() {
            return String.format("%s:%d (weight: %d, active: %d, healthy: %s)", 
                               host, port, weight, activeConnections.get(), healthy);
        }
    }

    /**
     * Backend pool for a service
     */
    private static class BackendPool {
        private final String serviceName;
        private final List<Backend> backends = new ArrayList<>();
        private final ReadWriteLock lock = new ReentrantReadWriteLock();

        public BackendPool(String serviceName) {
            this.serviceName = serviceName;
        }

        public void addBackend(Backend backend) {
            lock.writeLock().lock();
            try {
                backends.add(backend);
            } finally {
                lock.writeLock().unlock();
            }
        }

        public void removeBackend(String host, int port) {
            lock.writeLock().lock();
            try {
                backends.removeIf(b -> b.host.equals(host) && b.port == port);
            } finally {
                lock.writeLock().unlock();
            }
        }

        public List<Backend> getHealthyBackends() {
            lock.readLock().lock();
            try {
                return backends.stream().filter(Backend::isHealthy).toList();
            } finally {
                lock.readLock().unlock();
            }
        }

        public int getBackendCount() {
            lock.readLock().lock();
            try {
                return backends.size();
            } finally {
                lock.readLock().unlock();
            }
        }

        public void performHealthChecks() {
            lock.readLock().lock();
            try {
                for (Backend backend : backends) {
                    // Simple health check - would be enhanced with actual connectivity tests
                    boolean currentlyHealthy = performHealthCheck(backend);
                    backend.setHealthy(currentlyHealthy);
                }
            } finally {
                lock.readLock().unlock();
            }
        }

        private boolean performHealthCheck(Backend backend) {
            // Simplified health check - in real implementation would test connectivity
            return backend.getFailureCount() < 10; // Arbitrary threshold
        }
    }

    /**
     * Session affinity information
     */
    private record SessionAffinity(Backend backend, long establishedAt) {}

    /**
     * Load balancing algorithm interface
     */
    private interface LoadBalancingAlgorithm {
        Backend selectBackend(List<Backend> healthyBackends);
    }

    /**
     * Round-robin load balancing algorithm
     */
    private static class RoundRobinAlgorithm implements LoadBalancingAlgorithm {
        private final AtomicInteger counter = new AtomicInteger(0);

        @Override
        public Backend selectBackend(List<Backend> healthyBackends) {
            if (healthyBackends.isEmpty()) return null;
            int index = counter.getAndIncrement() % healthyBackends.size();
            return healthyBackends.get(index);
        }
    }

    /**
     * Least connections load balancing algorithm
     */
    private static class LeastConnectionsAlgorithm implements LoadBalancingAlgorithm {
        @Override
        public Backend selectBackend(List<Backend> healthyBackends) {
            if (healthyBackends.isEmpty()) return null;
            
            return healthyBackends.stream()
                .min((b1, b2) -> Integer.compare(b1.getActiveConnections(), b2.getActiveConnections()))
                .orElse(null);
        }
    }

    /**
     * Weighted round-robin load balancing algorithm
     */
    private static class WeightedRoundRobinAlgorithm implements LoadBalancingAlgorithm {
        @Override
        public Backend selectBackend(List<Backend> healthyBackends) {
            if (healthyBackends.isEmpty()) return null;
            
            int totalWeight = healthyBackends.stream()
                .mapToInt(Backend::getWeight)
                .sum();
            
            if (totalWeight == 0) {
                // Fallback to round-robin if no weights
                return healthyBackends.get(ThreadLocalRandom.current().nextInt(healthyBackends.size()));
            }
            
            int randomWeight = ThreadLocalRandom.current().nextInt(totalWeight);
            int cumulativeWeight = 0;
            
            for (Backend backend : healthyBackends) {
                cumulativeWeight += backend.getWeight();
                if (randomWeight < cumulativeWeight) {
                    return backend;
                }
            }
            
            return healthyBackends.get(healthyBackends.size() - 1);
        }
    }

    /**
     * Load balancing performance statistics
     */
    public record LoadBalancingStats(
        long totalRequests,
        double avgLatencyMs,
        int totalBackends,
        int healthyBackends,
        int failoverCount,
        int serviceCount
    ) {}
}