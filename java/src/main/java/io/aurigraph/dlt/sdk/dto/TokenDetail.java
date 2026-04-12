package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Full token detail returned by GET /api/v11/registries/tokens/{id}.
 * Extends {@link Token} with extra asset/metadata fields.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenDetail extends Token {
    public String assetEntryId;
    public String secondaryDataEntryId;
    public Map<String, String> metadata;

    public TokenDetail() {}
}
