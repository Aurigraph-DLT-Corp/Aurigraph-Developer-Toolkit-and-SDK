package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

/**
 * Receipt confirming a wallet transfer was processed.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TransferReceipt(
        String txHash,
        String status,
        Instant timestamp
) {}
