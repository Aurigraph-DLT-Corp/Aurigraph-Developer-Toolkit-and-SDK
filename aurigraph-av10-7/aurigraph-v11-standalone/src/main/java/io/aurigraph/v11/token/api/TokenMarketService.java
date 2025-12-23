package io.aurigraph.v11.token.api;

import io.aurigraph.v11.contracts.models.AssetType;
import io.aurigraph.v11.token.hybrid.HybridTokenService;
import io.aurigraph.v11.token.hybrid.HybridTokenService.*;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * TokenMarketService - Primary and Secondary market operations for hybrid tokens.
 *
 * Provides comprehensive market functionality:
 * - Primary market: Token issuance, offerings, allocations
 * - Secondary market: Trading, order book, matching
 * - Search, filter, sort, and pagination APIs
 * - Price discovery and market data
 * - Liquidity management
 *
 * @author Aurigraph V12 Token Team
 * @version 1.0
 * @since Sprint 12-13
 */
@ApplicationScoped
public class TokenMarketService {

    @Inject
    HybridTokenService hybridTokenService;

    // Primary market offerings: offeringId -> TokenOffering
    private final Map<String, TokenOffering> primaryOfferings = new ConcurrentHashMap<>();

    // Secondary market orders: orderId -> Order
    private final Map<String, Order> orders = new ConcurrentHashMap<>();

    // Order book by token: tokenId -> OrderBook
    private final Map<String, OrderBook> orderBooks = new ConcurrentHashMap<>();

    // Trade history: tradeId -> Trade
    private final Map<String, Trade> trades = new ConcurrentHashMap<>();

    // Market data: tokenId -> MarketData
    private final Map<String, MarketData> marketData = new ConcurrentHashMap<>();

    // ==========================================
    // PRIMARY MARKET OPERATIONS
    // ==========================================

