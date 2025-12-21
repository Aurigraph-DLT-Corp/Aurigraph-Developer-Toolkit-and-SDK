package io.aurigraph.v11.bridge.security;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;

import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BridgeRateLimiter
 *
 * Tests the rate limiting functionality:
 * - Per-address rate limiting
 * - Sliding window counter
 * - Rate limit headers
 * - Chain-specific limits
 * - Admin reset functionality
 * - Metrics and statistics
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 */
@QuarkusTest
@TestMethodOrder(OrderAnnotation.class)
class BridgeRateLimiterTest {

    @Inject
    BridgeRateLimiter rateLimiter;

    private static final String TEST_ADDRESS_1 = "0x1234567890abcdef1234567890abcdef12345678";
    private static final String TEST_ADDRESS_2 = "0xabcdef1234567890abcdef1234567890abcdef12";

    @BeforeEach
    void resetForTest() {
        // Reset rate limits for test addresses
        rateLimiter.resetLimit(TEST_ADDRESS_1, "test");
        rateLimiter.resetLimit(TEST_ADDRESS_2, "test");
    }

    @Test
    @Order(1)
    @DisplayName("First request should be allowed")
    void testFirstRequestAllowed() {
        BridgeRateLimiter.RateLimitResult result = rateLimiter.checkRateLimit(TEST_ADDRESS_1);

        assertTrue(result.allowed());
        assertTrue(result.remaining() > 0);
        assertEquals("Request allowed", result.message());
    }

    @Test
    @Order(2)
    @DisplayName("Should track request count correctly")
    void testRequestCountTracking() {
        // Make some requests
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordTransfer(TEST_ADDRESS_1, null);
        }

        BridgeRateLimiter.RateLimitStatus status = rateLimiter.getStatus(TEST_ADDRESS_1);

