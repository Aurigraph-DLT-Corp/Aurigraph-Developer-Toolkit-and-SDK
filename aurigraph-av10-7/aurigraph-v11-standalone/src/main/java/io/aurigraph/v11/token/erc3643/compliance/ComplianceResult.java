package io.aurigraph.v11.token.erc3643.compliance;

import java.time.Instant;
import java.util.List;

/**
 * Result of a compliance evaluation
 */
public record ComplianceResult(
        boolean approved,
        String reason,
        List<ComplianceRulesEngine.RuleEvaluationResult> ruleResults,
        Instant evaluatedAt,
        String transactionId) {
}
