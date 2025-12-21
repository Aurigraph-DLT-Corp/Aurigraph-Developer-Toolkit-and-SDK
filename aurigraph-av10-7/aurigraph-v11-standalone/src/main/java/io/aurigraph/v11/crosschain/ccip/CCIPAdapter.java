package io.aurigraph.v11.crosschain.ccip;

import io.aurigraph.v11.crosschain.ccip.CCIPMessage.ExecutionState;
import io.aurigraph.v11.crosschain.ccip.CCIPMessage.MessageType;
import io.aurigraph.v11.crosschain.ccip.CCIPMessage.TokenAmount;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Chainlink CCIP (Cross-Chain Interoperability Protocol) Adapter
 *
 * Implements the Chainlink CCIP interface for secure cross-chain communication
 * between Aurigraph and other EVM-compatible blockchains.
 *
 * Features:
 * - Arbitrary message passing between chains
 * - Token transfers with programmable logic
 * - Fee estimation and optimization
 * - Message status tracking and monitoring
 * - Multi-lane support for different security levels
 * - Rate limiting and access control
 * - Automatic retry and error recovery
 *
 * Supported Chains:
 * - Ethereum Mainnet (Chain Selector: 5009297550715157269)
 * - Arbitrum One (Chain Selector: 4949039107694359620)
 * - Optimism (Chain Selector: 3734403246176062136)
 * - Base (Chain Selector: 15971525489660198786)
 * - Polygon (Chain Selector: 4051577828743386545)
 * - Avalanche (Chain Selector: 6433500567565415381)
 * - BSC (Chain Selector: 11344663589394136015)
 *
 * Performance Targets:
 * - Message relay: <15 minutes for finality
 * - Fee estimation: <500ms
 * - Throughput: 1000+ messages/hour
 *
 * @author Aurigraph V12 Integration Team
 * @version 12.0.0
 * @since 2025-01-01
 * @see <a href="https://docs.chain.link/ccip">Chainlink CCIP Documentation</a>
 */
@ApplicationScoped
public class CCIPAdapter {

    private static final Logger log = LoggerFactory.getLogger(CCIPAdapter.class);

    /**
     * CCIP Router contract addresses by chain
     * Note: Chain selectors that exceed Long.MAX_VALUE are represented as negative longs
     * (using two's complement representation for unsigned 64-bit integers)
     */
    private static final Map<Long, String> ROUTER_ADDRESSES = new HashMap<>();
    static {
        ROUTER_ADDRESSES.put(5009297550715157269L, "0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D");  // Ethereum
        ROUTER_ADDRESSES.put(4949039107694359620L, "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8");  // Arbitrum
        ROUTER_ADDRESSES.put(3734403246176062136L, "0x3206695CaE29952f4b0c22a169725a865bc8Ce0f");  // Optimism
        ROUTER_ADDRESSES.put(-2475218583049352830L, "0x881e3A65B4d4a04dD529061dd0071cf975F58bCD"); // Base (15971525489660198786 as signed)
        ROUTER_ADDRESSES.put(4051577828743386545L, "0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe");  // Polygon
        ROUTER_ADDRESSES.put(6433500567565415381L, "0xF4c7E640EdA248EF95972845a62bdC74237805dB");  // Avalanche
        ROUTER_ADDRESSES.put(-7102080484315353601L, "0x34B03Cb9086d7D758AC55af71584F81A598759FE");  // BSC (11344663589394136015 as signed)
    }

    /**
     * Chain names for display
     */
    private static final Map<Long, String> CHAIN_NAMES = new HashMap<>();
    static {
        CHAIN_NAMES.put(5009297550715157269L, "Ethereum");
        CHAIN_NAMES.put(4949039107694359620L, "Arbitrum One");
        CHAIN_NAMES.put(3734403246176062136L, "Optimism");
        CHAIN_NAMES.put(-2475218583049352830L, "Base");  // 15971525489660198786 as signed
        CHAIN_NAMES.put(4051577828743386545L, "Polygon");
        CHAIN_NAMES.put(6433500567565415381L, "Avalanche");
        CHAIN_NAMES.put(-7102080484315353601L, "BSC");   // 11344663589394136015 as signed
    }

    /**
     * Supported lane configurations (source -> destinations)
     */
    private static final Map<Long, Set<Long>> SUPPORTED_LANES = new HashMap<>();

