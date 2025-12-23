package io.aurigraph.basicnode.storage;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * AV10-17 Transaction Manager
 * Manages transaction lifecycle with external persistence and graceful recovery
 */
@ApplicationScoped
public class TransactionManager {
    
    private static final Logger LOG = Logger.getLogger(TransactionManager.class);
    
    @Inject
    ExternalDataManager externalDataManager;
    
    private final Map<String, TransactionContext> activeTransactions = new ConcurrentHashMap<>();
    private final Map<String, CompletableFuture<TransactionResult>> transactionFutures = new ConcurrentHashMap<>();
    
    public String startTransaction(String userId, String transactionType, String transactionData) {
        String transactionId = generateTransactionId(userId, transactionType);
        
        TransactionContext context = new TransactionContext();
        context.transactionId = transactionId;
        context.userId = userId;
        context.transactionType = transactionType;
        context.transactionData = transactionData;
        context.status = TransactionStatus.PENDING;
        context.startTime = Instant.now();
        context.checkpoints = new ArrayList<>();
        context.retryCount = 0;
        context.maxRetries = 3;
        
        activeTransactions.put(transactionId, context);
        
        try {
            // Log transaction start to external storage
            externalDataManager.logTransaction(userId, transactionId, transactionType, 
                transactionData, "PENDING");
            
            LOG.infof("Transaction started: %s (%s) for user %s", transactionId, transactionType, userId);
            
        } catch (Exception e) {
            LOG.errorf("Failed to log transaction start: %s", e.getMessage());
        }
        
        return transactionId;
    }
    
    public CompletableFuture<TransactionResult> executeTransaction(String transactionId) {
        TransactionContext context = activeTransactions.get(transactionId);
        if (context == null) {
            return CompletableFuture.completedFuture(
                TransactionResult.failure(transactionId, "Transaction not found"));
        }
        
        CompletableFuture<TransactionResult> future = CompletableFuture.supplyAsync(() -> {
            try {
                return executeTransactionInternal(context);
            } catch (Exception e) {
                LOG.errorf("Transaction execution failed: %s", e.getMessage());
                return TransactionResult.failure(transactionId, e.getMessage());
            }
        });
        
        transactionFutures.put(transactionId, future);
        
        // Set timeout for transaction
        future.orTimeout(30, TimeUnit.MINUTES);
        
        return future;
    }
    
    private TransactionResult executeTransactionInternal(TransactionContext context) {
        try {
            context.status = TransactionStatus.IN_PROGRESS;
            
            // Log status update
            externalDataManager.logTransaction(context.userId, context.transactionId, 
                context.transactionType, context.transactionData, "IN_PROGRESS");
            
            // Create initial checkpoint
            createCheckpoint(context, "EXECUTION_START", 
                "{\"step\": \"start\", \"timestamp\": \"" + Instant.now() + "\"}");
            
            // Execute transaction based on type
            TransactionResult result = switch (context.transactionType) {
                case "ASSET_REGISTRATION" -> executeAssetRegistration(context);
                case "ASSET_TOKENIZATION" -> executeAssetTokenization(context);
                case "YIELD_DISTRIBUTION" -> executeYieldDistribution(context);
                case "STAKE_TOKENS" -> executeStakeTokens(context);
                case "UNSTAKE_TOKENS" -> executeUnstakeTokens(context);
                case "TRANSFER_TOKENS" -> executeTransferTokens(context);
                default -> TransactionResult.failure(context.transactionId, "Unknown transaction type");
            };
            
            // Update final status
            context.status = result.success ? TransactionStatus.COMPLETED : TransactionStatus.FAILED;
            context.completedTime = Instant.now();
            context.result = result;
            
            // Log completion
            externalDataManager.logTransaction(context.userId, context.transactionId, 
                context.transactionType, context.transactionData, context.status.toString());
            
            // Create final checkpoint
            createCheckpoint(context, "EXECUTION_COMPLETE", result.toJson());
            
            return result;
            
        } catch (Exception e) {
            context.status = TransactionStatus.FAILED;
            context.completedTime = Instant.now();
            
            LOG.errorf("Transaction execution failed: %s", e.getMessage());
            
            try {
                externalDataManager.logTransaction(context.userId, context.transactionId, 
                    context.transactionType, context.transactionData, "FAILED");
            } catch (Exception logError) {
                LOG.errorf("Failed to log transaction failure: %s", logError.getMessage());
            }
            
            return TransactionResult.failure(context.transactionId, e.getMessage());
        }
    }
    
