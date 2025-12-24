package io.aurigraph.v11.token.secondary;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * CDI Event: Approval Finalized
 *
 * Fired when an approval request is finalized as APPROVED.
 * The associated token version is activated.
 * Allows subscribers to react to approval (revenue hooks, notifications, metrics).
 *
 * @version 12.0.0
 * @since December 23, 2025
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalEvent {
    private UUID approvalRequestId;
    private UUID tokenVersionId;
}
