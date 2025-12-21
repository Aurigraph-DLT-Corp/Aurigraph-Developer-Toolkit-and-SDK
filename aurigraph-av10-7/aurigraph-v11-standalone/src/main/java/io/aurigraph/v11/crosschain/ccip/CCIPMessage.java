package io.aurigraph.v11.crosschain.ccip;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * CCIP Message - Chainlink Cross-Chain Interoperability Protocol Message Format
 *
 * Implements the Chainlink CCIP message specification for cross-chain communication.
 * Supports arbitrary message passing, token transfers, and programmable token transfers.
 *
 * CCIP Message Structure:
 * - Message ID: Unique identifier for tracking
 * - Source/Destination: Chain and address information
 * - Sender/Receiver: EOA or contract addresses
 * - Data: Arbitrary bytes payload
 * - Token Amounts: ERC20 token transfers with the message
 * - Fee Token: Token used to pay for CCIP fees
 * - Extra Args: Version-specific additional arguments
 *
 * Message Types:
 * 1. Arbitrary Messaging - Send data without tokens
 * 2. Token Transfer - Transfer tokens without data
 * 3. Programmable Token Transfer - Transfer tokens with data
 *
 * @author Aurigraph V12 Integration Team
 * @version 12.0.0
 * @since 2025-01-01
 * @see <a href="https://docs.chain.link/ccip">Chainlink CCIP Documentation</a>
 */
public class CCIPMessage {

    /**
     * Message types supported by CCIP
     */
    public enum MessageType {
        /** Arbitrary data messaging without token transfer */
        ARBITRARY_MESSAGE,
        /** Token transfer without additional data */
        TOKEN_TRANSFER,
        /** Programmable token transfer with data payload */
        PROGRAMMABLE_TOKEN_TRANSFER
    }

    /**
     * Message execution states
     */
    public enum ExecutionState {
        /** Message not yet sent */
        UNTOUCHED,
        /** Message sent but not confirmed on source */
        PENDING,
        /** Message confirmed on source chain */
        SOURCE_CONFIRMED,
        /** Message being committed on destination */
        IN_FLIGHT,
        /** Message successfully executed */
        SUCCESS,
        /** Message execution failed */
        FAILURE,
        /** Message manually executed after timeout */
        MANUAL_EXECUTION
    }

    /**
     * Token amount structure for CCIP transfers
     */
    public static class TokenAmount {
        private String tokenAddress;
        private BigInteger amount;
        private int decimals;
        private String symbol;

        public TokenAmount() {}

        public TokenAmount(String tokenAddress, BigInteger amount, int decimals, String symbol) {
            this.tokenAddress = tokenAddress;
            this.amount = amount;
            this.decimals = decimals;
            this.symbol = symbol;
        }

        public String getTokenAddress() { return tokenAddress; }
        public void setTokenAddress(String tokenAddress) { this.tokenAddress = tokenAddress; }
        public BigInteger getAmount() { return amount; }
        public void setAmount(BigInteger amount) { this.amount = amount; }
        public int getDecimals() { return decimals; }
        public void setDecimals(int decimals) { this.decimals = decimals; }
        public String getSymbol() { return symbol; }
        public void setSymbol(String symbol) { this.symbol = symbol; }

        /**
         * Get the human-readable amount
         */
        public BigDecimal getFormattedAmount() {
            return new BigDecimal(amount).divide(BigDecimal.TEN.pow(decimals));
        }

        @Override
        public String toString() {
            return String.format("TokenAmount{token=%s, amount=%s, symbol=%s}",
                tokenAddress, getFormattedAmount(), symbol);
        }
    }

    /**
     * Extra arguments for CCIP message configuration
     */
    public static class ExtraArgs {
        /** Gas limit for execution on destination */
        private long gasLimit;
        /** Whether to allow out-of-order execution */
        private boolean allowOutOfOrderExecution;
        /** Custom data for future extensions */
        private Map<String, Object> customData;

        public ExtraArgs() {
            this.gasLimit = 200_000L; // Default gas limit
            this.allowOutOfOrderExecution = false;
            this.customData = new HashMap<>();
        }

        public ExtraArgs(long gasLimit, boolean allowOutOfOrderExecution) {
            this.gasLimit = gasLimit;
            this.allowOutOfOrderExecution = allowOutOfOrderExecution;
            this.customData = new HashMap<>();
        }

