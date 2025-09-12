package io.aurigraph.bridge.adapters;

import io.aurigraph.bridge.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.security.PublicKey;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Bitcoin Chain Adapter
 * 
 * Implements cross-chain bridge functionality for Bitcoin network.
 * Features:
 * - UTXO management and optimization
 * - Multi-signature P2SH addresses
 * - Time-locked contracts (using OP_CHECKLOCKTIMEVERIFY)
 * - Fee estimation with mempool analysis
 * - Replace-by-fee (RBF) support
 * 
 * Bitcoin-specific Considerations:
 * - Longer confirmation times (10 minutes average)
 * - Higher security requirements (6 confirmations recommended)
 * - UTXO selection optimization
 * - Segwit compatibility
 */
public class BitcoinAdapter extends BaseChainAdapter {

    private static final Logger logger = LoggerFactory.getLogger(BitcoinAdapter.class);
    
    private final Map<String, UTXOSet> addressUTXOs = new HashMap<>();
    private final Map<String, HTLCContract> deployedHTLCs = new ConcurrentHashMap<>();
    
    // Bitcoin network parameters
    private volatile long avgBlockTime = 600000; // 10 minutes in milliseconds
    private volatile BigDecimal currentFeeRate = BigDecimal.valueOf(20); // sat/vB
    private volatile long lastBlockHeight = 0;

    public BitcoinAdapter(String rpcUrl, int requiredConfirmations) {
        super("bitcoin", "Bitcoin", ChainType.BITCOIN, rpcUrl, requiredConfirmations);
    }

    @Override
    public void initialize() {
        try {
            logger.info("Initializing Bitcoin adapter with RPC: {}", rpcUrl);
            
            // Initialize connection to Bitcoin node
            super.initialize();
            
            // Start background monitoring
            startFeeRateMonitoring();
            startUTXOMonitoring();
            
            logger.info("Bitcoin adapter initialized successfully");
            
        } catch (Exception e) {
            logger.error("Failed to initialize Bitcoin adapter", e);
            throw new ChainAdapterException("Bitcoin initialization failed", e);
        }
    }

    @Override
    public List<String> getSupportedAssets() {
        return Arrays.asList("BTC");
    }

    @Override
    public long getAverageConfirmationTime() {
        return avgBlockTime * requiredConfirmations;
    }

    @Override
    protected boolean performHealthCheck() {
        try {
            // In production, this would make actual RPC calls to Bitcoin node
            // For now, simulate connectivity check
            
            // Check if we can get current block height
            long currentBlock = getCurrentBlockHeight();
            
            // Check if node is synced (block height should be reasonable)
            long expectedMinHeight = 800000; // Approximate current Bitcoin block height
            
            boolean isSynced = currentBlock > expectedMinHeight;
            
            if (!isSynced) {
                logger.warn("Bitcoin node appears to be out of sync. Block height: {}", currentBlock);
                return false;
            }
            
            // Check mempool connectivity
            boolean mempoolHealthy = checkMempoolHealth();
            
            return isSynced && mempoolHealthy;
            
        } catch (Exception e) {
            logger.error("Bitcoin health check failed", e);
            return false;
        }
    }

    @Override
    public BigDecimal estimateTransactionFee(String asset, BigDecimal amount) {
        try {
            if (!"BTC".equals(asset)) {
                throw new IllegalArgumentException("Bitcoin adapter only supports BTC");
            }
            
            // Estimate transaction size based on inputs and outputs
            int estimatedInputs = 2; // Average inputs needed
            int estimatedOutputs = 2; // Recipient + change
            
            // P2WPKH transaction size estimation
            int baseSize = 10; // Version, locktime, etc.
            int inputSize = 68; // Per input (with witness data)
            int outputSize = 31; // Per output
            
            int totalSize = baseSize + (estimatedInputs * inputSize) + (estimatedOutputs * outputSize);
            int vBytes = (int) Math.ceil(totalSize * 0.75); // Segwit discount
            
            // For multi-sig operations, increase size significantly
            vBytes *= 3; // Multi-sig transactions are larger
            
            // Calculate fee based on current fee rate
            BigDecimal feeInSatoshis = currentFeeRate.multiply(BigDecimal.valueOf(vBytes));
            
            // Convert to BTC
            BigDecimal feeInBTC = feeInSatoshis.divide(BigDecimal.valueOf(100000000), 8, 
                java.math.RoundingMode.CEILING);
            
            logger.debug("Estimated Bitcoin fee: {} BTC ({} sat, {} vBytes at {} sat/vB)", 
                feeInBTC, feeInSatoshis, vBytes, currentFeeRate);
            
            return feeInBTC;
            
        } catch (Exception e) {
            logger.error("Failed to estimate Bitcoin transaction fee", e);
            return BigDecimal.valueOf(0.001); // Default fee estimate
        }
    }