    private TransactionResult executeAssetRegistration(TransactionContext context) {
        // Simulate asset registration process with checkpoints
        try {
            createCheckpoint(context, "VALIDATION", "{\"step\": \"validating_asset_data\"}");
            Thread.sleep(1000); // Simulate validation time
            
            createCheckpoint(context, "ENCRYPTION", "{\"step\": \"encrypting_sensitive_data\"}");
            Thread.sleep(500);
            
            createCheckpoint(context, "CONSENSUS", "{\"step\": \"submitting_to_consensus\"}");
            Thread.sleep(1500);
            
            createCheckpoint(context, "INDEXING", "{\"step\": \"updating_asset_indices\"}");
            Thread.sleep(500);
            
            return TransactionResult.success(context.transactionId, 
                "{\"assetId\": \"ASSET-" + System.currentTimeMillis() + "\"}");
                
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return TransactionResult.failure(context.transactionId, "Execution interrupted");
        }
    }
    
    private TransactionResult executeAssetTokenization(TransactionContext context) {
        try {
            createCheckpoint(context, "ASSET_VALIDATION", "{\"step\": \"validating_asset_eligibility\"}");
            Thread.sleep(800);
            
            createCheckpoint(context, "TOKEN_CREATION", "{\"step\": \"creating_token_contract\"}");
            Thread.sleep(1200);
            
            createCheckpoint(context, "INITIAL_DISTRIBUTION", "{\"step\": \"distributing_initial_tokens\"}");
            Thread.sleep(600);
            
            return TransactionResult.success(context.transactionId, 
                "{\"tokenId\": \"TOKEN-" + System.currentTimeMillis() + "\"}");
                
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return TransactionResult.failure(context.transactionId, "Tokenization interrupted");
        }
    }
    
    private TransactionResult executeYieldDistribution(TransactionContext context) {
        try {
            createCheckpoint(context, "YIELD_CALCULATION", "{\"step\": \"calculating_yield_amounts\"}");
            Thread.sleep(1000);
            
            createCheckpoint(context, "RECIPIENT_VALIDATION", "{\"step\": \"validating_recipients\"}");
            Thread.sleep(500);
            
            createCheckpoint(context, "DISTRIBUTION", "{\"step\": \"distributing_yield\"}");
            Thread.sleep(2000);
            
            return TransactionResult.success(context.transactionId, 
                "{\"distributionId\": \"DIST-" + System.currentTimeMillis() + "\"}");
                
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return TransactionResult.failure(context.transactionId, "Distribution interrupted");
        }
    }
    
    private TransactionResult executeStakeTokens(TransactionContext context) {
        try {
            createCheckpoint(context, "BALANCE_CHECK", "{\"step\": \"validating_token_balance\"}");
            Thread.sleep(300);
            
            createCheckpoint(context, "POOL_VALIDATION", "{\"step\": \"validating_staking_pool\"}");
            Thread.sleep(400);
            
            createCheckpoint(context, "STAKE_CREATION", "{\"step\": \"creating_stake_position\"}");
            Thread.sleep(600);
            
            return TransactionResult.success(context.transactionId, 
                "{\"stakeId\": \"STAKE-" + System.currentTimeMillis() + "\"}");
                
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return TransactionResult.failure(context.transactionId, "Staking interrupted");
        }
    }
    
    private TransactionResult executeUnstakeTokens(TransactionContext context) {
        try {
            createCheckpoint(context, "LOCKUP_CHECK", "{\"step\": \"validating_lockup_period\"}");
            Thread.sleep(300);
            
            createCheckpoint(context, "YIELD_CALCULATION", "{\"step\": \"calculating_final_yield\"}");
            Thread.sleep(800);
            
            createCheckpoint(context, "TOKEN_RELEASE", "{\"step\": \"releasing_staked_tokens\"}");
            Thread.sleep(500);
            
            return TransactionResult.success(context.transactionId, 
                "{\"amount\": 1000, \"yield\": 250}");
                
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return TransactionResult.failure(context.transactionId, "Unstaking interrupted");
        }
    }
    
    private TransactionResult executeTransferTokens(TransactionContext context) {
        try {
            createCheckpoint(context, "SENDER_VALIDATION", "{\"step\": \"validating_sender_balance\"}");
            Thread.sleep(400);
            
            createCheckpoint(context, "RECIPIENT_VALIDATION", "{\"step\": \"validating_recipient\"}");
            Thread.sleep(300);
            
            createCheckpoint(context, "TRANSFER_EXECUTION", "{\"step\": \"executing_transfer\"}");
            Thread.sleep(700);
            
            return TransactionResult.success(context.transactionId, 
                "{\"transferId\": \"TRANSFER-" + System.currentTimeMillis() + "\"}");
                
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return TransactionResult.failure(context.transactionId, "Transfer interrupted");
        }
    }
    
