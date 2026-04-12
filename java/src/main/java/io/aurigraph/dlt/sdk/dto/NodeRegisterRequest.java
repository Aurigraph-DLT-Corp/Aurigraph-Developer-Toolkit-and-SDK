package io.aurigraph.dlt.sdk.dto;

public class NodeRegisterRequest {
    public String nodeId;
    public String nodeType;
    public String host;
    public Integer port;
    public String publicKey;
    public String nodeLabel;
    public String version;

    public NodeRegisterRequest() {}

    public NodeRegisterRequest(String nodeId, String nodeType) {
        this.nodeId = nodeId;
        this.nodeType = nodeType;
    }
}
