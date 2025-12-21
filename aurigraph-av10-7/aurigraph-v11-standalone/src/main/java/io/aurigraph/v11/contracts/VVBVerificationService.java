package io.aurigraph.v11.contracts;

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
 * VVB (Validation and Verification Body) Verification Service
 *
 * Manages the VVB verification workflow for ActiveContracts:
 * - Submit contracts for VVB review
 * - Track review status
 * - Handle VVB approval/rejection
 * - Manage attestations
 *
 * State flow: FULLY_SIGNED -> VVB_REVIEW -> VVB_APPROVED/VVB_REJECTED -> ACTIVE
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@ApplicationScoped
public class VVBVerificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VVBVerificationService.class);

    @Inject
    ActiveContractService contractService;

    // VVB Review records storage
    private final Map<String, VVBReview> reviews = new ConcurrentHashMap<>();

    // VVB Attestation storage
    private final Map<String, VVBAttestation> attestations = new ConcurrentHashMap<>();

    // Registered VVB entities
    private final Map<String, VVBEntity> registeredVVBs = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong reviewsSubmitted = new AtomicLong(0);
    private final AtomicLong reviewsApproved = new AtomicLong(0);
    private final AtomicLong reviewsRejected = new AtomicLong(0);

    // ============================================
    // VVB REVIEW WORKFLOW
    // ============================================

    /**
     * Submit a fully-signed contract for VVB review
     *
     * @param contractId Contract ID to submit for review
     * @return VVB Review record
     */
    public Uni<VVBReview> submitForReview(String contractId) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("Submitting contract {} for VVB review", contractId);

                // Validate contract is fully signed
                if (!contract.isFullySigned()) {
                    throw new VVBVerificationException("Contract must be fully signed before VVB review");
                }

                // Check if already in review
                if (reviews.containsKey(contractId)) {
                    VVBReview existingReview = reviews.get(contractId);
                    if (existingReview.getStatus() == VVBReviewStatus.PENDING ||
                        existingReview.getStatus() == VVBReviewStatus.IN_REVIEW) {
                        throw new VVBVerificationException("Contract is already under VVB review");
                    }
                }

                // Create VVB review record
                VVBReview review = new VVBReview();
                review.setReviewId(generateReviewId());
                review.setContractId(contractId);
                review.setStatus(VVBReviewStatus.PENDING);
                review.setSubmittedAt(Instant.now());
                review.setSubmittedBy(contract.getOwner());
                review.setContractType(contract.getContractType());
                review.setContractName(contract.getName());

                // Store review
                reviews.put(contractId, review);
                reviewsSubmitted.incrementAndGet();

                // Update contract metadata
                contract.getMetadata().put("vvbReviewId", review.getReviewId());
                contract.getMetadata().put("vvbReviewStatus", "PENDING");
                contract.getMetadata().put("vvbSubmittedAt", Instant.now().toString());
                contract.addAuditEntry("Submitted for VVB review: " + review.getReviewId());

                LOGGER.info("Contract {} submitted for VVB review: {}", contractId, review.getReviewId());
                return review;
            });
    }

    /**
     * Get the VVB review status for a contract
     *
     * @param contractId Contract ID
     * @return VVB Review status
     */
    public Uni<VVBReview> getReviewStatus(String contractId) {
        return Uni.createFrom().item(() -> {
            VVBReview review = reviews.get(contractId);
            if (review == null) {
                throw new VVBReviewNotFoundException("No VVB review found for contract: " + contractId);
            }
            return review;
        });
    }

    /**
     * VVB approves a contract
     *
     * @param contractId Contract ID
     * @param vvbId VVB entity ID
     * @param attestation VVB attestation data
     * @return Updated VVB Review
     */
    public Uni<VVBReview> approve(String contractId, String vvbId, VVBAttestationRequest attestation) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("VVB {} approving contract {}", vvbId, contractId);

                // Get and validate review
                VVBReview review = reviews.get(contractId);
                if (review == null) {
                    throw new VVBReviewNotFoundException("No VVB review found for contract: " + contractId);
                }

                if (review.getStatus() == VVBReviewStatus.APPROVED) {
                    throw new VVBVerificationException("Contract is already VVB approved");
                }

                if (review.getStatus() == VVBReviewStatus.REJECTED) {
                    throw new VVBVerificationException("Cannot approve a rejected contract. Submit for new review.");
                }

                // Validate VVB entity
                VVBEntity vvb = registeredVVBs.get(vvbId);
                if (vvb == null) {
                    // Auto-register VVB for demo purposes
                    vvb = registerVVB(vvbId, "VVB-" + vvbId, VVBType.GENERAL);
                }

                // Update review status
                review.setStatus(VVBReviewStatus.APPROVED);
                review.setReviewedAt(Instant.now());
                review.setReviewedBy(vvbId);
                review.setVvbName(vvb.getName());

                // Create attestation
                VVBAttestation vvbAttestation = new VVBAttestation();
                vvbAttestation.setAttestationId(generateAttestationId());
                vvbAttestation.setContractId(contractId);
                vvbAttestation.setVvbId(vvbId);
                vvbAttestation.setVvbName(vvb.getName());
                vvbAttestation.setIssuedAt(Instant.now());
                vvbAttestation.setValidUntil(Instant.now().plusSeconds(365 * 24 * 60 * 60)); // 1 year
                vvbAttestation.setScope(attestation.getScope());
                vvbAttestation.setFindings(attestation.getFindings());
                vvbAttestation.setRecommendations(attestation.getRecommendations());
                vvbAttestation.setSignature(generateVVBSignature(vvbId, contractId));
                vvbAttestation.setValid(true);

                // Store attestation
                attestations.put(contractId, vvbAttestation);
                review.setAttestationId(vvbAttestation.getAttestationId());

                // Update contract
                contract.getMetadata().put("vvbReviewStatus", "APPROVED");
                contract.getMetadata().put("vvbApprovedAt", Instant.now().toString());
                contract.getMetadata().put("vvbApprovedBy", vvbId);
                contract.getMetadata().put("vvbAttestationId", vvbAttestation.getAttestationId());
                contract.addAuditEntry("VVB approved by " + vvbId + ": " + vvbAttestation.getAttestationId());

                reviewsApproved.incrementAndGet();

                LOGGER.info("Contract {} approved by VVB {}", contractId, vvbId);
                return review;
            });
    }

    /**
     * VVB rejects a contract
     *
     * @param contractId Contract ID
     * @param vvbId VVB entity ID
     * @param reason Rejection reason
     * @return Updated VVB Review
     */
    public Uni<VVBReview> reject(String contractId, String vvbId, String reason) {
        return contractService.getContract(contractId)
            .map(contract -> {
                LOGGER.info("VVB {} rejecting contract {}", vvbId, contractId);

                // Get and validate review
                VVBReview review = reviews.get(contractId);
                if (review == null) {
                    throw new VVBReviewNotFoundException("No VVB review found for contract: " + contractId);
                }

                if (review.getStatus() == VVBReviewStatus.APPROVED) {
                    throw new VVBVerificationException("Cannot reject an approved contract");
                }

                if (review.getStatus() == VVBReviewStatus.REJECTED) {
                    throw new VVBVerificationException("Contract is already rejected");
                }

                // Validate VVB entity
                VVBEntity vvb = registeredVVBs.get(vvbId);
                if (vvb == null) {
                    vvb = registerVVB(vvbId, "VVB-" + vvbId, VVBType.GENERAL);
                }

                // Update review status
                review.setStatus(VVBReviewStatus.REJECTED);
                review.setReviewedAt(Instant.now());
                review.setReviewedBy(vvbId);
                review.setVvbName(vvb.getName());
                review.setRejectionReason(reason);

                // Update contract
                contract.getMetadata().put("vvbReviewStatus", "REJECTED");
                contract.getMetadata().put("vvbRejectedAt", Instant.now().toString());
                contract.getMetadata().put("vvbRejectedBy", vvbId);
                contract.getMetadata().put("vvbRejectionReason", reason);
                contract.addAuditEntry("VVB rejected by " + vvbId + ": " + reason);

                reviewsRejected.incrementAndGet();

                LOGGER.info("Contract {} rejected by VVB {}: {}", contractId, vvbId, reason);
                return review;
            });
    }

    /**
     * Get the VVB attestation for a contract
     *
     * @param contractId Contract ID
     * @return VVB Attestation
     */
    public Uni<VVBAttestation> getAttestation(String contractId) {
        return Uni.createFrom().item(() -> {
            VVBAttestation attestation = attestations.get(contractId);
            if (attestation == null) {
                throw new VVBAttestationNotFoundException("No VVB attestation found for contract: " + contractId);
            }
            return attestation;
        });
    }

    // ============================================
    // VVB ENTITY MANAGEMENT
    // ============================================

    /**
     * Register a new VVB entity
     */
    public VVBEntity registerVVB(String vvbId, String name, VVBType type) {
        VVBEntity vvb = new VVBEntity();
        vvb.setVvbId(vvbId);
        vvb.setName(name);
        vvb.setType(type);
        vvb.setRegisteredAt(Instant.now());
        vvb.setActive(true);

        registeredVVBs.put(vvbId, vvb);
        LOGGER.info("Registered VVB: {} ({})", name, vvbId);
        return vvb;
    }

    /**
     * Get all registered VVBs
     */
    public List<VVBEntity> getRegisteredVVBs() {
        return new ArrayList<>(registeredVVBs.values());
    }

    // ============================================
    // METRICS
    // ============================================

    /**
     * Get VVB verification metrics
     */
    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("reviewsSubmitted", reviewsSubmitted.get());
        metrics.put("reviewsApproved", reviewsApproved.get());
        metrics.put("reviewsRejected", reviewsRejected.get());
        metrics.put("pendingReviews", countPendingReviews());
        metrics.put("totalAttestations", attestations.size());
        metrics.put("registeredVVBs", registeredVVBs.size());
        return metrics;
    }

    private long countPendingReviews() {
        return reviews.values().stream()
            .filter(r -> r.getStatus() == VVBReviewStatus.PENDING || r.getStatus() == VVBReviewStatus.IN_REVIEW)
            .count();
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private String generateReviewId() {
        return "VVB-REV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateAttestationId() {
        return "VVB-ATT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateVVBSignature(String vvbId, String contractId) {
        // Generate mock VVB signature (in production, use proper cryptographic signing)
        return "VVB-SIG-" + Base64.getEncoder().encodeToString(
            (vvbId + ":" + contractId + ":" + Instant.now().toEpochMilli()).getBytes()
        );
    }

    // ============================================
    // DATA CLASSES
    // ============================================

    /**
     * VVB Review Status
     */
    public enum VVBReviewStatus {
        PENDING,
        IN_REVIEW,
        APPROVED,
        REJECTED,
        EXPIRED
    }

    /**
     * VVB Type
     */
    public enum VVBType {
        GENERAL,
        CARBON_CREDIT,
        REAL_ESTATE,
        FINANCIAL,
        ENVIRONMENTAL,
        REGULATORY
    }

    /**
     * VVB Review record
     */
    public static class VVBReview {
        private String reviewId;
        private String contractId;
        private String contractName;
        private String contractType;
        private VVBReviewStatus status;
        private Instant submittedAt;
        private String submittedBy;
        private Instant reviewedAt;
        private String reviewedBy;
        private String vvbName;
        private String rejectionReason;
        private String attestationId;

        // Getters and setters
        public String getReviewId() { return reviewId; }
        public void setReviewId(String reviewId) { this.reviewId = reviewId; }
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getContractName() { return contractName; }
        public void setContractName(String contractName) { this.contractName = contractName; }
        public String getContractType() { return contractType; }
        public void setContractType(String contractType) { this.contractType = contractType; }
        public VVBReviewStatus getStatus() { return status; }
        public void setStatus(VVBReviewStatus status) { this.status = status; }
        public Instant getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
        public String getSubmittedBy() { return submittedBy; }
        public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
        public Instant getReviewedAt() { return reviewedAt; }
        public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
        public String getReviewedBy() { return reviewedBy; }
        public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
        public String getVvbName() { return vvbName; }
        public void setVvbName(String vvbName) { this.vvbName = vvbName; }
        public String getRejectionReason() { return rejectionReason; }
        public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
        public String getAttestationId() { return attestationId; }
        public void setAttestationId(String attestationId) { this.attestationId = attestationId; }
    }

    /**
     * VVB Attestation record
     */
    public static class VVBAttestation {
        private String attestationId;
        private String contractId;
        private String vvbId;
        private String vvbName;
        private Instant issuedAt;
        private Instant validUntil;
        private String scope;
        private String findings;
        private String recommendations;
        private String signature;
        private boolean valid;

        // Getters and setters
        public String getAttestationId() { return attestationId; }
        public void setAttestationId(String attestationId) { this.attestationId = attestationId; }
        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }
        public String getVvbId() { return vvbId; }
        public void setVvbId(String vvbId) { this.vvbId = vvbId; }
        public String getVvbName() { return vvbName; }
        public void setVvbName(String vvbName) { this.vvbName = vvbName; }
        public Instant getIssuedAt() { return issuedAt; }
        public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }
        public Instant getValidUntil() { return validUntil; }
        public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
        public String getFindings() { return findings; }
        public void setFindings(String findings) { this.findings = findings; }
        public String getRecommendations() { return recommendations; }
        public void setRecommendations(String recommendations) { this.recommendations = recommendations; }
        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }
        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
    }

    /**
     * VVB Entity record
     */
    public static class VVBEntity {
        private String vvbId;
        private String name;
        private VVBType type;
        private Instant registeredAt;
        private boolean active;
        private List<String> certifications = new ArrayList<>();
        private Map<String, String> metadata = new HashMap<>();

        // Getters and setters
        public String getVvbId() { return vvbId; }
        public void setVvbId(String vvbId) { this.vvbId = vvbId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public VVBType getType() { return type; }
        public void setType(VVBType type) { this.type = type; }
        public Instant getRegisteredAt() { return registeredAt; }
        public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public List<String> getCertifications() { return certifications; }
        public void setCertifications(List<String> certifications) { this.certifications = certifications; }
        public Map<String, String> getMetadata() { return metadata; }
        public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }
    }

    /**
     * VVB Attestation Request
     */
    public static class VVBAttestationRequest {
        private String scope;
        private String findings;
        private String recommendations;

        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
        public String getFindings() { return findings; }
        public void setFindings(String findings) { this.findings = findings; }
        public String getRecommendations() { return recommendations; }
        public void setRecommendations(String recommendations) { this.recommendations = recommendations; }
    }

    // ============================================
    // EXCEPTIONS
    // ============================================

    public static class VVBVerificationException extends RuntimeException {
        public VVBVerificationException(String message) {
            super(message);
        }
    }

    public static class VVBReviewNotFoundException extends RuntimeException {
        public VVBReviewNotFoundException(String message) {
            super(message);
        }
    }

    public static class VVBAttestationNotFoundException extends RuntimeException {
        public VVBAttestationNotFoundException(String message) {
            super(message);
        }
    }
}
