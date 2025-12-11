package io.aurigraph.v11.registry.dto;

import io.aurigraph.v11.registry.AssetCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request DTO for asset registration.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public class AssetRegistrationRequest {

    @NotBlank(message = "Asset name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    public String name;

    @Size(max = 5000, message = "Description cannot exceed 5000 characters")
    public String description;

    @NotNull(message = "Category is required")
    public AssetCategory category;

    @NotBlank(message = "Owner ID is required")
    public String ownerId;

    public String ownerName;

    public BigDecimal estimatedValue;

    public String currency = "USD";

    public String location;

    @Size(max = 2, message = "Country code must be 2 characters")
    public String countryCode;

    public Map<String, Object> metadata;
}
