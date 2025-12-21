package io.aurigraph.v11.rest;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.aurigraph.v11.bridge.security.*;
import io.aurigraph.v11.oracle.ChainlinkProofOfReserve;
import io.aurigraph.v11.crypto.HQCCryptoService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST API for Bridge Security Services - Sprint 1 Security Hardening
 *
 * Provides endpoints for:
 * - Circuit Breaker status and control
 * - Rate Limiter status and management
 * - Flash Loan Detector statistics
 * - HQC Crypto service status
 * - Chainlink Proof-of-Reserve verification
 *
 * @author Aurigraph Security Team
 * @version 12.0.0
 * @since 2025-12-21
 */
@Path("/api/v12/security")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BridgeSecurityResource {

    @Inject
    BridgeCircuitBreaker circuitBreaker;

    @Inject
    BridgeRateLimiter rateLimiter;

    @Inject
    FlashLoanDetector flashLoanDetector;

    @Inject
    HQCCryptoService hqcCryptoService;

    @Inject
    ChainlinkProofOfReserve proofOfReserve;

    // ==================== Circuit Breaker ====================

    @GET
    @Path("/circuit-breaker/status")
    public Response getCircuitBreakerStatus() {
        return Response.ok(circuitBreaker.getStatus()).build();
    }

    @GET
    @Path("/circuit-breaker/state")
    public Response getCircuitBreakerState() {
        return Response.ok(Map.of(
            "state", circuitBreaker.getState().name(),
            "allowingTransfers", circuitBreaker.allowTransfer()
        )).build();
    }

    @GET
    @Path("/circuit-breaker/failures")
    public Response getRecentFailures() {
        return Response.ok(circuitBreaker.getRecentFailures()).build();
    }

    @POST
    @Path("/circuit-breaker/reset")
    public Response resetCircuitBreaker(
            @QueryParam("operatorId") String operatorId,
            @QueryParam("reason") String reason) {
        if (operatorId == null || operatorId.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "operatorId is required"))
                .build();
        }
        boolean success = circuitBreaker.manualReset(operatorId, reason != null ? reason : "Manual reset via API");
        return Response.ok(Map.of(
            "success", success,
            "newState", circuitBreaker.getState().name()
        )).build();
    }

    // ==================== Rate Limiter ====================

    @GET
    @Path("/rate-limiter/stats")
    public Response getRateLimiterStats() {
        return Response.ok(rateLimiter.getStats()).build();
    }

    @GET
    @Path("/rate-limiter/status/{address}")
    public Response getRateLimitStatus(@PathParam("address") String address) {
        return Response.ok(rateLimiter.getStatus(address)).build();
    }

    @GET
    @Path("/rate-limiter/check/{address}")
    public Response checkRateLimit(@PathParam("address") String address) {
        BridgeRateLimiter.RateLimitResult result = rateLimiter.checkRateLimit(address);
        return Response.ok(result).build();
    }

    @POST
    @Path("/rate-limiter/reset/{address}")
    public Response resetRateLimit(
            @PathParam("address") String address,
            @QueryParam("adminId") String adminId) {
        if (adminId == null || adminId.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "adminId is required"))
                .build();
        }
        rateLimiter.resetLimit(address, adminId);
        return Response.ok(Map.of(
            "success", true,
            "address", address,
            "newStatus", rateLimiter.getStatus(address)
        )).build();
    }

    @GET
    @Path("/rate-limiter/top-limited")
    public Response getMostLimitedAddresses(@QueryParam("limit") @DefaultValue("10") int limit) {
        return Response.ok(rateLimiter.getMostLimitedAddresses(limit)).build();
    }

    // ==================== Flash Loan Detector ====================

    @GET
    @Path("/flash-loan/stats")
    public Response getFlashLoanDetectorStats() {
        return Response.ok(flashLoanDetector.getStats()).build();
    }

    @GET
    @Path("/flash-loan/attacks")
    public Response getRecentAttacks(@QueryParam("limit") @DefaultValue("20") int limit) {
        return Response.ok(flashLoanDetector.getRecentAttacks(limit)).build();
    }

    @POST
    @Path("/flash-loan/analyze")
    public Response analyzeTransfer(FlashLoanDetector.TransferAnalysisRequest request) {
        FlashLoanDetector.DetectionResult result = flashLoanDetector.analyzeTransfer(request);
        return Response.ok(result).build();
    }

    @DELETE
    @Path("/flash-loan/history/{address}")
    public Response clearAddressHistory(@PathParam("address") String address) {
        flashLoanDetector.clearAddressHistory(address);
        return Response.ok(Map.of(
            "success", true,
            "address", address,
            "message", "History cleared"
        )).build();
    }

    // ==================== HQC Crypto ====================

    @GET
    @Path("/hqc/status")
    public Response getHQCStatus() {
        return Response.ok(hqcCryptoService.getStatus()).build();
    }

    @GET
    @Path("/hqc/algorithms")
    public Response getSupportedAlgorithms() {
        return Response.ok(hqcCryptoService.getSupportedAlgorithms()).build();
    }

    @POST
    @Path("/hqc/generate-keypair")
    public Response generateHQCKeyPair(@QueryParam("keyId") String keyId) {
        if (keyId == null || keyId.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "keyId is required"))
                .build();
        }
        return Response.ok(hqcCryptoService.generateKeyPair(keyId)).build();
    }

    @POST
    @Path("/hqc/switch-algorithm")
    public Response switchAlgorithm(@QueryParam("algorithm") String algorithm) {
        boolean success = hqcCryptoService.switchAlgorithm(algorithm);
        return Response.ok(Map.of(
            "success", success,
            "currentAlgorithm", hqcCryptoService.getCurrentAlgorithm()
        )).build();
    }

    // ==================== Proof of Reserve ====================

    @GET
    @Path("/por/status")
    public Response getPoRStatus() {
        return Response.ok(proofOfReserve.getStats()).build();
    }

    @GET
    @Path("/por/feeds")
    public Response getRegisteredFeeds() {
        return Response.ok(proofOfReserve.getRegisteredFeeds()).build();
    }

    @POST
    @Path("/por/verify/{assetId}")
    public Response verifyReserve(
            @PathParam("assetId") String assetId,
            @QueryParam("expectedReserve") BigDecimal expectedReserve) {
        if (expectedReserve == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "expectedReserve is required"))
                .build();
        }
        return Response.ok(proofOfReserve.verifyReserve(assetId, expectedReserve)).build();
    }

    @GET
    @Path("/por/reserve/{assetId}")
    public Response getReserveData(@PathParam("assetId") String assetId) {
        ChainlinkProofOfReserve.ReserveData data = proofOfReserve.getReserveData(assetId);
        if (data == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Asset not found: " + assetId))
                .build();
        }
        return Response.ok(data).build();
    }

    @GET
    @Path("/por/verifications")
    public Response getAllVerifications() {
        return Response.ok(proofOfReserve.getAllVerificationStatus()).build();
    }

    @GET
    @Path("/por/alerts")
    public Response getPoRAlerts(@QueryParam("limit") @DefaultValue("20") int limit) {
        return Response.ok(proofOfReserve.getRecentAlerts(limit)).build();
    }

    @POST
    @Path("/por/register-feed")
    public Response registerFeed(ChainlinkProofOfReserve.ReserveFeedConfig config) {
        proofOfReserve.registerFeed(config);
        return Response.ok(Map.of(
            "success", true,
            "assetId", config.assetId(),
            "registeredFeeds", proofOfReserve.getRegisteredFeeds().size()
        )).build();
    }

    // ==================== Combined Security Dashboard ====================

    @GET
    @Path("/dashboard")
    public Response getSecurityDashboard() {
        return Response.ok(Map.of(
            "circuitBreaker", circuitBreaker.getStatus(),
            "rateLimiter", rateLimiter.getStats(),
            "flashLoanDetector", flashLoanDetector.getStats(),
            "hqcCrypto", hqcCryptoService.getStatus(),
            "proofOfReserve", proofOfReserve.getStats()
        )).build();
    }

    @GET
    @Path("/health")
    public Response getSecurityHealth() {
        boolean circuitOk = circuitBreaker.getState() != BridgeCircuitBreaker.CircuitState.OPEN;
        boolean porOk = proofOfReserve.getStats().enabled();

        return Response.ok(Map.of(
            "healthy", circuitOk && porOk,
            "circuitBreaker", Map.of(
                "state", circuitBreaker.getState().name(),
                "healthy", circuitOk
            ),
            "rateLimiter", Map.of(
                "enabled", rateLimiter.getStats().enabled(),
                "healthy", true
            ),
            "flashLoanDetector", Map.of(
                "enabled", flashLoanDetector.getStats().enabled(),
                "healthy", true
            ),
            "hqcCrypto", Map.of(
                "enabled", hqcCryptoService.getStatus().enabled(),
                "healthy", hqcCryptoService.isHQCAvailable()
            ),
            "proofOfReserve", Map.of(
                "enabled", proofOfReserve.getStats().enabled(),
                "healthy", porOk
            )
        )).build();
    }
}
