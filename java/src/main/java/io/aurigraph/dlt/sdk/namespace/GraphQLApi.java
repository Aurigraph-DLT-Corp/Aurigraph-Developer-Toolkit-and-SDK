package io.aurigraph.dlt.sdk.namespace;

import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.GraphQLResponse;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Namespace for /api/v11/graphql — GraphQL gateway.
 */
public class GraphQLApi {

    private final AurigraphClient client;

    public GraphQLApi(AurigraphClient client) {
        this.client = client;
    }

    /**
     * Execute an arbitrary GraphQL query with optional variables.
     */
    public GraphQLResponse query(String query, Map<String, Object> variables) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("query", query);
        if (variables != null && !variables.isEmpty()) {
            body.put("variables", variables);
        }
        return client.post("/graphql", body, GraphQLResponse.class);
    }

    /**
     * Execute a GraphQL query without variables.
     */
    public GraphQLResponse query(String query) {
        return query(query, null);
    }

    /**
     * Query all channels.
     */
    public GraphQLResponse queryChannels() {
        return query("{ channels { id name type status stakeholders { id role } } }");
    }

    /**
     * Query assets for a specific channel.
     */
    public GraphQLResponse queryAssets(String channelId) {
        Map<String, Object> vars = Map.of("channelId", channelId);
        return query("query($channelId: ID!) { assets(channelId: $channelId) { id type status owner } }", vars);
    }

    /**
     * Query all contracts.
     */
    public GraphQLResponse queryContracts() {
        return query("{ contracts { id title status templateId parties { name role } } }");
    }

    /**
     * Query node metrics.
     */
    public GraphQLResponse queryNodeMetrics() {
        return query("{ nodeMetrics { totalNodes activeNodes validatorCount networkStatus } }");
    }
}
