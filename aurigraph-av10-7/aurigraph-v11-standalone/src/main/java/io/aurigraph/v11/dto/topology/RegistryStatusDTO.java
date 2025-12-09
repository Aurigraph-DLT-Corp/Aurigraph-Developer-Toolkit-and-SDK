package io.aurigraph.v11.dto.topology;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

/**
 * Data Transfer Object for Node Registry Status
 */
public record RegistryStatusDTO(
    @JsonProperty("registered") boolean registered,
    @JsonProperty("lastHeartbeat") Instant lastHeartbeat,
    @JsonProperty("version") String version,
    @JsonProperty("protocolVersion") String protocolVersion,
    @JsonProperty("isHealthy") boolean isHealthy
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private boolean registered = true;
        private Instant lastHeartbeat = Instant.now();
        private String version = "12.0.0";
        private String protocolVersion = "1.0";
        private boolean isHealthy = true;

        public Builder registered(boolean registered) { this.registered = registered; return this; }
        public Builder lastHeartbeat(Instant lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; return this; }
        public Builder version(String version) { this.version = version; return this; }
        public Builder protocolVersion(String protocolVersion) { this.protocolVersion = protocolVersion; return this; }
        public Builder isHealthy(boolean isHealthy) { this.isHealthy = isHealthy; return this; }

        public RegistryStatusDTO build() {
            return new RegistryStatusDTO(registered, lastHeartbeat, version, protocolVersion, isHealthy);
        }
    }
}
