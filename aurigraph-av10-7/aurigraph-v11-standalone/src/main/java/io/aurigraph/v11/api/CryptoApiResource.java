package io.aurigraph.v11.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import io.aurigraph.v11.crypto.QuantumCryptoService;
import io.aurigraph.v11.crypto.QuantumCryptoService.*;

/**
 * Cryptography API Resource
 *
 * Comprehensive REST API for quantum-resistant cryptography operations.
 *
 * Provides quantum-resistant cryptography operations:
 * - CRYSTALS-Kyber key generation and key encapsulation
 * - CRYSTALS-Dilithium digital signatures
 * - SPHINCS+ hash-based signatures
 * - Quantum-resistant encryption/decryption
 * - Performance testing and metrics
 *
 * @version 11.3.0
 * @author Aurigraph V11 Team
 */
@Path("/api/v11/crypto")
@ApplicationScoped
@Tag(name = "Cryptography API", description = "Post-quantum cryptography operations")
public class CryptoApiResource {

    private static final Logger LOG = Logger.getLogger(CryptoApiResource.class);

    @Inject
    QuantumCryptoService quantumCryptoService;

    // ==================== STATUS & INFO APIs ====================

    @GET
    @Path("/status")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get quantum cryptography status", description = "Returns post-quantum cryptography system status")
    @APIResponse(responseCode = "200", description = "Crypto status retrieved successfully")
    public Object getCryptoStatus() {
        LOG.debug("Getting crypto status");
        return quantumCryptoService.getStatus();
    }

    @GET
    @Path("/algorithms")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get supported algorithms", description = "Returns list of supported quantum-resistant algorithms")
    @APIResponse(responseCode = "200", description = "Supported algorithms retrieved successfully")
    public Object getSupportedAlgorithms() {
        LOG.debug("Getting supported algorithms");
        return quantumCryptoService.getSupportedAlgorithms();
    }

    @GET
    @Path("/security/quantum-status")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Get quantum security status", description = "Returns detailed quantum security compliance status")
    @APIResponse(responseCode = "200", description = "Quantum security status retrieved successfully")
    public Object getQuantumSecurityStatus() {
        LOG.debug("Getting quantum security status");
        return quantumCryptoService.getQuantumSecurityStatus();
    }

    // ==================== KEY MANAGEMENT APIs ====================

    @POST
    @Path("/keystore/generate")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Generate quantum-resistant key pair", description = "Generate CRYSTALS-Kyber or CRYSTALS-Dilithium key pair")
    @APIResponse(responseCode = "200", description = "Key pair generated successfully")
    public Uni<KeyGenerationResult> generateKeyPair(KeyGenerationRequest request) {
        LOG.infof("Generating key pair: %s (%s)", request.keyId(), request.algorithm());
        return quantumCryptoService.generateKeyPair(request);
    }

    // ==================== ENCRYPTION/DECRYPTION APIs ====================

    @POST
    @Path("/encrypt")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Encrypt data with quantum-resistant cryptography", description = "Encrypt data using CRYSTALS-Kyber KEM")
    @APIResponse(responseCode = "200", description = "Data encrypted successfully")
    public Uni<EncryptionResult> encryptData(EncryptionRequest request) {
        LOG.debugf("Encrypting data with keyId: %s", request.keyId());
        return quantumCryptoService.encryptData(request);
    }

    @POST
    @Path("/decrypt")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Decrypt data with quantum-resistant cryptography", description = "Decrypt data using CRYSTALS-Kyber KEM")
    @APIResponse(responseCode = "200", description = "Data decrypted successfully")
    public Uni<DecryptionResult> decryptData(DecryptionRequest request) {
        LOG.debugf("Decrypting data with keyId: %s", request.keyId());
        return quantumCryptoService.decryptData(request);
    }

    // ==================== SIGNATURE APIs ====================

    @POST
    @Path("/sign")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Sign data with quantum-resistant cryptography", description = "Sign data using CRYSTALS-Dilithium digital signatures")
    @APIResponse(responseCode = "200", description = "Data signed successfully")
    public Uni<SignatureResult> signDataWithService(SignatureRequest request) {
        LOG.infof("Signing data with keyId: %s", request.keyId());
        return quantumCryptoService.signData(request);
    }

    @POST
    @Path("/verify")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Verify quantum-resistant signature", description = "Verify CRYSTALS-Dilithium digital signature")
    @APIResponse(responseCode = "200", description = "Signature verified successfully")
    public Uni<VerificationResult> verifySignature(VerificationRequest request) {
        LOG.debugf("Verifying signature for keyId: %s", request.keyId());
        return quantumCryptoService.verifySignature(request);
    }

    // ==================== PERFORMANCE APIs ====================

    @POST
    @Path("/performance")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Run crypto performance test", description = "Execute quantum cryptography performance benchmark")
    @APIResponse(responseCode = "200", description = "Performance test completed successfully")
    public Uni<CryptoPerformanceResult> performanceTest(CryptoPerformanceRequest request) {
        LOG.infof("Running crypto performance test: %d operations", request.operations());
        return quantumCryptoService.performanceTest(request);
    }

    // Note: /metrics endpoint already exists in AurigraphResource (AV11-368)
    // To avoid duplication, crypto metrics are available via /api/v11/crypto/metrics in AurigraphResource

    // ==================== DATA MODELS ====================
    // Note: Request/Response models are imported from QuantumCryptoService
}
