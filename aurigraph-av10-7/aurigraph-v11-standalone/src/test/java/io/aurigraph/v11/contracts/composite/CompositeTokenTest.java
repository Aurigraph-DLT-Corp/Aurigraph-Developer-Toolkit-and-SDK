package io.aurigraph.v11.contracts.composite;

import io.aurigraph.v11.ServiceTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Composite Token core classes
 *
 * Tests the CompositeToken model, secondary token types, and related enums.
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Unit Tests)
 * @author Aurigraph V12 Development Team
 */
@DisplayName("Composite Token Unit Tests")
class CompositeTokenTest extends ServiceTestBase {

    @Nested
    @DisplayName("CompositeToken Builder Tests")
    class CompositeTokenBuilderTests {

        @Test
        @DisplayName("Should create composite token with builder pattern")
        void shouldCreateCompositeTokenWithBuilder() {
            // Given
            String compositeId = "CT-TEST-001";
            String assetId = "ASSET-001";
            AssetType assetType = AssetType.REAL_ESTATE;
            String ownerAddress = "0x1234567890abcdef";

            // When
            CompositeToken token = CompositeToken.builder()
                .compositeId(compositeId)
                .assetId(assetId)
                .assetType(assetType)
                .ownerAddress(ownerAddress)
                .status(CompositeTokenStatus.PENDING_VERIFICATION)
                .createdAt(Instant.now())
                .build();

            // Then
            assertNotNull(token);
            assertEquals(compositeId, token.getCompositeId());
            assertEquals(assetId, token.getAssetId());
            assertEquals(assetType, token.getAssetType());
            assertEquals(ownerAddress, token.getOwnerAddress());
            assertEquals(CompositeTokenStatus.PENDING_VERIFICATION, token.getStatus());
            assertNotNull(token.getMetadata());
            assertNotNull(token.getSecondaryTokens());
        }

        @Test
        @DisplayName("Should set verification level")
        void shouldSetVerificationLevel() {
            // Given
            CompositeToken token = CompositeToken.builder()
                .compositeId("CT-TEST-002")
                .assetId("ASSET-002")
                .assetType("COMMODITY")
                .ownerAddress("0xowner")
                .status(CompositeTokenStatus.VERIFIED)
                .verificationLevel(VerificationLevel.ENHANCED)
                .build();

            // Then
            assertEquals(VerificationLevel.ENHANCED, token.getVerificationLevel());
        }

        @Test
        @DisplayName("Should update mutable fields")
        void shouldUpdateMutableFields() {
            // Given
            CompositeToken token = CompositeToken.builder()
                .compositeId("CT-TEST-003")
                .assetId("ASSET-003")
                .assetType("VEHICLE")
                .ownerAddress("0xoriginal")
                .status(CompositeTokenStatus.PENDING_VERIFICATION)
                .build();

            // When
            token.setOwnerAddress("0xnewowner");
            token.setStatus(CompositeTokenStatus.VERIFIED);
            token.setVerificationLevel(VerificationLevel.INSTITUTIONAL);

            // Then
            assertEquals("0xnewowner", token.getOwnerAddress());
            assertEquals(CompositeTokenStatus.VERIFIED, token.getStatus());
            assertEquals(VerificationLevel.INSTITUTIONAL, token.getVerificationLevel());
        }
    }

    @Nested
    @DisplayName("OwnerToken Tests")
    class OwnerTokenTests {

        @Test
        @DisplayName("Should create owner token with initial ownership")
        void shouldCreateOwnerTokenWithInitialOwnership() {
            // Given
            String tokenId = "OT-001";
            String compositeId = "CT-001";
            String ownerAddress = "0xowner123";
            BigDecimal percentage = BigDecimal.valueOf(100);

            // When
            OwnerToken ownerToken = new OwnerToken(
                tokenId, compositeId, ownerAddress, percentage, new ArrayList<>()
            );

            // Then
            assertNotNull(ownerToken);
            assertEquals(tokenId, ownerToken.getTokenId());
            assertEquals(compositeId, ownerToken.getCompositeId());
            assertEquals(ownerAddress, ownerToken.getOwnerAddress());
            assertEquals(percentage, ownerToken.getOwnershipPercentage());
            assertEquals(SecondaryTokenType.OWNER, ownerToken.getTokenType());
            assertNotNull(ownerToken.getTransferHistory());
        }

        @Test
        @DisplayName("Should track ownership percentage correctly")
        void shouldTrackOwnershipPercentage() {
            // Given
            OwnerToken ownerToken = new OwnerToken(
                "OT-002", "CT-002", "0xowner", BigDecimal.valueOf(100), new ArrayList<>()
            );

            // Then - 100% ownership
            assertEquals(0, BigDecimal.valueOf(100).compareTo(ownerToken.getOwnershipPercentage()));
        }
    }

