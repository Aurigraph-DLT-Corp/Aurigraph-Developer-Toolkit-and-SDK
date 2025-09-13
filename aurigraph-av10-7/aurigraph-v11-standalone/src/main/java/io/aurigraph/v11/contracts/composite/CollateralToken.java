package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Collateral Token (ERC-1155) - Manages collateral assets and insurance backing
 * Part of composite token package - wAUR-COLL-{ID}[]
 * Provides additional security and risk mitigation for tokenized assets
 */
public class CollateralToken extends SecondaryToken {
    private List<CollateralAsset> collateralAssets;
    private Map<String, InsurancePolicy> insurancePolicies;
    private BigDecimal totalCollateralValue;
    private BigDecimal collateralRatio; // Collateral value / Asset value
    private CollateralStatus status;
    private List<CollateralEvent> eventHistory;
    private Map<CollateralType, BigDecimal> typeDistribution;

    public CollateralToken(String tokenId, String compositeId, List<CollateralAsset> collateralAssets) {
        super(tokenId, compositeId, SecondaryTokenType.COLLATERAL);
        this.collateralAssets = new ArrayList<>(collateralAssets);
        this.insurancePolicies = new HashMap<>();
        this.totalCollateralValue = BigDecimal.ZERO;
        this.collateralRatio = BigDecimal.ZERO;
        this.status = CollateralStatus.ACTIVE;
        this.eventHistory = new ArrayList<>();
        this.typeDistribution = new HashMap<>();
        
        // Initialize calculations
        recalculateCollateralValue();
        updateTypeDistribution();
    }

    /**
     * Add a new collateral asset
     */
    public String addCollateralAsset(CollateralAsset asset) {
        String assetId = generateAssetId(asset);
        asset.setAssetId(assetId);
        asset.setAddedAt(Instant.now());
        
        collateralAssets.add(asset);
        
        // Record event
        CollateralEvent event = new CollateralEvent(
            CollateralEventType.ASSET_ADDED,
            assetId,
            asset.getValue(),
            "Collateral asset added: " + asset.getDescription(),
            Instant.now()
        );
        eventHistory.add(event);
        
        // Recalculate totals
        recalculateCollateralValue();
        updateTypeDistribution();
        setLastUpdated(Instant.now());
        
        return assetId;
    }

    /**
     * Remove a collateral asset
     */
    public boolean removeCollateralAsset(String assetId) {
        Optional<CollateralAsset> assetToRemove = collateralAssets.stream()
            .filter(asset -> assetId.equals(asset.getAssetId()))
            .findFirst();
            
        if (assetToRemove.isEmpty()) {
            return false;
        }
        
        CollateralAsset asset = assetToRemove.get();
        collateralAssets.remove(asset);
        
        // Record event
        CollateralEvent event = new CollateralEvent(
            CollateralEventType.ASSET_REMOVED,
            assetId,
            asset.getValue(),
            "Collateral asset removed: " + asset.getDescription(),
            Instant.now()
        );
        eventHistory.add(event);
        
        // Recalculate totals
        recalculateCollateralValue();
        updateTypeDistribution();
        setLastUpdated(Instant.now());
        
        return true;
    }

    /**
     * Update collateral asset value
     */
    public boolean updateAssetValue(String assetId, BigDecimal newValue) {
        for (CollateralAsset asset : collateralAssets) {
            if (assetId.equals(asset.getAssetId())) {
                BigDecimal oldValue = asset.getValue();
                asset.setValue(newValue);
                asset.setLastValuationDate(Instant.now());
                
                // Record event
                CollateralEvent event = new CollateralEvent(
                    CollateralEventType.VALUE_UPDATED,
                    assetId,
                    newValue.subtract(oldValue),
                    String.format("Asset value updated from %s to %s", oldValue, newValue),
                    Instant.now()
                );
                eventHistory.add(event);
                
                recalculateCollateralValue();
                setLastUpdated(Instant.now());
                return true;
            }
        }
        return false;
    }

