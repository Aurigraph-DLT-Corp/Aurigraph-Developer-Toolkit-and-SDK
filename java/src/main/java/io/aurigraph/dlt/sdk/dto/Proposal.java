package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A governance proposal.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Proposal(
        String id,
        String title,
        String status,
        int votesFor,
        int votesAgainst
) {}
