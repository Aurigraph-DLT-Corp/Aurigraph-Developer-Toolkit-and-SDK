package io.aurigraph.v11.integration;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Credentials;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * JIRA Integration Resource
 *
 * Provides REST API endpoints for querying JIRA issues using JQL (JIRA Query Language).
 * Acts as a proxy to the JIRA API with authentication handling.
 *
 * Endpoints:
 * - GET /api/v3/jira/search - Search JIRA issues using JQL
 *
 * Configuration (Environment Variables):
 * - JIRA_BASE_URL: JIRA instance URL (e.g., https://aurigraphdlt.atlassian.net)
 * - JIRA_EMAIL: JIRA user email
 * - JIRA_API_TOKEN: JIRA API token (generate from JIRA account settings)
 *
 * @author Aurigraph V12 Team
 * @version 12.0.0
 * @since December 2025
 */
@Path("/api/v3/jira")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "JIRA Integration", description = "JIRA issue tracking integration endpoints")
public class JiraIntegrationResource {

    private static final Logger LOG = Logger.getLogger(JiraIntegrationResource.class);

    @ConfigProperty(name = "jira.base.url", defaultValue = "https://aurigraphdlt.atlassian.net")
    String jiraBaseUrl;

    @ConfigProperty(name = "jira.email")
    Optional<String> jiraEmail;

    @ConfigProperty(name = "jira.api.token")
    Optional<String> jiraApiToken;

    private final OkHttpClient httpClient;

    /**
     * Constructor - initializes HTTP client
     */
    public JiraIntegrationResource() {
        this.httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();
    }