    /**
     * Create a new primary market token offering.
     *
     * @param request Offering creation request
     * @return Created token offering
     */
    public Uni<TokenOffering> createOffering(CreateOfferingRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Creating primary offering for token %s", request.tokenId());

            String offeringId = generateOfferingId();

            TokenOffering offering = new TokenOffering(
                    offeringId,
                    request.tokenId(),
                    request.offeringType(),
                    request.name(),
                    request.description(),
                    request.pricePerToken(),
                    request.minInvestment(),
                    request.maxInvestment(),
                    request.softCap(),
                    request.hardCap(),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    0,
                    request.startDate(),
                    request.endDate(),
                    request.vestingSchedule(),
                    request.eligibilityCriteria(),
                    OfferingStatus.DRAFT,
                    request.issuer(),
                    Instant.now(),
                    null,
                    request.metadata()
            );

            primaryOfferings.put(offeringId, offering);

            Log.infof("Created offering %s with hard cap %s", offeringId, request.hardCap());

            return offering;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Activate a primary offering (make it live).
     */
    public Uni<TokenOffering> activateOffering(String offeringId, String issuer) {
        return Uni.createFrom().item(() -> {
            TokenOffering offering = getOfferingOrThrow(offeringId);

            if (!offering.issuer().equals(issuer)) {
                throw new MarketException("Only issuer can activate offering");
            }

            TokenOffering activated = offering.withStatus(OfferingStatus.ACTIVE);
            primaryOfferings.put(offeringId, activated);

            Log.infof("Offering %s activated", offeringId);

            return activated;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Subscribe to a primary offering (invest).
     */
    public Uni<Subscription> subscribeToOffering(SubscriptionRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Processing subscription to offering %s by %s for %s",
                    request.offeringId(), request.investor(), request.amount());

            TokenOffering offering = getOfferingOrThrow(request.offeringId());

            // Validate offering is active
            if (offering.status() != OfferingStatus.ACTIVE) {
                throw new MarketException("Offering is not active");
            }

            // Validate timing
            Instant now = Instant.now();
            if (now.isBefore(offering.startDate()) || now.isAfter(offering.endDate())) {
                throw new MarketException("Offering is not currently open");
            }

            // Validate investment amount
            if (request.amount().compareTo(offering.minInvestment()) < 0) {
                throw new MarketException("Investment below minimum: " + offering.minInvestment());
            }
            if (request.amount().compareTo(offering.maxInvestment()) > 0) {
                throw new MarketException("Investment exceeds maximum: " + offering.maxInvestment());
            }

            // Check hard cap
            BigDecimal newTotal = offering.amountRaised().add(request.amount());
            if (newTotal.compareTo(offering.hardCap()) > 0) {
                throw new MarketException("Subscription would exceed hard cap");
            }

            // Calculate tokens to allocate
            BigDecimal tokensAllocated = request.amount()
                    .divide(offering.pricePerToken(), 8, RoundingMode.DOWN);

            String subscriptionId = generateSubscriptionId();

            Subscription subscription = new Subscription(
                    subscriptionId,
                    request.offeringId(),
                    offering.tokenId(),
                    request.investor(),
                    request.amount(),
                    tokensAllocated,
                    offering.pricePerToken(),
                    SubscriptionStatus.PENDING,
                    Instant.now(),
                    null,
                    null
            );

            // Update offering
            TokenOffering updated = new TokenOffering(
                    offering.offeringId(),
                    offering.tokenId(),
                    offering.offeringType(),
                    offering.name(),
                    offering.description(),
                    offering.pricePerToken(),
                    offering.minInvestment(),
                    offering.maxInvestment(),
                    offering.softCap(),
                    offering.hardCap(),
                    newTotal,
                    offering.tokensAllocated().add(tokensAllocated),
                    offering.investorCount() + 1,
                    offering.startDate(),
                    offering.endDate(),
                    offering.vestingSchedule(),
                    offering.eligibilityCriteria(),
                    offering.status(),
                    offering.issuer(),
                    offering.createdAt(),
                    offering.closedAt(),
                    offering.metadata()
            );

            primaryOfferings.put(request.offeringId(), updated);

            Log.infof("Subscription %s created: %s tokens for %s",
                    subscriptionId, tokensAllocated, request.amount());

            return subscription;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Close a primary offering.
     */
    public Uni<TokenOffering> closeOffering(String offeringId, String issuer) {
        return Uni.createFrom().item(() -> {
            TokenOffering offering = getOfferingOrThrow(offeringId);

            if (!offering.issuer().equals(issuer)) {
                throw new MarketException("Only issuer can close offering");
            }

            OfferingStatus newStatus = offering.amountRaised().compareTo(offering.softCap()) >= 0 ?
                    OfferingStatus.SUCCESSFUL : OfferingStatus.FAILED;

            TokenOffering closed = new TokenOffering(
                    offering.offeringId(),
                    offering.tokenId(),
                    offering.offeringType(),
                    offering.name(),
                    offering.description(),
                    offering.pricePerToken(),
                    offering.minInvestment(),
                    offering.maxInvestment(),
                    offering.softCap(),
                    offering.hardCap(),
                    offering.amountRaised(),
                    offering.tokensAllocated(),
                    offering.investorCount(),
                    offering.startDate(),
                    offering.endDate(),
                    offering.vestingSchedule(),
                    offering.eligibilityCriteria(),
                    newStatus,
                    offering.issuer(),
                    offering.createdAt(),
                    Instant.now(),
                    offering.metadata()
            );

            primaryOfferings.put(offeringId, closed);

            Log.infof("Offering %s closed with status %s, raised %s",
                    offeringId, newStatus, offering.amountRaised());

            return closed;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // SECONDARY MARKET OPERATIONS
    // ==========================================

    /**
     * Place a buy or sell order.
     */
    public Uni<Order> placeOrder(PlaceOrderRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Placing %s order for %s %s at %s",
                    request.orderSide(), request.quantity(), request.tokenId(), request.price());

            String orderId = generateOrderId();

            Order order = new Order(
                    orderId,
                    request.tokenId(),
                    request.trader(),
                    request.orderType(),
                    request.orderSide(),
                    request.price(),
                    request.quantity(),
                    BigDecimal.ZERO,
                    request.timeInForce(),
                    OrderStatus.OPEN,
                    Instant.now(),
                    null,
                    request.expiresAt()
            );

            orders.put(orderId, order);

            // Add to order book
            OrderBook book = orderBooks.computeIfAbsent(request.tokenId(), k -> new OrderBook(
                    request.tokenId(),
                    new ArrayList<>(),
                    new ArrayList<>(),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    Instant.now()
            ));

            // Try to match order
            List<Trade> matchedTrades = matchOrder(order, book);

            // Update market data
            updateMarketData(request.tokenId(), matchedTrades);

            Log.infof("Order %s placed, %d trades executed", orderId, matchedTrades.size());

            return orders.get(orderId);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Cancel an open order.
     */
    public Uni<Order> cancelOrder(String orderId, String trader) {
        return Uni.createFrom().item(() -> {
            Order order = orders.get(orderId);
            if (order == null) {
                throw new MarketException("Order not found: " + orderId);
            }

            if (!order.trader().equals(trader)) {
                throw new MarketException("Only order owner can cancel");
            }

            if (order.status() != OrderStatus.OPEN && order.status() != OrderStatus.PARTIALLY_FILLED) {
                throw new MarketException("Order cannot be cancelled");
            }

            Order cancelled = order.withStatus(OrderStatus.CANCELLED);
            orders.put(orderId, cancelled);

            Log.infof("Order %s cancelled", orderId);

            return cancelled;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get order book for a token.
     */
    public Uni<OrderBook> getOrderBook(String tokenId, int depth) {
        return Uni.createFrom().item(() -> {
            OrderBook book = orderBooks.get(tokenId);
            if (book == null) {
                return new OrderBook(tokenId, Collections.emptyList(), Collections.emptyList(),
                        BigDecimal.ZERO, BigDecimal.ZERO, Instant.now());
            }

            // Limit depth
            List<OrderBookEntry> bids = book.bids().stream().limit(depth).collect(Collectors.toList());
            List<OrderBookEntry> asks = book.asks().stream().limit(depth).collect(Collectors.toList());

            return new OrderBook(tokenId, bids, asks, book.bestBid(), book.bestAsk(), book.updatedAt());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get market data for a token.
     */
    public Uni<MarketData> getMarketData(String tokenId) {
        return Uni.createFrom().item(() -> {
            MarketData data = marketData.get(tokenId);
            if (data == null) {
                return new MarketData(
                        tokenId,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        0,
                        Instant.now()
                );
            }
            return data;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // SEARCH, FILTER, SORT, PAGINATION
    // ==========================================

    /**
     * Search tokens with filtering, sorting, and pagination.
     */
    public Uni<TokenSearchResult> searchTokens(TokenSearchQuery query) {
        return hybridTokenService.getAllTokens()
                .map(tokens -> {
                    List<HybridToken> filtered = tokens.stream()
                            // Filter by name/symbol
                            .filter(t -> query.keyword() == null || query.keyword().isEmpty() ||
                                    t.name().toLowerCase().contains(query.keyword().toLowerCase()) ||
                                    t.symbol().toLowerCase().contains(query.keyword().toLowerCase()))
                            // Filter by asset type
                            .filter(t -> query.assetTypes() == null || query.assetTypes().isEmpty() ||
                                    query.assetTypes().contains(t.assetType()))
                            // Filter by status
                            .filter(t -> query.statuses() == null || query.statuses().isEmpty() ||
                                    query.statuses().contains(t.status()))
                            // Filter by jurisdiction
                            .filter(t -> query.jurisdiction() == null || query.jurisdiction().isEmpty() ||
                                    query.jurisdiction().equals(t.jurisdiction()))
                            // Filter by issuer
                            .filter(t -> query.issuerId() == null || query.issuerId().isEmpty() ||
                                    query.issuerId().equals(t.issuer()))
                            // Filter by compliance framework
                            .filter(t -> query.complianceFramework() == null ||
                                    query.complianceFramework().isEmpty() ||
                                    query.complianceFramework().equals(t.complianceFramework()))
                            .collect(Collectors.toList());

                    // Sort
                    Comparator<HybridToken> comparator = switch (query.sortBy()) {
                        case NAME -> Comparator.comparing(HybridToken::name);
                        case SYMBOL -> Comparator.comparing(HybridToken::symbol);
                        case TOTAL_SUPPLY -> Comparator.comparing(HybridToken::totalSupply);
                        case MINTED_SUPPLY -> Comparator.comparing(HybridToken::mintedSupply);
                        case CREATED_AT -> Comparator.comparing(HybridToken::createdAt);
                        default -> Comparator.comparing(HybridToken::createdAt);
                    };

                    if (!query.sortAscending()) {
                        comparator = comparator.reversed();
                    }

                    List<HybridToken> sorted = filtered.stream()
                            .sorted(comparator)
                            .collect(Collectors.toList());

                    // Paginate
                    int totalCount = sorted.size();
                    int startIndex = query.page() * query.pageSize();
                    int endIndex = Math.min(startIndex + query.pageSize(), totalCount);

                    List<HybridToken> paged = startIndex < totalCount ?
                            sorted.subList(startIndex, endIndex) : Collections.emptyList();

                    return new TokenSearchResult(
                            paged,
                            totalCount,
                            query.page(),
                            query.pageSize(),
                            (int) Math.ceil((double) totalCount / query.pageSize()),
                            Instant.now()
                    );
                });
    }

    /**
     * Search offerings with filtering and pagination.
     */
    public Uni<OfferingSearchResult> searchOfferings(OfferingSearchQuery query) {
        return Uni.createFrom().item(() -> {
            List<TokenOffering> filtered = primaryOfferings.values().stream()
                    // Filter by token
                    .filter(o -> query.tokenId() == null || query.tokenId().equals(o.tokenId()))
                    // Filter by status
                    .filter(o -> query.statuses() == null || query.statuses().isEmpty() ||
                            query.statuses().contains(o.status()))
                    // Filter by offering type
                    .filter(o -> query.offeringType() == null || query.offeringType() == o.offeringType())
                    // Filter by issuer
                    .filter(o -> query.issuerId() == null || query.issuerId().equals(o.issuer()))
                    // Filter by date range
                    .filter(o -> query.fromDate() == null || !o.startDate().isBefore(query.fromDate()))
                    .filter(o -> query.toDate() == null || !o.endDate().isAfter(query.toDate()))
                    .collect(Collectors.toList());

            // Sort
            Comparator<TokenOffering> comparator = switch (query.sortBy()) {
                case NAME -> Comparator.comparing(TokenOffering::name);
                case CREATED_AT -> Comparator.comparing(TokenOffering::createdAt);
                case AMOUNT_RAISED -> Comparator.comparing(TokenOffering::amountRaised);
                case END_DATE -> Comparator.comparing(TokenOffering::endDate);
                default -> Comparator.comparing(TokenOffering::createdAt);
            };

            if (!query.sortAscending()) {
                comparator = comparator.reversed();
            }

            List<TokenOffering> sorted = filtered.stream()
                    .sorted(comparator)
                    .collect(Collectors.toList());

            // Paginate
            int totalCount = sorted.size();
            int startIndex = query.page() * query.pageSize();
            int endIndex = Math.min(startIndex + query.pageSize(), totalCount);

            List<TokenOffering> paged = startIndex < totalCount ?
                    sorted.subList(startIndex, endIndex) : Collections.emptyList();

            return new OfferingSearchResult(
                    paged,
                    totalCount,
                    query.page(),
                    query.pageSize(),
                    (int) Math.ceil((double) totalCount / query.pageSize()),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Search trades with filtering and pagination.
     */
    public Uni<TradeSearchResult> searchTrades(TradeSearchQuery query) {
        return Uni.createFrom().item(() -> {
            List<Trade> filtered = trades.values().stream()
                    // Filter by token
                    .filter(t -> query.tokenId() == null || query.tokenId().equals(t.tokenId()))
                    // Filter by trader
                    .filter(t -> query.traderId() == null ||
                            query.traderId().equals(t.buyerId()) ||
                            query.traderId().equals(t.sellerId()))
                    // Filter by date range
                    .filter(t -> query.fromDate() == null || !t.timestamp().isBefore(query.fromDate()))
                    .filter(t -> query.toDate() == null || !t.timestamp().isAfter(query.toDate()))
                    // Filter by minimum value
                    .filter(t -> query.minValue() == null ||
                            t.price().multiply(t.quantity()).compareTo(query.minValue()) >= 0)
                    .collect(Collectors.toList());

            // Sort
            Comparator<Trade> comparator = Comparator.comparing(Trade::timestamp);
            if (!query.sortAscending()) {
                comparator = comparator.reversed();
            }

            List<Trade> sorted = filtered.stream()
                    .sorted(comparator)
                    .collect(Collectors.toList());

            // Paginate
            int totalCount = sorted.size();
            int startIndex = query.page() * query.pageSize();
            int endIndex = Math.min(startIndex + query.pageSize(), totalCount);

            List<Trade> paged = startIndex < totalCount ?
                    sorted.subList(startIndex, endIndex) : Collections.emptyList();

            // Calculate aggregates
            BigDecimal totalVolume = filtered.stream()
                    .map(t -> t.price().multiply(t.quantity()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return new TradeSearchResult(
                    paged,
                    totalCount,
                    query.page(),
                    query.pageSize(),
                    (int) Math.ceil((double) totalCount / query.pageSize()),
                    totalVolume,
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private TokenOffering getOfferingOrThrow(String offeringId) {
        TokenOffering offering = primaryOfferings.get(offeringId);
        if (offering == null) {
            throw new MarketException("Offering not found: " + offeringId);
        }
        return offering;
    }

    private List<Trade> matchOrder(Order order, OrderBook book) {
        List<Trade> executedTrades = new ArrayList<>();
        // Simplified matching - in production would use proper order matching engine
        return executedTrades;
    }

    private void updateMarketData(String tokenId, List<Trade> newTrades) {
        if (newTrades.isEmpty()) return;

        MarketData existing = marketData.get(tokenId);
        BigDecimal lastPrice = newTrades.get(newTrades.size() - 1).price();
        BigDecimal volume = newTrades.stream()
                .map(t -> t.price().multiply(t.quantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        MarketData updated = new MarketData(
                tokenId,
                lastPrice,
                existing != null ? existing.openPrice() : lastPrice,
                newTrades.stream().map(Trade::price).max(Comparator.naturalOrder()).orElse(lastPrice),
                newTrades.stream().map(Trade::price).min(Comparator.naturalOrder()).orElse(lastPrice),
                existing != null ? existing.volume24h().add(volume) : volume,
                existing != null ? lastPrice.subtract(existing.lastPrice())
                        .divide(existing.lastPrice(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)) : BigDecimal.ZERO,
                BigDecimal.ZERO,
                newTrades.size(),
                Instant.now()
        );

        marketData.put(tokenId, updated);
    }

    private String generateOfferingId() {
        return "OFF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateSubscriptionId() {
        return "SUB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateOrderId() {
        return "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateTradeId() {
        return "TRD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    // ==========================================
    // RECORD TYPES
    // ==========================================

    public record TokenOffering(
            String offeringId,
            String tokenId,
            OfferingType offeringType,
            String name,
            String description,
            BigDecimal pricePerToken,
            BigDecimal minInvestment,
            BigDecimal maxInvestment,
            BigDecimal softCap,
            BigDecimal hardCap,
            BigDecimal amountRaised,
            BigDecimal tokensAllocated,
            int investorCount,
            Instant startDate,
            Instant endDate,
            String vestingSchedule,
            String eligibilityCriteria,
            OfferingStatus status,
            String issuer,
            Instant createdAt,
            Instant closedAt,
            Map<String, Object> metadata
    ) {
        public TokenOffering withStatus(OfferingStatus newStatus) {
            return new TokenOffering(
                    offeringId, tokenId, offeringType, name, description, pricePerToken,
                    minInvestment, maxInvestment, softCap, hardCap, amountRaised, tokensAllocated,
                    investorCount, startDate, endDate, vestingSchedule, eligibilityCriteria,
                    newStatus, issuer, createdAt, closedAt, metadata
            );
        }
    }

    public record CreateOfferingRequest(
            String tokenId,
            OfferingType offeringType,
            String name,
            String description,
            BigDecimal pricePerToken,
            BigDecimal minInvestment,
            BigDecimal maxInvestment,
            BigDecimal softCap,
            BigDecimal hardCap,
            Instant startDate,
            Instant endDate,
            String vestingSchedule,
            String eligibilityCriteria,
            String issuer,
            Map<String, Object> metadata
    ) {}

    public record Subscription(
            String subscriptionId,
            String offeringId,
            String tokenId,
            String investor,
            BigDecimal investmentAmount,
            BigDecimal tokensAllocated,
            BigDecimal pricePerToken,
            SubscriptionStatus status,
            Instant createdAt,
            Instant confirmedAt,
            String transactionHash
    ) {}

    public record SubscriptionRequest(
            String offeringId,
            String investor,
            BigDecimal amount
    ) {}

    public record Order(
            String orderId,
            String tokenId,
            String trader,
            OrderType orderType,
            OrderSide orderSide,
            BigDecimal price,
            BigDecimal quantity,
            BigDecimal filledQuantity,
            TimeInForce timeInForce,
            OrderStatus status,
            Instant createdAt,
            Instant updatedAt,
            Instant expiresAt
    ) {
        public Order withStatus(OrderStatus newStatus) {
            return new Order(orderId, tokenId, trader, orderType, orderSide, price, quantity,
                    filledQuantity, timeInForce, newStatus, createdAt, Instant.now(), expiresAt);
        }
    }

    public record PlaceOrderRequest(
            String tokenId,
            String trader,
            OrderType orderType,
            OrderSide orderSide,
            BigDecimal price,
            BigDecimal quantity,
            TimeInForce timeInForce,
            Instant expiresAt
    ) {}

    public record Trade(
            String tradeId,
            String tokenId,
            String buyOrderId,
            String sellOrderId,
            String buyerId,
            String sellerId,
            BigDecimal price,
            BigDecimal quantity,
            BigDecimal fee,
            Instant timestamp
    ) {}

    public record OrderBook(
            String tokenId,
            List<OrderBookEntry> bids,
            List<OrderBookEntry> asks,
            BigDecimal bestBid,
            BigDecimal bestAsk,
            Instant updatedAt
    ) {}

    public record OrderBookEntry(
            BigDecimal price,
            BigDecimal quantity,
            int orderCount
    ) {}

    public record MarketData(
            String tokenId,
            BigDecimal lastPrice,
            BigDecimal openPrice,
            BigDecimal highPrice,
            BigDecimal lowPrice,
            BigDecimal volume24h,
            BigDecimal priceChange24h,
            BigDecimal marketCap,
            int tradeCount24h,
            Instant updatedAt
    ) {}

    public record TokenSearchQuery(
            String keyword,
            List<AssetType> assetTypes,
            List<TokenStatus> statuses,
            String jurisdiction,
            String issuerId,
            String complianceFramework,
            TokenSortField sortBy,
            boolean sortAscending,
            int page,
            int pageSize
    ) {
        public TokenSearchQuery {
            if (page < 0) page = 0;
            if (pageSize <= 0) pageSize = 20;
            if (pageSize > 100) pageSize = 100;
            if (sortBy == null) sortBy = TokenSortField.CREATED_AT;
        }
    }

    public record TokenSearchResult(
            List<HybridToken> tokens,
            int totalCount,
            int page,
            int pageSize,
            int totalPages,
            Instant searchedAt
    ) {}

    public record OfferingSearchQuery(
            String tokenId,
            List<OfferingStatus> statuses,
            OfferingType offeringType,
            String issuerId,
            Instant fromDate,
            Instant toDate,
            OfferingSortField sortBy,
            boolean sortAscending,
            int page,
            int pageSize
    ) {}

    public record OfferingSearchResult(
            List<TokenOffering> offerings,
            int totalCount,
            int page,
            int pageSize,
            int totalPages,
            Instant searchedAt
    ) {}

    public record TradeSearchQuery(
            String tokenId,
            String traderId,
            Instant fromDate,
            Instant toDate,
            BigDecimal minValue,
            boolean sortAscending,
            int page,
            int pageSize
    ) {}

    public record TradeSearchResult(
            List<Trade> trades,
            int totalCount,
            int page,
            int pageSize,
            int totalPages,
            BigDecimal totalVolume,
            Instant searchedAt
    ) {}

    // ==========================================
    // ENUMS
    // ==========================================

    public enum OfferingType {
        PUBLIC_SALE,
        PRIVATE_PLACEMENT,
        SEED_ROUND,
        SERIES_A,
        SERIES_B,
        REGULATION_D,
        REGULATION_A,
        REGULATION_CF,
        STO
    }

    public enum OfferingStatus {
        DRAFT,
        PENDING_APPROVAL,
        ACTIVE,
        PAUSED,
        SUCCESSFUL,
        FAILED,
        CANCELLED
    }

    public enum SubscriptionStatus {
        PENDING,
        CONFIRMED,
        ALLOCATED,
        CANCELLED,
        REFUNDED
    }

    public enum OrderType {
        MARKET,
        LIMIT,
        STOP,
        STOP_LIMIT
    }

    public enum OrderSide {
        BUY,
        SELL
    }

    public enum OrderStatus {
        OPEN,
        PARTIALLY_FILLED,
        FILLED,
        CANCELLED,
        EXPIRED,
        REJECTED
    }

    public enum TimeInForce {
        GTC,  // Good Till Cancelled
        IOC,  // Immediate Or Cancel
        FOK,  // Fill Or Kill
        DAY   // Day order
    }

    public enum TokenSortField {
        NAME,
        SYMBOL,
        TOTAL_SUPPLY,
        MINTED_SUPPLY,
        CREATED_AT
    }

    public enum OfferingSortField {
        NAME,
        CREATED_AT,
        AMOUNT_RAISED,
        END_DATE
    }

    public static class MarketException extends RuntimeException {
        public MarketException(String message) {
            super(message);
        }
    }
}