    /**
     * Add insurance policy
     */
    public String addInsurancePolicy(InsurancePolicy policy) {
        String policyId = generatePolicyId(policy);
        policy.setPolicyId(policyId);
        
        insurancePolicies.put(policyId, policy);
        
        // Record event
        CollateralEvent event = new CollateralEvent(
            CollateralEventType.INSURANCE_ADDED,
            policyId,
            policy.getCoverageAmount(),
            "Insurance policy added: " + policy.getPolicyType(),
            Instant.now()
        );
        eventHistory.add(event);
        
        setLastUpdated(Instant.now());
        return policyId;
    }

    /**
     * Remove insurance policy
     */
    public boolean removeInsurancePolicy(String policyId) {
        InsurancePolicy removedPolicy = insurancePolicies.remove(policyId);
        
        if (removedPolicy != null) {
            // Record event
            CollateralEvent event = new CollateralEvent(
                CollateralEventType.INSURANCE_REMOVED,
                policyId,
                removedPolicy.getCoverageAmount(),
                "Insurance policy removed: " + removedPolicy.getPolicyType(),
                Instant.now()
            );
            eventHistory.add(event);
            
            setLastUpdated(Instant.now());
            return true;
        }
        
        return false;
    }

    /**
     * File insurance claim
     */
    public String fileInsuranceClaim(String policyId, BigDecimal claimAmount, String description) {
        InsurancePolicy policy = insurancePolicies.get(policyId);
        
        if (policy == null) {
            throw new IllegalArgumentException("Insurance policy not found: " + policyId);
        }
        
        String claimId = policy.fileClaim(claimAmount, description);
        
        // Record event
        CollateralEvent event = new CollateralEvent(
            CollateralEventType.CLAIM_FILED,
            claimId,
            claimAmount,
            "Insurance claim filed: " + description,
            Instant.now()
        );
        eventHistory.add(event);
        
        setLastUpdated(Instant.now());
        return claimId;
    }