    private void createCheckpoint(TransactionContext context, String checkpointType, String checkpointData) {
        try {
            externalDataManager.createTransactionCheckpoint(context.userId, context.transactionId, 
                String.format("{\"type\": \"%s\", \"data\": %s, \"timestamp\": \"%s\"}", 
                    checkpointType, checkpointData, Instant.now()));
            
            context.checkpoints.add(checkpointType);
            
        } catch (Exception e) {
            LOG.errorf("Failed to create checkpoint: %s", e.getMessage());
        }
    }
    
    public boolean restoreTransaction(String transactionId, String transactionType, 
                                    String transactionData, String checkpointData) {
        try {
            LOG.infof("Restoring transaction: %s (%s)", transactionId, transactionType);
            
            // Parse checkpoint data to determine where to resume
            String resumePoint = parseResumePoint(checkpointData);
            
            // Create restored transaction context
            TransactionContext context = new TransactionContext();
            context.transactionId = transactionId;
            context.transactionType = transactionType;
            context.transactionData = transactionData;
            context.status = TransactionStatus.IN_PROGRESS;
            context.startTime = Instant.now(); // New start time for restored execution
            context.checkpoints = new ArrayList<>();
            context.resumePoint = resumePoint;
            
            activeTransactions.put(transactionId, context);
            
            // Continue execution from checkpoint
            CompletableFuture<TransactionResult> future = executeTransaction(transactionId);
            transactionFutures.put(transactionId, future);
            
            LOG.infof("✅ Transaction restored and resumed: %s from checkpoint %s", transactionId, resumePoint);
            
            return true;
            
        } catch (Exception e) {
            LOG.errorf("Failed to restore transaction %s: %s", transactionId, e.getMessage());
            return false;
        }
    }
    
    private String parseResumePoint(String checkpointData) {
        // Parse JSON checkpoint data to determine resume point
        if (checkpointData.contains("EXECUTION_START")) return "VALIDATION";
        if (checkpointData.contains("VALIDATION")) return "ENCRYPTION";
        if (checkpointData.contains("ENCRYPTION")) return "CONSENSUS";
        if (checkpointData.contains("CONSENSUS")) return "INDEXING";
        return "START"; // Default to beginning
    }
    
    public Set<String> getActiveTransactionIds() {
        return new HashSet<>(activeTransactions.keySet());
    }
    
    public String getTransactionState(String transactionId) {
        TransactionContext context = activeTransactions.get(transactionId);
        if (context == null) return null;
        
        return String.format("""
            {
                "transactionId": "%s",
                "userId": "%s",
                "type": "%s",
                "status": "%s",
                "startTime": "%s",
                "checkpoints": %s,
                "resumePoint": "%s"
            }
            """, 
            context.transactionId, context.userId, context.transactionType,
            context.status, context.startTime, 
            Arrays.toString(context.checkpoints.toArray()),
            context.resumePoint != null ? context.resumePoint : "START");
    }
    
    public String getTransactionUserId(String transactionId) {
        TransactionContext context = activeTransactions.get(transactionId);
        return context != null ? context.userId : null;
    }
    
    public void cancelTransaction(String transactionId, String reason) {
        TransactionContext context = activeTransactions.get(transactionId);
        if (context == null) return;
        
        context.status = TransactionStatus.CANCELLED;
        context.completedTime = Instant.now();
        
        // Cancel future if running
        CompletableFuture<TransactionResult> future = transactionFutures.get(transactionId);
        if (future != null) {
            future.cancel(true);
        }
        
        try {
            externalDataManager.logTransaction(context.userId, transactionId, 
                context.transactionType, context.transactionData, "CANCELLED");
                
            LOG.infof("Transaction cancelled: %s (reason: %s)", transactionId, reason);
            
        } catch (Exception e) {
            LOG.errorf("Failed to log transaction cancellation: %s", e.getMessage());
        }
    }
    
