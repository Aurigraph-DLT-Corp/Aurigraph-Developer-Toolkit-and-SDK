package io.aurigraph.v11.hms.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Diagnostic Report asset for tokenization
 */
public class DiagnosticReport extends HealthcareAsset {
    private String patientId;
    private String providerId;
    private String reportType;
    private String findings;
    private String conclusion;
    private List<String> observations;
    private Map<String, String> testResults;
    private Instant reportDate;
    private String radiologistId;
    private String imagingModality;
    private ReportStatus status;
    private ReportPriority priority;

    public DiagnosticReport() {
        super(AssetType.DIAGNOSTIC_REPORT);
        this.observations = new ArrayList<>();
        this.testResults = new HashMap<>();
        this.reportDate = Instant.now();
        this.status = ReportStatus.PRELIMINARY;
        this.priority = ReportPriority.ROUTINE;
    }

    public DiagnosticReport(String assetId, String patientId, String providerId, String reportType) {
        super(assetId, AssetType.DIAGNOSTIC_REPORT);
        this.patientId = patientId;
        this.providerId = providerId;
        this.reportType = reportType;
        this.observations = new ArrayList<>();
        this.testResults = new HashMap<>();
        this.reportDate = Instant.now();
        this.status = ReportStatus.PRELIMINARY;
        this.priority = ReportPriority.ROUTINE;
    }

    // Getters and Setters
    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getFindings() {
        return findings;
    }

    public void setFindings(String findings) {
        this.findings = findings;
    }

    public String getConclusion() {
        return conclusion;
    }

    public void setConclusion(String conclusion) {
        this.conclusion = conclusion;
    }

    public List<String> getObservations() {
        return observations;
    }

    public void setObservations(List<String> observations) {
        this.observations = observations;
    }

    public void addObservation(String observation) {
        this.observations.add(observation);
    }

    public Map<String, String> getTestResults() {
        return testResults;
    }

    public void setTestResults(Map<String, String> testResults) {
        this.testResults = testResults;
    }

    public void addTestResult(String testName, String result) {
        this.testResults.put(testName, result);
    }

    public Instant getReportDate() {
        return reportDate;
    }

    public void setReportDate(Instant reportDate) {
        this.reportDate = reportDate;
    }

    public String getRadiologistId() {
        return radiologistId;
    }

    public void setRadiologistId(String radiologistId) {
        this.radiologistId = radiologistId;
    }

    public String getImagingModality() {
        return imagingModality;
    }

    public void setImagingModality(String imagingModality) {
        this.imagingModality = imagingModality;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public ReportPriority getPriority() {
        return priority;
    }

    public void setPriority(ReportPriority priority) {
        this.priority = priority;
    }

    @Override
    public String toString() {
        return "DiagnosticReport{" +
                "assetId='" + getAssetId() + '\'' +
                ", patientId='" + patientId + '\'' +
                ", providerId='" + providerId + '\'' +
                ", reportType='" + reportType + '\'' +
                ", reportDate=" + reportDate +
                ", status=" + status +
                ", priority=" + priority +
                '}';
    }

    public enum ReportStatus {
        PRELIMINARY,
        FINAL,
        AMENDED,
        CORRECTED,
        CANCELLED
    }

    public enum ReportPriority {
        ROUTINE,
        URGENT,
        STAT,
        CRITICAL
    }
}
