package io.aurigraph.v11.contracts;

import io.aurigraph.v11.nodes.EINodeService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * EI Node Data Service - External Integration Node data management for ActiveContracts
 *
 * Manages data sources from external systems:
 * - Register EI node data sources
 * - Push/fetch data from EI nodes
 * - Validate and attest data
 * - Tokenize external data
 *
 * Supported data source types:
 * - CRYPTO_EXCHANGE (Binance, Coinbase, Kraken)
 * - CARBON_REGISTRY (Verra, Gold Standard)
 * - ORACLE (Chainlink, Band Protocol)
 * - IOT (Sensor networks, device data)
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@ApplicationScoped
public class EINodeDataService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EINodeDataService.class);

    @Inject
    ActiveContractService contractService;

    @Inject
    VVBVerificationService vvbService;

    @Inject
    EINodeService eiNodeService;

    // Data source registry: contractId -> List<DataSource>
    private final Map<String, List<DataSource>> contractDataSources = new ConcurrentHashMap<>();

    // Data records: dataId -> DataRecord
    private final Map<String, DataRecord> dataRecords = new ConcurrentHashMap<>();

    // Contract data cache: contractId -> Map<eiNodeId, latestData>
    private final Map<String, Map<String, Object>> contractDataCache = new ConcurrentHashMap<>();

    // Tokenized data: dataId -> TokenizedData
    private final Map<String, TokenizedData> tokenizedData = new ConcurrentHashMap<>();

    // Attested data: dataId -> DataAttestation
    private final Map<String, DataAttestation> attestedData = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong dataSourcesRegistered = new AtomicLong(0);
    private final AtomicLong dataPushCount = new AtomicLong(0);
    private final AtomicLong dataFetchCount = new AtomicLong(0);
    private final AtomicLong dataTokenized = new AtomicLong(0);
    private final AtomicLong dataAttested = new AtomicLong(0);

    // ============================================
    // DATA SOURCE MANAGEMENT
    // ============================================

    /**
     * Register a new EI node data source for a contract
     *
     * @param contractId Contract ID
     * @param eiNodeId EI Node ID
     * @param type Data source type
     * @param endpoint Data source endpoint/URL
     * @return Created DataSource
     */
    public Uni<DataSource> registerDataSource(String contractId, String eiNodeId, DataSourceType type, String endpoint) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("Registering data source for contract {}: {} ({})", contractId, eiNodeId, type);

                // Create data source
                DataSource source = new DataSource();
                source.setSourceId(generateSourceId());
                source.setContractId(contractId);
                source.setEiNodeId(eiNodeId);
                source.setType(type);
                source.setEndpoint(endpoint);
                source.setRegisteredAt(Instant.now());
                source.setStatus(DataSourceStatus.ACTIVE);
                source.setProvider(deriveProvider(type, endpoint));

                // Register with contract
                contractDataSources.computeIfAbsent(contractId, k -> new ArrayList<>()).add(source);

                // Update contract metadata
                contract.getMetadata().put("eiNodeDataSourceCount",
                    String.valueOf(contractDataSources.get(contractId).size()));
                contract.addAuditEntry("EI Node data source registered: " + eiNodeId + " (" + type + ")");

                dataSourcesRegistered.incrementAndGet();

                LOGGER.info("Data source registered: {} for contract {}", source.getSourceId(), contractId);
                return source;
            });
    }

    /**
     * Get all data sources for a contract
     *
     * @param contractId Contract ID
     * @return List of data sources
     */
    public Uni<List<DataSource>> getDataSources(String contractId) {
        return Uni.createFrom().item(() -> {
            List<DataSource> sources = contractDataSources.get(contractId);
            return sources != null ? new ArrayList<>(sources) : new ArrayList<>();
        });
    }

    // ============================================
    // DATA PUSH/FETCH
    // ============================================

    /**
     * Push data from an EI node to a contract
     *
     * @param contractId Contract ID
     * @param eiNodeId EI Node ID
     * @param data Data to push
     * @return Created DataRecord
     */
    public Uni<DataRecord> pushData(String contractId, String eiNodeId, Map<String, Object> data) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("Pushing data from EI node {} to contract {}", eiNodeId, contractId);

                // Validate data source exists
                DataSource source = findDataSource(contractId, eiNodeId);
                if (source == null) {
                    throw new EINodeDataException("Data source not registered: " + eiNodeId);
                }

                // Create data record
                DataRecord record = new DataRecord();
                record.setDataId(generateDataId());
                record.setContractId(contractId);
                record.setEiNodeId(eiNodeId);
                record.setSourceType(source.getType());
                record.setData(data);
                record.setPushedAt(Instant.now());
                record.setStatus(DataRecordStatus.RECEIVED);
                record.setHash(calculateDataHash(data));

                // Store record
                dataRecords.put(record.getDataId(), record);

                // Update cache
                contractDataCache.computeIfAbsent(contractId, k -> new ConcurrentHashMap<>())
                    .put(eiNodeId, data);

                // Update contract
                contract.addAuditEntry("Data received from EI node " + eiNodeId + ": " + record.getDataId());

                dataPushCount.incrementAndGet();

                LOGGER.info("Data pushed: {} from {} to {}", record.getDataId(), eiNodeId, contractId);
                return record;
            });
    }

    /**
     * Fetch the latest data from an EI node for a contract
     *
     * @param contractId Contract ID
     * @param eiNodeId EI Node ID (optional - if null, returns all data)
     * @return Latest data
     */
    public Uni<Map<String, Object>> fetchData(String contractId, String eiNodeId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Fetching data for contract {}, EI node: {}", contractId, eiNodeId);

            dataFetchCount.incrementAndGet();

            Map<String, Object> contractData = contractDataCache.get(contractId);
            if (contractData == null) {
                return new HashMap<>();
            }

            if (eiNodeId != null && !eiNodeId.isEmpty()) {
                // Return specific EI node data
                Object nodeData = contractData.get(eiNodeId);
                if (nodeData instanceof Map) {
                    return new HashMap<>((Map<String, Object>) nodeData);
                }
                Map<String, Object> result = new HashMap<>();
                result.put(eiNodeId, nodeData);
                return result;
            }

            // Return all data
            return new HashMap<>(contractData);
        });
    }

    /**
     * Get a specific data record by ID
     *
     * @param dataId Data record ID
     * @return Data record
     */
    public Uni<DataRecord> getDataRecord(String dataId) {
        return Uni.createFrom().item(() -> {
            DataRecord record = dataRecords.get(dataId);
            if (record == null) {
                throw new DataRecordNotFoundException("Data record not found: " + dataId);
            }
            return record;
        });
    }

    // ============================================
    // DATA VALIDATION
    // ============================================

    /**
     * Validate submitted data
     *
     * @param contractId Contract ID
     * @param dataId Data record ID
     * @return Validation result
     */
    public Uni<DataValidationResult> validateData(String contractId, String dataId) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Validating data {} for contract {}", dataId, contractId);

            DataRecord record = dataRecords.get(dataId);
            if (record == null) {
                throw new DataRecordNotFoundException("Data record not found: " + dataId);
            }

            if (!record.getContractId().equals(contractId)) {
                throw new EINodeDataException("Data record does not belong to contract: " + contractId);
            }

            // Perform validation
            DataValidationResult result = new DataValidationResult();
            result.setDataId(dataId);
            result.setContractId(contractId);
            result.setValidatedAt(Instant.now());

            // Validate data integrity
            String currentHash = calculateDataHash(record.getData());
            boolean hashValid = currentHash.equals(record.getHash());
            result.setHashValid(hashValid);

            // Validate data structure
            boolean structureValid = validateDataStructure(record.getData(), record.getSourceType());
            result.setStructureValid(structureValid);

            // Validate data freshness
            long ageSeconds = Instant.now().getEpochSecond() - record.getPushedAt().getEpochSecond();
            boolean fresh = ageSeconds < 3600; // Less than 1 hour
            result.setFresh(fresh);
            result.setAgeSeconds(ageSeconds);

            // Overall validation
            result.setValid(hashValid && structureValid && fresh);
            result.setValidationMessage(result.isValid() ? "Data is valid" : buildValidationMessage(result));

            // Update record status
            record.setStatus(result.isValid() ? DataRecordStatus.VALIDATED : DataRecordStatus.INVALID);
            record.setValidatedAt(Instant.now());

            LOGGER.info("Data validation complete: {} - valid: {}", dataId, result.isValid());
            return result;
        });
    }

    // ============================================
    // DATA TOKENIZATION
    // ============================================

    /**
     * Tokenize validated external data
     *
     * @param contractId Contract ID
     * @param dataId Data record ID
     * @return Tokenized data
     */
    public Uni<TokenizedData> tokenizeData(String contractId, String dataId) {
        return contractService.getContract(contractId)
            .flatMap(contract -> validateData(contractId, dataId)
                .map(validation -> {
                    LOGGER.info("Tokenizing data {} for contract {}", dataId, contractId);

                    if (!validation.isValid()) {
                        throw new EINodeDataException("Cannot tokenize invalid data: " + validation.getValidationMessage());
                    }

                    DataRecord record = dataRecords.get(dataId);

                    // Create tokenized data
                    TokenizedData token = new TokenizedData();
                    token.setTokenId(generateTokenId());
                    token.setDataId(dataId);
                    token.setContractId(contractId);
                    token.setEiNodeId(record.getEiNodeId());
                    token.setSourceType(record.getSourceType());
                    token.setTokenizedAt(Instant.now());
                    token.setDataHash(record.getHash());
                    token.setMetadata(extractTokenMetadata(record));

                    // Store tokenized data
                    tokenizedData.put(dataId, token);

                    // Update record
                    record.setStatus(DataRecordStatus.TOKENIZED);
                    record.setTokenId(token.getTokenId());

                    // Update contract
                    contract.getMetadata().put("lastTokenizedDataId", token.getTokenId());
                    contract.addAuditEntry("Data tokenized: " + token.getTokenId());

                    dataTokenized.incrementAndGet();

                    LOGGER.info("Data tokenized: {} -> {}", dataId, token.getTokenId());
                    return token;
                }));
    }

    /**
     * Get tokenized data for a contract
     *
     * @param contractId Contract ID
     * @return List of tokenized data
     */
    public Uni<List<TokenizedData>> getTokenizedData(String contractId) {
        return Uni.createFrom().item(() -> {
            return tokenizedData.values().stream()
                .filter(t -> t.getContractId().equals(contractId))
                .toList();
        });
    }

    // ============================================
    // DATA ATTESTATION
    // ============================================

    /**
     * Request VVB attestation for data
     *
     * @param contractId Contract ID
     * @param dataId Data record ID
     * @return Data attestation
     */
    public Uni<DataAttestation> attestData(String contractId, String dataId) {
        return validateData(contractId, dataId)
            .map(validation -> {
                LOGGER.info("Attesting data {} for contract {}", dataId, contractId);

                if (!validation.isValid()) {
                    throw new EINodeDataException("Cannot attest invalid data: " + validation.getValidationMessage());
                }

                DataRecord record = dataRecords.get(dataId);

                // Create attestation
                DataAttestation attestation = new DataAttestation();
                attestation.setAttestationId(generateAttestationId());
                attestation.setDataId(dataId);
                attestation.setContractId(contractId);
                attestation.setEiNodeId(record.getEiNodeId());
                attestation.setSourceType(record.getSourceType());
                attestation.setAttestedAt(Instant.now());
                attestation.setValidUntil(Instant.now().plusSeconds(24 * 60 * 60)); // 24 hours
                attestation.setDataHash(record.getHash());
                attestation.setAttestedBy("SYSTEM-VVB"); // In production, use actual VVB
                attestation.setSignature(generateAttestationSignature(dataId, record.getHash()));

                // Store attestation
                attestedData.put(dataId, attestation);

                // Update record
                record.setStatus(DataRecordStatus.ATTESTED);
                record.setAttestationId(attestation.getAttestationId());

                dataAttested.incrementAndGet();

                LOGGER.info("Data attested: {} -> {}", dataId, attestation.getAttestationId());
                return attestation;
            });
    }

    /**
     * Get attestation for data
     *
     * @param dataId Data record ID
     * @return Data attestation
     */
    public Uni<DataAttestation> getDataAttestation(String dataId) {
        return Uni.createFrom().item(() -> {
            DataAttestation attestation = attestedData.get(dataId);
            if (attestation == null) {
                throw new DataAttestationNotFoundException("No attestation found for data: " + dataId);
            }
            return attestation;
        });
    }

    // ============================================
    // STAKEHOLDER DATA MANAGEMENT
    // ============================================

    /**
     * Register stakeholder data (simplified interface for non-technical users)
     *
     * @param contractId Contract ID
     * @param stakeholderId Stakeholder identifier
     * @param dataType Type of data being submitted
     * @param data The data payload
     * @return Created DataRecord
     */
    public Uni<DataRecord> registerStakeholderData(String contractId, String stakeholderId, String dataType, Map<String, Object> data) {
        // Map stakeholder data type to DataSourceType
        DataSourceType sourceType = mapDataType(dataType);

        // First ensure data source is registered
        return registerDataSource(contractId, stakeholderId, sourceType, "stakeholder://" + stakeholderId)
            .flatMap(source -> pushData(contractId, stakeholderId, data));
    }

    // ============================================
    // METRICS
    // ============================================

    /**
     * Get EI Node data service metrics
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("dataSourcesRegistered", dataSourcesRegistered.get());
        metrics.put("dataPushCount", dataPushCount.get());
        metrics.put("dataFetchCount", dataFetchCount.get());
        metrics.put("dataTokenized", dataTokenized.get());
        metrics.put("dataAttested", dataAttested.get());
        metrics.put("totalDataRecords", dataRecords.size());
        metrics.put("totalTokenizedData", tokenizedData.size());
        metrics.put("totalAttestedData", attestedData.size());
        return metrics;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private DataSource findDataSource(String contractId, String eiNodeId) {
        List<DataSource> sources = contractDataSources.get(contractId);
        if (sources == null) return null;
        return sources.stream()
            .filter(s -> s.getEiNodeId().equals(eiNodeId))
            .findFirst()
            .orElse(null);
    }

    private String deriveProvider(DataSourceType type, String endpoint) {
        return switch (type) {
            case CRYPTO_EXCHANGE -> {
                if (endpoint.toLowerCase().contains("binance")) yield "Binance";
                if (endpoint.toLowerCase().contains("coinbase")) yield "Coinbase";
                if (endpoint.toLowerCase().contains("kraken")) yield "Kraken";
                yield "Unknown Exchange";
            }
            case CARBON_REGISTRY -> {
                if (endpoint.toLowerCase().contains("verra")) yield "Verra";
                if (endpoint.toLowerCase().contains("gold")) yield "Gold Standard";
                yield "Unknown Registry";
            }
            case ORACLE -> {
                if (endpoint.toLowerCase().contains("chainlink")) yield "Chainlink";
                if (endpoint.toLowerCase().contains("band")) yield "Band Protocol";
                yield "Unknown Oracle";
            }
            case IOT -> "IoT Network";
        };
    }

    private String calculateDataHash(Map<String, Object> data) {
        // Simple hash calculation (in production, use proper cryptographic hashing)
        return "HASH-" + Integer.toHexString(data.toString().hashCode()).toUpperCase();
    }

    private boolean validateDataStructure(Map<String, Object> data, DataSourceType type) {
        // Basic structure validation based on type
        if (data == null || data.isEmpty()) return false;

        return switch (type) {
            case CRYPTO_EXCHANGE -> data.containsKey("price") || data.containsKey("volume") || data.containsKey("symbol");
            case CARBON_REGISTRY -> data.containsKey("credits") || data.containsKey("project") || data.containsKey("vintage");
            case ORACLE -> data.containsKey("value") || data.containsKey("timestamp");
            case IOT -> data.containsKey("reading") || data.containsKey("sensorId") || data.containsKey("measurement");
        };
    }

    private String buildValidationMessage(DataValidationResult result) {
        List<String> issues = new ArrayList<>();
        if (!result.isHashValid()) issues.add("Data integrity check failed");
        if (!result.isStructureValid()) issues.add("Invalid data structure");
        if (!result.isFresh()) issues.add("Data is stale (age: " + result.getAgeSeconds() + "s)");
        return String.join("; ", issues);
    }

    private Map<String, Object> extractTokenMetadata(DataRecord record) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("sourceType", record.getSourceType().name());
        metadata.put("eiNodeId", record.getEiNodeId());
        metadata.put("pushedAt", record.getPushedAt().toString());
        metadata.put("dataHash", record.getHash());
        return metadata;
    }

    private DataSourceType mapDataType(String dataType) {
        if (dataType == null) return DataSourceType.IOT;
        return switch (dataType.toUpperCase()) {
            case "CRYPTO", "EXCHANGE", "PRICE" -> DataSourceType.CRYPTO_EXCHANGE;
            case "CARBON", "CREDIT", "OFFSET" -> DataSourceType.CARBON_REGISTRY;
            case "ORACLE", "FEED", "PRICE_FEED" -> DataSourceType.ORACLE;
            default -> DataSourceType.IOT;
        };
    }

    private String generateSourceId() {
        return "DS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateDataId() {
        return "DATA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateTokenId() {
        return "TOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateAttestationId() {
        return "ATT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateAttestationSignature(String dataId, String hash) {
        return "SIG-" + Base64.getEncoder().encodeToString(
            (dataId + ":" + hash + ":" + Instant.now().toEpochMilli()).getBytes()
        );
    }

    // ============================================
    // DATA CLASSES
    // ============================================

    /**
     * Data Source Type
     */
    public enum DataSourceType {
        CRYPTO_EXCHANGE,
        CARBON_REGISTRY,
        ORACLE,
        IOT
    }

    /**
     * Data Source Status
     */
    public enum DataSourceStatus {
        ACTIVE,
        INACTIVE,
        ERROR,
        DISCONNECTED
    }

    /**
     * Data Record Status
     */
    public enum DataRecordStatus {
        RECEIVED,
        VALIDATED,
        INVALID,
        TOKENIZED,
        ATTESTED
    }

    /**
     * Data Source
     */
    public static class DataSource {
        private String sourceId;
        private String contractId;
        private String eiNodeId;
        private DataSourceType type;
        private String endpoint;
        private String provider;
        private Instant registeredAt;
        private DataSourceStatus status;
        private Map<String, String> credentials = new HashMap<>();

        // Getters and setters
        public String getSourceId() { return sourceId; }
        public void setSourceId(String sourceId) { this.sourceId = sourceId; }
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public DataSourceType getType() { return type; }
        public void setType(DataSourceType type) { this.type = type; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public Instant getRegisteredAt() { return registeredAt; }
        public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }
        public DataSourceStatus getStatus() { return status; }
        public void setStatus(DataSourceStatus status) { this.status = status; }
        public Map<String, String> getCredentials() { return credentials; }
        public void setCredentials(Map<String, String> credentials) { this.credentials = credentials; }
    }

    /**
     * Data Record
     */
    public static class DataRecord {
        private String dataId;
        private String contractId;
        private String eiNodeId;
        private DataSourceType sourceType;
        private Map<String, Object> data;
        private Instant pushedAt;
        private Instant validatedAt;
        private DataRecordStatus status;
        private String hash;
        private String tokenId;
        private String attestationId;

        // Getters and setters
        public String getDataId() { return dataId; }
        public void setDataId(String dataId) { this.dataId = dataId; }
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public DataSourceType getSourceType() { return sourceType; }
        public void setSourceType(DataSourceType sourceType) { this.sourceType = sourceType; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
        public Instant getPushedAt() { return pushedAt; }
        public void setPushedAt(Instant pushedAt) { this.pushedAt = pushedAt; }
        public Instant getValidatedAt() { return validatedAt; }
        public void setValidatedAt(Instant validatedAt) { this.validatedAt = validatedAt; }
        public DataRecordStatus getStatus() { return status; }
        public void setStatus(DataRecordStatus status) { this.status = status; }
        public String getHash() { return hash; }
        public void setHash(String hash) { this.hash = hash; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public String getAttestationId() { return attestationId; }
        public void setAttestationId(String attestationId) { this.attestationId = attestationId; }
    }

    /**
     * Data Validation Result
     */
    public static class DataValidationResult {
        private String dataId;
        private String contractId;
        private Instant validatedAt;
        private boolean valid;
        private boolean hashValid;
        private boolean structureValid;
        private boolean fresh;
        private long ageSeconds;
        private String validationMessage;

        // Getters and setters
        public String getDataId() { return dataId; }
        public void setDataId(String dataId) { this.dataId = dataId; }
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public Instant getValidatedAt() { return validatedAt; }
        public void setValidatedAt(Instant validatedAt) { this.validatedAt = validatedAt; }
        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public boolean isHashValid() { return hashValid; }
        public void setHashValid(boolean hashValid) { this.hashValid = hashValid; }
        public boolean isStructureValid() { return structureValid; }
        public void setStructureValid(boolean structureValid) { this.structureValid = structureValid; }
        public boolean isFresh() { return fresh; }
        public void setFresh(boolean fresh) { this.fresh = fresh; }
        public long getAgeSeconds() { return ageSeconds; }
        public void setAgeSeconds(long ageSeconds) { this.ageSeconds = ageSeconds; }
        public String getValidationMessage() { return validationMessage; }
        public void setValidationMessage(String validationMessage) { this.validationMessage = validationMessage; }
    }

    /**
     * Tokenized Data
     */
    public static class TokenizedData {
        private String tokenId;
        private String dataId;
        private String contractId;
        private String eiNodeId;
        private DataSourceType sourceType;
        private Instant tokenizedAt;
        private String dataHash;
        private Map<String, Object> metadata = new HashMap<>();

        // Getters and setters
        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public String getDataId() { return dataId; }
        public void setDataId(String dataId) { this.dataId = dataId; }
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public DataSourceType getSourceType() { return sourceType; }
        public void setSourceType(DataSourceType sourceType) { this.sourceType = sourceType; }
        public Instant getTokenizedAt() { return tokenizedAt; }
        public void setTokenizedAt(Instant tokenizedAt) { this.tokenizedAt = tokenizedAt; }
        public String getDataHash() { return dataHash; }
        public void setDataHash(String dataHash) { this.dataHash = dataHash; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    /**
     * Data Attestation
     */
    public static class DataAttestation {
        private String attestationId;
        private String dataId;
        private String contractId;
        private String eiNodeId;
        private DataSourceType sourceType;
        private Instant attestedAt;
        private Instant validUntil;
        private String dataHash;
        private String attestedBy;
        private String signature;

        // Getters and setters
        public String getAttestationId() { return attestationId; }
        public void setAttestationId(String attestationId) { this.attestationId = attestationId; }
        public String getDataId() { return dataId; }
        public void setDataId(String dataId) { this.dataId = dataId; }
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public DataSourceType getSourceType() { return sourceType; }
        public void setSourceType(DataSourceType sourceType) { this.sourceType = sourceType; }
        public Instant getAttestedAt() { return attestedAt; }
        public void setAttestedAt(Instant attestedAt) { this.attestedAt = attestedAt; }
        public Instant getValidUntil() { return validUntil; }
        public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }
        public String getDataHash() { return dataHash; }
        public void setDataHash(String dataHash) { this.dataHash = dataHash; }
        public String getAttestedBy() { return attestedBy; }
        public void setAttestedBy(String attestedBy) { this.attestedBy = attestedBy; }
        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }
    }

    // ============================================
    // REQUEST CLASSES
    // ============================================

    /**
     * Data Source Registration Request
     */
    public static class DataSourceRegistrationRequest {
        private String eiNodeId;
        private String type;
        private String endpoint;
        private Map<String, String> credentials;

        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public Map<String, String> getCredentials() { return credentials; }
        public void setCredentials(Map<String, String> credentials) { this.credentials = credentials; }

        public DataSourceType getDataSourceType() {
            if (type == null) return DataSourceType.IOT;
            return switch (type.toUpperCase()) {
                case "CRYPTO_EXCHANGE", "CRYPTO", "EXCHANGE" -> DataSourceType.CRYPTO_EXCHANGE;
                case "CARBON_REGISTRY", "CARBON", "REGISTRY" -> DataSourceType.CARBON_REGISTRY;
                case "ORACLE" -> DataSourceType.ORACLE;
                default -> DataSourceType.IOT;
            };
        }
    }

    /**
     * Data Push Request
     */
    public static class DataPushRequest {
        private String eiNodeId;
        private Map<String, Object> data;

        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
    }

    /**
     * Stakeholder Data Request
     */
    public static class StakeholderDataRequest {
        private String stakeholderId;
        private String dataType;
        private Map<String, Object> data;

        public String getStakeholderId() { return stakeholderId; }
        public void setStakeholderId(String stakeholderId) { this.stakeholderId = stakeholderId; }
        public String getDataType() { return dataType; }
        public void setDataType(String dataType) { this.dataType = dataType; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
    }

    /**
     * Data Validation Request
     */
    public static class DataValidationRequest {
        private String dataId;

        public String getDataId() { return dataId; }
        public void setDataId(String dataId) { this.dataId = dataId; }
    }

    // ============================================
    // EXCEPTIONS
    // ============================================

    public static class EINodeDataException extends RuntimeException {
        public EINodeDataException(String message) {
            super(message);
        }
    }

    public static class DataRecordNotFoundException extends RuntimeException {
        public DataRecordNotFoundException(String message) {
            super(message);
        }
    }

    public static class DataAttestationNotFoundException extends RuntimeException {
        public DataAttestationNotFoundException(String message) {
            super(message);
        }
    }
}