        assertEquals(5, status.currentCount());
        assertEquals(TEST_ADDRESS_1, status.address());
        assertFalse(status.isRateLimited());
    }

    @Test
    @Order(3)
    @DisplayName("Should enforce rate limit after max transfers")
    void testRateLimitEnforcement() {
        // Max is 10 transfers/minute with 1.5x burst = 15 effective limit
        // Make requests up to the limit
        for (int i = 0; i < 15; i++) {
            BridgeRateLimiter.RateLimitResult result = rateLimiter.checkRateLimit(TEST_ADDRESS_1);
            assertTrue(result.allowed(), "Request " + i + " should be allowed");
        }

        // Next request should be rate limited
        BridgeRateLimiter.RateLimitResult limitedResult = rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        assertFalse(limitedResult.allowed());
        assertTrue(limitedResult.retryAfterSeconds() > 0);
    }

    @Test
    @Order(4)
    @DisplayName("Should return correct rate limit headers")
    void testRateLimitHeaders() {
        rateLimiter.checkRateLimit(TEST_ADDRESS_1);

        BridgeRateLimiter.RateLimitResult result = rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        Map<String, String> headers = result.toHeaders();

        assertNotNull(headers.get("X-RateLimit-Limit"));
        assertNotNull(headers.get("X-RateLimit-Remaining"));
        assertNotNull(headers.get("X-RateLimit-Reset"));
        assertNotNull(headers.get("Retry-After"));
    }

    @Test
    @Order(5)
    @DisplayName("Rate limits should be per-address")
    void testPerAddressRateLimiting() {
        // Use up rate limit for address 1
        for (int i = 0; i < 15; i++) {
            rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        }

        // Address 1 should be rate limited
        BridgeRateLimiter.RateLimitResult result1 = rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        assertFalse(result1.allowed());

        // Address 2 should still be allowed
        BridgeRateLimiter.RateLimitResult result2 = rateLimiter.checkRateLimit(TEST_ADDRESS_2);
        assertTrue(result2.allowed());
    }

    @Test
    @Order(6)
    @DisplayName("Admin reset should clear rate limit")
    void testAdminReset() {
        // Hit the rate limit
        for (int i = 0; i < 16; i++) {
            rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        }

        // Should be rate limited
        assertFalse(rateLimiter.checkRateLimit(TEST_ADDRESS_1).allowed());

        // Admin reset
        rateLimiter.resetLimit(TEST_ADDRESS_1, "admin-001");

        // Should now be allowed
        BridgeRateLimiter.RateLimitResult result = rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        assertTrue(result.allowed());
    }

    @Test
    @Order(7)
    @DisplayName("Should handle chain-specific rate limiting")
    void testChainSpecificRateLimiting() {
        String chainId = "ethereum";

        // Make requests with chain ID
        for (int i = 0; i < 10; i++) {
            rateLimiter.checkRateLimit(TEST_ADDRESS_1, chainId);
        }

        BridgeRateLimiter.RateLimitStatus status = rateLimiter.getStatus(TEST_ADDRESS_1, chainId);
        assertEquals(10, status.currentCount());

        // Same address without chain ID should be tracked separately
        BridgeRateLimiter.RateLimitStatus statusNoChain = rateLimiter.getStatus(TEST_ADDRESS_1, null);
        assertEquals(0, statusNoChain.currentCount());
    }

    @Test
    @Order(8)
    @DisplayName("Should provide accurate statistics")
    void testStatistics() {
        // Make some requests
        for (int i = 0; i < 5; i++) {
            rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        }

        // Hit rate limit for address 2
        for (int i = 0; i < 20; i++) {
            rateLimiter.checkRateLimit(TEST_ADDRESS_2);
        }

        BridgeRateLimiter.RateLimiterStats stats = rateLimiter.getStats();

        assertTrue(stats.enabled());
        assertTrue(stats.totalRequests() > 0);
        assertTrue(stats.allowedRequests() > 0);
        assertTrue(stats.rateLimitedRequests() > 0);
        assertTrue(stats.allowedPercentage() > 0);
        assertTrue(stats.allowedPercentage() <= 100);
    }

    @Test
    @Order(9)
    @DisplayName("Should handle null/empty address gracefully")
    void testNullAddressHandling() {
        BridgeRateLimiter.RateLimitResult nullResult = rateLimiter.checkRateLimit(null);
        assertFalse(nullResult.allowed());

        BridgeRateLimiter.RateLimitResult emptyResult = rateLimiter.checkRateLimit("");
        assertFalse(emptyResult.allowed());

        BridgeRateLimiter.RateLimitResult blankResult = rateLimiter.checkRateLimit("   ");
        assertFalse(blankResult.allowed());
    }

    @Test
    @Order(10)
    @DisplayName("Should get most rate-limited addresses")
    void testMostLimitedAddresses() {
        // Rate limit several addresses
        for (int addr = 0; addr < 5; addr++) {
            String address = "0xtest" + addr;
            for (int i = 0; i < 20 + addr; i++) {
                rateLimiter.checkRateLimit(address);
            }
        }

        Map<String, Integer> mostLimited = rateLimiter.getMostLimitedAddresses(3);

        assertTrue(mostLimited.size() <= 3);
        // Should be sorted by count descending
        int previous = Integer.MAX_VALUE;
        for (Integer count : mostLimited.values()) {
            assertTrue(count <= previous);
            previous = count;
        }
    }

    @Test
    @Order(11)
    @DisplayName("Rate limit status should show isRateLimited correctly")
    void testRateLimitStatusFlag() {
        // Not rate limited initially
        BridgeRateLimiter.RateLimitStatus statusBefore = rateLimiter.getStatus(TEST_ADDRESS_1);
        assertFalse(statusBefore.isRateLimited());

        // Hit rate limit
        for (int i = 0; i < 20; i++) {
            rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        }

        // Should be rate limited
        BridgeRateLimiter.RateLimitStatus statusAfter = rateLimiter.getStatus(TEST_ADDRESS_1);
        assertTrue(statusAfter.isRateLimited());
    }

    @Test
    @Order(12)
    @DisplayName("Thread safety - concurrent rate limit checks")
    void testConcurrentRateLimitChecks() throws InterruptedException {
        String concurrentAddress = "0xconcurrent";
        int threadCount = 10;
        int requestsPerThread = 10;
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger allowedCount = new AtomicInteger(0);
        AtomicInteger deniedCount = new AtomicInteger(0);

        for (int t = 0; t < threadCount; t++) {
            new Thread(() -> {
                try {
                    for (int i = 0; i < requestsPerThread; i++) {
                        BridgeRateLimiter.RateLimitResult result = rateLimiter.checkRateLimit(concurrentAddress);
                        if (result.allowed()) {
                            allowedCount.incrementAndGet();
                        } else {
                            deniedCount.incrementAndGet();
                        }
                    }
                } finally {
                    latch.countDown();
                }
            }).start();
        }

        assertTrue(latch.await(10, TimeUnit.SECONDS));

        // Total should equal all requests
        assertEquals(threadCount * requestsPerThread, allowedCount.get() + deniedCount.get());

        // Should have some allowed and some denied (if limit hit)
        assertTrue(allowedCount.get() > 0);
    }

    @Test
    @Order(13)
    @DisplayName("Remaining count should decrease with each request")
    void testRemainingCountDecrement() {
        BridgeRateLimiter.RateLimitResult first = rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        int initialRemaining = first.remaining();

        rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        BridgeRateLimiter.RateLimitResult second = rateLimiter.checkRateLimit(TEST_ADDRESS_1);

        assertTrue(second.remaining() < initialRemaining);
    }

    @Test
    @Order(14)
    @DisplayName("Denied request should have retry-after > 0")
    void testRetryAfterOnDenied() {
        // Exhaust rate limit
        for (int i = 0; i < 20; i++) {
            rateLimiter.checkRateLimit(TEST_ADDRESS_1);
        }

        BridgeRateLimiter.RateLimitResult result = rateLimiter.checkRateLimit(TEST_ADDRESS_1);

        assertFalse(result.allowed());
        assertTrue(result.retryAfterSeconds() > 0);
    }

    @Test
    @Order(15)
    @DisplayName("recordTransfer should increment counter")
    void testRecordTransferIncrementsCounter() {
        BridgeRateLimiter.RateLimitStatus before = rateLimiter.getStatus(TEST_ADDRESS_1);
        assertEquals(0, before.currentCount());

        rateLimiter.recordTransfer(TEST_ADDRESS_1, null);
        rateLimiter.recordTransfer(TEST_ADDRESS_1, null);
        rateLimiter.recordTransfer(TEST_ADDRESS_1, null);

        BridgeRateLimiter.RateLimitStatus after = rateLimiter.getStatus(TEST_ADDRESS_1);
        assertEquals(3, after.currentCount());
    }
}
