package io.aurigraph.v11.bridge.models;

public class SecurityScreeningResult {
    private final boolean approved;
    private final String reason;
    
    public SecurityScreeningResult(boolean approved, String reason) {
        this.approved = approved;
        this.reason = reason;
    }
    
    public boolean isApproved() { return approved; }
    public String getReason() { return reason; }
}