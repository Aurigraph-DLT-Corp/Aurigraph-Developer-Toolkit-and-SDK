package io.aurigraph.v11.compliance.mica;

import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MiCA Asset Classification Service
 *
 * Implements the token classification rules per the EU Markets in Crypto-Assets
 * Regulation (MiCA) (EU) 2023/1114.
 *
 * Token Classifications per MiCA Title II-IV:
 * - E-money tokens (EMT): Referenced to a single official currency (Title IV)
 * - Asset-referenced tokens (ART): Referenced to multiple assets (Title III)
 * - Utility tokens: Provide access to goods/services (Title II)
 * - Other crypto-assets: General category for remaining assets
 *
 * @author Aurigraph DLT
 * @version 1.0.0
 * @since Sprint 6 - Compliance & Audit
 */
@ApplicationScoped
public class MiCAAssetClassification {

    // Classification records storage
    private final Map<String, ClassificationRecord> classificationRecords = new ConcurrentHashMap<>();
    private final List<ClassificationAuditEntry> auditTrail = Collections.synchronizedList(new ArrayList<>());

    /**
     * Asset class definitions per MiCA
     */
    public enum AssetClass {
        /**
         * E-money token (Title IV, Articles 48-58)
         * A crypto-asset that purports to maintain a stable value by referencing
         * the value of one official currency
         */
        E_MONEY_TOKEN("EMT", "E-Money Token",
            "Crypto-asset maintaining stable value by referencing single official currency"),

        /**
         * Asset-referenced token (Title III, Articles 16-47)
         * A crypto-asset that is not an EMT and that purports to maintain a stable value
         * by referencing another value or right or a combination thereof
         */
        ASSET_REFERENCED_TOKEN("ART", "Asset-Referenced Token",
            "Crypto-asset maintaining stable value by referencing multiple assets"),

        /**
         * Utility token (Title II, Articles 4-15)
         * A crypto-asset intended to provide digital access to a good or service,
         * available on DLT, and is only accepted by the issuer
         */
        UTILITY_TOKEN("UT", "Utility Token",
            "Crypto-asset providing digital access to goods/services"),

        /**
         * Other crypto-assets (Title II, Articles 4-15)
         * Crypto-assets that do not fall into EMT, ART, or utility token categories
         */
        OTHER_CRYPTO_ASSET("OCA", "Other Crypto-Asset",
            "General crypto-assets not classified as EMT, ART, or utility token"),

        /**
         * Exempt from MiCA scope (Article 2)
         * Assets explicitly excluded from MiCA regulation
         */
        EXEMPT("EXEMPT", "Exempt from MiCA",
            "Asset excluded from MiCA scope per Article 2");

        private final String code;
        private final String displayName;
        private final String description;

        AssetClass(String code, String displayName, String description) {
            this.code = code;
            this.displayName = displayName;
            this.description = description;
        }

        public String getCode() { return code; }
        public String getDisplayName() { return displayName; }
        public String getDescription() { return description; }
    }

    /**
     * Exemption reasons per MiCA Article 2
     */
    public enum ExemptionReason {
        FINANCIAL_INSTRUMENT("Financial instruments under MiFID II"),
        DEPOSIT("Deposits under Directive 2014/49/EU"),
        STRUCTURED_DEPOSIT("Structured deposits under MiFID II"),
        SECURITIZATION("Securitization under Regulation (EU) 2017/2402"),
        INSURANCE_PRODUCT("Insurance products"),
        PENSION_PRODUCT("Pension products"),
        UNIQUE_NFT("Unique and non-fungible crypto-asset"),
        CENTRAL_BANK_MONEY("Central bank money"),
        BIS_INSTITUTION("BIS, IMF, or similar institution issued"),
        PUBLIC_INTERNATIONAL_ORG("Public international organization issued"),
        FREE_OF_CHARGE("Provided free of charge"),
        MINING_REWARD("Mining/validation reward"),
        SMALL_OFFER("Offer below EUR 1 million threshold");

        private final String description;

