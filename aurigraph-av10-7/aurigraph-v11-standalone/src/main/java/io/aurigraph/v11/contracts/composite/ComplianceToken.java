package io.aurigraph.v11.contracts.composite;

import java.time.Instant;
import java.util.*;

/**
 * Compliance Token (ERC-721) - Manages regulatory compliance and KYC/AML status
 * Part of composite token package - wAUR-COMPLY-{ID}
 * Ensures compliance across multiple jurisdictions
 */
public class ComplianceToken extends SecondaryToken {
    private ComplianceStatus overallStatus;
    private Map<String, JurisdictionCompliance> jurisdictionCompliance;
    private Map<String, KYCRecord> kycRecords;
    private List<ComplianceViolation> violations;
    private List<ComplianceAudit> auditHistory;
    private Map<String, RegulatoryRequirement> requirements;
    private Instant lastComplianceCheck;
    private int complianceScore; // 0-100 scale

    public ComplianceToken(String tokenId, String compositeId, ComplianceStatus overallStatus,
                          Map<String, Object> complianceData) {
        super(tokenId, compositeId, SecondaryTokenType.COMPLIANCE);
        this.overallStatus = overallStatus != null ? overallStatus : ComplianceStatus.PENDING;
        this.jurisdictionCompliance = new HashMap<>();
        this.kycRecords = new HashMap<>();
        this.violations = new ArrayList<>();
        this.auditHistory = new ArrayList<>();
        this.requirements = new HashMap<>();
        this.lastComplianceCheck = Instant.now();
        this.complianceScore = 0;
        
        // Initialize compliance data if provided
        if (complianceData != null && !complianceData.isEmpty()) {
            updateComplianceData(complianceData);
        }
        
        // Initialize default regulatory requirements
        initializeRegulatoryRequirements();
    }

    /**
     * Add KYC record for a participant
     */
    public String addKYCRecord(String participantId, KYCRecord kycRecord) {
        String recordId = generateKYCRecordId(participantId);
        kycRecord.setRecordId(recordId);
        kycRecord.setLastUpdated(Instant.now());
        
        kycRecords.put(participantId, kycRecord);
        
        // Update compliance status based on KYC completion
        updateComplianceScore();
        checkOverallCompliance();
        
        setLastUpdated(Instant.now());
        return recordId;
    }

    /**
     * Update KYC record
     */
    public boolean updateKYCRecord(String participantId, Map<String, Object> kycData) {
        KYCRecord record = kycRecords.get(participantId);
        if (record == null) {
            return false;
        }
        
        record.updateData(kycData);
        record.setLastUpdated(Instant.now());
        
        updateComplianceScore();
        checkOverallCompliance();
        setLastUpdated(Instant.now());
        
        return true;
    }

    /**
     * Add jurisdiction compliance data
     */
    public void addJurisdictionCompliance(String jurisdiction, JurisdictionCompliance compliance) {
        jurisdictionCompliance.put(jurisdiction, compliance);
        
        // Create audit record
        ComplianceAudit audit = new ComplianceAudit(
            "JURISDICTION_ADDED",
            jurisdiction,
            compliance.getStatus().toString(),
            "Jurisdiction compliance added: " + jurisdiction,
            Instant.now()
        );
        auditHistory.add(audit);
        
        updateComplianceScore();
        checkOverallCompliance();
        setLastUpdated(Instant.now());
    }

    /**
     * Update jurisdiction compliance status
     */
    public boolean updateJurisdictionCompliance(String jurisdiction, ComplianceStatus status, 
                                              String details) {
        JurisdictionCompliance compliance = jurisdictionCompliance.get(jurisdiction);
        if (compliance == null) {
            return false;
        }
        
        ComplianceStatus oldStatus = compliance.getStatus();
        compliance.setStatus(status);
        compliance.setDetails(details);
        compliance.setLastUpdated(Instant.now());
        
        // Create audit record
        ComplianceAudit audit = new ComplianceAudit(
            "STATUS_UPDATED",
            jurisdiction,
            oldStatus + " -> " + status,
            details,
            Instant.now()
        );
        auditHistory.add(audit);
        
        updateComplianceScore();
        checkOverallCompliance();
        setLastUpdated(Instant.now());
        
        return true;
    }

