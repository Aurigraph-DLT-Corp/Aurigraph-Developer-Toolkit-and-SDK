package io.aurigraph.bridge;

import io.aurigraph.bridge.adapters.*;
import io.aurigraph.core.Transaction;
import io.aurigraph.core.TransactionType;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Universal Cross-Chain Bridge Service
 * Supports 50+ blockchain integrations with atomic swaps, multi-sig security, and validator consensus
 * 
 * Performance Targets:
 * - 50+ supported blockchains
 * - <30 seconds swap latency (most chains)
 * - <5 minutes for Bitcoin
 * - 99.5% success rate
 * - 21 bridge validators with Byzantine fault tolerance
 * - <2% slippage for swaps under $100K
 */
@ApplicationScoped
@GrpcService
public class CrossChainBridgeService {

    private static final Logger logger = LoggerFactory.getLogger(CrossChainBridgeService.class);

    @Inject
    AtomicSwapManager atomicSwapManager;
    
    @Inject
    MultiSigWalletService multiSigWalletService;
    
    @Inject
    BridgeValidatorService bridgeValidatorService;
    
    @Inject
    LiquidityPoolManager liquidityPoolManager;

    @ConfigProperty(name = "aurigraph.bridge.validator-count", defaultValue = "21")
    int validatorCount;

    @ConfigProperty(name = "aurigraph.bridge.max-slippage-bps", defaultValue = "200")
    int maxSlippageBasisPoints;

    @ConfigProperty(name = "aurigraph.bridge.min-confirmations", defaultValue = "3")
    int minConfirmations;

    // Chain adapters for top 10 blockchains
    private final Map<String, ChainAdapter> chainAdapters = new ConcurrentHashMap<>();
    
    // Bridge state management
    private final Map<String, BridgeTransaction> pendingTransactions = new ConcurrentHashMap<>();
    private final Map<String, SwapPair> supportedPairs = new ConcurrentHashMap<>();
    
    // Performance metrics
    private final BridgeMetrics metrics = new BridgeMetrics();
    private final AtomicLong transactionCounter = new AtomicLong(0);

    public void initialize() {
        logger.info("Initializing Universal Cross-Chain Bridge Service...");
        
        // Initialize chain adapters for top 10 blockchains
        initializeChainAdapters();
        
        // Setup supported trading pairs
        initializeSupportedPairs();
        
        // Initialize validator network
        bridgeValidatorService.initialize(validatorCount);
        
        // Initialize liquidity pools
        liquidityPoolManager.initialize(supportedPairs);
        
        logger.info("Cross-Chain Bridge Service initialized with {} supported chains", chainAdapters.size());
        logger.info("Bridge validator consensus ready with {} validators", validatorCount);
    }

    private void initializeChainAdapters() {
        // EVM-compatible chains
        chainAdapters.put("ethereum", new EthereumAdapter("https://eth.llamarpc.com", 12));
        chainAdapters.put("polygon", new PolygonAdapter("https://polygon-rpc.com", 128));
        chainAdapters.put("bsc", new BscAdapter("https://bsc-dataseed.binance.org", 15));
        chainAdapters.put("avalanche", new AvalancheAdapter("https://api.avax.network/ext/bc/C/rpc", 1));
        
        // Non-EVM chains
        chainAdapters.put("bitcoin", new BitcoinAdapter("https://blockstream.info/api", 6));
        chainAdapters.put("solana", new SolanaAdapter("https://api.mainnet-beta.solana.com", 32));
        chainAdapters.put("polkadot", new PolkadotAdapter("wss://rpc.polkadot.io", 1));
        chainAdapters.put("cosmos", new CosmosAdapter("https://cosmos-rpc.quickapi.com", 1));
        chainAdapters.put("near", new NearAdapter("https://rpc.mainnet.near.org", 1));
        chainAdapters.put("algorand", new AlgorandAdapter("https://mainnet-api.algonode.cloud", 1));
        
        // Add more chains to reach 50+ target
        initializeAdditionalChains();
        
        logger.info("Initialized {} chain adapters", chainAdapters.size());
    }

