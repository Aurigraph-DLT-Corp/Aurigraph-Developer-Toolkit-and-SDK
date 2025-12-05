package io.aurigraph.v11.contracts.composite;

import java.util.List;
import java.util.Map;

/**
 * Verification Submission DTO - Data submitted by a verifier
 */
public class VerificationSubmission {
    private boolean verified;
    private VerificationLevel verificationLevel;
    private String reportSummary;
    private List<String> supportingDocuments;
    private Map<String, Object> findings;
    private String verifierNotes;

    public VerificationSubmission() {}

    public VerificationSubmission(boolean verified, VerificationLevel verificationLevel,
                                 String reportSummary, List<String> supportingDocuments,
                                 Map<String, Object> findings, String verifierNotes) {
        this.verified = verified;
        this.verificationLevel = verificationLevel;
        this.reportSummary = reportSummary;
        this.supportingDocuments = supportingDocuments;
        this.findings = findings;
        this.verifierNotes = verifierNotes;
    }

    // Getters and setters
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public VerificationLevel getVerificationLevel() { return verificationLevel; }
    public void setVerificationLevel(VerificationLevel verificationLevel) {
        this.verificationLevel = verificationLevel;
    }

    public String getReportSummary() { return reportSummary; }
    public void setReportSummary(String reportSummary) { this.reportSummary = reportSummary; }

    public List<String> getSupportingDocuments() { return supportingDocuments; }
    public void setSupportingDocuments(List<String> supportingDocuments) {
        this.supportingDocuments = supportingDocuments;
    }

    public Map<String, Object> getFindings() { return findings; }
    public void setFindings(Map<String, Object> findings) { this.findings = findings; }

    public String getVerifierNotes() { return verifierNotes; }
    public void setVerifierNotes(String verifierNotes) { this.verifierNotes = verifierNotes; }
}