    /**
     * Record compliance violation
     */
    public String recordViolation(ComplianceViolation violation) {
        String violationId = generateViolationId(violation);
        violation.setViolationId(violationId);
        violation.setReportedAt(Instant.now());
        
        violations.add(violation);
        
        // Update overall status if serious violation
        if (violation.getSeverity() == ViolationSeverity.CRITICAL) {
            this.overallStatus = ComplianceStatus.NON_COMPLIANT;
        } else if (violation.getSeverity() == ViolationSeverity.HIGH && 
                   this.overallStatus == ComplianceStatus.COMPLIANT) {
            this.overallStatus = ComplianceStatus.CONDITIONAL;
        }
        
        // Create audit record
        ComplianceAudit audit = new ComplianceAudit(
            "VIOLATION_RECORDED",
            violation.getJurisdiction(),
            violation.getSeverity().toString(),
            violation.getDescription(),
            Instant.now()
        );
        auditHistory.add(audit);
        
        updateComplianceScore();
        setLastUpdated(Instant.now());
        
        return violationId;
    }

    /**
     * Resolve compliance violation
     */
    public boolean resolveViolation(String violationId, String resolutionDetails) {
        for (ComplianceViolation violation : violations) {
            if (violationId.equals(violation.getViolationId())) {
                violation.setStatus(ViolationStatus.RESOLVED);
                violation.setResolutionDetails(resolutionDetails);
                violation.setResolvedAt(Instant.now());
                
                // Create audit record
                ComplianceAudit audit = new ComplianceAudit(
                    "VIOLATION_RESOLVED",
                    violation.getJurisdiction(),
                    violation.getViolationType(),
                    resolutionDetails,
                    Instant.now()
                );
                auditHistory.add(audit);
                
                updateComplianceScore();
                checkOverallCompliance();
                setLastUpdated(Instant.now());
                
                return true;
            }
        }
        return false;
    }

    /**
     * Perform sanctions screening
     */
    public SanctionsScreeningResult performSanctionsScreening(String participantId) {
        // Simulate sanctions screening against various lists
        List<String> sanctionsLists = Arrays.asList(
            "OFAC_SDN", "EU_SANCTIONS", "UN_SANCTIONS", "FATF_GREY_LIST"
        );
        
        boolean hasMatch = false;
        List<String> matchedLists = new ArrayList<>();
        
        // Simulate screening process
        for (String list : sanctionsLists) {
            // In real implementation, this would query actual sanctions databases
            double randomScore = Math.random();
            if (randomScore < 0.01) { // 1% chance of match (for simulation)
                hasMatch = true;
                matchedLists.add(list);
            }
        }
        
        SanctionsScreeningResult result = new SanctionsScreeningResult(
            participantId,
            Instant.now(),
            hasMatch,
            matchedLists,
            hasMatch ? "POTENTIAL_MATCH" : "CLEAR"
        );
        
        // If sanctions match found, record violation
        if (hasMatch) {
            ComplianceViolation violation = new ComplianceViolation(
                "SANCTIONS_VIOLATION",
                "GLOBAL",
                ViolationSeverity.CRITICAL,
                "Potential sanctions list match: " + String.join(", ", matchedLists),
                participantId
            );
            recordViolation(violation);
        }
        
        return result;
    }

    /**
     * Generate compliance report
     */
    public ComplianceReport generateComplianceReport() {
        Map<String, ComplianceStatus> jurisdictionStatuses = new HashMap<>();
        for (Map.Entry<String, JurisdictionCompliance> entry : jurisdictionCompliance.entrySet()) {
            jurisdictionStatuses.put(entry.getKey(), entry.getValue().getStatus());
        }
        
        // Count violations by severity
        Map<ViolationSeverity, Long> violationCounts = new HashMap<>();
        for (ViolationSeverity severity : ViolationSeverity.values()) {
            long count = violations.stream()
                .filter(v -> v.getSeverity() == severity && v.getStatus() != ViolationStatus.RESOLVED)
                .count();
            violationCounts.put(severity, count);
        }
        
        // KYC completion statistics
        long completedKYC = kycRecords.values().stream()
            .filter(record -> record.getStatus() == KYCStatus.VERIFIED)
            .count();
        
        return new ComplianceReport(
            overallStatus,
            complianceScore,
            jurisdictionStatuses,
            violationCounts,
            (int) completedKYC,
            kycRecords.size(),
            lastComplianceCheck,
            generateRecommendations()
        );
    }

