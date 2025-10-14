package io.aurigraph.v11.contracts.models;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExecutionRequest {
    
    @NotBlank
    private String triggerId;
    
    private Map<String, Object> inputData;
    
    @NotBlank
    private String executorAddress;
    
    // Legacy fields for backward compatibility
    private String contractId;
    private Map<String, Object> executionParameters;
    private String transactionHash;
    @Builder.Default
    private long gasLimit = 1000000L;
    @Builder.Default
    private long gasPrice = 1000000000L; // 1 Gwei
    @Builder.Default
    private boolean simulate = false;
    
    // New fields for contract execution
    private String contractAddress;
    private String methodName;
    private Object[] parameters;
    private String caller;
    
    // Constructor for contract execution
    public ExecutionRequest(String contractAddress, String methodName, Object[] parameters, long gasLimit, String caller) {
        this.contractAddress = contractAddress;
        this.methodName = methodName;
        this.parameters = parameters;
        this.gasLimit = gasLimit;
        this.caller = caller;
        this.executorAddress = caller; // Set for backward compatibility
    }
    
    // Additional getters for backward compatibility
    public String getContractAddress() {
        return contractAddress != null ? contractAddress : contractId;
    }
    
    public Object[] getParameters() {
        return parameters;
    }
    
    public String getMethodName() {
        return methodName;
    }
    
    public String getCaller() {
        return caller != null ? caller : executorAddress;
    }
}