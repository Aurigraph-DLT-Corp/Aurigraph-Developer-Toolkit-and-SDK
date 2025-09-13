package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Uni;
import io.aurigraph.v11.TransactionService;
import io.aurigraph.v11.consensus.HyperRAFTConsensusService;
import io.aurigraph.v11.crypto.QuantumCryptoService;
import jakarta.inject.Inject;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Logger;

/**
 * High-performance gRPC service implementation for Aurigraph V11
 * Handles transaction processing, consensus, and blockchain operations
 */
@GrpcService
public class AurigraphGrpcService extends AurigraphPlatformGrpc.AurigraphPlatformImplBase {
    
    private static final Logger LOGGER = Logger.getLogger(AurigraphGrpcService.class.getName());
    
    @Inject
    TransactionService transactionService;
    
    @Inject
    HyperRAFTConsensusService consensusService;
    
    @Inject
    QuantumCryptoService cryptoService;
    
    private final AtomicLong transactionCounter = new AtomicLong(0);
    private final AtomicLong blockHeight = new AtomicLong(0);
    
    @Override
    public void submitTransaction(TransactionRequest request, 
                                 StreamObserver<TransactionResponse> responseObserver) {
        try {
            // Validate transaction signature using quantum-resistant crypto
            boolean isValid = cryptoService.verifySignature(
                request.getData().toByteArray(),
                request.getSignature().toByteArray(),
                request.getPublicKey().toByteArray()
            );
            
            if (!isValid) {
                responseObserver.onNext(TransactionResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Invalid signature")
                    .build());
                responseObserver.onCompleted();
                return;
            }
            
            // Process transaction through consensus
            String txHash = consensusService.submitTransaction(request.getData().toByteArray());
            long txId = transactionCounter.incrementAndGet();
            
            // Build response
            TransactionResponse response = TransactionResponse.newBuilder()
                .setTransactionId(String.valueOf(txId))
                .setTransactionHash(txHash)
                .setSuccess(true)
                .setMessage("Transaction submitted successfully")
                .setTimestamp(System.currentTimeMillis())
                .build();
            
            responseObserver.onNext(response);
            responseObserver.onCompleted();
            
            LOGGER.info("Transaction processed: " + txId);
            
        } catch (Exception e) {
            LOGGER.severe("Error processing transaction: " + e.getMessage());
            responseObserver.onError(e);
        }
    }
    
    @Override
    public void batchSubmitTransactions(BatchTransactionRequest request,
                                       StreamObserver<BatchTransactionResponse> responseObserver) {
        try {
            BatchTransactionResponse.Builder responseBuilder = BatchTransactionResponse.newBuilder();
            
            // Process batch in parallel for high throughput
            request.getTransactionsList().parallelStream().forEach(tx -> {
                boolean isValid = cryptoService.verifySignature(
                    tx.getData().toByteArray(),
                    tx.getSignature().toByteArray(),
                    tx.getPublicKey().toByteArray()
                );
                
                if (isValid) {
                    String txHash = consensusService.submitTransaction(tx.getData().toByteArray());
                    responseBuilder.addTransactionHashes(txHash);
                    responseBuilder.setSuccessCount(responseBuilder.getSuccessCount() + 1);
                } else {
                    responseBuilder.setFailedCount(responseBuilder.getFailedCount() + 1);
                }
            });
            
            responseBuilder.setSuccess(true)
                          .setMessage("Batch processed")
                          .setTotalProcessed(request.getTransactionsCount());
            
            responseObserver.onNext(responseBuilder.build());
            responseObserver.onCompleted();
            
        } catch (Exception e) {
            LOGGER.severe("Error in batch processing: " + e.getMessage());
            responseObserver.onError(e);
        }
    }
    
    @Override
    public void getBlock(GetBlockRequest request,
                        StreamObserver<Block> responseObserver) {
        try {
            Block.Builder blockBuilder = Block.newBuilder();
            
            if (request.hasBlockNumber()) {
                blockBuilder.setBlockNumber(request.getBlockNumber());
            } else if (request.hasBlockHash()) {
                blockBuilder.setBlockHash(request.getBlockHash());
            } else {
                // Return latest block
                blockBuilder.setBlockNumber(blockHeight.get());
            }
            
            // Add block data
            blockBuilder.setPreviousHash("0x" + generateHash())
                       .setTimestamp(System.currentTimeMillis())
                       .setTransactionCount(100) // Example
                       .setMerkleRoot("0x" + generateHash())
                       .setValidatorSignature("validator_sig_" + System.nanoTime());
            
            responseObserver.onNext(blockBuilder.build());
            responseObserver.onCompleted();
            
        } catch (Exception e) {
            LOGGER.severe("Error getting block: " + e.getMessage());
            responseObserver.onError(e);
        }
    }
    
    @Override
    public void subscribeToBlocks(BlockSubscriptionRequest request,
                                 StreamObserver<Block> responseObserver) {
        // Stream blocks as they are created
        new Thread(() -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    Block block = Block.newBuilder()
                        .setBlockNumber(blockHeight.incrementAndGet())
                        .setBlockHash("0x" + generateHash())
                        .setPreviousHash("0x" + generateHash())
                        .setTimestamp(System.currentTimeMillis())
                        .setTransactionCount((int)(Math.random() * 1000))
                        .setMerkleRoot("0x" + generateHash())
                        .build();
                    
                    responseObserver.onNext(block);
                    Thread.sleep(5000); // New block every 5 seconds
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                responseObserver.onError(e);
            }
        }).start();
    }
    
    @Override
    public void getTransaction(GetTransactionRequest request,
                              StreamObserver<Transaction> responseObserver) {
        try {
            Transaction transaction = Transaction.newBuilder()
                .setTransactionId(request.getTransactionId())
                .setTransactionHash("0x" + generateHash())
                .setFromAddress("0x" + generateHash().substring(0, 40))
                .setToAddress("0x" + generateHash().substring(0, 40))
                .setAmount("1000000000000000000") // 1 token in wei
                .setGasPrice("20000000000")
                .setGasLimit("21000")
                .setNonce(1)
                .setTimestamp(System.currentTimeMillis())
                .setStatus(Transaction.Status.CONFIRMED)
                .build();
            
            responseObserver.onNext(transaction);
            responseObserver.onCompleted();
            
        } catch (Exception e) {
            LOGGER.severe("Error getting transaction: " + e.getMessage());
            responseObserver.onError(e);
        }
    }
    
    @Override
    public void getConsensusState(ConsensusStateRequest request,
                                 StreamObserver<ConsensusState> responseObserver) {
        try {
            ConsensusState state = ConsensusState.newBuilder()
                .setCurrentLeader("validator_" + (System.currentTimeMillis() % 10))
                .setCurrentTerm(consensusService.getCurrentTerm())
                .setCurrentPhase(ConsensusState.Phase.COMMIT)
                .setActiveValidators(10)
                .setTotalValidators(15)
                .setLastCommittedBlock(blockHeight.get())
                .setConsensusType("HyperRAFT++")
                .build();
            
            responseObserver.onNext(state);
            responseObserver.onCompleted();
            
        } catch (Exception e) {
            LOGGER.severe("Error getting consensus state: " + e.getMessage());
            responseObserver.onError(e);
        }
    }
    
    private String generateHash() {
        return String.format("%064x", System.nanoTime() * 31);
    }
}