    /**
     * Get collateral adequacy assessment
     */
    public CollateralAdequacy assessCollateralAdequacy(BigDecimal assetValue) {
        if (assetValue.equals(BigDecimal.ZERO)) {
            return new CollateralAdequacy(false, BigDecimal.ZERO, BigDecimal.ZERO, 
                                        "Asset value is zero");
        }
        
        BigDecimal ratio = totalCollateralValue.divide(assetValue, 4, java.math.RoundingMode.HALF_UP);
        this.collateralRatio = ratio;
        
        // Get insurance coverage
        BigDecimal totalInsuranceCoverage = insurancePolicies.values().stream()
            .filter(policy -> policy.getStatus() == InsuranceStatus.ACTIVE)
            .map(InsurancePolicy::getCoverageAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalProtection = totalCollateralValue.add(totalInsuranceCoverage);
        BigDecimal protectionRatio = totalProtection.divide(assetValue, 4, java.math.RoundingMode.HALF_UP);
        
        // Assessment criteria
        boolean adequate = protectionRatio.compareTo(BigDecimal.valueOf(1.2)) >= 0; // 120% protection
        
        String assessment;
        if (protectionRatio.compareTo(BigDecimal.valueOf(1.5)) >= 0) {
            assessment = "Excellent protection - well collateralized";
        } else if (protectionRatio.compareTo(BigDecimal.valueOf(1.2)) >= 0) {
            assessment = "Good protection - adequately collateralized";
        } else if (protectionRatio.compareTo(BigDecimal.valueOf(1.0)) >= 0) {
            assessment = "Marginal protection - consider additional collateral";
        } else {
            assessment = "Insufficient protection - requires immediate attention";
        }
        
        return new CollateralAdequacy(adequate, ratio, protectionRatio, assessment);
    }

    /**
     * Get collateral statistics
     */
    public CollateralStats getCollateralStats() {
        int activeInsurancePolicies = (int) insurancePolicies.values().stream()
            .filter(policy -> policy.getStatus() == InsuranceStatus.ACTIVE)
            .count();
            
        BigDecimal totalInsuranceCoverage = insurancePolicies.values().stream()
            .filter(policy -> policy.getStatus() == InsuranceStatus.ACTIVE)
            .map(InsurancePolicy::getCoverageAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return new CollateralStats(
            collateralAssets.size(),
            totalCollateralValue,
            activeInsurancePolicies,
            totalInsuranceCoverage,
            new HashMap<>(typeDistribution),
            collateralRatio
        );
    }

    /**
     * Get collateral assets by type
     */
    public List<CollateralAsset> getAssetsByType(CollateralType type) {
        return collateralAssets.stream()
            .filter(asset -> asset.getCollateralType() == type)
            .toList();
    }

    /**
     * Get active insurance policies
     */
    public List<InsurancePolicy> getActiveInsurancePolicies() {
        return insurancePolicies.values().stream()
            .filter(policy -> policy.getStatus() == InsuranceStatus.ACTIVE)
            .toList();
    }

    @Override
    public void updateData(Map<String, Object> updateData) {
        if (updateData.containsKey("status")) {
            this.status = CollateralStatus.valueOf((String) updateData.get("status"));
        }
        setLastUpdated(Instant.now());
    }

    // Private helper methods
    private String generateAssetId(CollateralAsset asset) {
        return String.format("coll-%s-%s-%d", 
            asset.getCollateralType().name().toLowerCase(),
            asset.getDescription().replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(8, asset.getDescription().length())),
            System.nanoTime() % 100000);
    }

    private String generatePolicyId(InsurancePolicy policy) {
        return String.format("ins-%s-%s-%d",
            policy.getPolicyType().name().toLowerCase(),
            policy.getProvider().replaceAll("[^a-zA-Z0-9]", "").substring(0, Math.min(6, policy.getProvider().length())),
            System.nanoTime() % 100000);
    }

    private void recalculateCollateralValue() {
        totalCollateralValue = collateralAssets.stream()
            .map(CollateralAsset::getValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void updateTypeDistribution() {
        typeDistribution.clear();
        for (CollateralAsset asset : collateralAssets) {
            typeDistribution.merge(asset.getCollateralType(), asset.getValue(), BigDecimal::add);
        }
    }

    // Getters
    public List<CollateralAsset> getCollateralAssets() { return List.copyOf(collateralAssets); }
    public Map<String, InsurancePolicy> getInsurancePolicies() { return Map.copyOf(insurancePolicies); }
    public BigDecimal getTotalCollateralValue() { return totalCollateralValue; }
    public BigDecimal getCollateralRatio() { return collateralRatio; }
    public CollateralStatus getStatus() { return status; }
    public List<CollateralEvent> getEventHistory() { return List.copyOf(eventHistory); }
    public Map<CollateralType, BigDecimal> getTypeDistribution() { return Map.copyOf(typeDistribution); }

    // Setters
    public void setStatus(CollateralStatus status) { this.status = status; }
}

/**
 * Individual collateral asset
 */
class CollateralAsset {
    private String assetId;
    private CollateralType collateralType;
    private String description;
    private BigDecimal value;
    private String currency;
    private Instant lastValuationDate;
    private Instant addedAt;
    private String valuationSource;
    private Map<String, Object> metadata;

    public CollateralAsset(CollateralType collateralType, String description, 
                          BigDecimal value, String currency) {
        this.collateralType = collateralType;
        this.description = description;
        this.value = value;
        this.currency = currency != null ? currency : "USD";
        this.lastValuationDate = Instant.now();
        this.metadata = new HashMap<>();
    }

    // Getters and setters
    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }
    
    public CollateralType getCollateralType() { return collateralType; }
    public String getDescription() { return description; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
    
    public String getCurrency() { return currency; }
    public Instant getLastValuationDate() { return lastValuationDate; }
    public void setLastValuationDate(Instant lastValuationDate) { this.lastValuationDate = lastValuationDate; }
    
    public Instant getAddedAt() { return addedAt; }
    public void setAddedAt(Instant addedAt) { this.addedAt = addedAt; }
    
    public String getValuationSource() { return valuationSource; }
    public void setValuationSource(String valuationSource) { this.valuationSource = valuationSource; }
    
    public Map<String, Object> getMetadata() { return Map.copyOf(metadata); }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = new HashMap<>(metadata); }
}

/**
 * Insurance policy
 */
class InsurancePolicy {
    private String policyId;
    private InsuranceType policyType;
    private String provider;
    private BigDecimal coverageAmount;
    private String currency;
    private Instant effectiveDate;
    private Instant expirationDate;
    private BigDecimal premium;
    private InsuranceStatus status;
    private List<InsuranceClaim> claims;
    private Map<String, Object> terms;

    public InsurancePolicy(InsuranceType policyType, String provider, BigDecimal coverageAmount,
                          Instant effectiveDate, Instant expirationDate, BigDecimal premium) {
        this.policyType = policyType;
        this.provider = provider;
        this.coverageAmount = coverageAmount;
        this.currency = "USD";
        this.effectiveDate = effectiveDate;
        this.expirationDate = expirationDate;
        this.premium = premium;
        this.status = InsuranceStatus.ACTIVE;
        this.claims = new ArrayList<>();
        this.terms = new HashMap<>();
    }

    public String fileClaim(BigDecimal claimAmount, String description) {
        String claimId = "claim-" + System.nanoTime();
        
        InsuranceClaim claim = new InsuranceClaim(
            claimId, claimAmount, description, Instant.now(), ClaimStatus.FILED
        );
        
        claims.add(claim);
        return claimId;
    }

    // Getters and setters
    public String getPolicyId() { return policyId; }
    public void setPolicyId(String policyId) { this.policyId = policyId; }
    
    public InsuranceType getPolicyType() { return policyType; }
    public String getProvider() { return provider; }
    public BigDecimal getCoverageAmount() { return coverageAmount; }
    public String getCurrency() { return currency; }
    
    public Instant getEffectiveDate() { return effectiveDate; }
    public Instant getExpirationDate() { return expirationDate; }
    public BigDecimal getPremium() { return premium; }
    
    public InsuranceStatus getStatus() { return status; }
    public void setStatus(InsuranceStatus status) { this.status = status; }
    
    public List<InsuranceClaim> getClaims() { return List.copyOf(claims); }
    public Map<String, Object> getTerms() { return Map.copyOf(terms); }
    public void setTerms(Map<String, Object> terms) { this.terms = new HashMap<>(terms); }
}

/**
 * Insurance claim
 */
class InsuranceClaim {
    private final String claimId;
    private final BigDecimal claimAmount;
    private final String description;
    private final Instant filedAt;
    private ClaimStatus status;

    public InsuranceClaim(String claimId, BigDecimal claimAmount, String description, 
                         Instant filedAt, ClaimStatus status) {
        this.claimId = claimId;
        this.claimAmount = claimAmount;
        this.description = description;
        this.filedAt = filedAt;
        this.status = status;
    }

    // Getters
    public String getClaimId() { return claimId; }
    public BigDecimal getClaimAmount() { return claimAmount; }
    public String getDescription() { return description; }
    public Instant getFiledAt() { return filedAt; }
    public ClaimStatus getStatus() { return status; }
    public void setStatus(ClaimStatus status) { this.status = status; }
}

/**
 * Collateral event for audit trail
 */
class CollateralEvent {
    private final CollateralEventType eventType;
    private final String assetId;
    private final BigDecimal amount;
    private final String description;
    private final Instant timestamp;

    public CollateralEvent(CollateralEventType eventType, String assetId, BigDecimal amount,
                          String description, Instant timestamp) {
        this.eventType = eventType;
        this.assetId = assetId;
        this.amount = amount;
        this.description = description;
        this.timestamp = timestamp;
    }

    // Getters
    public CollateralEventType getEventType() { return eventType; }
    public String getAssetId() { return assetId; }
    public BigDecimal getAmount() { return amount; }
    public String getDescription() { return description; }
    public Instant getTimestamp() { return timestamp; }
}

/**
 * Collateral adequacy assessment
 */
class CollateralAdequacy {
    private final boolean adequate;
    private final BigDecimal collateralRatio;
    private final BigDecimal protectionRatio;
    private final String assessment;

    public CollateralAdequacy(boolean adequate, BigDecimal collateralRatio, 
                            BigDecimal protectionRatio, String assessment) {
        this.adequate = adequate;
        this.collateralRatio = collateralRatio;
        this.protectionRatio = protectionRatio;
        this.assessment = assessment;
    }

    // Getters
    public boolean isAdequate() { return adequate; }
    public BigDecimal getCollateralRatio() { return collateralRatio; }
    public BigDecimal getProtectionRatio() { return protectionRatio; }
    public String getAssessment() { return assessment; }
}

/**
 * Collateral statistics
 */
class CollateralStats {
    private final int totalAssets;
    private final BigDecimal totalValue;
    private final int activeInsurancePolicies;
    private final BigDecimal totalInsuranceCoverage;
    private final Map<CollateralType, BigDecimal> typeDistribution;
    private final BigDecimal collateralRatio;

    public CollateralStats(int totalAssets, BigDecimal totalValue, int activeInsurancePolicies,
                          BigDecimal totalInsuranceCoverage, Map<CollateralType, BigDecimal> typeDistribution,
                          BigDecimal collateralRatio) {
        this.totalAssets = totalAssets;
        this.totalValue = totalValue;
        this.activeInsurancePolicies = activeInsurancePolicies;
        this.totalInsuranceCoverage = totalInsuranceCoverage;
        this.typeDistribution = typeDistribution;
        this.collateralRatio = collateralRatio;
    }

    // Getters
    public int getTotalAssets() { return totalAssets; }
    public BigDecimal getTotalValue() { return totalValue; }
    public int getActiveInsurancePolicies() { return activeInsurancePolicies; }
    public BigDecimal getTotalInsuranceCoverage() { return totalInsuranceCoverage; }
    public Map<CollateralType, BigDecimal> getTypeDistribution() { return typeDistribution; }
    public BigDecimal getCollateralRatio() { return collateralRatio; }
}

// Enumerations

enum CollateralType {
    PROPERTY_INSURANCE,     // Property insurance policies
    PERFORMANCE_BOND,       // Performance guarantees
    CASH_ESCROW,           // Cash held in escrow
    SECURITIES,            // Marketable securities
    REAL_ESTATE,           // Additional real estate
    EQUIPMENT,             // Equipment and machinery
    COMMODITIES,           // Commodity assets
    PROFESSIONAL_LIABILITY, // Professional liability coverage
    ENVIRONMENTAL_INSURANCE // Environmental risk coverage
}

enum InsuranceType {
    PROPERTY,              // Property insurance
    LIABILITY,             // Liability insurance
    TITLE,                // Title insurance
    ENVIRONMENTAL,         // Environmental insurance
    PROFESSIONAL_LIABILITY, // Professional liability
    PERFORMANCE_BOND,      // Performance bonds
    CREDIT_DEFAULT         // Credit default insurance
}

enum InsuranceStatus {
    ACTIVE,               // Policy is active
    EXPIRED,              // Policy has expired
    CANCELLED,            // Policy was cancelled
    SUSPENDED,            // Policy is suspended
    CLAIMED               // Claim has been made
}

enum ClaimStatus {
    FILED,                // Claim filed
    UNDER_REVIEW,         // Under review
    APPROVED,             // Claim approved
    DENIED,               // Claim denied
    PAID,                 // Claim paid out
    DISPUTED              // Claim disputed
}

enum CollateralStatus {
    ACTIVE,               // Collateral is active
    PENDING_VERIFICATION, // Awaiting verification
    VERIFIED,             // Collateral verified
    INSUFFICIENT,         // Insufficient collateral
    LIQUIDATING,          // Being liquidated
    SUSPENDED             // Temporarily suspended
}

enum CollateralEventType {
    ASSET_ADDED,          // Collateral asset added
    ASSET_REMOVED,        // Collateral asset removed
    VALUE_UPDATED,        // Asset value updated
    INSURANCE_ADDED,      // Insurance policy added
    INSURANCE_REMOVED,    // Insurance policy removed
    CLAIM_FILED,          // Insurance claim filed
    POLICY_EXPIRED        // Insurance policy expired
}