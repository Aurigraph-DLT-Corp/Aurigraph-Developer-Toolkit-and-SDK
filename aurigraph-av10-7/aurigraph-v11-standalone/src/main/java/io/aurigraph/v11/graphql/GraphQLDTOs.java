package io.aurigraph.v11.graphql;

import org.eclipse.microprofile.graphql.Type;
import java.util.Map;

/**
 * GraphQL Data Transfer Objects for Story 8 API
 *
 * Contains all DTO classes for GraphQL responses, statistics, and events.
 */

@Type
public class ApprovalStatisticsDTO {
    public Integer totalApprovals;
    public Integer pending;
    public Integer approved;
    public Integer rejected;
    public Integer expired;
    public Double averageConsensusTimeSeconds;
    public Long timestamp;

    public ApprovalStatisticsDTO() {}

    public ApprovalStatisticsDTO(Integer total, Integer pending, Integer approved,
                                 Integer rejected, Integer expired, Double avgTime, Long ts) {
        this.totalApprovals = total;
        this.pending = pending;
        this.approved = approved;
        this.rejected = rejected;
        this.expired = expired;
        this.averageConsensusTimeSeconds = avgTime;
        this.timestamp = ts;
    }
}

@Type
public class ValidatorStatsDTO {
    public String validatorId;
    public Integer totalVotes;
    public Integer approvesCount;
    public Integer rejectsCount;
    public Integer absorbCount;
    public Double approvalRate;

    public ValidatorStatsDTO() {}

    public ValidatorStatsDTO(String validatorId, Integer totalVotes, Integer approves,
                            Integer rejects, Integer absorbs, Double approvalRate) {
        this.validatorId = validatorId;
        this.totalVotes = totalVotes;
        this.approvesCount = approves;
        this.rejectsCount = rejects;
        this.absorbCount = absorbs;
        this.approvalRate = approvalRate;
    }
}

@Type
public class ExecutionResponseDTO {
    public Boolean success;
    public String message;
    public String executionId;

    public ExecutionResponseDTO() {}

    public ExecutionResponseDTO(Boolean success, String message, String executionId) {
        this.success = success;
        this.message = message;
        this.executionId = executionId;
    }
}

@Type
public class WebhookResponseDTO {
    public Boolean success;
    public String message;
    public String webhookId;

    public WebhookResponseDTO() {}

    public WebhookResponseDTO(Boolean success, String message, String webhookId) {
        this.success = success;
        this.message = message;
        this.webhookId = webhookId;
    }
}

@Type
public class ApprovalEventDTO {
    public String approvalId;
    public String eventType;
    public String timestamp;
    public Map<String, Object> data;

    public ApprovalEventDTO() {}

    public ApprovalEventDTO(String approvalId, String eventType, String timestamp, Map<String, Object> data) {
        this.approvalId = approvalId;
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.data = data;
    }
}

@Type
public class VoteEventDTO {
    public String approvalId;
    public String validatorId;
    public String choice;
    public String timestamp;

    public VoteEventDTO() {}

    public VoteEventDTO(String approvalId, String validatorId, String choice, String timestamp) {
        this.approvalId = approvalId;
        this.validatorId = validatorId;
        this.choice = choice;
        this.timestamp = timestamp;
    }
}

@Type
public class ConsensusEventDTO {
    public String approvalId;
    public String result;
    public String timestamp;
    public Integer totalVotes;

    public ConsensusEventDTO() {}

    public ConsensusEventDTO(String approvalId, String result, String timestamp, Integer totalVotes) {
        this.approvalId = approvalId;
        this.result = result;
        this.timestamp = timestamp;
        this.totalVotes = totalVotes;
    }
}

@Type
public class WebhookEventDTO {
    public String webhookId;
    public String eventType;
    public Integer httpStatus;
    public Integer responseTimeMs;
    public String timestamp;

    public WebhookEventDTO() {}

    public WebhookEventDTO(String webhookId, String eventType, Integer httpStatus,
                          Integer responseTimeMs, String timestamp) {
        this.webhookId = webhookId;
        this.eventType = eventType;
        this.httpStatus = httpStatus;
        this.responseTimeMs = responseTimeMs;
        this.timestamp = timestamp;
    }
}
