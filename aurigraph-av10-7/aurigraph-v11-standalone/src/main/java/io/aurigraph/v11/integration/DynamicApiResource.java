package io.aurigraph.v11.integration;

import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

/**
 * Dynamic API Resource
 *
 * REST endpoints for the Settings page to add/manage external APIs.
 * Users can add APIs by providing URL and API keys.
 *
 * Accessible from: https://dlt.aurigraph.io/settings
 *
 * @version 1.0.1 (Dec 8, 2025)
 */
@Path("/api/v12/settings/external-apis")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Blocking  // Required for JTA transactions - runs on worker thread instead of IO thread
public class DynamicApiResource {

    private static final Logger LOG = Logger.getLogger(DynamicApiResource.class);

    @Inject
    DynamicExternalApiService dynamicApiService;

    // ==========================================================================
    // List & Get APIs
    // ==========================================================================

    /**
     * List all configured external APIs
     * GET /api/v12/settings/external-apis
     */
    @GET
    public Response listApis() {
        List<DynamicExternalApiService.DynamicApiConfig> apis = dynamicApiService.getAllApis();
        DynamicExternalApiService.DynamicApiMetrics metrics = dynamicApiService.getMetrics();

        return Response.ok(Map.of(
            "apis", apis.stream()
                .map(api -> Map.of(
                    "id", api.apiId(),
                    "displayName", api.displayName(),
                    "category", api.category(),
                    "apiUrl", api.apiUrl(),
                    "authType", api.authType() != null ? api.authType() : "NONE",
                    "pollIntervalMs", api.pollIntervalMs(),
                    "enabled", api.enabled(),
                    "createdAt", api.createdAt(),
                    "updatedAt", api.updatedAt()
                ))
                .toList(),
            "metrics", metrics,
            "total", apis.size()
        )).build();
    }

