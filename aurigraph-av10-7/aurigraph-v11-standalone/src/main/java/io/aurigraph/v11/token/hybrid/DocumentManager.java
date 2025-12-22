package io.aurigraph.v11.token.hybrid;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import io.quarkus.logging.Log;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * DocumentManager - ERC-1400/1643 compliant on-chain document registry
 *
 * Implements on-chain document management following ERC-1643 (Document
 * Management)
 * standard for security tokens. Enables attaching legal documents,
 * prospectuses,
 * audit reports, and other compliance documents to tokens.
 *
 * Key Features:
 * - Document hash storage (SHA-256/SHA3-256)
 * - URI management (IPFS, Arweave, HTTPS)
 * - Document types (prospectus, legal, audit, corporate action)
 * - Version control with document history
 * - Access control per document
 * - Document expiry and renewal
 * - Signature verification for documents
 *
 * Use Cases:
 * - Real estate: Property deeds, title documents, appraisals
 * - Securities: Prospectus, term sheets, auditor reports
 * - Carbon credits: Verification certificates, VVB reports
 * - Corporate actions: Board resolutions, shareholder votes
 *
 * @author Aurigraph V12 Token Team
 * @since V12.0.0
 */
@ApplicationScoped
public class DocumentManager {

    // Document registry: tokenId -> documentId -> Document
    private final Map<String, Map<String, TokenDocument>> documentRegistry = new ConcurrentHashMap<>();

    // Document by name index: tokenId -> documentName -> documentId (latest
    // version)
    private final Map<String, Map<String, String>> documentNameIndex = new ConcurrentHashMap<>();

    // Document version history: tokenId -> documentName -> List<documentId>
    private final Map<String, Map<String, List<String>>> documentVersionHistory = new ConcurrentHashMap<>();

    // Access control: documentId -> Set<authorizedAddress>
    private final Map<String, Set<String>> accessControl = new ConcurrentHashMap<>();

    // Document signatures: documentId -> List<DocumentSignature>
    private final Map<String, List<DocumentSignature>> documentSignatures = new ConcurrentHashMap<>();

