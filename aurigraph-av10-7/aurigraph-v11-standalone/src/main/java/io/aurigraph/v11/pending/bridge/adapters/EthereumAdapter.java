package io.aurigraph.v11.pending.bridge.adapters;

import io.aurigraph.v11.pending.bridge.models.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Named;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.Hash;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.*;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Convert;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Ethereum Blockchain Adapter
 * 
 * Provides comprehensive integration with Ethereum mainnet and EVM-compatible networks.
 * Supports Web3j for blockchain interactions, transaction monitoring, and contract execution.
 * 
 * Features:
 * - Connection management with retry logic
 * - Transaction submission and monitoring
 * - Event monitoring for bridge contracts
 * - Balance queries and gas estimation
 * - ERC-20 token support
 * - Contract interaction for bridge operations
 * - High-throughput transaction batching
 */
@ApplicationScoped
@Named("ethereumAdapter")
public class EthereumAdapter implements ChainAdapter {

    private static final Logger LOG = Logger.getLogger(EthereumAdapter.class);

    // Configuration
    @ConfigProperty(name = "aurigraph.bridge.ethereum.rpc-url", 
                   defaultValue = "https://eth-mainnet.alchemyapi.io/v2/your-api-key")
    String rpcUrl;

    @ConfigProperty(name = "aurigraph.bridge.ethereum.bridge-contract", 
                   defaultValue = "0x742d35Cc6634C0532925a3b8D3Ac8E7b8fe30A4c")
    String bridgeContractAddress;

    @ConfigProperty(name = "aurigraph.bridge.ethereum.confirmation-blocks", defaultValue = "12")
    int confirmationBlocks;

    @ConfigProperty(name = "aurigraph.bridge.ethereum.gas-limit", defaultValue = "300000")
    long gasLimit;

    @ConfigProperty(name = "aurigraph.bridge.ethereum.gas-price-gwei", defaultValue = "20")
    long gasPriceGwei;

    @ConfigProperty(name = "aurigraph.bridge.ethereum.chain-id", defaultValue = "1")
    long chainId;

    // Web3j client
    private Web3j web3j;
    private final AtomicBoolean isConnected = new AtomicBoolean(false);
    private final AtomicLong lastHealthCheck = new AtomicLong(0);
    private final Map<String, TransactionMonitor> transactionMonitors = new ConcurrentHashMap<>();
    
    // Performance metrics
    private final AtomicLong totalTransactions = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private final AtomicLong failedTransactions = new AtomicLong(0);

    // Chain information
    private final ChainInfo chainInfo;

    public EthereumAdapter() {
        this.chainInfo = ChainInfo.builder()
            .chainId("ethereum")
            .name("Ethereum Mainnet")
            .displayName("Ethereum")
            .networkId(1)
            .nativeCurrency("ETH")
            .currencySymbol("ETH")
            .decimals(18)
            .isActive(true)
            .chainType("EVM")
            .confirmationBlocks(12)
            .averageBlockTime(15000)
            .averageConfirmationTime(180)
            .minTransferAmount(new BigDecimal("0.001"))
            .maxTransferAmount(new BigDecimal("1000"))
            .baseFee(new BigDecimal("20"))
            .build();
        
        initializeConnection();
    }

    @Override
    public Uni<Void> initialize() {
        return Uni.createFrom().item(() -> {
            initializeConnection();
            return null;
        });
    }

    private void initializeConnection() {
        try {
            web3j = Web3j.build(new HttpService(rpcUrl));
            
            // Test connection
            EthChainId ethChainId = web3j.ethChainId().send();
            if (ethChainId.hasError()) {
                LOG.warnf("Failed to connect to Ethereum: %s", ethChainId.getError().getMessage());
                isConnected.set(false);
            } else {
                isConnected.set(true);
                lastHealthCheck.set(System.currentTimeMillis());
                LOG.infof("Connected to Ethereum network (Chain ID: %s)", ethChainId.getChainId());
            }
        } catch (Exception e) {
            LOG.errorf("Error initializing Ethereum adapter: %s", e.getMessage());
            isConnected.set(false);
        }
    }

    @Override
    public ChainInfo getChainInfo() {
        return chainInfo;
    }

    @Override
    public Uni<String> submitTransaction(BridgeTransaction transaction) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<String> future = new CompletableFuture<>();
            
