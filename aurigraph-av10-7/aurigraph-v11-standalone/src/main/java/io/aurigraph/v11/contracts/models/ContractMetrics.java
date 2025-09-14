package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContractMetrics {
    
    private long totalContracts;
    private long activeContracts;
    private long completedContracts;
    private long failedContracts;
    private BigDecimal totalValue;
    private BigDecimal averageExecutionTime;
    private BigDecimal successRate;
    private long totalExecutions;
    private long totalGasUsed;
    private Instant calculatedAt;
}