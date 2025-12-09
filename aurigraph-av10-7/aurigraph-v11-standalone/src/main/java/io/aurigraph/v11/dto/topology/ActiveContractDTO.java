package io.aurigraph.v11.dto.topology;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

/**
 * Data Transfer Object for Active Smart Contracts
 * Represents a smart contract running on a node
 */
public record ActiveContractDTO(
    @JsonProperty("contractAddress") String contractAddress,
    @JsonProperty("contractName") String contractName,
    @JsonProperty("status") ContractStatus status,
    @JsonProperty("executionCount") long executionCount,
    @JsonProperty("totalGasUsed") String totalGasUsed,
    @JsonProperty("deployedAt") Instant deployedAt,
    @JsonProperty("lastExecution") Instant lastExecution,
    @JsonProperty("ownerAddress") String ownerAddress,
    @JsonProperty("contractVersion") String contractVersion
) {
    /**
     * Contract status enumeration
     */
    public enum ContractStatus {
        ACTIVE,
        PAUSED,
        PENDING,
        ERROR
    }

    /**
     * Builder for ActiveContractDTO
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String contractAddress;
        private String contractName;
        private ContractStatus status = ContractStatus.ACTIVE;
        private long executionCount;
        private String totalGasUsed = "0";
        private Instant deployedAt;
        private Instant lastExecution;
        private String ownerAddress;
        private String contractVersion = "1.0.0";

        public Builder contractAddress(String contractAddress) { this.contractAddress = contractAddress; return this; }
        public Builder contractName(String contractName) { this.contractName = contractName; return this; }
        public Builder status(ContractStatus status) { this.status = status; return this; }
        public Builder executionCount(long executionCount) { this.executionCount = executionCount; return this; }
        public Builder totalGasUsed(String totalGasUsed) { this.totalGasUsed = totalGasUsed; return this; }
        public Builder deployedAt(Instant deployedAt) { this.deployedAt = deployedAt; return this; }
        public Builder lastExecution(Instant lastExecution) { this.lastExecution = lastExecution; return this; }
        public Builder ownerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; return this; }
        public Builder contractVersion(String contractVersion) { this.contractVersion = contractVersion; return this; }

        public ActiveContractDTO build() {
            return new ActiveContractDTO(
                contractAddress, contractName, status, executionCount,
                totalGasUsed, deployedAt, lastExecution, ownerAddress, contractVersion
            );
        }
    }
}
