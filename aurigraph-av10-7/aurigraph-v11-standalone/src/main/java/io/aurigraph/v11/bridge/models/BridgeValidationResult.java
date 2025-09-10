package io.aurigraph.v11.bridge.models;

public class BridgeValidationResult {
    private final boolean valid;
    private final String errorMessage;
    
    private BridgeValidationResult(boolean valid, String errorMessage) {
        this.valid = valid;
        this.errorMessage = errorMessage;
    }
    
    public static BridgeValidationResult valid() {
        return new BridgeValidationResult(true, null);
    }
    
    public static BridgeValidationResult invalid(String errorMessage) {
        return new BridgeValidationResult(false, errorMessage);
    }
    
    public boolean isValid() { return valid; }
    public String getErrorMessage() { return errorMessage; }
}