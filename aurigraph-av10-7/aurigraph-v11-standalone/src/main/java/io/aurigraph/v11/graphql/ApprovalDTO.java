package io.aurigraph.v11.graphql;

import io.aurigraph.v11.token.secondary.ApprovalStatus;
import io.aurigraph.v11.token.secondary.ValidatorVote;
import io.aurigraph.v11.token.secondary.VVBApprovalRequest;
import org.eclipse.microprofile.graphql.Type;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ApprovalDTO - GraphQL Type for Approval responses
 *
 * Maps VVBApprovalRequest to GraphQL type with all approval data.
 */
@Type
public class ApprovalDTO {
    public String id;
    public ApprovalStatus status;
    public String tokenVersionId;
    public Integer totalValidators;
    public LocalDateTime votingWindowEnd;
    public List<ValidatorVote> votes;
    public LocalDateTime consensusReachedAt;
    public LocalDateTime executedAt;
    public LocalDateTime rejectedAt;
    public LocalDateTime createdAt;

    public ApprovalDTO() {}

    public ApprovalDTO(VVBApprovalRequest approval) {
        this.id = approval.requestId;
        this.status = approval.status;
        this.tokenVersionId = approval.tokenVersionId;
        this.totalValidators = approval.totalValidators;
        this.votingWindowEnd = approval.votingWindowEnd;
        this.votes = approval.votes;
        this.consensusReachedAt = approval.consensusReachedAt;
        this.executedAt = approval.executedAt;
        this.rejectedAt = approval.rejectedAt;
        this.createdAt = approval.createdAt;
    }
}
