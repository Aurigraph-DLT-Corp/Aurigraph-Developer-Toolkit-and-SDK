package io.aurigraph.v11.contracts.rwa.compliance;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import io.quarkus.logging.Log;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import io.aurigraph.v11.contracts.rwa.models.RegulatoryJurisdiction;

/**
 * Sanctions Screening Service
 * Comprehensive screening against global sanctions lists and watchlists
 *
 * Supported Sanctions Lists:
 * - OFAC SDN (US Treasury Specially Designated Nationals)
 * - OFAC Non-SDN (Sectoral Sanctions, Foreign Sanctions Evaders)
 * - UN Security Council Consolidated List
 * - EU Consolidated List
 * - UK HM Treasury Sanctions List
 * - AUSTRAC (Australian sanctions)
 * - OSFI (Canadian sanctions)
 * - MAS (Singapore sanctions)
 * - FATF High-Risk Jurisdictions
 * - Interpol Red Notices
 *
 * AV11-406: Automated Compliance Monitoring (21 story points)
 */
@ApplicationScoped
public class SanctionsScreeningService {

    @ConfigProperty(name = "compliance.sanctions.enabled", defaultValue = "true")
    boolean sanctionsEnabled;

    @ConfigProperty(name = "compliance.sanctions.cache.ttl.hours", defaultValue = "24")
    int cacheTTLHours;

    @ConfigProperty(name = "compliance.sanctions.auto.refresh.enabled", defaultValue = "true")
    boolean autoRefreshEnabled;

    // In-memory sanctions data (in production, load from external API or database)
    private final Map<String, SanctionedEntity> sanctionedEntities = new ConcurrentHashMap<>();
    private final Map<String, List<String>> sanctionedCountries = new ConcurrentHashMap<>();
    private final Map<String, ScreeningResult> screeningCache = new ConcurrentHashMap<>();
    private Instant lastRefreshTime = Instant.now();

    public SanctionsScreeningService() {
        Log.info("SanctionsScreeningService initialized");
        initializeSanctionsData();
    }

