package io.aurigraph.v11.dto.topology;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Data Transfer Object for Geographic Location
 */
public record LocationDTO(
    @JsonProperty("latitude") double latitude,
    @JsonProperty("longitude") double longitude,
    @JsonProperty("city") String city,
    @JsonProperty("country") String country,
    @JsonProperty("region") String region,
    @JsonProperty("dataCenter") String dataCenter
) {
    /**
     * Predefined locations for common data centers
     */
    public static final LocationDTO US_EAST = new LocationDTO(39.0438, -77.4874, "Ashburn", "USA", "US-EAST", "AWS us-east-1");
    public static final LocationDTO US_WEST = new LocationDTO(45.8399, -119.7006, "The Dalles", "USA", "US-WEST", "GCP us-west1");
    public static final LocationDTO EU_WEST = new LocationDTO(53.3498, -6.2603, "Dublin", "Ireland", "EU-WEST", "AWS eu-west-1");
    public static final LocationDTO EU_CENTRAL = new LocationDTO(50.1109, 8.6821, "Frankfurt", "Germany", "EU-CENTRAL", "AWS eu-central-1");
    public static final LocationDTO APAC_EAST = new LocationDTO(35.6762, 139.6503, "Tokyo", "Japan", "APAC-EAST", "AWS ap-northeast-1");
    public static final LocationDTO APAC_SOUTH = new LocationDTO(1.3521, 103.8198, "Singapore", "Singapore", "APAC-SOUTH", "AWS ap-southeast-1");
    public static final LocationDTO INDIA = new LocationDTO(19.0760, 72.8777, "Mumbai", "India", "APAC-SOUTH", "AWS ap-south-1");

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private double latitude;
        private double longitude;
        private String city;
        private String country;
        private String region;
        private String dataCenter;

        public Builder latitude(double latitude) { this.latitude = latitude; return this; }
        public Builder longitude(double longitude) { this.longitude = longitude; return this; }
        public Builder city(String city) { this.city = city; return this; }
        public Builder country(String country) { this.country = country; return this; }
        public Builder region(String region) { this.region = region; return this; }
        public Builder dataCenter(String dataCenter) { this.dataCenter = dataCenter; return this; }

        public LocationDTO build() {
            return new LocationDTO(latitude, longitude, city, country, region, dataCenter);
        }
    }
}
