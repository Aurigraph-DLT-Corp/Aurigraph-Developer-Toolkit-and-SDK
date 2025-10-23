package io.aurigraph.v11.hms.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Compliance information for healthcare assets
 */
public class ComplianceInfo {
    private boolean hipaaCompliant;
    private boolean gdprCompliant;
    private List<String> complianceFlags;
    private String consentSignature;
    private Instant consentTimestamp;
    private String jurisdiction;
    private Instant lastAuditTimestamp;
    private List<ComplianceViolation> violations;

    public ComplianceInfo() {
        this.complianceFlags = new ArrayList<>();
        this.violations = new ArrayList<>();
        this.hipaaCompliant = false;
        this.gdprCompliant = false;
    }

    // Getters and Setters
    public boolean isHipaaCompliant() {
        return hipaaCompliant;
    }

    public void setHipaaCompliant(boolean hipaaCompliant) {
        this.hipaaCompliant = hipaaCompliant;
    }

    public boolean isGdprCompliant() {
        return gdprCompliant;
    }

    public void setGdprCompliant(boolean gdprCompliant) {
        this.gdprCompliant = gdprCompliant;
    }

    public List<String> getComplianceFlags() {
        return complianceFlags;
    }

    public void setComplianceFlags(List<String> complianceFlags) {
        this.complianceFlags = complianceFlags;
    }

    public void addComplianceFlag(String flag) {
        this.complianceFlags.add(flag);
    }

    public String getConsentSignature() {
        return consentSignature;
    }

    public void setConsentSignature(String consentSignature) {
        this.consentSignature = consentSignature;
    }

    public Instant getConsentTimestamp() {
        return consentTimestamp;
    }

    public void setConsentTimestamp(Instant consentTimestamp) {
        this.consentTimestamp = consentTimestamp;
    }

    public String getJurisdiction() {
        return jurisdiction;
    }

    public void setJurisdiction(String jurisdiction) {
        this.jurisdiction = jurisdiction;
    }

    public Instant getLastAuditTimestamp() {
        return lastAuditTimestamp;
    }

    public void setLastAuditTimestamp(Instant lastAuditTimestamp) {
        this.lastAuditTimestamp = lastAuditTimestamp;
    }

    public List<ComplianceViolation> getViolations() {
        return violations;
    }

    public void setViolations(List<ComplianceViolation> violations) {
        this.violations = violations;
    }

    public void addViolation(ComplianceViolation violation) {
        this.violations.add(violation);
    }

    public boolean hasViolations() {
        return !violations.isEmpty();
    }

    public boolean isFullyCompliant() {
        return hipaaCompliant && gdprCompliant && !hasViolations();
    }
}
