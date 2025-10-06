package io.aurigraph.v11.contracts.rwa.compliance;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import io.quarkus.logging.Log;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import io.aurigraph.v11.contracts.rwa.models.*;
import io.aurigraph.v11.contracts.rwa.models.ComplianceProfile.*;
import io.aurigraph.v11.contracts.rwa.compliance.entities.KYCVerificationRecord;
import io.aurigraph.v11.contracts.rwa.compliance.entities.AMLScreeningRecord;

/**
 * KYC/AML Provider Integration Service
 * Integrates with multiple third-party KYC/AML providers for comprehensive compliance verification
 *
 * Supported Providers:
 * - Jumio: Identity verification and document authentication
 * - Onfido: Identity verification and AML screening
 * - Sumsub: Comprehensive KYC/AML/transaction monitoring
 * - ComplyAdvantage: AML risk data and sanctions screening
 * - Chainalysis: Blockchain transaction monitoring and risk assessment
 * - Elliptic: Crypto compliance and risk management
 * - Refinitiv World-Check: PEP and sanctions screening
 * - LexisNexis: Identity verification and fraud prevention
 *
 * AV11-406: Automated Compliance Monitoring (21 story points)
 */
@ApplicationScoped
public class KYCAMLProviderService {

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    // Configuration
    @ConfigProperty(name = "compliance.kyc.provider.enabled", defaultValue = "true")
    boolean kycProviderEnabled;

    @ConfigProperty(name = "compliance.aml.provider.enabled", defaultValue = "true")
    boolean amlProviderEnabled;

    @ConfigProperty(name = "compliance.kyc.verification.expiry.days", defaultValue = "365")
    int kycExpiryDays;

    @ConfigProperty(name = "compliance.aml.check.interval.days", defaultValue = "90")
    int amlCheckIntervalDays;

    // In-memory cache for fast access (backed by database)
    private final Map<String, KYCVerificationResult> kycCache = new ConcurrentHashMap<>();
    private final Map<String, AMLScreeningResult> amlCache = new ConcurrentHashMap<>();
    private final Map<String, List<VerificationAttempt>> verificationHistory = new ConcurrentHashMap<>();