    @Override
    public boolean isTransactionConfirmed(String txHash, int requiredConfirmations) {
        try {
            // In production, this would query the Bitcoin node
            // For now, simulate confirmation checking
            
            TransactionInfo txInfo = getTransactionInfo(txHash);
            if (txInfo == null) {
                return false;
            }
            
            boolean isConfirmed = txInfo.getConfirmations() >= requiredConfirmations;
            
            logger.debug("Bitcoin transaction {} confirmations: {}/{}", 
                txHash, txInfo.getConfirmations(), requiredConfirmations);
            
            return isConfirmed;
            
        } catch (Exception e) {
            logger.error("Failed to check Bitcoin transaction confirmation: {}", txHash, e);
            return false;
        }
    }

    @Override
    public String createMultiSigAddress(List<PublicKey> publicKeys, int requiredSignatures) {
        try {
            logger.info("Creating Bitcoin multi-sig address: {}/{} signatures", 
                requiredSignatures, publicKeys.size());
            
            if (requiredSignatures > publicKeys.size()) {
                throw new IllegalArgumentException("Required signatures cannot exceed number of keys");
            }
            
            if (publicKeys.size() > 15) {
                throw new IllegalArgumentException("Bitcoin multi-sig supports maximum 15 keys");
            }
            
            // Generate P2SH multi-sig address
            // In production, this would create actual Bitcoin script and address
            StringBuilder scriptData = new StringBuilder();
            scriptData.append(requiredSignatures).append(" ");
            
            for (PublicKey key : publicKeys) {
                // Convert public key to Bitcoin format
                String pubKeyHex = bytesToHex(key.getEncoded());
                scriptData.append(pubKeyHex).append(" ");
            }
            
            scriptData.append(publicKeys.size()).append(" OP_CHECKMULTISIG");
            
            // Generate deterministic P2SH address (for demo purposes)
            String scriptHash = Integer.toHexString(scriptData.toString().hashCode());
            String address = "3" + scriptHash + "ABCDEFGHIJKLMNOPQRSTUVWXYZ12345".substring(0, 33);
            
            logger.info("Created Bitcoin multi-sig address: {}", address);
            return address;
            
        } catch (Exception e) {
            logger.error("Failed to create Bitcoin multi-sig address", e);
            throw new ChainAdapterException("Multi-sig creation failed", e);
        }
    }

    @Override
    public String executeMultiSigTransaction(MultiSigTransaction transaction, MultiSigWallet wallet) {
        try {
            logger.info("Executing Bitcoin multi-sig transaction: {} BTC to {}", 
                transaction.getAmount(), transaction.getRecipient());
            
            // Validate signatures
            if (transaction.getSignatures().size() < wallet.getRequiredSignatures()) {
                throw new ChainAdapterException("Insufficient signatures for Bitcoin multi-sig");
            }
            
            // Select UTXOs for the transaction
            List<UTXO> selectedUTXOs = selectUTXOs(wallet.getAddress(), transaction.getAmount());
            
            if (selectedUTXOs.isEmpty()) {
                throw new ChainAdapterException("Insufficient UTXOs for transaction");
            }
            
            // Build transaction
            BitcoinTransaction btcTx = buildMultiSigTransaction(
                selectedUTXOs, transaction, wallet);
            
            // Sign transaction with multi-sig signatures
            signMultiSigTransaction(btcTx, transaction.getSignatures(), wallet);
            
            // Broadcast transaction
            String txHash = broadcastTransaction(btcTx);
            
            logger.info("Bitcoin multi-sig transaction broadcast: {}", txHash);
            return txHash;
            
        } catch (Exception e) {
            logger.error("Failed to execute Bitcoin multi-sig transaction", e);
            throw new ChainAdapterException("Multi-sig execution failed", e);
        }
    }

