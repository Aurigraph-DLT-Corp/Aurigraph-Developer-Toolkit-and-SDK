package io.aurigraph.v11.api;

import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.jboss.logging.Logger;

import java.net.URI;
import java.util.Map;

/**
 * V11 to V12 API Redirect Resource
 *
 * Provides backward compatibility by redirecting all /api/v11/* requests
 * to their /api/v12/* equivalents. This allows the frontend to continue
 * using V11 endpoints while the backend has migrated to V12.
 *
 * Uses 307 Temporary Redirect to preserve HTTP method and body.
 *
 * @version 1.0.0 (Dec 18, 2025)
 * @deprecated Migrate to /api/v12/* endpoints
 */
@Path("/api/v11")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class V11ToV12RedirectResource {

    private static final Logger LOG = Logger.getLogger(V11ToV12RedirectResource.class);

    @Context
    UriInfo uriInfo;

    // ============================================================
    // Health & Info Endpoints
    // ============================================================

    @GET
    @Path("/health")
    public Response health() {
        return redirectToV12("/api/v12/health");
    }

    @GET
    @Path("/info")
    public Response info() {
        return redirectToV12("/api/v12/info");
    }

    // ============================================================
    // Channel Endpoints
    // ============================================================

    @GET
    @Path("/channels")
    public Response getChannels() {
        return redirectToV12("/api/v12/channels");
    }

    @GET
    @Path("/channels/{id}")
    public Response getChannel(@PathParam("id") String id) {
        return redirectToV12("/api/v12/channels/" + id);
    }

    @POST
    @Path("/channels")
    public Response createChannel(String body) {
        return redirectToV12("/api/v12/channels");
    }

    @POST
    @Path("/channels/create")
    public Response createChannelAlt(String body) {
        return redirectToV12("/api/v12/channels");
    }

    @GET
    @Path("/channels/stats")
    public Response getChannelStats() {
        return redirectToV12("/api/v12/channels/stats");
    }

    // ============================================================
    // Token Endpoints
    // ============================================================

    @GET
    @Path("/tokens")
    public Response getTokens() {
        return redirectToV12("/api/v12/tokens");
    }

    @GET
    @Path("/tokens/list")
    public Response listTokens() {
        return redirectToV12("/api/v12/tokens");
    }

    @GET
    @Path("/tokens/{id}")
    public Response getToken(@PathParam("id") String id) {
        return redirectToV12("/api/v12/tokens/" + id);
    }

    @POST
    @Path("/tokens/create")
    public Response createToken(String body) {
        return redirectToV12("/api/v12/token-management/create");
    }

    @POST
    @Path("/tokens/mint")
    public Response mintToken(String body) {
        return redirectToV12("/api/v12/token-management/mint");
    }

    @POST
    @Path("/tokens/burn")
    public Response burnToken(String body) {
        return redirectToV12("/api/v12/token-management/burn");
    }

    @POST
    @Path("/tokens/transfer")
    public Response transferToken(String body) {
        return redirectToV12("/api/v12/token-management/transfer");
    }

    @GET
    @Path("/tokens/stats")
    public Response getTokenStats() {
        return redirectToV12("/api/v12/tokens/stats");
    }

    // ============================================================
    // Validator Endpoints
    // ============================================================

    @GET
    @Path("/validators")
    public Response getValidators() {
        return redirectToV12("/api/v12/validators");
    }

    @GET
    @Path("/validators/{id}")
    public Response getValidator(@PathParam("id") String id) {
        return redirectToV12("/api/v12/validators/" + id);
    }

    @GET
    @Path("/validators/staking/info")
    public Response getValidatorStakingInfo() {
        return redirectToV12("/api/v12/validators/staking");
    }

    // ============================================================
    // Block Endpoints
    // ============================================================

    @GET
    @Path("/blocks")
    public Response getBlocks() {
        return redirectToV12("/api/v12/blocks");
    }

    @GET
    @Path("/blocks/latest")
    public Response getLatestBlock() {
        return redirectToV12("/api/v12/blocks/latest");
    }

    @GET
    @Path("/blocks/{id}")
    public Response getBlock(@PathParam("id") String id) {
        return redirectToV12("/api/v12/blocks/" + id);
    }

    @GET
    @Path("/blocks/search")
    public Response searchBlocks() {
        return redirectToV12("/api/v12/blocks/search");
    }

    // ============================================================
    // Transaction Endpoints
    // ============================================================

    @GET
    @Path("/transactions")
    public Response getTransactions() {
        return redirectToV12("/api/v12/transactions");
    }

    @GET
    @Path("/transactions/{id}")
    public Response getTransaction(@PathParam("id") String id) {
        return redirectToV12("/api/v12/transactions/" + id);
    }

    @GET
    @Path("/transactions/stats")
    public Response getTransactionStats() {
        return redirectToV12("/api/v12/transactions/stats");
    }

    @GET
    @Path("/transactions/search")
    public Response searchTransactions() {
        return redirectToV12("/api/v12/transactions/search");
    }

    // ============================================================
    // Contract Endpoints
    // ============================================================

    @GET
    @Path("/contracts")
    public Response getContracts() {
        return redirectToV12("/api/v12/contracts");
    }

    @GET
    @Path("/contracts/{id}")
    public Response getContract(@PathParam("id") String id) {
        return redirectToV12("/api/v12/contracts/" + id);
    }

    @POST
    @Path("/contracts/deploy")
    public Response deployContract(String body) {
        return redirectToV12("/api/v12/contracts/deploy");
    }

    @POST
    @Path("/contracts/execute")
    public Response executeContract(String body) {
        return redirectToV12("/api/v12/contracts/execute");
    }

    // ============================================================
    // RWA Endpoints
    // ============================================================

    @GET
    @Path("/rwa")
    public Response getRwaAssets() {
        return redirectToV12("/api/v12/rwa/assets");
    }

    @GET
    @Path("/rwa/{id}")
    public Response getRwaAsset(@PathParam("id") String id) {
        return redirectToV12("/api/v12/rwa/assets/" + id);
    }

    @POST
    @Path("/rwa/register")
    public Response registerRwa(String body) {
        return redirectToV12("/api/v12/rwa/register");
    }

    @PUT
    @Path("/rwa/update")
    public Response updateRwa(String body) {
        return redirectToV12("/api/v12/rwa/update");
    }

    // ============================================================
    // Consensus Endpoints
    // ============================================================

    @GET
    @Path("/consensus/status")
    public Response getConsensusStatus() {
        return redirectToV12("/api/v12/consensus/status");
    }

    @GET
    @Path("/consensus/stats")
    public Response getConsensusStats() {
        return redirectToV12("/api/v12/consensus/stats");
    }

    @GET
    @Path("/consensus/metrics")
    public Response getConsensusMetrics() {
        return redirectToV12("/api/v12/consensus/metrics");
    }

    @GET
    @Path("/consensus/state")
    public Response getConsensusState() {
        return redirectToV12("/api/v12/consensus/state");
    }

    // ============================================================
    // Analytics Endpoints
    // ============================================================

    @GET
    @Path("/analytics/dashboard")
    public Response getAnalyticsDashboard() {
        return redirectToV12("/api/v12/analytics/dashboard");
    }

    @GET
    @Path("/analytics/trends")
    public Response getAnalyticsTrends() {
        return redirectToV12("/api/v12/analytics/trends");
    }

    @GET
    @Path("/analytics/predict")
    public Response getAnalyticsPredictions() {
        return redirectToV12("/api/v12/analytics/predictions");
    }

    @GET
    @Path("/analytics/forecast")
    public Response getAnalyticsForecast() {
        return redirectToV12("/api/v12/analytics/forecast");
    }

    @GET
    @Path("/analytics/anomalies")
    public Response getAnalyticsAnomalies() {
        return redirectToV12("/api/v12/analytics/anomalies");
    }

    // ============================================================
    // Staking Endpoints
    // ============================================================

    @GET
    @Path("/staking/positions")
    public Response getStakingPositions() {
        return redirectToV12("/api/v12/staking/positions");
    }

    @GET
    @Path("/staking/rewards")
    public Response getStakingRewards() {
        return redirectToV12("/api/v12/staking/rewards");
    }

    @POST
    @Path("/staking/stake")
    public Response stake(String body) {
        return redirectToV12("/api/v12/staking/stake");
    }

    @POST
    @Path("/staking/unstake")
    public Response unstake(String body) {
        return redirectToV12("/api/v12/staking/unstake");
    }

    @POST
    @Path("/staking/delegate")
    public Response delegate(String body) {
        return redirectToV12("/api/v12/staking/delegate");
    }

    @POST
    @Path("/staking/undelegate")
    public Response undelegate(String body) {
        return redirectToV12("/api/v12/staking/undelegate");
    }

    // ============================================================
    // Security Endpoints
    // ============================================================

    @GET
    @Path("/security/status")
    public Response getSecurityStatus() {
        return redirectToV12("/api/v12/security/status");
    }

    @GET
    @Path("/security/metrics")
    public Response getSecurityMetrics() {
        return redirectToV12("/api/v12/security/metrics");
    }

    @GET
    @Path("/security/vulnerabilities")
    public Response getVulnerabilities() {
        return redirectToV12("/api/v12/security/vulnerabilities");
    }

    @GET
    @Path("/security/audits")
    public Response getSecurityAudits() {
        return redirectToV12("/api/v12/security/audits");
    }

    @POST
    @Path("/security/scan")
    public Response runSecurityScan(String body) {
        return redirectToV12("/api/v12/security/scan");
    }

    @GET
    @Path("/security/quantum/status")
    public Response getQuantumStatus() {
        return redirectToV12("/api/v12/security/quantum/status");
    }

    // ============================================================
    // Bridge Endpoints
    // ============================================================

    @GET
    @Path("/bridge/status")
    public Response getBridgeStatus() {
        return redirectToV12("/api/v12/bridge/status");
    }

    @GET
    @Path("/bridge/chains")
    public Response getBridgeChains() {
        return redirectToV12("/api/v12/bridge/chains");
    }

    @GET
    @Path("/bridge/transfers")
    public Response getBridgeTransfers() {
        return redirectToV12("/api/v12/bridge/transfers");
    }

    @POST
    @Path("/bridge/transfer")
    public Response bridgeTransfer(String body) {
        return redirectToV12("/api/v12/bridge/transfer");
    }

    @GET
    @Path("/bridge/estimate")
    public Response getBridgeEstimate() {
        return redirectToV12("/api/v12/bridge/estimate");
    }

    // ============================================================
    // AI Endpoints
    // ============================================================

    @GET
    @Path("/ai/config")
    public Response getAiConfig() {
        return redirectToV12("/api/v12/ai/config");
    }

    @GET
    @Path("/ai/models")
    public Response getAiModels() {
        return redirectToV12("/api/v12/ai/models");
    }

    @GET
    @Path("/ai/metrics")
    public Response getAiMetrics() {
        return redirectToV12("/api/v12/ai/metrics");
    }

    @POST
    @Path("/ai/optimize")
    public Response aiOptimize(String body) {
        return redirectToV12("/api/v12/ai/optimize");
    }

    @GET
    @Path("/ai/predictions")
    public Response getAiPredictions() {
        return redirectToV12("/api/v12/ai/predictions");
    }

    @GET
    @Path("/ai/recommendations")
    public Response getAiRecommendations() {
        return redirectToV12("/api/v12/ai/recommendations");
    }

    // ============================================================
    // Oracle Endpoints
    // ============================================================

    @GET
    @Path("/oracle/status")
    public Response getOracleStatus() {
        return redirectToV12("/api/v12/oracle/status");
    }

    // ============================================================
    // Network & Infrastructure
    // ============================================================

    @GET
    @Path("/network/topology")
    public Response getNetworkTopology() {
        return redirectToV12("/api/v12/topology");
    }

    @GET
    @Path("/infrastructure/metrics")
    public Response getInfrastructureMetrics() {
        return redirectToV12("/api/v12/infrastructure/metrics");
    }

    // ============================================================
    // Stats & Performance
    // ============================================================

    @GET
    @Path("/stats")
    public Response getStats() {
        return redirectToV12("/api/v12/stats");
    }

    @GET
    @Path("/performance")
    public Response getPerformance() {
        return redirectToV12("/api/v12/performance");
    }

    // ============================================================
    // Login/Auth Endpoints
    // ============================================================

    @POST
    @Path("/login/authenticate")
    public Response authenticate(String body) {
        return redirectToV12("/api/v12/login/authenticate");
    }

    @GET
    @Path("/login/verify")
    public Response verifyLogin() {
        return redirectToV12("/api/v12/login/verify");
    }

    @POST
    @Path("/login/logout")
    public Response logout(String body) {
        return redirectToV12("/api/v12/login/logout");
    }

    @POST
    @Path("/login/refresh")
    public Response refreshToken(String body) {
        return redirectToV12("/api/v12/login/refresh");
    }

    // ============================================================
    // Blockchain Endpoints
    // ============================================================

    @GET
    @Path("/blockchain/blocks")
    public Response getBlockchainBlocks() {
        return redirectToV12("/api/v12/blockchain/blocks");
    }

    @GET
    @Path("/blockchain/transactions")
    public Response getBlockchainTransactions() {
        return redirectToV12("/api/v12/blockchain/transactions");
    }

    @GET
    @Path("/blockchain/chain/info")
    public Response getBlockchainInfo() {
        return redirectToV12("/api/v12/blockchain/info");
    }

    // ============================================================
    // Catch-all for remaining V11 paths
    // ============================================================

    @GET
    @Path("/{path:.*}")
    public Response catchAllGet(@PathParam("path") String path) {
        LOG.infof("V11 redirect (GET): /api/v11/%s -> /api/v12/%s", path, path);
        return redirectToV12("/api/v12/" + path);
    }

    @POST
    @Path("/{path:.*}")
    public Response catchAllPost(@PathParam("path") String path, String body) {
        LOG.infof("V11 redirect (POST): /api/v11/%s -> /api/v12/%s", path, path);
        return redirectToV12("/api/v12/" + path);
    }

    @PUT
    @Path("/{path:.*}")
    public Response catchAllPut(@PathParam("path") String path, String body) {
        LOG.infof("V11 redirect (PUT): /api/v11/%s -> /api/v12/%s", path, path);
        return redirectToV12("/api/v12/" + path);
    }

    @DELETE
    @Path("/{path:.*}")
    public Response catchAllDelete(@PathParam("path") String path) {
        LOG.infof("V11 redirect (DELETE): /api/v11/%s -> /api/v12/%s", path, path);
        return redirectToV12("/api/v12/" + path);
    }

    // ============================================================
    // Helper Method
    // ============================================================

    private Response redirectToV12(String v12Path) {
        // Preserve query parameters
        String queryString = uriInfo.getRequestUri().getRawQuery();
        String fullPath = queryString != null ? v12Path + "?" + queryString : v12Path;

        return Response.status(Response.Status.TEMPORARY_REDIRECT)
                .location(URI.create(fullPath))
                .header("X-Deprecated", "V11 API is deprecated. Use V12 API instead.")
                .header("X-Redirect-To", fullPath)
                .build();
    }
}