    private void initializeAdditionalChains() {
        // Layer 2 and additional EVM chains
        chainAdapters.put("arbitrum", new ArbitrumAdapter("https://arb1.arbitrum.io/rpc", 1));
        chainAdapters.put("optimism", new OptimismAdapter("https://mainnet.optimism.io", 1));
        chainAdapters.put("fantom", new FantomAdapter("https://rpc.ftm.tools", 5));
        chainAdapters.put("harmony", new HarmonyAdapter("https://api.harmony.one", 2));
        chainAdapters.put("moonbeam", new MoonbeamAdapter("https://rpc.api.moonbeam.network", 2));
        chainAdapters.put("cronos", new CronosAdapter("https://evm.cronos.org", 3));
        
        // Additional L1s and specialized chains
        chainAdapters.put("cardano", new CardanoAdapter("https://cardano-mainnet.blockfrost.io/api/v0", 5));
        chainAdapters.put("stellar", new StellarAdapter("https://horizon.stellar.org", 1));
        chainAdapters.put("ripple", new RippleAdapter("https://xrplcluster.com", 3));
        chainAdapters.put("tron", new TronAdapter("https://api.trongrid.io", 19));
        chainAdapters.put("eos", new EosAdapter("https://api.eosn.io", 2));
        chainAdapters.put("tezos", new TezosAdapter("https://mainnet.api.tez.ie", 2));
        
        // Additional 30+ chains to reach 50+ target
        addMoreChainAdapters();
    }

    private void addMoreChainAdapters() {
        // More EVM and L2 networks
        chainAdapters.put("celo", new CeloAdapter("https://forno.celo.org", 2));
        chainAdapters.put("gnosis", new GnosisAdapter("https://rpc.gnosischain.com", 5));
        chainAdapters.put("klaytn", new KlaytnAdapter("https://klaytn-mainnet-rpc.allthatnode.com:8551", 1));
        chainAdapters.put("aurora", new AuroraAdapter("https://mainnet.aurora.dev", 1));
        chainAdapters.put("metis", new MetisAdapter("https://andromeda.metis.io/?owner=1088", 1));
        chainAdapters.put("boba", new BobaAdapter("https://mainnet.boba.network", 1));
        chainAdapters.put("milkomeda", new MilkomedaAdapter("https://rpc-mainnet-cardano-evm.c1.milkomeda.com", 2));
        chainAdapters.put("evmos", new EvmosAdapter("https://eth.bd.evmos.org:8545", 1));
        chainAdapters.put("kava", new KavaAdapter("https://evm.kava.io", 1));
        
        // Additional specialized chains
        chainAdapters.put("hedera", new HederaAdapter("https://mainnet-public.mirrornode.hedera.com", 1));
        chainAdapters.put("iota", new IotaAdapter("https://chrysalis-nodes.iota.org", 1));
        chainAdapters.put("vechain", new VechainAdapter("https://vethor-node.vechain.com", 12));
        chainAdapters.put("neo", new NeoAdapter("https://mainnet1.neo.coz.io:443", 1));
        chainAdapters.put("qtum", new QtumAdapter("https://janus.qiswap.com/api", 10));
        chainAdapters.put("zilliqa", new ZilliqaAdapter("https://api.zilliqa.com", 3));
        chainAdapters.put("icon", new IconAdapter("https://ctz.solidwallet.io/api/v3", 2));
        chainAdapters.put("waves", new WavesAdapter("https://nodes.wavesnodes.com", 15));
        chainAdapters.put("nano", new NanoAdapter("https://rpc.nano.to", 1));
        chainAdapters.put("monero", new MoneroAdapter("https://node.moneroworld.com:18089", 10));
        
        // Substrate-based chains
        chainAdapters.put("kusama", new KusamaAdapter("wss://kusama-rpc.polkadot.io", 1));
        chainAdapters.put("acala", new AcalaAdapter("wss://acala-rpc-0.aca-api.network", 1));
        chainAdapters.put("moonriver", new MoonriverAdapter("https://rpc.api.moonriver.moonbeam.network", 1));
        chainAdapters.put("karura", new KaruraAdapter("wss://karura-rpc-0.aca-api.network", 1));
        
        // Additional emerging chains
        chainAdapters.put("aptos", new AptosAdapter("https://fullnode.mainnet.aptoslabs.com/v1", 1));
        chainAdapters.put("sui", new SuiAdapter("https://fullnode.mainnet.sui.io:443", 1));
        chainAdapters.put("flow", new FlowAdapter("https://rest-mainnet.onflow.org/v1", 1));
        chainAdapters.put("secret", new SecretAdapter("https://lcd-secret.scrtlabs.com", 1));
        chainAdapters.put("terra", new TerraAdapter("https://lcd.terra.dev", 1));
        chainAdapters.put("osmosis", new OsmosisAdapter("https://lcd-osmosis.blockapsis.com", 1));
        chainAdapters.put("juno", new JunoAdapter("https://lcd-juno.itastakers.com", 1));
        chainAdapters.put("stargaze", new StargazeAdapter("https://rest.stargaze-apis.com", 1));
        chainAdapters.put("injective", new InjectiveAdapter("https://k8s.mainnet.lcd.injective.network", 1));
        
        logger.info("Total chain adapters initialized: {}", chainAdapters.size());
    }

