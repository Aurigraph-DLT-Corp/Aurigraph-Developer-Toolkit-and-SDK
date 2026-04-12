package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/**
 * Standard GraphQL response envelope with data and optional errors.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GraphQLResponse(
        Map<String, Object> data,
        List<GraphQLError> errors
) {}