        ExemptionReason(String description) {
            this.description = description;
        }

        public String getDescription() { return description; }
    }

    /**
     * Classify a crypto-asset according to MiCA categories
     *
     * @param tokenId Unique token identifier
     * @param issuerInfo Information about the token issuer
     * @return The determined asset class
     */
    public AssetClass classifyAsset(String tokenId, MiCAComplianceModule.IssuerInfo issuerInfo) {
        Log.infof("Classifying asset: %s", tokenId);

        // Check for exemptions first (Article 2)
        ExemptionReason exemption = checkExemptions(issuerInfo);
        if (exemption != null) {
            Log.infof("Asset %s is exempt from MiCA: %s", tokenId, exemption.getDescription());
            storeClassification(tokenId, AssetClass.EXEMPT, exemption.name());
            return AssetClass.EXEMPT;
        }

        AssetClass classification;
        String classificationReason;

        // Check if E-money token (Title IV)
        if (isEMoneyToken(issuerInfo)) {
            classification = AssetClass.E_MONEY_TOKEN;
            classificationReason = "References single official currency: " +
                issuerInfo.getReferencedFiatCurrency();
        }
        // Check if Asset-referenced token (Title III)
        else if (isAssetReferencedToken(issuerInfo)) {
            classification = AssetClass.ASSET_REFERENCED_TOKEN;
            classificationReason = "References multiple assets/values for value stability";
        }
        // Check if Utility token (Title II)
        else if (isUtilityToken(issuerInfo)) {
            classification = AssetClass.UTILITY_TOKEN;
            classificationReason = "Provides digital access to goods/services";
        }
        // Default to Other crypto-asset
        else {
            classification = AssetClass.OTHER_CRYPTO_ASSET;
            classificationReason = "General crypto-asset without specific classification";
        }

        storeClassification(tokenId, classification, classificationReason);

        Log.infof("Asset %s classified as: %s - %s",
            tokenId, classification.getDisplayName(), classificationReason);

        return classification;
    }

    /**
     * Check if asset qualifies as E-money token (Article 48)
     * EMT must:
     * 1. Purport to maintain stable value
     * 2. Reference only ONE official currency
     * 3. Be issued by authorized e-money institution or credit institution
     */
    private boolean isEMoneyToken(MiCAComplianceModule.IssuerInfo issuerInfo) {
        // Must reference a single fiat currency
        if (!issuerInfo.isFiatCurrencyReferenced()) {
            return false;
        }

        // Must have exactly one referenced currency (not multiple)
        if (issuerInfo.getReferencedFiatCurrency() == null ||
            issuerInfo.getReferencedFiatCurrency().isEmpty()) {
            return false;
        }

        // Check if it's a known official currency
        Set<String> officialCurrencies = Set.of(
            "EUR", "USD", "GBP", "JPY", "CHF", "AUD", "CAD", "CNY",
            "HKD", "NZD", "SEK", "SGD", "NOK", "MXN", "INR", "RUB",
            "ZAR", "TRY", "BRL", "TWD", "DKK", "PLN", "THB", "IDR"
        );

        String currency = issuerInfo.getReferencedFiatCurrency().toUpperCase();
        if (!officialCurrencies.contains(currency)) {
            return false;
        }

        // Should not reference multiple assets (that would be ART)
        return !issuerInfo.hasReferencedAssets() || issuerInfo.isFiatCurrencyReferenced();
    }

    /**
     * Check if asset qualifies as Asset-referenced token (Article 16)
     * ART must:
     * 1. Not be an EMT
     * 2. Purport to maintain stable value
     * 3. Reference another value/right or combination thereof
     */
    private boolean isAssetReferencedToken(MiCAComplianceModule.IssuerInfo issuerInfo) {
        // Must reference assets/values for stability
        if (!issuerInfo.hasReferencedAssets()) {
            return false;
        }

        // Must not be a single-currency peg (that's EMT)
        if (issuerInfo.isFiatCurrencyReferenced() &&
            !issuerInfo.hasReferencedAssets()) {
            return false;
        }

        // References basket of currencies, commodities, or other crypto-assets
        return true;
    }

