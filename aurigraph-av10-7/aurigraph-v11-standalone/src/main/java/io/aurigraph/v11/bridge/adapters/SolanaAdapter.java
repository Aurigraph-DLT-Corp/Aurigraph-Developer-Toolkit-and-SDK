package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.models.BridgeTransaction;
import io.aurigraph.v11.bridge.models.ChainInfo;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Solana Blockchain Adapter
 * 
 * Provides integration with Solana blockchain using JSON RPC API.
 * Solana has a different architecture from EVM chains, using accounts
 * and programs instead of contracts.
 * 
 * Features:
 * - Solana JSON RPC integration
 * - SPL Token support
 * - Program-based transaction execution
 * - Sub-second finality
 * - Low transaction fees
 * - High throughput (65,000+ TPS theoretical)
 * - Account-based model
 */
@ApplicationScoped
@Named("solanaAdapter")
public class SolanaAdapter implements ChainAdapter {

    private static final Logger LOG = Logger.getLogger(SolanaAdapter.class);
    private static final MediaType JSON_MEDIA_TYPE = MediaType.get("application/json; charset=utf-8");

    // Solana-specific configuration
    @ConfigProperty(name = "aurigraph.bridge.solana.rpc-url", 
                   defaultValue = "https://api.mainnet-beta.solana.com")
    String solanaRpcUrl;

    @ConfigProperty(name = "aurigraph.bridge.solana.bridge-program", 
                   defaultValue = "BridgeProgramId123456789012345678901234567890")
    String bridgeProgramId;

    @ConfigProperty(name = "aurigraph.bridge.solana.confirmation-blocks", defaultValue = "32")
    int confirmationBlocks;

    @ConfigProperty(name = "aurigraph.bridge.solana.commitment", defaultValue = "finalized")
    String commitment;

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final AtomicBoolean isConnected = new AtomicBoolean(false);
    private final AtomicLong lastHealthCheck = new AtomicLong(0);
    private final AtomicLong requestId = new AtomicLong(1);

    // Performance metrics
    private final AtomicLong totalTransactions = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private final AtomicLong failedTransactions = new AtomicLong(0);

    private final ChainInfo solanaChainInfo;

    public SolanaAdapter() {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
            .build();
        this.objectMapper = new ObjectMapper();

        this.solanaChainInfo = ChainInfo.builder()
            .chainId("solana")
            .name("Solana Mainnet")
            .displayName("Solana")
            .networkId(101) // Solana mainnet
            .rpcUrl("https://api.mainnet-beta.solana.com")
            .explorerUrl("https://explorer.solana.com")
            .nativeCurrency("SOL")
            .currencySymbol("SOL")
            .decimals(9) // SOL has 9 decimals
            .isActive(true)
            .chainType("Solana")
            .confirmationBlocks(32)
            .averageBlockTime(400) // ~0.4 seconds
            .averageConfirmationTime(13) // 32 blocks * 0.4s
            .minTransferAmount(new BigDecimal("0.000000001")) // 1 lamport
            .maxTransferAmount(new BigDecimal("1000000"))
            .baseFee(new BigDecimal("0.000005")) // 5000 lamports
            .supportedAssets(List.of("SOL", "USDC", "USDT", "RAY", "SRM", "MNGO"))
            .build();
    }

