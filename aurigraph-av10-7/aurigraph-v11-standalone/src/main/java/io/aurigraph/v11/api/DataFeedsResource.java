package io.aurigraph.v11.api;

import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Feeds API Resource
 * 
 * Provides data feed registry and management for the feed manager UI.
 * 
 * @author Aurigraph DLT Platform
 * @version 12.0.0
 * @since December 22, 2025
 */
@Path("/api/v11/datafeeds")
@Tag(name = "Data Feeds", description = "Data feed registry and management endpoints")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class DataFeedsResource {

    @GET
    @Operation(summary = "Get registered data feeds", description = "Returns list of all registered data feeds")
    @APIResponse(responseCode = "200", description = "Feeds retrieved successfully")
    public Response getDataFeeds() {
        List<Map<String, Object>> feeds = new ArrayList<>();

        // Mock feed data for testing
        feeds.add(createFeed("feed-001", "Alpaca Market Data", "market", "active"));
        feeds.add(createFeed("feed-002", "Weather Data Feed", "weather", "active"));
        feeds.add(createFeed("feed-003", "News Sentiment Feed", "news", "active"));
        feeds.add(createFeed("feed-004", "Social Media Feed", "social", "inactive"));
        feeds.add(createFeed("feed-005", "Blockchain Oracle", "oracle", "active"));

        Map<String, Object> response = new HashMap<>();
        response.put("feeds", feeds);
        response.put("total", feeds.size());
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    private Map<String, Object> createFeed(String id, String name, String type, String status) {
        Map<String, Object> feed = new HashMap<>();
        feed.put("id", id);
        feed.put("name", name);
        feed.put("type", type);
        feed.put("status", status);
        feed.put("lastUpdate", Instant.now().toString());
        feed.put("updateFrequency", "real-time");
        feed.put("dataPoints", 1000);
        return feed;
    }
}
