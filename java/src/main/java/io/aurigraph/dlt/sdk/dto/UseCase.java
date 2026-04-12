package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UseCase {
    public String id;
    public String name;
    public String category;
    public String description;
    public Integer assetCount;
    public Integer contractCount;

    public UseCase() {}
}