    @Nested
    @DisplayName("VerificationToken Tests")
    class VerificationTokenTests {

        @Test
        @DisplayName("Should create verification token with required level")
        void shouldCreateVerificationTokenWithRequiredLevel() {
            // Given
            String tokenId = "VT-001";
            String compositeId = "CT-001";
            VerificationLevel level = VerificationLevel.BASIC;

            // When
            VerificationToken verificationToken = new VerificationToken(
                tokenId, compositeId, level, new ArrayList<>()
            );

            // Then
            assertNotNull(verificationToken);
            assertEquals(tokenId, verificationToken.getTokenId());
            assertEquals(compositeId, verificationToken.getCompositeId());
            assertEquals(level, verificationToken.getRequiredLevel());
            assertEquals(SecondaryTokenType.VERIFICATION, verificationToken.getTokenType());
            assertNotNull(verificationToken.getVerificationResults());
        }

        @Test
        @DisplayName("Should track verification results")
        void shouldTrackVerificationResults() {
            // Given
            List<VerificationResult> results = new ArrayList<>();
            results.add(new VerificationResult(
                "VR-001", "verifier-001", "CT-001", true,
                VerificationLevel.BASIC, "Verified successfully", Instant.now()
            ));

            // When
            VerificationToken verificationToken = new VerificationToken(
                "VT-002", "CT-002", VerificationLevel.BASIC, results
            );

            // Then
            assertEquals(1, verificationToken.getVerificationResults().size());
        }
    }

    @Nested
    @DisplayName("ValuationToken Tests")
    class ValuationTokenTests {

        @Test
        @DisplayName("Should create valuation token with current value")
        void shouldCreateValuationTokenWithCurrentValue() {
            // Given
            String tokenId = "VAL-001";
            String compositeId = "CT-001";
            BigDecimal currentValue = BigDecimal.valueOf(1000000);

            // When
            ValuationToken valuationToken = new ValuationToken(
                tokenId, compositeId, currentValue, new ArrayList<>()
            );

            // Then
            assertNotNull(valuationToken);
            assertEquals(tokenId, valuationToken.getTokenId());
            assertEquals(compositeId, valuationToken.getCompositeId());
            assertEquals(currentValue, valuationToken.getCurrentValue());
            assertEquals(SecondaryTokenType.VALUATION, valuationToken.getTokenType());
            assertNotNull(valuationToken.getPriceHistory());
        }
    }

    @Nested
    @DisplayName("CollateralToken Tests")
    class CollateralTokenTests {

        @Test
        @DisplayName("Should create collateral token with assets")
        void shouldCreateCollateralTokenWithAssets() {
            // Given
            String tokenId = "COL-001";
            String compositeId = "CT-001";

            // When
            CollateralToken collateralToken = new CollateralToken(
                tokenId, compositeId, new ArrayList<>()
            );

            // Then
            assertNotNull(collateralToken);
            assertEquals(tokenId, collateralToken.getTokenId());
            assertEquals(compositeId, collateralToken.getCompositeId());
            assertEquals(SecondaryTokenType.COLLATERAL, collateralToken.getTokenType());
            assertNotNull(collateralToken.getCollateralAssets());
        }
    }

    @Nested
    @DisplayName("MediaToken Tests")
    class MediaTokenTests {

        @Test
        @DisplayName("Should create media token with assets")
        void shouldCreateMediaTokenWithAssets() {
            // Given
            String tokenId = "MED-001";
            String compositeId = "CT-001";

            // When
            MediaToken mediaToken = new MediaToken(
                tokenId, compositeId, new ArrayList<>()
            );

            // Then
            assertNotNull(mediaToken);
            assertEquals(tokenId, mediaToken.getTokenId());
            assertEquals(compositeId, mediaToken.getCompositeId());
            assertEquals(SecondaryTokenType.MEDIA, mediaToken.getTokenType());
            assertNotNull(mediaToken.getMediaAssets());
        }
    }

    @Nested
    @DisplayName("ComplianceToken Tests")
    class ComplianceTokenTests {

        @Test
        @DisplayName("Should create compliance token with status")
        void shouldCreateComplianceTokenWithStatus() {
            // Given
            String tokenId = "COMP-001";
            String compositeId = "CT-001";
            ComplianceStatus status = ComplianceStatus.COMPLIANT;

            // When
            ComplianceToken complianceToken = new ComplianceToken(
                tokenId, compositeId, status, new java.util.HashMap<>()
            );

            // Then
            assertNotNull(complianceToken);
            assertEquals(tokenId, complianceToken.getTokenId());
            assertEquals(compositeId, complianceToken.getCompositeId());
            assertEquals(status, complianceToken.getComplianceStatus());
            assertEquals(SecondaryTokenType.COMPLIANCE, complianceToken.getTokenType());
            assertNotNull(complianceToken.getComplianceData());
        }

