package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.Channel;
import io.aurigraph.dlt.sdk.dto.ChannelCreateRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Namespace for /api/v11/channels endpoints.
 */
public class ChannelsApi {

    private final AurigraphClient client;

    public ChannelsApi(AurigraphClient client) {
        this.client = client;
    }

    public List<Channel> list() {
        JsonNode root = client.get("/channels", JsonNode.class);
        JsonNode list = root.isArray() ? root
                : (root.has("channels") ? root.get("channels")
                : (root.has("items") ? root.get("items") : null));
        if (list == null || !list.isArray()) return new ArrayList<>();
        try {
            return client.mapper().convertValue(list, new TypeReference<List<Channel>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public Channel get(String channelId) {
        String enc = URLEncoder.encode(channelId, StandardCharsets.UTF_8);
        return client.get("/channels/" + enc, Channel.class);
    }

    public Channel create(ChannelCreateRequest request) {
        return client.post("/channels", request, Channel.class);
    }
}
