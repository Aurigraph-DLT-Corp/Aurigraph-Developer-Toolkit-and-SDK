package io.aurigraph.v11.verification;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

/**
 * Tests for Verification Certificate Service - AV11-401
 */
@QuarkusTest
class VerificationCertificateServiceTest {

    @Inject
    VerificationCertificateService certificateService;

    @InjectMock
    io.aurigraph.v11.crypto.DilithiumSignatureService signatureService;

    @Test
    void testGenerateCertificate() {
        // Mock signature service
        byte[] mockSignature = "mock-signature".getBytes();
        Mockito.when(signatureService.signData(any(byte[].class)))
            .thenReturn(Uni.createFrom().item(mockSignature));

        // Create certificate request
        Map<String, Object> verificationData = new HashMap<>();
        verificationData.put("verified_by", "test-verifier");
        verificationData.put("verification_level", "LEVEL_3");

        VerificationCertificateService.CertificateRequest request =
            new VerificationCertificateService.CertificateRequest(
                "entity-123",
                "USER",
                "KYC_VERIFICATION",
                "verifier-456",
                verificationData
            );

        // Generate certificate
        VerificationCertificateService.VerificationCertificate cert =
            certificateService.generateCertificate(request)
                .await().indefinitely();

        // Verify certificate
        assertNotNull(cert);
        assertNotNull(cert.certificateId());
        assertEquals("entity-123", cert.entityId());
        assertEquals("USER", cert.entityType());
        assertEquals("KYC_VERIFICATION", cert.verificationType());
        assertEquals("verifier-456", cert.verifierId());
        assertEquals(VerificationCertificateService.CertificateStatus.ISSUED, cert.status());
        assertNotNull(cert.blockchainHash());
        assertNotNull(cert.digitalSignature());
        assertTrue(cert.expiresAt() > cert.issuedAt());
    }

    @Test
    void testGetCertificate() {
        // Mock signature service
        byte[] mockSignature = "mock-signature".getBytes();
        Mockito.when(signatureService.signData(any(byte[].class)))
            .thenReturn(Uni.createFrom().item(mockSignature));

        // Generate a certificate
        Map<String, Object> verificationData = new HashMap<>();
        VerificationCertificateService.CertificateRequest request =
            new VerificationCertificateService.CertificateRequest(
                "entity-456",
                "BUSINESS",
                "AML_VERIFICATION",
                "verifier-789",
                verificationData
            );

        VerificationCertificateService.VerificationCertificate generated =
            certificateService.generateCertificate(request)
                .await().indefinitely();

        // Retrieve the certificate
        VerificationCertificateService.VerificationCertificate retrieved =
            certificateService.getCertificate(generated.certificateId())
                .await().indefinitely();

        // Verify
        assertEquals(generated.certificateId(), retrieved.certificateId());
        assertEquals(generated.entityId(), retrieved.entityId());
        assertEquals(generated.blockchainHash(), retrieved.blockchainHash());
    }

    @Test
    void testGetCertificateNotFound() {
        // Attempt to retrieve non-existent certificate
        assertThrows(
            VerificationCertificateService.CertificateNotFoundException.class,
            () -> certificateService.getCertificate("non-existent-id")
                .await().indefinitely()
        );
    }

    @Test
    void testRevokeCertificate() {
        // Mock signature service
        byte[] mockSignature = "mock-signature".getBytes();
        Mockito.when(signatureService.signData(any(byte[].class)))
            .thenReturn(Uni.createFrom().item(mockSignature));

        // Generate a certificate
        Map<String, Object> verificationData = new HashMap<>();
        VerificationCertificateService.CertificateRequest request =
            new VerificationCertificateService.CertificateRequest(
                "entity-789",
                "DOCUMENT",
                "DOCUMENT_VERIFICATION",
                "verifier-012",
                verificationData
            );

        VerificationCertificateService.VerificationCertificate cert =
            certificateService.generateCertificate(request)
                .await().indefinitely();

        // Revoke the certificate
        VerificationCertificateService.VerificationCertificate revoked =
            certificateService.revokeCertificate(cert.certificateId(), "Fraudulent activity detected")
                .await().indefinitely();

        // Verify revocation
        assertEquals(VerificationCertificateService.CertificateStatus.REVOKED, revoked.status());
        assertEquals(cert.certificateId(), revoked.certificateId());
    }

    @Test
    void testGetCertificatesByEntity() {
        // Mock signature service
        byte[] mockSignature = "mock-signature".getBytes();
        Mockito.when(signatureService.signData(any(byte[].class)))
            .thenReturn(Uni.createFrom().item(mockSignature));

        String entityId = "entity-multi-cert";

        // Generate multiple certificates for same entity
        for (int i = 0; i < 3; i++) {
            Map<String, Object> verificationData = new HashMap<>();
            VerificationCertificateService.CertificateRequest request =
                new VerificationCertificateService.CertificateRequest(
                    entityId,
                    "USER",
                    "VERIFICATION_TYPE_" + i,
                    "verifier-" + i,
                    verificationData
                );

            certificateService.generateCertificate(request)
                .await().indefinitely();
        }

        // Retrieve all certificates for entity
        var certificates = certificateService.getCertificatesByEntity(entityId)
            .await().indefinitely();

        // Verify
        assertEquals(3, certificates.size());
        assertTrue(certificates.stream()
            .allMatch(c -> c.entityId().equals(entityId)));
    }

    @Test
    void testGetStatistics() {
        // Mock signature service
        byte[] mockSignature = "mock-signature".getBytes();
        Mockito.when(signatureService.signData(any(byte[].class)))
            .thenReturn(Uni.createFrom().item(mockSignature));

        // Generate some certificates
        for (int i = 0; i < 5; i++) {
            Map<String, Object> verificationData = new HashMap<>();
            VerificationCertificateService.CertificateRequest request =
                new VerificationCertificateService.CertificateRequest(
                    "entity-stats-" + i,
                    "USER",
                    "KYC",
                    "verifier-1",
                    verificationData
                );

            certificateService.generateCertificate(request)
                .await().indefinitely();
        }

        // Get statistics
        VerificationCertificateService.CertificateStatistics stats =
            certificateService.getStatistics()
                .await().indefinitely();

        // Verify
        assertNotNull(stats);
        assertTrue(stats.totalCertificates() >= 5);
        assertTrue(stats.issuedCertificates() >= 5);
    }

    @Test
    void testVerifyCertificate() {
        // Mock signature service
        byte[] mockSignature = "mock-signature".getBytes();
        Mockito.when(signatureService.signData(any(byte[].class)))
            .thenReturn(Uni.createFrom().item(mockSignature));
        Mockito.when(signatureService.verifySignature(any(byte[].class), any(byte[].class)))
            .thenReturn(Uni.createFrom().item(true));

        // Generate certificate
        Map<String, Object> verificationData = new HashMap<>();
        VerificationCertificateService.CertificateRequest request =
            new VerificationCertificateService.CertificateRequest(
                "entity-verify",
                "USER",
                "KYC",
                "verifier-1",
                verificationData
            );

        VerificationCertificateService.VerificationCertificate cert =
            certificateService.generateCertificate(request)
                .await().indefinitely();

        // Verify certificate
        VerificationCertificateService.CertificateVerificationResult result =
            certificateService.verifyCertificate(cert.certificateId())
                .await().indefinitely();

        // Check verification result
        assertNotNull(result);
        assertEquals(cert.certificateId(), result.certificateId());
        assertTrue(result.isValid());
        assertTrue(result.validationErrors() == null || result.validationErrors().isEmpty());
    }
}