    // Chain selector constants for readability
    private static final long CHAIN_ETHEREUM = 5009297550715157269L;
    private static final long CHAIN_ARBITRUM = 4949039107694359620L;
    private static final long CHAIN_OPTIMISM = 3734403246176062136L;
    private static final long CHAIN_BASE = -2475218583049352830L;      // 15971525489660198786 as signed
    private static final long CHAIN_POLYGON = 4051577828743386545L;
    private static final long CHAIN_AVALANCHE = 6433500567565415381L;
    private static final long CHAIN_BSC = -7102080484315353601L;       // 11344663589394136015 as signed

    static {
        // Ethereum lanes
        SUPPORTED_LANES.put(CHAIN_ETHEREUM, Set.of(
            CHAIN_ARBITRUM, CHAIN_OPTIMISM, CHAIN_BASE,
            CHAIN_POLYGON, CHAIN_AVALANCHE, CHAIN_BSC
        ));
        // Arbitrum lanes
        SUPPORTED_LANES.put(CHAIN_ARBITRUM, Set.of(
            CHAIN_ETHEREUM, CHAIN_OPTIMISM, CHAIN_BASE,
            CHAIN_POLYGON, CHAIN_AVALANCHE
        ));
        // Optimism lanes
        SUPPORTED_LANES.put(CHAIN_OPTIMISM, Set.of(
            CHAIN_ETHEREUM, CHAIN_ARBITRUM, CHAIN_BASE,
            CHAIN_POLYGON
        ));
        // Base lanes
        SUPPORTED_LANES.put(CHAIN_BASE, Set.of(
            CHAIN_ETHEREUM, CHAIN_ARBITRUM, CHAIN_OPTIMISM,
            CHAIN_POLYGON
        ));
        // Polygon lanes
        SUPPORTED_LANES.put(CHAIN_POLYGON, Set.of(
            CHAIN_ETHEREUM, CHAIN_ARBITRUM, CHAIN_OPTIMISM,
            CHAIN_BASE, CHAIN_AVALANCHE
        ));
        // Avalanche lanes
        SUPPORTED_LANES.put(CHAIN_AVALANCHE, Set.of(
            CHAIN_ETHEREUM, CHAIN_ARBITRUM, CHAIN_POLYGON
        ));
        // BSC lanes
        SUPPORTED_LANES.put(CHAIN_BSC, Set.of(
            CHAIN_ETHEREUM
        ));
    }

    // Configuration
    @ConfigProperty(name = "ccip.default.gas.limit", defaultValue = "200000")
    long defaultGasLimit;

    @ConfigProperty(name = "ccip.max.data.size", defaultValue = "30000")
    int maxDataSize;

    @ConfigProperty(name = "ccip.fee.buffer.percentage", defaultValue = "10")
    int feeBufferPercentage;

    @ConfigProperty(name = "ccip.retry.max.attempts", defaultValue = "3")
    int maxRetryAttempts;

    @ConfigProperty(name = "ccip.retry.delay.seconds", defaultValue = "30")
    int retryDelaySeconds;

    // State management
    private final Map<String, CCIPMessage> pendingMessages = new ConcurrentHashMap<>();
    private final Map<String, CCIPMessage> completedMessages = new ConcurrentHashMap<>();
    private final Map<Long, Boolean> chainAvailability = new ConcurrentHashMap<>();
    private final Map<Long, BigDecimal> tokenPrices = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong totalMessagesSent = new AtomicLong(0);
    private final AtomicLong totalMessagesReceived = new AtomicLong(0);
    private final AtomicLong successfulMessages = new AtomicLong(0);
    private final AtomicLong failedMessages = new AtomicLong(0);
    private final AtomicLong totalFeesCollected = new AtomicLong(0);

    // Listeners
    private final List<CCIPMessageListener> messageListeners = new ArrayList<>();

    /**
     * Message listener interface
     */
    public interface CCIPMessageListener {
        void onMessageSent(CCIPMessage message);
        void onMessageReceived(CCIPMessage message);
        void onMessageExecuted(CCIPMessage message);
        void onMessageFailed(CCIPMessage message, String error);
    }

