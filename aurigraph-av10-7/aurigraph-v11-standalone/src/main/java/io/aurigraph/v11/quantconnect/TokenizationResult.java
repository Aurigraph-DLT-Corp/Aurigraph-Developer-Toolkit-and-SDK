package io.aurigraph.v11.quantconnect;

import java.time.Instant;

/**
 * Tokenization Result Model
 *
 * Represents the result of a tokenization operation.
 * Contains success/failure status, Merkle tree information, and verification data.
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
public class TokenizationResult {

    private boolean success;
    private String tokenId;
    private String merkleRoot;
    private String merkleProof;
    private String blockHash;
    private long blockNumber;
    private Instant timestamp;
    private String message;
    private String errorCode;
    private String slimNodeId;
    private long processingTimeMs;

    public TokenizationResult() {
        this.timestamp = Instant.now();
    }

    public TokenizationResult(boolean success, String tokenId, String message) {
        this.success = success;
        this.tokenId = tokenId;
        this.message = message;
        this.timestamp = Instant.now();
    }

    // Static factory methods

    public static TokenizationResult success(String tokenId, String merkleRoot, String blockHash) {
        TokenizationResult result = new TokenizationResult();
        result.success = true;
        result.tokenId = tokenId;
        result.merkleRoot = merkleRoot;
        result.blockHash = blockHash;
        result.message = "Tokenization successful";
        return result;
    }

    public static TokenizationResult failure(String message, String errorCode) {
        TokenizationResult result = new TokenizationResult();
        result.success = false;
        result.message = message;
        result.errorCode = errorCode;
        return result;
    }

    // Getters and Setters

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getTokenId() {
        return tokenId;
    }

    public void setTokenId(String tokenId) {
        this.tokenId = tokenId;
    }

    public String getMerkleRoot() {
        return merkleRoot;
    }

    public void setMerkleRoot(String merkleRoot) {
        this.merkleRoot = merkleRoot;
    }

    public String getMerkleProof() {
        return merkleProof;
    }

    public void setMerkleProof(String merkleProof) {
        this.merkleProof = merkleProof;
    }

    public String getBlockHash() {
        return blockHash;
    }

    public void setBlockHash(String blockHash) {
        this.blockHash = blockHash;
    }

    public long getBlockNumber() {
        return blockNumber;
    }

    public void setBlockNumber(long blockNumber) {
        this.blockNumber = blockNumber;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getSlimNodeId() {
        return slimNodeId;
    }

    public void setSlimNodeId(String slimNodeId) {
        this.slimNodeId = slimNodeId;
    }

    public long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }

    @Override
    public String toString() {
        return String.format("TokenizationResult{success=%b, tokenId='%s', merkleRoot='%s', message='%s'}",
            success, tokenId, merkleRoot != null ? merkleRoot.substring(0, Math.min(16, merkleRoot.length())) + "..." : "null", message);
    }
}
