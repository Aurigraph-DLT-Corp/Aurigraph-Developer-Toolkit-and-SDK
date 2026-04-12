package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

/**
 * Receipt confirming a GDPR erasure request has been accepted.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ErasureReceipt(
        String trackingId,
        String status,
        Instant requestedAt
) {}
