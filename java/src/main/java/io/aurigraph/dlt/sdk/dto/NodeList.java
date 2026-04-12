package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class NodeList {
    public List<NodeInfo> nodes = new ArrayList<>();
    public int total;
    public Integer page;
    public Integer pageSize;

    public NodeList() {}
}
