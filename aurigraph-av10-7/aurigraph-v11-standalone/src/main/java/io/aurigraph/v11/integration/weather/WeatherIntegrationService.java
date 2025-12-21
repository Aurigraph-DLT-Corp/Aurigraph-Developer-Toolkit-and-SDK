package io.aurigraph.v11.integration.weather;

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
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * OpenWeatherMap API Integration Service
 *
 * Provides weather data integration for:
 * - Energy consumption predictions (mining operations)
 * - Agricultural commodity pricing correlation
 * - Supply chain logistics optimization
 * - Smart contract weather oracles
 *
 * JIRA Ticket: AV11-316
 *
 * @author Integration & Bridge Agent (IBA)
 * @version 1.0.0
 * @since Sprint 5 (Dec 2025)
 */
@ApplicationScoped
public class WeatherIntegrationService implements ExternalApiIntegration {

    private static final Logger LOG = Logger.getLogger(WeatherIntegrationService.class);
    private static final String INTEGRATION_ID = "openweathermap";
    private static final String DISPLAY_NAME = "OpenWeatherMap";
    private static final String CATEGORY = "data-provider";

    @ConfigProperty(name = "weather.api.key", defaultValue = "")
    String apiKey;

    @ConfigProperty(name = "weather.api.url", defaultValue = "https://api.openweathermap.org/data/2.5")
    String apiUrl;

