package io.aurigraph.v11.exchange;

import io.aurigraph.v11.exchange.CryptoExchangeService.ExchangeTickerData;
import io.aurigraph.v11.exchange.CryptoExchangeService.ExchangeServiceMetrics;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Crypto Exchange REST API Resource
 *
 * Provides REST endpoints for accessing cryptocurrency exchange data
 * and managing exchange connections for External Integration (EI) Node integration.
 *
 * Endpoints:
 * - GET /api/v12/exchanges - List supported exchanges
 * - GET /api/v12/exchanges/{exchange}/ticker/{pair} - Get ticker data
 * - GET /api/v12/exchanges/status - Get connection status
 * - GET /api/v12/exchanges/metrics - Get service metrics
 * - POST /api/v12/exchanges/{exchange}/connect - Connect to exchange
 * - POST /api/v12/exchanges/{exchange}/disconnect - Disconnect from exchange
 *
 * @version 1.0.0 (Dec 8, 2025)
 * @author Backend Development Agent (BDA)
 */
@Path("/api/v12/exchanges")
@ApplicationScoped
@PermitAll
@Produces(MediaType.APPLICATION_JSON)
public class CryptoExchangeResource {

    private static final Logger LOG = Logger.getLogger(CryptoExchangeResource.class);

    @Inject
    CryptoExchangeService exchangeService;

    // Supported exchanges
    private static final Set<String> SUPPORTED_EXCHANGES = Set.of(
        "binance", "coinbase", "kraken", "okx", "bybit", "huobi"
    );

    // Default trading pairs for quick access
    private static final List<String> DEFAULT_PAIRS = List.of(
        "BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT"
    );

    /**
     * List supported exchanges
     *
     * GET /api/v12/exchanges
     */
    @GET
    public Response listExchanges() {
        return Response.ok(new ExchangeListResponse(
            SUPPORTED_EXCHANGES.stream().toList(),
            DEFAULT_PAIRS,
            "Available cryptocurrency exchanges for real-time data streaming"
        )).build();
    }