        public long getGasLimit() { return gasLimit; }
        public void setGasLimit(long gasLimit) { this.gasLimit = gasLimit; }
        public boolean isAllowOutOfOrderExecution() { return allowOutOfOrderExecution; }
        public void setAllowOutOfOrderExecution(boolean allowOutOfOrderExecution) {
            this.allowOutOfOrderExecution = allowOutOfOrderExecution;
        }
        public Map<String, Object> getCustomData() { return customData; }
        public void setCustomData(Map<String, Object> customData) { this.customData = customData; }

        /**
         * Encode extra args to bytes for CCIP
         * Uses EVMExtraArgsV1 format: 0x97a657c9 + abi.encode(gasLimit)
         */
        public byte[] encode() {
            // EVMExtraArgsV1 tag: 0x97a657c9
            byte[] tag = new byte[]{(byte)0x97, (byte)0xa6, (byte)0x57, (byte)0xc9};
            byte[] gasBytes = encodeUint256(BigInteger.valueOf(gasLimit));
            byte[] result = new byte[tag.length + gasBytes.length];
            System.arraycopy(tag, 0, result, 0, tag.length);
            System.arraycopy(gasBytes, 0, result, tag.length, gasBytes.length);
            return result;
        }

        private byte[] encodeUint256(BigInteger value) {
            byte[] bytes = value.toByteArray();
            byte[] result = new byte[32];
            if (bytes.length <= 32) {
                System.arraycopy(bytes, 0, result, 32 - bytes.length, bytes.length);
            } else {
                System.arraycopy(bytes, bytes.length - 32, result, 0, 32);
            }
            return result;
        }
    }

    // Core message fields
    private String messageId;
    private MessageType messageType;
    private ExecutionState executionState;

    // Source chain information
    private long sourceChainSelector;
    private String sourceChainName;
    private String sender;

    // Destination chain information
    private long destinationChainSelector;
    private String destinationChainName;
    private String receiver;

    // Message content
    private byte[] data;
    private List<TokenAmount> tokenAmounts;

    // Fee configuration
    private String feeToken;
    private BigInteger feeAmount;
    private BigDecimal feeUSD;

    // Extra configuration
    private ExtraArgs extraArgs;

    // Tracking information
    private Instant createdAt;
    private Instant sentAt;
    private Instant confirmedAt;
    private Instant executedAt;
    private String sourceTxHash;
    private String destinationTxHash;
    private long sourceBlockNumber;
    private long destinationBlockNumber;

    // Nonce for ordering
    private long sequenceNumber;
    private long nonce;

    // Error information
    private String errorMessage;
    private String errorCode;

    /**
     * Default constructor
     */
    public CCIPMessage() {
        this.messageType = MessageType.ARBITRARY_MESSAGE;
        this.executionState = ExecutionState.UNTOUCHED;
        this.tokenAmounts = new ArrayList<>();
        this.extraArgs = new ExtraArgs();
        this.createdAt = Instant.now();
    }

    /**
     * Constructor for arbitrary message
     */
    public CCIPMessage(
            long sourceChainSelector,
            long destinationChainSelector,
            String sender,
            String receiver,
            byte[] data
    ) {
        this();
        this.sourceChainSelector = sourceChainSelector;
        this.destinationChainSelector = destinationChainSelector;
        this.sender = sender;
        this.receiver = receiver;
        this.data = data;
        this.messageType = MessageType.ARBITRARY_MESSAGE;
        this.messageId = generateMessageId();
    }

    /**
     * Constructor for token transfer
     */
    public CCIPMessage(
            long sourceChainSelector,
            long destinationChainSelector,
            String sender,
            String receiver,
            List<TokenAmount> tokenAmounts
    ) {
        this();
        this.sourceChainSelector = sourceChainSelector;
        this.destinationChainSelector = destinationChainSelector;
        this.sender = sender;
        this.receiver = receiver;
        this.tokenAmounts = tokenAmounts != null ? tokenAmounts : new ArrayList<>();
        this.messageType = MessageType.TOKEN_TRANSFER;
        this.messageId = generateMessageId();
    }

