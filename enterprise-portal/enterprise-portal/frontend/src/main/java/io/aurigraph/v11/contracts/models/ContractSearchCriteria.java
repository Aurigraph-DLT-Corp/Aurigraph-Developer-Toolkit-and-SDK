package io.aurigraph.v11.contracts.models;

import io.aurigraph.v11.contracts.ContractStatus;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContractSearchCriteria {
    
    private String contractType;
    private ContractStatus status;
    private String creatorAddress;
    private String partyAddress;
    private Instant createdAfter;
    private Instant createdBefore;
    private List<String> tags;
    private String templateId;
    private int page = 0;
    private int size = 20;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
}