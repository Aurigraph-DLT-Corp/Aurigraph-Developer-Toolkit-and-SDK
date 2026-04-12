package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Request body for POST /api/v11/registries/tokens/{id}/mint.
 * V12 server-side shape: {@code { amount: Long, recipient: String }}.
 *
 * <p>Note: there is a separate {@link MintReceipt} DTO used by the DMRV
 * namespace for contract-triggered mints — that is a different endpoint.
 * This class is for the generic token registry mint endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TokenMintRequest {
    public Long amount;
    public String recipient;
    public Map<String, Object> metadata;

    public TokenMintRequest() {}

    public TokenMintRequest(long amount, String recipient) {
        this.amount = amount;
        this.recipient = recipient;
    }
}
