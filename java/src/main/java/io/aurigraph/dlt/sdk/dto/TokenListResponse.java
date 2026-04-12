package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Paginated response for GET /api/v11/registries/tokens.
 * Matches the V12 {@code PageResponse<TokenEntry>} envelope.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenListResponse {
    public List<TokenDetail> content = new ArrayList<>();
    public int page;
    public int size;
    public long totalElements;
    public int totalPages;

    public TokenListResponse() {}
}
