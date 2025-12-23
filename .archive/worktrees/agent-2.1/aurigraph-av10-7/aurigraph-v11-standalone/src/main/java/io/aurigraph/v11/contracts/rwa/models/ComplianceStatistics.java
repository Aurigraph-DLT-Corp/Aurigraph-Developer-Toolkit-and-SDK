package io.aurigraph.v11.contracts.rwa.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.time.Instant;
import java.util.Map;
import java.math.BigDecimal;

/**
 * Compliance Statistics Model
 * Statistical compliance data for analytics and reporting
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceStatistics {
    
    @JsonProperty("periodStart")
    private Instant periodStart;
    
    @JsonProperty("periodEnd")
    private Instant periodEnd;
    
    @JsonProperty("generatedAt")
    private Instant generatedAt;
    
    @JsonProperty("jurisdiction")
    private RegulatoryJurisdiction jurisdiction;
    
    // User Statistics
    @JsonProperty("totalUsers")
    private Long totalUsers;
    
    @JsonProperty("verifiedUsers")
    private Long verifiedUsers;
    
    @JsonProperty("pendingUsers")
    private Long pendingUsers;
    
    @JsonProperty("rejectedUsers")
    private Long rejectedUsers;
    
    @JsonProperty("suspendedUsers")
    private Long suspendedUsers;
    
    @JsonProperty("highRiskUsers")
    private Long highRiskUsers;
    
    @JsonProperty("pepUsers")
    private Long pepUsers;
    
    @JsonProperty("sanctionedUsers")
    private Long sanctionedUsers;
    
    @JsonProperty("institutionalUsers")
    private Long institutionalUsers;
    
    @JsonProperty("accreditedUsers")
    private Long accreditedUsers;
    
    // KYC Statistics
    @JsonProperty("kycChecksPerformed")
    private Long kycChecksPerformed;
    
    @JsonProperty("kycChecksSuccessful")
    private Long kycChecksSuccessful;
    
    @JsonProperty("kycChecksFailed")
    private Long kycChecksFailed;
    
    @JsonProperty("kycChecksPending")
    private Long kycChecksPending;
    
    @JsonProperty("averageKycTime")
    private Double averageKycTime; // in hours
    
    @JsonProperty("kycSuccessRate")
    private Double kycSuccessRate; // percentage
    
    @JsonProperty("kycRetryRate")
    private Double kycRetryRate;
    
    @JsonProperty("kycManualReviewRate")
    private Double kycManualReviewRate;
    
    // AML Statistics
    @JsonProperty("amlScreeningsPerformed")
    private Long amlScreeningsPerformed;
    
    @JsonProperty("amlPositiveHits")
    private Long amlPositiveHits;
    
    @JsonProperty("amlFalsePositives")
    private Long amlFalsePositives;
    
    @JsonProperty("amlTruePositives")
    private Long amlTruePositives;
    
    @JsonProperty("amlAccuracyRate")
    private Double amlAccuracyRate;
    
    @JsonProperty("averageAmlTime")
    private Double averageAmlTime; // in seconds
    
    @JsonProperty("enhancedDueDiligenceRate")
    private Double enhancedDueDiligenceRate;
    
    // Transaction Statistics
    @JsonProperty("totalTransactions")
    private Long totalTransactions;
    
    @JsonProperty("approvedTransactions")
    private Long approvedTransactions;
    
    @JsonProperty("rejectedTransactions")
    private Long rejectedTransactions;
    
    @JsonProperty("flaggedTransactions")
    private Long flaggedTransactions;
    
    @JsonProperty("monitoredTransactions")
    private Long monitoredTransactions;
    
    @JsonProperty("totalTransactionVolume")
    private BigDecimal totalTransactionVolume;
    
    @JsonProperty("averageTransactionSize")
    private BigDecimal averageTransactionSize;
    
    @JsonProperty("largeTransactions")
    private Long largeTransactions; // Above threshold
    
    @JsonProperty("crossBorderTransactions")
    private Long crossBorderTransactions;
    
    @JsonProperty("transactionApprovalRate")
    private Double transactionApprovalRate;
    
    @JsonProperty("averageTransactionProcessingTime")
    private Double averageTransactionProcessingTime; // in seconds
    
    // Violation Statistics
    @JsonProperty("totalViolations")
    private Long totalViolations;
    
    @JsonProperty("resolvedViolations")
    private Long resolvedViolations;
    
    @JsonProperty("pendingViolations")
    private Long pendingViolations;
    
    @JsonProperty("criticalViolations")
    private Long criticalViolations;
    
    @JsonProperty("regulatoryViolations")
    private Long regulatoryViolations;
    
    @JsonProperty("averageViolationResolutionTime")
    private Double averageViolationResolutionTime; // in days
    
    @JsonProperty("violationRecurrenceRate")
    private Double violationRecurrenceRate;
    
    @JsonProperty("totalFinesImposed")
    private BigDecimal totalFinesImposed;
    
    // Screening Statistics
    @JsonProperty("sanctionsScreeningsPerformed")
    private Long sanctionsScreeningsPerformed;
    
    @JsonProperty("sanctionsMatches")
    private Long sanctionsMatches;
    
    @JsonProperty("pepMatches")
    private Long pepMatches;
    
    @JsonProperty("watchlistMatches")
    private Long watchlistMatches;
    
    @JsonProperty("adverseMediaHits")
    private Long adverseMediaHits;
    
    @JsonProperty("screeningAccuracyRate")
    private Double screeningAccuracyRate;
    
    @JsonProperty("falsePositiveRate")
    private Double falsePositiveRate;
    
    @JsonProperty("averageScreeningTime")
    private Double averageScreeningTime; // in milliseconds
    
    // Risk Statistics
    @JsonProperty("averageRiskScore")
    private Double averageRiskScore;
    
    @JsonProperty("highRiskTransactions")
    private Long highRiskTransactions;
    
    @JsonProperty("riskDistribution")
    private Map<String, Long> riskDistribution; // Risk level -> count
    
    @JsonProperty("alertsGenerated")
    private Long alertsGenerated;
    
    @JsonProperty("alertsInvestigated")
    private Long alertsInvestigated;
    
    @JsonProperty("alertsResolved")
    private Long alertsResolved;
    
    @JsonProperty("falseAlertRate")
    private Double falseAlertRate;
    
    @JsonProperty("averageInvestigationTime")
    private Double averageInvestigationTime; // in hours
    
    // Performance Statistics
    @JsonProperty("overallComplianceScore")
    private Double overallComplianceScore; // 0-100
    
    @JsonProperty("complianceEfficiency")
    private Double complianceEfficiency; // processed/total
    
    @JsonProperty("automationRate")
    private Double automationRate; // automated/total
    
    @JsonProperty("manualReviewRate")
    private Double manualReviewRate;
    
    @JsonProperty("systemUptime")
    private Double systemUptime; // percentage
    
    @JsonProperty("averageSystemResponseTime")
    private Double averageSystemResponseTime; // in milliseconds
    
    // Cost Statistics
    @JsonProperty("totalComplianceCost")
    private BigDecimal totalComplianceCost;
    
    @JsonProperty("costPerTransaction")
    private BigDecimal costPerTransaction;
    
    @JsonProperty("costPerUser")
    private BigDecimal costPerUser;
    
    @JsonProperty("costPerCheck")
    private BigDecimal costPerCheck;
    
    // Trend Statistics
    @JsonProperty("complianceScoreTrend")
    private Double complianceScoreTrend; // percentage change
    
    @JsonProperty("volumeTrend")
    private Double volumeTrend;
    
    @JsonProperty("violationTrend")
    private Double violationTrend;
    
    @JsonProperty("riskTrend")
    private Double riskTrend;
    
    @JsonProperty("efficiencyTrend")
    private Double efficiencyTrend;
    
    // Distribution Statistics
    @JsonProperty("usersByJurisdiction")
    private Map<String, Long> usersByJurisdiction;
    
    @JsonProperty("transactionsByType")
    private Map<String, Long> transactionsByType;
    
    @JsonProperty("violationsByType")
    private Map<String, Long> violationsByType;
    
    @JsonProperty("checksByType")
    private Map<String, Long> checksByType;
    
    @JsonProperty("usersByRiskLevel")
    private Map<String, Long> usersByRiskLevel;
    
    @JsonProperty("transactionsByRiskLevel")
    private Map<String, Long> transactionsByRiskLevel;
    
    // Constructor with period - initialize defaults here since we need a constructor with parameters
    public ComplianceStatistics(Instant periodStart, Instant periodEnd) {
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.generatedAt = Instant.now();
        this.totalUsers = 0L;
        this.totalTransactions = 0L;
        this.totalViolations = 0L;
        this.totalTransactionVolume = BigDecimal.ZERO;
        this.totalFinesImposed = BigDecimal.ZERO;
        this.totalComplianceCost = BigDecimal.ZERO;
    }
    
    // Initialize default values using @Builder.Default or in constructor with parameters
    
    /**
     * Calculate derived statistics
     */
    public void calculateDerivedStatistics() {
        // Calculate rates and percentages
        if (kycChecksPerformed != null && kycChecksPerformed > 0) {
            if (kycChecksSuccessful != null) {
                this.kycSuccessRate = (double) kycChecksSuccessful / kycChecksPerformed * 100.0;
            }
        }
        
        if (totalTransactions != null && totalTransactions > 0) {
            if (approvedTransactions != null) {
                this.transactionApprovalRate = (double) approvedTransactions / totalTransactions * 100.0;
            }
            
            if (totalTransactionVolume != null) {
                this.averageTransactionSize = totalTransactionVolume.divide(
                    BigDecimal.valueOf(totalTransactions), 2, BigDecimal.ROUND_HALF_UP);
            }
            
            if (totalComplianceCost != null) {
                this.costPerTransaction = totalComplianceCost.divide(
                    BigDecimal.valueOf(totalTransactions), 2, BigDecimal.ROUND_HALF_UP);
            }
        }
        
        if (totalUsers != null && totalUsers > 0) {
            if (verifiedUsers != null) {
                double verificationRate = (double) verifiedUsers / totalUsers * 100.0;
            }
            
            if (totalComplianceCost != null) {
                this.costPerUser = totalComplianceCost.divide(
                    BigDecimal.valueOf(totalUsers), 2, BigDecimal.ROUND_HALF_UP);
            }
        }
        
        if (totalViolations != null && totalViolations > 0 && resolvedViolations != null) {
            double resolutionRate = (double) resolvedViolations / totalViolations * 100.0;
        }
        
        if (amlScreeningsPerformed != null && amlScreeningsPerformed > 0) {
            if (amlFalsePositives != null && amlTruePositives != null) {
                long totalPositives = amlFalsePositives + amlTruePositives;
                if (totalPositives > 0) {
                    this.amlAccuracyRate = (double) amlTruePositives / totalPositives * 100.0;
                }
            }
        }
        
        // Calculate efficiency metrics
        if (kycChecksPerformed != null && amlScreeningsPerformed != null) {
            long totalChecks = kycChecksPerformed + amlScreeningsPerformed;
            if (totalChecks > 0 && totalComplianceCost != null) {
                this.costPerCheck = totalComplianceCost.divide(
                    BigDecimal.valueOf(totalChecks), 2, BigDecimal.ROUND_HALF_UP);
            }
        }
    }
    
    /**
     * Get overall health status
     */
    public String getComplianceHealthStatus() {
        if (overallComplianceScore == null) {
            return "Unknown";
        }
        
        if (overallComplianceScore >= 95) return "Excellent";
        else if (overallComplianceScore >= 85) return "Good";
        else if (overallComplianceScore >= 75) return "Fair";
        else if (overallComplianceScore >= 60) return "Poor";
        else return "Critical";
    }
    
    /**
     * Check if compliance is improving
     */
    public boolean isComplianceImproving() {
        return complianceScoreTrend != null && complianceScoreTrend > 0;
    }
    
    /**
     * Get compliance grade (A-F)
     */
    public String getComplianceGrade() {
        if (overallComplianceScore == null) return "N/A";
        
        if (overallComplianceScore >= 95) return "A+";
        else if (overallComplianceScore >= 90) return "A";
        else if (overallComplianceScore >= 85) return "A-";
        else if (overallComplianceScore >= 80) return "B+";
        else if (overallComplianceScore >= 75) return "B";
        else if (overallComplianceScore >= 70) return "B-";
        else if (overallComplianceScore >= 65) return "C+";
        else if (overallComplianceScore >= 60) return "C";
        else if (overallComplianceScore >= 55) return "C-";
        else if (overallComplianceScore >= 50) return "D";
        else return "F";
    }
    
    /**
     * Get key performance indicators
     */
    public Map<String, Object> getKPIs() {
        Map<String, Object> kpis = new java.util.HashMap<>();
        
        kpis.put("Overall Compliance Score", overallComplianceScore);
        kpis.put("Compliance Grade", getComplianceGrade());
        kpis.put("KYC Success Rate", kycSuccessRate);
        kpis.put("Transaction Approval Rate", transactionApprovalRate);
        kpis.put("AML Accuracy Rate", amlAccuracyRate);
        kpis.put("False Positive Rate", falsePositiveRate);
        kpis.put("Violation Resolution Rate", 
                totalViolations != null && totalViolations > 0 && resolvedViolations != null ? 
                (double) resolvedViolations / totalViolations * 100.0 : null);
        kpis.put("Automation Rate", automationRate);
        kpis.put("System Uptime", systemUptime);
        kpis.put("Average Processing Time", averageTransactionProcessingTime);
        
        return kpis;
    }
    
    /**
     * Generate executive summary
     */
    public String generateExecutiveSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append("Compliance Statistics Summary:\n");
        summary.append("Period: ").append(periodStart).append(" to ").append(periodEnd).append("\n\n");
        
        if (overallComplianceScore != null) {
            summary.append("Overall Compliance Score: ").append(String.format("%.1f", overallComplianceScore))
                   .append(" (").append(getComplianceGrade()).append(")\n");
        }
        
        if (totalUsers != null) {
            summary.append("Total Users: ").append(totalUsers);
            if (verifiedUsers != null) {
                double rate = (double) verifiedUsers / totalUsers * 100.0;
                summary.append(" (").append(String.format("%.1f%%", rate)).append(" verified)\n");
            } else {
                summary.append("\n");
            }
        }
        
        if (totalTransactions != null) {
            summary.append("Total Transactions: ").append(totalTransactions);
            if (transactionApprovalRate != null) {
                summary.append(" (").append(String.format("%.1f%%", transactionApprovalRate)).append(" approved)\n");
            } else {
                summary.append("\n");
            }
        }
        
        if (totalViolations != null) {
            summary.append("Total Violations: ").append(totalViolations);
            if (resolvedViolations != null) {
                double rate = totalViolations > 0 ? (double) resolvedViolations / totalViolations * 100.0 : 0.0;
                summary.append(" (").append(String.format("%.1f%%", rate)).append(" resolved)\n");
            } else {
                summary.append("\n");
            }
        }
        
        if (complianceScoreTrend != null) {
            summary.append("Trend: ").append(complianceScoreTrend > 0 ? "Improving" : 
                          complianceScoreTrend < 0 ? "Declining" : "Stable")
                   .append(" (").append(String.format("%.1f%%", Math.abs(complianceScoreTrend))).append(")\n");
        }
        
        return summary.toString();
    }
}