package io.aurigraph.v11.bridge.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Atomic Swap (HTLC) Response Model
 * Contains swap execution results and status information
 *
 * @author Backend Development Agent (BDA)
 * @version 1.0
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AtomicSwapResponse {

    @JsonProperty("swapId")
    private String swapId;

    @JsonProperty("status")
    private SwapStatus status; // INITIATED, LOCKED, REVEALED, COMPLETED, EXPIRED, REFUNDED, FAILED

    @JsonProperty("initiatorAddress")
    private String initiatorAddress;

    @JsonProperty("counterpartyAddress")
    private String counterpartyAddress;

    @JsonProperty("amountIn")
    private BigDecimal amountIn;

    @JsonProperty("amountOut")
    private BigDecimal amountOut;

    @JsonProperty("tokenIn")
    private String tokenIn;

    @JsonProperty("tokenOut")
    private String tokenOut;

    @JsonProperty("sourceChain")
    private String sourceChain;

    @JsonProperty("targetChain")
    private String targetChain;

    @JsonProperty("hashAlgo")
    private String hashAlgo;

    @JsonProperty("hashLock")
    private String hashLock;

    @JsonProperty("secret")
    private String secret; // Revealed secret (only after reveal)

    @JsonProperty("lockTime")
    private Instant lockTime; // When HTLC was locked

    @JsonProperty("expiryTime")
    private Instant expiryTime; // When HTLC expires

    @JsonProperty("revealTime")
    private Instant revealTime; // When secret was revealed

    @JsonProperty("completionTime")
    private Instant completionTime; // When swap completed

    @JsonProperty("expirationTime")
    private Instant expirationTime; // When swap expired

    @JsonProperty("refundTime")
    private Instant refundTime; // When refund was processed

    @JsonProperty("sourceTransactionHash")
    private String sourceTransactionHash;

    @JsonProperty("targetTransactionHash")
    private String targetTransactionHash;

    @JsonProperty("lockTransactionHash")
    private String lockTransactionHash; // Hash of lock transaction

    @JsonProperty("revealTransactionHash")
    private String revealTransactionHash; // Hash of reveal transaction

    @JsonProperty("refundTransactionHash")
    private String refundTransactionHash; // Hash of refund transaction

    @JsonProperty("sourceConfirmations")
    private Integer sourceConfirmations;

    @JsonProperty("targetConfirmations")
    private Integer targetConfirmations;

    @JsonProperty("requiredConfirmations")
    private Integer requiredConfirmations;

    @JsonProperty("fee")
    private BigDecimal fee;

    @JsonProperty("refundAddress")
    private String refundAddress;

    @JsonProperty("events")
    private List<SwapEvent> events;

    @JsonProperty("errorCode")
    private String errorCode;

    @JsonProperty("errorDetails")
    private String errorDetails;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("updatedAt")
    private Instant updatedAt;

    /**
     * Swap status enum
     */
    public enum SwapStatus {
        INITIATED,    // HTLC created, awaiting lock
        LOCKED,       // Funds locked with hash
        REVEALED,     // Secret revealed, ready to complete
        COMPLETED,    // Swap successfully completed
        EXPIRED,      // Timelock expired
        REFUNDED,     // Refund processed after expiry
        FAILED        // Swap failed
    }

    /**
     * Swap event for audit trail
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SwapEvent {
        @JsonProperty("eventType")
        private String eventType; // INITIATED, LOCKED, REVEALED, COMPLETED, EXPIRED, REFUNDED

        @JsonProperty("message")
        private String message;

        @JsonProperty("timestamp")
        private Instant timestamp;

        @JsonProperty("details")
        private Map<String, Object> details;

        // Getters
        public String getEventType() { return eventType; }
        public String getMessage() { return message; }
        public Instant getTimestamp() { return timestamp; }
        public Map<String, Object> getDetails() { return details; }
    }

    // Getters
    public String getSwapId() { return swapId; }
    public SwapStatus getStatus() { return status; }
    public String getInitiatorAddress() { return initiatorAddress; }
    public String getCounterpartyAddress() { return counterpartyAddress; }
    public BigDecimal getAmountIn() { return amountIn; }
    public BigDecimal getAmountOut() { return amountOut; }
    public String getTokenIn() { return tokenIn; }
    public String getTokenOut() { return tokenOut; }
    public String getSourceChain() { return sourceChain; }
    public String getTargetChain() { return targetChain; }
    public String getHashAlgo() { return hashAlgo; }
    public String getHashLock() { return hashLock; }
    public String getSecret() { return secret; }
    public Instant getLockTime() { return lockTime; }
    public Instant getExpiryTime() { return expiryTime; }
    public Instant getRevealTime() { return revealTime; }
    public Instant getCompletionTime() { return completionTime; }
    public Instant getExpirationTime() { return expirationTime; }
    public Instant getRefundTime() { return refundTime; }
    public String getSourceTransactionHash() { return sourceTransactionHash; }
    public String getTargetTransactionHash() { return targetTransactionHash; }
    public String getLockTransactionHash() { return lockTransactionHash; }
    public String getRevealTransactionHash() { return revealTransactionHash; }
    public String getRefundTransactionHash() { return refundTransactionHash; }
    public Integer getSourceConfirmations() { return sourceConfirmations; }
    public Integer getTargetConfirmations() { return targetConfirmations; }
    public Integer getRequiredConfirmations() { return requiredConfirmations; }
    public BigDecimal getFee() { return fee; }
    public String getRefundAddress() { return refundAddress; }
    public List<SwapEvent> getEvents() { return events; }
    public String getErrorCode() { return errorCode; }
    public String getErrorDetails() { return errorDetails; }
    public Map<String, Object> getMetadata() { return metadata; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    /**
     * Check if swap is completed
     */
    public boolean isCompleted() {
        return status == SwapStatus.COMPLETED;
    }

    /**
     * Check if swap has failed/expired
     */
    public boolean isFinal() {
        return status == SwapStatus.COMPLETED || status == SwapStatus.EXPIRED ||
               status == SwapStatus.REFUNDED || status == SwapStatus.FAILED;
    }

    /**
     * Check if swap can be revealed
     */
    public boolean canBeRevealed() {
        return status == SwapStatus.LOCKED && expiryTime != null &&
               Instant.now().isBefore(expiryTime);
    }

    /**
     * Check if swap can be refunded
     */
    public boolean canBeRefunded() {
        return (status == SwapStatus.INITIATED || status == SwapStatus.LOCKED) &&
               expiryTime != null && Instant.now().isAfter(expiryTime);
    }

    /**
     * Add swap event
     */
    public void addEvent(SwapEvent event) {
        if (events == null) {
            events = new java.util.ArrayList<>();
        }
        events.add(event);
    }
}
