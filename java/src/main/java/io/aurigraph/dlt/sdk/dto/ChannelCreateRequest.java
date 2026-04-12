package io.aurigraph.dlt.sdk.dto;

public class ChannelCreateRequest {
    public String name;
    public String type;
    public String description;

    public ChannelCreateRequest() {}

    public ChannelCreateRequest(String name, String type, String description) {
        this.name = name;
        this.type = type;
        this.description = description;
    }
}
