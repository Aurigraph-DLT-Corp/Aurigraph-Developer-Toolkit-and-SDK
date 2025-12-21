package io.aurigraph.v11.identity.vc;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.Instant;
import java.util.*;

/**
 * W3C Verifiable Presentation Implementation
 *
 * A Verifiable Presentation is a container for one or more Verifiable Credentials
 * that can be presented to a verifier. It includes holder binding proof to
 * demonstrate that the presenter is authorized to present the credentials.
 *
 * Specification: https://www.w3.org/TR/vc-data-model/#presentations
 *
 * Features:
 * - Combine multiple VCs into a single presentation
 * - Holder binding with cryptographic proof
 * - Selective disclosure support
 * - Challenge-response for freshness
 * - Domain binding
 *
 * @version 12.0.0
 * @author Compliance & Audit Agent (CAA)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VerifiablePresentation {

    // JSON-LD Contexts
    public static final String VP_CONTEXT_V1 = "https://www.w3.org/2018/credentials/v1";
    public static final String SECURITY_CONTEXT_V2 = "https://w3id.org/security/suites/ed25519-2020/v1";

    // Base type
    public static final String BASE_TYPE = "VerifiablePresentation";

    // Static ObjectMapper
    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .enable(SerializationFeature.INDENT_OUTPUT)
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    @JsonProperty("@context")
    private List<Object> context;

    @JsonProperty("id")
    private String id;

    @JsonProperty("type")
    private List<String> type;

    @JsonProperty("holder")
    private String holder;

    @JsonProperty("verifiableCredential")
    private List<Object> verifiableCredential;

    @JsonProperty("proof")
    private Object proof;

    // Metadata (not serialized)
    private transient PresentationMetadata metadata;

    /**
     * Default constructor
     */
    public VerifiablePresentation() {
        this.context = new ArrayList<>();
        this.context.add(VP_CONTEXT_V1);
        this.type = new ArrayList<>();
        this.type.add(BASE_TYPE);
        this.verifiableCredential = new ArrayList<>();
        this.metadata = new PresentationMetadata();
    }

    /**
     * Create a new Verifiable Presentation
     *
     * @param presentationId Unique identifier for the presentation
     * @param holderDid DID of the holder/presenter
     * @return New VerifiablePresentation
     */
    public static VerifiablePresentation create(String presentationId, String holderDid) {
        VerifiablePresentation vp = new VerifiablePresentation();
        vp.setId(presentationId);
        vp.setHolder(holderDid);
        return vp;
    }

    /**
     * Create a presentation from credentials
     *
     * @param holderDid DID of the holder
     * @param credentials Credentials to include
     * @return New VerifiablePresentation
     */
    public static VerifiablePresentation createFromCredentials(
            String holderDid,
            List<VerifiableCredential> credentials) {

        String presentationId = "urn:uuid:" + UUID.randomUUID();
        VerifiablePresentation vp = create(presentationId, holderDid);

        for (VerifiableCredential credential : credentials) {
            vp.addCredential(credential);
        }

        return vp;
    }

    // ==================== Builder Methods ====================

    /**
     * Add a Verifiable Credential to the presentation
     *
     * @param credential The credential to add
     * @return This presentation for method chaining
     */
    public VerifiablePresentation addCredential(VerifiableCredential credential) {
        verifiableCredential.add(credential);
        return this;
    }

    /**
     * Add a credential by JSON-LD string
     *
     * @param credentialJson JSON-LD string of the credential
     * @return This presentation for method chaining
     */
    public VerifiablePresentation addCredentialJson(String credentialJson) {
        try {
            VerifiableCredential credential = VerifiableCredential.fromJsonLd(credentialJson);
            return addCredential(credential);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid credential JSON", e);
        }
    }

    /**
     * Add a type to the presentation
     *
     * @param presentationType Additional type
     * @return This presentation for method chaining
     */
    public VerifiablePresentation addType(String presentationType) {
        if (!type.contains(presentationType)) {
            type.add(presentationType);
        }
        return this;
    }

    /**
     * Add a context to the presentation
     *
     * @param contextValue Context to add
     * @return This presentation for method chaining
     */
    public VerifiablePresentation addContext(Object contextValue) {
        if (!context.contains(contextValue)) {
            context.add(contextValue);
        }
        return this;
    }

    /**
     * Set the proof (typically set during signing)
     *
     * @param presentationProof The proof object
     * @return This presentation for method chaining
     */
    public VerifiablePresentation withProof(PresentationProof presentationProof) {
        this.proof = presentationProof;
        return this;
    }

    // ==================== Selective Disclosure ====================

    /**
     * Create a presentation with selective disclosure
     *
     * @param credential The source credential
     * @param disclosedClaims List of claim names to disclose
     * @return A credential with only the specified claims
     */
    public static VerifiableCredential selectivelyDisclose(
            VerifiableCredential credential,
            Set<String> disclosedClaims) {

        try {
            // Create a copy of the credential
            String json = credential.toJsonLd();
            VerifiableCredential disclosed = VerifiableCredential.fromJsonLd(json);

            // Filter the credential subject
            Object subject = disclosed.getCredentialSubject();
            if (subject instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> subjectMap = new LinkedHashMap<>((Map<String, Object>) subject);

                // Keep only disclosed claims (plus mandatory 'id')
                subjectMap.keySet().retainAll(disclosedClaims);
                if (((Map<?, ?>) subject).containsKey("id")) {
                    subjectMap.put("id", ((Map<?, ?>) subject).get("id"));
                }

                disclosed.setCredentialSubject(subjectMap);
            }

            return disclosed;

        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to create selective disclosure", e);
        }
    }

    /**
     * Add a credential with selective disclosure
     *
     * @param credential The source credential
     * @param disclosedClaims Claims to disclose
     * @return This presentation for method chaining
     */
    public VerifiablePresentation addCredentialWithSelectiveDisclosure(
            VerifiableCredential credential,
            Set<String> disclosedClaims) {

        VerifiableCredential disclosed = selectivelyDisclose(credential, disclosedClaims);
        return addCredential(disclosed);
    }

    // ==================== Validation ====================

    /**
     * Validate the presentation structure
     *
     * @return Validation result
     */
    public ValidationResult validate() {
        List<String> errors = new ArrayList<>();

        // Required fields
        if (context == null || context.isEmpty() || !context.contains(VP_CONTEXT_V1)) {
            errors.add("Missing or invalid @context");
        }
        if (type == null || !type.contains(BASE_TYPE)) {
            errors.add("Missing required type: " + BASE_TYPE);
        }
        if (holder == null || holder.isEmpty()) {
            errors.add("Missing holder");
        }

        // Validate each credential
        for (int i = 0; i < verifiableCredential.size(); i++) {
            Object vc = verifiableCredential.get(i);
            if (vc instanceof VerifiableCredential credential) {
                VerifiableCredential.ValidationResult vcResult = credential.validate();
                if (!vcResult.isValid()) {
                    for (String error : vcResult.errors()) {
                        errors.add("Credential " + i + ": " + error);
                    }
                }
            }
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    /**
     * Check if the holder is the subject of all credentials
     *
     * @return true if holder matches all credential subjects
     */
    public boolean isHolderSubjectOfAllCredentials() {
        for (Object vc : verifiableCredential) {
            if (vc instanceof VerifiableCredential credential) {
                String subjectDid = credential.getSubjectDid();
                if (subjectDid != null && !subjectDid.equals(holder)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Check if presentation has a proof
     */
    public boolean hasProof() {
        return proof != null;
    }

    /**
     * Get the number of credentials
     */
    public int getCredentialCount() {
        return verifiableCredential.size();
    }

    // ==================== Serialization ====================

    /**
     * Serialize to JSON-LD
     */
    public String toJsonLd() throws JsonProcessingException {
        return objectMapper.writeValueAsString(this);
    }

    /**
     * Parse from JSON-LD
     */
    public static VerifiablePresentation fromJsonLd(String jsonLd) throws JsonProcessingException {
        return objectMapper.readValue(jsonLd, VerifiablePresentation.class);
    }

    /**
     * Convert to Map
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> toMap() {
        return objectMapper.convertValue(this, Map.class);
    }

    // ==================== Getters and Setters ====================

    public List<Object> getContext() { return context; }
    public void setContext(List<Object> context) { this.context = context; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public List<String> getType() { return type; }
    public void setType(List<String> type) { this.type = type; }
    public String getHolder() { return holder; }
    public void setHolder(String holder) { this.holder = holder; }
    public List<Object> getVerifiableCredential() { return verifiableCredential; }
    public void setVerifiableCredential(List<Object> verifiableCredential) {
        this.verifiableCredential = verifiableCredential;
    }
    public Object getProof() { return proof; }
    public void setProof(Object proof) { this.proof = proof; }
    public PresentationMetadata getMetadata() { return metadata; }
    public void setMetadata(PresentationMetadata metadata) { this.metadata = metadata; }

    /**
     * Get credentials as VerifiableCredential objects
     */
    public List<VerifiableCredential> getCredentials() {
        List<VerifiableCredential> credentials = new ArrayList<>();
        for (Object vc : verifiableCredential) {
            if (vc instanceof VerifiableCredential credential) {
                credentials.add(credential);
            } else if (vc instanceof Map) {
                try {
                    String json = objectMapper.writeValueAsString(vc);
                    credentials.add(VerifiableCredential.fromJsonLd(json));
                } catch (JsonProcessingException e) {
                    // Skip invalid credentials
                }
            }
        }
        return credentials;
    }

    // ==================== Inner Classes ====================

    /**
     * Presentation Proof structure
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PresentationProof {
        private String type;
        private String created;
        private String verificationMethod;
        private String proofPurpose;
        private String challenge;
        private String domain;
        private String proofValue;
        private String jws;

        public PresentationProof() {
            this.proofPurpose = "authentication";
        }

        public PresentationProof(String type, String verificationMethod, String challenge, String domain) {
            this.type = type;
            this.verificationMethod = verificationMethod;
            this.proofPurpose = "authentication";
            this.challenge = challenge;
            this.domain = domain;
            this.created = Instant.now().toString();
        }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getCreated() { return created; }
        public void setCreated(String created) { this.created = created; }
        public String getVerificationMethod() { return verificationMethod; }
        public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }
        public String getProofPurpose() { return proofPurpose; }
        public void setProofPurpose(String proofPurpose) { this.proofPurpose = proofPurpose; }
        public String getChallenge() { return challenge; }
        public void setChallenge(String challenge) { this.challenge = challenge; }
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
        public String getProofValue() { return proofValue; }
        public void setProofValue(String proofValue) { this.proofValue = proofValue; }
        public String getJws() { return jws; }
        public void setJws(String jws) { this.jws = jws; }
    }

    /**
     * Presentation Metadata
     */
    public static class PresentationMetadata {
        private Instant createdAt;
        private Instant presentedAt;
        private String verifierDid;
        private boolean verified;
        private String verificationError;
        private long verificationDurationMs;

        public PresentationMetadata() {
            this.createdAt = Instant.now();
        }

        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getPresentedAt() { return presentedAt; }
        public void setPresentedAt(Instant presentedAt) { this.presentedAt = presentedAt; }
        public String getVerifierDid() { return verifierDid; }
        public void setVerifierDid(String verifierDid) { this.verifierDid = verifierDid; }
        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
        public String getVerificationError() { return verificationError; }
        public void setVerificationError(String verificationError) { this.verificationError = verificationError; }
        public long getVerificationDurationMs() { return verificationDurationMs; }
        public void setVerificationDurationMs(long verificationDurationMs) {
            this.verificationDurationMs = verificationDurationMs;
        }
    }

    /**
     * Validation Result
     */
    public record ValidationResult(boolean valid, List<String> errors) {
        public boolean isValid() { return valid; }
    }

    /**
     * Presentation Request (from verifier)
     */
    public static class PresentationRequest {
        private String requestId;
        private String verifierDid;
        private String challenge;
        private String domain;
        private List<CredentialRequirement> credentialRequirements;
        private Instant expiresAt;

        public PresentationRequest() {
            this.requestId = "urn:uuid:" + UUID.randomUUID();
            this.challenge = UUID.randomUUID().toString();
            this.expiresAt = Instant.now().plusSeconds(300); // 5 minutes
        }

        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        public String getVerifierDid() { return verifierDid; }
        public void setVerifierDid(String verifierDid) { this.verifierDid = verifierDid; }
        public String getChallenge() { return challenge; }
        public void setChallenge(String challenge) { this.challenge = challenge; }
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
        public List<CredentialRequirement> getCredentialRequirements() { return credentialRequirements; }
        public void setCredentialRequirements(List<CredentialRequirement> credentialRequirements) {
            this.credentialRequirements = credentialRequirements;
        }
        public Instant getExpiresAt() { return expiresAt; }
        public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    /**
     * Credential Requirement for presentation request
     */
    public static class CredentialRequirement {
        private String id;
        private List<String> type;
        private String issuer;
        private List<String> requiredClaims;
        private Map<String, Object> constraints;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public List<String> getType() { return type; }
        public void setType(List<String> type) { this.type = type; }
        public String getIssuer() { return issuer; }
        public void setIssuer(String issuer) { this.issuer = issuer; }
        public List<String> getRequiredClaims() { return requiredClaims; }
        public void setRequiredClaims(List<String> requiredClaims) { this.requiredClaims = requiredClaims; }
        public Map<String, Object> getConstraints() { return constraints; }
        public void setConstraints(Map<String, Object> constraints) { this.constraints = constraints; }
    }

    /**
     * Presentation Submission (response to request)
     */
    public static class PresentationSubmission {
        private String id;
        private String definitionId;
        private List<DescriptorMap> descriptorMap;

        public PresentationSubmission() {
            this.id = "urn:uuid:" + UUID.randomUUID();
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getDefinitionId() { return definitionId; }
        public void setDefinitionId(String definitionId) { this.definitionId = definitionId; }
        public List<DescriptorMap> getDescriptorMap() { return descriptorMap; }
        public void setDescriptorMap(List<DescriptorMap> descriptorMap) { this.descriptorMap = descriptorMap; }
    }

    /**
     * Descriptor Map entry for presentation submission
     */
    public static class DescriptorMap {
        private String id;
        private String format;
        private String path;
        private PathNested pathNested;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        public PathNested getPathNested() { return pathNested; }
        public void setPathNested(PathNested pathNested) { this.pathNested = pathNested; }
    }

    /**
     * Nested path for complex presentations
     */
    public static class PathNested {
        private String format;
        private String path;

        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
    }

    @Override
    public String toString() {
        return "VerifiablePresentation{id='" + id + "', holder='" + holder +
               "', credentials=" + verifiableCredential.size() + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VerifiablePresentation that = (VerifiablePresentation) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
