package io.aurigraph.v11.grpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import io.aurigraph.v11.TransactionService;
import io.aurigraph.v11.grpc.AurigraphV11Proto.*;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Aurigraph V11 gRPC Service Implementation
 * High-performance gRPC endpoints for 2M+ TPS capability
 */
@GrpcService
public class AurigraphV11GrpcService implements AurigraphV11Service {

    private static final Logger LOG = Logger.getLogger(AurigraphV11GrpcService.class);

    private final AtomicLong grpcRequestCounter = new AtomicLong(0);
    private final Instant startupTime = Instant.now();

    @Inject
    TransactionService transactionService;

    @Override
    public Uni<HealthResponse> getHealth(Empty request) {
        long uptime = Instant.now().getEpochSecond() - startupTime.getEpochSecond();
        long requests = grpcRequestCounter.incrementAndGet();
        
        LOG.debugf("gRPC Health check - Uptime: %ds, Requests: %d", uptime, requests);
        
        return Uni.createFrom().item(HealthResponse.newBuilder()
            .setStatus("HEALTHY")
            .setVersion("11.0.0-grpc")
            .setUptimeSeconds(uptime)
            .setTotalRequests(requests)
            .setPlatform("Java/Quarkus/gRPC/GraalVM")
            .build());
    }

    @Override
    public Uni<SystemInfoResponse> getSystemInfo(Empty request) {
        return Uni.createFrom().item(SystemInfoResponse.newBuilder()
            .setName("Aurigraph V11 gRPC Nexus")
            .setVersion("11.0.0")
            .setJavaVersion("Java " + System.getProperty("java.version"))
            .setFramework("Quarkus + gRPC + Native")
            .setOsName(System.getProperty("os.name"))
            .setOsArch(System.getProperty("os.arch"))
            .build());
    }

    @Override
    public Uni<TransactionResponse> submitTransaction(TransactionRequest request) {
        return transactionService.processTransactionReactive(request.getId(), request.getAmount())
            .map(hash -> TransactionResponse.newBuilder()
                .setId(request.getId())
                .setHash(hash)
                .setAmount(request.getAmount())
                .setTimestamp(System.currentTimeMillis())
                .setStatus("CONFIRMED")
                .build())
            .onFailure().recoverWithItem(failure -> {
                LOG.errorf("Transaction failed: %s", failure.getMessage());
                return TransactionResponse.newBuilder()
                    .setId(request.getId())
                    .setStatus("FAILED")
                    .setError(failure.getMessage())
                    .build();
            });
    }

    @Override
    public Uni<BatchTransactionResponse> batchSubmitTransactions(BatchTransactionRequest request) {
        long startTime = System.nanoTime();
        
        Multi<TransactionService.TransactionRequest> requests = Multi.createFrom()
            .iterable(request.getTransactionsList())
            .map(tx -> new TransactionService.TransactionRequest(tx.getId(), tx.getAmount()));
        
        return transactionService.batchProcessTransactions(requests.collect().asList().await().indefinitely())
            .collect().asList()
            .map(hashes -> {
                long endTime = System.nanoTime();
                double processingTimeMs = (endTime - startTime) / 1_000_000.0;
                
                BatchTransactionResponse.Builder response = BatchTransactionResponse.newBuilder()
                    .setSuccessfulCount(hashes.size())
                    .setFailedCount(request.getTransactionsCount() - hashes.size())
                    .setProcessingTimeMs(processingTimeMs);
                
                // Add individual transaction responses
                for (int i = 0; i < hashes.size(); i++) {
                    TransactionRequest originalTx = request.getTransactions(i);
                    response.addTransactions(TransactionResponse.newBuilder()
                        .setId(originalTx.getId())
                        .setHash(hashes.get(i))
                        .setAmount(originalTx.getAmount())
                        .setTimestamp(System.currentTimeMillis())
                        .setStatus("CONFIRMED")
                        .build());
                }
                
                LOG.infof("Batch processed %d transactions in %.2fms", 
                         hashes.size(), processingTimeMs);
                
                return response.build();
            });
    }

    @Override
    public Uni<TransactionResponse> getTransaction(GetTransactionRequest request) {
        TransactionService.Transaction tx = transactionService.getTransaction(request.getTransactionId());
        
        if (tx == null) {
            return Uni.createFrom().failure(Status.NOT_FOUND
                .withDescription("Transaction not found: " + request.getTransactionId())
                .asRuntimeException());
        }
        
        return Uni.createFrom().item(TransactionResponse.newBuilder()
            .setId(tx.id())
            .setHash(tx.hash())
            .setAmount(tx.amount())
            .setTimestamp(tx.timestamp())
            .setStatus(tx.status())
            .build());
    }