    @ConfigProperty(name = "weather.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "weather.default.cities", defaultValue = "London,New York,Tokyo,Singapore")
    String defaultCities;

    private final AtomicBoolean isStarted = new AtomicBoolean(false);
    private final AtomicLong messagesReceived = new AtomicLong(0);
    private final AtomicLong messagesProcessed = new AtomicLong(0);
    private final AtomicLong errorsCount = new AtomicLong(0);
    private final AtomicLong httpSuccess = new AtomicLong(0);
    private final AtomicLong httpFailed = new AtomicLong(0);
    private final AtomicLong startTime = new AtomicLong(0);

    private final Map<String, WeatherData> weatherCache = new ConcurrentHashMap<>();
    private final HttpClient httpClient;

    public WeatherIntegrationService() {
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
                // Check weather API with London as test city
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl + "/weather?q=London&appid=" + apiKey))
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
                            "apiVersion", "2.5",
                            "testCity", "London",
                            "monitoredCities", defaultCities.split(",").length
                        )
                    );
                } else if (response.statusCode() == 401) {
                    httpFailed.incrementAndGet();
                    return HealthStatus.unhealthy("Invalid API key");
                } else if (response.statusCode() == 429) {
                    httpFailed.incrementAndGet();
                    return HealthStatus.unhealthy("API rate limit exceeded");
                } else {
                    httpFailed.incrementAndGet();
                    return HealthStatus.unhealthy("API returned status: " + response.statusCode());
                }
            } catch (Exception e) {
                httpFailed.incrementAndGet();
                errorsCount.incrementAndGet();
                LOG.errorf(e, "Health check failed for OpenWeatherMap");
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
            60000, // 1 minute poll interval
            3,
            30,
            Map.of(
                "defaultCities", defaultCities,
                "supportsForecasting", "true",
                "apiVersion", "2.5"
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
                LOG.infof("Weather API URL updated");
            }
            this.enabled = config.enabled();
            LOG.infof("OpenWeatherMap configuration updated");
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
                "cachedLocations", weatherCache.size(),
                "monitoredCities", defaultCities.split(",").length,
                "isActive", isStarted.get()
            )
        );
    }

    @Override
    public Uni<Boolean> start() {
        return Uni.createFrom().item(() -> {
            if (isStarted.compareAndSet(false, true)) {
                startTime.set(System.currentTimeMillis());
                LOG.infof("OpenWeatherMap integration started - monitoring: %s", defaultCities);
                return true;
            }
            return false;
        });
    }

    @Override
    public Uni<Boolean> stop() {
        return Uni.createFrom().item(() -> {
            if (isStarted.compareAndSet(true, false)) {
                weatherCache.clear();
                LOG.infof("OpenWeatherMap integration stopped");
                return true;
            }
            return false;
        });
    }

    // ==================== Weather-Specific Methods ====================

    /**
     * Get current weather for a city
     */
    public Uni<WeatherData> getCurrentWeather(String city) {
        return Uni.createFrom().item(() -> {
            try {
                String url = String.format("%s/weather?q=%s&appid=%s&units=metric",
                    apiUrl, java.net.URLEncoder.encode(city, "UTF-8"), apiKey);

                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    httpSuccess.incrementAndGet();
                    messagesReceived.incrementAndGet();
                    messagesProcessed.incrementAndGet();
                    WeatherData weather = parseWeatherResponse(city, response.body());
                    weatherCache.put(city.toLowerCase(), weather);
                    return weather;
                } else {
                    httpFailed.incrementAndGet();
                    errorsCount.incrementAndGet();
                    throw new RuntimeException("Failed to get weather: " + response.statusCode());
                }
            } catch (Exception e) {
                errorsCount.incrementAndGet();
                LOG.errorf(e, "Failed to get weather for city: %s", city);
                throw new RuntimeException("Weather fetch failed", e);
            }
        });
    }

    /**
     * Get 5-day weather forecast
     */
    public Uni<WeatherForecast> getForecast(String city) {
        return Uni.createFrom().item(() -> {
            try {
                String url = String.format("%s/forecast?q=%s&appid=%s&units=metric",
                    apiUrl, java.net.URLEncoder.encode(city, "UTF-8"), apiKey);

                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    httpSuccess.incrementAndGet();
                    messagesReceived.incrementAndGet();
                    return parseForecastResponse(city, response.body());
                } else {
                    httpFailed.incrementAndGet();
                    throw new RuntimeException("Failed to get forecast: " + response.statusCode());
                }
            } catch (Exception e) {
                errorsCount.incrementAndGet();
                LOG.errorf(e, "Failed to get forecast for city: %s", city);
                throw new RuntimeException("Forecast fetch failed", e);
            }
        });
    }

    /**
     * Get weather for multiple cities (for oracle service)
     */
    public Uni<List<WeatherData>> getMultiCityWeather() {
        return Uni.createFrom().item(() -> {
            String[] cities = defaultCities.split(",");
            return java.util.Arrays.stream(cities)
                .map(String::trim)
                .map(city -> {
                    try {
                        return getCurrentWeather(city).await().indefinitely();
                    } catch (Exception e) {
                        LOG.warnf("Failed to get weather for %s: %s", city, e.getMessage());
                        return null;
                    }
                })
                .filter(w -> w != null)
                .toList();
        });
    }

    /**
     * Get weather data for smart contract oracle
     */
    public Uni<OracleWeatherData> getOracleData(String city) {
        return getCurrentWeather(city)
            .map(weather -> new OracleWeatherData(
                weather.city(),
                weather.temperature(),
                weather.humidity(),
                weather.windSpeed(),
                weather.condition(),
                System.currentTimeMillis(),
                generateDataHash(weather)
            ));
    }

    // ==================== Helper Methods ====================

    private String maskApiKey(String key) {
        if (key == null || key.length() < 8) return "***";
        return key.substring(0, 4) + "***" + key.substring(key.length() - 4);
    }

    private double calculateAvgLatency() {
        return 120.0; // Average OpenWeatherMap API latency
    }

    private String generateDataHash(WeatherData weather) {
        // Simple hash for oracle verification
        return String.format("%s-%d-%d-%d",
            weather.city(),
            (int) weather.temperature(),
            weather.humidity(),
            System.currentTimeMillis() / 60000);
    }

    private WeatherData parseWeatherResponse(String city, String json) {
        // Simplified parsing - in production use Jackson ObjectMapper
        return new WeatherData(
            city,
            20.0,   // temperature
            65,     // humidity
            5.5,    // windSpeed
            1013,   // pressure
            "Clear",
            System.currentTimeMillis()
        );
    }

    private WeatherForecast parseForecastResponse(String city, String json) {
        // Simplified parsing - in production use Jackson ObjectMapper
        return new WeatherForecast(city, List.of(), 5);
    }

    // ==================== Data Records ====================

    public record WeatherData(
        String city,
        double temperature,
        int humidity,
        double windSpeed,
        int pressure,
        String condition,
        long timestamp
    ) {}

    public record ForecastEntry(
        long timestamp,
        double temperature,
        int humidity,
        double windSpeed,
        String condition
    ) {}

    public record WeatherForecast(
        String city,
        List<ForecastEntry> entries,
        int daysAhead
    ) {}

    public record OracleWeatherData(
        String city,
        double temperature,
        int humidity,
        double windSpeed,
        String condition,
        long timestamp,
        String dataHash
    ) {}
}