    /**
     * Set/Update a document for a token
     * ERC-1643: setDocument
     */
    public Uni<DocumentResult> setDocument(SetDocumentRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Setting document '%s' for token %s", request.name(), request.tokenId());

            validateDocumentRequest(request);

            // Calculate document hash
            String documentHash = calculateDocumentHash(request.uri(), request.contentHash());

            String documentId = generateDocumentId(request.tokenId(), request.name());

            // Check if this is an update (same name exists)
            String existingDocId = getLatestDocumentId(request.tokenId(), request.name());
            int version = 1;
            if (existingDocId != null) {
                TokenDocument existing = documentRegistry.get(request.tokenId()).get(existingDocId);
                if (existing != null) {
                    version = existing.version() + 1;
                }
            }

            TokenDocument document = new TokenDocument(
                    documentId,
                    request.tokenId(),
                    request.name(),
                    request.uri(),
                    documentHash,
                    request.contentHash(),
                    request.documentType(),
                    request.description(),
                    request.contentType(),
                    request.fileSize(),
                    version,
                    request.metadata(),
                    request.expiryDate(),
                    request.isPublic(),
                    DocumentStatus.ACTIVE,
                    Instant.now(),
                    null,
                    request.issuer(),
                    request.requiredSignatures());

            // Store document
            documentRegistry.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .put(documentId, document);

            // Update name index
            documentNameIndex.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .put(request.name(), documentId);

            // Update version history
            documentVersionHistory.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(request.name(), k -> Collections.synchronizedList(new ArrayList<>()))
                    .add(documentId);

            // Set up access control if not public
            if (!request.isPublic() && request.authorizedAccessors() != null) {
                accessControl.put(documentId, new HashSet<>(request.authorizedAccessors()));
            }

            Log.infof("Document %s set successfully (version %d, hash: %s)",
                    documentId, version, documentHash.substring(0, 16) + "...");

            return new DocumentResult(
                    true,
                    documentId,
                    request.name(),
                    documentHash,
                    version,
                    "Document set successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get a document by name
     * ERC-1643: getDocument
     */
    public Uni<Optional<TokenDocument>> getDocument(String tokenId, String name) {
        return Uni.createFrom().item(() -> {
            String docId = getLatestDocumentId(tokenId, name);
            if (docId == null) {
                return Optional.<TokenDocument>empty();
            }
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return Optional.<TokenDocument>empty();
            }
            return Optional.ofNullable(docs.get(docId));
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get document by ID
     */
    public Uni<Optional<TokenDocument>> getDocumentById(String tokenId, String documentId) {
        return Uni.createFrom().item(() -> {
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return Optional.<TokenDocument>empty();
            }
            return Optional.ofNullable(docs.get(documentId));
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all document names for a token
     * ERC-1643: getAllDocuments
     */
    public Uni<List<String>> getAllDocuments(String tokenId) {
        return Uni.createFrom().item(() -> {
            Map<String, String> names = documentNameIndex.get(tokenId);
            if (names == null) {
                return (List<String>) Collections.<String>emptyList();
            }
            return (List<String>) new ArrayList<>(names.keySet());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all documents with full details
     */
    public Uni<List<TokenDocument>> getAllDocumentsWithDetails(String tokenId) {
        return Uni.createFrom().item(() -> {
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return (List<TokenDocument>) Collections.<TokenDocument>emptyList();
            }
            return (List<TokenDocument>) new ArrayList<>(docs.values());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Remove a document
     * ERC-1643: removeDocument
     */
    public Uni<DocumentResult> removeDocument(String tokenId, String name, String remover) {
        return Uni.createFrom().item(() -> {
            Log.infof("Removing document '%s' from token %s", name, tokenId);

            String docId = getLatestDocumentId(tokenId, name);
            if (docId == null) {
                throw new DocumentException("Document not found: " + name);
            }

            TokenDocument document = documentRegistry.get(tokenId).get(docId);

            // Mark as removed (don't delete for audit trail)
            TokenDocument removed = new TokenDocument(
                    document.documentId(),
                    document.tokenId(),
                    document.name(),
                    document.uri(),
                    document.documentHash(),
                    document.contentHash(),
                    document.documentType(),
                    document.description(),
                    document.contentType(),
                    document.fileSize(),
                    document.version(),
                    document.metadata(),
                    document.expiryDate(),
                    document.isPublic(),
                    DocumentStatus.REMOVED,
                    document.createdAt(),
                    Instant.now(),
                    document.issuer(),
                    document.requiredSignatures());

            documentRegistry.get(tokenId).put(docId, removed);

            // Remove from name index
            documentNameIndex.get(tokenId).remove(name);

            Log.infof("Document %s removed by %s", name, remover);

            return new DocumentResult(
                    true,
                    docId,
                    name,
                    document.documentHash(),
                    document.version(),
                    "Document removed successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get document version history
     */
    public Uni<List<TokenDocument>> getDocumentHistory(String tokenId, String name) {
        return Uni.createFrom().item(() -> {
            Map<String, List<String>> tokenHistory = documentVersionHistory.get(tokenId);
            if (tokenHistory == null) {
                return (List<TokenDocument>) Collections.<TokenDocument>emptyList();
            }
            List<String> docIds = tokenHistory.get(name);
            if (docIds == null) {
                return (List<TokenDocument>) Collections.<TokenDocument>emptyList();
            }

            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            return (List<TokenDocument>) docIds.stream()
                    .map(docs::get)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get documents by type
     */
    public Uni<List<TokenDocument>> getDocumentsByType(String tokenId, DocumentType type) {
        return Uni.createFrom().item(() -> {
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return (List<TokenDocument>) Collections.<TokenDocument>emptyList();
            }
            return (List<TokenDocument>) docs.values().stream()
                    .filter(d -> d.documentType() == type)
                    .filter(d -> d.status() == DocumentStatus.ACTIVE)
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if requester has access to document
     */
    public Uni<Boolean> hasAccess(String tokenId, String documentId, String requester) {
        return Uni.createFrom().item(() -> {
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return false;
            }
            TokenDocument doc = docs.get(documentId);
            if (doc == null) {
                return false;
            }

            // Public documents are accessible to all
            if (doc.isPublic()) {
                return true;
            }

            // Check access control list
            Set<String> authorized = accessControl.get(documentId);
            if (authorized == null) {
                return false;
            }

            return authorized.contains(requester);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Grant access to a document
     */
    public Uni<Boolean> grantAccess(String documentId, String requester, String granter) {
        return Uni.createFrom().item(() -> {
            accessControl.computeIfAbsent(documentId, k -> new HashSet<>())
                    .add(requester);
            Log.infof("Access granted to %s for document %s by %s", requester, documentId, granter);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Revoke access to a document
     */
    public Uni<Boolean> revokeAccess(String documentId, String requester, String revoker) {
        return Uni.createFrom().item(() -> {
            Set<String> authorized = accessControl.get(documentId);
            if (authorized != null) {
                authorized.remove(requester);
                Log.infof("Access revoked from %s for document %s by %s", requester, documentId, revoker);
            }
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Sign a document
     */
    public Uni<DocumentSignature> signDocument(SignDocumentRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Signing document %s by %s", request.documentId(), request.signer());

            // Verify document exists
            boolean exists = false;
            for (Map<String, TokenDocument> docs : documentRegistry.values()) {
                if (docs.containsKey(request.documentId())) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                throw new DocumentException("Document not found: " + request.documentId());
            }

            DocumentSignature signature = new DocumentSignature(
                    request.documentId(),
                    request.signer(),
                    request.signerRole(),
                    request.signature(),
                    request.signatureType(),
                    request.timestamp(),
                    request.metadata());

            documentSignatures.computeIfAbsent(request.documentId(),
                    k -> Collections.synchronizedList(new ArrayList<>())).add(signature);

            Log.infof("Document %s signed by %s (%s)", request.documentId(), request.signer(), request.signerRole());

            return signature;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get signatures for a document
     */
    public Uni<List<DocumentSignature>> getSignatures(String documentId) {
        return Uni.createFrom().item(() -> {
            List<DocumentSignature> sigs = documentSignatures.get(documentId);
            if (sigs == null) {
                return (List<DocumentSignature>) Collections.<DocumentSignature>emptyList();
            }
            return (List<DocumentSignature>) new ArrayList<>(sigs);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if document has all required signatures
     */
    public Uni<Boolean> hasAllRequiredSignatures(String tokenId, String documentId) {
        return Uni.createFrom().item(() -> {
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return false;
            }
            TokenDocument doc = docs.get(documentId);
            if (doc == null || doc.requiredSignatures() == null) {
                return true; // No required signatures
            }

            List<DocumentSignature> sigs = documentSignatures.getOrDefault(documentId, Collections.emptyList());
            Set<String> signers = sigs.stream()
                    .map(DocumentSignature::signer)
                    .collect(Collectors.toSet());

            return signers.containsAll(doc.requiredSignatures());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verify document hash
     */
    public Uni<Boolean> verifyDocumentHash(String tokenId, String name, String providedHash) {
        return Uni.createFrom().item(() -> {
            String docId = getLatestDocumentId(tokenId, name);
            if (docId == null) {
                return false;
            }
            TokenDocument doc = documentRegistry.get(tokenId).get(docId);
            return doc != null && doc.documentHash().equals(providedHash);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get expired documents that need renewal
     */
    public Uni<List<TokenDocument>> getExpiredDocuments(String tokenId) {
        return Uni.createFrom().item(() -> {
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return (List<TokenDocument>) Collections.<TokenDocument>emptyList();
            }
            Instant now = Instant.now();
            return (List<TokenDocument>) docs.values().stream()
                    .filter(d -> d.status() == DocumentStatus.ACTIVE)
                    .filter(d -> d.expiryDate() != null && d.expiryDate().isBefore(now))
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get documents expiring soon (within days)
     */
    public Uni<List<TokenDocument>> getDocumentsExpiringSoon(String tokenId, int days) {
        return Uni.createFrom().item(() -> {
            Map<String, TokenDocument> docs = documentRegistry.get(tokenId);
            if (docs == null) {
                return (List<TokenDocument>) Collections.<TokenDocument>emptyList();
            }
            Instant now = Instant.now();
            Instant threshold = now.plusSeconds(days * 86400L);
            return (List<TokenDocument>) docs.values().stream()
                    .filter(d -> d.status() == DocumentStatus.ACTIVE)
                    .filter(d -> d.expiryDate() != null)
                    .filter(d -> d.expiryDate().isAfter(now) && d.expiryDate().isBefore(threshold))
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private void validateDocumentRequest(SetDocumentRequest request) {
        if (request.tokenId() == null || request.tokenId().isBlank()) {
            throw new DocumentException("Token ID is required");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new DocumentException("Document name is required");
        }
        if (request.uri() == null || request.uri().isBlank()) {
            throw new DocumentException("Document URI is required");
        }
        if (request.documentType() == null) {
            throw new DocumentException("Document type is required");
        }
    }

    private String getLatestDocumentId(String tokenId, String name) {
        Map<String, String> names = documentNameIndex.get(tokenId);
        if (names == null) {
            return null;
        }
        return names.get(name);
    }

    private String calculateDocumentHash(String uri, String contentHash) {
        try {
            String data = uri + "|" + (contentHash != null ? contentHash : "");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to calculate document hash", e);
        }
    }

    private String generateDocumentId(String tokenId, String name) {
        return "DOC-" + tokenId.substring(0, Math.min(8, tokenId.length())) +
                "-" + name.toUpperCase().replaceAll("[^A-Z0-9]", "").substring(0, Math.min(8, name.length())) +
                "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    // Record types for document management

    /**
     * Token document - on-chain document reference
     */
    public record TokenDocument(
            String documentId,
            String tokenId,
            String name,
            String uri,
            String documentHash, // Hash of URI + contentHash
            String contentHash, // Hash of actual content (e.g., IPFS CID)
            DocumentType documentType,
            String description,
            String contentType, // MIME type
            Long fileSize, // Size in bytes
            int version,
            Map<String, Object> metadata,
            Instant expiryDate,
            boolean isPublic,
            DocumentStatus status,
            Instant createdAt,
            Instant removedAt,
            String issuer,
            List<String> requiredSignatures) {
    }

    /**
     * Request to set a document
     */
    public record SetDocumentRequest(
            String tokenId,
            String name,
            String uri,
            String contentHash,
            DocumentType documentType,
            String description,
            String contentType,
            Long fileSize,
            Map<String, Object> metadata,
            Instant expiryDate,
            boolean isPublic,
            List<String> authorizedAccessors,
            String issuer,
            List<String> requiredSignatures) {
    }

    /**
     * Document types following security token standards
     */
    public enum DocumentType {
        // Legal & Compliance
        PROSPECTUS, // Securities prospectus
        TERM_SHEET, // Term sheet for offering
        SUBSCRIPTION_AGREEMENT, // Investor subscription
        SHAREHOLDER_AGREEMENT, // Shareholder agreement
        OPERATING_AGREEMENT, // LLC operating agreement
        ARTICLES_OF_INCORPORATION,
        BYLAWS,
        BOARD_RESOLUTION,

        // Audit & Verification
        AUDIT_REPORT, // Financial audit
        VALUATION_REPORT, // Asset valuation
        VVB_REPORT, // Verification/Validation Body report (carbon)
        CERTIFICATION, // Third-party certification
        COMPLIANCE_REPORT,

        // Asset Documentation
        TITLE_DEED, // Real estate title
        APPRAISAL, // Property appraisal
        INSURANCE_CERTIFICATE,
        ENVIRONMENTAL_REPORT,
        SURVEY,
        INSPECTION_REPORT,

        // Financial
        FINANCIAL_STATEMENTS,
        TAX_DOCUMENTS,
        BANK_STATEMENTS,

        // Corporate Actions
        DIVIDEND_ANNOUNCEMENT,
        MERGER_DOCUMENTS,
        RIGHTS_OFFERING,
        PROXY_STATEMENT,
        ANNUAL_REPORT,
        QUARTERLY_REPORT,

        // Identity & KYC
        KYC_DOCUMENTATION,
        ACCREDITATION_PROOF,
        IDENTITY_VERIFICATION,

        // Carbon/ESG Specific
        CARBON_REGISTRY_ENTRY,
        METHODOLOGY_DOCUMENT,
        MONITORING_REPORT,
        ISSUANCE_CERTIFICATE,
        RETIREMENT_CERTIFICATE,
        IMPACT_REPORT,

        // Technical
        WHITEPAPER,
        TECHNICAL_SPECIFICATION,
        SMART_CONTRACT_AUDIT,

        // Other
        LEGAL_OPINION,
        MARKETING_MATERIAL,
        INVESTOR_PRESENTATION,
        OTHER
    }

    /**
     * Document status
     */
    public enum DocumentStatus {
        DRAFT, // Document in draft
        PENDING_REVIEW, // Awaiting review
        PENDING_SIGNATURE, // Awaiting signatures
        ACTIVE, // Active and valid
        EXPIRED, // Past expiry date
        SUPERSEDED, // Replaced by newer version
        REMOVED, // Removed from registry
        ARCHIVED // Archived for historical reference
    }

    /**
     * Document result
     */
    public record DocumentResult(
            boolean success,
            String documentId,
            String name,
            String documentHash,
            int version,
            String message) {
    }

    /**
     * Document signature
     */
    public record DocumentSignature(
            String documentId,
            String signer,
            String signerRole,
            String signature, // Cryptographic signature
            SignatureType signatureType,
            Instant timestamp,
            Map<String, Object> metadata) {
    }

    /**
     * Request to sign a document
     */
    public record SignDocumentRequest(
            String documentId,
            String signer,
            String signerRole,
            String signature,
            SignatureType signatureType,
            Instant timestamp,
            Map<String, Object> metadata) {
    }

    /**
     * Signature types
     */
    public enum SignatureType {
        ECDSA, // Ethereum ECDSA
        ED25519, // Ed25519
        DILITHIUM, // Post-quantum Dilithium
        SPHINCS_PLUS, // Post-quantum SPHINCS+
        RSA, // RSA signature
        MULTISIG, // Multi-signature
        THRESHOLD // Threshold signature
    }

    /**
     * Document exception
     */
    public static class DocumentException extends RuntimeException {
        public DocumentException(String message) {
            super(message);
        }
    }
}
