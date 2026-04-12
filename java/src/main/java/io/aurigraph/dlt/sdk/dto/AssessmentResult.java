package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

/**
 * Result of a compliance assessment against a specific framework.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AssessmentResult(
        String assetId,
        String framework,
        String status,
        Instant assessedAt
) {}
