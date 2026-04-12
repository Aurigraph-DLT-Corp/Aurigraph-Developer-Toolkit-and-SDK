package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Response from {@code POST /api/v11/sdk/handshake/heartbeat}.
 *
 * <p>Returned by the liveness ping (call every 5 minutes by default).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record HeartbeatResponse(
        String receivedAt,
        String nextHeartbeatAt,
        String status
) {}