    private void initializeSupportedPairs() {
        List<String> majorChains = Arrays.asList("ethereum", "bitcoin", "polygon", "bsc", "solana");
        List<String> stablecoins = Arrays.asList("USDC", "USDT", "DAI", "BUSD");
        List<String> majorTokens = Arrays.asList("ETH", "BTC", "BNB", "SOL", "AVAX", "MATIC");
        
        // Create trading pairs between major chains and assets
        for (String sourceChain : majorChains) {
            for (String targetChain : majorChains) {
                if (!sourceChain.equals(targetChain)) {
                    for (String asset : stablecoins) {
                        String pairId = createPairId(sourceChain, targetChain, asset);
                        supportedPairs.put(pairId, new SwapPair(sourceChain, targetChain, asset, asset));
                    }
                    
                    for (String asset : majorTokens) {
                        String pairId = createPairId(sourceChain, targetChain, asset);
                        supportedPairs.put(pairId, new SwapPair(sourceChain, targetChain, asset, asset));
                    }
                }
            }
        }
        
        logger.info("Initialized {} supported trading pairs", supportedPairs.size());
    }

    /**
     * Initiates a cross-chain bridge transaction
     */
    public CompletableFuture<BridgeTransactionResult> bridgeAsset(BridgeRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                logger.info("Initiating bridge transaction: {} {} from {} to {}", 
                    request.getAmount(), request.getAsset(), request.getSourceChain(), request.getTargetChain());
                
                // Validate request
                validateBridgeRequest(request);
                
                // Check slippage tolerance
                BigDecimal estimatedSlippage = liquidityPoolManager.estimateSlippage(
                    request.getSourceChain(), request.getTargetChain(), 
                    request.getAsset(), request.getAmount());
                
                if (estimatedSlippage.multiply(BigDecimal.valueOf(10000)).intValue() > maxSlippageBasisPoints) {
                    throw new BridgeException("Slippage too high: " + estimatedSlippage + "%");
                }
                
                // Create bridge transaction
                BridgeTransaction transaction = createBridgeTransaction(request);
                pendingTransactions.put(transaction.getId(), transaction);
                
                // Start atomic swap process
                AtomicSwapResult swapResult = atomicSwapManager.initiateSwap(
                    request.getSourceChain(), request.getTargetChain(),
                    request.getAsset(), request.getAmount(),
                    request.getSender(), request.getRecipient());
                
                transaction.setSwapId(swapResult.getSwapId());
                transaction.setStatus(BridgeStatus.SWAP_INITIATED);
                
                // Submit to validator consensus
                boolean consensusReached = bridgeValidatorService.submitForConsensus(transaction);
                if (!consensusReached) {
                    throw new BridgeException("Failed to reach validator consensus");
                }
                
                transaction.setStatus(BridgeStatus.CONSENSUS_REACHED);
                
                // Update metrics
                metrics.incrementTotalTransactions();
                metrics.updateAverageLatency(System.currentTimeMillis() - transaction.getCreatedAt());
                
                return new BridgeTransactionResult(transaction.getId(), BridgeStatus.COMPLETED, 
                    estimatedSlippage, swapResult.getEstimatedTime());
                
            } catch (Exception e) {
                logger.error("Bridge transaction failed", e);
                metrics.incrementFailedTransactions();
                return new BridgeTransactionResult(null, BridgeStatus.FAILED, 
                    BigDecimal.ZERO, 0L, e.getMessage());
            }
        });
    }

    /**
     * Performs atomic swap between two chains
     */
    public CompletableFuture<AtomicSwapResult> performAtomicSwap(AtomicSwapRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                logger.info("Performing atomic swap between {} and {}", 
                    request.getChainA(), request.getChainB());
                
                return atomicSwapManager.performSwap(request);
                
            } catch (Exception e) {
                logger.error("Atomic swap failed", e);
                throw new RuntimeException("Atomic swap failed", e);
            }
        });
    }

    /**
     * Gets current liquidity pool status
     */
    public LiquidityPoolStatus getLiquidityPoolStatus(String sourceChain, String targetChain) {
        return liquidityPoolManager.getPoolStatus(sourceChain, targetChain);
    }

    /**
     * Gets bridge transaction status
     */
    public Optional<BridgeTransaction> getTransactionStatus(String transactionId) {
        BridgeTransaction transaction = pendingTransactions.get(transactionId);
        if (transaction != null) {
            // Update status from chain adapters if needed
            updateTransactionStatus(transaction);
        }
        return Optional.ofNullable(transaction);
    }

    /**
     * Gets supported chains
     */
    public List<ChainInfo> getSupportedChains() {
        return chainAdapters.values().stream()
            .map(adapter -> new ChainInfo(
                adapter.getChainId(),
                adapter.getChainName(),
                adapter.getChainType(),
                adapter.isActive(),
                adapter.getAverageConfirmationTime(),
                adapter.getSupportedAssets()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Gets bridge performance metrics
     */
    public BridgeMetrics getMetrics() {
        metrics.setSupportedChains(chainAdapters.size());
        metrics.setPendingTransactions(pendingTransactions.size());
        metrics.setActivePairs(supportedPairs.size());
        return metrics;
    }

    /**
     * Estimates transaction fee and time
     */
    public BridgeEstimate estimateBridge(String sourceChain, String targetChain, 
                                       String asset, BigDecimal amount) {
        ChainAdapter sourceAdapter = chainAdapters.get(sourceChain);
        ChainAdapter targetAdapter = chainAdapters.get(targetChain);
        
        if (sourceAdapter == null || targetAdapter == null) {
            throw new IllegalArgumentException("Unsupported chain");
        }
        
        BigDecimal sourceFee = sourceAdapter.estimateTransactionFee(asset, amount);
        BigDecimal targetFee = targetAdapter.estimateTransactionFee(asset, amount);
        BigDecimal bridgeFee = calculateBridgeFee(sourceChain, targetChain, amount);
        BigDecimal slippage = liquidityPoolManager.estimateSlippage(sourceChain, targetChain, asset, amount);
        
        long estimatedTime = sourceAdapter.getAverageConfirmationTime() + 
                           targetAdapter.getAverageConfirmationTime() + 
                           10000; // Bridge processing time
        
        return new BridgeEstimate(
            sourceFee.add(targetFee).add(bridgeFee),
            slippage,
            estimatedTime,
            amount.subtract(amount.multiply(slippage.divide(BigDecimal.valueOf(100))))
        );
    }

    /**
     * Scheduled cleanup of completed transactions
     */
    @Scheduled(every = "1h")
    void cleanupCompletedTransactions() {
        long cutoff = System.currentTimeMillis() - 86400000; // 24 hours
        
        List<String> toRemove = pendingTransactions.entrySet().stream()
            .filter(entry -> entry.getValue().getCreatedAt() < cutoff && 
                           (entry.getValue().getStatus() == BridgeStatus.COMPLETED ||
                            entry.getValue().getStatus() == BridgeStatus.FAILED))
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
        
        toRemove.forEach(pendingTransactions::remove);
        
        if (!toRemove.isEmpty()) {
            logger.info("Cleaned up {} completed transactions", toRemove.size());
        }
    }

    /**
     * Health check for all chain adapters
     */
    @Scheduled(every = "5m")
    void performHealthCheck() {
        CompletableFuture.runAsync(() -> {
            for (Map.Entry<String, ChainAdapter> entry : chainAdapters.entrySet()) {
                try {
                    boolean healthy = entry.getValue().healthCheck();
                    if (!healthy) {
                        logger.warn("Chain adapter {} is unhealthy", entry.getKey());
                        metrics.incrementUnhealthyChains();
                    }
                } catch (Exception e) {
                    logger.error("Health check failed for chain {}", entry.getKey(), e);
                }
            }
        });
    }

    // Helper methods

    private void validateBridgeRequest(BridgeRequest request) {
        if (!chainAdapters.containsKey(request.getSourceChain())) {
            throw new IllegalArgumentException("Unsupported source chain: " + request.getSourceChain());
        }
        
        if (!chainAdapters.containsKey(request.getTargetChain())) {
            throw new IllegalArgumentException("Unsupported target chain: " + request.getTargetChain());
        }
        
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        if (request.getAmount().compareTo(BigDecimal.valueOf(100000000)) > 0) {
            throw new IllegalArgumentException("Amount exceeds maximum limit");
        }
        
        String pairId = createPairId(request.getSourceChain(), request.getTargetChain(), request.getAsset());
        if (!supportedPairs.containsKey(pairId)) {
            throw new IllegalArgumentException("Trading pair not supported");
        }
    }

    private BridgeTransaction createBridgeTransaction(BridgeRequest request) {
        String transactionId = "bridge-" + transactionCounter.incrementAndGet() + "-" + System.currentTimeMillis();
        
        return BridgeTransaction.builder()
            .id(transactionId)
            .sourceChain(request.getSourceChain())
            .targetChain(request.getTargetChain())
            .asset(request.getAsset())
            .amount(request.getAmount())
            .sender(request.getSender())
            .recipient(request.getRecipient())
            .status(BridgeStatus.INITIATED)
            .createdAt(System.currentTimeMillis())
            .build();
    }

    private void updateTransactionStatus(BridgeTransaction transaction) {
        // Update status based on chain confirmations
        if (transaction.getStatus() == BridgeStatus.CONSENSUS_REACHED) {
            ChainAdapter sourceAdapter = chainAdapters.get(transaction.getSourceChain());
            ChainAdapter targetAdapter = chainAdapters.get(transaction.getTargetChain());
            
            // Check if transaction is confirmed on both chains
            boolean sourceConfirmed = sourceAdapter.isTransactionConfirmed(transaction.getSourceTxHash(), minConfirmations);
            boolean targetConfirmed = targetAdapter.isTransactionConfirmed(transaction.getTargetTxHash(), minConfirmations);
            
            if (sourceConfirmed && targetConfirmed) {
                transaction.setStatus(BridgeStatus.COMPLETED);
                transaction.setCompletedAt(System.currentTimeMillis());
                metrics.incrementCompletedTransactions();
            }
        }
    }

    private String createPairId(String sourceChain, String targetChain, String asset) {
        return sourceChain + "-" + targetChain + "-" + asset;
    }

    private BigDecimal calculateBridgeFee(String sourceChain, String targetChain, BigDecimal amount) {
        // Progressive fee structure: 0.1% base + volume-based adjustment
        BigDecimal baseFee = amount.multiply(BigDecimal.valueOf(0.001));
        
        // Discount for high-volume transactions
        if (amount.compareTo(BigDecimal.valueOf(100000)) > 0) {
            baseFee = baseFee.multiply(BigDecimal.valueOf(0.5)); // 50% discount
        }
        
        return baseFee;
    }

    // Inner classes for data transfer
    
    public static class BridgeRequest {
        private String sourceChain;
        private String targetChain;
        private String asset;
        private BigDecimal amount;
        private String sender;
        private String recipient;
        private BigDecimal maxSlippage;
        
        // Getters and setters
        public String getSourceChain() { return sourceChain; }
        public void setSourceChain(String sourceChain) { this.sourceChain = sourceChain; }
        public String getTargetChain() { return targetChain; }
        public void setTargetChain(String targetChain) { this.targetChain = targetChain; }
        public String getAsset() { return asset; }
        public void setAsset(String asset) { this.asset = asset; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getRecipient() { return recipient; }
        public void setRecipient(String recipient) { this.recipient = recipient; }
        public BigDecimal getMaxSlippage() { return maxSlippage; }
        public void setMaxSlippage(BigDecimal maxSlippage) { this.maxSlippage = maxSlippage; }
    }

    public static class BridgeTransactionResult {
        private final String transactionId;
        private final BridgeStatus status;
        private final BigDecimal actualSlippage;
        private final Long estimatedTime;
        private final String errorMessage;
        
        public BridgeTransactionResult(String transactionId, BridgeStatus status, 
                                     BigDecimal actualSlippage, Long estimatedTime) {
            this(transactionId, status, actualSlippage, estimatedTime, null);
        }
        
        public BridgeTransactionResult(String transactionId, BridgeStatus status, 
                                     BigDecimal actualSlippage, Long estimatedTime, String errorMessage) {
            this.transactionId = transactionId;
            this.status = status;
            this.actualSlippage = actualSlippage;
            this.estimatedTime = estimatedTime;
            this.errorMessage = errorMessage;
        }
        
        // Getters
        public String getTransactionId() { return transactionId; }
        public BridgeStatus getStatus() { return status; }
        public BigDecimal getActualSlippage() { return actualSlippage; }
        public Long getEstimatedTime() { return estimatedTime; }
        public String getErrorMessage() { return errorMessage; }
    }

    public static class BridgeEstimate {
        private final BigDecimal totalFee;
        private final BigDecimal estimatedSlippage;
        private final Long estimatedTime;
        private final BigDecimal estimatedReceiveAmount;
        
        public BridgeEstimate(BigDecimal totalFee, BigDecimal estimatedSlippage, 
                            Long estimatedTime, BigDecimal estimatedReceiveAmount) {
            this.totalFee = totalFee;
            this.estimatedSlippage = estimatedSlippage;
            this.estimatedTime = estimatedTime;
            this.estimatedReceiveAmount = estimatedReceiveAmount;
        }
        
        // Getters
        public BigDecimal getTotalFee() { return totalFee; }
        public BigDecimal getEstimatedSlippage() { return estimatedSlippage; }
        public Long getEstimatedTime() { return estimatedTime; }
        public BigDecimal getEstimatedReceiveAmount() { return estimatedReceiveAmount; }
    }

    public enum BridgeStatus {
        INITIATED, SWAP_INITIATED, CONSENSUS_REACHED, CONFIRMED, COMPLETED, FAILED
    }

    public static class BridgeException extends RuntimeException {
        public BridgeException(String message) {
            super(message);
        }
        
        public BridgeException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}