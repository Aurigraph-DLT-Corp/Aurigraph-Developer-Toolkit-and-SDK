package io.aurigraph.v11.identity.wallet;

import io.aurigraph.v11.identity.did.DIDDocument;
import io.aurigraph.v11.identity.vc.VerifiableCredential;
import io.aurigraph.v11.identity.vc.VerifiablePresentation;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Self-Sovereign Identity (SSI) Wallet Interface
 *
 * Abstract interface for SSI wallets that provides:
 * - DID management (create, store, backup, recover)
 * - Credential storage and management
 * - Presentation creation with selective disclosure
 * - DIDComm messaging support
 * - Mobile wallet SDK hooks
 *
 * Implementations can include:
 * - Mobile wallets (iOS, Android)
 * - Browser extension wallets
 * - Hardware security module (HSM) wallets
 * - Enterprise custody wallets
 *
 * @version 12.0.0
 * @author Compliance & Audit Agent (CAA)
 */
public interface SSIWalletInterface {

    // ==================== Wallet Lifecycle ====================

    /**
     * Initialize the wallet
     *
     * @param config Wallet configuration
     * @return Initialization result
     */
    CompletableFuture<WalletInitResult> initialize(WalletConfig config);

    /**
     * Lock the wallet (secure sensitive data)
     *
     * @return true if successfully locked
     */
    CompletableFuture<Boolean> lock();

    /**
     * Unlock the wallet
     *
     * @param credentials Unlock credentials (PIN, password, biometric)
     * @return true if successfully unlocked
     */
    CompletableFuture<Boolean> unlock(UnlockCredentials credentials);

    /**
     * Check if wallet is locked
     *
     * @return true if wallet is locked
     */
    boolean isLocked();

    /**
     * Get wallet status
     *
     * @return Current wallet status
     */
    WalletStatus getStatus();

    // ==================== DID Management ====================

    /**
     * Create a new DID
     *
     * @param options DID creation options
     * @return Created DID result
     */
    CompletableFuture<DIDCreationResult> createDID(DIDCreationOptions options);

    /**
     * Import an existing DID
     *
     * @param did The DID to import
     * @param document The DID Document
     * @param privateKeys Private keys associated with the DID
     * @return Import result
     */
    CompletableFuture<DIDImportResult> importDID(String did, DIDDocument document,
                                                   Map<String, PrivateKey> privateKeys);

    /**
     * Get all DIDs in the wallet
     *
     * @return List of DIDs
     */
    CompletableFuture<List<String>> listDIDs();

    /**
     * Get DID Document for a DID
     *
     * @param did The DID to retrieve
     * @return DID Document
     */
    CompletableFuture<Optional<DIDDocument>> getDIDDocument(String did);

    /**
     * Get the primary (default) DID
     *
     * @return Primary DID
     */
    CompletableFuture<Optional<String>> getPrimaryDID();

    /**
     * Set the primary DID
     *
     * @param did DID to set as primary
     * @return true if successful
     */
    CompletableFuture<Boolean> setPrimaryDID(String did);

    /**
     * Delete a DID from the wallet
     *
     * @param did DID to delete
     * @return true if successful
     */
    CompletableFuture<Boolean> deleteDID(String did);

    // ==================== Key Management ====================

    /**
     * Get private key for a verification method
     *
     * @param did The DID
     * @param verificationMethodId The verification method ID
     * @return Private key if found
     */
    CompletableFuture<Optional<PrivateKey>> getPrivateKey(String did, String verificationMethodId);

    /**
     * Get public key for a verification method
     *
     * @param did The DID
     * @param verificationMethodId The verification method ID
     * @return Public key if found
     */
    CompletableFuture<Optional<PublicKey>> getPublicKey(String did, String verificationMethodId);

    /**
     * Add a new key pair to a DID
     *
     * @param did The DID
     * @param keyId Key identifier
     * @param keyPair Key pair to add
     * @return true if successful
     */
    CompletableFuture<Boolean> addKey(String did, String keyId, KeyPair keyPair);

    /**
     * Rotate keys for a DID
     *
     * @param did The DID
     * @param keyId Key to rotate
     * @return New key pair
     */
    CompletableFuture<KeyRotationResult> rotateKey(String did, String keyId);

    // ==================== Credential Management ====================

    /**
     * Store a credential in the wallet
     *
     * @param credential The credential to store
     * @return Storage result
     */
    CompletableFuture<CredentialStorageResult> storeCredential(VerifiableCredential credential);

    /**
     * Get a credential by ID
     *
     * @param credentialId The credential ID
     * @return The credential if found
     */
    CompletableFuture<Optional<VerifiableCredential>> getCredential(String credentialId);

    /**
     * List all credentials
     *
     * @return List of stored credentials
     */
    CompletableFuture<List<VerifiableCredential>> listCredentials();

