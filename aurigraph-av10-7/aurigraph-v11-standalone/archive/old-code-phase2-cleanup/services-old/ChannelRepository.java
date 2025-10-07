package io.aurigraph.v11.services;

import io.aurigraph.v11.models.Channel;
import io.aurigraph.v11.models.ChannelStatus;
import io.aurigraph.v11.models.PrivacyLevel;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

/**
 * Channel Repository
 *
 * Panache repository for channel entity operations.
 * Provides database access methods for channel management.
 *
 * Part of Sprint 10 - Story 1 (AV11-054)
 *
 * @author Claude Code - Backend Development Agent (BDA-2)
 * @version 11.0.0
 * @since Sprint 10
 */
@ApplicationScoped
public class ChannelRepository implements PanacheRepository<Channel> {

    /**
     * Find channel by channel ID
     *
     * @param channelId Unique channel identifier
     * @return Optional containing the channel if found
     */
    public Optional<Channel> findByChannelId(String channelId) {
        return find("channelId", channelId).firstResultOptional();
    }

    /**
     * Find channel by name
     *
     * @param name Channel name
     * @return Optional containing the channel if found
     */
    public Optional<Channel> findByName(String name) {
        return find("name", name).firstResultOptional();
    }

    /**
     * Find all channels by status
     *
     * @param status Channel status
     * @return List of channels with the specified status
     */
    public List<Channel> findByStatus(ChannelStatus status) {
        return find("status", status).list();
    }

    /**
     * Find all active channels
     *
     * @return List of active non-archived channels
     */
    public List<Channel> findActiveChannels() {
        return find("status = ?1 and archived = false", ChannelStatus.ACTIVE).list();
    }

    /**
     * Find all channels by creator
     *
     * @param creatorAddress Creator's address
     * @return List of channels created by the specified address
     */
    public List<Channel> findByCreator(String creatorAddress) {
        return find("creatorAddress", creatorAddress).list();
    }

    /**
     * Find all channels by privacy level
     *
     * @param privacyLevel Privacy level
     * @return List of channels with the specified privacy level
     */
    public List<Channel> findByPrivacyLevel(PrivacyLevel privacyLevel) {
        return find("privacyLevel", privacyLevel).list();
    }

    /**
     * Find channels with member address
     *
     * @param memberAddress Member address to search
     * @return List of channels containing the member
     */
    public List<Channel> findChannelsWithMember(String memberAddress) {
        return find("select c from Channel c join c.members m where m.memberAddress = ?1", memberAddress).list();
    }

    /**
     * Count total channels
     *
     * @return Total number of channels
     */
    public long countTotalChannels() {
        return count();
    }

    /**
     * Count active channels
     *
     * @return Number of active channels
     */
    public long countActiveChannels() {
        return count("status = ?1 and archived = false", ChannelStatus.ACTIVE);
    }

    /**
     * Find channels with smart contracts enabled
     *
     * @return List of channels with smart contracts enabled
     */
    public List<Channel> findChannelsWithSmartContractsEnabled() {
        return find("enableSmartContracts = true and status = ?1", ChannelStatus.ACTIVE).list();
    }

    /**
     * Find channels by consensus algorithm
     *
     * @param algorithm Consensus algorithm name
     * @return List of channels using the specified consensus algorithm
     */
    public List<Channel> findByConsensusAlgorithm(String algorithm) {
        return find("consensusAlgorithm", algorithm).list();
    }

    /**
     * Search channels by name pattern
     *
     * @param namePattern Name pattern to search
     * @return List of matching channels
     */
    public List<Channel> searchByName(String namePattern) {
        return find("name like ?1", "%" + namePattern + "%").list();
    }

    /**
     * Find top N channels by transaction count
     *
     * @param limit Number of channels to return
     * @return List of top channels by transaction count
     */
    public List<Channel> findTopChannelsByTransactionCount(int limit) {
        return find("order by totalTransactions desc")
            .page(0, limit)
            .list();
    }

    /**
     * Find channels with low validator count
     *
     * @return List of channels below minimum validator threshold
     */
    public List<Channel> findChannelsWithLowValidatorCount() {
        return getEntityManager()
            .createQuery(
                "SELECT c FROM Channel c WHERE " +
                "(SELECT COUNT(m) FROM ChannelMember m WHERE m.channel = c AND m.nodeType = 'VALIDATOR') < c.minValidators",
                Channel.class
            )
            .getResultList();
    }

    /**
     * Find channels exceeding member limit
     *
     * @param percentage Percentage of max members (e.g., 90 for 90%)
     * @return List of channels near capacity
     */
    public List<Channel> findChannelsNearCapacity(int percentage) {
        return getEntityManager()
            .createQuery(
                "SELECT c FROM Channel c WHERE " +
                "(SELECT COUNT(m) FROM ChannelMember m WHERE m.channel = c) >= (c.maxMembers * :percentage / 100)",
                Channel.class
            )
            .setParameter("percentage", percentage)
            .getResultList();
    }

    /**
     * Update channel metrics (TPS, latency, etc.)
     *
     * @param channelId Channel ID
     * @param currentTps Current TPS value
     * @param avgLatencyMs Average latency in milliseconds
     */
    public void updateChannelMetrics(String channelId, Double currentTps, Double avgLatencyMs) {
        findByChannelId(channelId).ifPresent(channel -> {
            channel.updateTpsMetrics(currentTps);
            channel.setAvgLatencyMs(avgLatencyMs);
            persist(channel);
        });
    }

    /**
     * Archive channel
     *
     * @param channelId Channel ID
     * @param reason Archive reason
     * @return true if channel was archived successfully
     */
    public boolean archiveChannel(String channelId, String reason) {
        return findByChannelId(channelId).map(channel -> {
            channel.setArchived(true);
            channel.setArchivedAt(java.time.Instant.now());
            channel.setArchiveReason(reason);
            channel.setStatus(ChannelStatus.ARCHIVED);
            persist(channel);
            return true;
        }).orElse(false);
    }

    /**
     * Check if channel exists by channel ID
     *
     * @param channelId Channel ID
     * @return true if channel exists
     */
    public boolean existsByChannelId(String channelId) {
        return count("channelId", channelId) > 0;
    }

    /**
     * Check if channel name is taken
     *
     * @param name Channel name
     * @return true if name is already used
     */
    public boolean existsByName(String name) {
        return count("name", name) > 0;
    }
}