    /**
     * Check if compliant for specific jurisdiction
     */
    public boolean isCompliantInJurisdiction(String jurisdiction) {
        JurisdictionCompliance compliance = jurisdictionCompliance.get(jurisdiction);
        return compliance != null && compliance.getStatus() == ComplianceStatus.COMPLIANT;
    }

    /**
     * Get open violations
     */
    public List<ComplianceViolation> getOpenViolations() {
        return violations.stream()
            .filter(violation -> violation.getStatus() != ViolationStatus.RESOLVED)
            .toList();
    }

    /**
     * Get compliance requirements for jurisdiction
     */
    public List<RegulatoryRequirement> getRequirementsForJurisdiction(String jurisdiction) {
        return requirements.values().stream()
            .filter(req -> jurisdiction.equals(req.getJurisdiction()))
            .toList();
    }

    @Override
    public void updateData(Map<String, Object> updateData) {
        updateComplianceData(updateData);
    }

    // Private helper methods
    private void updateComplianceData(Map<String, Object> updateData) {
        if (updateData.containsKey("overallStatus")) {
            this.overallStatus = ComplianceStatus.valueOf((String) updateData.get("overallStatus"));
        }
        if (updateData.containsKey("complianceScore")) {
            this.complianceScore = (Integer) updateData.get("complianceScore");
        }
        
        updateComplianceScore();
        checkOverallCompliance();
        setLastUpdated(Instant.now());
    }

    private void updateComplianceScore() {
        int score = 0;
        
        // Base score from jurisdiction compliance
        int compliantJurisdictions = 0;
        for (JurisdictionCompliance compliance : jurisdictionCompliance.values()) {
            if (compliance.getStatus() == ComplianceStatus.COMPLIANT) {
                compliantJurisdictions++;
            }
        }
        if (!jurisdictionCompliance.isEmpty()) {
            score += (compliantJurisdictions * 40) / jurisdictionCompliance.size();
        }
        
        // KYC completion score
        long verifiedKYC = kycRecords.values().stream()
            .filter(record -> record.getStatus() == KYCStatus.VERIFIED)
            .count();
        if (!kycRecords.isEmpty()) {
            score += (int) ((verifiedKYC * 30) / kycRecords.size());
        }
        
        // Violation penalty
        long criticalViolations = violations.stream()
            .filter(v -> v.getSeverity() == ViolationSeverity.CRITICAL && v.getStatus() != ViolationStatus.RESOLVED)
            .count();
        long highViolations = violations.stream()
            .filter(v -> v.getSeverity() == ViolationSeverity.HIGH && v.getStatus() != ViolationStatus.RESOLVED)
            .count();
        
        score -= (criticalViolations * 20);
        score -= (highViolations * 10);
        
        // Base requirement compliance
        score += 30;
        
        this.complianceScore = Math.max(0, Math.min(100, score));
    }

    private void checkOverallCompliance() {
        lastComplianceCheck = Instant.now();
        
        // Check for critical violations
        boolean hasCriticalViolations = violations.stream()
            .anyMatch(v -> v.getSeverity() == ViolationSeverity.CRITICAL && v.getStatus() != ViolationStatus.RESOLVED);
        
        if (hasCriticalViolations) {
            this.overallStatus = ComplianceStatus.NON_COMPLIANT;
            return;
        }
        
        // Check jurisdiction compliance
        long compliantJurisdictions = jurisdictionCompliance.values().stream()
            .filter(c -> c.getStatus() == ComplianceStatus.COMPLIANT)
            .count();
        
        if (compliantJurisdictions == jurisdictionCompliance.size() && complianceScore >= 80) {
            this.overallStatus = ComplianceStatus.COMPLIANT;
        } else if (complianceScore >= 60) {
            this.overallStatus = ComplianceStatus.CONDITIONAL;
        } else {
            this.overallStatus = ComplianceStatus.NON_COMPLIANT;
        }
    }