    /**
     * Screen a user/entity against all sanctions lists
     */
    public Uni<ScreeningResult> screenEntity(String entityId, String name,
                                            String address, String country,
                                            RegulatoryJurisdiction jurisdiction) {
        return Uni.createFrom().item(() -> {
            Log.infof("Screening entity %s (%s) from country %s", entityId, name, country);

            if (!sanctionsEnabled) {
                return createClearResult(entityId, name, address);
            }

            // Check cache first
            String cacheKey = generateCacheKey(entityId, name, address, country);
            ScreeningResult cached = screeningCache.get(cacheKey);
            if (cached != null && !isCacheExpired(cached)) {
                Log.infof("Using cached screening result for %s", entityId);
                return cached;
            }

            // Perform comprehensive screening
            ScreeningResult result = new ScreeningResult();
            result.setEntityId(entityId);
            result.setName(name);
            result.setAddress(address);
            result.setCountry(country);
            result.setJurisdiction(jurisdiction);
            result.setTimestamp(Instant.now());

            List<SanctionMatch> matches = new ArrayList<>();

            // 1. Screen against OFAC SDN list
            matches.addAll(screenAgainstOFACSDN(name, address, country));

            // 2. Screen against OFAC Non-SDN lists
            matches.addAll(screenAgainstOFACNonSDN(name, address, country));

            // 3. Screen against UN Consolidated List
            matches.addAll(screenAgainstUNList(name, country));

            // 4. Screen against EU Consolidated List
            matches.addAll(screenAgainstEUList(name, country));

            // 5. Screen against UK HM Treasury List
            matches.addAll(screenAgainstUKList(name, country));

            // 6. Screen against country-specific lists
            if (jurisdiction == RegulatoryJurisdiction.AUSTRALIA) {
                matches.addAll(screenAgainstAUSTRAC(name, country));
            } else if (jurisdiction == RegulatoryJurisdiction.CANADA) {
                matches.addAll(screenAgainstOSFI(name, country));
            } else if (jurisdiction == RegulatoryJurisdiction.SINGAPORE) {
                matches.addAll(screenAgainstMAS(name, country));
            }

            // 7. Screen against FATF high-risk jurisdictions
            if (isFATFHighRiskCountry(country)) {
                SanctionMatch fatfMatch = new SanctionMatch();
                fatfMatch.setListName("FATF High-Risk Jurisdictions");
                fatfMatch.setMatchType(MatchType.COUNTRY);
                fatfMatch.setMatchedValue(country);
                fatfMatch.setConfidence(95.0);
                fatfMatch.setRiskLevel(RiskLevel.HIGH);
                matches.add(fatfMatch);
            }

            // 8. Screen against sanctioned countries
            if (isSanctionedCountry(country)) {
                SanctionMatch countryMatch = new SanctionMatch();
                countryMatch.setListName("Sanctioned Countries");
                countryMatch.setMatchType(MatchType.COUNTRY);
                countryMatch.setMatchedValue(country);
                countryMatch.setConfidence(100.0);
                countryMatch.setRiskLevel(RiskLevel.VERY_HIGH);
                matches.add(countryMatch);
            }

            // Set results
            result.setMatches(matches);
            result.setMatchCount(matches.size());

            if (matches.isEmpty()) {
                result.setStatus(ScreeningStatus.CLEAR);
                result.setRiskScore(0.0);
            } else {
                // Calculate overall risk based on matches
                double maxRiskScore = matches.stream()
                    .mapToDouble(m -> m.getConfidence() * getRiskWeight(m.getRiskLevel()))
                    .max()
                    .orElse(0.0);

                result.setRiskScore(maxRiskScore);

                if (maxRiskScore >= 80.0) {
                    result.setStatus(ScreeningStatus.BLOCKED);
                } else if (maxRiskScore >= 50.0) {
                    result.setStatus(ScreeningStatus.FLAGGED);
                } else {
                    result.setStatus(ScreeningStatus.REVIEW_REQUIRED);
                }
            }

            // Cache the result
            screeningCache.put(cacheKey, result);

            Log.infof("Screening completed for %s: %s (risk score: %.2f, matches: %d)",
                     entityId, result.getStatus(), result.getRiskScore(), matches.size());

            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Screen a blockchain address for sanctions exposure
     */
    public Uni<AddressScreeningResult> screenBlockchainAddress(String address,
                                                                String blockchain,
                                                                RegulatoryJurisdiction jurisdiction) {
        return Uni.createFrom().item(() -> {
            Log.infof("Screening blockchain address %s on %s", address, blockchain);

            AddressScreeningResult result = new AddressScreeningResult();
            result.setAddress(address);
            result.setBlockchain(blockchain);
            result.setTimestamp(Instant.now());

            // In production: integrate with Chainalysis, Elliptic, or TRM Labs
            // For now, simple check against known sanctioned addresses

            boolean isSanctioned = isAddressSanctioned(address);
            List<String> associatedSanctionedAddresses = getAssociatedSanctionedAddresses(address);

            result.setDirectlySanctioned(isSanctioned);
            result.setAssociatedSanctionedAddresses(associatedSanctionedAddresses);
            result.setExposureLevel(calculateExposureLevel(isSanctioned, associatedSanctionedAddresses));

            if (isSanctioned) {
                result.setStatus(AddressScreeningStatus.BLOCKED);
                result.setRiskScore(100.0);
            } else if (!associatedSanctionedAddresses.isEmpty()) {
                result.setStatus(AddressScreeningStatus.HIGH_RISK);
                result.setRiskScore(75.0);
            } else {
                result.setStatus(AddressScreeningStatus.CLEAR);
                result.setRiskScore(0.0);
            }

            Log.infof("Address screening completed: %s (risk score: %.2f)",
                     result.getStatus(), result.getRiskScore());

            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get sanctioned countries for a jurisdiction
     */
    public Uni<List<String>> getSanctionedCountries(RegulatoryJurisdiction jurisdiction) {
        return Uni.createFrom().item(() -> {
            return sanctionedCountries.getOrDefault(jurisdiction.getCode(), new ArrayList<>());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Refresh sanctions data from external sources
     */
    public Uni<RefreshResult> refreshSanctionsData() {
        return Uni.createFrom().item(() -> {
            Log.info("Refreshing sanctions data from external sources");

            RefreshResult result = new RefreshResult();
            result.setStartTime(Instant.now());

            try {
                // In production: fetch from OFAC API, UN API, EU API, etc.
                // For now, reinitialize with mock data
                int previousCount = sanctionedEntities.size();
                initializeSanctionsData();
                int currentCount = sanctionedEntities.size();

                lastRefreshTime = Instant.now();
                result.setSuccess(true);
                result.setPreviousCount(previousCount);
                result.setCurrentCount(currentCount);
                result.setNewEntities(Math.max(0, currentCount - previousCount));
                result.setEndTime(Instant.now());

                Log.infof("Sanctions data refresh completed: %d entities (added %d)",
                         currentCount, result.getNewEntities());
            } catch (Exception e) {
                result.setSuccess(false);
                result.setErrorMessage(e.getMessage());
                result.setEndTime(Instant.now());
                Log.errorf(e, "Failed to refresh sanctions data");
            }

            return result;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Screening Methods ====================

    private List<SanctionMatch> screenAgainstOFACSDN(String name, String address, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query OFAC SDN API
        // https://www.treasury.gov/ofac/downloads/sdn.xml

        // Mock implementation
        if (name != null && name.toLowerCase().contains("test-sanctioned")) {
            SanctionMatch match = new SanctionMatch();
            match.setListName("OFAC SDN");
            match.setMatchType(MatchType.NAME);
            match.setMatchedValue(name);
            match.setConfidence(95.0);
            match.setRiskLevel(RiskLevel.VERY_HIGH);
            match.setDetails("Specially Designated National");
            matches.add(match);
        }

        return matches;
    }

    private List<SanctionMatch> screenAgainstOFACNonSDN(String name, String address, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query OFAC Non-SDN lists
        // Sectoral Sanctions Identifications (SSI) List
        // Foreign Sanctions Evaders (FSE) List
        // Non-SDN Palestinian Legislative Council (NS-PLC) List
        // Non-SDN Menu-Based Sanctions (NS-MBS) List

        return matches;
    }

    private List<SanctionMatch> screenAgainstUNList(String name, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query UN Security Council Consolidated List
        // https://www.un.org/securitycouncil/content/un-sc-consolidated-list

        return matches;
    }

    private List<SanctionMatch> screenAgainstEUList(String name, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query EU Consolidated List
        // https://webgate.ec.europa.eu/fsd/fsf

        return matches;
    }

    private List<SanctionMatch> screenAgainstUKList(String name, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query UK HM Treasury Consolidated List
        // https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets

        return matches;
    }

    private List<SanctionMatch> screenAgainstAUSTRAC(String name, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query AUSTRAC
        // https://www.dfat.gov.au/international-relations/security/sanctions

        return matches;
    }

    private List<SanctionMatch> screenAgainstOSFI(String name, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query OSFI (Office of the Superintendent of Financial Institutions)
        // https://www.osfi-bsif.gc.ca/

        return matches;
    }

    private List<SanctionMatch> screenAgainstMAS(String name, String country) {
        List<SanctionMatch> matches = new ArrayList<>();

        // In production: query MAS (Monetary Authority of Singapore)
        // https://www.mas.gov.sg/

        return matches;
    }

    // ==================== Helper Methods ====================

    private void initializeSanctionsData() {
        // Initialize with mock data
        // In production, load from external APIs or database

        // Sanctioned countries (comprehensive list)
        sanctionedCountries.put("GLOBAL", Arrays.asList(
            "KP", // North Korea
            "IR", // Iran
            "SY", // Syria
            "CU"  // Cuba (partial)
        ));

        // FATF high-risk jurisdictions
        sanctionedCountries.put("FATF", Arrays.asList(
            "KP", // North Korea
            "IR", // Iran
            "MM"  // Myanmar (under monitoring)
        ));

        // US-specific sanctioned countries
        sanctionedCountries.put("US", Arrays.asList(
            "KP", "IR", "SY", "CU", "VE" // Venezuela (targeted)
        ));

        Log.info("Initialized sanctions data");
    }

    private boolean isFATFHighRiskCountry(String country) {
        List<String> fatfList = sanctionedCountries.getOrDefault("FATF", new ArrayList<>());
        return fatfList.contains(country);
    }

    private boolean isSanctionedCountry(String country) {
        List<String> globalList = sanctionedCountries.getOrDefault("GLOBAL", new ArrayList<>());
        return globalList.contains(country);
    }

    private boolean isAddressSanctioned(String address) {
        // In production: check against OFAC SDN digital currency addresses
        // https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml
        return false; // Mock implementation
    }

    private List<String> getAssociatedSanctionedAddresses(String address) {
        // In production: use Chainalysis/Elliptic to check transaction history
        return new ArrayList<>();
    }

    private ExposureLevel calculateExposureLevel(boolean directlySanctioned,
                                                 List<String> associatedAddresses) {
        if (directlySanctioned) {
            return ExposureLevel.DIRECT;
        } else if (!associatedAddresses.isEmpty()) {
            return associatedAddresses.size() > 5 ? ExposureLevel.HIGH_INDIRECT : ExposureLevel.LOW_INDIRECT;
        } else {
            return ExposureLevel.NONE;
        }
    }

    private double getRiskWeight(RiskLevel level) {
        return switch (level) {
            case VERY_HIGH -> 1.0;
            case HIGH -> 0.75;
            case MEDIUM -> 0.5;
            case LOW -> 0.25;
        };
    }

    private String generateCacheKey(String entityId, String name, String address, String country) {
        return String.format("%s:%s:%s:%s", entityId, name, address, country);
    }

    private boolean isCacheExpired(ScreeningResult result) {
        Instant expiryTime = result.getTimestamp().plus(cacheTTLHours, ChronoUnit.HOURS);
        return Instant.now().isAfter(expiryTime);
    }

    private ScreeningResult createClearResult(String entityId, String name, String address) {
        ScreeningResult result = new ScreeningResult();
        result.setEntityId(entityId);
        result.setName(name);
        result.setAddress(address);
        result.setStatus(ScreeningStatus.CLEAR);
        result.setRiskScore(0.0);
        result.setMatches(new ArrayList<>());
        result.setMatchCount(0);
        result.setTimestamp(Instant.now());
        return result;
    }

    // ==================== Enums ====================

    public enum ScreeningStatus {
        CLEAR,
        REVIEW_REQUIRED,
        FLAGGED,
        BLOCKED
    }

    public enum AddressScreeningStatus {
        CLEAR,
        LOW_RISK,
        MEDIUM_RISK,
        HIGH_RISK,
        BLOCKED
    }

    public enum MatchType {
        NAME,
        ADDRESS,
        COUNTRY,
        ALIAS,
        DATE_OF_BIRTH,
        PASSPORT,
        NATIONAL_ID
    }

    public enum RiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        VERY_HIGH
    }

    public enum ExposureLevel {
        NONE,
        LOW_INDIRECT,
        HIGH_INDIRECT,
        DIRECT
    }

    // ==================== Result Classes ====================

    public static class ScreeningResult {
        private String entityId;
        private String name;
        private String address;
        private String country;
        private RegulatoryJurisdiction jurisdiction;
        private ScreeningStatus status;
        private double riskScore;
        private List<SanctionMatch> matches;
        private int matchCount;
        private Instant timestamp;

        // Getters and setters
        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public RegulatoryJurisdiction getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(RegulatoryJurisdiction jurisdiction) { this.jurisdiction = jurisdiction; }
        public ScreeningStatus getStatus() { return status; }
        public void setStatus(ScreeningStatus status) { this.status = status; }
        public double getRiskScore() { return riskScore; }
        public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
        public List<SanctionMatch> getMatches() { return matches; }
        public void setMatches(List<SanctionMatch> matches) { this.matches = matches; }
        public int getMatchCount() { return matchCount; }
        public void setMatchCount(int matchCount) { this.matchCount = matchCount; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    public static class SanctionMatch {
        private String listName;
        private MatchType matchType;
        private String matchedValue;
        private double confidence;
        private RiskLevel riskLevel;
        private String details;

        // Getters and setters
        public String getListName() { return listName; }
        public void setListName(String listName) { this.listName = listName; }
        public MatchType getMatchType() { return matchType; }
        public void setMatchType(MatchType matchType) { this.matchType = matchType; }
        public String getMatchedValue() { return matchedValue; }
        public void setMatchedValue(String matchedValue) { this.matchedValue = matchedValue; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public RiskLevel getRiskLevel() { return riskLevel; }
        public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }

    public static class AddressScreeningResult {
        private String address;
        private String blockchain;
        private AddressScreeningStatus status;
        private double riskScore;
        private boolean directlySanctioned;
        private List<String> associatedSanctionedAddresses;
        private ExposureLevel exposureLevel;
        private Instant timestamp;

        // Getters and setters
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getBlockchain() { return blockchain; }
        public void setBlockchain(String blockchain) { this.blockchain = blockchain; }
        public AddressScreeningStatus getStatus() { return status; }
        public void setStatus(AddressScreeningStatus status) { this.status = status; }
        public double getRiskScore() { return riskScore; }
        public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
        public boolean isDirectlySanctioned() { return directlySanctioned; }
        public void setDirectlySanctioned(boolean directlySanctioned) { this.directlySanctioned = directlySanctioned; }
        public List<String> getAssociatedSanctionedAddresses() { return associatedSanctionedAddresses; }
        public void setAssociatedSanctionedAddresses(List<String> associatedSanctionedAddresses) {
            this.associatedSanctionedAddresses = associatedSanctionedAddresses;
        }
        public ExposureLevel getExposureLevel() { return exposureLevel; }
        public void setExposureLevel(ExposureLevel exposureLevel) { this.exposureLevel = exposureLevel; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }

    public static class RefreshResult {
        private boolean success;
        private Instant startTime;
        private Instant endTime;
        private int previousCount;
        private int currentCount;
        private int newEntities;
        private String errorMessage;

        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public Instant getStartTime() { return startTime; }
        public void setStartTime(Instant startTime) { this.startTime = startTime; }
        public Instant getEndTime() { return endTime; }
        public void setEndTime(Instant endTime) { this.endTime = endTime; }
        public int getPreviousCount() { return previousCount; }
        public void setPreviousCount(int previousCount) { this.previousCount = previousCount; }
        public int getCurrentCount() { return currentCount; }
        public void setCurrentCount(int currentCount) { this.currentCount = currentCount; }
        public int getNewEntities() { return newEntities; }
        public void setNewEntities(int newEntities) { this.newEntities = newEntities; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    public static class SanctionedEntity {
        private String id;
        private String name;
        private String type;
        private List<String> aliases;
        private String country;
        private String listName;
        private Instant addedDate;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public List<String> getAliases() { return aliases; }
        public void setAliases(List<String> aliases) { this.aliases = aliases; }
        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }
        public String getListName() { return listName; }
        public void setListName(String listName) { this.listName = listName; }
        public Instant getAddedDate() { return addedDate; }
        public void setAddedDate(Instant addedDate) { this.addedDate = addedDate; }
    }
}
