package io.aurigraph.v11;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Liveness;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

/**
 * Aurigraph V11 REST Resource
 * High-performance Java/Quarkus implementation
 */
@Path("/api/v11")
@ApplicationScoped
public class AurigraphResource {

    private static final Logger LOG = Logger.getLogger(AurigraphResource.class);
    
    private final AtomicLong requestCounter = new AtomicLong(0);
    private final Instant startupTime = Instant.now();
    
    @ConfigProperty(name = "aurigraph.performance.target-tps", defaultValue = "2000000")
    long targetTPS;

    @Inject
    TransactionService transactionService;

    @GET
    @Path("/health")
    @Produces(MediaType.APPLICATION_JSON)
    public HealthStatus health() {
        long uptime = Instant.now().getEpochSecond() - startupTime.getEpochSecond();
        long requests = requestCounter.incrementAndGet();
        
        LOG.infof("Health check requested - Uptime: %ds, Requests: %d", uptime, requests);
        
        return new HealthStatus(
            "HEALTHY",
            "11.0.0-standalone",
            uptime,
            requests,
            "Java/Quarkus/GraalVM"
        );
    }

    @GET
    @Path("/info")
    @Produces(MediaType.APPLICATION_JSON)
    public SystemInfo info() {
        return new SystemInfo(
            "Aurigraph V11 Java Nexus",
            "11.0.0",
            "Java " + System.getProperty("java.version"),
            "Quarkus Native Ready",
            System.getProperty("os.name"),
            System.getProperty("os.arch")
        );
    }

    @GET
    @Path("/performance")
    @Produces(MediaType.APPLICATION_JSON)
    public PerformanceStats performanceTest(@DefaultValue("100000") @QueryParam("iterations") int iterations,
                                          @DefaultValue("1") @QueryParam("threads") int threadCount) {
        long startTime = System.nanoTime();
        
        // Enhanced parallel processing with virtual threads
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        int transactionsPerThread = iterations / threadCount;
        
        for (int t = 0; t < threadCount; t++) {
            final int threadId = t;
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                for (int i = 0; i < transactionsPerThread; i++) {
                    String txId = "tx_perf_t" + threadId + "_" + i;
                    transactionService.processTransaction(txId, Math.random() * 1000);
                }
            }, r -> Thread.startVirtualThread(r));
            futures.add(future);
        }
        
        // Wait for all threads to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        
        long endTime = System.nanoTime();
        long durationNs = endTime - startTime;
        double durationMs = durationNs / 1_000_000.0;
        double tps = (iterations * 1000.0) / durationMs;
        boolean targetAchieved = tps >= targetTPS;
        
        LOG.infof("Performance test: %d transactions in %.2fms (%.0f TPS) - Target: %d TPS %s", 
                 iterations, durationMs, tps, targetTPS, targetAchieved ? "ACHIEVED" : "NOT ACHIEVED");
        
        return new PerformanceStats(
            iterations,
            durationMs,
            tps,
            durationNs / iterations, // ns per transaction
            "Java/Quarkus + Virtual Threads",
            threadCount,
            targetTPS,
            targetAchieved
        );
    }
    
    @GET
    @Path("/performance/reactive")
    @Produces(MediaType.APPLICATION_JSON)
    public Uni<PerformanceStats> reactivePerformanceTest(@DefaultValue("100000") @QueryParam("iterations") int iterations) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            
            // Use reactive streams for better performance
            List<TransactionService.TransactionRequest> requests = new ArrayList<>();
            for (int i = 0; i < iterations; i++) {
                requests.add(new TransactionService.TransactionRequest(
                    "tx_reactive_" + i, Math.random() * 1000));
            }
            
            // Process reactively
            List<String> results = transactionService.batchProcessTransactions(requests)
                .collect().asList()
                .await().atMost(java.time.Duration.ofSeconds(30));
            
            long endTime = System.nanoTime();
            long durationNs = endTime - startTime;
            double durationMs = durationNs / 1_000_000.0;
            double tps = (iterations * 1000.0) / durationMs;
            boolean targetAchieved = tps >= targetTPS;
            
            LOG.infof("Reactive performance test: %d transactions in %.2fms (%.0f TPS) - Results: %d", 
                     iterations, durationMs, tps, results.size());
            
            return new PerformanceStats(
                iterations,
                durationMs,
                tps,
                durationNs / iterations,
                "Reactive Streams + Virtual Threads",
                1, // reactive single stream
                targetTPS,
                targetAchieved
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
    
    @GET
    @Path("/stats")
    @Produces(MediaType.APPLICATION_JSON)
    public TransactionService.ProcessingStats getTransactionStats() {
        return transactionService.getStats();
    }

    // Health Check for Quarkus
    @Liveness
    @ApplicationScoped
    static class LivenessCheck implements HealthCheck {
        @Override
        public HealthCheckResponse call() {
            return HealthCheckResponse.up("Aurigraph V11 is running");
        }
    }

    // Data classes for responses
    public record HealthStatus(
        String status,
        String version,
        long uptimeSeconds,
        long totalRequests,
        String platform
    ) {}

    public record SystemInfo(
        String name,
        String version,
        String javaVersion,
        String framework,
        String osName,
        String osArch
    ) {}

    public record PerformanceStats(
        int iterations,
        double durationMs,
        double transactionsPerSecond,
        double nsPerTransaction,
        String optimizations,
        int threadCount,
        long targetTPS,
        boolean targetAchieved
    ) {}
}
