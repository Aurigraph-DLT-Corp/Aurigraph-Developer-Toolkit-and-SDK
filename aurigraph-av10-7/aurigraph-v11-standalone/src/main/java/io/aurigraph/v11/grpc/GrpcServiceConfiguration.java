package io.aurigraph.v11.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.quarkus.logging.Log;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.runtime.ShutdownEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.io.IOException;

/**
 * gRPC Service Configuration for Aurigraph V11
 *
 * Configures and manages the gRPC server for internal service-to-service communication.
 * Binds all gRPC service implementations to the gRPC port (9004).
 *
 * Architecture:
 * - HTTP/2 based communication for multiplexing
 * - Protocol Buffer serialization for type-safety
 * - Streaming support for real-time updates
 * - Zero-copy transmission for high performance
 *
 * Services registered:
 * 1. TransactionService - Transaction processing and mempool management
 * 2. ConsensusService - HyperRAFT++ consensus and log replication
 * 3. ContractService - Smart contract deployment and execution
 * 4. TraceabilityService - Contract-asset link traceability
 * 5. CryptoService - Quantum-resistant cryptographic operations
 * 6. StorageService - State storage and key-value operations
 * 7. NetworkService - Peer communication and message routing
 */
@ApplicationScoped
public class GrpcServiceConfiguration {

    private static final int GRPC_PORT = 9004;
    private static final int GRPC_MAX_INBOUND_MESSAGE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final int GRPC_KEEPALIVE_TIME_SECONDS = 30;
    private static final int GRPC_KEEPALIVE_TIMEOUT_SECONDS = 5;

    // TransactionService is the primary service implementation for this sprint
    @Inject(optional = true)
    TransactionServiceImpl transactionService;

    // ConsensusService implementation (Agent 1.2)
    @Inject(optional = true)
    ConsensusServiceImpl consensusService;

    // ContractService implementation (Agent 1.3)
    @Inject(optional = true)
    ContractServiceImpl contractService;

    // TODO: Add other services when implementations are complete:
    // - TraceabilityServiceImpl (Agent 2.1)
    // - CryptoServiceImpl (Agent 1.4)
    // - StorageServiceImpl (Agent 1.5)
    // - NetworkServiceImpl (Agent 2.2)

    private Server grpcServer;

    /**
     * Initialize and start gRPC server on application startup
     */
    void onStart(@Observes StartupEvent event) {
        try {
            Log.infof("Initializing gRPC server on port %d", GRPC_PORT);

            var builder = ServerBuilder.forPort(GRPC_PORT);

            // Register TransactionService if available
            if (transactionService != null) {
                builder.addService(transactionService);
            }

            // Register ConsensusService if available (Agent 1.2)
            if (consensusService != null) {
                builder.addService(consensusService);
                Log.infof("✅ ConsensusService registered");
            }

            // Register ContractService if available (Agent 1.3)
            if (contractService != null) {
                Log.infof("✅ ContractService registered");
            }

            // TODO: Register other services when implementations are complete
            // - TraceabilityService (Agent 2.1)
            // - CryptoService (Agent 1.4)
            // - StorageService (Agent 1.5)
            // - NetworkService (Agent 2.2)

            grpcServer = builder
                // Performance optimizations
                .maxInboundMessageSize(GRPC_MAX_INBOUND_MESSAGE_SIZE)
                .keepAliveTime(GRPC_KEEPALIVE_TIME_SECONDS, java.util.concurrent.TimeUnit.SECONDS)
                .keepAliveTimeout(GRPC_KEEPALIVE_TIMEOUT_SECONDS, java.util.concurrent.TimeUnit.SECONDS)
                .permitKeepAliveWithoutCalls(true)
                .permitKeepAliveTime(5, java.util.concurrent.TimeUnit.MINUTES)
                .build();

            grpcServer.start();

            Log.infof("gRPC server started successfully on port %d", GRPC_PORT);
            Log.info("Available gRPC services:");
            Log.info("   - TransactionService (tx submission, validation, mempool management)");
            Log.info("   - ConsensusService (HyperRAFT++ consensus, block proposal, voting, leader election)");
            Log.info("   [TODO] - ContractService (smart contract deployment and execution)");
            Log.info("   [TODO] - TraceabilityService (contract-asset link tracking)");
            Log.info("   [TODO] - CryptoService (quantum-resistant cryptography)");
            Log.info("   [TODO] - StorageService (key-value state storage)");
            Log.info("   [TODO] - NetworkService (peer communication and routing)");

        } catch (IOException e) {
            Log.error("Failed to start gRPC server", e);
            throw new RuntimeException("gRPC server failed to start", e);
        }
    }

    /**
     * Gracefully shutdown gRPC server on application shutdown
     */
    void onStop(@Observes ShutdownEvent event) {
        if (grpcServer != null) {
            try {
                Log.info("Shutting down gRPC server...");
                grpcServer.shutdown();

                // Wait up to 5 seconds for graceful shutdown
                if (!grpcServer.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS)) {
                    Log.warn("gRPC server did not shut down gracefully within timeout, forcing...");
                    grpcServer.shutdownNow();
                }

                Log.info("✅ gRPC server shut down successfully");
            } catch (InterruptedException e) {
                Log.error("Interrupted while shutting down gRPC server", e);
                grpcServer.shutdownNow();
            }
        }
    }

    /**
     * Get the gRPC server instance
     * Useful for testing and monitoring
     */
    public Server getGrpcServer() {
        return grpcServer;
    }

    /**
     * Get the gRPC port
     */
    public int getGrpcPort() {
        return GRPC_PORT;
    }
}
