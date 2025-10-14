package io.aurigraph.v11.services;

import io.aurigraph.v11.models.PriceFeed;
import io.aurigraph.v11.models.PriceFeed.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Price Feed Service
 * Provides real-time price aggregation from multiple oracle sources
 *
 * @author Aurigraph V11
 * @version 11.3.0
 */
@ApplicationScoped
public class PriceFeedService {

    private static final Logger LOG = Logger.getLogger(PriceFeedService.class);

    /**
     * Get current price feed for all supported assets
     */
    public Uni<PriceFeed> getPriceFeed() {
        return Uni.createFrom().item(() -> {
            PriceFeed feed = new PriceFeed();

            feed.setPrices(buildAssetPrices());
            feed.setSources(buildPriceSources());
            feed.setAggregationMethod("median");
            feed.setUpdateFrequencyMs(5000); // 5 second updates

            LOG.debugf("Generated price feed with %d assets from %d sources",
                    feed.getPrices().size(),
                    feed.getSources().size());

            return feed;
        });
    }

    /**
     * Get price feed for specific asset
     */
    public Uni<AssetPrice> getAssetPrice(String symbol) {
        return Uni.createFrom().item(() -> {
            List<AssetPrice> prices = buildAssetPrices();

            return prices.stream()
                    .filter(p -> p.getAssetSymbol().equalsIgnoreCase(symbol))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + symbol));
        });
    }

    /**
     * Build current asset prices with simulated real-time data
     */
    private List<AssetPrice> buildAssetPrices() {
        List<AssetPrice> prices = new ArrayList<>();

        // Major cryptocurrencies with simulated real-time prices
        prices.add(new AssetPrice(
                "BTC", "Bitcoin",
                42500.0 + (Math.random() * 1000.0 - 500.0), // $42,000 - $43,000
                2.5 + (Math.random() * 2.0 - 1.0), // -1% to +4% change
                28500000000.0 + (Math.random() * 2000000000.0), // $28.5B - $30.5B volume
                835000000000.0, // $835B market cap
                0.98, // 98% confidence
                5 // 5 price sources
        ));

        prices.add(new AssetPrice(
                "ETH", "Ethereum",
                2250.0 + (Math.random() * 100.0 - 50.0), // $2,200 - $2,300
                3.2 + (Math.random() * 2.0 - 1.0),
                12500000000.0 + (Math.random() * 1000000000.0),
                270000000000.0,
                0.97,
                5
        ));

        prices.add(new AssetPrice(
                "MATIC", "Polygon",
                0.85 + (Math.random() * 0.1 - 0.05), // $0.80 - $0.90
                5.1 + (Math.random() * 2.0 - 1.0),
                450000000.0 + (Math.random() * 50000000.0),
                8200000000.0,
                0.95,
                4
        ));

        prices.add(new AssetPrice(
                "SOL", "Solana",
                98.0 + (Math.random() * 10.0 - 5.0), // $93 - $103
                4.7 + (Math.random() * 2.0 - 1.0),
                1800000000.0 + (Math.random() * 200000000.0),
                42000000000.0,
                0.96,
                4
        ));

        prices.add(new AssetPrice(
                "AVAX", "Avalanche",
                35.0 + (Math.random() * 3.0 - 1.5), // $33.5 - $36.5
                3.8 + (Math.random() * 2.0 - 1.0),
                520000000.0 + (Math.random() * 80000000.0),
                13500000000.0,
                0.94,
                4
        ));

        prices.add(new AssetPrice(
                "DOT", "Polkadot",
                6.8 + (Math.random() * 0.6 - 0.3), // $6.5 - $7.1
                2.9 + (Math.random() * 2.0 - 1.0),
                280000000.0 + (Math.random() * 40000000.0),
                8900000000.0,
                0.93,
                4
        ));

        prices.add(new AssetPrice(
                "LINK", "Chainlink",
                14.5 + (Math.random() * 1.5 - 0.75), // $13.75 - $15.25
                4.2 + (Math.random() * 2.0 - 1.0),
                650000000.0 + (Math.random() * 100000000.0),
                8200000000.0,
                0.97,
                5
        ));

        prices.add(new AssetPrice(
                "UNI", "Uniswap",
                5.6 + (Math.random() * 0.5 - 0.25), // $5.35 - $5.85
                3.5 + (Math.random() * 2.0 - 1.0),
                180000000.0 + (Math.random() * 30000000.0),
                4200000000.0,
                0.92,
                4
        ));

        return prices;
    }

    /**
     * Build price sources status
     */
    private List<PriceSource> buildPriceSources() {
        List<PriceSource> sources = new ArrayList<>();

        sources.add(new PriceSource(
                "Chainlink",
                "oracle",
                "active",
                0.98,
                17280, // updates per day
                150 // supported assets
        ));

        sources.add(new PriceSource(
                "Band Protocol",
                "oracle",
                "active",
                0.96,
                14400,
                120
        ));

        sources.add(new PriceSource(
                "Pyth Network",
                "oracle",
                "active",
                0.97,
                86400, // high frequency updates
                200
        ));

        sources.add(new PriceSource(
                "API3",
                "oracle",
                "active",
                0.95,
                12000,
                80
        ));

        sources.add(new PriceSource(
                "Coinbase",
                "exchange",
                "active",
                0.99,
                20000,
                250
        ));

        sources.add(new PriceSource(
                "Binance",
                "exchange",
                "active",
                0.98,
                25000,
                380
        ));

        return sources;
    }
}
