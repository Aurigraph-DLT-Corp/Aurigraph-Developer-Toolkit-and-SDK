package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A compliance framework definition (e.g. MiCA, GDPR, LBMA).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ComplianceFramework(
        String code,
        String description,
        String url
) {}