    /**
     * Search credentials by type
     *
     * @param credentialType Type to search for
     * @return Matching credentials
     */
    CompletableFuture<List<VerifiableCredential>> searchCredentialsByType(String credentialType);

    /**
     * Search credentials by issuer
     *
     * @param issuerDid Issuer DID to search for
     * @return Matching credentials
     */
    CompletableFuture<List<VerifiableCredential>> searchCredentialsByIssuer(String issuerDid);

    /**
     * Delete a credential
     *
     * @param credentialId The credential ID to delete
     * @return true if successful
     */
    CompletableFuture<Boolean> deleteCredential(String credentialId);

    // ==================== Presentation Creation ====================

    /**
     * Create a Verifiable Presentation
     *
     * @param credentialIds IDs of credentials to include
     * @param options Presentation options
     * @return Created presentation
     */
    CompletableFuture<PresentationResult> createPresentation(
            List<String> credentialIds,
            PresentationOptions options);

    /**
     * Create a presentation with selective disclosure
     *
     * @param credentialId Credential to present
     * @param disclosedClaims Claims to disclose
     * @param options Presentation options
     * @return Created presentation
     */
    CompletableFuture<PresentationResult> createSelectivePresentation(
            String credentialId,
            Set<String> disclosedClaims,
            PresentationOptions options);

    /**
     * Respond to a presentation request
     *
     * @param request The presentation request
     * @param selectedCredentials Map of requirement ID to credential ID
     * @return Created presentation
     */
    CompletableFuture<PresentationResult> respondToPresentationRequest(
            VerifiablePresentation.PresentationRequest request,
            Map<String, String> selectedCredentials);

    // ==================== DIDComm Messaging ====================

    /**
     * Send a DIDComm message
     *
     * @param recipientDid Recipient DID
     * @param message Message content
     * @param options Message options
     * @return Send result
     */
    CompletableFuture<MessageSendResult> sendMessage(
            String recipientDid,
            DIDCommMessage message,
            MessageOptions options);

    /**
     * Receive and process a DIDComm message
     *
     * @param encryptedMessage Encrypted message
     * @return Processed message
     */
    CompletableFuture<MessageReceiveResult> receiveMessage(byte[] encryptedMessage);

    /**
     * Get pending messages
     *
     * @return List of pending messages
     */
    CompletableFuture<List<DIDCommMessage>> getPendingMessages();

    // ==================== Backup and Recovery ====================

    /**
     * Create a backup of the wallet
     *
     * @param options Backup options
     * @return Encrypted backup data
     */
    CompletableFuture<WalletBackup> createBackup(BackupOptions options);

    /**
     * Restore wallet from backup
     *
     * @param backup Backup data
     * @param decryptionKey Key to decrypt the backup
     * @return Restore result
     */
    CompletableFuture<WalletRestoreResult> restoreFromBackup(WalletBackup backup, byte[] decryptionKey);

    /**
     * Export specific credentials for sharing
     *
     * @param credentialIds Credentials to export
     * @return Exported credentials
     */
    CompletableFuture<byte[]> exportCredentials(List<String> credentialIds);

    /**
     * Import credentials from export
     *
     * @param exportedData Exported credential data
     * @return Import result
     */
    CompletableFuture<CredentialImportResult> importCredentials(byte[] exportedData);

    // ==================== Data Classes ====================

    /**
     * Wallet Configuration
     */
    class WalletConfig {
        private String walletId;
        private String storageType; // "local", "cloud", "hsm"
        private String encryptionAlgorithm;
        private boolean biometricEnabled;
        private Map<String, Object> additionalConfig;

        public String getWalletId() { return walletId; }
        public void setWalletId(String walletId) { this.walletId = walletId; }
        public String getStorageType() { return storageType; }
        public void setStorageType(String storageType) { this.storageType = storageType; }
        public String getEncryptionAlgorithm() { return encryptionAlgorithm; }
        public void setEncryptionAlgorithm(String encryptionAlgorithm) {
            this.encryptionAlgorithm = encryptionAlgorithm;
        }
        public boolean isBiometricEnabled() { return biometricEnabled; }
        public void setBiometricEnabled(boolean biometricEnabled) {
            this.biometricEnabled = biometricEnabled;
        }
        public Map<String, Object> getAdditionalConfig() { return additionalConfig; }
        public void setAdditionalConfig(Map<String, Object> additionalConfig) {
            this.additionalConfig = additionalConfig;
        }
    }

    /**
     * Unlock Credentials
     */
    class UnlockCredentials {
        private String type; // "pin", "password", "biometric"
        private byte[] value;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public byte[] getValue() { return value; }
        public void setValue(byte[] value) { this.value = value; }
    }

    /**
     * Wallet Status
     */
    class WalletStatus {
        private boolean initialized;
        private boolean locked;
        private int didCount;
        private int credentialCount;
        private Instant lastActivity;
        private String version;

