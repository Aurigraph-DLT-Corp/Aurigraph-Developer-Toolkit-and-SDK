package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Channel {
    public String channelId;
    public String name;
    public String type;
    public String description;
    public List<ChannelStakeholder> stakeholders;
    public String createdAt;

    public Channel() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ChannelStakeholder {
        public String nodeId;
        public String role;
        public String joinedAt;
    }
}