    @Override
    public Uni<Void> initialize() {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<Void> future = new CompletableFuture<>();
            
            try {
                LOG.info("Initializing Solana adapter...");
                
                // Test connection with getHealth RPC call
                testConnection().subscribe().with(
                    healthy -> {
                        isConnected.set(healthy);
                        lastHealthCheck.set(System.currentTimeMillis());
                        
                        if (healthy) {
                            LOG.info("Solana adapter initialized successfully");
                        } else {
                            LOG.warn("Solana adapter initialized but connection is unhealthy");
                        }
                        future.complete(null);
                    },
                    error -> {
                        LOG.errorf("Failed to initialize Solana adapter: %s", error.getMessage());
                        isConnected.set(false);
                        future.completeExceptionally(error);
                    }
                );
                
            } catch (Exception e) {
                LOG.errorf("Error initializing Solana adapter: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public ChainInfo getChainInfo() {
        return solanaChainInfo;
    }

    @Override
    public Uni<String> submitTransaction(BridgeTransaction transaction) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<String> future = new CompletableFuture<>();
            
            try {
                totalTransactions.incrementAndGet();
                
                // Build Solana transaction
                SolanaTransaction solanaTransaction = buildSolanaTransaction(transaction);
                
                // Submit transaction via RPC
                Map<String, Object> rpcRequest = buildRpcRequest("sendTransaction", 
                    List.of(solanaTransaction.getSerializedTransaction(), 
                           Map.of("encoding", "base64", "commitment", commitment)));
                
                String jsonRequest = objectMapper.writeValueAsString(rpcRequest);
                RequestBody body = RequestBody.create(jsonRequest, JSON_MEDIA_TYPE);
                Request request = new Request.Builder()
                    .url(solanaRpcUrl)
                    .post(body)
                    .build();
                
                httpClient.newCall(request).enqueue(new okhttp3.Callback() {
                    @Override
                    public void onResponse(okhttp3.Call call, Response response) {
                        try {
                            String responseBody = response.body().string();
                            JsonNode jsonResponse = objectMapper.readTree(responseBody);
                            
                            if (jsonResponse.has("error")) {
                                failedTransactions.incrementAndGet();
                                future.completeExceptionally(
                                    new RuntimeException("Solana transaction failed: " + 
                                                       jsonResponse.get("error").get("message").asText()));
                            } else {
                                String signature = jsonResponse.get("result").asText();
                                successfulTransactions.incrementAndGet();
                                LOG.infof("Submitted Solana transaction: %s", signature);
                                future.complete(signature);
                            }
                        } catch (Exception e) {
                            failedTransactions.incrementAndGet();
                            future.completeExceptionally(e);
                        } finally {
                            response.close();
                        }
                    }
                    
                    @Override
                    public void onFailure(okhttp3.Call call, java.io.IOException e) {
                        failedTransactions.incrementAndGet();
                        future.completeExceptionally(e);
                    }
                });
                
            } catch (Exception e) {
                failedTransactions.incrementAndGet();
                LOG.errorf("Error submitting Solana transaction: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public Uni<TransactionStatus> getTransactionStatus(String signature) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<TransactionStatus> future = new CompletableFuture<>();
            
            try {
                Map<String, Object> rpcRequest = buildRpcRequest("getSignatureStatuses", 
                    List.of(List.of(signature), Map.of("searchTransactionHistory", true)));
                
                String jsonRequest = objectMapper.writeValueAsString(rpcRequest);
                RequestBody body = RequestBody.create(jsonRequest, JSON_MEDIA_TYPE);
                Request request = new Request.Builder()
                    .url(solanaRpcUrl)
                    .post(body)
                    .build();
                
                httpClient.newCall(request).enqueue(new okhttp3.Callback() {
                    @Override
                    public void onResponse(okhttp3.Call call, Response response) {
                        try {
                            String responseBody = response.body().string();
                            JsonNode jsonResponse = objectMapper.readTree(responseBody);
                            
                            if (jsonResponse.has("error")) {
                                future.completeExceptionally(
                                    new RuntimeException("Failed to get signature status: " + 
                                                       jsonResponse.get("error").get("message").asText()));
                            } else {
                                JsonNode result = jsonResponse.get("result").get("value").get(0);
                                
                                TransactionStatus status;
                                if (result.isNull()) {
                                    // Transaction not found
                                    status = new TransactionStatus(
                                        signature, TransactionStatusType.PENDING, 
                                        0, confirmationBlocks, 0, null, 0, System.currentTimeMillis()
                                    );
                                } else {
                                    int confirmations = result.has("confirmations") ? 
                                        result.get("confirmations").asInt() : confirmationBlocks;
                                    
                                    boolean isError = result.has("err") && !result.get("err").isNull();
                                    TransactionStatusType statusType = isError ? 
                                        TransactionStatusType.FAILED : 
                                        (confirmations >= confirmationBlocks ? 
                                            TransactionStatusType.CONFIRMED : TransactionStatusType.CONFIRMING);
                                    
                                    long slot = result.has("slot") ? result.get("slot").asLong() : 0;
                                    
                                    status = new TransactionStatus(
                                        signature, statusType, confirmations, confirmationBlocks, 
                                        0, isError ? result.get("err").toString() : null, 
                                        slot, System.currentTimeMillis()
                                    );
                                }
                                
                                future.complete(status);
                            }
                        } catch (Exception e) {
                            future.completeExceptionally(e);
                        } finally {
                            response.close();
                        }
                    }
                    
                    @Override
                    public void onFailure(okhttp3.Call call, java.io.IOException e) {
                        future.completeExceptionally(e);
                    }
                });
                
            } catch (Exception e) {
                LOG.errorf("Error getting Solana transaction status: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public Uni<BigDecimal> getBalance(String address, String tokenMint) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<BigDecimal> future = new CompletableFuture<>();
            
            try {
                Map<String, Object> rpcRequest;
                
                if (tokenMint == null || tokenMint.isEmpty()) {
                    // Get SOL balance
                    rpcRequest = buildRpcRequest("getBalance", 
                        List.of(address, Map.of("commitment", commitment)));
                } else {
                    // Get SPL token balance
                    rpcRequest = buildRpcRequest("getTokenAccountsByOwner", 
                        List.of(address, 
                               Map.of("mint", tokenMint),
                               Map.of("encoding", "jsonParsed", "commitment", commitment)));
                }
                
                String jsonRequest = objectMapper.writeValueAsString(rpcRequest);
                RequestBody body = RequestBody.create(jsonRequest, JSON_MEDIA_TYPE);
                Request request = new Request.Builder()
                    .url(solanaRpcUrl)
                    .post(body)
                    .build();
                
                httpClient.newCall(request).enqueue(new okhttp3.Callback() {
                    @Override
                    public void onResponse(okhttp3.Call call, Response response) {
                        try {
                            String responseBody = response.body().string();
                            JsonNode jsonResponse = objectMapper.readTree(responseBody);
                            
                            if (jsonResponse.has("error")) {
                                future.completeExceptionally(
                                    new RuntimeException("Failed to get balance: " + 
                                                       jsonResponse.get("error").get("message").asText()));
                            } else {
                                BigDecimal balance;
                                
                                if (tokenMint == null || tokenMint.isEmpty()) {
                                    // SOL balance (in lamports)
                                    long lamports = jsonResponse.get("result").get("value").asLong();
                                    balance = new BigDecimal(lamports).divide(BigDecimal.valueOf(1_000_000_000)); // Convert lamports to SOL
                                } else {
                                    // SPL token balance
                                    JsonNode accounts = jsonResponse.get("result").get("value");
                                    if (accounts.size() > 0) {
                                        String tokenAmount = accounts.get(0)
                                            .get("account")
                                            .get("data")
                                            .get("parsed")
                                            .get("info")
                                            .get("tokenAmount")
                                            .get("uiAmount").asText();
                                        balance = new BigDecimal(tokenAmount);
                                    } else {
                                        balance = BigDecimal.ZERO;
                                    }
                                }
                                
                                future.complete(balance);
                            }
                        } catch (Exception e) {
                            future.completeExceptionally(e);
                        } finally {
                            response.close();
                        }
                    }
                    
                    @Override
                    public void onFailure(okhttp3.Call call, java.io.IOException e) {
                        future.completeExceptionally(e);
                    }
                });
                
            } catch (Exception e) {
                LOG.errorf("Error getting Solana balance: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public Uni<BigDecimal> estimateGasFee(BridgeTransaction transaction) {
        return Uni.createFrom().item(() -> {
            // Solana has very low and predictable fees
            // Base transaction fee is 5000 lamports (0.000005 SOL)
            // Additional fees for program execution and account creation
            
            BigDecimal baseFee = new BigDecimal("0.000005"); // 5000 lamports
            
            // Add estimated fees for bridge program execution
            BigDecimal programFee = new BigDecimal("0.000010"); // Additional program execution fee
            
            // Total fee
            BigDecimal totalFee = baseFee.add(programFee);
            
            LOG.debugf("Solana fee estimate: %s SOL", totalFee);
            return totalFee;
        });
    }

    @Override
    public Uni<Boolean> isHealthy() {
        return testConnection();
    }

    @Override
    public String getChainId() {
        return "solana";
    }

    @Override
    public boolean supportsAtomicSwaps() {
        return true; // Solana supports programs that can implement atomic swaps
    }

    @Override
    public Uni<String> createAtomicSwapContract(String counterparty, BigDecimal amount, 
                                               byte[] hashLock, long lockTime) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Creating Solana atomic swap: %s SOL with counterparty %s", amount, counterparty);
            
            // In a real implementation, this would create a program-derived account
            // and execute a swap program instruction
            String swapSignature = "solana-swap-" + java.util.UUID.randomUUID().toString().substring(0, 8);
            
            LOG.infof("Solana atomic swap created: %s", swapSignature);
            return swapSignature;
        });
    }

    // Private helper methods

    private Uni<Boolean> testConnection() {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<Boolean> future = new CompletableFuture<>();
            
            try {
                Map<String, Object> rpcRequest = buildRpcRequest("getHealth", List.of());
                String jsonRequest = objectMapper.writeValueAsString(rpcRequest);
                RequestBody body = RequestBody.create(jsonRequest, JSON_MEDIA_TYPE);
                Request request = new Request.Builder()
                    .url(solanaRpcUrl)
                    .post(body)
                    .build();
                
                httpClient.newCall(request).enqueue(new okhttp3.Callback() {
                    @Override
                    public void onResponse(okhttp3.Call call, Response response) {
                        try {
                            String responseBody = response.body().string();
                            JsonNode jsonResponse = objectMapper.readTree(responseBody);
                            
                            boolean healthy = jsonResponse.has("result") && 
                                            "ok".equals(jsonResponse.get("result").asText());
                            future.complete(healthy);
                        } catch (Exception e) {
                            future.complete(false);
                        } finally {
                            response.close();
                        }
                    }
                    
                    @Override
                    public void onFailure(okhttp3.Call call, java.io.IOException e) {
                        future.complete(false);
                    }
                });
                
            } catch (Exception e) {
                future.complete(false);
            }
            
            return future;
        });
    }

    private Map<String, Object> buildRpcRequest(String method, List<Object> params) {
        Map<String, Object> request = new HashMap<>();
        request.put("jsonrpc", "2.0");
        request.put("id", requestId.getAndIncrement());
        request.put("method", method);
        request.put("params", params);
        return request;
    }

    private SolanaTransaction buildSolanaTransaction(BridgeTransaction transaction) {
        // This is a simplified representation
        // In a real implementation, would build actual Solana transaction with instructions
        LOG.infof("Building Solana transaction for %s %s", transaction.getAmount(), transaction.getTokenSymbol());
        
        // Mock transaction construction
        String serializedTx = Base64.getEncoder().encodeToString(
            ("solana-tx-" + transaction.getTransactionId()).getBytes());
        
        return new SolanaTransaction(serializedTx);
    }

    /**
     * Get Solana-specific network statistics
     */
    public Uni<SolanaNetworkStats> getNetworkStats() {
        return Uni.createFrom().item(() -> {
            return new SolanaNetworkStats(
                System.currentTimeMillis(),
                0.4, // Average slot time
                0.000005, // Current fee in SOL
                2000, // Current TPS (estimated)
                99.9, // Network uptime
                150000000L // Current slot
            );
        });
    }

    /**
     * Simple Solana Transaction representation
     */
    private static class SolanaTransaction {
        private final String serializedTransaction;
        
        public SolanaTransaction(String serializedTransaction) {
            this.serializedTransaction = serializedTransaction;
        }
        
        public String getSerializedTransaction() {
            return serializedTransaction;
        }
    }

    /**
     * Solana Network Statistics
     */
    public record SolanaNetworkStats(
        long timestamp,
        double averageSlotTime,
        double currentFeeSOL,
        int currentTPS,
        double networkUptime,
        long currentSlot
    ) {}

    // Metrics getters
    public long getTotalTransactions() { return totalTransactions.get(); }
    public long getSuccessfulTransactions() { return successfulTransactions.get(); }
    public long getFailedTransactions() { return failedTransactions.get(); }
    
    public double getSuccessRate() {
        long total = getTotalTransactions();
        return total > 0 ? (double) getSuccessfulTransactions() / total : 0.0;
    }
}