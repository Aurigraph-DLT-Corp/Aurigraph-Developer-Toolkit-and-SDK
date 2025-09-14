package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExecutionResult {
    
    private String executionId;
    private String contractId;
    private String transactionHash;
    private boolean success;
    private Object result; // Changed from String to Object for flexibility
    private String error;
    private long gasUsed;
    private Instant executedAt;
    private Map<String, Object> outputData;
    private String[] eventLogs;
    private ExecutionStatus status;
    private long executionTime;
    
    // Constructor for contract execution
    public ExecutionResult(String executionId, ExecutionStatus status, String error, Object result, long gasUsed, long executionTime) {
        this.executionId = executionId;
        this.status = status;
        this.error = error;
        this.result = result;
        this.gasUsed = gasUsed;
        this.executionTime = executionTime;
        this.success = (status == ExecutionStatus.SUCCESS);
        this.executedAt = Instant.now();
    }
    
    // Convenience methods
    public boolean isSuccess() {
        return success;
    }
    
    public long getExecutionTime() {
        return executionTime;
    }
    
    public String getError() {
        return error;
    }
}