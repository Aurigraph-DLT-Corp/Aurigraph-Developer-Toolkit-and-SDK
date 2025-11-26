package io.aurigraph.v11.oracle;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Oracle Verification Repository
 * Provides database operations for oracle verification records
 *
 * @author Aurigraph V11 - Backend Development Agent
 * @version 11.0.0
 * @sprint Sprint 16 - Oracle Verification System (AV11-483)
 */
@ApplicationScoped
public class OracleVerificationRepository implements PanacheRepository<OracleVerificationEntity> {

    /**
     * Find verification by verification ID
     */
    public Optional<OracleVerificationEntity> findByVerificationId(String verificationId) {
        return find("verificationId", verificationId).firstResultOptional();
    }

    /**
     * Find all verifications for a specific asset
     */
    public List<OracleVerificationEntity> findByAssetId(String assetId) {
        return find("assetId", Sort.descending("verificationTimestamp"), assetId).list();
    }

    /**
     * Find verifications for an asset with limit
     */
    public List<OracleVerificationEntity> findByAssetId(String assetId, int limit) {
        return find("assetId", Sort.descending("verificationTimestamp"), assetId)
            .page(0, limit)
            .list();
    }

    /**
     * Find most recent verification for an asset
     */
    public Optional<OracleVerificationEntity> findLatestByAssetId(String assetId) {
        return find("assetId", Sort.descending("verificationTimestamp"), assetId)
            .firstResultOptional();
    }

    /**
     * Find verifications by status
     */
    public List<OracleVerificationEntity> findByStatus(String status) {
        return find("verificationStatus", Sort.descending("verificationTimestamp"), status).list();
    }

    /**
     * Find approved verifications
     */
    public List<OracleVerificationEntity> findApproved() {
        return findByStatus("APPROVED");
    }

    /**
     * Find rejected verifications
     */
    public List<OracleVerificationEntity> findRejected() {
        return findByStatus("REJECTED");
    }

    /**
     * Find verifications with consensus reached
     */
    public List<OracleVerificationEntity> findWithConsensus() {
        return find("consensusReached = :reached", Sort.descending("verificationTimestamp"),
            io.quarkus.panache.common.Parameters.with("reached", true)).list();
    }

    /**
     * Find verifications without consensus
     */
    public List<OracleVerificationEntity> findWithoutConsensus() {
        return find("consensusReached = :reached", Sort.descending("verificationTimestamp"),
            io.quarkus.panache.common.Parameters.with("reached", false)).list();
    }

    /**
     * Find verifications within time range
     */
    public List<OracleVerificationEntity> findByTimestampRange(Instant start, Instant end) {
        return find("verificationTimestamp >= ?1 and verificationTimestamp <= ?2",
            Sort.descending("verificationTimestamp"), start, end).list();
    }

    /**
     * Find recent verifications (last N hours)
     */
    public List<OracleVerificationEntity> findRecent(int hours) {
        Instant since = Instant.now().minusSeconds(hours * 3600L);
        return find("verificationTimestamp >= ?1", Sort.descending("verificationTimestamp"), since).list();
    }

    /**
     * Find verifications with minimum successful oracles
     */
    public List<OracleVerificationEntity> findByMinSuccessfulOracles(int minSuccessful) {
        return find("successfulOracles >= ?1", Sort.descending("verificationTimestamp"), minSuccessful).list();
    }

    /**
     * Count verifications by status
     */
    public long countByStatus(String status) {
        return count("verificationStatus", status);
    }

    /**
     * Count verifications for asset
     */
    public long countByAssetId(String assetId) {
        return count("assetId", assetId);
    }

    /**
     * Get verification statistics
     */
    public VerificationStatistics getStatistics() {
        long total = count();
        long approved = countByStatus("APPROVED");
        long rejected = countByStatus("REJECTED");
        long insufficient = countByStatus("INSUFFICIENT_DATA");
        long withConsensus = count("consensusReached = :reached",
            io.quarkus.panache.common.Parameters.with("reached", true));

        double avgConsensusPercentage = find("consensusReached = :reached",
            io.quarkus.panache.common.Parameters.with("reached", true))
            .stream()
            .mapToDouble(e -> e.consensusPercentage)
            .average()
            .orElse(0.0);

        double avgVerificationTimeMs = listAll()
            .stream()
            .mapToLong(e -> e.totalVerificationTimeMs)
            .average()
            .orElse(0.0);

        return new VerificationStatistics(
            total,
            approved,
            rejected,
            insufficient,
            withConsensus,
            avgConsensusPercentage,
            avgVerificationTimeMs
        );
    }

    /**
     * Verification Statistics record
     */
    public record VerificationStatistics(
        long totalVerifications,
        long approvedVerifications,
        long rejectedVerifications,
        long insufficientDataVerifications,
        long verificationsWithConsensus,
        double averageConsensusPercentage,
        double averageVerificationTimeMs
    ) {}
}
