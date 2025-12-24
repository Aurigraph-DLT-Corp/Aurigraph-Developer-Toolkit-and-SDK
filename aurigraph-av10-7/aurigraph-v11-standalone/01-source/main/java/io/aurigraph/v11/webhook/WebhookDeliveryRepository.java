package io.aurigraph.v11.webhook;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.logging.Logger;
import java.util.UUID;

import io.aurigraph.v11.proto.DeliveryStatus;

/**
 * Story 8, Phase 3: WebhookDeliveryRepository
 *
 * Repository for persisting and querying webhook delivery records.
 *
 * Responsibilities:
 * - Update delivery status after HTTP attempts
 * - Query pending deliveries for retry
 * - Calculate statistics (success rate, avg response time)
 * - Archive old delivery records
 * - Support delivery history queries
 *
 * Uses JPA/Panache for database operations with PostgreSQL backend.
 */
@ApplicationScoped
public class WebhookDeliveryRepository {

    private static final Logger LOG = Logger.getLogger(WebhookDeliveryRepository.class.getName());

    @Inject
    private EntityManager entityManager;

    /**
     * Update delivery status after attempt
     */
    @Transactional
    public void updateDeliveryStatus(String deliveryId, DeliveryStatus status, long responseTime) {
        try {
            String sql = "UPDATE webhook_delivery_records SET " +
                "status = ?1, response_time_ms = ?2, delivered_at = ?3, updated_at = CURRENT_TIMESTAMP " +
                "WHERE delivery_id = ?4";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, status.toString());
            query.setParameter(2, (int) responseTime);
            query.setParameter(3, status == DeliveryStatus.DELIVERY_STATUS_DELIVERED ? Instant.now() : null);
            query.setParameter(4, UUID.fromString(deliveryId));

            int updated = query.executeUpdate();
            if (updated > 0) {
                LOG.fine("Updated delivery status: " + deliveryId + " -> " + status);
            }

        } catch (Exception e) {
            LOG.warning("Error updating delivery status: " + e.getMessage());
        }
    }

    /**
     * Mark delivery as ready for retry
     */
    @Transactional
    public void scheduleRetry(String deliveryId, int newAttemptNumber, long nextRetryAt) {
        try {
            String sql = "UPDATE webhook_delivery_records SET " +
                "status = 'RETRYING', attempt_number = ?1, next_retry_at = ?2, updated_at = CURRENT_TIMESTAMP " +
                "WHERE delivery_id = ?3";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, newAttemptNumber);
            query.setParameter(2, Instant.ofEpochMilli(nextRetryAt));
            query.setParameter(3, UUID.fromString(deliveryId));

            query.executeUpdate();
            LOG.fine("Scheduled retry: " + deliveryId + " (attempt " + newAttemptNumber + ")");

        } catch (Exception e) {
            LOG.warning("Error scheduling retry: " + e.getMessage());
        }
    }

    /**
     * Get pending deliveries ready for processing
     *
     * Fetches deliveries with status PENDING or RETRYING where next_retry_at has passed.
     */
    @Transactional
    public List<?> getPendingDeliveries(int limit) {
        try {
            String sql = "SELECT * FROM pending_webhook_deliveries LIMIT ?1";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, limit);

            return query.getResultList();

        } catch (Exception e) {
            LOG.warning("Error fetching pending deliveries: " + e.getMessage());
            return List.of();
        }
    }

    /**
     * Get delivery record by ID
     */
    @Transactional
    public Object getDeliveryRecord(String deliveryId) {
        try {
            String sql = "SELECT * FROM webhook_delivery_records WHERE delivery_id = ?1";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, UUID.fromString(deliveryId));

            return query.getSingleResult();

        } catch (Exception e) {
            LOG.fine("Delivery not found: " + deliveryId);
            return null;
        }
    }

    /**
     * Get delivery history for a webhook
     */
    @Transactional
    public List<?> getDeliveryHistory(String webhookId, int limit) {
        try {
            String sql = "SELECT * FROM webhook_delivery_records WHERE webhook_id = ?1 " +
                "ORDER BY created_at DESC LIMIT ?2";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, UUID.fromString(webhookId));
            query.setParameter(2, limit);

            return query.getResultList();

        } catch (Exception e) {
            LOG.warning("Error fetching delivery history: " + e.getMessage());
            return List.of();
        }
    }

    /**
     * Get failed deliveries ready for manual retry
     */
    @Transactional
    public List<?> getFailedDeliveriesForManualRetry(int limit) {
        try {
            String sql = "SELECT * FROM webhook_delivery_records WHERE status = 'FAILED' " +
                "AND attempt_number >= max_attempts ORDER BY created_at DESC LIMIT ?1";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, limit);

            return query.getResultList();

        } catch (Exception e) {
            LOG.warning("Error fetching failed deliveries: " + e.getMessage());
            return List.of();
        }
    }

    /**
     * Calculate webhook delivery statistics
     */
    @Transactional
    public DeliveryStats getDeliveryStats(String webhookId) {
        try {
            String sql = "SELECT " +
                "COUNT(*) as total_deliveries, " +
                "SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as successful, " +
                "SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed, " +
                "AVG(CASE WHEN status = 'DELIVERED' THEN response_time_ms ELSE NULL END) as avg_response_time " +
                "FROM webhook_delivery_records WHERE webhook_id = ?1";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, UUID.fromString(webhookId));

            Object[] result = (Object[]) query.getSingleResult();

            long total = ((Number) result[0]).longValue();
            long successful = result[1] != null ? ((Number) result[1]).longValue() : 0;
            long failed = result[2] != null ? ((Number) result[2]).longValue() : 0;
            double avgTime = result[3] != null ? ((Number) result[3]).doubleValue() : 0;

            double successRate = total > 0 ? (successful * 100.0) / total : 0;

            return new DeliveryStats(total, successful, failed, successRate, (long) avgTime);

        } catch (Exception e) {
            LOG.warning("Error calculating delivery stats: " + e.getMessage());
            return new DeliveryStats(0, 0, 0, 0, 0);
        }
    }

    /**
     * Clean up old delivery records (older than retention period)
     *
     * Keeps delivery records for 90 days by default (configurable).
     */
    @Transactional
    public int cleanupOldRecords(int retentionDays) {
        try {
            Instant cutoffDate = Instant.now().minus(retentionDays, ChronoUnit.DAYS);

            String sql = "DELETE FROM webhook_delivery_records WHERE created_at < ?1 AND status != 'PENDING'";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, cutoffDate);

            int deleted = query.executeUpdate();
            LOG.info("Cleaned up " + deleted + " old delivery records");

            return deleted;

        } catch (Exception e) {
            LOG.warning("Error cleaning up old records: " + e.getMessage());
            return 0;
        }
    }

    /**
     * Archive delivery records to separate table (for long-term storage)
     */
    @Transactional
    public int archiveCompletedRecords(int daysOld) {
        try {
            Instant cutoffDate = Instant.now().minus(daysOld, ChronoUnit.DAYS);

            String sql = "INSERT INTO webhook_delivery_records_archive SELECT * FROM webhook_delivery_records " +
                "WHERE completed_at < ?1 AND status IN ('DELIVERED', 'FAILED')";

            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, cutoffDate);

            int archived = query.executeUpdate();
            LOG.info("Archived " + archived + " delivery records");

            return archived;

        } catch (Exception e) {
            LOG.warning("Error archiving records: " + e.getMessage());
            return 0;
        }
    }

    /**
     * Statistics class for delivery metrics
     */
    public static class DeliveryStats {
        public final long totalDeliveries;
        public final long successfulDeliveries;
        public final long failedDeliveries;
        public final double successRate;
        public final long averageResponseTimeMs;

        public DeliveryStats(long total, long successful, long failed, double rate, long avgTime) {
            this.totalDeliveries = total;
            this.successfulDeliveries = successful;
            this.failedDeliveries = failed;
            this.successRate = rate;
            this.averageResponseTimeMs = avgTime;
        }

        @Override
        public String toString() {
            return String.format("DeliveryStats{total=%d, successful=%d, failed=%d, rate=%.2f%%, avgTime=%dms}",
                totalDeliveries, successfulDeliveries, failedDeliveries, successRate, averageResponseTimeMs);
        }
    }
}
