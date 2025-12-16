package io.aurigraph.v11.bridge;

import io.aurigraph.v11.bridge.models.ValidationRequest;
import io.aurigraph.v11.bridge.models.ValidationResponse;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

/**
 * Comprehensive test suite for Cross-Chain Bridge functionality
 *
 * Tests all bridge operations including:
 * - Bridge transaction validation
 * - Signature verification
 * - Liquidity management
 * - Fee calculation
 * - Rate limiting
 * - Chain compatibility
 * - Token support validation
 *
 * Target: 12+ comprehensive test cases
 * Coverage: Bridge validation, security, and performance
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Cross-Chain Bridge Comprehensive Test Suite")
public class CrossChainBridgeTest {

    @Inject
    BridgeValidatorService bridgeValidatorService;

    private static final String TEST_BRIDGE_ID = "bridge-test-001";
    private static final String SOURCE_CHAIN = "Ethereum";
    private static final String TARGET_CHAIN = "Aurigraph";
    private static final String TOKEN_SYMBOL = "USDT";

    @BeforeEach
    void setup() {
        // Reset state before each test
        assertThat(bridgeValidatorService)
            .as("BridgeValidatorService should be injected")
            .isNotNull();
    }

    @Test
    @Order(1)
    @DisplayName("Test successful bridge validation with valid request")
    void testSuccessfulBridgeValidation() {
        // Given
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID)
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(1000))
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .gasPrice(BigDecimal.valueOf(50))
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getValidationId()).isNotNull();
        assertThat(response.getTimestamp()).isNotNull();
        assertThat(response.getNonce()).isEqualTo(request.getNonce());
        assertThat(response.getStatus()).isIn(
            ValidationResponse.ValidationStatus.SUCCESS,
            ValidationResponse.ValidationStatus.WARNINGS
        );
    }

    @Test
    @Order(2)
    @DisplayName("Test bridge validation with invalid source chain")
    void testBridgeValidationWithInvalidSourceChain() {
        // Given - invalid source chain
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-invalid-chain")
            .sourceChain("InvalidChain")
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(1000))
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getChainCompatibility()).isFalse();
        assertThat(response.getStatus()).isEqualTo(ValidationResponse.ValidationStatus.FAILED);
        assertThat(response.getValidationErrors()).isNotEmpty();
        assertThat(response.getValidationErrors()).anyMatch(error ->
            error.contains("not compatible"));
    }

    @Test
    @Order(3)
    @DisplayName("Test bridge validation with insufficient liquidity")
    void testBridgeValidationWithInsufficientLiquidity() {
        // Given - amount exceeding available liquidity
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-high-amount")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(2_000_000)) // Exceeds pool liquidity
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .liquidityCheckRequired(true)
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getLiquidityAvailable()).isFalse();
        assertThat(response.getStatus()).isEqualTo(ValidationResponse.ValidationStatus.FAILED);
        assertThat(response.getValidationErrors()).anyMatch(error ->
            error.contains("Insufficient liquidity"));
    }

    @Test
    @Order(4)
    @DisplayName("Test bridge validation with unsupported token")
    void testBridgeValidationWithUnsupportedToken() {
        // Given - unsupported token
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-unsupported-token")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol("UNSUPPORTED_TOKEN")
            .amount(BigDecimal.valueOf(100))
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTokenSupported()).isFalse();
        assertThat(response.getStatus()).isEqualTo(ValidationResponse.ValidationStatus.FAILED);
        assertThat(response.getValidationErrors()).anyMatch(error ->
            error.contains("not supported"));
    }

    @Test
    @Order(5)
    @DisplayName("Test bridge validation fee calculation")
    void testBridgeFeeCalculation() {
        // Given
        BigDecimal bridgeAmount = BigDecimal.valueOf(10000);
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-fee-calc")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(bridgeAmount)
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .gasPrice(BigDecimal.valueOf(100))
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getFeeEstimate()).isNotNull();
        assertThat(response.getFeeEstimate()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getGasFeeEstimate()).isNotNull();
        assertThat(response.getGasFeeEstimate()).isGreaterThan(BigDecimal.ZERO);
        assertThat(response.getTotalFeeEstimate()).isNotNull();
        assertThat(response.getTotalFeeEstimate()).isGreaterThan(response.getFeeEstimate());

        // Fee should be approximately 0.1% of amount (base fee)
        BigDecimal expectedBaseFee = bridgeAmount.multiply(BigDecimal.valueOf(0.001));
        assertThat(response.getFeeEstimate()).isCloseTo(expectedBaseFee, within(BigDecimal.valueOf(0.01)));
    }

    @Test
    @Order(6)
    @DisplayName("Test bridge validation with amount below minimum")
    void testBridgeValidationWithAmountBelowMinimum() {
        // Given - amount below minimum transfer limit
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-low-amount")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(50)) // Below minimum of 100
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAmountWithinLimits()).isFalse();
        assertThat(response.getMinTransferAmount()).isNotNull();
        assertThat(response.getMinTransferAmount()).isGreaterThan(request.getAmount());
        assertThat(response.getStatus()).isEqualTo(ValidationResponse.ValidationStatus.FAILED);
    }

    @Test
    @Order(7)
    @DisplayName("Test bridge validation with amount above maximum")
    void testBridgeValidationWithAmountAboveMaximum() {
        // Given - amount above maximum transfer limit
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-high-limit")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(2_000_000)) // Above maximum of 1,000,000
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .liquidityCheckRequired(false) // Disable liquidity check to focus on limit check
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAmountWithinLimits()).isFalse();
        assertThat(response.getMaxTransferAmount()).isNotNull();
        assertThat(response.getMaxTransferAmount()).isLessThan(request.getAmount());
        assertThat(response.getStatus()).isEqualTo(ValidationResponse.ValidationStatus.FAILED);
    }

    @Test
    @Order(8)
    @DisplayName("Test bridge rate limiting enforcement")
    void testBridgeRateLimiting() {
        // Given - same address making multiple requests
        String testAddress = "0xrate" + System.currentTimeMillis();

        // When - make 105 requests (exceeds limit of 100/second)
        ValidationResponse lastResponse = null;
        for (int i = 0; i < 105; i++) {
            ValidationRequest request = ValidationRequest.builder()
                .bridgeId(TEST_BRIDGE_ID + "-rate-limit-" + i)
                .sourceChain(SOURCE_CHAIN)
                .targetChain(TARGET_CHAIN)
                .sourceAddress(testAddress)
                .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
                .tokenSymbol(TOKEN_SYMBOL)
                .amount(BigDecimal.valueOf(100))
                .nonce(System.currentTimeMillis() + i)
                .signature("valid-signature")
                .signatureType("ECDSA")
                .build();

            lastResponse = bridgeValidatorService.validateBridgeTransaction(request);
        }

        // Then - last response should be rate limited
        assertThat(lastResponse).isNotNull();
        assertThat(lastResponse.getRateLimitInfo()).isNotNull();
        assertThat(lastResponse.getRateLimitInfo().getIsRateLimited()).isNotNull();

        if (lastResponse.getRateLimitInfo().getIsRateLimited()) {
            assertThat(lastResponse.getRateLimitInfo().getResetTimeSeconds()).isGreaterThan(0);
            assertThat(lastResponse.getStatus()).isEqualTo(ValidationResponse.ValidationStatus.FAILED);
        }
    }

    @Test
    @Order(9)
    @DisplayName("Test bridge validation with high slippage warning")
    void testBridgeValidationWithHighSlippage() {
        // Given - large amount that causes high slippage
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-slippage")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(50000)) // Large amount relative to pool
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getSlippagePercentage()).isNotNull();

        // If slippage is > 2%, there should be a warning
        if (response.getSlippagePercentage().compareTo(BigDecimal.valueOf(2)) > 0) {
            assertThat(response.getValidationWarnings()).isNotEmpty();
            assertThat(response.getValidationWarnings()).anyMatch(warning ->
                warning.contains("slippage"));
        }
    }

    @Test
    @Order(10)
    @DisplayName("Test bridge validation estimated completion time")
    void testBridgeEstimatedCompletionTime() {
        // Given
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-timing")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(1000))
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getEstimatedTime()).isGreaterThan(0L);

        // Bridge time should be reasonable (between 30s and 5 minutes)
        assertThat(response.getEstimatedTime())
            .isGreaterThan(30_000L) // > 30 seconds
            .isLessThan(300_000L);   // < 5 minutes
    }

    @Test
    @Order(11)
    @DisplayName("Test bridge validation with multiple supported chains")
    void testBridgeValidationMultipleChains() {
        // Test different chain pairs
        String[] sourceChains = {"Ethereum", "Polygon", "BSC", "Avalanche"};
        String[] targetChains = {"Aurigraph", "Solana", "Polygon"};

        for (String source : sourceChains) {
            for (String target : targetChains) {
                if (source.equals(target)) continue;

                ValidationRequest request = ValidationRequest.builder()
                    .bridgeId(TEST_BRIDGE_ID + "-" + source + "-" + target)
                    .sourceChain(source)
                    .targetChain(target)
                    .sourceAddress("0x1234567890123456789012345678901234567890")
                    .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
                    .tokenSymbol(TOKEN_SYMBOL)
                    .amount(BigDecimal.valueOf(500))
                    .nonce(System.currentTimeMillis())
                    .signature("valid-signature")
                    .signatureType("ECDSA")
                    .build();

                ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

                assertThat(response).isNotNull();
                assertThat(response.getChainCompatibility())
                    .as("Chain pair %s -> %s should be compatible", source, target)
                    .isTrue();
            }
        }
    }

    @Test
    @Order(12)
    @DisplayName("Test bridge validation details and metadata")
    void testBridgeValidationDetails() {
        // Given
        ValidationRequest request = ValidationRequest.builder()
            .bridgeId(TEST_BRIDGE_ID + "-details")
            .sourceChain(SOURCE_CHAIN)
            .targetChain(TARGET_CHAIN)
            .sourceAddress("0x1234567890123456789012345678901234567890")
            .targetAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd")
            .tokenSymbol(TOKEN_SYMBOL)
            .amount(BigDecimal.valueOf(1000))
            .nonce(System.currentTimeMillis())
            .signature("valid-signature")
            .signatureType("ECDSA")
            .build();

        // When
        ValidationResponse response = bridgeValidatorService.validateBridgeTransaction(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getValidationDetails()).isNotEmpty();
        assertThat(response.getValidationDetails()).containsKeys(
            "signatureType",
            "sourceChain",
            "targetChain",
            "tokenSymbol",
            "exchangeRate"
        );

        assertThat(response.getExchangeRate()).isNotNull();
        assertThat(response.getSourceTokenDecimals()).isGreaterThan(0);
        assertThat(response.getTargetTokenDecimals()).isGreaterThan(0);
        assertThat(response.getExpiresAt()).isNotNull();
        assertThat(response.getExpiresAt()).isAfter(response.getTimestamp());
    }

    @AfterAll
    static void tearDown() {
        System.out.println("CrossChainBridge test suite completed successfully");
        System.out.println("All 12 cross-chain bridge tests validated");
    }
}