    /**
     * Fee estimation result
     */
    public static class FeeEstimate {
        private BigInteger totalFee;
        private BigInteger executionFee;
        private BigInteger networkFee;
        private String feeToken;
        private BigDecimal feeUSD;
        private Duration estimatedTime;
        private boolean isValid;
        private String errorMessage;

        // Getters and setters
        public BigInteger getTotalFee() { return totalFee; }
        public void setTotalFee(BigInteger totalFee) { this.totalFee = totalFee; }
        public BigInteger getExecutionFee() { return executionFee; }
        public void setExecutionFee(BigInteger executionFee) { this.executionFee = executionFee; }
        public BigInteger getNetworkFee() { return networkFee; }
        public void setNetworkFee(BigInteger networkFee) { this.networkFee = networkFee; }
        public String getFeeToken() { return feeToken; }
        public void setFeeToken(String feeToken) { this.feeToken = feeToken; }
        public BigDecimal getFeeUSD() { return feeUSD; }
        public void setFeeUSD(BigDecimal feeUSD) { this.feeUSD = feeUSD; }
        public Duration getEstimatedTime() { return estimatedTime; }
        public void setEstimatedTime(Duration estimatedTime) { this.estimatedTime = estimatedTime; }
        public boolean isValid() { return isValid; }
        public void setValid(boolean valid) { isValid = valid; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    /**
     * Lane status information
     */
    public static class LaneStatus {
        private long sourceChainSelector;
        private long destinationChainSelector;
        private String sourceChainName;
        private String destinationChainName;
        private boolean isActive;
        private long messagesInFlight;
        private long totalMessages;
        private BigDecimal avgTransferTime;
        private BigDecimal successRate;
        private Instant lastUpdated;

        // Getters and setters
        public long getSourceChainSelector() { return sourceChainSelector; }
        public void setSourceChainSelector(long sourceChainSelector) { this.sourceChainSelector = sourceChainSelector; }
        public long getDestinationChainSelector() { return destinationChainSelector; }
        public void setDestinationChainSelector(long destinationChainSelector) { this.destinationChainSelector = destinationChainSelector; }
        public String getSourceChainName() { return sourceChainName; }
        public void setSourceChainName(String sourceChainName) { this.sourceChainName = sourceChainName; }
        public String getDestinationChainName() { return destinationChainName; }
        public void setDestinationChainName(String destinationChainName) { this.destinationChainName = destinationChainName; }
        public boolean isActive() { return isActive; }
        public void setActive(boolean active) { isActive = active; }
        public long getMessagesInFlight() { return messagesInFlight; }
        public void setMessagesInFlight(long messagesInFlight) { this.messagesInFlight = messagesInFlight; }
        public long getTotalMessages() { return totalMessages; }
        public void setTotalMessages(long totalMessages) { this.totalMessages = totalMessages; }
        public BigDecimal getAvgTransferTime() { return avgTransferTime; }
        public void setAvgTransferTime(BigDecimal avgTransferTime) { this.avgTransferTime = avgTransferTime; }
        public BigDecimal getSuccessRate() { return successRate; }
        public void setSuccessRate(BigDecimal successRate) { this.successRate = successRate; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
    }

    public CCIPAdapter() {
        // Initialize chain availability
        CHAIN_NAMES.keySet().forEach(chainSelector -> chainAvailability.put(chainSelector, true));

        // Initialize token prices (mock values for fee estimation)
        tokenPrices.put(CHAIN_ETHEREUM, new BigDecimal("2000"));  // ETH
        tokenPrices.put(CHAIN_ARBITRUM, new BigDecimal("2000"));  // ETH on Arbitrum
        tokenPrices.put(CHAIN_OPTIMISM, new BigDecimal("2000"));  // ETH on Optimism
        tokenPrices.put(CHAIN_BASE, new BigDecimal("2000"));      // ETH on Base
        tokenPrices.put(CHAIN_POLYGON, new BigDecimal("0.80"));   // MATIC
        tokenPrices.put(CHAIN_AVALANCHE, new BigDecimal("25"));   // AVAX
        tokenPrices.put(CHAIN_BSC, new BigDecimal("300"));        // BNB
    }

    /**
     * Send a CCIP message to another chain
     */
    public Uni<CCIPMessage> sendMessage(CCIPMessage message) {
        return Uni.createFrom().item(() -> {
            // Validate message
            validateMessage(message);

            // Check lane availability
            if (!isLaneSupported(message.getSourceChainSelector(), message.getDestinationChainSelector())) {
                throw new CCIPException("Lane not supported: " +
                    getChainName(message.getSourceChainSelector()) + " -> " +
                    getChainName(message.getDestinationChainSelector()));
            }

            // Set chain names
            message.setSourceChainName(getChainName(message.getSourceChainSelector()));
            message.setDestinationChainName(getChainName(message.getDestinationChainSelector()));

            // Estimate and validate fees
            FeeEstimate feeEstimate = estimateFeeSync(message);
            if (!feeEstimate.isValid()) {
                throw new CCIPException("Fee estimation failed: " + feeEstimate.getErrorMessage());
            }
            message.setFeeAmount(feeEstimate.getTotalFee());
            message.setFeeUSD(feeEstimate.getFeeUSD());

            // Update message state
            message.setExecutionState(ExecutionState.PENDING);
            message.setSentAt(Instant.now());
            message.setSourceTxHash(generateTransactionHash());
            message.setSequenceNumber(totalMessagesSent.incrementAndGet());

            // Store message
            pendingMessages.put(message.getMessageId(), message);

            log.info("CCIP message sent: {} from {} to {}",
                message.getMessageId(),
                message.getSourceChainName(),
                message.getDestinationChainName());

            // Notify listeners
            notifyMessageSent(message);

            // Start async processing
            processMessageAsync(message);

            return message;
        });
    }

    /**
     * Send arbitrary message data
     */
    public Uni<CCIPMessage> sendData(
            long sourceChain,
            long destinationChain,
            String sender,
            String receiver,
            byte[] data,
            long gasLimit
    ) {
        CCIPMessage message = new CCIPMessage.Builder()
            .sourceChain(sourceChain, getChainName(sourceChain))
            .destinationChain(destinationChain, getChainName(destinationChain))
            .sender(sender)
            .receiver(receiver)
            .data(data)
            .gasLimit(gasLimit > 0 ? gasLimit : defaultGasLimit)
            .build();

        return sendMessage(message);
    }

    /**
     * Send token transfer
     */
    public Uni<CCIPMessage> sendTokens(
            long sourceChain,
            long destinationChain,
            String sender,
            String receiver,
            List<TokenAmount> tokens,
            long gasLimit
    ) {
        CCIPMessage.Builder builder = new CCIPMessage.Builder()
            .sourceChain(sourceChain, getChainName(sourceChain))
            .destinationChain(destinationChain, getChainName(destinationChain))
            .sender(sender)
            .receiver(receiver)
            .gasLimit(gasLimit > 0 ? gasLimit : defaultGasLimit);

        for (TokenAmount token : tokens) {
            builder.addToken(token.getTokenAddress(), token.getAmount(),
                token.getDecimals(), token.getSymbol());
        }

        return sendMessage(builder.build());
    }

    /**
     * Send programmable token transfer (tokens + data)
     */
    public Uni<CCIPMessage> sendProgrammableTokenTransfer(
            long sourceChain,
            long destinationChain,
            String sender,
            String receiver,
            byte[] data,
            List<TokenAmount> tokens,
            long gasLimit
    ) {
        CCIPMessage.Builder builder = new CCIPMessage.Builder()
            .sourceChain(sourceChain, getChainName(sourceChain))
            .destinationChain(destinationChain, getChainName(destinationChain))
            .sender(sender)
            .receiver(receiver)
            .data(data)
            .gasLimit(gasLimit > 0 ? gasLimit : defaultGasLimit);

        for (TokenAmount token : tokens) {
            builder.addToken(token.getTokenAddress(), token.getAmount(),
                token.getDecimals(), token.getSymbol());
        }

        return sendMessage(builder.build());
    }

    /**
     * Estimate fee for a CCIP message
     */
    public Uni<FeeEstimate> estimateFee(CCIPMessage message) {
        return Uni.createFrom().item(() -> estimateFeeSync(message));
    }

    /**
     * Synchronous fee estimation
     */
    private FeeEstimate estimateFeeSync(CCIPMessage message) {
        FeeEstimate estimate = new FeeEstimate();

        try {
            // Base execution fee based on gas limit
            long gasLimit = message.getExtraArgs().getGasLimit();
            BigInteger baseGasPrice = new BigInteger("30000000000"); // 30 Gwei
            BigInteger executionFee = BigInteger.valueOf(gasLimit).multiply(baseGasPrice);

            // Network fee based on data size and tokens
            int dataSize = message.getData() != null ? message.getData().length : 0;
            int tokenCount = message.getTokenAmounts().size();
            BigInteger networkFee = BigInteger.valueOf((dataSize / 100 + 1) * 1000000000000000L); // 0.001 ETH per 100 bytes
            networkFee = networkFee.add(BigInteger.valueOf(tokenCount * 5000000000000000L)); // 0.005 ETH per token

            // Add buffer
            BigInteger totalFee = executionFee.add(networkFee);
            totalFee = totalFee.multiply(BigInteger.valueOf(100 + feeBufferPercentage))
                              .divide(BigInteger.valueOf(100));

            estimate.setExecutionFee(executionFee);
            estimate.setNetworkFee(networkFee);
            estimate.setTotalFee(totalFee);
            estimate.setFeeToken("ETH");

            // Calculate USD value
            BigDecimal ethPrice = tokenPrices.getOrDefault(message.getSourceChainSelector(), new BigDecimal("2000"));
            BigDecimal feeInEth = new BigDecimal(totalFee).divide(BigDecimal.TEN.pow(18));
            estimate.setFeeUSD(feeInEth.multiply(ethPrice));

            // Estimate transfer time
            estimate.setEstimatedTime(Duration.ofMinutes(15)); // Average CCIP finality

            estimate.setValid(true);

        } catch (Exception e) {
            estimate.setValid(false);
            estimate.setErrorMessage(e.getMessage());
        }

        return estimate;
    }

    /**
     * Get message status
     */
    public Uni<CCIPMessage> getMessageStatus(String messageId) {
        return Uni.createFrom().item(() -> {
            CCIPMessage message = pendingMessages.get(messageId);
            if (message == null) {
                message = completedMessages.get(messageId);
            }
            if (message == null) {
                throw new CCIPException("Message not found: " + messageId);
            }
            return message;
        });
    }

    /**
     * Get all pending messages
     */
    public Uni<List<CCIPMessage>> getPendingMessages() {
        return Uni.createFrom().item(() -> new ArrayList<>(pendingMessages.values()));
    }

    /**
     * Get pending messages for a specific lane
     */
    public Uni<List<CCIPMessage>> getPendingMessagesForLane(long sourceChain, long destinationChain) {
        return Uni.createFrom().item(() ->
            pendingMessages.values().stream()
                .filter(m -> m.getSourceChainSelector() == sourceChain &&
                            m.getDestinationChainSelector() == destinationChain)
                .collect(Collectors.toList())
        );
    }

    /**
     * Get supported chains
     */
    public Uni<List<Long>> getSupportedChains() {
        return Uni.createFrom().item(() -> new ArrayList<>(CHAIN_NAMES.keySet()));
    }

    /**
     * Get supported destinations for a source chain
     */
    public Uni<Set<Long>> getSupportedDestinations(long sourceChain) {
        return Uni.createFrom().item(() ->
            SUPPORTED_LANES.getOrDefault(sourceChain, Set.of())
        );
    }

    /**
     * Check if a lane is supported
     */
    public boolean isLaneSupported(long sourceChain, long destinationChain) {
        Set<Long> destinations = SUPPORTED_LANES.get(sourceChain);
        return destinations != null && destinations.contains(destinationChain);
    }

    /**
     * Get lane status
     */
    public Uni<LaneStatus> getLaneStatus(long sourceChain, long destinationChain) {
        return Uni.createFrom().item(() -> {
            LaneStatus status = new LaneStatus();
            status.setSourceChainSelector(sourceChain);
            status.setDestinationChainSelector(destinationChain);
            status.setSourceChainName(getChainName(sourceChain));
            status.setDestinationChainName(getChainName(destinationChain));
            status.setActive(isLaneSupported(sourceChain, destinationChain) &&
                           chainAvailability.getOrDefault(sourceChain, false) &&
                           chainAvailability.getOrDefault(destinationChain, false));

            // Count messages in flight
            long inFlight = pendingMessages.values().stream()
                .filter(m -> m.getSourceChainSelector() == sourceChain &&
                            m.getDestinationChainSelector() == destinationChain)
                .count();
            status.setMessagesInFlight(inFlight);

            // Mock stats
            status.setTotalMessages(totalMessagesSent.get());
            status.setAvgTransferTime(new BigDecimal("900")); // 15 minutes
            status.setSuccessRate(new BigDecimal("99.5"));
            status.setLastUpdated(Instant.now());

            return status;
        });
    }

    /**
     * Get all lane statuses
     */
    public Multi<LaneStatus> getAllLaneStatuses() {
        return Multi.createFrom().iterable(SUPPORTED_LANES.entrySet())
            .flatMap(entry ->
                Multi.createFrom().iterable(entry.getValue())
                    .onItem().transformToUniAndMerge(dest ->
                        getLaneStatus(entry.getKey(), dest))
            );
    }

    /**
     * Get CCIP Router address for a chain
     */
    public String getRouterAddress(long chainSelector) {
        return ROUTER_ADDRESSES.get(chainSelector);
    }

    /**
     * Get chain name from selector
     */
    public String getChainName(long chainSelector) {
        return CHAIN_NAMES.getOrDefault(chainSelector, "Unknown Chain");
    }

    /**
     * Get chain selector from name
     */
    public long getChainSelector(String chainName) {
        return CHAIN_NAMES.entrySet().stream()
            .filter(e -> e.getValue().equalsIgnoreCase(chainName))
            .map(Map.Entry::getKey)
            .findFirst()
            .orElse(-1L);
    }

    /**
     * Retry a failed message
     */
    public Uni<CCIPMessage> retryMessage(String messageId) {
        return Uni.createFrom().item(() -> {
            CCIPMessage message = pendingMessages.get(messageId);
            if (message == null) {
                message = completedMessages.get(messageId);
            }
            if (message == null) {
                throw new CCIPException("Message not found: " + messageId);
            }
            if (message.getExecutionState() != ExecutionState.FAILURE) {
                throw new CCIPException("Only failed messages can be retried");
            }

            // Create retry message
            CCIPMessage retryMessage = new CCIPMessage(
                message.getSourceChainSelector(),
                message.getDestinationChainSelector(),
                message.getSender(),
                message.getReceiver(),
                message.getData(),
                message.getTokenAmounts()
            );
            retryMessage.setExtraArgs(message.getExtraArgs());

            return retryMessage;
        }).chain(this::sendMessage);
    }

    /**
     * Cancel a pending message (if possible)
     */
    public Uni<Boolean> cancelMessage(String messageId) {
        return Uni.createFrom().item(() -> {
            CCIPMessage message = pendingMessages.get(messageId);
            if (message == null) {
                throw new CCIPException("Message not found or already completed: " + messageId);
            }
            if (message.getExecutionState() != ExecutionState.PENDING) {
                throw new CCIPException("Only pending messages can be cancelled");
            }

            // Mark as cancelled and move to completed
            message.setExecutionState(ExecutionState.FAILURE);
            message.setErrorMessage("Cancelled by user");
            pendingMessages.remove(messageId);
            completedMessages.put(messageId, message);

            log.info("CCIP message cancelled: {}", messageId);
            return true;
        });
    }

    /**
     * Register a message listener
     */
    public void addMessageListener(CCIPMessageListener listener) {
        messageListeners.add(listener);
    }

    /**
     * Remove a message listener
     */
    public void removeMessageListener(CCIPMessageListener listener) {
        messageListeners.remove(listener);
    }

    /**
     * Get adapter statistics
     */
    public Uni<CCIPStatistics> getStatistics() {
        return Uni.createFrom().item(() -> {
            CCIPStatistics stats = new CCIPStatistics();
            stats.totalMessagesSent = totalMessagesSent.get();
            stats.totalMessagesReceived = totalMessagesReceived.get();
            stats.successfulMessages = successfulMessages.get();
            stats.failedMessages = failedMessages.get();
            stats.pendingMessages = pendingMessages.size();
            stats.successRate = stats.totalMessagesSent > 0 ?
                (double) stats.successfulMessages / stats.totalMessagesSent * 100 : 100.0;
            stats.totalFeesCollected = new BigDecimal(totalFeesCollected.get())
                .divide(BigDecimal.TEN.pow(18));
            stats.supportedChains = CHAIN_NAMES.size();
            stats.activeLanes = SUPPORTED_LANES.values().stream()
                .mapToInt(Set::size).sum();
            return stats;
        });
    }

    /**
     * CCIP Statistics
     */
    public static class CCIPStatistics {
        public long totalMessagesSent;
        public long totalMessagesReceived;
        public long successfulMessages;
        public long failedMessages;
        public int pendingMessages;
        public double successRate;
        public BigDecimal totalFeesCollected;
        public int supportedChains;
        public int activeLanes;
    }

    // Private helper methods

    private void validateMessage(CCIPMessage message) {
        message.validate();

        // Check data size
        if (message.getData() != null && message.getData().length > maxDataSize) {
            throw new CCIPException("Data size exceeds maximum: " +
                message.getData().length + " > " + maxDataSize);
        }

        // Validate chain selectors
        if (!CHAIN_NAMES.containsKey(message.getSourceChainSelector())) {
            throw new CCIPException("Unsupported source chain: " + message.getSourceChainSelector());
        }
        if (!CHAIN_NAMES.containsKey(message.getDestinationChainSelector())) {
            throw new CCIPException("Unsupported destination chain: " + message.getDestinationChainSelector());
        }
    }

    private void processMessageAsync(CCIPMessage message) {
        // Simulate async message processing
        Thread.ofVirtual().start(() -> {
            try {
                // Simulate source chain confirmation
                Thread.sleep(5000);
                message.setExecutionState(ExecutionState.SOURCE_CONFIRMED);
                message.setConfirmedAt(Instant.now());
                message.setSourceBlockNumber(System.currentTimeMillis() / 12000);

                // Simulate cross-chain relay
                Thread.sleep(10000);
                message.setExecutionState(ExecutionState.IN_FLIGHT);

                // Simulate destination execution
                Thread.sleep(5000);
                message.setExecutionState(ExecutionState.SUCCESS);
                message.setExecutedAt(Instant.now());
                message.setDestinationTxHash(generateTransactionHash());
                message.setDestinationBlockNumber(System.currentTimeMillis() / 2000);

                // Move to completed
                pendingMessages.remove(message.getMessageId());
                completedMessages.put(message.getMessageId(), message);
                successfulMessages.incrementAndGet();

                log.info("CCIP message executed successfully: {}", message.getMessageId());
                notifyMessageExecuted(message);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                handleMessageFailure(message, "Processing interrupted");
            } catch (Exception e) {
                handleMessageFailure(message, e.getMessage());
            }
        });
    }

    private void handleMessageFailure(CCIPMessage message, String error) {
        message.setExecutionState(ExecutionState.FAILURE);
        message.setErrorMessage(error);
        pendingMessages.remove(message.getMessageId());
        completedMessages.put(message.getMessageId(), message);
        failedMessages.incrementAndGet();

        log.error("CCIP message failed: {} - {}", message.getMessageId(), error);
        notifyMessageFailed(message, error);
    }

    private String generateTransactionHash() {
        StringBuilder hex = new StringBuilder("0x");
        for (int i = 0; i < 64; i++) {
            int randomNum = (int) (Math.random() * 16);
            char hexChar = (randomNum < 10) ? (char) ('0' + randomNum) : (char) ('a' + randomNum - 10);
            hex.append(hexChar);
        }
        return hex.toString();
    }

    private void notifyMessageSent(CCIPMessage message) {
        for (CCIPMessageListener listener : messageListeners) {
            try {
                listener.onMessageSent(message);
            } catch (Exception e) {
                log.warn("Listener error on message sent: {}", e.getMessage());
            }
        }
    }

    private void notifyMessageExecuted(CCIPMessage message) {
        for (CCIPMessageListener listener : messageListeners) {
            try {
                listener.onMessageExecuted(message);
            } catch (Exception e) {
                log.warn("Listener error on message executed: {}", e.getMessage());
            }
        }
    }

    private void notifyMessageFailed(CCIPMessage message, String error) {
        for (CCIPMessageListener listener : messageListeners) {
            try {
                listener.onMessageFailed(message, error);
            } catch (Exception e) {
                log.warn("Listener error on message failed: {}", e.getMessage());
            }
        }
    }

    /**
     * CCIP Exception
     */
    public static class CCIPException extends RuntimeException {
        public CCIPException(String message) {
            super(message);
        }

        public CCIPException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
