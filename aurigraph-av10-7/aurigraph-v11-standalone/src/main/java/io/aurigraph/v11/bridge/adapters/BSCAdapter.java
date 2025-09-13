package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.models.BridgeTransaction;
import io.aurigraph.v11.bridge.models.ChainInfo;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.util.List;

/**
 * Binance Smart Chain (BSC) Blockchain Adapter
 * 
 * Provides integration with Binance Smart Chain, optimized for BSC's
 * consensus mechanism and BNB token economics.
 * 
 * Features:
 * - BSC Proof of Authority consensus integration
 * - BNB token support and BEP-20 tokens
 * - Fast block times (3 seconds)
 * - Lower transaction fees than Ethereum
 * - BSC-specific bridge contracts
 * - Binance ecosystem integration
 */
@ApplicationScoped
@Named("bscAdapter")
public class BSCAdapter extends EthereumAdapter {

    private static final Logger LOG = Logger.getLogger(BSCAdapter.class);

    // BSC-specific configuration
    @ConfigProperty(name = "aurigraph.bridge.bsc.rpc-url", 
                   defaultValue = "https://bsc-dataseed.binance.org/")
    String bscRpcUrl;

    @ConfigProperty(name = "aurigraph.bridge.bsc.bridge-contract", 
                   defaultValue = "0x28FF8F6D5b93E4E3D2C9F2E7C0C7B2CC3F9B7A5C")
    String bscBridgeContract;

    @ConfigProperty(name = "aurigraph.bridge.bsc.confirmation-blocks", defaultValue = "15")
    int bscConfirmationBlocks;

    @ConfigProperty(name = "aurigraph.bridge.bsc.gas-limit", defaultValue = "200000")
    long bscGasLimit;

    @ConfigProperty(name = "aurigraph.bridge.bsc.gas-price-gwei", defaultValue = "5")
    long bscGasPriceGwei;

    private final ChainInfo bscChainInfo;

    public BSCAdapter() {
        this.bscChainInfo = ChainInfo.builder()
            .chainId("bsc")
            .name("Binance Smart Chain")
            .displayName("BSC")
            .networkId(56)
            .rpcUrl("https://bsc-dataseed.binance.org/")
            .explorerUrl("https://bscscan.com")
            .nativeCurrency("BNB")
            .currencySymbol("BNB")
            .decimals(18)
            .isActive(true)
            .chainType("EVM")
            .confirmationBlocks(15)
            .averageBlockTime(3000) // 3 seconds
            .averageConfirmationTime(45) // 45 seconds for 15 blocks
            .minTransferAmount(new BigDecimal("0.001"))
            .maxTransferAmount(new BigDecimal("10000"))
            .baseFee(new BigDecimal("5"))
            .supportedAssets(List.of("BNB", "BUSD", "USDT", "BTCB", "ETH", "CAKE", "ADA"))
            .build();
    }

    @Override
    public ChainInfo getChainInfo() {
        return bscChainInfo;
    }

    @Override
    public String getChainId() {
        return "bsc";
    }

    @Override
    public Uni<Void> initialize() {
        return Uni.createFrom().item(() -> {
            LOG.info("Initializing BSC adapter...");
            
            // Update configuration for BSC-specific values
            this.rpcUrl = bscRpcUrl;
            this.bridgeContractAddress = bscBridgeContract;
            this.confirmationBlocks = bscConfirmationBlocks;
            this.gasLimit = bscGasLimit;
            this.gasPriceGwei = bscGasPriceGwei;
            this.chainId = 56; // BSC mainnet chain ID
            
            // Initialize Web3j connection with BSC RPC
            initializeConnection();
            
            LOG.info("BSC adapter initialized successfully");
            return null;
        });
    }

    @Override
    public Uni<BigDecimal> estimateGasFee(BridgeTransaction transaction) {
        // Override to provide BSC-specific fee estimation
        return super.estimateGasFee(transaction).map(baseFee -> {
            // BSC has lower fees than Ethereum but higher than Polygon
            BigDecimal bscMultiplier = new BigDecimal("0.1"); // 10% of Ethereum fees typically
            BigDecimal adjustedFee = baseFee.multiply(bscMultiplier);
            
            LOG.debugf("BSC gas fee estimate: %s BNB (base: %s)", adjustedFee, baseFee);
            return adjustedFee;
        });
    }

    /**
     * BSC-specific validator integration
     * BSC uses 21 validators in Proof of Authority consensus
     */
    public Uni<List<ValidatorInfo>> getValidators() {
        return Uni.createFrom().item(() -> {
            // In a real implementation, this would query the BSC validator set
            LOG.debug("Getting BSC validator information");
            
            // Mock validator data
            return List.of(
                new ValidatorInfo("Binance Pool", "0x...", true, 100.0),
                new ValidatorInfo("BSC Validator 1", "0x...", true, 98.5),
                new ValidatorInfo("BSC Validator 2", "0x...", true, 99.2)
                // ... 21 validators total
            );
        });
    }

    /**
     * BEP-20 token specific operations
     */
    public Uni<Boolean> isBEP20Token(String tokenAddress) {
        return Uni.createFrom().item(() -> {
            // Check if token follows BEP-20 standard
            LOG.debugf("Checking if %s is a valid BEP-20 token", tokenAddress);
            
            // In real implementation, would call token contract to verify interface
            return tokenAddress != null && tokenAddress.startsWith("0x") && tokenAddress.length() == 42;
        });
    }

    /**
     * BSC Cross-Chain Relay integration
     * BSC has built-in cross-chain communication with Binance Chain
     */
    public Uni<String> relayToBinanceChain(BridgeTransaction transaction) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Initiating BSC to Binance Chain relay for transaction: %s", 
                     transaction.getTransactionId());
            
            // Simulate relay to Binance Chain (BEP-2)
            String relayTxHash = "binance-relay-" + java.util.UUID.randomUUID().toString().substring(0, 8);
            
            LOG.infof("BSC to Binance Chain relay initiated: %s", relayTxHash);
            return relayTxHash;
        });
    }

    /**
     * Fast finality check for BSC
     * BSC has faster finality than Ethereum due to PoA consensus
     */
    @Override
    public Uni<TransactionStatus> getTransactionStatus(String transactionHash) {
        return super.getTransactionStatus(transactionHash).map(status -> {
            // BSC transactions are considered final much faster due to PoA
            if (status.getConfirmations() >= 3) { // Only need 3 confirmations on BSC
                return new TransactionStatus(
                    status.getTransactionHash(),
                    TransactionStatusType.CONFIRMED,
                    status.getConfirmations(),
                    3, // Lower required confirmations
                    status.getGasUsed(),
                    status.getErrorMessage(),
                    status.getBlockNumber(),
                    status.getTimestamp()
                );
            }
            return status;
        });
    }

    /**
     * BSC Network Statistics
     */
    public Uni<BSCNetworkStats> getNetworkStats() {
        return Uni.createFrom().item(() -> {
            return new BSCNetworkStats(
                System.currentTimeMillis(),
                3.0, // Average block time in seconds
                bscGasPriceGwei,
                99.8, // Network uptime percentage
                21, // Number of validators
                25000000L // Current block height
            );
        });
    }

    /**
     * Validator Information
     */
    public record ValidatorInfo(
        String name,
        String address,
        boolean isActive,
        double votingPower
    ) {}

    /**
     * BSC Network Statistics
     */
    public record BSCNetworkStats(
        long timestamp,
        double averageBlockTime,
        long currentGasPrice,
        double networkUptime,
        int validatorCount,
        long blockHeight
    ) {}
}