        public boolean isInitialized() { return initialized; }
        public void setInitialized(boolean initialized) { this.initialized = initialized; }
        public boolean isLocked() { return locked; }
        public void setLocked(boolean locked) { this.locked = locked; }
        public int getDidCount() { return didCount; }
        public void setDidCount(int didCount) { this.didCount = didCount; }
        public int getCredentialCount() { return credentialCount; }
        public void setCredentialCount(int credentialCount) { this.credentialCount = credentialCount; }
        public Instant getLastActivity() { return lastActivity; }
        public void setLastActivity(Instant lastActivity) { this.lastActivity = lastActivity; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
    }

    /**
     * Wallet Initialization Result
     */
    record WalletInitResult(
            boolean success,
            String walletId,
            String error
    ) {}

    /**
     * DID Creation Options
     */
    class DIDCreationOptions {
        private String network; // "mainnet", "testnet", "devnet"
        private String keyType; // "ed25519", "dilithium", "hybrid"
        private boolean setPrimary;
        private List<String> serviceEndpoints;

        public String getNetwork() { return network; }
        public void setNetwork(String network) { this.network = network; }
        public String getKeyType() { return keyType; }
        public void setKeyType(String keyType) { this.keyType = keyType; }
        public boolean isSetPrimary() { return setPrimary; }
        public void setSetPrimary(boolean setPrimary) { this.setPrimary = setPrimary; }
        public List<String> getServiceEndpoints() { return serviceEndpoints; }
        public void setServiceEndpoints(List<String> serviceEndpoints) {
            this.serviceEndpoints = serviceEndpoints;
        }
    }

    /**
     * DID Creation Result
     */
    record DIDCreationResult(
            boolean success,
            String did,
            DIDDocument document,
            String error
    ) {}

    /**
     * DID Import Result
     */
    record DIDImportResult(
            boolean success,
            String did,
            String error
    ) {}

    /**
     * Key Rotation Result
     */
    record KeyRotationResult(
            boolean success,
            String newKeyId,
            PublicKey newPublicKey,
            String error
    ) {}

    /**
     * Credential Storage Result
     */
    record CredentialStorageResult(
            boolean success,
            String credentialId,
            String error
    ) {}

    /**
     * Presentation Options
     */
    class PresentationOptions {
        private String holderDid;
        private String challenge;
        private String domain;
        private String verifierDid;
        private Instant expiresAt;

        public String getHolderDid() { return holderDid; }
        public void setHolderDid(String holderDid) { this.holderDid = holderDid; }
        public String getChallenge() { return challenge; }
        public void setChallenge(String challenge) { this.challenge = challenge; }
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
        public String getVerifierDid() { return verifierDid; }
        public void setVerifierDid(String verifierDid) { this.verifierDid = verifierDid; }
        public Instant getExpiresAt() { return expiresAt; }
        public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    }

    /**
     * Presentation Result
     */
    record PresentationResult(
            boolean success,
            VerifiablePresentation presentation,
            String error
    ) {}

    /**
     * DIDComm Message
     */
    class DIDCommMessage {
        private String id;
        private String type;
        private String from;
        private List<String> to;
        private Map<String, Object> body;
        private Instant createdTime;
        private Instant expiresTime;
        private List<Attachment> attachments;

        public DIDCommMessage() {
            this.id = UUID.randomUUID().toString();
            this.createdTime = Instant.now();
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
        public List<String> getTo() { return to; }
        public void setTo(List<String> to) { this.to = to; }
        public Map<String, Object> getBody() { return body; }
        public void setBody(Map<String, Object> body) { this.body = body; }
        public Instant getCreatedTime() { return createdTime; }
        public void setCreatedTime(Instant createdTime) { this.createdTime = createdTime; }
        public Instant getExpiresTime() { return expiresTime; }
        public void setExpiresTime(Instant expiresTime) { this.expiresTime = expiresTime; }
        public List<Attachment> getAttachments() { return attachments; }
        public void setAttachments(List<Attachment> attachments) { this.attachments = attachments; }
    }

    /**
     * Message Attachment
     */
    class Attachment {
        private String id;
        private String mediaType;
        private byte[] data;
        private String filename;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getMediaType() { return mediaType; }
        public void setMediaType(String mediaType) { this.mediaType = mediaType; }
        public byte[] getData() { return data; }
        public void setData(byte[] data) { this.data = data; }
        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }
    }

    /**
     * Message Options
     */
    class MessageOptions {
        private boolean encrypted;
        private boolean signed;
        private String routingDid;
        private boolean returnRoute;

