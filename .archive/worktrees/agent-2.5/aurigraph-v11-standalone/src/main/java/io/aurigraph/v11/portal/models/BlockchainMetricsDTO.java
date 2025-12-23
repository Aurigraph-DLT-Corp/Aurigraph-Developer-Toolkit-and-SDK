package io.aurigraph.v11.portal.models;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Blockchain metrics DTO for Portal
 * Maps to /api/v11/blockchain/metrics endpoint
 */
public class BlockchainMetricsDTO {
    @JsonProperty("tps")
    private long tps;

    @JsonProperty("avgBlockTime")
    private long avgBlockTime;

    @JsonProperty("activenodes")
    private int activenodes;

    @JsonProperty("totalTransactions")
    private long totalTransactions;

    @JsonProperty("consensus")
    private String consensus;

    @JsonProperty("status")
    private String status;

    @JsonProperty("blockHeight")
    private long blockHeight;

    @JsonProperty("difficulty")
    private String difficulty;

    @JsonProperty("networkLoad")
    private double networkLoad;

    @JsonProperty("finality")
    private long finality;

    // Constructors
    public BlockchainMetricsDTO() {
    }

    public BlockchainMetricsDTO(long tps, long avgBlockTime, int activenodes,
                                long totalTransactions, String consensus, String status) {
        this.tps = tps;
        this.avgBlockTime = avgBlockTime;
        this.activenodes = activenodes;
        this.totalTransactions = totalTransactions;
        this.consensus = consensus;
        this.status = status;
    }

    // Builder pattern for easier construction
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private long tps;
        private long avgBlockTime;
        private int activenodes;
        private long totalTransactions;
        private String consensus;
        private String status;
        private long blockHeight;
        private String difficulty;
        private double networkLoad;
        private long finality;

        public Builder tps(long tps) {
            this.tps = tps;
            return this;
        }

        public Builder avgBlockTime(long avgBlockTime) {
            this.avgBlockTime = avgBlockTime;
            return this;
        }

        public Builder activenodes(int activenodes) {
            this.activenodes = activenodes;
            return this;
        }

        public Builder totalTransactions(long totalTransactions) {
            this.totalTransactions = totalTransactions;
            return this;
        }

        public Builder consensus(String consensus) {
            this.consensus = consensus;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder blockHeight(long blockHeight) {
            this.blockHeight = blockHeight;
            return this;
        }

        public Builder difficulty(String difficulty) {
            this.difficulty = difficulty;
            return this;
        }

        public Builder networkLoad(double networkLoad) {
            this.networkLoad = networkLoad;
            return this;
        }

        public Builder finality(long finality) {
            this.finality = finality;
            return this;
        }

        public BlockchainMetricsDTO build() {
            BlockchainMetricsDTO dto = new BlockchainMetricsDTO();
            dto.tps = this.tps;
            dto.avgBlockTime = this.avgBlockTime;
            dto.activenodes = this.activenodes;
            dto.totalTransactions = this.totalTransactions;
            dto.consensus = this.consensus;
            dto.status = this.status;
            dto.blockHeight = this.blockHeight;
            dto.difficulty = this.difficulty;
            dto.networkLoad = this.networkLoad;
            dto.finality = this.finality;
            return dto;
        }
    }

    // Getters and Setters
    public long getTps() {
        return tps;
    }

    public void setTps(long tps) {
        this.tps = tps;
    }

    public long getAvgBlockTime() {
        return avgBlockTime;
    }

    public void setAvgBlockTime(long avgBlockTime) {
        this.avgBlockTime = avgBlockTime;
    }

    public int getActivenodes() {
        return activenodes;
    }

    public void setActivenodes(int activenodes) {
        this.activenodes = activenodes;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public String getConsensus() {
        return consensus;
    }

    public void setConsensus(String consensus) {
        this.consensus = consensus;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getBlockHeight() {
        return blockHeight;
    }

    public void setBlockHeight(long blockHeight) {
        this.blockHeight = blockHeight;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public double getNetworkLoad() {
        return networkLoad;
    }

    public void setNetworkLoad(double networkLoad) {
        this.networkLoad = networkLoad;
    }

    public long getFinality() {
        return finality;
    }

    public void setFinality(long finality) {
        this.finality = finality;
    }
}