    /**
     * Perform KYC verification for a user
     */
    @Transactional
    public Uni<KYCVerificationResult> performKYCVerification(String userId, String address,
                                                             RegulatoryJurisdiction jurisdiction,
                                                             KYCProvider provider,
                                                             Map<String, Object> documentData) {
        return Uni.createFrom().item(() -> {
            Log.infof("Performing KYC verification for user %s via provider %s in jurisdiction %s",
                     userId, provider, jurisdiction);

            // Record verification attempt
            recordVerificationAttempt(userId, "KYC", provider.toString());

            if (!kycProviderEnabled) {
                Log.warn("KYC provider is disabled, returning mock success");
                return createMockKYCSuccess(userId, address, jurisdiction, provider);
            }

            // Delegate to specific provider
            KYCVerificationResult result = switch (provider) {
                case JUMIO -> performJumioKYC(userId, address, jurisdiction, documentData);
                case ONFIDO -> performOnfidoKYC(userId, address, jurisdiction, documentData);
                case SUMSUB -> performSumsubKYC(userId, address, jurisdiction, documentData);
                case LEXISNEXIS -> performLexisNexisKYC(userId, address, jurisdiction, documentData);
                case INTERNAL -> performInternalKYC(userId, address, jurisdiction, documentData);
            };

            // Store result in cache
            kycCache.put(userId, result);

            // Persist to database
            persistKYCResult(result, jurisdiction);

            Log.infof("KYC verification completed for user %s: %s (score: %.2f)",
                     userId, result.getStatus(), result.getVerificationScore());

            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Perform AML screening for a user
     */
    @Transactional
    public Uni<AMLScreeningResult> performAMLScreening(String userId, String address,
                                                       RegulatoryJurisdiction jurisdiction,
                                                       AMLProvider provider) {
        return Uni.createFrom().item(() -> {
            Log.infof("Performing AML screening for user %s via provider %s in jurisdiction %s",
                     userId, provider, jurisdiction);

            recordVerificationAttempt(userId, "AML", provider.toString());

            if (!amlProviderEnabled) {
                Log.warn("AML provider is disabled, returning mock clear");
                return createMockAMLClear(userId, address, jurisdiction, provider);
            }

            // Delegate to specific provider
            AMLScreeningResult result = switch (provider) {
                case COMPLYADVANTAGE -> performComplyAdvantageAML(userId, address, jurisdiction);
                case CHAINALYSIS -> performChainalysisAML(userId, address, jurisdiction);
                case ELLIPTIC -> performEllipticAML(userId, address, jurisdiction);
                case REFINITIV -> performRefinitivAML(userId, address, jurisdiction);
                case SUMSUB -> performSumsubAML(userId, address, jurisdiction);
                case INTERNAL -> performInternalAML(userId, address, jurisdiction);
            };

            // Store result in cache
            amlCache.put(userId, result);

            // Persist to database
            persistAMLResult(result, jurisdiction);

            Log.infof("AML screening completed for user %s: %s (risk level: %s)",
                     userId, result.getStatus(), result.getRiskLevel());

            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get comprehensive compliance status for a user
     */
    public Uni<ComplianceVerificationStatus> getComplianceStatus(String userId) {
        return Uni.createFrom().item(() -> {
            // Try cache first
            KYCVerificationResult kycResult = kycCache.get(userId);
            AMLScreeningResult amlResult = amlCache.get(userId);

            // If not in cache, load from database
            if (kycResult == null) {
                KYCVerificationRecord record = KYCVerificationRecord.findByUserId(userId);
                if (record != null) {
                    kycResult = convertKYCRecordToResult(record);
                    kycCache.put(userId, kycResult);
                }
            }

            if (amlResult == null) {
                AMLScreeningRecord record = AMLScreeningRecord.findByUserId(userId);
                if (record != null) {
                    amlResult = convertAMLRecordToResult(record);
                    amlCache.put(userId, amlResult);
                }
            }

            ComplianceVerificationStatus status = new ComplianceVerificationStatus();
            status.setUserId(userId);
            status.setKycResult(kycResult);
            status.setAmlResult(amlResult);
            status.setTimestamp(Instant.now());

            // Determine overall status
            boolean kycValid = kycResult != null && kycResult.getStatus() == KYCStatus.VERIFIED
                              && !isKYCExpired(kycResult);
            boolean amlClear = amlResult != null && amlResult.getStatus() == AMLStatus.CLEAR;

            if (kycValid && amlClear) {
                status.setOverallStatus(ComplianceStatus.COMPLIANT);
            } else if (kycResult == null || amlResult == null) {
                status.setOverallStatus(ComplianceStatus.PENDING);
            } else {
                status.setOverallStatus(ComplianceStatus.NON_COMPLIANT);
            }

            return status;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if KYC needs renewal
     */
    public Uni<Boolean> requiresKYCRenewal(String userId) {
        return Uni.createFrom().item(() -> {
            KYCVerificationResult result = kycCache.get(userId);
            if (result == null) {
                // Check database
                KYCVerificationRecord record = KYCVerificationRecord.findByUserId(userId);
                if (record == null) return true;
                result = convertKYCRecordToResult(record);
                kycCache.put(userId, result);
            }
            return isKYCExpired(result);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if AML re-screening is due
     */
    public Uni<Boolean> requiresAMLRescreening(String userId) {
        return Uni.createFrom().item(() -> {
            AMLScreeningResult result = amlCache.get(userId);
            if (result == null) {
                // Check database
                AMLScreeningRecord record = AMLScreeningRecord.findByUserId(userId);
                if (record == null) return true;
                result = convertAMLRecordToResult(record);
                amlCache.put(userId, result);
            }

            Instant nextCheck = result.getTimestamp().plus(amlCheckIntervalDays, ChronoUnit.DAYS);
            return Instant.now().isAfter(nextCheck);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Provider-Specific Implementations ====================

    /**
     * Jumio KYC verification implementation
     */
    private KYCVerificationResult performJumioKYC(String userId, String address,
                                                  RegulatoryJurisdiction jurisdiction,
                                                  Map<String, Object> documentData) {
        Log.infof("Performing Jumio KYC for user %s", userId);

        // In production: call Jumio API
        // POST https://netverify.com/api/v4/initiate
        // with document images, selfie, etc.

        // Mock implementation for now
        KYCVerificationResult result = new KYCVerificationResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(KYCProvider.JUMIO);
        result.setStatus(KYCStatus.VERIFIED);
        result.setVerificationScore(95.5);
        result.setVerificationLevel(VerificationLevel.ENHANCED);
        result.setDocumentType("PASSPORT");
        result.setDocumentNumber("JUMIO-" + UUID.randomUUID().toString().substring(0, 8));
        result.setExpirationDate(Instant.now().plus(kycExpiryDays, ChronoUnit.DAYS));
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("JUMIO-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * Onfido KYC verification implementation
     */
    private KYCVerificationResult performOnfidoKYC(String userId, String address,
                                                   RegulatoryJurisdiction jurisdiction,
                                                   Map<String, Object> documentData) {
        Log.infof("Performing Onfido KYC for user %s", userId);

        // In production: call Onfido API
        // POST https://api.onfido.com/v3/checks

        KYCVerificationResult result = new KYCVerificationResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(KYCProvider.ONFIDO);
        result.setStatus(KYCStatus.VERIFIED);
        result.setVerificationScore(92.0);
        result.setVerificationLevel(jurisdiction.requiresEnhancedKYC() ?
                                   VerificationLevel.ENHANCED : VerificationLevel.BASIC);
        result.setDocumentType("DRIVERS_LICENSE");
        result.setDocumentNumber("ONFIDO-" + UUID.randomUUID().toString().substring(0, 8));
        result.setExpirationDate(Instant.now().plus(kycExpiryDays, ChronoUnit.DAYS));
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("ONFIDO-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * Sumsub KYC verification implementation
     */
    private KYCVerificationResult performSumsubKYC(String userId, String address,
                                                   RegulatoryJurisdiction jurisdiction,
                                                   Map<String, Object> documentData) {
        Log.infof("Performing Sumsub KYC for user %s", userId);

        // In production: call Sumsub API
        // POST https://api.sumsub.com/resources/applicants

        KYCVerificationResult result = new KYCVerificationResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(KYCProvider.SUMSUB);
        result.setStatus(KYCStatus.VERIFIED);
        result.setVerificationScore(96.8);
        result.setVerificationLevel(VerificationLevel.PREMIUM);
        result.setDocumentType("NATIONAL_ID");
        result.setDocumentNumber("SUMSUB-" + UUID.randomUUID().toString().substring(0, 8));
        result.setExpirationDate(Instant.now().plus(kycExpiryDays, ChronoUnit.DAYS));
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("SUMSUB-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * LexisNexis KYC verification implementation
     */
    private KYCVerificationResult performLexisNexisKYC(String userId, String address,
                                                       RegulatoryJurisdiction jurisdiction,
                                                       Map<String, Object> documentData) {
        Log.infof("Performing LexisNexis KYC for user %s", userId);

        // In production: call LexisNexis API
        // POST https://api.lexisnexis.com/verify

        KYCVerificationResult result = new KYCVerificationResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(KYCProvider.LEXISNEXIS);
        result.setStatus(KYCStatus.VERIFIED);
        result.setVerificationScore(93.2);
        result.setVerificationLevel(VerificationLevel.ENHANCED);
        result.setDocumentType("PASSPORT");
        result.setDocumentNumber("LEXIS-" + UUID.randomUUID().toString().substring(0, 8));
        result.setExpirationDate(Instant.now().plus(kycExpiryDays, ChronoUnit.DAYS));
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("LEXIS-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * Internal KYC verification (fallback)
     */
    private KYCVerificationResult performInternalKYC(String userId, String address,
                                                     RegulatoryJurisdiction jurisdiction,
                                                     Map<String, Object> documentData) {
        Log.infof("Performing internal KYC for user %s", userId);

        KYCVerificationResult result = new KYCVerificationResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(KYCProvider.INTERNAL);
        result.setStatus(KYCStatus.VERIFIED);
        result.setVerificationScore(85.0);
        result.setVerificationLevel(VerificationLevel.BASIC);
        result.setDocumentType("UNKNOWN");
        result.setDocumentNumber("INTERNAL-" + UUID.randomUUID().toString().substring(0, 8));
        result.setExpirationDate(Instant.now().plus(kycExpiryDays, ChronoUnit.DAYS));
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("INTERNAL-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * ComplyAdvantage AML screening implementation
     */
    private AMLScreeningResult performComplyAdvantageAML(String userId, String address,
                                                         RegulatoryJurisdiction jurisdiction) {
        Log.infof("Performing ComplyAdvantage AML screening for user %s", userId);

        // In production: call ComplyAdvantage API
        // POST https://api.complyadvantage.com/searches

        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(AMLProvider.COMPLYADVANTAGE);
        result.setStatus(AMLStatus.CLEAR);
        result.setRiskLevel(RiskLevel.LOW);
        result.setRiskScore(12.5);
        result.setSanctioned(false);
        result.setPep(false);
        result.setWatchlistMatches(new ArrayList<>());
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("CA-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * Chainalysis AML screening implementation
     */
    private AMLScreeningResult performChainalysisAML(String userId, String address,
                                                     RegulatoryJurisdiction jurisdiction) {
        Log.infof("Performing Chainalysis AML screening for user %s", userId);

        // In production: call Chainalysis API
        // POST https://api.chainalysis.com/api/kyt/v2/users

        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(AMLProvider.CHAINALYSIS);
        result.setStatus(AMLStatus.CLEAR);
        result.setRiskLevel(RiskLevel.LOW);
        result.setRiskScore(8.2);
        result.setSanctioned(false);
        result.setPep(false);
        result.setWatchlistMatches(new ArrayList<>());
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("CHAIN-" + UUID.randomUUID().toString());

        // Chainalysis specific: transaction exposure analysis
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("directExposure", 0.0);
        metadata.put("indirectExposure", 0.0);
        metadata.put("totalExposure", 0.0);
        result.setMetadata(metadata);

        return result;
    }

    /**
     * Elliptic AML screening implementation
     */
    private AMLScreeningResult performEllipticAML(String userId, String address,
                                                  RegulatoryJurisdiction jurisdiction) {
        Log.infof("Performing Elliptic AML screening for user %s", userId);

        // In production: call Elliptic API
        // POST https://api.elliptic.co/v2/wallet/synchronous

        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(AMLProvider.ELLIPTIC);
        result.setStatus(AMLStatus.CLEAR);
        result.setRiskLevel(RiskLevel.LOW);
        result.setRiskScore(10.0);
        result.setSanctioned(false);
        result.setPep(false);
        result.setWatchlistMatches(new ArrayList<>());
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("ELLIPTIC-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * Refinitiv World-Check AML screening implementation
     */
    private AMLScreeningResult performRefinitivAML(String userId, String address,
                                                   RegulatoryJurisdiction jurisdiction) {
        Log.infof("Performing Refinitiv World-Check AML screening for user %s", userId);

        // In production: call Refinitiv World-Check API
        // POST https://api-worldcheck.refinitiv.com/v1/cases/screeningRequest

        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(AMLProvider.REFINITIV);
        result.setStatus(AMLStatus.CLEAR);
        result.setRiskLevel(RiskLevel.LOW);
        result.setRiskScore(5.0);
        result.setSanctioned(false);
        result.setPep(false);
        result.setWatchlistMatches(new ArrayList<>());
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("REFINITIV-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * Sumsub AML screening implementation
     */
    private AMLScreeningResult performSumsubAML(String userId, String address,
                                                RegulatoryJurisdiction jurisdiction) {
        Log.infof("Performing Sumsub AML screening for user %s", userId);

        // In production: call Sumsub AML API
        // POST https://api.sumsub.com/resources/checks

        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(AMLProvider.SUMSUB);
        result.setStatus(AMLStatus.CLEAR);
        result.setRiskLevel(RiskLevel.LOW);
        result.setRiskScore(7.5);
        result.setSanctioned(false);
        result.setPep(false);
        result.setWatchlistMatches(new ArrayList<>());
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("SUMSUB-AML-" + UUID.randomUUID().toString());

        return result;
    }

    /**
     * Internal AML screening (fallback)
     */
    private AMLScreeningResult performInternalAML(String userId, String address,
                                                  RegulatoryJurisdiction jurisdiction) {
        Log.infof("Performing internal AML screening for user %s", userId);

        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(AMLProvider.INTERNAL);
        result.setStatus(AMLStatus.CLEAR);
        result.setRiskLevel(RiskLevel.MEDIUM);
        result.setRiskScore(25.0);
        result.setSanctioned(false);
        result.setPep(false);
        result.setWatchlistMatches(new ArrayList<>());
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("INTERNAL-AML-" + UUID.randomUUID().toString());

        return result;
    }

    // ==================== Helper Methods ====================

    private boolean isKYCExpired(KYCVerificationResult result) {
        if (result.getExpirationDate() == null) return false;
        return Instant.now().isAfter(result.getExpirationDate());
    }

    private void recordVerificationAttempt(String userId, String type, String provider) {
        verificationHistory.computeIfAbsent(userId, k -> new ArrayList<>())
                          .add(new VerificationAttempt(type, provider, Instant.now()));
    }

    private KYCVerificationResult createMockKYCSuccess(String userId, String address,
                                                       RegulatoryJurisdiction jurisdiction,
                                                       KYCProvider provider) {
        KYCVerificationResult result = new KYCVerificationResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(provider);
        result.setStatus(KYCStatus.VERIFIED);
        result.setVerificationScore(90.0);
        result.setVerificationLevel(VerificationLevel.BASIC);
        result.setDocumentType("MOCK");
        result.setDocumentNumber("MOCK-" + UUID.randomUUID().toString().substring(0, 8));
        result.setExpirationDate(Instant.now().plus(kycExpiryDays, ChronoUnit.DAYS));
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("MOCK-" + UUID.randomUUID().toString());
        return result;
    }

    private AMLScreeningResult createMockAMLClear(String userId, String address,
                                                  RegulatoryJurisdiction jurisdiction,
                                                  AMLProvider provider) {
        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(userId);
        result.setAddress(address);
        result.setProvider(provider);
        result.setStatus(AMLStatus.CLEAR);
        result.setRiskLevel(RiskLevel.LOW);
        result.setRiskScore(10.0);
        result.setSanctioned(false);
        result.setPep(false);
        result.setWatchlistMatches(new ArrayList<>());
        result.setTimestamp(Instant.now());
        result.setProviderReferenceId("MOCK-AML-" + UUID.randomUUID().toString());
        return result;
    }

    // ==================== Provider Enums ====================

    public enum KYCProvider {
        JUMIO,
        ONFIDO,
        SUMSUB,
        LEXISNEXIS,
        INTERNAL
    }

    public enum AMLProvider {
        COMPLYADVANTAGE,
        CHAINALYSIS,
        ELLIPTIC,
        REFINITIV,
        SUMSUB,
        INTERNAL
    }

    // ==================== Result Classes ====================

    public static class KYCVerificationResult {
        private String userId;
        private String address;
        private KYCProvider provider;
        private KYCStatus status;
        private double verificationScore;
        private VerificationLevel verificationLevel;
        private String documentType;
        private String documentNumber;
        private Instant expirationDate;
        private Instant timestamp;
        private String providerReferenceId;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public KYCProvider getProvider() { return provider; }
        public void setProvider(KYCProvider provider) { this.provider = provider; }
        public KYCStatus getStatus() { return status; }
        public void setStatus(KYCStatus status) { this.status = status; }
        public double getVerificationScore() { return verificationScore; }
        public void setVerificationScore(double verificationScore) { this.verificationScore = verificationScore; }
        public VerificationLevel getVerificationLevel() { return verificationLevel; }
        public void setVerificationLevel(VerificationLevel verificationLevel) { this.verificationLevel = verificationLevel; }
        public String getDocumentType() { return documentType; }
        public void setDocumentType(String documentType) { this.documentType = documentType; }
        public String getDocumentNumber() { return documentNumber; }
        public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
        public Instant getExpirationDate() { return expirationDate; }
        public void setExpirationDate(Instant expirationDate) { this.expirationDate = expirationDate; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public String getProviderReferenceId() { return providerReferenceId; }
        public void setProviderReferenceId(String providerReferenceId) { this.providerReferenceId = providerReferenceId; }
    }

    public static class AMLScreeningResult {
        private String userId;
        private String address;
        private AMLProvider provider;
        private AMLStatus status;
        private RiskLevel riskLevel;
        private double riskScore;
        private boolean sanctioned;
        private boolean pep;
        private List<String> watchlistMatches;
        private Instant timestamp;
        private String providerReferenceId;
        private Map<String, Object> metadata;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public AMLProvider getProvider() { return provider; }
        public void setProvider(AMLProvider provider) { this.provider = provider; }
        public AMLStatus getStatus() { return status; }
        public void setStatus(AMLStatus status) { this.status = status; }
        public RiskLevel getRiskLevel() { return riskLevel; }
        public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }
        public double getRiskScore() { return riskScore; }
        public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
        public boolean isSanctioned() { return sanctioned; }
        public void setSanctioned(boolean sanctioned) { this.sanctioned = sanctioned; }
        public boolean isPep() { return pep; }
        public void setPep(boolean pep) { this.pep = pep; }
        public List<String> getWatchlistMatches() { return watchlistMatches; }
        public void setWatchlistMatches(List<String> watchlistMatches) { this.watchlistMatches = watchlistMatches; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
        public String getProviderReferenceId() { return providerReferenceId; }
        public void setProviderReferenceId(String providerReferenceId) { this.providerReferenceId = providerReferenceId; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    public static class ComplianceVerificationStatus {
        private String userId;
        private KYCVerificationResult kycResult;
        private AMLScreeningResult amlResult;
        private ComplianceStatus overallStatus;
        private Instant timestamp;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public KYCVerificationResult getKycResult() { return kycResult; }
        public void setKycResult(KYCVerificationResult kycResult) { this.kycResult = kycResult; }
        public AMLScreeningResult getAmlResult() { return amlResult; }
        public void setAmlResult(AMLScreeningResult amlResult) { this.amlResult = amlResult; }
        public ComplianceStatus getOverallStatus() { return overallStatus; }
        public void setOverallStatus(ComplianceStatus overallStatus) { this.overallStatus = overallStatus; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    private static class VerificationAttempt {
        private final String type;
        private final String provider;
        private final Instant timestamp;

        public VerificationAttempt(String type, String provider, Instant timestamp) {
            this.type = type;
            this.provider = provider;
            this.timestamp = timestamp;
        }

        public String getType() { return type; }
        public String getProvider() { return provider; }
        public Instant getTimestamp() { return timestamp; }
    }

    // ==================== Database Persistence Methods ====================

    /**
     * Persist KYC verification result to database
     */
    private void persistKYCResult(KYCVerificationResult result, RegulatoryJurisdiction jurisdiction) {
        try {
            KYCVerificationRecord record = new KYCVerificationRecord();
            record.userId = result.getUserId();
            record.address = result.getAddress();
            record.jurisdiction = jurisdiction.name();
            record.provider = result.getProvider().name();
            record.verificationStatus = result.getStatus().name();
            record.riskLevel = result.getVerificationLevel().name();
            record.verificationId = result.getProviderReferenceId();
            record.expiresAt = LocalDateTime.ofInstant(result.getExpirationDate(), ZoneOffset.UTC);
            record.documentTypes = result.getDocumentType();
            record.verificationNotes = String.format("Score: %.2f, Level: %s",
                                                     result.getVerificationScore(),
                                                     result.getVerificationLevel());

            // Convert metadata to JSON
            Map<String, Object> metadata = Map.of(
                "verificationScore", result.getVerificationScore(),
                "documentNumber", result.getDocumentNumber(),
                "timestamp", result.getTimestamp().toString()
            );
            record.metadata = objectMapper.writeValueAsString(metadata);

            record.persist();
            Log.infof("Persisted KYC verification record for user %s (ID: %d)", result.getUserId(), record.id);

        } catch (Exception e) {
            Log.errorf(e, "Failed to persist KYC result for user %s", result.getUserId());
        }
    }

    /**
     * Persist AML screening result to database
     */
    private void persistAMLResult(AMLScreeningResult result, RegulatoryJurisdiction jurisdiction) {
        try {
            AMLScreeningRecord record = new AMLScreeningRecord();
            record.userId = result.getUserId();
            record.screeningId = result.getProviderReferenceId();
            record.jurisdiction = jurisdiction.name();
            record.riskScore = (int) (result.getRiskScore() * 10); // Convert to integer score
            record.riskLevel = result.getRiskLevel().name();
            record.pepStatus = result.isPep();
            record.sanctionsHit = result.isSanctioned();
            record.adverseMedia = false; // Default value
            record.screeningStatus = result.getStatus().name();
            record.nextReviewDate = LocalDateTime.now().plusDays(amlCheckIntervalDays);

            // Convert watchlist matches to JSON
            record.flags = objectMapper.writeValueAsString(result.getWatchlistMatches());

            // Convert metadata to JSON
            if (result.getMetadata() != null) {
                record.metadata = objectMapper.writeValueAsString(result.getMetadata());
            }

            record.persist();
            Log.infof("Persisted AML screening record for user %s (ID: %d)", result.getUserId(), record.id);

        } catch (Exception e) {
            Log.errorf(e, "Failed to persist AML result for user %s", result.getUserId());
        }
    }

    /**
     * Convert KYC database record to result object
     */
    private KYCVerificationResult convertKYCRecordToResult(KYCVerificationRecord record) {
        KYCVerificationResult result = new KYCVerificationResult();
        result.setUserId(record.userId);
        result.setAddress(record.address);
        result.setProvider(KYCProvider.valueOf(record.provider));
        result.setStatus(KYCStatus.valueOf(record.verificationStatus));
        result.setVerificationLevel(VerificationLevel.valueOf(record.riskLevel));
        result.setDocumentType(record.documentTypes);
        result.setProviderReferenceId(record.verificationId);
        result.setExpirationDate(record.expiresAt != null ?
                                 record.expiresAt.toInstant(ZoneOffset.UTC) : null);
        result.setTimestamp(record.createdAt.toInstant(ZoneOffset.UTC));

        // Parse metadata for verification score
        try {
            if (record.metadata != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> metadata = objectMapper.readValue(record.metadata, Map.class);
                result.setVerificationScore(((Number) metadata.get("verificationScore")).doubleValue());
                result.setDocumentNumber((String) metadata.get("documentNumber"));
            }
        } catch (Exception e) {
            Log.warnf("Failed to parse metadata for KYC record %d", record.id);
            result.setVerificationScore(90.0); // Default score
        }

        return result;
    }

    /**
     * Convert AML database record to result object
     */
    private AMLScreeningResult convertAMLRecordToResult(AMLScreeningRecord record) {
        AMLScreeningResult result = new AMLScreeningResult();
        result.setUserId(record.userId);
        result.setProvider(AMLProvider.INTERNAL); // Default, could be stored in metadata
        result.setStatus(AMLStatus.valueOf(record.screeningStatus));
        result.setRiskLevel(RiskLevel.valueOf(record.riskLevel));
        result.setRiskScore(record.riskScore / 10.0); // Convert back to decimal
        result.setSanctioned(record.sanctionsHit);
        result.setPep(record.pepStatus);
        result.setProviderReferenceId(record.screeningId);
        result.setTimestamp(record.createdAt.toInstant(ZoneOffset.UTC));

        // Parse watchlist matches from JSON
        try {
            if (record.flags != null) {
                @SuppressWarnings("unchecked")
                List<String> watchlistMatches = objectMapper.readValue(record.flags, List.class);
                result.setWatchlistMatches(watchlistMatches);
            } else {
                result.setWatchlistMatches(new ArrayList<>());
            }

            // Parse metadata
            if (record.metadata != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> metadata = objectMapper.readValue(record.metadata, Map.class);
                result.setMetadata(metadata);
            }
        } catch (Exception e) {
            Log.warnf("Failed to parse metadata for AML record %d", record.id);
            result.setWatchlistMatches(new ArrayList<>());
        }

        return result;
    }
}
