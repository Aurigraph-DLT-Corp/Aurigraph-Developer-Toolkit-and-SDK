package io.aurigraph.dlt.sdk.handshake;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Token type descriptor returned by {@code GET /api/v11/sdk/token-types}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TokenTypeDescriptor(
        String typeCode,
        String displayName,
        String description,
        int tierMinLevel
) {}