        @Test
        @DisplayName("Should support all compliance statuses")
        void shouldSupportAllComplianceStatuses() {
            // Given
            ComplianceStatus[] statuses = ComplianceStatus.values();

            // Then - verify all expected statuses exist
            assertTrue(statuses.length >= 3); // At minimum: COMPLIANT, NON_COMPLIANT, PENDING
        }
    }

    @Nested
    @DisplayName("VerificationLevel Tests")
    class VerificationLevelTests {

        @Test
        @DisplayName("Should have correct verification level hierarchy")
        void shouldHaveCorrectVerificationLevelHierarchy() {
            // Given
            VerificationLevel[] levels = VerificationLevel.values();

            // Then - verify expected levels
            assertTrue(levels.length >= 4); // NONE, BASIC, ENHANCED, CERTIFIED, INSTITUTIONAL
        }

        @Test
        @DisplayName("Should compare verification levels correctly")
        void shouldCompareVerificationLevelsCorrectly() {
            // Given
            VerificationLevel basic = VerificationLevel.BASIC;
            VerificationLevel enhanced = VerificationLevel.ENHANCED;

            // Then
            assertTrue(enhanced.ordinal() > basic.ordinal());
        }
    }

    @Nested
    @DisplayName("CompositeTokenStatus Tests")
    class CompositeTokenStatusTests {

        @Test
        @DisplayName("Should have all required statuses")
        void shouldHaveAllRequiredStatuses() {
            // Given
            CompositeTokenStatus[] statuses = CompositeTokenStatus.values();

            // Then - verify minimum expected statuses
            assertTrue(statuses.length >= 3); // At minimum: PENDING_VERIFICATION, VERIFIED, REJECTED
        }
    }

    @Nested
    @DisplayName("SecondaryTokenType Tests")
    class SecondaryTokenTypeTests {

        @Test
        @DisplayName("Should have all core and document-based secondary token types")
        void shouldHaveAllSixSecondaryTokenTypes() {
            // Given
            SecondaryTokenType[] types = SecondaryTokenType.values();

            // Then - The enum has been expanded from 6 to 24 types (includes document-based tokens)
            assertTrue(types.length >= 6, "Should have at least 6 core token types");
            // Verify core types exist
            assertTrue(containsType(types, SecondaryTokenType.OWNER));
            assertTrue(containsType(types, SecondaryTokenType.VERIFICATION));
            assertTrue(containsType(types, SecondaryTokenType.VALUATION));
            assertTrue(containsType(types, SecondaryTokenType.COLLATERAL));
            assertTrue(containsType(types, SecondaryTokenType.MEDIA));
            assertTrue(containsType(types, SecondaryTokenType.COMPLIANCE));
            // Verify document-based types
            assertTrue(containsType(types, SecondaryTokenType.TITLE_DEED));
            assertTrue(containsType(types, SecondaryTokenType.OWNER_KYC));
            assertTrue(containsType(types, SecondaryTokenType.APPRAISAL));
        }

        private boolean containsType(SecondaryTokenType[] types, SecondaryTokenType target) {
            for (SecondaryTokenType type : types) {
                if (type == target) return true;
            }
            return false;
        }
    }

    @Nested
    @DisplayName("VerificationResult Tests")
    class VerificationResultTests {

        @Test
        @DisplayName("Should create verification result with all fields")
        void shouldCreateVerificationResultWithAllFields() {
            // Given
            String resultId = "VR-001";
            String verifierId = "VERIFIER-001";
            String compositeId = "CT-001";
            boolean verified = true;
            VerificationLevel level = VerificationLevel.BASIC;
            String summary = "Asset verified successfully";
            Instant timestamp = Instant.now();

            // When
            VerificationResult result = new VerificationResult(
                resultId, verifierId, compositeId, verified, level, summary, timestamp
            );

            // Then
            assertNotNull(result);
            assertEquals(resultId, result.getResultId());
            assertEquals(verifierId, result.getVerifierId());
            assertEquals(compositeId, result.getCompositeId());
            assertTrue(result.isVerified());
            assertEquals(level, result.getVerificationLevel());
            assertEquals(summary, result.getReportSummary());
            assertEquals(timestamp, result.getVerifiedAt());
            assertNotNull(result.getResultData());
        }
    }
}

// Note: Uses VerificationLevel values: NONE, BASIC, ENHANCED, CERTIFIED, INSTITUTIONAL
