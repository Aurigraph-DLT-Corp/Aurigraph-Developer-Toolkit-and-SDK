package io.aurigraph.v11.quantconnect;

import java.time.Instant;

/**
 * Tokenized Transaction Model
 *
 * Represents a transaction that has been tokenized on Aurigraph DLT.
 * Stored in the Merkle tree registry for cryptographic verification.
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
public class TokenizedTransaction {

    private String tokenId;
    private String transactionId;
    private String symbol;
    private String type;
    private int quantity;
    private double price;
    private double totalValue;
    private Instant timestamp;
    private Instant tokenizedAt;
    private String source;
    private String eiNodeId;
    private String merkleRoot;
    private String merkleProof;
    private String blockHash;
    private long blockNumber;
    private boolean verified = false;

    public TokenizedTransaction() {}

    // Getters and Setters

    public String getTokenId() {
        return tokenId;
    }

    public void setTokenId(String tokenId) {
        this.tokenId = tokenId;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public double getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(double totalValue) {
        this.totalValue = totalValue;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Instant getTokenizedAt() {
        return tokenizedAt;
    }

    public void setTokenizedAt(Instant tokenizedAt) {
        this.tokenizedAt = tokenizedAt;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getEINodeId() {
        return eiNodeId;
    }

    public void setEINodeId(String eiNodeId) {
        this.eiNodeId = eiNodeId;
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

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    @Override
    public String toString() {
        return String.format("TokenizedTransaction{tokenId='%s', txId='%s', symbol='%s', type='%s', total=%.2f, verified=%b}",
            tokenId, transactionId, symbol, type, totalValue, verified);
    }
}