    /**
     * Get a specific API configuration
     * GET /api/v12/settings/external-apis/{apiId}
     */
    @GET
    @Path("/{apiId}")
    public Response getApi(@PathParam("apiId") String apiId) {
        DynamicExternalApiService.DynamicApiConfig api = dynamicApiService.getApi(apiId);

        if (api == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "API not found: " + apiId))
                .build();
        }

        return Response.ok(api).build();
    }

    // ==========================================================================
    // Add API (Settings Page)
    // ==========================================================================

    /**
     * Add a new external API
     * POST /api/v12/settings/external-apis
     *
     * Request body:
     * {
     *   "displayName": "My Custom API",
     *   "category": "market-data",
     *   "apiUrl": "https://api.example.com/v1/data",
     *   "apiKey": "your-api-key",
     *   "apiSecret": "optional-api-secret",
     *   "authType": "BEARER",  // BEARER, BASIC, API_KEY, HEADER, NONE
     *   "pollIntervalMs": 5000,
     *   "responseJsonPath": "data.items"  // Optional JSON path to extract data
     * }
     */
    @POST
    public Uni<Response> addApi(AddApiRequestDto request) {
        LOG.infof("Adding new external API: %s", request.displayName());

        // Validate request
        if (request.displayName() == null || request.displayName().isBlank()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "displayName is required"))
                    .build()
            );
        }
        if (request.apiUrl() == null || request.apiUrl().isBlank()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "apiUrl is required"))
                    .build()
            );
        }

        DynamicExternalApiService.AddApiRequest serviceRequest = new DynamicExternalApiService.AddApiRequest(
            request.displayName(),
            request.category() != null ? request.category() : "custom",
            request.apiUrl(),
            request.apiKey(),
            request.apiSecret(),
            request.authType() != null ? request.authType() : "NONE",
            request.pollIntervalMs() > 0 ? request.pollIntervalMs() : 5000,
            request.responseJsonPath(),
            request.headers()
        );

        return dynamicApiService.addApi(serviceRequest)
            .map(config -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "success", true,
                    "message", "API added successfully",
                    "api", config
                ))
                .build()
            )
            .onFailure().recoverWithItem(error -> Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", error.getMessage()))
                .build()
            );
    }

    // ==========================================================================
    // Update API
    // ==========================================================================

    /**
     * Update an existing API configuration
     * PUT /api/v12/settings/external-apis/{apiId}
     */
    @PUT
    @Path("/{apiId}")
    public Uni<Response> updateApi(@PathParam("apiId") String apiId, UpdateApiRequestDto request) {
        LOG.infof("Updating external API: %s", apiId);

        DynamicExternalApiService.UpdateApiRequest serviceRequest = new DynamicExternalApiService.UpdateApiRequest(
            request.displayName(),
            request.category(),
            request.apiUrl(),
            request.apiKey(),
            request.apiSecret(),
            request.authType(),
            request.pollIntervalMs(),
            request.responseJsonPath(),
            request.headers(),
            request.enabled()
        );

        return dynamicApiService.updateApi(apiId, serviceRequest)
            .map(config -> Response.ok(Map.of(
                "success", true,
                "message", "API updated successfully",
                "api", config
            )).build())
            .onFailure().recoverWithItem(error -> Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", error.getMessage()))
                .build()
            );
    }

    // ==========================================================================
    // Enable/Disable API
    // ==========================================================================

    /**
     * Enable an API
     * POST /api/v12/settings/external-apis/{apiId}/enable
     */
    @POST
    @Path("/{apiId}/enable")
    public Uni<Response> enableApi(@PathParam("apiId") String apiId) {
        return dynamicApiService.setEnabled(apiId, true)
            .map(success -> {
                if (success) {
                    dynamicApiService.startPolling(apiId);
                    return Response.ok(Map.of(
                        "success", true,
                        "message", "API enabled",
                        "apiId", apiId
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "API not found: " + apiId))
                        .build();
                }
            });
    }

    /**
     * Disable an API
     * POST /api/v12/settings/external-apis/{apiId}/disable
     */
    @POST
    @Path("/{apiId}/disable")
    public Uni<Response> disableApi(@PathParam("apiId") String apiId) {
        return dynamicApiService.setEnabled(apiId, false)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", "API disabled",
                        "apiId", apiId
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "API not found: " + apiId))
                        .build();
                }
            });
    }

    // ==========================================================================
    // Delete API
    // ==========================================================================

    /**
     * Delete an external API
     * DELETE /api/v12/settings/external-apis/{apiId}
     */
    @DELETE
    @Path("/{apiId}")
    public Uni<Response> deleteApi(@PathParam("apiId") String apiId) {
        LOG.infof("Deleting external API: %s", apiId);

        return dynamicApiService.removeApi(apiId)
            .map(success -> {
                if (success) {
                    return Response.ok(Map.of(
                        "success", true,
                        "message", "API deleted",
                        "apiId", apiId
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "API not found: " + apiId))
                        .build();
                }
            });
    }

    // ==========================================================================
    // Test API Connection
    // ==========================================================================

    /**
     * Test an API connection before saving
     * POST /api/v12/settings/external-apis/test
     */
    @POST
    @Path("/test")
    public Uni<Response> testApiConnection(TestApiRequestDto request) {
        LOG.infof("Testing API connection: %s", request.apiUrl());

        if (request.apiUrl() == null || request.apiUrl().isBlank()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "apiUrl is required"))
                    .build()
            );
        }

        return dynamicApiService.testApi(request.apiUrl(), request.apiKey(), request.authType())
            .map(result -> Response.ok(Map.of(
                "success", result.success(),
                "statusCode", result.statusCode(),
                "message", result.message(),
                "timestamp", result.timestamp()
            )).build())
            .onFailure().recoverWithItem(error -> Response.ok(Map.of(
                "success", false,
                "statusCode", 0,
                "message", "Connection failed: " + error.getMessage(),
                "timestamp", System.currentTimeMillis()
            )).build());
    }

    // ==========================================================================
    // Predefined API Templates
    // ==========================================================================

    /**
     * Get available API templates for quick setup
     * GET /api/v12/settings/external-apis/templates
     */
    @GET
    @Path("/templates")
    public Response getApiTemplates() {
        List<ApiTemplate> templates = List.of(
            // Crypto Exchanges
            new ApiTemplate("binance", "Binance Exchange", "crypto-exchange",
                "https://api.binance.com/api/v3/ticker/24hr", "API_KEY",
                "Real-time cryptocurrency market data from Binance"),
            new ApiTemplate("coinbase", "Coinbase Pro", "crypto-exchange",
                "https://api.exchange.coinbase.com/products", "BEARER",
                "Cryptocurrency market data from Coinbase Pro"),
            new ApiTemplate("kraken", "Kraken Exchange", "crypto-exchange",
                "https://api.kraken.com/0/public/Ticker", "NONE",
                "Public ticker data from Kraken"),

            // Trading Platforms
            new ApiTemplate("quantconnect", "QuantConnect", "trading-platform",
                "https://www.quantconnect.com/api/v2", "BASIC",
                "Algorithmic trading platform for backtesting and live trading"),
            new ApiTemplate("alpaca", "Alpaca Markets", "trading-platform",
                "https://api.alpaca.markets/v2", "HEADER",
                "Commission-free stock trading API"),
            new ApiTemplate("interactivebrokers", "Interactive Brokers", "trading-platform",
                "https://api.ibkr.com/v1/api", "BEARER",
                "Professional trading platform"),

            // Market Data Providers
            new ApiTemplate("polygon", "Polygon.io", "market-data",
                "https://api.polygon.io/v2", "API_KEY",
                "Stock, forex, and crypto market data"),
            new ApiTemplate("alphavantage", "Alpha Vantage", "market-data",
                "https://www.alphavantage.co/query", "API_KEY",
                "Free stock API for technical indicators"),
            new ApiTemplate("finnhub", "Finnhub", "market-data",
                "https://finnhub.io/api/v1", "API_KEY",
                "Real-time stock, forex, and crypto data"),

            // News & Sentiment
            new ApiTemplate("newsapi", "NewsAPI", "news",
                "https://newsapi.org/v2", "API_KEY",
                "Financial news aggregator"),

            // DeFi & Blockchain
            new ApiTemplate("coingecko", "CoinGecko", "defi",
                "https://api.coingecko.com/api/v3", "NONE",
                "Cryptocurrency prices and DeFi data"),
            new ApiTemplate("defillama", "DefiLlama", "defi",
                "https://api.llama.fi", "NONE",
                "DeFi TVL and protocol data")
        );

        return Response.ok(Map.of(
            "templates", templates,
            "total", templates.size()
        )).build();
    }

    // ==========================================================================
    // DTOs
    // ==========================================================================

    public record AddApiRequestDto(
        String displayName,
        String category,
        String apiUrl,
        String apiKey,
        String apiSecret,
        String authType,
        long pollIntervalMs,
        String responseJsonPath,
        Map<String, String> headers
    ) {}

    public record UpdateApiRequestDto(
        String displayName,
        String category,
        String apiUrl,
        String apiKey,
        String apiSecret,
        String authType,
        Long pollIntervalMs,
        String responseJsonPath,
        Map<String, String> headers,
        Boolean enabled
    ) {}

    public record TestApiRequestDto(
        String apiUrl,
        String apiKey,
        String authType
    ) {}

    public record ApiTemplate(
        String id,
        String displayName,
        String category,
        String apiUrl,
        String authType,
        String description
    ) {}
}
