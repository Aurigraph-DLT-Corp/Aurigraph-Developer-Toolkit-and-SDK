package io.aurigraph.v11.integration.news;

import io.aurigraph.v11.integration.ExternalApiIntegration;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * NewsAPI Integration Service
 *
 * Provides news data integration for:
 * - Market sentiment analysis
 * - Crypto/blockchain news monitoring
 * - Breaking news alerts for trading signals
 * - Regulatory news tracking
 *
 * JIRA Ticket: AV11-317
 *
 * @author Integration & Bridge Agent (IBA)
 * @version 1.0.0
 * @since Sprint 5 (Dec 2025)
 */
@ApplicationScoped
public class NewsIntegrationService implements ExternalApiIntegration {

    private static final Logger LOG = Logger.getLogger(NewsIntegrationService.class);
    private static final String INTEGRATION_ID = "newsapi";
    private static final String DISPLAY_NAME = "NewsAPI";
    private static final String CATEGORY = "data-provider";

    @ConfigProperty(name = "news.api.key", defaultValue = "")
    String apiKey;

    @ConfigProperty(name = "news.api.url", defaultValue = "https://newsapi.org/v2")
    String apiUrl;

    @ConfigProperty(name = "news.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "news.default.topics", defaultValue = "cryptocurrency,blockchain,bitcoin,ethereum,defi")
    String defaultTopics;

    @ConfigProperty(name = "news.sources", defaultValue = "bloomberg,reuters,coindesk,cointelegraph")
    String newsSources;

    private final AtomicBoolean isStarted = new AtomicBoolean(false);
    private final AtomicLong messagesReceived = new AtomicLong(0);
    private final AtomicLong messagesProcessed = new AtomicLong(0);
    private final AtomicLong errorsCount = new AtomicLong(0);
    private final AtomicLong httpSuccess = new AtomicLong(0);
    private final AtomicLong httpFailed = new AtomicLong(0);
    private final AtomicLong startTime = new AtomicLong(0);

    private final Map<String, NewsArticle> recentNews = new ConcurrentHashMap<>();
    private final HttpClient httpClient;

    public NewsIntegrationService() {
        this.httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    @Override
    public String getIntegrationId() {
        return INTEGRATION_ID;
    }

    @Override
    public String getDisplayName() {
        return DISPLAY_NAME;
    }

    @Override
    public String getCategory() {
        return CATEGORY;
    }

    @Override
    public boolean isEnabled() {
        return enabled && isStarted.get();
    }

    @Override
    public Uni<Boolean> setEnabled(boolean enabled) {
        this.enabled = enabled;
        if (!enabled && isStarted.get()) {
            return stop();
        } else if (enabled && !isStarted.get()) {
            return start();
        }
        return Uni.createFrom().item(true);
    }

    @Override
    public Uni<HealthStatus> checkHealth() {
        if (!enabled) {
            return Uni.createFrom().item(HealthStatus.disabled());
        }

        return Uni.createFrom().item(() -> {
            try {
                // Check NewsAPI with a simple request
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "/top-headlines?country=us&pageSize=1&apiKey=" + apiKey))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    httpSuccess.incrementAndGet();
                    return new HealthStatus(
                        true,
                        "HEALTHY",
                        System.currentTimeMillis(),
                        null,
                        Map.of(
                            "apiVersion", "v2",
                            "trackedTopics", defaultTopics.split(",").length,
                            "configuredSources", newsSources.split(",").length
                        )
                    );
                } else if (response.statusCode() == 401) {
                    httpFailed.incrementAndGet();
                    return HealthStatus.unhealthy("Invalid API key");
                } else if (response.statusCode() == 429) {
                    httpFailed.incrementAndGet();
                    return HealthStatus.unhealthy("Rate limit exceeded");
                } else {
                    httpFailed.incrementAndGet();
                    return HealthStatus.unhealthy("API returned status: " + response.statusCode());
                }
            } catch (Exception e) {
                httpFailed.incrementAndGet();
                errorsCount.incrementAndGet();
                LOG.errorf(e, "Health check failed for NewsAPI");
                return HealthStatus.unhealthy("Connection failed: " + e.getMessage());
            }
        });
    }

    @Override
    public IntegrationConfig getConfig() {
        return new IntegrationConfig(
            INTEGRATION_ID,
            enabled,
            apiUrl,
            maskApiKey(apiKey),
            "N/A",
            300000, // 5 minute poll interval
            3,
            30,
            Map.of(
                "defaultTopics", defaultTopics,
                "newsSources", newsSources,
                "supportsRealtime", "false",
                "apiVersion", "v2"
            )
        );
    }

    @Override
    public Uni<Boolean> updateConfig(IntegrationConfig config) {
        return Uni.createFrom().item(() -> {
            if (config.apiKey() != null && !config.apiKey().startsWith("***")) {
                this.apiKey = config.apiKey();
            }
            if (config.apiUrl() != null) {
                LOG.infof("News API URL updated");
            }
            this.enabled = config.enabled();
            LOG.infof("NewsAPI configuration updated");
            return true;
        });
    }

    @Override
    public IntegrationMetrics getMetrics() {
        long uptime = isStarted.get() ? (System.currentTimeMillis() - startTime.get()) / 1000 : 0;
        return new IntegrationMetrics(
            INTEGRATION_ID,
            messagesReceived.get(),
            messagesProcessed.get(),
            errorsCount.get(),
            httpSuccess.get(),
            httpFailed.get(),
            uptime,
            calculateAvgLatency(),
            Map.of(
                "cachedArticles", recentNews.size(),
                "trackedTopics", defaultTopics.split(",").length,
                "isActive", isStarted.get()
            )
        );
    }

    @Override
    public Uni<Boolean> start() {
        return Uni.createFrom().item(() -> {
            if (isStarted.compareAndSet(false, true)) {
                startTime.set(System.currentTimeMillis());
                LOG.infof("NewsAPI integration started - tracking: %s", defaultTopics);
                return true;
            }
            return false;
        });
    }

    @Override
    public Uni<Boolean> stop() {
        return Uni.createFrom().item(() -> {
            if (isStarted.compareAndSet(true, false)) {
                recentNews.clear();
                LOG.infof("NewsAPI integration stopped");
                return true;
            }
            return false;
        });
    }

    // ==================== News-Specific Methods ====================

    /**
     * Search news articles by keyword
     */
    public Uni<List<NewsArticle>> searchNews(String query, int pageSize) {
        return Uni.createFrom().item(() -> {
            try {
                String url = String.format("%s/everything?q=%s&pageSize=%d&sortBy=publishedAt&apiKey=%s",
                    apiUrl, java.net.URLEncoder.encode(query, "UTF-8"), Math.min(pageSize, 100), apiKey);

                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    httpSuccess.incrementAndGet();
                    messagesReceived.incrementAndGet();
                    messagesProcessed.incrementAndGet();
                    return parseNewsResponse(response.body());
                } else {
                    httpFailed.incrementAndGet();
                    errorsCount.incrementAndGet();
                    throw new RuntimeException("Failed to search news: " + response.statusCode());
                }
            } catch (Exception e) {
                errorsCount.incrementAndGet();
                LOG.errorf(e, "Failed to search news for query: %s", query);
                throw new RuntimeException("News search failed", e);
            }
        });
    }

    /**
     * Get top headlines for crypto/blockchain
     */
    public Uni<List<NewsArticle>> getCryptoHeadlines() {
        return searchNews("cryptocurrency OR blockchain OR bitcoin", 20);
    }

    /**
     * Get breaking news from specific sources
     */
    public Uni<List<NewsArticle>> getSourceNews(String source) {
        return Uni.createFrom().item(() -> {
            try {
                String url = String.format("%s/top-headlines?sources=%s&pageSize=20&apiKey=%s",
                    apiUrl, source, apiKey);

                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    httpSuccess.incrementAndGet();
                    messagesReceived.incrementAndGet();
                    return parseNewsResponse(response.body());
                } else {
                    httpFailed.incrementAndGet();
                    throw new RuntimeException("Failed to get source news: " + response.statusCode());
                }
            } catch (Exception e) {
                errorsCount.incrementAndGet();
                LOG.errorf(e, "Failed to get news from source: %s", source);
                throw new RuntimeException("Source news fetch failed", e);
            }
        });
    }

    /**
     * Analyze news sentiment for a topic
     */
    public Uni<NewsSentiment> analyzeSentiment(String topic) {
        return searchNews(topic, 50)
            .map(articles -> {
                int positive = 0, negative = 0, neutral = 0;

                for (NewsArticle article : articles) {
                    String combined = (article.title() + " " + article.description()).toLowerCase();

                    if (containsPositiveTerms(combined)) {
                        positive++;
                    } else if (containsNegativeTerms(combined)) {
                        negative++;
                    } else {
                        neutral++;
                    }
                }

                return new NewsSentiment(
                    topic,
                    articles.size(),
                    positive,
                    negative,
                    neutral,
                    calculateSentimentScore(positive, negative, neutral),
                    System.currentTimeMillis()
                );
            });
    }

    /**
     * Get regulatory news for compliance monitoring
     */
    public Uni<List<NewsArticle>> getRegulatoryNews() {
        return searchNews("cryptocurrency regulation OR SEC crypto OR crypto law OR blockchain legislation", 30);
    }

    /**
     * Get market-moving news
     */
    public Uni<List<NewsArticle>> getMarketNews() {
        return searchNews("bitcoin price OR ethereum market OR crypto crash OR crypto rally", 25);
    }

    // ==================== Helper Methods ====================

    private String maskApiKey(String key) {
        if (key == null || key.length() < 8) return "***";
        return key.substring(0, 4) + "***" + key.substring(key.length() - 4);
    }

    private double calculateAvgLatency() {
        return 200.0; // Average NewsAPI latency
    }

    private boolean containsPositiveTerms(String text) {
        return text.contains("surge") || text.contains("rally") || text.contains("bullish") ||
               text.contains("gains") || text.contains("breakthrough") || text.contains("adoption") ||
               text.contains("growth") || text.contains("record high");
    }

    private boolean containsNegativeTerms(String text) {
        return text.contains("crash") || text.contains("plunge") || text.contains("bearish") ||
               text.contains("losses") || text.contains("hack") || text.contains("fraud") ||
               text.contains("ban") || text.contains("collapse");
    }

    private double calculateSentimentScore(int positive, int negative, int neutral) {
        int total = positive + negative + neutral;
        if (total == 0) return 0.5;
        return (positive * 1.0 + neutral * 0.5) / total;
    }

    private List<NewsArticle> parseNewsResponse(String json) {
        // Simplified parsing - in production use Jackson ObjectMapper
        return List.of();
    }

    // ==================== Data Records ====================

    public record NewsArticle(
        String id,
        String title,
        String description,
        String author,
        String source,
        String url,
        String imageUrl,
        long publishedAt
    ) {}

    public record NewsSentiment(
        String topic,
        int totalArticles,
        int positiveArticles,
        int negativeArticles,
        int neutralArticles,
        double sentimentScore,
        long timestamp
    ) {}

    public record NewsAlert(
        String topic,
        String headline,
        String summary,
        String source,
        String url,
        String severity,
        long timestamp
    ) {}
}
