package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Webhook info returned by {@code GET /api/v11/sdk/webhooks}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WebhookInfo(
        String webhookId,
        String url,
        List<String> events,
        boolean isActive,
        String createdAt
) {}