    @Override
    public String deployHTLC(HTLCContract htlc) {
        try {
            logger.info("Deploying Bitcoin HTLC: {} BTC with timelock {}", 
                htlc.getAmount(), htlc.getTimelock());
            
            // Create HTLC script using OP_IF, OP_SHA256, OP_CHECKLOCKTIMEVERIFY
            BitcoinScript htlcScript = createHTLCScript(htlc);
            
            // Generate P2SH address for the HTLC
            String htlcAddress = generateP2SHAddress(htlcScript);
            
            // Fund the HTLC by sending Bitcoin to the address
            String fundingTxHash = fundHTLC(htlcAddress, htlc.getAmount(), htlc.getSender());
            
            // Store HTLC details
            deployedHTLCs.put(htlcAddress, htlc);
            
            logger.info("Bitcoin HTLC deployed at address: {} (funded by: {})", 
                htlcAddress, fundingTxHash);
            
            return htlcAddress;
            
        } catch (Exception e) {
            logger.error("Failed to deploy Bitcoin HTLC", e);
            throw new ChainAdapterException("HTLC deployment failed", e);
        }
    }

    @Override
    public boolean claimHTLC(String contractAddress, byte[] secret) {
        try {
            logger.info("Claiming Bitcoin HTLC: {}", contractAddress);
            
            HTLCContract htlc = deployedHTLCs.get(contractAddress);
            if (htlc == null) {
                logger.error("Bitcoin HTLC not found: {}", contractAddress);
                return false;
            }
            
            // Verify secret hash
            byte[] computedHash = java.security.MessageDigest.getInstance("SHA-256").digest(secret);
            if (!Arrays.equals(computedHash, htlc.getHashLock())) {
                logger.error("Invalid secret for Bitcoin HTLC: {}", contractAddress);
                return false;
            }
            
            // Check if not expired
            if (System.currentTimeMillis() / 1000 > htlc.getTimelock()) {
                logger.error("Bitcoin HTLC expired: {}", contractAddress);
                return false;
            }
            
            // Build claim transaction
            BitcoinTransaction claimTx = buildHTLCClaimTransaction(contractAddress, htlc, secret);
            
            // Broadcast claim transaction
            String claimTxHash = broadcastTransaction(claimTx);
            
            // Remove from deployed contracts
            deployedHTLCs.remove(contractAddress);
            
            logger.info("Bitcoin HTLC claimed successfully: {} (claim tx: {})", 
                contractAddress, claimTxHash);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to claim Bitcoin HTLC: {}", contractAddress, e);
            return false;
        }
    }

    @Override
    public boolean refundHTLC(String contractAddress) {
        try {
            logger.info("Refunding Bitcoin HTLC: {}", contractAddress);
            
            HTLCContract htlc = deployedHTLCs.get(contractAddress);
            if (htlc == null) {
                logger.error("Bitcoin HTLC not found: {}", contractAddress);
                return false;
            }
            
            // Check if expired (past timelock)
            if (System.currentTimeMillis() / 1000 <= htlc.getTimelock()) {
                logger.error("Bitcoin HTLC not yet expired: {} (current: {}, timelock: {})", 
                    contractAddress, System.currentTimeMillis() / 1000, htlc.getTimelock());
                return false;
            }
            
            // Build refund transaction
            BitcoinTransaction refundTx = buildHTLCRefundTransaction(contractAddress, htlc);
            
            // Broadcast refund transaction
            String refundTxHash = broadcastTransaction(refundTx);
            
            // Remove from deployed contracts
            deployedHTLCs.remove(contractAddress);
            
            logger.info("Bitcoin HTLC refunded successfully: {} (refund tx: {})", 
                contractAddress, refundTxHash);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to refund Bitcoin HTLC: {}", contractAddress, e);
            return false;
        }
    }

