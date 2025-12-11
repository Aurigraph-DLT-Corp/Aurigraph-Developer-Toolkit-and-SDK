package io.aurigraph.v11.registry.dto;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request DTO for updating an existing asset.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public class AssetUpdateRequest {

    @Size(max = 255, message = "Name cannot exceed 255 characters")
    public String name;

    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    public String description;

    public BigDecimal estimatedValue;

    public String location;

    @Size(max = 2, message = "Country code must be 2 characters")
    public String countryCode;

    public Map<String, Object> metadata;
}