    /**
     * Constructor for programmable token transfer
     */
    public CCIPMessage(
            long sourceChainSelector,
            long destinationChainSelector,
            String sender,
            String receiver,
            byte[] data,
            List<TokenAmount> tokenAmounts
    ) {
        this();
        this.sourceChainSelector = sourceChainSelector;
        this.destinationChainSelector = destinationChainSelector;
        this.sender = sender;
        this.receiver = receiver;
        this.data = data;
        this.tokenAmounts = tokenAmounts != null ? tokenAmounts : new ArrayList<>();
        this.messageType = MessageType.PROGRAMMABLE_TOKEN_TRANSFER;
        this.messageId = generateMessageId();
    }

    /**
     * Generate unique message ID
     */
    private String generateMessageId() {
        return "CCIP-" + System.nanoTime() + "-" +
               Integer.toHexString((int)(Math.random() * 0xFFFFFF)).toUpperCase();
    }

    /**
     * Check if message has token transfers
     */
    public boolean hasTokenTransfer() {
        return tokenAmounts != null && !tokenAmounts.isEmpty();
    }

    /**
     * Check if message has data payload
     */
    public boolean hasData() {
        return data != null && data.length > 0;
    }

    /**
     * Validate the message for sending
     */
    public void validate() {
        if (sourceChainSelector <= 0) {
            throw new IllegalStateException("Invalid source chain selector");
        }
        if (destinationChainSelector <= 0) {
            throw new IllegalStateException("Invalid destination chain selector");
        }
        if (sourceChainSelector == destinationChainSelector) {
            throw new IllegalStateException("Source and destination chains must be different");
        }
        if (sender == null || sender.isEmpty()) {
            throw new IllegalStateException("Sender address is required");
        }
        if (receiver == null || receiver.isEmpty()) {
            throw new IllegalStateException("Receiver address is required");
        }
        if (!hasData() && !hasTokenTransfer()) {
            throw new IllegalStateException("Message must contain data or token amounts");
        }
    }

    /**
     * Serialize message for transmission
     */
    public byte[] serialize() {
        // Simplified serialization - in production would use RLP or ABI encoding
        StringBuilder sb = new StringBuilder();
        sb.append(messageId).append("|");
        sb.append(sourceChainSelector).append("|");
        sb.append(destinationChainSelector).append("|");
        sb.append(sender).append("|");
        sb.append(receiver).append("|");
        sb.append(data != null ? bytesToHex(data) : "").append("|");
        sb.append(tokenAmounts.size());
        return sb.toString().getBytes();
    }

    /**
     * Deserialize message from bytes
     */
    public static CCIPMessage deserialize(byte[] bytes) {
        String str = new String(bytes);
        String[] parts = str.split("\\|");

        CCIPMessage message = new CCIPMessage();
        message.messageId = parts[0];
        message.sourceChainSelector = Long.parseLong(parts[1]);
        message.destinationChainSelector = Long.parseLong(parts[2]);
        message.sender = parts[3];
        message.receiver = parts[4];
        if (!parts[5].isEmpty()) {
            message.data = hexToBytes(parts[5]);
        }
        return message;
    }

    /**
     * Calculate the total token value in USD
     */
    public BigDecimal getTotalTokenValueUSD(Map<String, BigDecimal> tokenPrices) {
        BigDecimal total = BigDecimal.ZERO;
        for (TokenAmount token : tokenAmounts) {
            BigDecimal price = tokenPrices.getOrDefault(token.getTokenAddress(), BigDecimal.ZERO);
            total = total.add(token.getFormattedAmount().multiply(price));
        }
        return total;
    }