        public boolean isEncrypted() { return encrypted; }
        public void setEncrypted(boolean encrypted) { this.encrypted = encrypted; }
        public boolean isSigned() { return signed; }
        public void setSigned(boolean signed) { this.signed = signed; }
        public String getRoutingDid() { return routingDid; }
        public void setRoutingDid(String routingDid) { this.routingDid = routingDid; }
        public boolean isReturnRoute() { return returnRoute; }
        public void setReturnRoute(boolean returnRoute) { this.returnRoute = returnRoute; }
    }

    /**
     * Message Send Result
     */
    record MessageSendResult(
            boolean success,
            String messageId,
            String error
    ) {}

    /**
     * Message Receive Result
     */
    record MessageReceiveResult(
            boolean success,
            DIDCommMessage message,
            String senderDid,
            String error
    ) {}

    /**
     * Backup Options
     */
    class BackupOptions {
        private String encryptionKey;
        private boolean includeCredentials;
        private boolean includeDIDs;
        private boolean includeMessages;

        public String getEncryptionKey() { return encryptionKey; }
        public void setEncryptionKey(String encryptionKey) { this.encryptionKey = encryptionKey; }
        public boolean isIncludeCredentials() { return includeCredentials; }
        public void setIncludeCredentials(boolean includeCredentials) {
            this.includeCredentials = includeCredentials;
        }
        public boolean isIncludeDIDs() { return includeDIDs; }
        public void setIncludeDIDs(boolean includeDIDs) { this.includeDIDs = includeDIDs; }
        public boolean isIncludeMessages() { return includeMessages; }
        public void setIncludeMessages(boolean includeMessages) { this.includeMessages = includeMessages; }
    }

    /**
     * Wallet Backup
     */
    class WalletBackup {
        private String backupId;
        private Instant createdAt;
        private byte[] encryptedData;
        private String encryptionAlgorithm;
        private String version;

        public String getBackupId() { return backupId; }
        public void setBackupId(String backupId) { this.backupId = backupId; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public byte[] getEncryptedData() { return encryptedData; }
        public void setEncryptedData(byte[] encryptedData) { this.encryptedData = encryptedData; }
        public String getEncryptionAlgorithm() { return encryptionAlgorithm; }
        public void setEncryptionAlgorithm(String encryptionAlgorithm) {
            this.encryptionAlgorithm = encryptionAlgorithm;
        }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
    }

    /**
     * Wallet Restore Result
     */
    record WalletRestoreResult(
            boolean success,
            int restoredDIDs,
            int restoredCredentials,
            String error
    ) {}

    /**
     * Credential Import Result
     */
    record CredentialImportResult(
            boolean success,
            List<String> importedIds,
            List<String> failedIds,
            String error
    ) {}

    // ==================== Standard DIDComm Message Types ====================

    /**
     * Standard DIDComm message types
     */
    interface DIDCommMessageTypes {
        String BASIC_MESSAGE = "https://didcomm.org/basicmessage/2.0/message";
        String CREDENTIAL_OFFER = "https://didcomm.org/issue-credential/3.0/offer-credential";
        String CREDENTIAL_REQUEST = "https://didcomm.org/issue-credential/3.0/request-credential";
        String CREDENTIAL_ISSUE = "https://didcomm.org/issue-credential/3.0/issue-credential";
        String PRESENTATION_REQUEST = "https://didcomm.org/present-proof/3.0/request-presentation";
        String PRESENTATION = "https://didcomm.org/present-proof/3.0/presentation";
        String PROBLEM_REPORT = "https://didcomm.org/report-problem/2.0/problem-report";
        String ACK = "https://didcomm.org/notification/1.0/ack";
    }

    // ==================== Credential Request Protocol ====================

    /**
     * Create a credential request message
     *
     * @param issuerDid Issuer to request from
     * @param credentialType Type of credential requested
     * @param claims Claims to include in the credential
     * @return Credential request message
     */
    default DIDCommMessage createCredentialRequestMessage(
            String issuerDid,
            String credentialType,
            Map<String, Object> claims) {

        DIDCommMessage message = new DIDCommMessage();
        message.setType(DIDCommMessageTypes.CREDENTIAL_REQUEST);
        message.setTo(List.of(issuerDid));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("credentialType", credentialType);
        body.put("claims", claims);
        message.setBody(body);

        return message;
    }

    /**
     * Create a presentation request message
     *
     * @param holderDid Holder to request presentation from
     * @param requirements Credential requirements
     * @param challenge Challenge for freshness
     * @return Presentation request message
     */
    default DIDCommMessage createPresentationRequestMessage(
            String holderDid,
            List<VerifiablePresentation.CredentialRequirement> requirements,
            String challenge) {

        DIDCommMessage message = new DIDCommMessage();
        message.setType(DIDCommMessageTypes.PRESENTATION_REQUEST);
        message.setTo(List.of(holderDid));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("requirements", requirements);
        body.put("challenge", challenge);
        message.setBody(body);

        return message;
    }
}