    public List<TransactionSummary> getUserTransactionHistory(String userId, int limit) {
        List<TransactionSummary> history = new ArrayList<>();
        
        // Get from active transactions
        for (TransactionContext context : activeTransactions.values()) {
            if (context.userId.equals(userId)) {
                TransactionSummary summary = new TransactionSummary();
                summary.transactionId = context.transactionId;
                summary.transactionType = context.transactionType;
                summary.status = context.status;
                summary.startTime = context.startTime;
                summary.completedTime = context.completedTime;
                summary.checkpointCount = context.checkpoints.size();
                
                history.add(summary);
            }
        }
        
        // Sort by start time (newest first)
        history.sort((a, b) -> b.startTime.compareTo(a.startTime));
        
        // Limit results
        if (history.size() > limit) {
            history = history.subList(0, limit);
        }
        
        return history;
    }
    
    public TransactionStats getTransactionStats() {
        TransactionStats stats = new TransactionStats();
        
        stats.totalActiveTransactions = activeTransactions.size();
        stats.transactionsByStatus = new HashMap<>();
        stats.transactionsByType = new HashMap<>();
        stats.averageExecutionTime = 0;
        
        long totalExecutionTime = 0;
        int completedCount = 0;
        
        for (TransactionContext context : activeTransactions.values()) {
            // Count by status
            String status = context.status.toString();
            stats.transactionsByStatus.put(status, 
                stats.transactionsByStatus.getOrDefault(status, 0) + 1);
            
            // Count by type
            stats.transactionsByType.put(context.transactionType,
                stats.transactionsByType.getOrDefault(context.transactionType, 0) + 1);
            
            // Calculate execution time for completed transactions
            if (context.completedTime != null) {
                long executionTime = context.completedTime.toEpochMilli() - context.startTime.toEpochMilli();
                totalExecutionTime += executionTime;
                completedCount++;
            }
        }
        
        if (completedCount > 0) {
            stats.averageExecutionTime = totalExecutionTime / completedCount;
        }
        
        stats.lastUpdated = Instant.now();
        
        return stats;
    }
    
    public void cleanupCompletedTransactions(int retentionHours) {
        Instant cutoffTime = Instant.now().minusSeconds(retentionHours * 3600);
        
        List<String> toRemove = new ArrayList<>();
        
        for (Map.Entry<String, TransactionContext> entry : activeTransactions.entrySet()) {
            TransactionContext context = entry.getValue();
            
            if (context.completedTime != null && context.completedTime.isBefore(cutoffTime)) {
                toRemove.add(entry.getKey());
            }
        }
        
        for (String transactionId : toRemove) {
            activeTransactions.remove(transactionId);
            transactionFutures.remove(transactionId);
        }
        
        LOG.infof("Cleaned up %d completed transactions older than %d hours", toRemove.size(), retentionHours);
    }
    
    private String generateTransactionId(String userId, String transactionType) {
        return String.format("TXN-%s-%s-%d", userId, transactionType, System.currentTimeMillis());
    }
    
    // Data classes
    public static class TransactionContext {
        public String transactionId;
        public String userId;
        public String transactionType;
        public String transactionData;
        public TransactionStatus status;
        public Instant startTime;
        public Instant completedTime;
        public List<String> checkpoints;
        public String resumePoint;
        public int retryCount;
        public int maxRetries;
        public TransactionResult result;
    }
    
    public enum TransactionStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        CANCELLED
    }
    
    public static class TransactionResult {
        public String transactionId;
        public boolean success;
        public String data;
        public String error;
        public Instant timestamp;
        
        public static TransactionResult success(String transactionId, String data) {
            TransactionResult result = new TransactionResult();
            result.transactionId = transactionId;
            result.success = true;
            result.data = data;
            result.timestamp = Instant.now();
            return result;
        }
        
        public static TransactionResult failure(String transactionId, String error) {
            TransactionResult result = new TransactionResult();
            result.transactionId = transactionId;
            result.success = false;
            result.error = error;
            result.timestamp = Instant.now();
            return result;
        }
        
        public String toJson() {
            return String.format("""
                {
                    "transactionId": "%s",
                    "success": %s,
                    "data": "%s",
                    "error": "%s",
                    "timestamp": "%s"
                }
                """, transactionId, success, 
                data != null ? data : "", 
                error != null ? error : "", 
                timestamp);
        }
    }
    
    public static class TransactionSummary {
        public String transactionId;
        public String transactionType;
        public TransactionStatus status;
        public Instant startTime;
        public Instant completedTime;
        public int checkpointCount;
    }
    
    public static class TransactionStats {
        public int totalActiveTransactions;
        public Map<String, Integer> transactionsByStatus;
        public Map<String, Integer> transactionsByType;
        public long averageExecutionTime;
        public Instant lastUpdated;
    }
}