    /**
     * Check if asset qualifies as Utility token (Article 4)
     * Utility token must:
     * 1. Provide digital access to goods/services
     * 2. Be available on DLT
     * 3. Only be accepted by the issuer
     */
    private boolean isUtilityToken(MiCAComplianceModule.IssuerInfo issuerInfo) {
        String tokenType = issuerInfo.getTokenType();
        if (tokenType == null) {
            return false;
        }

        Set<String> utilityTypes = Set.of(
            "UTILITY", "ACCESS", "SERVICE", "PLATFORM", "GOVERNANCE",
            "MEMBERSHIP", "VOUCHER", "REWARD", "LOYALTY"
        );

        return utilityTypes.contains(tokenType.toUpperCase());
    }

    /**
     * Check for MiCA exemptions (Article 2)
     */
    private ExemptionReason checkExemptions(MiCAComplianceModule.IssuerInfo issuerInfo) {
        String tokenType = issuerInfo.getTokenType();
        if (tokenType == null) {
            return null;
        }

        tokenType = tokenType.toUpperCase();

        // Check various exemption categories
        if (tokenType.contains("FINANCIAL_INSTRUMENT") ||
            tokenType.contains("SECURITY")) {
            return ExemptionReason.FINANCIAL_INSTRUMENT;
        }

        if (tokenType.contains("DEPOSIT")) {
            return ExemptionReason.DEPOSIT;
        }

        if (tokenType.contains("INSURANCE")) {
            return ExemptionReason.INSURANCE_PRODUCT;
        }

        if (tokenType.contains("PENSION")) {
            return ExemptionReason.PENSION_PRODUCT;
        }

        if (tokenType.contains("NFT") && isUniqueNFT(issuerInfo)) {
            return ExemptionReason.UNIQUE_NFT;
        }

        if (tokenType.contains("CENTRAL_BANK") || tokenType.contains("CBDC")) {
            return ExemptionReason.CENTRAL_BANK_MONEY;
        }

        return null;
    }

    /**
     * Check if NFT is unique and non-fungible (Article 2.3)
     * NFTs are exempt if they are unique and non-fungible
     */
    private boolean isUniqueNFT(MiCAComplianceModule.IssuerInfo issuerInfo) {
        String tokenType = issuerInfo.getTokenType();
        if (tokenType == null) {
            return false;
        }

        // True NFTs that represent unique items are exempt
        // Fractional NFTs or series of similar NFTs may not be exempt
        return tokenType.toUpperCase().contains("UNIQUE_NFT") ||
               tokenType.toUpperCase().contains("NON_FUNGIBLE");
    }

    /**
     * Store classification record
     */
    private void storeClassification(String tokenId, AssetClass classification, String reason) {
        ClassificationRecord record = new ClassificationRecord(
            tokenId, classification, reason, Instant.now()
        );
        classificationRecords.put(tokenId, record);

        auditTrail.add(new ClassificationAuditEntry(
            tokenId,
            classification,
            reason,
            Instant.now()
        ));
    }

    /**
     * Get classification for a token
     */
    public Optional<ClassificationRecord> getClassification(String tokenId) {
        return Optional.ofNullable(classificationRecords.get(tokenId));
    }

    /**
     * Get all classification records
     */
    public List<ClassificationRecord> getAllClassifications() {
        return new ArrayList<>(classificationRecords.values());
    }

    /**
     * Get classifications by asset class
     */
    public List<ClassificationRecord> getByAssetClass(AssetClass assetClass) {
        return classificationRecords.values().stream()
            .filter(r -> r.getAssetClass() == assetClass)
            .toList();
    }

