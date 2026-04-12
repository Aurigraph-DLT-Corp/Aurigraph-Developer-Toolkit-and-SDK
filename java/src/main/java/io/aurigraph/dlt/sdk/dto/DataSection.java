package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * A categorized section of user data within a GDPR export.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DataSection(
        String category,
        List<Map<String, Object>> data
) {}
