package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * A single error entry in a GraphQL response.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GraphQLError(
        String message,
        List<String> path
) {}
