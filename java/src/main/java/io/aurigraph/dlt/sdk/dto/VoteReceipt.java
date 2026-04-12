package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

/**
 * Receipt confirming a governance vote was recorded.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record VoteReceipt(
        String proposalId,
        String voterAddress,
        boolean approved,
        Instant timestamp
) {}
