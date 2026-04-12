package io.aurigraph.dlt.sdk.namespace;

import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.NodeInfo;
import io.aurigraph.dlt.sdk.dto.NodeList;
import io.aurigraph.dlt.sdk.dto.NodeMetrics;
import io.aurigraph.dlt.sdk.dto.NodeRegisterRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Namespace for /api/v11/nodes endpoints.
 */
public class NodesApi {

    private final AurigraphClient client;

    public NodesApi(AurigraphClient client) {
        this.client = client;
    }

    public NodeList list() {
        return list(0, 50);
    }

    public NodeList list(int page, int pageSize) {
        return client.get("/nodes?page=" + page + "&pageSize=" + pageSize, NodeList.class);
    }

    public NodeInfo get(String nodeId) {
        String enc = URLEncoder.encode(nodeId, StandardCharsets.UTF_8);
        return client.get("/nodes/" + enc, NodeInfo.class);
    }

    public NodeInfo register(NodeRegisterRequest request) {
        return client.post("/nodes", request, NodeInfo.class);
    }

    public NodeMetrics getMetrics() {
        return client.get("/nodes/metrics", NodeMetrics.class);
    }
}
