package io.aurigraph.v11.token.composite;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Composite Token Entity - Represents a bundle of primary and secondary tokens
 *
 * CompositeTokens create a unified digital twin representation:
 * - Contains exactly one Primary Token as the anchor
 * - Contains zero or more Secondary Tokens (income streams, collateral, royalties)
 * - Cryptographically bound via Merkle tree structure
 * - Subject to multi-verifier (VVB) consensus approval
 * - Quantum-resistant signatures via CRYSTALS-Dilithium
 *
 * Lifecycle: CREATED -> PENDING_VERIFICATION -> VERIFIED -> BOUND -> RETIRED
 *
 * @author Composite Token System - Sprint 3-4
 * @version 1.0
 * @since Sprint 3 (Week 6)
 */
@Entity
@Table(name = "composite_tokens", indexes = {
    @Index(name = "idx_composite_token_id", columnList = "composite_token_id", unique = true),
    @Index(name = "idx_composite_primary", columnList = "primary_token_id"),
    @Index(name = "idx_composite_status", columnList = "status"),
    @Index(name = "idx_composite_merkle_root", columnList = "merkle_root"),
    @Index(name = "idx_composite_owner", columnList = "owner")
})
public class CompositeToken extends PanacheEntity {

    /**
     * Unique composite token identifier format: CT-{uuid}
     * Example: CT-a1b2c3d4-e5f6-7g8h-i9j0
     */
    @Column(name = "composite_token_id", nullable = false, unique = true, length = 64)
    @NotBlank(message = "Composite token ID cannot be blank")
    public String compositeTokenId;

    /**
     * Reference to the anchor primary token
     */
    @Column(name = "primary_token_id", nullable = false, length = 64)
    @NotBlank(message = "Primary token ID is required")
    public String primaryTokenId;

    /**
     * Comma-separated list of secondary token IDs included in this composite
     */
    @Column(name = "secondary_token_ids", columnDefinition = "TEXT")
    public String secondaryTokenIds;

    /**
     * Current owner of the composite token
     */
    @Column(name = "owner", nullable = false, length = 256)
    @NotBlank(message = "Owner address is required")
    public String owner;

    /**
     * Current status of the composite token
     */
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    public CompositeTokenStatus status = CompositeTokenStatus.CREATED;

    /**
     * Merkle root hash of the composite token bundle
     * Computed from primary + secondary tokens using SHA-256
     */
    @Column(name = "merkle_root", length = 256)
    public String merkleRoot;

    /**
     * Digital twin hash - deterministic SHA-256 of all token data
     */
    @Column(name = "digital_twin_hash", length = 256)
    public String digitalTwinHash;

    /**
     * Quantum signature from VVB consensus (CRYSTALS-Dilithium)
     */
    @Column(name = "vvb_signature", columnDefinition = "TEXT")
    public String vvbSignature;

    /**
     * Number of VVB approvals received
     */
    @Column(name = "vvb_approval_count")
    public Integer vvbApprovalCount = 0;

    /**
     * Required VVB approvals for consensus (typically 3-of-N)
     */
    @Column(name = "vvb_threshold")
    public Integer vvbThreshold = 3;

    /**
     * JSON array of VVB verifier IDs who approved
     */
    @Column(name = "vvb_verifier_ids", columnDefinition = "TEXT")
    public String vvbVerifierIds;

    /**
     * Total aggregate value of all tokens in the composite
     */
    @Column(name = "total_value")
    public BigDecimal totalValue = BigDecimal.ZERO;

    /**
     * Bound contract ID (if BOUND status)
     */
    @Column(name = "bound_contract_id", length = 64)
    public String boundContractId;

    /**
     * Binding proof hash for contract binding verification
     */
    @Column(name = "binding_proof_hash", length = 256)
    public String bindingProofHash;

    /**
     * Creation timestamp
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    /**
     * Last update timestamp
     */
    @Column(name = "updated_at")
    public Instant updatedAt;

    /**
     * Verification timestamp
     */
    @Column(name = "verified_at")
    public Instant verifiedAt;

    /**
     * Binding timestamp
     */
    @Column(name = "bound_at")
    public Instant boundAt;

    /**
     * Extended metadata (JSON)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    /**
     * Version for optimistic locking
     */
    @Version
    public Long version = 0L;

    // =============== CONSTRUCTORS ===============

    public CompositeToken() {
        this.createdAt = Instant.now();
        this.status = CompositeTokenStatus.CREATED;
    }

    public CompositeToken(String compositeTokenId, String primaryTokenId, String owner) {
        this();
        this.compositeTokenId = compositeTokenId;
        this.primaryTokenId = primaryTokenId;
        this.owner = owner;
    }

    // =============== LIFECYCLE METHODS ===============