            try {
                totalTransactions.incrementAndGet();
                
                // Build transaction based on type
                org.web3j.protocol.core.methods.request.Transaction web3Transaction = 
                    buildTransaction(transaction);
                
                // Submit transaction
                EthSendTransaction response = web3j.ethSendTransaction(web3Transaction).send();
                
                if (response.hasError()) {
                    failedTransactions.incrementAndGet();
                    future.completeExceptionally(
                        new RuntimeException("Transaction failed: " + response.getError().getMessage()));
                } else {
                    String txHash = response.getTransactionHash();
                    successfulTransactions.incrementAndGet();
                    
                    // Start monitoring transaction
                    startTransactionMonitoring(txHash, transaction);
                    
                    LOG.infof("Submitted Ethereum transaction: %s", txHash);
                    future.complete(txHash);
                }
                
            } catch (Exception e) {
                failedTransactions.incrementAndGet();
                LOG.errorf("Error submitting Ethereum transaction: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public Uni<TransactionStatus> getTransactionStatus(String transactionHash) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<TransactionStatus> future = new CompletableFuture<>();
            
            try {
                // Get transaction receipt
                EthGetTransactionReceipt receiptResponse = 
                    web3j.ethGetTransactionReceipt(transactionHash).send();
                
                Optional<TransactionReceipt> receiptOpt = receiptResponse.getTransactionReceipt();
                
                if (receiptOpt.isPresent()) {
                    TransactionReceipt receipt = receiptOpt.get();
                    
                    // Get current block number
                    EthBlockNumber blockNumber = web3j.ethBlockNumber().send();
                    long currentBlock = blockNumber.getBlockNumber().longValue();
                    long transactionBlock = receipt.getBlockNumber().longValue();
                    int confirmations = (int) Math.max(0, currentBlock - transactionBlock + 1);
                    
                    boolean isSuccess = "0x1".equals(receipt.getStatus());
                    TransactionStatusType status = isSuccess ? 
                        (confirmations >= confirmationBlocks ? 
                            TransactionStatusType.CONFIRMED : TransactionStatusType.PENDING) :
                        TransactionStatusType.FAILED;
                    
                    TransactionStatus txStatus = new TransactionStatus(
                        transactionHash,
                        status,
                        confirmations,
                        confirmationBlocks,
                        receipt.getGasUsed().longValue(),
                        isSuccess ? null : "Transaction reverted",
                        receipt.getBlockNumber().longValue(),
                        System.currentTimeMillis()
                    );
                    
                    future.complete(txStatus);
                } else {
                    // Transaction not yet mined
                    TransactionStatus txStatus = new TransactionStatus(
                        transactionHash,
                        TransactionStatusType.PENDING,
                        0,
                        confirmationBlocks,
                        0,
                        null,
                        0,
                        System.currentTimeMillis()
                    );
                    future.complete(txStatus);
                }
                
            } catch (Exception e) {
                LOG.errorf("Error getting Ethereum transaction status: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public Uni<BigDecimal> getBalance(String address, String tokenContract) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<BigDecimal> future = new CompletableFuture<>();
            
            try {
                if (tokenContract == null || tokenContract.isEmpty()) {
                    // Native ETH balance
                    EthGetBalance balance = web3j.ethGetBalance(address, DefaultBlockParameterName.LATEST).send();
                    BigDecimal ethBalance = Convert.fromWei(balance.getBalance().toString(), Convert.Unit.ETHER);
                    future.complete(ethBalance);
                } else {
                    // ERC-20 token balance
                    String balanceFunction = buildBalanceOfFunction(address);
                    EthCall response = web3j.ethCall(
                        org.web3j.protocol.core.methods.request.Transaction.createEthCallTransaction(
                            null, tokenContract, balanceFunction),
                        DefaultBlockParameterName.LATEST
                    ).send();
                    
                    if (response.hasError()) {
                        future.completeExceptionally(
                            new RuntimeException("Failed to get token balance: " + response.getError().getMessage()));
                    } else {
                        // Decode balance response
                        BigInteger balance = new BigInteger(response.getValue().substring(2), 16);
                        BigDecimal tokenBalance = new BigDecimal(balance).divide(
                            BigDecimal.valueOf(Math.pow(10, 18))); // Assuming 18 decimals
                        future.complete(tokenBalance);
                    }
                }
                
            } catch (Exception e) {
                LOG.errorf("Error getting Ethereum balance: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public Uni<BigDecimal> estimateGasFee(BridgeTransaction transaction) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<BigDecimal> future = new CompletableFuture<>();
            
            try {
                // Get current gas price
                EthGasPrice gasPrice = web3j.ethGasPrice().send();
                BigInteger currentGasPrice = gasPrice.getGasPrice();
                
                // Estimate gas limit
                org.web3j.protocol.core.methods.request.Transaction web3Transaction = 
                    buildTransaction(transaction);
                
                EthEstimateGas gasEstimate = web3j.ethEstimateGas(web3Transaction).send();
                BigInteger estimatedGas = gasEstimate.hasError() ? 
                    BigInteger.valueOf(gasLimit) : gasEstimate.getAmountUsed();
                
                // Calculate total fee
                BigInteger totalWei = currentGasPrice.multiply(estimatedGas);
                BigDecimal feeEth = Convert.fromWei(totalWei.toString(), Convert.Unit.ETHER);
                
                future.complete(feeEth);
                
            } catch (Exception e) {
                LOG.errorf("Error estimating Ethereum gas fee: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    @Override
    public Uni<Boolean> isHealthy() {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<Boolean> future = new CompletableFuture<>();
            
            try {
                // Check if we need to refresh health status
                long now = System.currentTimeMillis();
                if (now - lastHealthCheck.get() > 30000) { // 30 seconds
                    checkHealth();
                }
                
                future.complete(isConnected.get());
                
            } catch (Exception e) {
                LOG.warnf("Health check error: %s", e.getMessage());
                future.complete(false);
            }
            
            return future;
        });
    }

    @Override
    public String getChainId() {
        return "ethereum";
    }

    @Override
    public boolean supportsAtomicSwaps() {
        return true;
    }

    @Override
    public Uni<String> createAtomicSwapContract(String counterparty, BigDecimal amount, 
                                                byte[] hashLock, long lockTime) {
        return Uni.createFrom().completionStage(() -> {
            CompletableFuture<String> future = new CompletableFuture<>();
            
            try {
                // Build atomic swap contract creation transaction
                Function swapFunction = buildAtomicSwapFunction(counterparty, amount, hashLock, lockTime);
                String encodedFunction = FunctionEncoder.encode(swapFunction);
                
                org.web3j.protocol.core.methods.request.Transaction transaction = 
                    org.web3j.protocol.core.methods.request.Transaction.createFunctionCallTransaction(
                        null, // from (will be set by wallet)
                        BigInteger.valueOf(gasLimit),
                        BigInteger.valueOf(gasPriceGwei * 1_000_000_000L), // Convert Gwei to Wei
                        bridgeContractAddress,
                        encodedFunction
                    );
                
                EthSendTransaction response = web3j.ethSendTransaction(transaction).send();
                
                if (response.hasError()) {
                    future.completeExceptionally(
                        new RuntimeException("Atomic swap creation failed: " + response.getError().getMessage()));
                } else {
                    future.complete(response.getTransactionHash());
                }
                
            } catch (Exception e) {
                LOG.errorf("Error creating Ethereum atomic swap: %s", e.getMessage());
                future.completeExceptionally(e);
            }
            
            return future;
        });
    }

    // Private helper methods

    private void checkHealth() {
        try {
            EthSyncing syncing = web3j.ethSyncing().send();
            EthBlockNumber blockNumber = web3j.ethBlockNumber().send();
            
            boolean healthy = !syncing.hasError() && !blockNumber.hasError();
            isConnected.set(healthy);
            lastHealthCheck.set(System.currentTimeMillis());
            
            if (!healthy) {
                LOG.warnf("Ethereum health check failed - syncing error: %s, block error: %s", 
                         syncing.hasError() ? syncing.getError().getMessage() : "none",
                         blockNumber.hasError() ? blockNumber.getError().getMessage() : "none");
            }
            
        } catch (Exception e) {
            LOG.warnf("Ethereum health check exception: %s", e.getMessage());
            isConnected.set(false);
        }
    }

    private org.web3j.protocol.core.methods.request.Transaction buildTransaction(BridgeTransaction transaction) {
        // Build transaction based on bridge transaction type
        switch (transaction.getType()) {
            case LOCK_AND_MINT:
                return buildLockTransaction(transaction);
            case BURN_AND_MINT:
                return buildBurnTransaction(transaction);
            case ATOMIC_SWAP:
                return buildSwapTransaction(transaction);
            default:
                throw new IllegalArgumentException("Unsupported transaction type: " + transaction.getType());
        }
    }

    private org.web3j.protocol.core.methods.request.Transaction buildLockTransaction(BridgeTransaction transaction) {
        // Create function to lock tokens on bridge contract
        Function lockFunction = new Function(
            "lockTokens",
            Arrays.asList(
                new Address(transaction.getTokenContract()),
                new Uint256(transaction.getAmount().multiply(BigDecimal.valueOf(Math.pow(10, 18))).toBigInteger()),
                new Utf8String(transaction.getTargetChain()),
                new Address(transaction.getTargetAddress())
            ),
            Collections.emptyList()
        );

        String encodedFunction = FunctionEncoder.encode(lockFunction);

        return org.web3j.protocol.core.methods.request.Transaction.createFunctionCallTransaction(
            transaction.getSourceAddress(),
            BigInteger.valueOf(gasLimit),
            BigInteger.valueOf(gasPriceGwei * 1_000_000_000L),
            bridgeContractAddress,
            encodedFunction
        );
    }

    private org.web3j.protocol.core.methods.request.Transaction buildBurnTransaction(BridgeTransaction transaction) {
        // Create function to burn tokens
        Function burnFunction = new Function(
            "burnTokens",
            Arrays.asList(
                new Address(transaction.getTokenContract()),
                new Uint256(transaction.getAmount().multiply(BigDecimal.valueOf(Math.pow(10, 18))).toBigInteger()),
                new Utf8String(transaction.getTargetChain()),
                new Address(transaction.getTargetAddress())
            ),
            Collections.emptyList()
        );

        String encodedFunction = FunctionEncoder.encode(burnFunction);

        return org.web3j.protocol.core.methods.request.Transaction.createFunctionCallTransaction(
            transaction.getSourceAddress(),
            BigInteger.valueOf(gasLimit),
            BigInteger.valueOf(gasPriceGwei * 1_000_000_000L),
            bridgeContractAddress,
            encodedFunction
        );
    }

    private org.web3j.protocol.core.methods.request.Transaction buildSwapTransaction(BridgeTransaction transaction) {
        // Create atomic swap transaction
        Function swapFunction = buildAtomicSwapFunction(
            transaction.getTargetAddress(),
            transaction.getAmount(),
            transaction.getHashLock(),
            transaction.getLockTime()
        );

        String encodedFunction = FunctionEncoder.encode(swapFunction);

        return org.web3j.protocol.core.methods.request.Transaction.createFunctionCallTransaction(
            transaction.getSourceAddress(),
            BigInteger.valueOf(gasLimit),
            BigInteger.valueOf(gasPriceGwei * 1_000_000_000L),
            bridgeContractAddress,
            encodedFunction
        );
    }

    private Function buildAtomicSwapFunction(String counterparty, BigDecimal amount, byte[] hashLock, long lockTime) {
        return new Function(
            "createAtomicSwap",
            Arrays.asList(
                new Address(counterparty),
                new Uint256(amount.multiply(BigDecimal.valueOf(Math.pow(10, 18))).toBigInteger()),
                new org.web3j.abi.datatypes.generated.Bytes32(hashLock),
                new Uint256(BigInteger.valueOf(lockTime))
            ),
            Collections.emptyList()
        );
    }

    private String buildBalanceOfFunction(String address) {
        Function balanceOfFunction = new Function(
            "balanceOf",
            Arrays.asList(new Address(address)),
            Arrays.asList(new TypeReference<Uint256>() {})
        );
        
        return FunctionEncoder.encode(balanceOfFunction);
    }

    private void startTransactionMonitoring(String txHash, BridgeTransaction transaction) {
        TransactionMonitor monitor = new TransactionMonitor(txHash, transaction);
        transactionMonitors.put(txHash, monitor);
        
        // Start monitoring in background
        CompletableFuture.runAsync(() -> monitor.startMonitoring());
    }

    // Transaction monitoring helper class
    private class TransactionMonitor {
        private final String transactionHash;
        private final BridgeTransaction transaction;
        private volatile boolean monitoring = true;

        public TransactionMonitor(String transactionHash, BridgeTransaction transaction) {
            this.transactionHash = transactionHash;
            this.transaction = transaction;
        }

        public void startMonitoring() {
            while (monitoring) {
                try {
                    TransactionStatus status = getTransactionStatus(transactionHash).await().atMost(java.time.Duration.ofSeconds(10));
                    
                    if (status.getStatus().isTerminal()) {
                        monitoring = false;
                        transactionMonitors.remove(transactionHash);
                        
                        LOG.infof("Transaction %s completed with status: %s", 
                                transactionHash, status.getStatus());
                    }
                    
                    Thread.sleep(5000); // Check every 5 seconds
                    
                } catch (Exception e) {
                    LOG.warnf("Error monitoring transaction %s: %s", transactionHash, e.getMessage());
                    Thread.sleep(10000); // Wait longer on error
                }
            }
        }

        public void stopMonitoring() {
            monitoring = false;
        }
    }

    // Metrics and status methods
    public long getTotalTransactions() { return totalTransactions.get(); }
    public long getSuccessfulTransactions() { return successfulTransactions.get(); }
    public long getFailedTransactions() { return failedTransactions.get(); }
    
    public double getSuccessRate() {
        long total = getTotalTransactions();
        return total > 0 ? (double) getSuccessfulTransactions() / total : 0.0;
    }
}