    // Utility methods
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                    + Character.digit(hex.charAt(i+1), 16));
        }
        return data;
    }

    // Builder pattern for fluent construction
    public static class Builder {
        private CCIPMessage message;

        public Builder() {
            this.message = new CCIPMessage();
        }

        public Builder sourceChain(long selector, String name) {
            message.sourceChainSelector = selector;
            message.sourceChainName = name;
            return this;
        }

        public Builder destinationChain(long selector, String name) {
            message.destinationChainSelector = selector;
            message.destinationChainName = name;
            return this;
        }

        public Builder sender(String sender) {
            message.sender = sender;
            return this;
        }

        public Builder receiver(String receiver) {
            message.receiver = receiver;
            return this;
        }

        public Builder data(byte[] data) {
            message.data = data;
            if (data != null && data.length > 0) {
                if (message.hasTokenTransfer()) {
                    message.messageType = MessageType.PROGRAMMABLE_TOKEN_TRANSFER;
                } else {
                    message.messageType = MessageType.ARBITRARY_MESSAGE;
                }
            }
            return this;
        }

        public Builder addToken(String address, BigInteger amount, int decimals, String symbol) {
            message.tokenAmounts.add(new TokenAmount(address, amount, decimals, symbol));
            if (message.hasData()) {
                message.messageType = MessageType.PROGRAMMABLE_TOKEN_TRANSFER;
            } else {
                message.messageType = MessageType.TOKEN_TRANSFER;
            }
            return this;
        }

        public Builder feeToken(String token) {
            message.feeToken = token;
            return this;
        }

        public Builder gasLimit(long gasLimit) {
            message.extraArgs.setGasLimit(gasLimit);
            return this;
        }

        public Builder allowOutOfOrder(boolean allow) {
            message.extraArgs.setAllowOutOfOrderExecution(allow);
            return this;
        }

        public CCIPMessage build() {
            message.messageId = message.generateMessageId();
            message.validate();
            return message;
        }
    }

    // Getters and Setters
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
    public MessageType getMessageType() { return messageType; }
    public void setMessageType(MessageType messageType) { this.messageType = messageType; }
    public ExecutionState getExecutionState() { return executionState; }
    public void setExecutionState(ExecutionState executionState) { this.executionState = executionState; }
    public long getSourceChainSelector() { return sourceChainSelector; }
    public void setSourceChainSelector(long sourceChainSelector) { this.sourceChainSelector = sourceChainSelector; }
    public String getSourceChainName() { return sourceChainName; }
    public void setSourceChainName(String sourceChainName) { this.sourceChainName = sourceChainName; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public long getDestinationChainSelector() { return destinationChainSelector; }
    public void setDestinationChainSelector(long destinationChainSelector) { this.destinationChainSelector = destinationChainSelector; }
    public String getDestinationChainName() { return destinationChainName; }
    public void setDestinationChainName(String destinationChainName) { this.destinationChainName = destinationChainName; }
    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }
    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }
    public List<TokenAmount> getTokenAmounts() { return tokenAmounts; }
    public void setTokenAmounts(List<TokenAmount> tokenAmounts) { this.tokenAmounts = tokenAmounts; }
    public String getFeeToken() { return feeToken; }
    public void setFeeToken(String feeToken) { this.feeToken = feeToken; }
    public BigInteger getFeeAmount() { return feeAmount; }
    public void setFeeAmount(BigInteger feeAmount) { this.feeAmount = feeAmount; }
    public BigDecimal getFeeUSD() { return feeUSD; }
    public void setFeeUSD(BigDecimal feeUSD) { this.feeUSD = feeUSD; }
    public ExtraArgs getExtraArgs() { return extraArgs; }
    public void setExtraArgs(ExtraArgs extraArgs) { this.extraArgs = extraArgs; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }
    public Instant getExecutedAt() { return executedAt; }
    public void setExecutedAt(Instant executedAt) { this.executedAt = executedAt; }
    public String getSourceTxHash() { return sourceTxHash; }
    public void setSourceTxHash(String sourceTxHash) { this.sourceTxHash = sourceTxHash; }
    public String getDestinationTxHash() { return destinationTxHash; }
    public void setDestinationTxHash(String destinationTxHash) { this.destinationTxHash = destinationTxHash; }
    public long getSourceBlockNumber() { return sourceBlockNumber; }
    public void setSourceBlockNumber(long sourceBlockNumber) { this.sourceBlockNumber = sourceBlockNumber; }
    public long getDestinationBlockNumber() { return destinationBlockNumber; }
    public void setDestinationBlockNumber(long destinationBlockNumber) { this.destinationBlockNumber = destinationBlockNumber; }
    public long getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(long sequenceNumber) { this.sequenceNumber = sequenceNumber; }
    public long getNonce() { return nonce; }
    public void setNonce(long nonce) { this.nonce = nonce; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CCIPMessage that = (CCIPMessage) o;
        return Objects.equals(messageId, that.messageId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(messageId);
    }

    @Override
    public String toString() {
        return String.format("CCIPMessage{id=%s, type=%s, state=%s, src=%s->dst=%s, sender=%s, receiver=%s}",
            messageId, messageType, executionState, sourceChainName, destinationChainName, sender, receiver);
    }
}