    @Override
    public Multi<TransactionResponse> getTransactionStream(TransactionStreamRequest request) {
        // Implementation for streaming transactions
        // This would typically stream from a transaction log or database
        LOG.infof("Starting transaction stream with filter: %s", request.getFilter());
        
        return Multi.createFrom().range(1, 11) // Demo with 10 mock transactions
            .map(i -> TransactionResponse.newBuilder()
                .setId("stream_tx_" + i)
                .setHash("hash_" + i)
                .setAmount(i * 100.0)
                .setTimestamp(System.currentTimeMillis())
                .setStatus("CONFIRMED")
                .build())
            .onItem().delayIt().by(java.time.Duration.ofMillis(100));
    }

    @Override
    public Uni<PerformanceStatsResponse> getPerformanceStats(Empty request) {
        TransactionService.ProcessingStats stats = transactionService.getStats();
        
        return Uni.createFrom().item(PerformanceStatsResponse.newBuilder()
            .setTotalProcessed(stats.totalProcessed())
            .setStoredTransactions(stats.storedTransactions())
            .setMemoryUsed(stats.memoryUsed())
            .setAvailableProcessors(stats.availableProcessors())
            .setShardCount(stats.shardCount())
            .setConsensusEnabled(stats.consensusEnabled())
            .setConsensusAlgorithm(stats.consensusAlgorithm())
            .setCurrentTps(0) // Would be calculated from metrics
            .setTargetTps(2000000) // 2M+ TPS target
            .build());
    }

    @Override
    public Uni<PerformanceTestResponse> runPerformanceTest(PerformanceTestRequest request) {
        long startTime = System.nanoTime();
        
        return Uni.createFrom().item(() -> {
            // Run performance test with specified parameters
            int iterations = request.getTransactionCount();
            
            for (int i = 0; i < iterations; i++) {
                String txId = "grpc_perf_" + i;
                transactionService.processTransaction(txId, Math.random() * 1000);
            }
            
            long endTime = System.nanoTime();
            double durationMs = (endTime - startTime) / 1_000_000.0;
            double tps = (iterations * 1000.0) / durationMs;
            boolean targetAchieved = tps >= 2000000; // 2M+ TPS target
            
            LOG.infof("gRPC Performance test: %d transactions in %.2fms (%.0f TPS)", 
                     iterations, durationMs, tps);
            
            return PerformanceTestResponse.newBuilder()
                .setIterations(iterations)
                .setDurationMs(durationMs)
                .setTransactionsPerSecond(tps)
                .setNsPerTransaction((endTime - startTime) / iterations)
                .setOptimizations("gRPC + Virtual Threads + Sharding")
                .setTargetAchieved(targetAchieved)
                .build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    @Override
    public Uni<ConsensusResponse> initiateConsensus(ConsensusRequest request) {
        // Mock consensus implementation - would integrate with HyperRAFT++
        LOG.infof("Consensus request from node %s, term %d", 
                 request.getNodeId(), request.getTerm());
        
        return Uni.createFrom().item(ConsensusResponse.newBuilder()
            .setNodeId("aurigraph-v11-node")
            .setTerm(request.getTerm() + 1)
            .setSuccess(true)
            .setResult("CONSENSUS_ACHIEVED")
            .setState(ConsensusState.LEADER)
            .build());
    }

    @Override
    public Multi<ConsensusMessage> consensusStream(Multi<ConsensusMessage> request) {
        // Bidirectional streaming for consensus protocol
        return request
            .onItem().transform(msg -> {
                LOG.debugf("Received consensus message from %s: %s", 
                          msg.getNodeId(), msg.getType());
                
                // Echo back with processed response
                return ConsensusMessage.newBuilder()
                    .setNodeId("aurigraph-v11-node")
                    .setTerm(msg.getTerm())
                    .setData("PROCESSED: " + msg.getData())
                    .setType(ConsensusMessageType.APPEND_RESPONSE)
                    .setTimestamp(System.currentTimeMillis())
                    .build();
            })
            .onFailure().recoverWithItem(failure -> {
                LOG.errorf("Consensus stream error: %s", failure.getMessage());
                return ConsensusMessage.newBuilder()
                    .setNodeId("aurigraph-v11-node")
                    .setType(ConsensusMessageType.APPEND_RESPONSE)
                    .setData("ERROR: " + failure.getMessage())
                    .setTimestamp(System.currentTimeMillis())
                    .build();
            });
    }
}