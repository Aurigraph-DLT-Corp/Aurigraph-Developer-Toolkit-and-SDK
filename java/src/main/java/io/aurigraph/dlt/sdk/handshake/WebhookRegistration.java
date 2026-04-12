package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Webhook registration request body for {@code POST /api/v11/sdk/webhooks}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WebhookRegistration(
        String url,
        List<String> events,
        String secret
) {
    /** Convenience constructor without secret. */
    public WebhookRegistration(String url, List<String> events) {
        this(url, events, null);
    }
}
