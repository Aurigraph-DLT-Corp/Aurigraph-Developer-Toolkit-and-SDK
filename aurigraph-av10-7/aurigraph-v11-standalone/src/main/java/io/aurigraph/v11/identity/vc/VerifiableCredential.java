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
 * W3C Verifiable Credential Implementation
 *
 * Implements the W3C Verifiable Credentials Data Model v1.1 specification.
 * A Verifiable Credential is a tamper-evident credential with cryptographically
 * verifiable authorship.
 *
 * Specification: https://www.w3.org/TR/vc-data-model/
 *
 * Supported credential types:
 * - KYC (Know Your Customer)
 * - Accreditation
 * - Membership
 * - Asset Ownership
 * - Compliance Certificate
 *
 * @version 12.0.0
 * @author Compliance & Audit Agent (CAA)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VerifiableCredential {

    // JSON-LD Contexts
    public static final String VC_CONTEXT_V1 = "https://www.w3.org/2018/credentials/v1";
    public static final String VC_CONTEXT_V2 = "https://www.w3.org/ns/credentials/v2";
    public static final String SECURITY_CONTEXT_V2 = "https://w3id.org/security/suites/ed25519-2020/v1";
    public static final String SECURITY_CONTEXT_JWS = "https://w3id.org/security/suites/jws-2020/v1";
    public static final String AURIGRAPH_VC_CONTEXT = "https://aurigraph.io/credentials/v1";

    // Base credential type
    public static final String BASE_TYPE = "VerifiableCredential";

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

    @JsonProperty("issuer")
    private Object issuer;

    @JsonProperty("issuanceDate")
    private String issuanceDate;

    @JsonProperty("expirationDate")
    private String expirationDate;

    @JsonProperty("credentialSubject")
    private Object credentialSubject;

    @JsonProperty("credentialStatus")
    private CredentialStatus credentialStatus;

    @JsonProperty("credentialSchema")
    private List<CredentialSchema> credentialSchema;

    @JsonProperty("refreshService")
    private RefreshService refreshService;

    @JsonProperty("termsOfUse")
    private List<TermsOfUse> termsOfUse;

    @JsonProperty("evidence")
    private List<Evidence> evidence;

    @JsonProperty("proof")
    private Object proof;

    // Non-serialized metadata
    private transient CredentialMetadata metadata;

    /**
     * Default constructor
     */
    public VerifiableCredential() {
        this.context = new ArrayList<>();
        this.context.add(VC_CONTEXT_V1);
        this.type = new ArrayList<>();
        this.type.add(BASE_TYPE);
        this.metadata = new CredentialMetadata();
    }

    /**
     * Create a new Verifiable Credential with issuer and subject
     *
     * @param credentialId Unique identifier for the credential
     * @param issuerDid DID of the issuer
     * @param subjectDid DID of the subject
     * @return New VerifiableCredential
     */
    public static VerifiableCredential create(String credentialId, String issuerDid, String subjectDid) {
        VerifiableCredential vc = new VerifiableCredential();
        vc.setId(credentialId);
        vc.setIssuer(issuerDid);
        vc.setIssuanceDate(Instant.now().toString());

        Map<String, Object> subject = new LinkedHashMap<>();
        subject.put("id", subjectDid);
        vc.setCredentialSubject(subject);

        return vc;
    }

    // ==================== Credential Type Builders ====================

    /**
     * Create a KYC (Know Your Customer) Credential
     */
    public static VerifiableCredential createKYCCredential(
            String credentialId,
            String issuerDid,
            String subjectDid,
            KYCCredentialSubject kycSubject) {

        VerifiableCredential vc = create(credentialId, issuerDid, subjectDid);
        vc.addType("KYCCredential");
        vc.addContext(AURIGRAPH_VC_CONTEXT);

        Map<String, Object> subject = new LinkedHashMap<>();
        subject.put("id", subjectDid);
        subject.put("type", "KYCCredentialSubject");
        subject.put("verificationLevel", kycSubject.getVerificationLevel());
        subject.put("verifiedAt", kycSubject.getVerifiedAt().toString());
        subject.put("jurisdiction", kycSubject.getJurisdiction());
        subject.put("verificationMethod", kycSubject.getVerificationMethod());

        if (kycSubject.getName() != null) {
            subject.put("name", kycSubject.getName());
        }
        if (kycSubject.getDateOfBirth() != null) {
            subject.put("dateOfBirth", kycSubject.getDateOfBirth());
        }
        if (kycSubject.getNationality() != null) {
            subject.put("nationality", kycSubject.getNationality());
        }

        vc.setCredentialSubject(subject);
        return vc;
    }

    /**
     * Create an Accreditation Credential
     */
    public static VerifiableCredential createAccreditationCredential(
            String credentialId,
            String issuerDid,
            String subjectDid,
            AccreditationCredentialSubject accreditationSubject) {

        VerifiableCredential vc = create(credentialId, issuerDid, subjectDid);
        vc.addType("AccreditationCredential");
        vc.addContext(AURIGRAPH_VC_CONTEXT);

        Map<String, Object> subject = new LinkedHashMap<>();
        subject.put("id", subjectDid);
        subject.put("type", "AccreditationCredentialSubject");
        subject.put("accreditationType", accreditationSubject.getAccreditationType());
        subject.put("accreditingBody", accreditationSubject.getAccreditingBody());
        subject.put("accreditationDate", accreditationSubject.getAccreditationDate().toString());
        subject.put("scope", accreditationSubject.getScope());

        if (accreditationSubject.getOrganizationName() != null) {
            subject.put("organizationName", accreditationSubject.getOrganizationName());
        }
        if (accreditationSubject.getRegistrationNumber() != null) {
            subject.put("registrationNumber", accreditationSubject.getRegistrationNumber());
        }

        vc.setCredentialSubject(subject);
        return vc;
    }

    /**
     * Create a Membership Credential
     */
    public static VerifiableCredential createMembershipCredential(
            String credentialId,
            String issuerDid,
            String subjectDid,
            MembershipCredentialSubject membershipSubject) {

        VerifiableCredential vc = create(credentialId, issuerDid, subjectDid);
        vc.addType("MembershipCredential");
        vc.addContext(AURIGRAPH_VC_CONTEXT);

        Map<String, Object> subject = new LinkedHashMap<>();
        subject.put("id", subjectDid);
        subject.put("type", "MembershipCredentialSubject");
        subject.put("organizationId", membershipSubject.getOrganizationId());
        subject.put("organizationName", membershipSubject.getOrganizationName());
        subject.put("membershipType", membershipSubject.getMembershipType());
        subject.put("memberSince", membershipSubject.getMemberSince().toString());
        subject.put("status", membershipSubject.getStatus());

        if (membershipSubject.getRoles() != null) {
            subject.put("roles", membershipSubject.getRoles());
        }

        vc.setCredentialSubject(subject);
        return vc;
    }

    /**
     * Create an Asset Ownership Credential
     */
    public static VerifiableCredential createAssetOwnershipCredential(
            String credentialId,
            String issuerDid,
            String subjectDid,
            AssetOwnershipCredentialSubject assetSubject) {

        VerifiableCredential vc = create(credentialId, issuerDid, subjectDid);
        vc.addType("AssetOwnershipCredential");
        vc.addContext(AURIGRAPH_VC_CONTEXT);

        Map<String, Object> subject = new LinkedHashMap<>();
        subject.put("id", subjectDid);
        subject.put("type", "AssetOwnershipCredentialSubject");
        subject.put("assetId", assetSubject.getAssetId());
        subject.put("assetType", assetSubject.getAssetType());
        subject.put("ownershipPercentage", assetSubject.getOwnershipPercentage());
        subject.put("acquisitionDate", assetSubject.getAcquisitionDate().toString());

        if (assetSubject.getAssetDescription() != null) {
            subject.put("assetDescription", assetSubject.getAssetDescription());
        }
        if (assetSubject.getValuation() != null) {
            subject.put("valuation", assetSubject.getValuation());
        }

        vc.setCredentialSubject(subject);
        return vc;
    }

    // ==================== Builder Methods ====================

    /**
     * Add a type to the credential
     */
    public VerifiableCredential addType(String credentialType) {
        if (!type.contains(credentialType)) {
            type.add(credentialType);
        }
        return this;
    }

    /**
     * Add a context to the credential
     */
    public VerifiableCredential addContext(Object contextValue) {
        if (!context.contains(contextValue)) {
            context.add(contextValue);
        }
        return this;
    }

    /**
     * Set expiration date
     */
    public VerifiableCredential withExpiration(Instant expirationDate) {
        this.expirationDate = expirationDate.toString();
        return this;
    }

    /**
     * Set credential status for revocation checking
     */
    public VerifiableCredential withCredentialStatus(String statusId, String statusType) {
        this.credentialStatus = new CredentialStatus(statusId, statusType);
        return this;
    }

    /**
     * Add credential schema
     */
    public VerifiableCredential withSchema(String schemaId, String schemaType) {
        if (this.credentialSchema == null) {
            this.credentialSchema = new ArrayList<>();
        }
        this.credentialSchema.add(new CredentialSchema(schemaId, schemaType));
        return this;
    }

    /**
     * Add refresh service
     */
    public VerifiableCredential withRefreshService(String serviceId, String serviceType) {
        this.refreshService = new RefreshService(serviceId, serviceType);
        return this;
    }

    /**
     * Add terms of use
     */
    public VerifiableCredential addTermsOfUse(String termsId, String termsType) {
        if (this.termsOfUse == null) {
            this.termsOfUse = new ArrayList<>();
        }
        this.termsOfUse.add(new TermsOfUse(termsId, termsType));
        return this;
    }

    /**
     * Add evidence
     */
    public VerifiableCredential addEvidence(Evidence evidenceItem) {
        if (this.evidence == null) {
            this.evidence = new ArrayList<>();
        }
        this.evidence.add(evidenceItem);
        return this;
    }

    /**
     * Set the proof (typically done during signing)
     */
    public VerifiableCredential withProof(Proof credentialProof) {
        this.proof = credentialProof;
        return this;
    }

    // ==================== Validation ====================

    /**
     * Validate the credential structure
     */
    public ValidationResult validate() {
        List<String> errors = new ArrayList<>();

        // Required fields
        if (context == null || context.isEmpty() || !context.contains(VC_CONTEXT_V1)) {
            errors.add("Missing or invalid @context");
        }
        if (type == null || !type.contains(BASE_TYPE)) {
            errors.add("Missing required type: " + BASE_TYPE);
        }
        if (issuer == null) {
            errors.add("Missing issuer");
        }
        if (issuanceDate == null) {
            errors.add("Missing issuanceDate");
        }
        if (credentialSubject == null) {
            errors.add("Missing credentialSubject");
        }

        // Validate expiration
        if (expirationDate != null) {
            try {
                Instant expiry = Instant.parse(expirationDate);
                if (expiry.isBefore(Instant.now())) {
                    errors.add("Credential has expired");
                }
            } catch (Exception e) {
                errors.add("Invalid expirationDate format");
            }
        }

        // Validate issuance date
        if (issuanceDate != null) {
            try {
                Instant issuance = Instant.parse(issuanceDate);
                if (issuance.isAfter(Instant.now())) {
                    errors.add("Credential issuanceDate is in the future");
                }
            } catch (Exception e) {
                errors.add("Invalid issuanceDate format");
            }
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    /**
     * Check if credential is expired
     */
    public boolean isExpired() {
        if (expirationDate == null) {
            return false;
        }
        try {
            return Instant.parse(expirationDate).isBefore(Instant.now());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if credential has a proof
     */
    public boolean hasProof() {
        return proof != null;
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
    public static VerifiableCredential fromJsonLd(String jsonLd) throws JsonProcessingException {
        return objectMapper.readValue(jsonLd, VerifiableCredential.class);
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
    public Object getIssuer() { return issuer; }
    public void setIssuer(Object issuer) { this.issuer = issuer; }
    public String getIssuanceDate() { return issuanceDate; }
    public void setIssuanceDate(String issuanceDate) { this.issuanceDate = issuanceDate; }
    public String getExpirationDate() { return expirationDate; }
    public void setExpirationDate(String expirationDate) { this.expirationDate = expirationDate; }
    public Object getCredentialSubject() { return credentialSubject; }
    public void setCredentialSubject(Object credentialSubject) { this.credentialSubject = credentialSubject; }
    public CredentialStatus getCredentialStatus() { return credentialStatus; }
    public void setCredentialStatus(CredentialStatus credentialStatus) { this.credentialStatus = credentialStatus; }
    public List<CredentialSchema> getCredentialSchema() { return credentialSchema; }
    public void setCredentialSchema(List<CredentialSchema> credentialSchema) { this.credentialSchema = credentialSchema; }
    public RefreshService getRefreshService() { return refreshService; }
    public void setRefreshService(RefreshService refreshService) { this.refreshService = refreshService; }
    public List<TermsOfUse> getTermsOfUse() { return termsOfUse; }
    public void setTermsOfUse(List<TermsOfUse> termsOfUse) { this.termsOfUse = termsOfUse; }
    public List<Evidence> getEvidence() { return evidence; }
    public void setEvidence(List<Evidence> evidence) { this.evidence = evidence; }
    public Object getProof() { return proof; }
    public void setProof(Object proof) { this.proof = proof; }
    public CredentialMetadata getMetadata() { return metadata; }
    public void setMetadata(CredentialMetadata metadata) { this.metadata = metadata; }

    /**
     * Get issuer DID (handles both string and object issuer formats)
     */
    public String getIssuerDid() {
        if (issuer instanceof String) {
            return (String) issuer;
        } else if (issuer instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> issuerMap = (Map<String, Object>) issuer;
            return (String) issuerMap.get("id");
        }
        return null;
    }

    /**
     * Get subject DID
     */
    public String getSubjectDid() {
        if (credentialSubject instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> subjectMap = (Map<String, Object>) credentialSubject;
            return (String) subjectMap.get("id");
        }
        return null;
    }

    // ==================== Inner Classes ====================

    /**
     * Credential Status for revocation checking
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CredentialStatus {
        private String id;
        private String type;
        private String statusListIndex;
        private String statusListCredential;

        public CredentialStatus() {}

        public CredentialStatus(String id, String type) {
            this.id = id;
            this.type = type;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getStatusListIndex() { return statusListIndex; }
        public void setStatusListIndex(String statusListIndex) { this.statusListIndex = statusListIndex; }
        public String getStatusListCredential() { return statusListCredential; }
        public void setStatusListCredential(String statusListCredential) { this.statusListCredential = statusListCredential; }
    }

    /**
     * Credential Schema
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CredentialSchema {
        private String id;
        private String type;

        public CredentialSchema() {}

        public CredentialSchema(String id, String type) {
            this.id = id;
            this.type = type;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    /**
     * Refresh Service
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RefreshService {
        private String id;
        private String type;

        public RefreshService() {}

        public RefreshService(String id, String type) {
            this.id = id;
            this.type = type;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    /**
     * Terms of Use
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TermsOfUse {
        private String id;
        private String type;
        private String profile;

        public TermsOfUse() {}

        public TermsOfUse(String id, String type) {
            this.id = id;
            this.type = type;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getProfile() { return profile; }
        public void setProfile(String profile) { this.profile = profile; }
    }

    /**
     * Evidence
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Evidence {
        private String id;
        private List<String> type;
        private String verifier;
        private String evidenceDocument;
        private String subjectPresence;
        private String documentPresence;
        private Map<String, Object> additionalProperties;

        public Evidence() {
            this.type = new ArrayList<>();
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public List<String> getType() { return type; }
        public void setType(List<String> type) { this.type = type; }
        public String getVerifier() { return verifier; }
        public void setVerifier(String verifier) { this.verifier = verifier; }
        public String getEvidenceDocument() { return evidenceDocument; }
        public void setEvidenceDocument(String evidenceDocument) { this.evidenceDocument = evidenceDocument; }
        public String getSubjectPresence() { return subjectPresence; }
        public void setSubjectPresence(String subjectPresence) { this.subjectPresence = subjectPresence; }
        public String getDocumentPresence() { return documentPresence; }
        public void setDocumentPresence(String documentPresence) { this.documentPresence = documentPresence; }
        public Map<String, Object> getAdditionalProperties() { return additionalProperties; }
        public void setAdditionalProperties(Map<String, Object> additionalProperties) {
            this.additionalProperties = additionalProperties;
        }
    }

    /**
     * Proof structure
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Proof {
        private String type;
        private String created;
        private String verificationMethod;
        private String proofPurpose;
        private String proofValue;
        private String jws;
        private String challenge;
        private String domain;

        public Proof() {}

        public Proof(String type, String verificationMethod, String proofPurpose) {
            this.type = type;
            this.verificationMethod = verificationMethod;
            this.proofPurpose = proofPurpose;
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
        public String getProofValue() { return proofValue; }
        public void setProofValue(String proofValue) { this.proofValue = proofValue; }
        public String getJws() { return jws; }
        public void setJws(String jws) { this.jws = jws; }
        public String getChallenge() { return challenge; }
        public void setChallenge(String challenge) { this.challenge = challenge; }
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
    }

    /**
     * Credential Metadata
     */
    public static class CredentialMetadata {
        private Instant retrievedAt;
        private String revocationStatus;
        private Instant lastChecked;
        private boolean verified;
        private String verificationError;

        public Instant getRetrievedAt() { return retrievedAt; }
        public void setRetrievedAt(Instant retrievedAt) { this.retrievedAt = retrievedAt; }
        public String getRevocationStatus() { return revocationStatus; }
        public void setRevocationStatus(String revocationStatus) { this.revocationStatus = revocationStatus; }
        public Instant getLastChecked() { return lastChecked; }
        public void setLastChecked(Instant lastChecked) { this.lastChecked = lastChecked; }
        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
        public String getVerificationError() { return verificationError; }
        public void setVerificationError(String verificationError) { this.verificationError = verificationError; }
    }

    /**
     * Validation Result
     */
    public record ValidationResult(boolean valid, List<String> errors) {
        public boolean isValid() { return valid; }
    }

    // ==================== Credential Subject Types ====================

    /**
     * KYC Credential Subject
     */
    public static class KYCCredentialSubject {
        private String verificationLevel; // BASIC, STANDARD, ENHANCED
        private Instant verifiedAt;
        private String jurisdiction;
        private String verificationMethod;
        private String name;
        private String dateOfBirth;
        private String nationality;

        public String getVerificationLevel() { return verificationLevel; }
        public void setVerificationLevel(String verificationLevel) { this.verificationLevel = verificationLevel; }
        public Instant getVerifiedAt() { return verifiedAt; }
        public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
        public String getJurisdiction() { return jurisdiction; }
        public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
        public String getVerificationMethod() { return verificationMethod; }
        public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
        public String getNationality() { return nationality; }
        public void setNationality(String nationality) { this.nationality = nationality; }
    }

    /**
     * Accreditation Credential Subject
     */
    public static class AccreditationCredentialSubject {
        private String accreditationType;
        private String accreditingBody;
        private Instant accreditationDate;
        private List<String> scope;
        private String organizationName;
        private String registrationNumber;

        public String getAccreditationType() { return accreditationType; }
        public void setAccreditationType(String accreditationType) { this.accreditationType = accreditationType; }
        public String getAccreditingBody() { return accreditingBody; }
        public void setAccreditingBody(String accreditingBody) { this.accreditingBody = accreditingBody; }
        public Instant getAccreditationDate() { return accreditationDate; }
        public void setAccreditationDate(Instant accreditationDate) { this.accreditationDate = accreditationDate; }
        public List<String> getScope() { return scope; }
        public void setScope(List<String> scope) { this.scope = scope; }
        public String getOrganizationName() { return organizationName; }
        public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
        public String getRegistrationNumber() { return registrationNumber; }
        public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    }

    /**
     * Membership Credential Subject
     */
    public static class MembershipCredentialSubject {
        private String organizationId;
        private String organizationName;
        private String membershipType;
        private Instant memberSince;
        private String status;
        private List<String> roles;

        public String getOrganizationId() { return organizationId; }
        public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
        public String getOrganizationName() { return organizationName; }
        public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
        public String getMembershipType() { return membershipType; }
        public void setMembershipType(String membershipType) { this.membershipType = membershipType; }
        public Instant getMemberSince() { return memberSince; }
        public void setMemberSince(Instant memberSince) { this.memberSince = memberSince; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }
    }

    /**
     * Asset Ownership Credential Subject
     */
    public static class AssetOwnershipCredentialSubject {
        private String assetId;
        private String assetType;
        private double ownershipPercentage;
        private Instant acquisitionDate;
        private String assetDescription;
        private Map<String, Object> valuation;

        public String getAssetId() { return assetId; }
        public void setAssetId(String assetId) { this.assetId = assetId; }
        public String getAssetType() { return assetType; }
        public void setAssetType(String assetType) { this.assetType = assetType; }
        public double getOwnershipPercentage() { return ownershipPercentage; }
        public void setOwnershipPercentage(double ownershipPercentage) { this.ownershipPercentage = ownershipPercentage; }
        public Instant getAcquisitionDate() { return acquisitionDate; }
        public void setAcquisitionDate(Instant acquisitionDate) { this.acquisitionDate = acquisitionDate; }
        public String getAssetDescription() { return assetDescription; }
        public void setAssetDescription(String assetDescription) { this.assetDescription = assetDescription; }
        public Map<String, Object> getValuation() { return valuation; }
        public void setValuation(Map<String, Object> valuation) { this.valuation = valuation; }
    }

    @Override
    public String toString() {
        return "VerifiableCredential{id='" + id + "', type=" + type + ", issuer=" + getIssuerDid() + "}";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VerifiableCredential that = (VerifiableCredential) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
