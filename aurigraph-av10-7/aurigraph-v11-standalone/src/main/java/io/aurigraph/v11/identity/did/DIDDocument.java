package io.aurigraph.v11.identity.did;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.time.Instant;
import java.util.*;

/**
 * W3C DID Document Implementation
 *
 * Implements the W3C Decentralized Identifiers (DIDs) v1.0 specification.
 * A DID Document contains information associated with a DID, including
 * mechanisms for the DID subject to authenticate and prove association with the DID.
 *
 * Specification: https://www.w3.org/TR/did-core/
 *
 * @version 12.0.0
 * @author Compliance & Audit Agent (CAA)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DIDDocument {

    // JSON-LD Context for DID Documents
    public static final String DID_CONTEXT_V1 = "https://www.w3.org/ns/did/v1";
    public static final String DID_CONTEXT_SECURITY_V2 = "https://w3id.org/security/suites/ed25519-2020/v1";
    public static final String DID_CONTEXT_SECURITY_JWS = "https://w3id.org/security/suites/jws-2020/v1";

    // Static ObjectMapper for JSON-LD serialization
    private static final ObjectMapper objectMapper = new ObjectMapper()
            .enable(SerializationFeature.INDENT_OUTPUT)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    @JsonProperty("@context")
    private List<Object> context;

    @JsonProperty("id")
    private String id;

    @JsonProperty("controller")
    private List<String> controller;

    @JsonProperty("alsoKnownAs")
    private List<String> alsoKnownAs;

    @JsonProperty("verificationMethod")
    private List<VerificationMethod> verificationMethod;

    @JsonProperty("authentication")
    private List<Object> authentication;

    @JsonProperty("assertionMethod")
    private List<Object> assertionMethod;

    @JsonProperty("keyAgreement")
    private List<Object> keyAgreement;

    @JsonProperty("capabilityInvocation")
    private List<Object> capabilityInvocation;

    @JsonProperty("capabilityDelegation")
    private List<Object> capabilityDelegation;

    @JsonProperty("service")
    private List<ServiceEndpoint> service;

    // Metadata (not part of core DID Document but useful for resolution)
    private transient DIDDocumentMetadata metadata;

    /**
     * Default constructor initializing with standard DID context
     */
    public DIDDocument() {
        this.context = new ArrayList<>();
        this.context.add(DID_CONTEXT_V1);
        this.controller = new ArrayList<>();
        this.alsoKnownAs = new ArrayList<>();
        this.verificationMethod = new ArrayList<>();
        this.authentication = new ArrayList<>();
        this.assertionMethod = new ArrayList<>();
        this.keyAgreement = new ArrayList<>();
        this.capabilityInvocation = new ArrayList<>();
        this.capabilityDelegation = new ArrayList<>();
        this.service = new ArrayList<>();
        this.metadata = new DIDDocumentMetadata();
    }

    /**
     * Create a new DID Document with the specified DID
     *
     * @param did The DID identifier
     * @return A new DID Document
     */
    public static DIDDocument create(String did) {
        DIDDocument doc = new DIDDocument();
        doc.setId(did);
        doc.controller.add(did); // Self-controlled by default
        doc.metadata.setCreated(Instant.now());
        return doc;
    }

    /**
     * Create a DID Document for Aurigraph network
     *
     * @param network The network identifier (mainnet, testnet, devnet)
     * @param uniqueId The unique identifier within the network
     * @return A new Aurigraph DID Document
     */
    public static DIDDocument createAurigraph(String network, String uniqueId) {
        String did = String.format("did:aurigraph:%s:%s", network, uniqueId);
        DIDDocument doc = create(did);

        // Add security context for cryptographic proofs
        doc.context.add(DID_CONTEXT_SECURITY_V2);
        doc.context.add(DID_CONTEXT_SECURITY_JWS);

        return doc;
    }

    // ==================== Verification Methods ====================

    /**
     * Add an Ed25519 verification method
     *
     * @param keyId Key identifier (fragment)
     * @param publicKeyMultibase Multibase-encoded public key
     * @return This document for method chaining
     */
    public DIDDocument addEd25519VerificationMethod(String keyId, String publicKeyMultibase) {
        VerificationMethod vm = new VerificationMethod();
        vm.setId(id + "#" + keyId);
        vm.setType(VerificationMethodType.ED25519_VERIFICATION_KEY_2020);
        vm.setController(id);
        vm.setPublicKeyMultibase(publicKeyMultibase);

        verificationMethod.add(vm);
        return this;
    }

    /**
     * Add a Dilithium (Post-Quantum) verification method
     *
     * @param keyId Key identifier (fragment)
     * @param publicKeyMultibase Multibase-encoded public key
     * @param securityLevel NIST security level (2, 3, or 5)
     * @return This document for method chaining
     */
    public DIDDocument addDilithiumVerificationMethod(String keyId, String publicKeyMultibase, int securityLevel) {
        VerificationMethod vm = new VerificationMethod();
        vm.setId(id + "#" + keyId);
        vm.setType(VerificationMethodType.DILITHIUM_VERIFICATION_KEY_2023);
        vm.setController(id);
        vm.setPublicKeyMultibase(publicKeyMultibase);

        // Add security level as additional property
        vm.addProperty("securityLevel", "NIST Level " + securityLevel);
        vm.addProperty("quantumResistant", true);

        verificationMethod.add(vm);
        return this;
    }

    /**
     * Add a JsonWebKey verification method
     *
     * @param keyId Key identifier (fragment)
     * @param jwk JSON Web Key object
     * @return This document for method chaining
     */
    public DIDDocument addJsonWebKeyMethod(String keyId, Map<String, Object> jwk) {
        VerificationMethod vm = new VerificationMethod();
        vm.setId(id + "#" + keyId);
        vm.setType(VerificationMethodType.JSON_WEB_KEY_2020);
        vm.setController(id);
        vm.setPublicKeyJwk(jwk);

        verificationMethod.add(vm);
        return this;
    }

    /**
     * Add a verification method reference to authentication
     *
     * @param keyId Key identifier (can be full ID or fragment)
     * @return This document for method chaining
     */
    public DIDDocument addAuthentication(String keyId) {
        String fullId = keyId.startsWith(id) ? keyId : id + "#" + keyId;
        authentication.add(fullId);
        return this;
    }

    /**
     * Add a verification method reference to assertion method
     *
     * @param keyId Key identifier (can be full ID or fragment)
     * @return This document for method chaining
     */
    public DIDDocument addAssertionMethod(String keyId) {
        String fullId = keyId.startsWith(id) ? keyId : id + "#" + keyId;
        assertionMethod.add(fullId);
        return this;
    }

    /**
     * Add a verification method reference to key agreement
     *
     * @param keyId Key identifier (can be full ID or fragment)
     * @return This document for method chaining
     */
    public DIDDocument addKeyAgreement(String keyId) {
        String fullId = keyId.startsWith(id) ? keyId : id + "#" + keyId;
        keyAgreement.add(fullId);
        return this;
    }

    /**
     * Add a verification method reference to capability invocation
     *
     * @param keyId Key identifier (can be full ID or fragment)
     * @return This document for method chaining
     */
    public DIDDocument addCapabilityInvocation(String keyId) {
        String fullId = keyId.startsWith(id) ? keyId : id + "#" + keyId;
        capabilityInvocation.add(fullId);
        return this;
    }

    /**
     * Add a verification method reference to capability delegation
     *
     * @param keyId Key identifier (can be full ID or fragment)
     * @return This document for method chaining
     */
    public DIDDocument addCapabilityDelegation(String keyId) {
        String fullId = keyId.startsWith(id) ? keyId : id + "#" + keyId;
        capabilityDelegation.add(fullId);
        return this;
    }

    // ==================== Service Endpoints ====================

    /**
     * Add a service endpoint
     *
     * @param serviceId Service identifier (fragment)
     * @param type Service type
     * @param serviceEndpoint Service endpoint URL or object
     * @return This document for method chaining
     */
    public DIDDocument addService(String serviceId, String type, Object serviceEndpoint) {
        ServiceEndpoint se = new ServiceEndpoint();
        se.setId(id + "#" + serviceId);
        se.setType(type);
        se.setServiceEndpoint(serviceEndpoint);

        service.add(se);
        return this;
    }

    /**
     * Add a DIDComm messaging service
     *
     * @param serviceId Service identifier
     * @param endpointUrl DIDComm endpoint URL
     * @param routingKeys Routing keys for message forwarding
     * @return This document for method chaining
     */
    public DIDDocument addDIDCommService(String serviceId, String endpointUrl, List<String> routingKeys) {
        Map<String, Object> endpoint = new LinkedHashMap<>();
        endpoint.put("uri", endpointUrl);
        if (routingKeys != null && !routingKeys.isEmpty()) {
            endpoint.put("routingKeys", routingKeys);
        }
        endpoint.put("accept", Arrays.asList("didcomm/v2", "didcomm/aip2;env=rfc587"));

        return addService(serviceId, "DIDCommMessaging", endpoint);
    }

    /**
     * Add an Aurigraph-specific service endpoint
     *
     * @param serviceType Type of Aurigraph service (e.g., "CredentialRegistry", "AssetTokenization")
     * @param endpointUrl Service endpoint URL
     * @return This document for method chaining
     */
    public DIDDocument addAurigraphService(String serviceType, String endpointUrl) {
        Map<String, Object> endpoint = new LinkedHashMap<>();
        endpoint.put("uri", endpointUrl);
        endpoint.put("version", "12.0");
        endpoint.put("protocol", "HTTPS+gRPC");

        return addService(serviceType.toLowerCase(), "AurigraphService#" + serviceType, endpoint);
    }

    // ==================== Verification Method Lookup ====================

    /**
     * Get a verification method by ID
     *
     * @param methodId The verification method ID
     * @return The verification method or null if not found
     */
    public VerificationMethod getVerificationMethod(String methodId) {
        String fullId = methodId.startsWith("did:") ? methodId : id + "#" + methodId;
        return verificationMethod.stream()
                .filter(vm -> fullId.equals(vm.getId()))
                .findFirst()
                .orElse(null);
    }

    /**
     * Get all verification methods for a specific purpose
     *
     * @param purpose The verification relationship (authentication, assertionMethod, etc.)
     * @return List of verification methods for that purpose
     */
    public List<VerificationMethod> getVerificationMethodsForPurpose(String purpose) {
        List<Object> references = switch (purpose) {
            case "authentication" -> authentication;
            case "assertionMethod" -> assertionMethod;
            case "keyAgreement" -> keyAgreement;
            case "capabilityInvocation" -> capabilityInvocation;
            case "capabilityDelegation" -> capabilityDelegation;
            default -> Collections.emptyList();
        };

        List<VerificationMethod> methods = new ArrayList<>();
        for (Object ref : references) {
            if (ref instanceof String) {
                VerificationMethod vm = getVerificationMethod((String) ref);
                if (vm != null) {
                    methods.add(vm);
                }
            } else if (ref instanceof VerificationMethod) {
                methods.add((VerificationMethod) ref);
            }
        }
        return methods;
    }

    // ==================== Serialization ====================

    /**
     * Serialize the DID Document to JSON-LD format
     *
     * @return JSON-LD string representation
     * @throws JsonProcessingException If serialization fails
     */
    public String toJsonLd() throws JsonProcessingException {
        return objectMapper.writeValueAsString(this);
    }

    /**
     * Parse a DID Document from JSON-LD
     *
     * @param jsonLd JSON-LD string
     * @return Parsed DID Document
     * @throws JsonProcessingException If parsing fails
     */
    public static DIDDocument fromJsonLd(String jsonLd) throws JsonProcessingException {
        return objectMapper.readValue(jsonLd, DIDDocument.class);
    }

    /**
     * Convert to a Map for flexible manipulation
     *
     * @return Map representation of the DID Document
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> toMap() {
        return objectMapper.convertValue(this, Map.class);
    }

    // ==================== Getters and Setters ====================

    public List<Object> getContext() {
        return context;
    }

    public void setContext(List<Object> context) {
        this.context = context;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<String> getController() {
        return controller;
    }

    public void setController(List<String> controller) {
        this.controller = controller;
    }

    public List<String> getAlsoKnownAs() {
        return alsoKnownAs;
    }

    public void setAlsoKnownAs(List<String> alsoKnownAs) {
        this.alsoKnownAs = alsoKnownAs;
    }

    public List<VerificationMethod> getVerificationMethod() {
        return verificationMethod;
    }

    public void setVerificationMethod(List<VerificationMethod> verificationMethod) {
        this.verificationMethod = verificationMethod;
    }

    public List<Object> getAuthentication() {
        return authentication;
    }

    public void setAuthentication(List<Object> authentication) {
        this.authentication = authentication;
    }

    public List<Object> getAssertionMethod() {
        return assertionMethod;
    }

    public void setAssertionMethod(List<Object> assertionMethod) {
        this.assertionMethod = assertionMethod;
    }

    public List<Object> getKeyAgreement() {
        return keyAgreement;
    }

    public void setKeyAgreement(List<Object> keyAgreement) {
        this.keyAgreement = keyAgreement;
    }

    public List<Object> getCapabilityInvocation() {
        return capabilityInvocation;
    }

    public void setCapabilityInvocation(List<Object> capabilityInvocation) {
        this.capabilityInvocation = capabilityInvocation;
    }

    public List<Object> getCapabilityDelegation() {
        return capabilityDelegation;
    }

    public void setCapabilityDelegation(List<Object> capabilityDelegation) {
        this.capabilityDelegation = capabilityDelegation;
    }

    public List<ServiceEndpoint> getService() {
        return service;
    }

    public void setService(List<ServiceEndpoint> service) {
        this.service = service;
    }

    public DIDDocumentMetadata getMetadata() {
        return metadata;
    }

    public void setMetadata(DIDDocumentMetadata metadata) {
        this.metadata = metadata;
    }

    // ==================== Inner Classes ====================

    /**
     * Verification Method types supported by Aurigraph
     */
    public enum VerificationMethodType {
        ED25519_VERIFICATION_KEY_2020("Ed25519VerificationKey2020"),
        ED25519_VERIFICATION_KEY_2018("Ed25519VerificationKey2018"),
        JSON_WEB_KEY_2020("JsonWebKey2020"),
        DILITHIUM_VERIFICATION_KEY_2023("DilithiumVerificationKey2023"),
        SPHINCS_VERIFICATION_KEY_2023("SPHINCSVerificationKey2023"),
        X25519_KEY_AGREEMENT_KEY_2020("X25519KeyAgreementKey2020"),
        KYBER_KEY_AGREEMENT_KEY_2023("KyberKeyAgreementKey2023");

        private final String value;

        VerificationMethodType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }
    }

    /**
     * Verification Method structure
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class VerificationMethod {
        private String id;
        private String type;
        private String controller;
        private String publicKeyMultibase;
        private Map<String, Object> publicKeyJwk;
        private String publicKeyBase58;
        private String publicKeyHex;
        private Map<String, Object> additionalProperties;

        public void setType(VerificationMethodType type) {
            this.type = type.getValue();
        }

        public void setType(String type) {
            this.type = type;
        }

        public void addProperty(String key, Object value) {
            if (additionalProperties == null) {
                additionalProperties = new LinkedHashMap<>();
            }
            additionalProperties.put(key, value);
        }

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public String getController() { return controller; }
        public void setController(String controller) { this.controller = controller; }
        public String getPublicKeyMultibase() { return publicKeyMultibase; }
        public void setPublicKeyMultibase(String publicKeyMultibase) { this.publicKeyMultibase = publicKeyMultibase; }
        public Map<String, Object> getPublicKeyJwk() { return publicKeyJwk; }
        public void setPublicKeyJwk(Map<String, Object> publicKeyJwk) { this.publicKeyJwk = publicKeyJwk; }
        public String getPublicKeyBase58() { return publicKeyBase58; }
        public void setPublicKeyBase58(String publicKeyBase58) { this.publicKeyBase58 = publicKeyBase58; }
        public String getPublicKeyHex() { return publicKeyHex; }
        public void setPublicKeyHex(String publicKeyHex) { this.publicKeyHex = publicKeyHex; }
        public Map<String, Object> getAdditionalProperties() { return additionalProperties; }
    }

    /**
     * Service Endpoint structure
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ServiceEndpoint {
        private String id;
        private String type;
        private Object serviceEndpoint;
        private String description;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Object getServiceEndpoint() { return serviceEndpoint; }
        public void setServiceEndpoint(Object serviceEndpoint) { this.serviceEndpoint = serviceEndpoint; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    /**
     * DID Document Metadata (DID Resolution metadata)
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DIDDocumentMetadata {
        private Instant created;
        private Instant updated;
        private boolean deactivated;
        private String versionId;
        private String nextVersionId;
        private String nextUpdate;
        private List<String> equivalentId;
        private String canonicalId;

        // Getters and setters
        public Instant getCreated() { return created; }
        public void setCreated(Instant created) { this.created = created; }
        public Instant getUpdated() { return updated; }
        public void setUpdated(Instant updated) { this.updated = updated; }
        public boolean isDeactivated() { return deactivated; }
        public void setDeactivated(boolean deactivated) { this.deactivated = deactivated; }
        public String getVersionId() { return versionId; }
        public void setVersionId(String versionId) { this.versionId = versionId; }
        public String getNextVersionId() { return nextVersionId; }
        public void setNextVersionId(String nextVersionId) { this.nextVersionId = nextVersionId; }
        public String getNextUpdate() { return nextUpdate; }
        public void setNextUpdate(String nextUpdate) { this.nextUpdate = nextUpdate; }
        public List<String> getEquivalentId() { return equivalentId; }
        public void setEquivalentId(List<String> equivalentId) { this.equivalentId = equivalentId; }
        public String getCanonicalId() { return canonicalId; }
        public void setCanonicalId(String canonicalId) { this.canonicalId = canonicalId; }
    }

    @Override
    public String toString() {
        return "DIDDocument{id='" + id + "', verificationMethods=" +
               (verificationMethod != null ? verificationMethod.size() : 0) +
               ", services=" + (service != null ? service.size() : 0) + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DIDDocument that = (DIDDocument) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
