package io.aurigraph.v11.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.quarkus.logging.Log;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.runtime.ShutdownEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.inject.Instance;
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
    @Inject
    Instance<TransactionServiceImpl> transactionServiceInstance;

    // ConsensusService implementation (Agent 1.2)
    @Inject
    Instance<ConsensusServiceImpl> consensusServiceInstance;

    // ContractService implementation (Agent 1.3)
    @Inject
    Instance<ContractServiceImpl> contractServiceInstance;

    // CryptoService implementation (Agent 1.4)
    @Inject
    Instance<CryptoServiceImpl> cryptoServiceInstance;

    // StorageService implementation (Agent 1.5)
    @Inject
    Instance<StorageServiceImpl> storageServiceInstance;

    // TraceabilityService implementation (Agent 2.1)
    @Inject
    Instance<TraceabilityServiceImpl> traceabilityServiceInstance;

    // NetworkService implementation (Agent 2.2)
    @Inject
    Instance<NetworkServiceImpl> networkServiceInstance;

    // BlockchainService implementation (Agent B)
    @Inject
    Instance<BlockchainServiceImpl> blockchainServiceInstance;

    // gRPC Interceptors
    @Inject
    Instance<AuthorizationInterceptor> authorizationInterceptorInstance;

    @Inject
    Instance<LoggingInterceptor> loggingInterceptorInstance;

    @Inject
    Instance<MetricsInterceptor> metricsInterceptorInstance;

    @Inject
    Instance<ExceptionInterceptor> exceptionInterceptorInstance;

    private Server grpcServer;

    /**
     * Initialize and start gRPC server on application startup
     */
    void onStart(@Observes StartupEvent event) {
        try {
            Log.infof("Initializing gRPC server on port %d", GRPC_PORT);

            var builder = ServerBuilder.forPort(GRPC_PORT);

            // Register TransactionService if available
            if (transactionServiceInstance.isResolvable()) {
                builder.addService(transactionServiceInstance.get());
                Log.infof("✅ TransactionService registered");
            }

            // Register ConsensusService if available (Agent 1.2)
            if (consensusServiceInstance.isResolvable()) {
                builder.addService(consensusServiceInstance.get());
                Log.infof("✅ ConsensusService registered");
            }

            // Register ContractService if available (Agent 1.3)
            if (contractServiceInstance.isResolvable()) {
                builder.addService(contractServiceInstance.get());
                Log.infof("✅ ContractService registered");
            }

            // Register CryptoService if available (Agent 1.4)
            if (cryptoServiceInstance.isResolvable()) {
                builder.addService(cryptoServiceInstance.get());
                Log.infof("✅ CryptoService registered");
            }

            // Register StorageService if available (Agent 1.5)
            if (storageServiceInstance.isResolvable()) {
                builder.addService(storageServiceInstance.get());
                Log.infof("✅ StorageService registered");
            }

            // Register TraceabilityService if available (Agent 2.1)
            if (traceabilityServiceInstance.isResolvable()) {
                builder.addService(traceabilityServiceInstance.get());
                Log.infof("✅ TraceabilityService registered");
            }

            // Register NetworkService if available (Agent 2.2)
            if (networkServiceInstance.isResolvable()) {
                builder.addService(networkServiceInstance.get());
                Log.infof("✅ NetworkService registered");
            }

            // Register BlockchainService if available (Agent B)
            if (blockchainServiceInstance.isResolvable()) {
                builder.addService(blockchainServiceInstance.get());
                Log.infof("✅ BlockchainService registered");
            }

            // Register gRPC Interceptors
            if (exceptionInterceptorInstance.isResolvable()) {
                builder.intercept(exceptionInterceptorInstance.get());
                Log.infof("✅ ExceptionInterceptor registered");
            }

            if (authorizationInterceptorInstance.isResolvable()) {
                builder.intercept(authorizationInterceptorInstance.get());
                Log.infof("✅ AuthorizationInterceptor registered");
            }

            if (loggingInterceptorInstance.isResolvable()) {
                builder.intercept(loggingInterceptorInstance.get());
                Log.infof("✅ LoggingInterceptor registered");
            }

            if (metricsInterceptorInstance.isResolvable()) {
                builder.intercept(metricsInterceptorInstance.get());
                Log.infof("✅ MetricsInterceptor registered");
            }

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
            Log.info("   - BlockchainService (block creation, validation, streaming, Merkle proofs)");
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
