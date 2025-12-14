package io.aurigraph.v11.quantconnect;

import java.time.Instant;

/**
 * Tokenized Equity Model
 *
 * Represents equity data that has been tokenized on Aurigraph DLT.
 * Stored in the Merkle tree registry for cryptographic verification.
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
public class TokenizedEquity {

    private String tokenId;
    private String symbol;
    private String name;
    private double price;
    private long volume;
    private long marketCap;
    private double change24h;
    private Instant tokenizedAt;
    private String source;
    private String eiNodeId;
    private String merkleRoot;
    private String merkleProof;
    private String blockHash;
    private long blockNumber;
    private boolean verified = false;

    public TokenizedEquity() {}

    // Getters and Setters

    public String getTokenId() {
        return tokenId;
    }

    public void setTokenId(String tokenId) {
        this.tokenId = tokenId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public long getVolume() {
        return volume;
    }

    public void setVolume(long volume) {
        this.volume = volume;
    }

    public long getMarketCap() {
        return marketCap;
    }

    public void setMarketCap(long marketCap) {
        this.marketCap = marketCap;
    }

    public double getChange24h() {
        return change24h;
    }

    public void setChange24h(double change24h) {
        this.change24h = change24h;
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
        return String.format("TokenizedEquity{tokenId='%s', symbol='%s', price=%.2f, merkleRoot='%s', verified=%b}",
            tokenId, symbol, price, merkleRoot != null ? merkleRoot.substring(0, 16) + "..." : "null", verified);
    }
}