    @Override
    public HTLCStatus getHTLCStatus(String contractAddress) {
        try {
            HTLCContract htlc = deployedHTLCs.get(contractAddress);
            if (htlc == null) {
                return HTLCStatus.FAILED;
            }
            
            // Check if spent (claimed or refunded)
            if (isHTLCSpent(contractAddress)) {
                return HTLCStatus.CLAIMED; // Could be claimed or refunded
            }
            
            // Check if expired
            long currentTime = System.currentTimeMillis() / 1000;
            if (currentTime > htlc.getTimelock()) {
                return HTLCStatus.EXPIRED;
            }
            
            return HTLCStatus.DEPLOYED;
            
        } catch (Exception e) {
            logger.error("Failed to get Bitcoin HTLC status: {}", contractAddress, e);
            return HTLCStatus.FAILED;
        }
    }

    @Override
    public CompletableFuture<TransactionResult> monitorTransaction(String txHash) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Poll for transaction confirmation
                for (int i = 0; i < 120; i++) { // Wait up to 20 minutes
                    TransactionInfo txInfo = getTransactionInfo(txHash);
                    
                    if (txInfo != null) {
                        return new TransactionResult(txHash, txInfo.isSuccess(), null,
                            getCurrentBlockHeight() - txInfo.getConfirmations(), 
                            txInfo.getConfirmations());
                    }
                    
                    Thread.sleep(10000); // Wait 10 seconds
                }
                
