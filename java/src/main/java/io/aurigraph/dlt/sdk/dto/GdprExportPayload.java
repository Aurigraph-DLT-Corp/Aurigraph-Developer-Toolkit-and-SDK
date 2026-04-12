package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;
import java.util.List;

/**
 * GDPR data export payload containing all user data sections.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GdprExportPayload(
        String userId,
        Instant exportedAt,
        List<DataSection> sections
) {}