    /**
     * Submit for VVB verification
     */
    public boolean submitForVerification() {
        if (status != CompositeTokenStatus.CREATED) {
            throw new IllegalStateException("Cannot submit for verification with status: " + status);
        }
        if (merkleRoot == null || merkleRoot.isEmpty()) {
            throw new IllegalStateException("Merkle root must be computed before verification");
        }
        this.status = CompositeTokenStatus.PENDING_VERIFICATION;
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Record VVB approval
     */
    public boolean recordVvbApproval(String verifierId) {
        if (status != CompositeTokenStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException("Cannot approve with status: " + status);
        }

        // Add verifier ID to list
        if (vvbVerifierIds == null || vvbVerifierIds.isEmpty()) {
            vvbVerifierIds = verifierId;
        } else if (!vvbVerifierIds.contains(verifierId)) {
            vvbVerifierIds = vvbVerifierIds + "," + verifierId;
        } else {
            return false; // Already approved by this verifier
        }

        vvbApprovalCount = (vvbApprovalCount == null ? 0 : vvbApprovalCount) + 1;
        this.updatedAt = Instant.now();

        // Check if threshold met
        if (vvbApprovalCount >= vvbThreshold) {
            this.status = CompositeTokenStatus.VERIFIED;
            this.verifiedAt = Instant.now();
        }

        return true;
    }

    /**
     * Bind to a contract
     */
    public boolean bindToContract(String contractId, String bindingProof) {
        if (status != CompositeTokenStatus.VERIFIED) {
            throw new IllegalStateException("Cannot bind unverified composite token");
        }
        this.boundContractId = contractId;
        this.bindingProofHash = bindingProof;
        this.status = CompositeTokenStatus.BOUND;
        this.boundAt = Instant.now();
        this.updatedAt = Instant.now();
        return true;
    }

    /**
     * Retire the composite token
     */
    public boolean retire() {
        if (status == CompositeTokenStatus.RETIRED) {
            throw new IllegalStateException("Token already retired");
        }
        this.status = CompositeTokenStatus.RETIRED;
        this.updatedAt = Instant.now();
        return true;
    }

    // =============== HELPER METHODS ===============

    /**
     * Get list of secondary token IDs
     */
    public List<String> getSecondaryTokenIdList() {
        if (secondaryTokenIds == null || secondaryTokenIds.isEmpty()) {
            return new ArrayList<>();
        }
        return List.of(secondaryTokenIds.split(","));
    }

    /**
     * Set list of secondary token IDs
     */
    public void setSecondaryTokenIdList(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            this.secondaryTokenIds = null;
        } else {
            this.secondaryTokenIds = String.join(",", ids);
        }
    }

    /**
     * Add a secondary token ID
     */
    public void addSecondaryTokenId(String tokenId) {
        if (secondaryTokenIds == null || secondaryTokenIds.isEmpty()) {
            secondaryTokenIds = tokenId;
        } else {
            secondaryTokenIds = secondaryTokenIds + "," + tokenId;
        }
    }

    /**
     * Get list of VVB verifier IDs
     */
    public List<String> getVvbVerifierIdList() {
        if (vvbVerifierIds == null || vvbVerifierIds.isEmpty()) {
            return new ArrayList<>();
        }
        return List.of(vvbVerifierIds.split(","));
    }

    /**
     * Check if consensus threshold is met
     */
    public boolean isConsensusReached() {
        return vvbApprovalCount != null && vvbApprovalCount >= vvbThreshold;
    }

    // =============== QUERY METHODS ===============

    public static CompositeToken findByCompositeTokenId(String compositeTokenId) {
        return find("composite_token_id", compositeTokenId).firstResult();
    }

    public static List<CompositeToken> findByPrimaryTokenId(String primaryTokenId) {
        return find("primary_token_id", primaryTokenId).list();
    }

    public static List<CompositeToken> findByOwner(String owner) {
        return find("owner", owner).list();
    }

    public static List<CompositeToken> findByStatus(CompositeTokenStatus status) {
        return find("status", status).list();
    }

    public static List<CompositeToken> findByBoundContractId(String contractId) {
        return find("bound_contract_id", contractId).list();
    }

    public static List<CompositeToken> findPendingVerification() {
        return find("status", CompositeTokenStatus.PENDING_VERIFICATION).list();
    }

    public static List<CompositeToken> findVerified() {
        return find("status", CompositeTokenStatus.VERIFIED).list();
    }

    // =============== ENUMS ===============

    /**
     * Composite token lifecycle status
     */
    public enum CompositeTokenStatus {
        CREATED,              // Initial state - tokens bundled but not verified
        PENDING_VERIFICATION, // Submitted to VVB consensus for verification
        VERIFIED,             // VVB consensus achieved, ready for binding
        BOUND,                // Bound to a contract
        RETIRED               // Removed from circulation
    }

    @Override
    public String toString() {
        return "CompositeToken{" +
                "compositeTokenId='" + compositeTokenId + '\'' +
                ", primaryTokenId='" + primaryTokenId + '\'' +
                ", status=" + status +
                ", vvbApprovalCount=" + vvbApprovalCount +
                ", totalValue=" + totalValue +
                '}';
    }
}