    /**
     * Get ticker data for a trading pair from an exchange
     *
     * GET /api/v12/exchanges/{exchange}/ticker/{pair}
     * Example: GET /api/v12/exchanges/binance/ticker/BTC-USDT
     */
    @GET
    @Path("/{exchange}/ticker/{pair}")
    public Uni<Response> getTicker(
            @PathParam("exchange") String exchange,
            @PathParam("pair") String pair) {

        String normalizedExchange = exchange.toLowerCase();
        String normalizedPair = pair.replace("-", "/").toUpperCase();

        if (!SUPPORTED_EXCHANGES.contains(normalizedExchange)) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Unsupported exchange: " + exchange + ". Supported: " + SUPPORTED_EXCHANGES))
                    .build()
            );
        }

        LOG.debugf("Fetching ticker for %s/%s", normalizedExchange, normalizedPair);

        return exchangeService.fetchTicker(normalizedExchange, normalizedPair)
            .map(ticker -> Response.ok(ticker).build())
            .onFailure().recoverWithItem(e -> {
                LOG.errorf(e, "Failed to fetch ticker for %s/%s", normalizedExchange, normalizedPair);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to fetch ticker: " + e.getMessage()))
                    .build();
            });
    }

    /**
     * Get ticker data for multiple pairs from an exchange
     *
     * GET /api/v12/exchanges/{exchange}/tickers?pairs=BTC-USDT,ETH-USDT
     */
    @GET
    @Path("/{exchange}/tickers")
    public Uni<Response> getMultipleTickers(
            @PathParam("exchange") String exchange,
            @QueryParam("pairs") @DefaultValue("BTC-USDT,ETH-USDT") String pairsParam) {

        String normalizedExchange = exchange.toLowerCase();
        List<String> pairs = Arrays.stream(pairsParam.split(","))
            .map(p -> p.replace("-", "/").toUpperCase().trim())
            .toList();

        if (!SUPPORTED_EXCHANGES.contains(normalizedExchange)) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Unsupported exchange: " + exchange))
                    .build()
            );
        }

        // Fetch all tickers in parallel
        return Uni.join().all(
            pairs.stream()
                .map(pair -> exchangeService.fetchTicker(normalizedExchange, pair)
                    .onFailure().recoverWithItem(e -> null))
                .toList()
        ).andCollectFailures()
        .map(tickers -> {
            List<ExchangeTickerData> validTickers = tickers.stream()
                .filter(t -> t != null)
                .map(t -> (ExchangeTickerData) t)
                .toList();
            return Response.ok(new MultiTickerResponse(normalizedExchange, validTickers)).build();
        });
    }

    /**
     * Get connection status for all exchanges
     *
     * GET /api/v12/exchanges/status
     */
    @GET
    @Path("/status")
    public Response getStatus() {
        Map<String, Boolean> status = exchangeService.getConnectionStatus();
        return Response.ok(new StatusResponse(status, SUPPORTED_EXCHANGES.size())).build();
    }

    /**
     * Get service metrics
     *
     * GET /api/v12/exchanges/metrics
     */
    @GET
    @Path("/metrics")
    public Response getMetrics() {
        ExchangeServiceMetrics metrics = exchangeService.getMetrics();
        return Response.ok(metrics).build();
    }

    /**
     * Connect to an exchange for streaming
     *
     * POST /api/v12/exchanges/{exchange}/connect
     * Body: { "pairs": ["BTC/USDT", "ETH/USDT"] }
     */
    @POST
    @Path("/{exchange}/connect")
    @Consumes(MediaType.APPLICATION_JSON)
    public Uni<Response> connectToExchange(
            @PathParam("exchange") String exchange,
            ConnectRequest request) {

        String normalizedExchange = exchange.toLowerCase();

        if (!SUPPORTED_EXCHANGES.contains(normalizedExchange)) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Unsupported exchange: " + exchange))
                    .build()
            );
        }

        List<String> pairs = request.pairs() != null && !request.pairs().isEmpty()
            ? request.pairs()
            : DEFAULT_PAIRS;

        LOG.infof("Connecting to %s with pairs: %s", normalizedExchange, pairs);

        return exchangeService.connectToExchange(normalizedExchange, pairs)
            .map(connected -> {
                if (connected) {
                    return Response.ok(new SuccessResponse(
                        "Connected to " + normalizedExchange,
                        Map.of("exchange", normalizedExchange, "pairs", pairs)
                    )).build();
                } else {
                    return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                        .entity(new ErrorResponse("Failed to connect to " + normalizedExchange))
                        .build();
                }
            });
    }

    /**
     * Disconnect from an exchange
     *
     * POST /api/v12/exchanges/{exchange}/disconnect
     */
    @POST
    @Path("/{exchange}/disconnect")
    public Response disconnectFromExchange(@PathParam("exchange") String exchange) {
        String normalizedExchange = exchange.toLowerCase();

        if (!SUPPORTED_EXCHANGES.contains(normalizedExchange)) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Unsupported exchange: " + exchange))
                .build();
        }

        exchangeService.disconnectFromExchange(normalizedExchange);
        LOG.infof("Disconnected from %s", normalizedExchange);

        return Response.ok(new SuccessResponse(
            "Disconnected from " + normalizedExchange,
            Map.of("exchange", normalizedExchange)
        )).build();
    }

    /**
     * Get exchange info (available pairs, fees, etc.)
     *
     * GET /api/v12/exchanges/{exchange}/info
     */
    @GET
    @Path("/{exchange}/info")
    public Response getExchangeInfo(@PathParam("exchange") String exchange) {
        String normalizedExchange = exchange.toLowerCase();

        if (!SUPPORTED_EXCHANGES.contains(normalizedExchange)) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Unsupported exchange: " + exchange))
                .build();
        }

        // Return exchange-specific info
        ExchangeInfo info = getExchangeInfoData(normalizedExchange);
        return Response.ok(info).build();
    }

    private ExchangeInfo getExchangeInfoData(String exchange) {
        return switch (exchange) {
            case "binance" -> new ExchangeInfo(
                "binance",
                "Binance",
                "https://api.binance.com",
                "wss://stream.binance.com:9443/ws",
                List.of("BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT", "DOGE/USDT"),
                0.1, // Maker fee %
                0.1, // Taker fee %
                true, // WebSocket available
                true  // REST available
            );
            case "coinbase" -> new ExchangeInfo(
                "coinbase",
                "Coinbase Pro",
                "https://api.exchange.coinbase.com",
                "wss://ws-feed.exchange.coinbase.com",
                List.of("BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "ADA/USD"),
                0.4,
                0.6,
                true,
                true
            );
            case "kraken" -> new ExchangeInfo(
                "kraken",
                "Kraken",
                "https://api.kraken.com",
                "wss://ws.kraken.com",
                List.of("BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "DOT/USD"),
                0.16,
                0.26,
                true,
                true
            );
            case "okx" -> new ExchangeInfo(
                "okx",
                "OKX",
                "https://www.okx.com/api/v5",
                "wss://ws.okx.com:8443/ws/v5/public",
                List.of("BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT"),
                0.08,
                0.1,
                true,
                true
            );
            case "bybit" -> new ExchangeInfo(
                "bybit",
                "Bybit",
                "https://api.bybit.com/v5",
                "wss://stream.bybit.com/v5/public/spot",
                List.of("BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT"),
                0.1,
                0.1,
                true,
                true
            );
            default -> new ExchangeInfo(
                exchange,
                exchange,
                "",
                "",
                List.of(),
                0,
                0,
                false,
                false
            );
        };
    }

    // ==========================================================================
    // Response DTOs
    // ==========================================================================

    public record ExchangeListResponse(
        List<String> exchanges,
        List<String> defaultPairs,
        String description
    ) {}

    public record MultiTickerResponse(
        String exchange,
        List<ExchangeTickerData> tickers
    ) {}

    public record StatusResponse(
        Map<String, Boolean> connections,
        int totalExchanges
    ) {}

    public record ConnectRequest(
        List<String> pairs
    ) {}

    public record SuccessResponse(
        String message,
        Map<String, Object> data
    ) {}

    public record ErrorResponse(String error) {}

    public record ExchangeInfo(
        String id,
        String name,
        String restEndpoint,
        String wsEndpoint,
        List<String> popularPairs,
        double makerFeePercent,
        double takerFeePercent,
        boolean wsAvailable,
        boolean restAvailable
    ) {}
}