    private void initializeRegulatoryRequirements() {
        // Initialize common regulatory requirements
        requirements.put("US_KYC", new RegulatoryRequirement(
            "US_KYC", "United States", "KYC verification required for US participants",
            RequirementType.KYC_VERIFICATION, true
        ));
        
        requirements.put("EU_GDPR", new RegulatoryRequirement(
            "EU_GDPR", "European Union", "GDPR compliance for EU data subjects",
            RequirementType.DATA_PROTECTION, true
        ));
        
        requirements.put("AML_MONITORING", new RegulatoryRequirement(
            "AML_MONITORING", "Global", "Ongoing AML transaction monitoring",
            RequirementType.AML_MONITORING, true
        ));
    }

    private String generateKYCRecordId(String participantId) {
        return String.format("kyc-%s-%d", 
            participantId.substring(0, Math.min(8, participantId.length())),
            System.nanoTime() % 100000);
    }

    private String generateViolationId(ComplianceViolation violation) {
        return String.format("viol-%s-%s-%d",
            violation.getViolationType().replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(6, violation.getViolationType().length())),
            violation.getJurisdiction().substring(0, Math.min(3, violation.getJurisdiction().length())),
            System.nanoTime() % 100000);
    }

    private List<String> generateRecommendations() {
        List<String> recommendations = new ArrayList<>();
        
        // Check for incomplete KYC
        long incompleteKYC = kycRecords.values().stream()
            .filter(record -> record.getStatus() != KYCStatus.VERIFIED)
            .count();
        if (incompleteKYC > 0) {
            recommendations.add("Complete KYC verification for " + incompleteKYC + " participants");
        }
        
        // Check for open violations
        long openViolations = getOpenViolations().size();
        if (openViolations > 0) {
            recommendations.add("Resolve " + openViolations + " open compliance violations");
        }
        
        // Check jurisdiction compliance
        long nonCompliantJurisdictions = jurisdictionCompliance.values().stream()
            .filter(c -> c.getStatus() != ComplianceStatus.COMPLIANT)
            .count();
        if (nonCompliantJurisdictions > 0) {
            recommendations.add("Address compliance issues in " + nonCompliantJurisdictions + " jurisdictions");
        }
        
        return recommendations;
    }

    // Getters
    public ComplianceStatus getOverallStatus() { return overallStatus; }
    public Map<String, JurisdictionCompliance> getJurisdictionCompliance() { return Map.copyOf(jurisdictionCompliance); }
    public Map<String, KYCRecord> getKycRecords() { return Map.copyOf(kycRecords); }
    public List<ComplianceViolation> getViolations() { return List.copyOf(violations); }
    public List<ComplianceAudit> getAuditHistory() { return List.copyOf(auditHistory); }
    public Instant getLastComplianceCheck() { return lastComplianceCheck; }
    public int getComplianceScore() { return complianceScore; }

    // Setters
    public void setOverallStatus(ComplianceStatus overallStatus) { this.overallStatus = overallStatus; }
}

// Supporting classes and enums

/**
 * KYC record for a participant
 */
class KYCRecord {
    private String recordId;
    private String participantId;
    private KYCStatus status;
    private KYCTier tier;
    private Map<String, Object> verificationData;
    private Instant completedAt;
    private Instant lastUpdated;
    private String verificationProvider;
    private List<String> documentsProvided;

    public KYCRecord(String participantId, KYCStatus status, KYCTier tier) {
        this.participantId = participantId;
        this.status = status;
        this.tier = tier;
        this.verificationData = new HashMap<>();
        this.documentsProvided = new ArrayList<>();
        this.lastUpdated = Instant.now();
    }

    public void updateData(Map<String, Object> data) {
        this.verificationData.putAll(data);
        this.lastUpdated = Instant.now();
        
        if (data.containsKey("status")) {
            this.status = KYCStatus.valueOf((String) data.get("status"));
        }
    }

    // Getters and setters
    public String getRecordId() { return recordId; }
    public void setRecordId(String recordId) { this.recordId = recordId; }
    
    public String getParticipantId() { return participantId; }
    public KYCStatus getStatus() { return status; }
    public void setStatus(KYCStatus status) { this.status = status; }
    
    public KYCTier getTier() { return tier; }
    public Map<String, Object> getVerificationData() { return Map.copyOf(verificationData); }
    
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    
    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
    
    public String getVerificationProvider() { return verificationProvider; }
    public void setVerificationProvider(String verificationProvider) { this.verificationProvider = verificationProvider; }
    
