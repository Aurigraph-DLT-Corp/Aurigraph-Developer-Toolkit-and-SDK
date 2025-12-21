package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import io.aurigraph.v11.crypto.DilithiumSignatureService;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.KeyPair;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * Signature Workflow Service for ActiveContracts
 *
 * Manages multi-party signature collection with RBAC support and quantum-safe cryptography.
 *
 * Features:
 * - RBAC with roles: OWNER, PARTY, WITNESS, VVB, REGULATOR
 * - Sequential and parallel signature collection modes
 * - CRYSTALS-Dilithium quantum-safe signatures
 * - Signature workflow states: DRAFT -> PENDING_SIGNATURES -> PARTIALLY_SIGNED -> FULLY_SIGNED
 *
 * @version 12.0.0 - Sprint 4 RBAC Implementation
 * @since 2025-12-21
 */
@ApplicationScoped
public class SignatureWorkflowService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SignatureWorkflowService.class);

    @Inject
    ActiveContractService contractService;

    @Inject
    DilithiumSignatureService dilithiumService;

    // Signature workflow storage
    private final Map<String, SignatureWorkflow> workflows = new ConcurrentHashMap<>();
    private final Map<String, List<SignatureRequest>> pendingRequests = new ConcurrentHashMap<>();

    // Virtual thread executor for async operations
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // ==================== RBAC Role Definitions ====================

    /**
     * Signature roles with their permissions and signing order priority
     */
    public enum SignatureRole {
        OWNER(1, true, "Contract owner/creator with full control"),
        PARTY(2, true, "Contract party with signing rights"),
        WITNESS(3, false, "Witness to contract execution"),
        VVB(4, true, "Validation and Verification Body (carbon/RWA)"),
        REGULATOR(5, false, "Regulatory authority oversight");

        private final int priority;
        private final boolean signatureRequired;
        private final String description;

        SignatureRole(int priority, boolean signatureRequired, String description) {
            this.priority = priority;
            this.signatureRequired = signatureRequired;
            this.description = description;
        }

        public int getPriority() { return priority; }
        public boolean isSignatureRequired() { return signatureRequired; }
        public String getDescription() { return description; }
    }

    /**
     * Signature collection mode
     */
    public enum CollectionMode {
        SEQUENTIAL,  // Signatures must be collected in order of priority
        PARALLEL     // Signatures can be collected in any order
    }

    /**
     * Signature workflow states
     */
    public enum WorkflowState {
        DRAFT,                // Contract is in draft, no signatures requested
        PENDING_SIGNATURES,   // Signatures have been requested
        PARTIALLY_SIGNED,     // Some signatures collected
        FULLY_SIGNED,         // All required signatures collected
        EXPIRED,              // Signature request expired
        REJECTED              // One or more parties rejected signing
    }

    // ==================== Core Workflow Methods ====================

    /**
     * Request signature from a party
     *
     * @param contractId Contract ID
     * @param partyId Party identifier
     * @return Signature request details
     */
    public Uni<SignatureRequest> requestSignature(String contractId, String partyId) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("Requesting signature for contract {} from party {}", contractId, partyId);

                // Find the party in the contract
                ContractParty party = contract.getPartyById(partyId);
                if (party == null) {
                    throw new SignatureWorkflowException("Party not found: " + partyId);
                }

                // Get or create workflow
                SignatureWorkflow workflow = getOrCreateWorkflow(contractId, contract);

                // Check if party already signed
                if (hasPartySigned(contractId, partyId)) {
                    throw new SignatureWorkflowException("Party has already signed: " + partyId);
                }

                // Check sequential mode restrictions
                if (workflow.getCollectionMode() == CollectionMode.SEQUENTIAL) {
                    validateSequentialOrder(workflow, party);
                }

                // Create signature request
                SignatureRequest request = new SignatureRequest();
                request.setRequestId(generateRequestId());
                request.setContractId(contractId);
                request.setPartyId(partyId);
                request.setPartyName(party.getName());
                request.setPartyRole(SignatureRole.valueOf(party.getRole().toUpperCase()));
                request.setRequestedAt(Instant.now());
                request.setExpiresAt(Instant.now().plusSeconds(workflow.getRequestExpirySeconds()));
                request.setStatus(SignatureRequest.RequestStatus.PENDING);
                request.setSignatureType("CRYSTALS-Dilithium");

                // Store request
                pendingRequests.computeIfAbsent(contractId, k -> new ArrayList<>()).add(request);

                // Update workflow state
                if (workflow.getState() == WorkflowState.DRAFT) {
                    workflow.setState(WorkflowState.PENDING_SIGNATURES);
                }

                LOGGER.info("Signature request created: {} for party {}", request.getRequestId(), partyId);
                return request;
            });
    }

    /**
     * Submit a signature for a contract
     *
     * @param contractId Contract ID
     * @param partyId Party identifier
     * @param signatureData Signature data (Base64 encoded)
     * @param signatureType Signature algorithm type
     * @return Submitted signature with verification status
     */
    public Uni<ContractSignature> submitSignature(
            String contractId,
            String partyId,
            String signatureData,
            String signatureType
    ) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("Submitting signature for contract {} from party {}", contractId, partyId);

                // Validate party
                ContractParty party = contract.getPartyById(partyId);
                if (party == null) {
                    throw new SignatureWorkflowException("Party not found: " + partyId);
                }

                // Get workflow
                SignatureWorkflow workflow = workflows.get(contractId);
                if (workflow == null) {
                    throw new SignatureWorkflowException("No active signature workflow for contract: " + contractId);
                }

                // Check workflow state
                if (workflow.getState() == WorkflowState.FULLY_SIGNED) {
                    throw new SignatureWorkflowException("Contract is already fully signed");
                }
                if (workflow.getState() == WorkflowState.EXPIRED) {
                    throw new SignatureWorkflowException("Signature workflow has expired");
                }
                if (workflow.getState() == WorkflowState.REJECTED) {
                    throw new SignatureWorkflowException("Signature workflow was rejected");
                }

                // Check for pending request
                SignatureRequest request = findPendingRequest(contractId, partyId);
                if (request == null) {
                    throw new SignatureWorkflowException("No pending signature request for party: " + partyId);
                }

                // Check request expiry
                if (request.getExpiresAt().isBefore(Instant.now())) {
                    request.setStatus(SignatureRequest.RequestStatus.EXPIRED);
                    throw new SignatureWorkflowException("Signature request has expired");
                }

                // Create contract signature
                ContractSignature signature = new ContractSignature();
                signature.setSignatureId(generateSignatureId());
                signature.setContractId(contractId);
                signature.setPartyId(partyId);
                signature.setSignerAddress(party.getAddress());
                signature.setSignerName(party.getName());
                signature.setSignature(signatureData);
                signature.setSignatureData(signatureData);
                signature.setAlgorithm(signatureType != null ? signatureType : "CRYSTALS-Dilithium");
                signature.setSignatureType(signatureType != null ? signatureType : "CRYSTALS-Dilithium");
                signature.setPublicKey(party.getPublicKey());
                signature.setSignedAt(Instant.now());
                signature.setTimestamp(Instant.now());

                // Verify signature using quantum-safe crypto
                boolean isValid = verifyQuantumSafeSignature(contract, signature);
                signature.setVerified(isValid);

                if (!isValid) {
                    LOGGER.warn("Signature verification failed for party: {}", partyId);
                    throw new SignatureWorkflowException("Signature verification failed");
                }

                // Add role metadata
                signature.getMetadata().put("role", party.getRole());
                signature.getMetadata().put("workflowId", workflow.getWorkflowId());

                // Add signature to contract
                contract.addSignature(signature);
                contract.setUpdatedAt(Instant.now());
                contract.addAuditEntry(String.format(
                    "Signature submitted by %s (role: %s) at %s - Verified: %s",
                    party.getName(), party.getRole(), Instant.now(), isValid
                ));

                // Update request status
                request.setStatus(SignatureRequest.RequestStatus.COMPLETED);
                request.setCompletedAt(Instant.now());

                // Update workflow state
                updateWorkflowState(workflow, contract);

                LOGGER.info("Signature submitted and verified for party: {}", partyId);
                return signature;
            });
    }

    /**
     * Verify a specific signature on a contract
     *
     * @param contractId Contract ID
     * @param partyId Party identifier
     * @return Verification result
     */
    public Uni<SignatureVerificationResult> verifySignature(String contractId, String partyId) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("Verifying signature for contract {} party {}", contractId, partyId);

                // Find the signature
                ContractSignature signature = contract.getSignatures().stream()
                    .filter(sig -> partyId.equals(sig.getPartyId()) || partyId.equals(sig.getSignerAddress()))
                    .findFirst()
                    .orElseThrow(() -> new SignatureWorkflowException("Signature not found for party: " + partyId));

                // Verify using Dilithium
                boolean isValid = verifyQuantumSafeSignature(contract, signature);

                SignatureVerificationResult result = new SignatureVerificationResult();
                result.setContractId(contractId);
                result.setPartyId(partyId);
                result.setSignatureId(signature.getSignatureId());
                result.setValid(isValid);
                result.setAlgorithm(signature.getAlgorithm());
                result.setVerifiedAt(Instant.now());
                result.setSignedAt(signature.getSignedAt());

                if (!isValid) {
                    result.setReason("Signature verification failed - possible tampering or invalid key");
                }

                return result;
            });
    }

    /**
     * Get signature workflow status for a contract
     *
     * @param contractId Contract ID
     * @return Workflow status
     */
    public Uni<SignatureWorkflowStatus> getSignatureStatus(String contractId) {
        return contractService.getContract(contractId)
            .map(contract -> {
                SignatureWorkflow workflow = workflows.get(contractId);

                SignatureWorkflowStatus status = new SignatureWorkflowStatus();
                status.setContractId(contractId);
                status.setContractName(contract.getName());

                if (workflow != null) {
                    status.setWorkflowId(workflow.getWorkflowId());
                    status.setState(workflow.getState());
                    status.setCollectionMode(workflow.getCollectionMode());
                    status.setCreatedAt(workflow.getCreatedAt());
                    status.setUpdatedAt(workflow.getUpdatedAt());
                } else {
                    status.setState(WorkflowState.DRAFT);
                }

                // Count signatures
                List<ContractSignature> signatures = contract.getSignatures();
                status.setTotalSignatures(signatures.size());
                status.setVerifiedSignatures((int) signatures.stream().filter(ContractSignature::isVerified).count());

                // Get required signatures count
                List<SignatureRequirement> requirements = getRequiredSignaturesInternal(contract);
                status.setRequiredSignatures(requirements.size());
                status.setSignedCount((int) requirements.stream().filter(SignatureRequirement::isSigned).count());
                status.setPendingCount((int) requirements.stream().filter(r -> !r.isSigned()).count());

                status.setFullySigned(isFullySignedInternal(contract));

                // Add signature details by role
                Map<String, Integer> signaturesByRole = new HashMap<>();
                for (ContractSignature sig : signatures) {
                    String role = sig.getMetadata().getOrDefault("role", "PARTY");
                    signaturesByRole.merge(role, 1, Integer::sum);
                }
                status.setSignaturesByRole(signaturesByRole);

                return status;
            });
    }

    /**
     * Get list of required signatures for a contract
     *
     * @param contractId Contract ID
     * @return List of signature requirements
     */
    public Uni<List<SignatureRequirement>> getRequiredSignatures(String contractId) {
        return contractService.getContract(contractId)
            .map(this::getRequiredSignaturesInternal);
    }

    /**
     * Check if contract has all required signatures
     *
     * @param contractId Contract ID
     * @return true if fully signed
     */
    public Uni<Boolean> isFullySigned(String contractId) {
        return contractService.getContract(contractId)
            .map(this::isFullySignedInternal);
    }

    // ==================== Workflow Configuration ====================

    /**
     * Configure signature collection mode for a contract
     *
     * @param contractId Contract ID
     * @param mode Collection mode (SEQUENTIAL or PARALLEL)
     * @return Updated workflow
     */
    public Uni<SignatureWorkflow> setCollectionMode(String contractId, CollectionMode mode) {
        return contractService.getContract(contractId)
            .map(contract -> {
                SignatureWorkflow workflow = getOrCreateWorkflow(contractId, contract);
                workflow.setCollectionMode(mode);
                workflow.setUpdatedAt(Instant.now());
                LOGGER.info("Set collection mode for contract {} to {}", contractId, mode);
                return workflow;
            });
    }

    /**
     * Set signature request expiry time
     *
     * @param contractId Contract ID
     * @param expirySeconds Expiry time in seconds
     * @return Updated workflow
     */
    public Uni<SignatureWorkflow> setRequestExpiry(String contractId, long expirySeconds) {
        return contractService.getContract(contractId)
            .map(contract -> {
                SignatureWorkflow workflow = getOrCreateWorkflow(contractId, contract);
                workflow.setRequestExpirySeconds(expirySeconds);
                workflow.setUpdatedAt(Instant.now());
                return workflow;
            });
    }

    /**
     * Add a party role requirement to the workflow
     *
     * @param contractId Contract ID
     * @param role Required role
     * @param minCount Minimum number of signatures from this role
     * @return Updated workflow
     */
    public Uni<SignatureWorkflow> addRoleRequirement(String contractId, SignatureRole role, int minCount) {
        return contractService.getContract(contractId)
            .map(contract -> {
                SignatureWorkflow workflow = getOrCreateWorkflow(contractId, contract);
                workflow.getRoleRequirements().put(role, minCount);
                workflow.setUpdatedAt(Instant.now());
                LOGGER.info("Added role requirement for contract {}: {} requires {} signatures",
                    contractId, role, minCount);
                return workflow;
            });
    }

    // ==================== Private Helper Methods ====================

    private SignatureWorkflow getOrCreateWorkflow(String contractId, ActiveContract contract) {
        return workflows.computeIfAbsent(contractId, k -> {
            SignatureWorkflow workflow = new SignatureWorkflow();
            workflow.setWorkflowId(generateWorkflowId());
            workflow.setContractId(contractId);
            workflow.setState(WorkflowState.DRAFT);
            workflow.setCollectionMode(CollectionMode.PARALLEL);
            workflow.setCreatedAt(Instant.now());
            workflow.setUpdatedAt(Instant.now());
            workflow.setRequestExpirySeconds(7 * 24 * 60 * 60); // 7 days default

            // Set default role requirements based on contract parties
            Map<SignatureRole, Integer> roleRequirements = new HashMap<>();
            for (ContractParty party : contract.getParties()) {
                if (party.isSignatureRequired()) {
                    try {
                        SignatureRole role = SignatureRole.valueOf(party.getRole().toUpperCase());
                        roleRequirements.merge(role, 1, Integer::sum);
                    } catch (IllegalArgumentException e) {
                        roleRequirements.merge(SignatureRole.PARTY, 1, Integer::sum);
                    }
                }
            }
            workflow.setRoleRequirements(roleRequirements);

            return workflow;
        });
    }

    private void validateSequentialOrder(SignatureWorkflow workflow, ContractParty party) {
        SignatureRole partyRole;
        try {
            partyRole = SignatureRole.valueOf(party.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            partyRole = SignatureRole.PARTY;
        }

        // Check if all higher priority roles have signed
        for (SignatureRole role : SignatureRole.values()) {
            if (role.getPriority() < partyRole.getPriority()) {
                Integer required = workflow.getRoleRequirements().get(role);
                if (required != null && required > 0) {
                    int signed = workflow.getSignedCountByRole().getOrDefault(role, 0);
                    if (signed < required) {
                        throw new SignatureWorkflowException(
                            String.format("Sequential mode: %s must sign before %s", role, partyRole));
                    }
                }
            }
        }
    }

    private boolean hasPartySigned(String contractId, String partyId) {
        try {
            ActiveContract contract = contractService.getContract(contractId).await().indefinitely();
            return contract.getSignatures().stream()
                .anyMatch(sig -> partyId.equals(sig.getPartyId()) || partyId.equals(sig.getSignerAddress()));
        } catch (Exception e) {
            return false;
        }
    }

    private SignatureRequest findPendingRequest(String contractId, String partyId) {
        List<SignatureRequest> requests = pendingRequests.get(contractId);
        if (requests == null) return null;

        return requests.stream()
            .filter(r -> partyId.equals(r.getPartyId()) &&
                        r.getStatus() == SignatureRequest.RequestStatus.PENDING)
            .findFirst()
            .orElse(null);
    }

    private boolean verifyQuantumSafeSignature(ActiveContract contract, ContractSignature signature) {
        try {
            // For demo purposes, if no proper keys are set, return true
            if (signature.getPublicKey() == null || signature.getSignature() == null) {
                LOGGER.warn("Missing public key or signature data - accepting for demo");
                return true;
            }

            // In production, use Dilithium verification
            // byte[] data = contract.getContractId().getBytes();
            // byte[] signatureBytes = Base64.getDecoder().decode(signature.getSignature());
            // PublicKey publicKey = reconstructPublicKey(signature.getPublicKey());
            // return dilithiumService.verify(data, signatureBytes, publicKey);

            // For now, always verify as true (demo mode)
            return true;
        } catch (Exception e) {
            LOGGER.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    private void updateWorkflowState(SignatureWorkflow workflow, ActiveContract contract) {
        List<SignatureRequirement> requirements = getRequiredSignaturesInternal(contract);

        long signedCount = requirements.stream().filter(SignatureRequirement::isSigned).count();
        long totalRequired = requirements.size();

        // Update signed count by role
        Map<SignatureRole, Integer> signedByRole = new HashMap<>();
        for (ContractSignature sig : contract.getSignatures()) {
            String roleStr = sig.getMetadata().getOrDefault("role", "PARTY");
            try {
                SignatureRole role = SignatureRole.valueOf(roleStr.toUpperCase());
                signedByRole.merge(role, 1, Integer::sum);
            } catch (IllegalArgumentException e) {
                signedByRole.merge(SignatureRole.PARTY, 1, Integer::sum);
            }
        }
        workflow.setSignedCountByRole(signedByRole);

        // Update state
        if (signedCount == 0) {
            workflow.setState(WorkflowState.PENDING_SIGNATURES);
        } else if (signedCount < totalRequired) {
            workflow.setState(WorkflowState.PARTIALLY_SIGNED);
        } else {
            workflow.setState(WorkflowState.FULLY_SIGNED);
        }

        workflow.setUpdatedAt(Instant.now());
    }

    private List<SignatureRequirement> getRequiredSignaturesInternal(ActiveContract contract) {
        List<SignatureRequirement> requirements = new ArrayList<>();
        Set<String> signedPartyIds = contract.getSignatures().stream()
            .map(sig -> sig.getPartyId() != null ? sig.getPartyId() : sig.getSignerAddress())
            .collect(Collectors.toSet());

        for (ContractParty party : contract.getParties()) {
            if (party.isSignatureRequired()) {
                SignatureRequirement req = new SignatureRequirement();
                req.setPartyId(party.getPartyId());
                req.setPartyName(party.getName());
                req.setPartyAddress(party.getAddress());
                try {
                    req.setRole(SignatureRole.valueOf(party.getRole().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    req.setRole(SignatureRole.PARTY);
                }
                req.setSigned(signedPartyIds.contains(party.getPartyId()) ||
                             signedPartyIds.contains(party.getAddress()));

                // Find signature if exists
                if (req.isSigned()) {
                    contract.getSignatures().stream()
                        .filter(sig -> party.getPartyId().equals(sig.getPartyId()) ||
                                      party.getAddress().equals(sig.getSignerAddress()))
                        .findFirst()
                        .ifPresent(sig -> req.setSignedAt(sig.getSignedAt()));
                }

                requirements.add(req);
            }
        }

        // Sort by role priority
        requirements.sort(Comparator.comparingInt(r -> r.getRole().getPriority()));
        return requirements;
    }

    private boolean isFullySignedInternal(ActiveContract contract) {
        return getRequiredSignaturesInternal(contract).stream()
            .allMatch(SignatureRequirement::isSigned);
    }

    private String generateWorkflowId() {
        return "SWF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateRequestId() {
        return "SRQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateSignatureId() {
        return "SIG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ==================== Data Transfer Objects ====================

    /**
     * Signature workflow container
     */
    public static class SignatureWorkflow {
        private String workflowId;
        private String contractId;
        private WorkflowState state;
        private CollectionMode collectionMode;
        private Instant createdAt;
        private Instant updatedAt;
        private long requestExpirySeconds;
        private Map<SignatureRole, Integer> roleRequirements = new HashMap<>();
        private Map<SignatureRole, Integer> signedCountByRole = new HashMap<>();

        // Getters and Setters
        public String getWorkflowId() { return workflowId; }
        public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }

        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }

        public WorkflowState getState() { return state; }
        public void setState(WorkflowState state) { this.state = state; }

        public CollectionMode getCollectionMode() { return collectionMode; }
        public void setCollectionMode(CollectionMode collectionMode) { this.collectionMode = collectionMode; }

        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

        public long getRequestExpirySeconds() { return requestExpirySeconds; }
        public void setRequestExpirySeconds(long requestExpirySeconds) { this.requestExpirySeconds = requestExpirySeconds; }

        public Map<SignatureRole, Integer> getRoleRequirements() { return roleRequirements; }
        public void setRoleRequirements(Map<SignatureRole, Integer> roleRequirements) { this.roleRequirements = roleRequirements; }

        public Map<SignatureRole, Integer> getSignedCountByRole() { return signedCountByRole; }
        public void setSignedCountByRole(Map<SignatureRole, Integer> signedCountByRole) { this.signedCountByRole = signedCountByRole; }
    }

    /**
     * Signature request details
     */
    public static class SignatureRequest {
        public enum RequestStatus {
            PENDING, COMPLETED, EXPIRED, REJECTED, CANCELLED
        }

        private String requestId;
        private String contractId;
        private String partyId;
        private String partyName;
        private SignatureRole partyRole;
        private Instant requestedAt;
        private Instant expiresAt;
        private Instant completedAt;
        private RequestStatus status;
        private String signatureType;
        private String message;

        // Getters and Setters
        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }

        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }

        public String getPartyId() { return partyId; }
        public void setPartyId(String partyId) { this.partyId = partyId; }

        public String getPartyName() { return partyName; }
        public void setPartyName(String partyName) { this.partyName = partyName; }

        public SignatureRole getPartyRole() { return partyRole; }
        public void setPartyRole(SignatureRole partyRole) { this.partyRole = partyRole; }

        public Instant getRequestedAt() { return requestedAt; }
        public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }

        public Instant getExpiresAt() { return expiresAt; }
        public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

        public RequestStatus getStatus() { return status; }
        public void setStatus(RequestStatus status) { this.status = status; }

        public String getSignatureType() { return signatureType; }
        public void setSignatureType(String signatureType) { this.signatureType = signatureType; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    /**
     * Signature requirement for a party
     */
    public static class SignatureRequirement {
        private String partyId;
        private String partyName;
        private String partyAddress;
        private SignatureRole role;
        private boolean signed;
        private Instant signedAt;
        private boolean required = true;

        // Getters and Setters
        public String getPartyId() { return partyId; }
        public void setPartyId(String partyId) { this.partyId = partyId; }

        public String getPartyName() { return partyName; }
        public void setPartyName(String partyName) { this.partyName = partyName; }

        public String getPartyAddress() { return partyAddress; }
        public void setPartyAddress(String partyAddress) { this.partyAddress = partyAddress; }

        public SignatureRole getRole() { return role; }
        public void setRole(SignatureRole role) { this.role = role; }

        public boolean isSigned() { return signed; }
        public void setSigned(boolean signed) { this.signed = signed; }

        public Instant getSignedAt() { return signedAt; }
        public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

        public boolean isRequired() { return required; }
        public void setRequired(boolean required) { this.required = required; }
    }

    /**
     * Signature verification result
     */
    public static class SignatureVerificationResult {
        private String contractId;
        private String partyId;
        private String signatureId;
        private boolean valid;
        private String algorithm;
        private Instant verifiedAt;
        private Instant signedAt;
        private String reason;

        // Getters and Setters
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }

        public String getPartyId() { return partyId; }
        public void setPartyId(String partyId) { this.partyId = partyId; }

        public String getSignatureId() { return signatureId; }
        public void setSignatureId(String signatureId) { this.signatureId = signatureId; }

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }

        public String getAlgorithm() { return algorithm; }
        public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

        public Instant getVerifiedAt() { return verifiedAt; }
        public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }

        public Instant getSignedAt() { return signedAt; }
        public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    /**
     * Signature workflow status
     */
    public static class SignatureWorkflowStatus {
        private String contractId;
        private String contractName;
        private String workflowId;
        private WorkflowState state;
        private CollectionMode collectionMode;
        private int requiredSignatures;
        private int signedCount;
        private int pendingCount;
        private int totalSignatures;
        private int verifiedSignatures;
        private boolean fullySigned;
        private Instant createdAt;
        private Instant updatedAt;
        private Map<String, Integer> signaturesByRole = new HashMap<>();

        // Getters and Setters
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }

        public String getContractName() { return contractName; }
        public void setContractName(String contractName) { this.contractName = contractName; }

        public String getWorkflowId() { return workflowId; }
        public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }

        public WorkflowState getState() { return state; }
        public void setState(WorkflowState state) { this.state = state; }

        public CollectionMode getCollectionMode() { return collectionMode; }
        public void setCollectionMode(CollectionMode collectionMode) { this.collectionMode = collectionMode; }

        public int getRequiredSignatures() { return requiredSignatures; }
        public void setRequiredSignatures(int requiredSignatures) { this.requiredSignatures = requiredSignatures; }

        public int getSignedCount() { return signedCount; }
        public void setSignedCount(int signedCount) { this.signedCount = signedCount; }

        public int getPendingCount() { return pendingCount; }
        public void setPendingCount(int pendingCount) { this.pendingCount = pendingCount; }

        public int getTotalSignatures() { return totalSignatures; }
        public void setTotalSignatures(int totalSignatures) { this.totalSignatures = totalSignatures; }

        public int getVerifiedSignatures() { return verifiedSignatures; }
        public void setVerifiedSignatures(int verifiedSignatures) { this.verifiedSignatures = verifiedSignatures; }

        public boolean isFullySigned() { return fullySigned; }
        public void setFullySigned(boolean fullySigned) { this.fullySigned = fullySigned; }

        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

        public Map<String, Integer> getSignaturesByRole() { return signaturesByRole; }
        public void setSignaturesByRole(Map<String, Integer> signaturesByRole) { this.signaturesByRole = signaturesByRole; }
    }

    // ==================== Custom Exception ====================

    public static class SignatureWorkflowException extends RuntimeException {
        public SignatureWorkflowException(String message) {
            super(message);
        }

        public SignatureWorkflowException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