    /**
     * Get classification statistics
     */
    public ClassificationStats getStats() {
        ClassificationStats stats = new ClassificationStats();

        Map<AssetClass, Long> counts = new HashMap<>();
        for (AssetClass ac : AssetClass.values()) {
            counts.put(ac, 0L);
        }

        for (ClassificationRecord record : classificationRecords.values()) {
            counts.merge(record.getAssetClass(), 1L, Long::sum);
        }

        stats.setTotalClassified(classificationRecords.size());
        stats.setByAssetClass(counts);
        stats.setEMoneyTokens(counts.get(AssetClass.E_MONEY_TOKEN));
        stats.setAssetReferencedTokens(counts.get(AssetClass.ASSET_REFERENCED_TOKEN));
        stats.setUtilityTokens(counts.get(AssetClass.UTILITY_TOKEN));
        stats.setOtherCryptoAssets(counts.get(AssetClass.OTHER_CRYPTO_ASSET));
        stats.setExemptAssets(counts.get(AssetClass.EXEMPT));

        return stats;
    }

    /**
     * Get audit trail
     */
    public List<ClassificationAuditEntry> getAuditTrail() {
        return new ArrayList<>(auditTrail);
    }

    /**
     * Reclassify an asset (for regulatory updates or corrections)
     */
    public ClassificationRecord reclassifyAsset(String tokenId, AssetClass newClass, String reason) {
        Log.infof("Reclassifying asset %s to %s", tokenId, newClass.getDisplayName());

        ClassificationRecord oldRecord = classificationRecords.get(tokenId);
        AssetClass oldClass = oldRecord != null ? oldRecord.getAssetClass() : null;

        ClassificationRecord newRecord = new ClassificationRecord(
            tokenId, newClass, reason, Instant.now()
        );
        classificationRecords.put(tokenId, newRecord);

        auditTrail.add(new ClassificationAuditEntry(
            tokenId,
            newClass,
            String.format("Reclassified from %s: %s",
                oldClass != null ? oldClass.getDisplayName() : "UNCLASSIFIED",
                reason),
            Instant.now()
        ));

        return newRecord;
    }

    /**
     * Get classification requirements for an asset class
     */
    public ClassificationRequirements getRequirements(AssetClass assetClass) {
        ClassificationRequirements req = new ClassificationRequirements(assetClass);

        switch (assetClass) {
            case E_MONEY_TOKEN:
                req.addRequirement("Authorization as e-money institution or credit institution");
                req.addRequirement("Whitepaper with EMT-specific disclosures");
                req.addRequirement("100% reserve backing in qualifying assets");
                req.addRequirement("Redemption at par value at any time");
                req.addRequirement("Quarterly reserve attestation");
                req.setMinimumCapital("350,000 EUR or 2% of average reserve");
                req.setAuthorizationRequired(true);
                req.setWhitepaperRequired(true);
                req.setReserveRequired(true);
                break;

            case ASSET_REFERENCED_TOKEN:
                req.addRequirement("Authorization from competent authority");
                req.addRequirement("Whitepaper with ART-specific disclosures");
                req.addRequirement("100% reserve backing in qualifying assets");
                req.addRequirement("Reserve custody arrangements");
                req.addRequirement("Quarterly reserve disclosure");
                req.addRequirement("Recovery and redemption plan");
                req.setMinimumCapital("350,000 EUR or 2% of average reserve");
                req.setAuthorizationRequired(true);
                req.setWhitepaperRequired(true);
                req.setReserveRequired(true);
                break;

            case UTILITY_TOKEN:
                req.addRequirement("Whitepaper notification to competent authority");
                req.addRequirement("Clear utility/access function");
                req.addRequirement("Marketing communications compliance");
                req.setMinimumCapital("None required");
                req.setAuthorizationRequired(false);
                req.setWhitepaperRequired(true);
                req.setReserveRequired(false);
                break;

            case OTHER_CRYPTO_ASSET:
                req.addRequirement("Whitepaper notification to competent authority");
                req.addRequirement("Marketing communications compliance");
                req.setMinimumCapital("None required");
                req.setAuthorizationRequired(false);
                req.setWhitepaperRequired(true);
                req.setReserveRequired(false);
                break;

            case EXEMPT:
                req.addRequirement("Verify exemption category per Article 2");
                req.addRequirement("Document exemption basis");
                req.setMinimumCapital("N/A - Exempt from MiCA");
                req.setAuthorizationRequired(false);
                req.setWhitepaperRequired(false);
                req.setReserveRequired(false);
                break;
        }

        return req;
    }