    public List<String> getDocumentsProvided() { return List.copyOf(documentsProvided); }
    public void setDocumentsProvided(List<String> documentsProvided) { this.documentsProvided = new ArrayList<>(documentsProvided); }
}

/**
 * Jurisdiction-specific compliance data
 */
class JurisdictionCompliance {
    private String jurisdiction;
    private ComplianceStatus status;
    private String details;
    private List<String> requiredDocuments;
    private Map<String, String> regulatoryReferences;
    private Instant lastUpdated;

    public JurisdictionCompliance(String jurisdiction, ComplianceStatus status, String details) {
        this.jurisdiction = jurisdiction;
        this.status = status;
        this.details = details;
        this.requiredDocuments = new ArrayList<>();
        this.regulatoryReferences = new HashMap<>();
        this.lastUpdated = Instant.now();
    }

    // Getters and setters
    public String getJurisdiction() { return jurisdiction; }
    public ComplianceStatus getStatus() { return status; }
    public void setStatus(ComplianceStatus status) { this.status = status; }
    
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    
    public List<String> getRequiredDocuments() { return List.copyOf(requiredDocuments); }
    public void setRequiredDocuments(List<String> requiredDocuments) { this.requiredDocuments = new ArrayList<>(requiredDocuments); }
    
    public Map<String, String> getRegulatoryReferences() { return Map.copyOf(regulatoryReferences); }
    public void setRegulatoryReferences(Map<String, String> regulatoryReferences) { this.regulatoryReferences = new HashMap<>(regulatoryReferences); }
    
    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
}

/**
 * Compliance violation record
 */
class ComplianceViolation {
    private String violationId;
    private String violationType;
    private String jurisdiction;
    private ViolationSeverity severity;
    private String description;
    private String participantId;
    private ViolationStatus status;
    private Instant reportedAt;
    private Instant resolvedAt;
    private String resolutionDetails;

    public ComplianceViolation(String violationType, String jurisdiction, ViolationSeverity severity,
                             String description, String participantId) {
        this.violationType = violationType;
        this.jurisdiction = jurisdiction;
        this.severity = severity;
        this.description = description;
        this.participantId = participantId;
        this.status = ViolationStatus.OPEN;
    }

    // Getters and setters
    public String getViolationId() { return violationId; }
    public void setViolationId(String violationId) { this.violationId = violationId; }
    
    public String getViolationType() { return violationType; }
    public String getJurisdiction() { return jurisdiction; }
    public ViolationSeverity getSeverity() { return severity; }
    public String getDescription() { return description; }
    public String getParticipantId() { return participantId; }
    
    public ViolationStatus getStatus() { return status; }
    public void setStatus(ViolationStatus status) { this.status = status; }
    
    public Instant getReportedAt() { return reportedAt; }
    public void setReportedAt(Instant reportedAt) { this.reportedAt = reportedAt; }
    
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
    
    public String getResolutionDetails() { return resolutionDetails; }
    public void setResolutionDetails(String resolutionDetails) { this.resolutionDetails = resolutionDetails; }
}

/**
 * Compliance audit record
 */
class ComplianceAudit {
    private final String action;
    private final String jurisdiction;
    private final String previousValue;
    private final String description;
    private final Instant timestamp;

    public ComplianceAudit(String action, String jurisdiction, String previousValue, 
                          String description, Instant timestamp) {
        this.action = action;
        this.jurisdiction = jurisdiction;
        this.previousValue = previousValue;
        this.description = description;
        this.timestamp = timestamp;
    }

    // Getters
    public String getAction() { return action; }
    public String getJurisdiction() { return jurisdiction; }
    public String getPreviousValue() { return previousValue; }
    public String getDescription() { return description; }
    public Instant getTimestamp() { return timestamp; }
}

/**
 * Regulatory requirement
 */
class RegulatoryRequirement {
    private final String requirementId;
    private final String jurisdiction;
    private final String description;
    private final RequirementType type;
    private final boolean mandatory;

    public RegulatoryRequirement(String requirementId, String jurisdiction, String description,
                               RequirementType type, boolean mandatory) {
        this.requirementId = requirementId;
        this.jurisdiction = jurisdiction;
        this.description = description;
        this.type = type;
        this.mandatory = mandatory;
    }

    // Getters
    public String getRequirementId() { return requirementId; }
    public String getJurisdiction() { return jurisdiction; }
    public String getDescription() { return description; }
    public RequirementType getType() { return type; }
    public boolean isMandatory() { return mandatory; }
}

