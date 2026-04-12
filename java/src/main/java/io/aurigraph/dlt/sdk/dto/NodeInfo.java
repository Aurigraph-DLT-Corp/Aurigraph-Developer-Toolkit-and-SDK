package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class NodeInfo {
    public String nodeId;
    public String nodeType;
    public String status;
    public String host;
    public Integer port;
    public String publicKey;
    public String registeredAt;
    public String lastHeartbeat;

    public NodeInfo() {}
}