    // ============ Inner Classes ============

    public static class ClassificationRecord {
        private final String tokenId;
        private final AssetClass assetClass;
        private final String classificationReason;
        private final Instant classifiedAt;

        public ClassificationRecord(String tokenId, AssetClass assetClass,
                String reason, Instant classifiedAt) {
            this.tokenId = tokenId;
            this.assetClass = assetClass;
            this.classificationReason = reason;
            this.classifiedAt = classifiedAt;
        }

        public String getTokenId() { return tokenId; }
        public AssetClass getAssetClass() { return assetClass; }
        public String getClassificationReason() { return classificationReason; }
        public Instant getClassifiedAt() { return classifiedAt; }
    }

    public static class ClassificationAuditEntry {
        private final String tokenId;
        private final AssetClass assetClass;
        private final String details;
        private final Instant timestamp;

        public ClassificationAuditEntry(String tokenId, AssetClass assetClass,
                String details, Instant timestamp) {
            this.tokenId = tokenId;
            this.assetClass = assetClass;
            this.details = details;
            this.timestamp = timestamp;
        }

        public String getTokenId() { return tokenId; }
        public AssetClass getAssetClass() { return assetClass; }
        public String getDetails() { return details; }
        public Instant getTimestamp() { return timestamp; }
    }

    public static class ClassificationStats {
        private long totalClassified;
        private Map<AssetClass, Long> byAssetClass = new HashMap<>();
        private long eMoneyTokens;
        private long assetReferencedTokens;
        private long utilityTokens;
        private long otherCryptoAssets;
        private long exemptAssets;

        public long getTotalClassified() { return totalClassified; }
        public void setTotalClassified(long total) { this.totalClassified = total; }
        public Map<AssetClass, Long> getByAssetClass() { return byAssetClass; }
        public void setByAssetClass(Map<AssetClass, Long> map) { this.byAssetClass = map; }
        public long getEMoneyTokens() { return eMoneyTokens; }
        public void setEMoneyTokens(long count) { this.eMoneyTokens = count; }
        public long getAssetReferencedTokens() { return assetReferencedTokens; }
        public void setAssetReferencedTokens(long count) { this.assetReferencedTokens = count; }
        public long getUtilityTokens() { return utilityTokens; }
        public void setUtilityTokens(long count) { this.utilityTokens = count; }
        public long getOtherCryptoAssets() { return otherCryptoAssets; }
        public void setOtherCryptoAssets(long count) { this.otherCryptoAssets = count; }
        public long getExemptAssets() { return exemptAssets; }
        public void setExemptAssets(long count) { this.exemptAssets = count; }
    }

    public static class ClassificationRequirements {
        private final AssetClass assetClass;
        private final List<String> requirements = new ArrayList<>();
        private String minimumCapital;
        private boolean authorizationRequired;
        private boolean whitepaperRequired;
        private boolean reserveRequired;

        public ClassificationRequirements(AssetClass assetClass) {
            this.assetClass = assetClass;
        }

        public AssetClass getAssetClass() { return assetClass; }
        public List<String> getRequirements() { return requirements; }
        public void addRequirement(String req) { requirements.add(req); }
        public String getMinimumCapital() { return minimumCapital; }
        public void setMinimumCapital(String cap) { this.minimumCapital = cap; }
        public boolean isAuthorizationRequired() { return authorizationRequired; }
        public void setAuthorizationRequired(boolean req) { this.authorizationRequired = req; }
        public boolean isWhitepaperRequired() { return whitepaperRequired; }
        public void setWhitepaperRequired(boolean req) { this.whitepaperRequired = req; }
        public boolean isReserveRequired() { return reserveRequired; }
        public void setReserveRequired(boolean req) { this.reserveRequired = req; }
    }
}