/**
 * Sanctions screening result
 */
class SanctionsScreeningResult {
    private final String participantId;
    private final Instant screeningDate;
    private final boolean hasMatch;
    private final List<String> matchedLists;
    private final String result;

    public SanctionsScreeningResult(String participantId, Instant screeningDate, boolean hasMatch,
                                  List<String> matchedLists, String result) {
        this.participantId = participantId;
        this.screeningDate = screeningDate;
        this.hasMatch = hasMatch;
        this.matchedLists = new ArrayList<>(matchedLists);
        this.result = result;
    }

    // Getters
    public String getParticipantId() { return participantId; }
    public Instant getScreeningDate() { return screeningDate; }
    public boolean isHasMatch() { return hasMatch; }
    public List<String> getMatchedLists() { return List.copyOf(matchedLists); }
    public String getResult() { return result; }
}

/**
 * Compliance report
 */
class ComplianceReport {
    private final ComplianceStatus overallStatus;
    private final int complianceScore;
    private final Map<String, ComplianceStatus> jurisdictionStatuses;
    private final Map<ViolationSeverity, Long> violationCounts;
    private final int completedKYC;
    private final int totalKYC;
    private final Instant reportDate;
    private final List<String> recommendations;

    public ComplianceReport(ComplianceStatus overallStatus, int complianceScore,
                           Map<String, ComplianceStatus> jurisdictionStatuses,
                           Map<ViolationSeverity, Long> violationCounts,
                           int completedKYC, int totalKYC, Instant reportDate,
                           List<String> recommendations) {
        this.overallStatus = overallStatus;
        this.complianceScore = complianceScore;
        this.jurisdictionStatuses = new HashMap<>(jurisdictionStatuses);
        this.violationCounts = new HashMap<>(violationCounts);
        this.completedKYC = completedKYC;
        this.totalKYC = totalKYC;
        this.reportDate = reportDate;
        this.recommendations = new ArrayList<>(recommendations);
    }

    // Getters
    public ComplianceStatus getOverallStatus() { return overallStatus; }
    public int getComplianceScore() { return complianceScore; }
    public Map<String, ComplianceStatus> getJurisdictionStatuses() { return jurisdictionStatuses; }
    public Map<ViolationSeverity, Long> getViolationCounts() { return violationCounts; }
    public int getCompletedKYC() { return completedKYC; }
    public int getTotalKYC() { return totalKYC; }
    public Instant getReportDate() { return reportDate; }
    public List<String> getRecommendations() { return recommendations; }
}

// Enumerations

enum ComplianceStatus {
    PENDING,              // Initial state, compliance check needed
    COMPLIANT,            // Fully compliant with all requirements
    CONDITIONAL,          // Conditionally compliant with minor issues
    NON_COMPLIANT,        // Not compliant, requires remediation
    SUSPENDED,            // Compliance suspended
    UNDER_REVIEW          // Under regulatory review
}

enum KYCStatus {
    NOT_STARTED,          // KYC not initiated
    IN_PROGRESS,          // KYC verification in progress
    PENDING_REVIEW,       // Awaiting manual review
    VERIFIED,             // KYC successfully verified
    REJECTED,             // KYC verification failed
    EXPIRED               // KYC verification expired
}

enum KYCTier {
    BASIC,                // Basic verification
    ENHANCED,             // Enhanced due diligence
    INSTITUTIONAL         // Institutional-level verification
}

enum ViolationSeverity {
    LOW,                  // Minor violation
    MEDIUM,               // Moderate violation
    HIGH,                 // Serious violation
    CRITICAL              // Critical violation requiring immediate action
}

enum ViolationStatus {
    OPEN,                 // Violation is open
    UNDER_REVIEW,         // Under review for resolution
    RESOLVED,             // Violation resolved
    ESCALATED             // Escalated to authorities
}

enum RequirementType {
    KYC_VERIFICATION,     // KYC/identity verification
    AML_MONITORING,       // AML transaction monitoring
    DATA_PROTECTION,      // Data protection compliance
    LICENSING,            // Regulatory licensing
    REPORTING,            // Regulatory reporting
    CAPITAL_REQUIREMENTS  // Capital adequacy requirements
}