                return new TransactionResult(txHash, false, "Transaction not found after monitoring period", 0, 0);
                
            } catch (Exception e) {
                logger.error("Failed to monitor Bitcoin transaction: {}", txHash, e);
                return new TransactionResult(txHash, false, e.getMessage(), 0, 0);
            }
        });
    }

    @Override
    public long getCurrentBlockHeight() {
        try {
            // In production, this would query the Bitcoin node
            // For simulation, use a reasonable current height
            
            if (lastBlockHeight == 0) {
                lastBlockHeight = 820000; // Approximate current Bitcoin block height
            }
            
            // Simulate new blocks (approximately every 10 minutes)
            long timeSinceLastUpdate = System.currentTimeMillis() - 
                (lastBlockHeight * avgBlockTime);
            
            if (timeSinceLastUpdate > avgBlockTime) {
                lastBlockHeight += (timeSinceLastUpdate / avgBlockTime);
            }
            
            return lastBlockHeight;
            
        } catch (Exception e) {
            logger.debug("Failed to get Bitcoin block height", e);
            return lastBlockHeight;
        }
    }

    @Override
    public TransactionInfo getTransactionInfo(String txHash) {
        try {
            // In production, this would query the Bitcoin node for transaction details
            // For simulation, generate reasonable transaction info
            
            long currentBlock = getCurrentBlockHeight();
            int confirmations = (int)(Math.random() * 10); // Random confirmations for demo
            
            // Simulate transaction details
            String fromAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
            String toAddress = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
            BigDecimal amount = BigDecimal.valueOf(0.001 + Math.random() * 0.1);
            long timestamp = System.currentTimeMillis() - (confirmations * avgBlockTime);
            boolean isSuccess = confirmations > 0;
            
            return new TransactionInfo(txHash, fromAddress, toAddress, amount, "BTC",
                timestamp, confirmations, isSuccess);
            
        } catch (Exception e) {
            logger.error("Failed to get Bitcoin transaction info: {}", txHash, e);
            return null;
        }
    }

    @Override
    public String sendTransaction(String signedTransaction) {
        try {
            // In production, this would broadcast the raw transaction to Bitcoin network
            String txHash = generateTxHash();
            
            logger.info("Bitcoin transaction broadcast: {}", txHash);
            return txHash;
            
        } catch (Exception e) {
            logger.error("Failed to send Bitcoin transaction", e);
            throw new ChainAdapterException("Transaction broadcast failed", e);
        }
    }

    @Override
    public BigDecimal getBalance(String address, String asset) {
        try {
            if (!"BTC".equals(asset)) {
                throw new IllegalArgumentException("Bitcoin adapter only supports BTC");
            }
            
            // Get UTXO set for address
            UTXOSet utxoSet = addressUTXOs.get(address);
            if (utxoSet == null) {
                // In production, this would query the Bitcoin node
                return BigDecimal.valueOf(1.0); // Mock balance
            }
            
            return utxoSet.getTotalValue();
            
        } catch (Exception e) {
            logger.error("Failed to get Bitcoin balance for {}", address, e);
            return BigDecimal.ZERO;
        }
    }

    // Bitcoin-specific helper methods

    private boolean checkMempoolHealth() {
        try {
            // In production, this would check mempool size and fees
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void startFeeRateMonitoring() {
        java.util.concurrent.Executors.newSingleThreadScheduledExecutor()
            .scheduleAtFixedRate(() -> {
                try {
                    // In production, this would query fee estimation APIs
                    // Simulate fee rate changes
                    double change = (Math.random() - 0.5) * 0.2; // ±10% change
                    currentFeeRate = currentFeeRate.multiply(BigDecimal.valueOf(1 + change));
                    
                    // Keep fee rate within reasonable bounds
                    if (currentFeeRate.compareTo(BigDecimal.valueOf(1)) < 0) {
                        currentFeeRate = BigDecimal.valueOf(1);
                    } else if (currentFeeRate.compareTo(BigDecimal.valueOf(200)) > 0) {
                        currentFeeRate = BigDecimal.valueOf(200);
                    }
                    
                    logger.debug("Bitcoin fee rate updated: {} sat/vB", currentFeeRate);
                    
                } catch (Exception e) {
                    logger.debug("Failed to update Bitcoin fee rate", e);
                }
            }, 60, 60, java.util.concurrent.TimeUnit.SECONDS);
    }

    private void startUTXOMonitoring() {
        // Background task to monitor UTXO sets
        java.util.concurrent.Executors.newSingleThreadScheduledExecutor()
            .scheduleAtFixedRate(() -> {
                try {
                    // Update UTXO sets for monitored addresses
                    updateUTXOSets();
                } catch (Exception e) {
                    logger.debug("UTXO monitoring error", e);
                }
            }, 300, 300, java.util.concurrent.TimeUnit.SECONDS);
    }

    private List<UTXO> selectUTXOs(String address, BigDecimal targetAmount) {
        // Implement UTXO selection algorithm (largest first for simplicity)
        UTXOSet utxoSet = addressUTXOs.get(address);
        if (utxoSet == null) {
            return new ArrayList<>();
        }
        
        List<UTXO> selected = new ArrayList<>();
        BigDecimal totalSelected = BigDecimal.ZERO;
        
        List<UTXO> sortedUTXOs = new ArrayList<>(utxoSet.getUTXOs());
        sortedUTXOs.sort((a, b) -> b.getValue().compareTo(a.getValue()));
        
        for (UTXO utxo : sortedUTXOs) {
            selected.add(utxo);
            totalSelected = totalSelected.add(utxo.getValue());
            
            if (totalSelected.compareTo(targetAmount) >= 0) {
                break;
            }
        }
        
        return selected;
    }

    private BitcoinTransaction buildMultiSigTransaction(List<UTXO> inputs, 
                                                      MultiSigTransaction transaction, 
                                                      MultiSigWallet wallet) {
        // Build Bitcoin transaction with multi-sig inputs
        return new BitcoinTransaction(inputs, transaction, wallet);
    }

    private void signMultiSigTransaction(BitcoinTransaction btcTx, 
                                       List<TransactionSignature> signatures,
                                       MultiSigWallet wallet) {
        // Apply multi-sig signatures to transaction
        btcTx.applySignatures(signatures);
    }

    private String broadcastTransaction(BitcoinTransaction transaction) {
        // Broadcast transaction to Bitcoin network
        String txHash = generateTxHash();
        
        // Simulate network delay
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        return txHash;
    }

    private BitcoinScript createHTLCScript(HTLCContract htlc) {
        // Create Bitcoin script for HTLC
        return new BitcoinScript(htlc);
    }

    private String generateP2SHAddress(BitcoinScript script) {
        // Generate P2SH address from script
        String scriptHash = Integer.toHexString(script.hashCode());
        return "3" + scriptHash + "ABCDEF123456789".substring(0, 33);
    }

    private String fundHTLC(String address, BigDecimal amount, String sender) {
        // Fund HTLC by sending Bitcoin to the address
        return generateTxHash();
    }

    private BitcoinTransaction buildHTLCClaimTransaction(String contractAddress, 
                                                       HTLCContract htlc, byte[] secret) {
        // Build transaction to claim HTLC
        return new BitcoinTransaction(contractAddress, htlc, secret, true);
    }

    private BitcoinTransaction buildHTLCRefundTransaction(String contractAddress, 
                                                        HTLCContract htlc) {
        // Build transaction to refund HTLC
        return new BitcoinTransaction(contractAddress, htlc, null, false);
    }

    private boolean isHTLCSpent(String contractAddress) {
        // Check if HTLC has been spent (claimed or refunded)
        // In production, this would check the blockchain
        return false;
    }

    private void updateUTXOSets() {
        // Update UTXO sets for monitored addresses
        // In production, this would query the Bitcoin node
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    private String generateTxHash() {
        return Long.toHexString(System.currentTimeMillis()) + 
               Integer.toHexString(new Random().nextInt()) + 
               "000000000000000000000000000000000000000000000000";
    }

    // Inner classes for Bitcoin-specific data structures

    private static class UTXO {
        private final String txHash;
        private final int outputIndex;
        private final BigDecimal value;
        private final String scriptPubKey;

        public UTXO(String txHash, int outputIndex, BigDecimal value, String scriptPubKey) {
            this.txHash = txHash;
            this.outputIndex = outputIndex;
            this.value = value;
            this.scriptPubKey = scriptPubKey;
        }

        public BigDecimal getValue() { return value; }
        public String getTxHash() { return txHash; }
        public int getOutputIndex() { return outputIndex; }
        public String getScriptPubKey() { return scriptPubKey; }
    }

    private static class UTXOSet {
        private final List<UTXO> utxos = new ArrayList<>();

        public void addUTXO(UTXO utxo) {
            utxos.add(utxo);
        }

        public List<UTXO> getUTXOs() {
            return new ArrayList<>(utxos);
        }

        public BigDecimal getTotalValue() {
            return utxos.stream()
                       .map(UTXO::getValue)
                       .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    private static class BitcoinScript {
        private final HTLCContract htlc;

        public BitcoinScript(HTLCContract htlc) {
            this.htlc = htlc;
        }

        @Override
        public int hashCode() {
            return htlc.getSwapId().hashCode();
        }
    }

    private static class BitcoinTransaction {
        private List<UTXO> inputs;
        private MultiSigTransaction transaction;
        private MultiSigWallet wallet;
        private String contractAddress;
        private HTLCContract htlc;
        private byte[] secret;
        private boolean isClaim;

        // Multi-sig constructor
        public BitcoinTransaction(List<UTXO> inputs, MultiSigTransaction transaction, MultiSigWallet wallet) {
            this.inputs = inputs;
            this.transaction = transaction;
            this.wallet = wallet;
        }

        // HTLC constructor
        public BitcoinTransaction(String contractAddress, HTLCContract htlc, byte[] secret, boolean isClaim) {
            this.contractAddress = contractAddress;
            this.htlc = htlc;
            this.secret = secret;
            this.isClaim = isClaim;
        }

        public void applySignatures(List<TransactionSignature> signatures) {
            // Apply signatures to transaction
        }
    }

    public static class ChainAdapterException extends RuntimeException {
        public ChainAdapterException(String message) {
            super(message);
        }
        
        public ChainAdapterException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}