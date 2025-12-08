package io.aurigraph.v11.exchange.grpc;

import io.aurigraph.v11.exchange.CryptoExchangeService;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Exchange gRPC Service Implementation
 *
 * Provides gRPC/HTTP2 streaming for cryptocurrency exchange data.
 * This service will extend the generated Mutiny base class after proto compilation.
 *
 * Note: The proto file at src/main/proto/exchange.proto defines the service contract.
 * The Mutiny classes will be generated during Maven build (mvn compile).
 *
 * For now, this class provides the implementation logic that will be
 * wired to the generated gRPC stubs after proto compilation.
 *
 * @version 1.0.0 (Dec 8, 2025)
 * @author Backend Development Agent (BDA)
 */
@GrpcService
public class ExchangeGrpcService {
    // Note: This class will extend MutinyExchangeServiceGrpc.ExchangeServiceImplBase
    // after proto compilation. The base class is generated from exchange.proto.
    //
    // To compile protos: mvn compile
    // Generated classes will be in: target/generated-sources/protobuf/java/

    private static final Logger LOG = Logger.getLogger(ExchangeGrpcService.class);

    @Inject
    CryptoExchangeService exchangeService;

    // Metrics
    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong streamingClients = new AtomicLong(0);
    private final Instant startTime = Instant.now();

    // Active subscriptions per client
    private final Map<String, List<String>> clientSubscriptions = new ConcurrentHashMap<>();

    // ==========================================================================
    // Implementation Methods (to be wired to gRPC stubs after proto compilation)
    // ==========================================================================

    /**
     * Get ticker data for a trading pair
     * Will implement: rpc GetTicker(TickerRequest) returns (TickerResponse)
     */
    public Uni<ExchangeTickerResult> getTicker(String exchange, String base, String quote) {
        totalRequests.incrementAndGet();
        long startMs = System.currentTimeMillis();
        String pair = base + "/" + quote;

        LOG.debugf("gRPC GetTicker: %s/%s", exchange, pair);

        return exchangeService.fetchTicker(exchange, pair)
            .map(ticker -> new ExchangeTickerResult(
                exchange,
                pair,
                ticker.lastPrice(),
                ticker.bidPrice(),
                ticker.askPrice(),
                ticker.volume24h(),
                ticker.high24h(),
                ticker.low24h(),
                ticker.change24h(),
                ticker.changePercent24h(),
                System.currentTimeMillis(),
                System.currentTimeMillis() - startMs
            ))
            .onFailure().recoverWithItem(e -> {
                LOG.errorf(e, "Failed to fetch ticker for %s/%s", exchange, pair);
                return new ExchangeTickerResult(
                    exchange, pair, 0, 0, 0, 0, 0, 0, 0, 0,
                    System.currentTimeMillis(),
                    System.currentTimeMillis() - startMs
                );
            });
    }

    /**
     * Stream ticker updates
     * Will implement: rpc StreamTickers(TickerStreamRequest) returns (stream TickerData)
     */
    public Multi<ExchangeTickerResult> streamTickers(String exchange, List<String> pairs, int intervalMs) {
        streamingClients.incrementAndGet();
        int interval = intervalMs > 0 ? intervalMs : 1000;

        LOG.infof("gRPC StreamTickers started: %s pairs=%s interval=%dms", exchange, pairs, interval);

        return Multi.createFrom().ticks().every(Duration.ofMillis(interval))
            .onItem().transformToMultiAndMerge(tick ->
                Multi.createFrom().iterable(pairs)
                    .onItem().transform(pair -> generateMockTicker(exchange, pair))
            )
            .onTermination().invoke(() -> {
                streamingClients.decrementAndGet();
                LOG.infof("gRPC StreamTickers ended: %s", exchange);
            });
    }

    /**
     * Stream trade updates
     * Will implement: rpc StreamTrades(TradeStreamRequest) returns (stream TradeData)
     */
    public Multi<ExchangeTradeResult> streamTrades(String exchange, List<String> pairs) {
        streamingClients.incrementAndGet();
        LOG.infof("gRPC StreamTrades started: %s", exchange);

        return Multi.createFrom().ticks().every(Duration.ofMillis(500))
            .onItem().transform(tick -> generateMockTrade(exchange, pairs.get(0)))
            .onTermination().invoke(() -> {
                streamingClients.decrementAndGet();
                LOG.infof("gRPC StreamTrades ended: %s", exchange);
            });
    }

    /**
     * Get service metrics
     * Will implement: rpc GetServiceMetrics(MetricsRequest) returns (MetricsResponse)
     */
    public Uni<ExchangeMetricsResult> getServiceMetrics() {
        totalRequests.incrementAndGet();

        return Uni.createFrom().item(() -> {
            CryptoExchangeService.ExchangeServiceMetrics metrics = exchangeService.getMetrics();
            long uptimeSeconds = Duration.between(startTime, Instant.now()).getSeconds();

            return new ExchangeMetricsResult(
                metrics.messagesReceived(),
                metrics.tickersProcessed(),
                metrics.tradesProcessed(),
                0, // orderBooksProcessed
                metrics.activeConnections(),
                uptimeSeconds,
                metrics.connectionStatus()
            );
        });
    }

    // ==========================================================================
    // Helper Methods
    // ==========================================================================

    private ExchangeTickerResult generateMockTicker(String exchange, String pair) {
        double basePrice = getBasePrice(pair);
        double variation = (Math.random() - 0.5) * 0.02;

        return new ExchangeTickerResult(
            exchange,
            pair,
            basePrice * (1 + variation),
            basePrice * (1 + variation - 0.0001),
            basePrice * (1 + variation + 0.0001),
            Math.random() * 50000 + 10000,
            basePrice * 1.03,
            basePrice * 0.97,
            basePrice * variation,
            variation * 100,
            System.currentTimeMillis(),
            0
        );
    }

    private ExchangeTradeResult generateMockTrade(String exchange, String pair) {
        double basePrice = getBasePrice(pair);

        return new ExchangeTradeResult(
            exchange,
            pair,
            exchange + "-" + System.currentTimeMillis(),
            basePrice * (1 + (Math.random() - 0.5) * 0.001),
            Math.random() * 2 + 0.01,
            Math.random() > 0.5 ? "buy" : "sell",
            System.currentTimeMillis()
        );
    }

    private double getBasePrice(String pair) {
        String base = pair.split("/")[0].toUpperCase();
        return switch (base) {
            case "BTC" -> 97500;
            case "ETH" -> 3850;
            case "BNB" -> 720;
            case "SOL" -> 235;
            case "XRP" -> 2.45;
            case "ADA" -> 1.15;
            case "DOT" -> 9.80;
            case "DOGE" -> 0.42;
            default -> 100;
        };
    }

    // ==========================================================================
    // Result Records (to be replaced by Proto-generated classes after compilation)
    // ==========================================================================

    public record ExchangeTickerResult(
        String exchange,
        String pair,
        double lastPrice,
        double bidPrice,
        double askPrice,
        double volume24h,
        double high24h,
        double low24h,
        double change24h,
        double changePercent24h,
        long timestamp,
        long latencyMs
    ) {}

    public record ExchangeTradeResult(
        String exchange,
        String pair,
        String tradeId,
        double price,
        double amount,
        String side,
        long timestamp
    ) {}

    public record ExchangeMetricsResult(
        long messagesReceived,
        long tickersProcessed,
        long tradesProcessed,
        long orderBooksProcessed,
        int activeConnections,
        long uptimeSeconds,
        Map<String, Boolean> connectionStatus
    ) {}
}