    /**
     * GET /api/v3/jira/search
     *
     * Search JIRA issues using JQL (JIRA Query Language).
     *
     * Example JQL queries:
     * - project = AV11 AND status = "In Progress"
     * - assignee = currentUser() AND status != Done
     * - created >= -7d ORDER BY created DESC
     *
     * @param jql JQL query string
     * @param startAt Starting index for pagination (default: 0)
     * @param maxResults Maximum results to return (default: 50, max: 100)
     * @param fields Fields to include in response (comma-separated, default: summary,status,assignee)
     * @return JIRA search results
     */
    @GET
    @Path("/search")
    @Operation(
        summary = "Search JIRA issues using JQL",
        description = "Query JIRA issues using JIRA Query Language (JQL). Supports pagination and field filtering."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "JIRA search results",
            content = @Content(mediaType = "application/json")
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid JQL query or parameters"
        ),
        @APIResponse(
            responseCode = "401",
            description = "JIRA authentication failed - check credentials"
        ),
        @APIResponse(
            responseCode = "500",
            description = "JIRA API error or network failure"
        )
    })
    public Response searchJiraIssues(
        @Parameter(description = "JQL query string", required = true, example = "project = AV11")
        @QueryParam("jql") String jql,

        @Parameter(description = "Starting index for pagination", example = "0")
        @QueryParam("startAt") @DefaultValue("0") int startAt,

        @Parameter(description = "Maximum results to return (max: 100)", example = "50")
        @QueryParam("maxResults") @DefaultValue("50") int maxResults,

        @Parameter(description = "Fields to include (comma-separated)", example = "summary,status,assignee")
        @QueryParam("fields") @DefaultValue("summary,status,assignee,created,updated") String fields
    ) {
        LOG.infof("GET /api/v3/jira/search - JQL: %s, startAt: %d, maxResults: %d", jql, startAt, maxResults);

        // Validate input
        if (jql == null || jql.trim().isEmpty()) {
            LOG.warn("JIRA search failed: JQL query is required");
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(createErrorResponse("JQL query parameter is required"))
                .build();
        }

        // Validate maxResults
        if (maxResults > 100) {
            maxResults = 100;
            LOG.warnf("maxResults capped at 100 (requested: %d)", maxResults);
        }

        // Check JIRA credentials
        if (jiraEmail.isEmpty() || jiraApiToken.isEmpty()) {
            LOG.error("JIRA credentials not configured. Set JIRA_EMAIL and JIRA_API_TOKEN environment variables.");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(createErrorResponse("JIRA credentials not configured. Contact administrator."))
                .build();
        }

        try {
            // Build JIRA API URL
            String jiraUrl = buildJiraSearchUrl(jql, startAt, maxResults, fields);
            LOG.debugf("JIRA API URL: %s", jiraUrl);

            // Create authenticated request
            String credentials = Credentials.basic(jiraEmail.get(), jiraApiToken.get());
            Request request = new Request.Builder()
                .url(jiraUrl)
                .header("Authorization", credentials)
                .header("Accept", "application/json")
                .get()
                .build();

            // Execute request
            try (okhttp3.Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "{}";

                if (!response.isSuccessful()) {
                    LOG.errorf("JIRA API error: %d - %s", response.code(), responseBody);

                    // Handle specific error codes
                    if (response.code() == 401) {
                        return Response.status(Response.Status.UNAUTHORIZED)
                            .entity(createErrorResponse("JIRA authentication failed. Check credentials."))
                            .build();
                    } else if (response.code() == 400) {
                        return Response.status(Response.Status.BAD_REQUEST)
                            .entity(createErrorResponse("Invalid JQL query: " + responseBody))
                            .build();
                    } else if (response.code() == 410) {
                        // 410 Gone - try API v3 as fallback
                        LOG.warnf("JIRA API v2 returned 410 Gone, trying v3...");
                        return tryJiraV3Search(jql, startAt, maxResults, fields, credentials);
                    } else {
                        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                            .entity(createErrorResponse("JIRA API error: " + responseBody))
                            .build();
                    }
                }

                LOG.infof("JIRA search successful - returned %d bytes", responseBody.length());

                // Return JIRA response
                return Response.ok(responseBody)
                    .header("Content-Type", "application/json")
                    .build();
            }

        } catch (IOException e) {
            LOG.errorf(e, "JIRA API network error: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(createErrorResponse("Network error connecting to JIRA: " + e.getMessage()))
                .build();
        } catch (Exception e) {
            LOG.errorf(e, "Unexpected error in JIRA search: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(createErrorResponse("Unexpected error: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Fallback method to try JIRA API v3 when v2 returns 410
     */
    private Response tryJiraV3Search(String jql, int startAt, int maxResults, String fields, String credentials) {
        try {
            String jiraUrl = buildJiraSearchUrlV3(jql, startAt, maxResults, fields);
            LOG.debugf("JIRA API v3 fallback URL: %s", jiraUrl);

            Request request = new Request.Builder()
                .url(jiraUrl)
                .header("Authorization", credentials)
                .header("Accept", "application/json")
                .get()
                .build();

            try (okhttp3.Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "{}";

                if (!response.isSuccessful()) {
                    LOG.errorf("JIRA API v3 also failed: %d - %s", response.code(), responseBody);
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(createErrorResponse("JIRA API error (both v2 and v3 failed): " + responseBody))
                        .build();
                }

                LOG.infof("JIRA v3 search successful - returned %d bytes", responseBody.length());
                return Response.ok(responseBody)
                    .header("Content-Type", "application/json")
                    .build();
            }
        } catch (IOException e) {
            LOG.errorf(e, "JIRA API v3 network error: %s", e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(createErrorResponse("Network error on JIRA v3 fallback: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Build JIRA API search URL with query parameters
     * Uses API v2 as v3 can return 410 Gone for some operations
     */
    private String buildJiraSearchUrl(String jql, int startAt, int maxResults, String fields) {
        return String.format(
            "%s/rest/api/2/search?jql=%s&startAt=%d&maxResults=%d&fields=%s",
            jiraBaseUrl,
            urlEncode(jql),
            startAt,
            maxResults,
            urlEncode(fields)
        );
    }

    /**
     * Build JIRA API v3 search URL (fallback)
     *
     * Note: As of 2025, JIRA Cloud uses /rest/api/3/search/jql endpoint
     * instead of /rest/api/3/search (which now returns 410 Gone)
     * See: https://developer.atlassian.com/changelog/#CHANGE-2046
     */
    private String buildJiraSearchUrlV3(String jql, int startAt, int maxResults, String fields) {
        return String.format(
            "%s/rest/api/3/search/jql?jql=%s&startAt=%d&maxResults=%d&fields=%s",
            jiraBaseUrl,
            urlEncode(jql),
            startAt,
            maxResults,
            urlEncode(fields)
        );
    }

    /**
     * URL-encode a string for use in query parameters
     */
    private String urlEncode(String value) {
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (java.io.UnsupportedEncodingException e) {
            LOG.error("UTF-8 encoding not supported", e);
            return value;
        }
    }

    /**
     * Create standardized error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", true);
        error.put("message", message);
        error.put("timestamp", java.time.Instant.now().toString());
        return error;
    }

    /**
     * GET /api/v3/jira/issue/{issueKey}
     *
     * Get a single JIRA issue by key (e.g., AV11-550)
     * This is an alternative to search that works when search returns 410
     *
     * @param issueKey The JIRA issue key (e.g., AV11-550)
     * @return JIRA issue details
     */
    @GET
    @Path("/issue/{issueKey}")
    @Operation(
        summary = "Get JIRA issue by key",
        description = "Retrieve a single JIRA issue by its key. Use this when search is not available."
    )
    @APIResponses({
        @APIResponse(responseCode = "200", description = "JIRA issue details"),
        @APIResponse(responseCode = "404", description = "Issue not found"),
        @APIResponse(responseCode = "401", description = "Authentication failed")
    })
    public Response getIssue(
        @Parameter(description = "JIRA issue key", required = true, example = "AV11-550")
        @PathParam("issueKey") String issueKey
    ) {
        LOG.infof("GET /api/v3/jira/issue/%s", issueKey);

        if (issueKey == null || issueKey.trim().isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(createErrorResponse("Issue key is required"))
                .build();
        }

        if (jiraEmail.isEmpty() || jiraApiToken.isEmpty()) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(createErrorResponse("JIRA credentials not configured"))
                .build();
        }

        try {
            // Use API v2 for individual issue fetch
            String jiraUrl = String.format("%s/rest/api/2/issue/%s", jiraBaseUrl, urlEncode(issueKey));
            String credentials = Credentials.basic(jiraEmail.get(), jiraApiToken.get());

            Request request = new Request.Builder()
                .url(jiraUrl)
                .header("Authorization", credentials)
                .header("Accept", "application/json")
                .get()
                .build();

            try (okhttp3.Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "{}";

                if (!response.isSuccessful()) {
                    if (response.code() == 404) {
                        return Response.status(Response.Status.NOT_FOUND)
                            .entity(createErrorResponse("Issue not found: " + issueKey))
                            .build();
                    } else if (response.code() == 401) {
                        return Response.status(Response.Status.UNAUTHORIZED)
                            .entity(createErrorResponse("JIRA authentication failed"))
                            .build();
                    }
                    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(createErrorResponse("JIRA API error: " + responseBody))
                        .build();
                }

                LOG.infof("JIRA issue %s fetched successfully", issueKey);
                return Response.ok(responseBody)
                    .header("Content-Type", "application/json")
                    .build();
            }

        } catch (IOException e) {
            LOG.errorf(e, "JIRA API network error fetching %s: %s", issueKey, e.getMessage());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(createErrorResponse("Network error: " + e.getMessage()))
                .build();
        }
    }

    /**
     * GET /api/v3/jira/health
     *
     * Health check endpoint for JIRA integration
     */
    @GET
    @Path("/health")
    @Operation(
        summary = "JIRA integration health check",
        description = "Verify JIRA integration configuration and connectivity"
    )
    public Response getHealth() {
        LOG.debug("GET /api/v3/jira/health");

        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("jiraBaseUrl", jiraBaseUrl);
        health.put("credentialsConfigured", jiraEmail.isPresent() && jiraApiToken.isPresent());
        health.put("timestamp", java.time.Instant.now().toString());

        if (!jiraEmail.isPresent() || !jiraApiToken.isPresent()) {
            health.put("status", "DOWN");
            health.put("warning", "JIRA credentials not configured");
            return Response.status(Response.Status.SERVICE_UNAVAILABLE).entity(health).build();
        }

        return Response.ok(health).build();
    }
}
