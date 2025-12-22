package io.aurigraph.v11.token.erc3643;

import io.aurigraph.v11.token.erc3643.compliance.ComplianceRulesEngine;
import io.aurigraph.v11.token.erc3643.compliance.ComplianceResult;
import io.aurigraph.v11.token.erc3643.identity.IdentityRegistry;
import io.quarkus.logging.Log;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * ERC-3643 T-REX Security Token Implementation.
 *
 * Implements the Token for Regulated EXchanges (T-REX) standard for compliant
 * security tokens.
 * Features:
 * - Identity-verified transfers only
 * - Compliance rules enforcement
 * - Forced transfers for recovery
 * - Pausable/freezable per-wallet
 * - Token recovery mechanism
 * - Batch operations support
 * - Event emission for all operations
 *
 * @see <a href="https://eips.ethereum.org/EIPS/eip-3643">EIP-3643</a>
 */
@ApplicationScoped
public class ERC3643Token {

    // Token metadata
    private volatile String name = "Aurigraph Security Token";
    private volatile String symbol = "ASEC";
    private volatile int decimals = 18;
    private volatile BigInteger totalSupply = BigInteger.ZERO;

    // State management
    private volatile boolean paused = false;
    private volatile String owner;
    private final Set<String> agents = ConcurrentHashMap.newKeySet();

    // Balances and allowances
    private final Map<String, BigInteger> balances = new ConcurrentHashMap<>();
    private final Map<String, Map<String, BigInteger>> allowances = new ConcurrentHashMap<>();

    // Frozen wallets
    private final Set<String> frozenWallets = ConcurrentHashMap.newKeySet();
    private final Map<String, BigInteger> frozenTokens = new ConcurrentHashMap<>();

    // Event listeners
    private final List<TokenEventListener> eventListeners = new CopyOnWriteArrayList<>();

    @Inject
    IdentityRegistry identityRegistry;

    @Inject
    ComplianceRulesEngine complianceEngine;

    // ==================== Records ====================

    /**
     * Transfer event record
     */
    public record TransferEvent(
            String transactionId,
            String from,
            String to,
            BigInteger amount,
            Instant timestamp,
            TransferType type) {
    }

    /**
     * Approval event record
     */
    public record ApprovalEvent(
            String owner,
            String spender,
            BigInteger amount,
            Instant timestamp) {
    }

    /**
     * Compliance event record
     */
    public record ComplianceEvent(
            String transactionId,
            String wallet,
            ComplianceAction action,
            String reason,
            Instant timestamp) {
    }

    /**
     * Batch transfer result record
     */
    public record BatchTransferResult(
            int successful,
            int failed,
            List<TransferResult> results) {
    }

    /**
     * Individual transfer result record
     */
    public record TransferResult(
            String to,
            BigInteger amount,
            boolean success,
            String errorMessage) {
    }

    /**
     * Token info record
     */
    public record TokenInfo(
            String name,
            String symbol,
            int decimals,
            BigInteger totalSupply,
            boolean paused,
            String owner,
            int agentCount) {
    }

    /**
     * Wallet status record
     */
    public record WalletStatus(
            String wallet,
            BigInteger balance,
            BigInteger frozenBalance,
            boolean isFrozen,
            boolean isVerified,
            Optional<String> countryCode) {
    }

    // ==================== Enums ====================

    public enum TransferType {
        STANDARD,
        FORCED,
        RECOVERY,
        MINT,
        BURN
    }

    public enum ComplianceAction {
        WALLET_FROZEN,
        WALLET_UNFROZEN,
        TOKENS_FROZEN,
        TOKENS_UNFROZEN,
        TRANSFER_BLOCKED,
        IDENTITY_VERIFIED,
        IDENTITY_REVOKED
    }

    // ==================== Event Listener Interface ====================

    public interface TokenEventListener {
        void onTransfer(TransferEvent event);

        void onApproval(ApprovalEvent event);

        void onCompliance(ComplianceEvent event);
    }

    // ==================== Initialization ====================

    /**
     * Initialize the token with metadata and owner
     */
    public Uni<Void> initialize(String tokenName, String tokenSymbol, int tokenDecimals, String tokenOwner) {
        return Uni.createFrom().item(() -> {
            this.name = tokenName;
            this.symbol = tokenSymbol;
            this.decimals = tokenDecimals;
            this.owner = tokenOwner;
            this.agents.add(tokenOwner);
            Log.infof("ERC3643Token initialized: name=%s, symbol=%s, decimals=%d, owner=%s",
                    tokenName, tokenSymbol, tokenDecimals, tokenOwner);
            return null;
        });
    }

    // ==================== ERC-20 Standard Functions ====================

    /**
     * Get token name
     */
    public String name() {
        return name;
    }

    /**
     * Get token symbol
     */
    public String symbol() {
        return symbol;
    }

    /**
     * Get token decimals
     */
    public int decimals() {
        return decimals;
    }

    /**
     * Get total supply
     */
    public BigInteger totalSupply() {
        return totalSupply;
    }

    /**
     * Get balance of a wallet
     */
    public Uni<BigInteger> balanceOf(String wallet) {
        return Uni.createFrom().item(() -> {
            BigInteger balance = balances.getOrDefault(wallet.toLowerCase(), BigInteger.ZERO);
            Log.debugf("Balance query: wallet=%s, balance=%s", wallet, balance);
            return balance;
        });
    }

    /**
     * Get allowance for a spender
     */
    public Uni<BigInteger> allowance(String owner, String spender) {
        return Uni.createFrom().item(() -> {
            Map<String, BigInteger> ownerAllowances = allowances.getOrDefault(owner.toLowerCase(), Map.of());
            return ownerAllowances.getOrDefault(spender.toLowerCase(), BigInteger.ZERO);
        });
    }

    /**
     * Approve a spender
     */
    public Uni<Boolean> approve(String owner, String spender, BigInteger amount) {
        return Uni.createFrom().item(() -> {
            String ownerLower = owner.toLowerCase();
            String spenderLower = spender.toLowerCase();

            allowances.computeIfAbsent(ownerLower, k -> new ConcurrentHashMap<>())
                    .put(spenderLower, amount);

            ApprovalEvent event = new ApprovalEvent(ownerLower, spenderLower, amount, Instant.now());
            emitApprovalEvent(event);

            Log.infof("Approval: owner=%s, spender=%s, amount=%s", ownerLower, spenderLower, amount);
            return true;
        });
    }

    /**
     * Transfer tokens with full compliance checks
     */
    public Uni<Boolean> transfer(String from, String to, BigInteger amount) {
        return verifyAndTransfer(from, to, amount, TransferType.STANDARD);
    }

    /**
     * Transfer tokens from an approved spender
     */
    public Uni<Boolean> transferFrom(String spender, String from, String to, BigInteger amount) {
        return allowance(from, spender)
                .flatMap(allowed -> {
                    if (allowed.compareTo(amount) < 0) {
                        Log.warnf(
                                "TransferFrom failed: insufficient allowance. spender=%s, from=%s, allowed=%s, requested=%s",
                                spender, from, allowed, amount);
                        return Uni.createFrom().item(false);
                    }

                    // Decrease allowance
                    allowances.get(from.toLowerCase()).put(spender.toLowerCase(), allowed.subtract(amount));

                    return verifyAndTransfer(from, to, amount, TransferType.STANDARD);
                });
    }

    // ==================== ERC-3643 Specific Functions ====================

    /**
     * Forced transfer for regulatory compliance or recovery
     * Only callable by agents
     */
    public Uni<Boolean> forcedTransfer(String agent, String from, String to, BigInteger amount) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Forced transfer rejected: caller is not an agent. caller=%s", agent);
                return false;
            }
            return true;
        }).flatMap(isAuthorized -> {
            if (!isAuthorized)
                return Uni.createFrom().item(false);
            return verifyAndTransfer(from, to, amount, TransferType.FORCED);
        });
    }

    /**
     * Recover tokens from a lost wallet
     * Only callable by agents
     */
    public Uni<Boolean> recoveryTransfer(String agent, String lostWallet, String newWallet, String investorId) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Recovery transfer rejected: caller is not an agent. caller=%s", agent);
                return false;
            }
            return true;
        }).flatMap(isAuthorized -> {
            if (!isAuthorized)
                return Uni.createFrom().item(false);

            String lostWalletLower = lostWallet.toLowerCase();
            BigInteger balance = balances.getOrDefault(lostWalletLower, BigInteger.ZERO);

            if (balance.equals(BigInteger.ZERO)) {
                Log.warnf("Recovery transfer: no tokens to recover from wallet=%s", lostWalletLower);
                return Uni.createFrom().item(false);
            }

            // Verify new wallet is registered to the same investor
            return identityRegistry.getInvestorId(newWallet)
                    .flatMap(newWalletInvestorId -> {
                        if (!investorId.equals(newWalletInvestorId)) {
                            Log.warnf(
                                    "Recovery transfer rejected: new wallet not registered to same investor. expected=%s, found=%s",
                                    investorId, newWalletInvestorId);
                            return Uni.createFrom().item(false);
                        }

                        return executeTransfer(lostWalletLower, newWallet.toLowerCase(), balance,
                                TransferType.RECOVERY);
                    });
        });
    }

    /**
     * Mint new tokens
     * Only callable by agents
     */
    public Uni<Boolean> mint(String agent, String to, BigInteger amount) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Mint rejected: caller is not an agent. caller=%s", agent);
                return false;
            }
            return true;
        }).flatMap(isAuthorized -> {
            if (!isAuthorized)
                return Uni.createFrom().item(false);

            // Verify recipient identity
            return identityRegistry.isVerified(to)
                    .flatMap(isVerified -> {
                        if (!isVerified) {
                            Log.warnf("Mint rejected: recipient identity not verified. to=%s", to);
                            return Uni.createFrom().item(false);
                        }

                        String toLower = to.toLowerCase();
                        balances.merge(toLower, amount, BigInteger::add);
                        totalSupply = totalSupply.add(amount);

                        TransferEvent event = new TransferEvent(
                                generateTransactionId(),
                                "0x0000000000000000000000000000000000000000",
                                toLower,
                                amount,
                                Instant.now(),
                                TransferType.MINT);
                        emitTransferEvent(event);

                        Log.infof("Tokens minted: to=%s, amount=%s, newTotalSupply=%s", toLower, amount, totalSupply);
                        return Uni.createFrom().item(true);
                    });
        });
    }

    /**
     * Burn tokens
     * Only callable by agents or token holders
     */
    public Uni<Boolean> burn(String caller, String from, BigInteger amount) {
        return Uni.createFrom().item(() -> {
            String callerLower = caller.toLowerCase();
            String fromLower = from.toLowerCase();

            // Caller must be agent or the token holder
            if (!isAgent(callerLower) && !callerLower.equals(fromLower)) {
                Log.warnf("Burn rejected: unauthorized caller. caller=%s, from=%s", callerLower, fromLower);
                return false;
            }

            BigInteger balance = balances.getOrDefault(fromLower, BigInteger.ZERO);
            if (balance.compareTo(amount) < 0) {
                Log.warnf("Burn rejected: insufficient balance. from=%s, balance=%s, requested=%s",
                        fromLower, balance, amount);
                return false;
            }

            balances.put(fromLower, balance.subtract(amount));
            totalSupply = totalSupply.subtract(amount);

            TransferEvent event = new TransferEvent(
                    generateTransactionId(),
                    fromLower,
                    "0x0000000000000000000000000000000000000000",
                    amount,
                    Instant.now(),
                    TransferType.BURN);
            emitTransferEvent(event);

            Log.infof("Tokens burned: from=%s, amount=%s, newTotalSupply=%s", fromLower, amount, totalSupply);
            return true;
        });
    }

    /**
     * Batch transfer to multiple recipients
     */
    public Uni<BatchTransferResult> batchTransfer(String from, List<String> toAddresses, List<BigInteger> amounts) {
        return Uni.createFrom().item(() -> {
            if (toAddresses.size() != amounts.size()) {
                Log.warnf("Batch transfer rejected: mismatched array lengths. addresses=%d, amounts=%d",
                        toAddresses.size(), amounts.size());
                return new BatchTransferResult(0, toAddresses.size(), List.of());
            }
            return null;
        }).flatMap(error -> {
            if (error != null)
                return Uni.createFrom().item(error);

            return Multi.createFrom().iterable(
                    java.util.stream.IntStream.range(0, toAddresses.size())
                            .mapToObj(i -> Map.entry(toAddresses.get(i), amounts.get(i)))
                            .toList())
                    .onItem().transformToUniAndMerge(entry -> transfer(from, entry.getKey(), entry.getValue())
                            .map(success -> new TransferResult(
                                    entry.getKey(),
                                    entry.getValue(),
                                    success,
                                    success ? null : "Transfer failed compliance check")))
                    .collect().asList()
                    .map(results -> {
                        int successful = (int) results.stream().filter(TransferResult::success).count();
                        int failed = results.size() - successful;
                        Log.infof("Batch transfer completed: from=%s, successful=%d, failed=%d", from, successful,
                                failed);
                        return new BatchTransferResult(successful, failed, results);
                    });
        });
    }

    // ==================== Freeze/Pause Functions ====================

    /**
     * Pause all token transfers
     */
    public Uni<Boolean> pause(String agent) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Pause rejected: caller is not an agent. caller=%s", agent);
                return false;
            }
            paused = true;
            Log.infof("Token paused by agent=%s", agent);
            return true;
        });
    }

    /**
     * Unpause token transfers
     */
    public Uni<Boolean> unpause(String agent) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Unpause rejected: caller is not an agent. caller=%s", agent);
                return false;
            }
            paused = false;
            Log.infof("Token unpaused by agent=%s", agent);
            return true;
        });
    }

    /**
     * Check if token is paused
     */
    public boolean isPaused() {
        return paused;
    }

    /**
     * Freeze a wallet (block all transfers from/to)
     */
    public Uni<Boolean> freezeWallet(String agent, String wallet, String reason) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Freeze wallet rejected: caller is not an agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            frozenWallets.add(walletLower);

            ComplianceEvent event = new ComplianceEvent(
                    generateTransactionId(),
                    walletLower,
                    ComplianceAction.WALLET_FROZEN,
                    reason,
                    Instant.now());
            emitComplianceEvent(event);

            Log.infof("Wallet frozen: wallet=%s, reason=%s, agent=%s", walletLower, reason, agent);
            return true;
        });
    }

    /**
     * Unfreeze a wallet
     */
    public Uni<Boolean> unfreezeWallet(String agent, String wallet) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Unfreeze wallet rejected: caller is not an agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            frozenWallets.remove(walletLower);

            ComplianceEvent event = new ComplianceEvent(
                    generateTransactionId(),
                    walletLower,
                    ComplianceAction.WALLET_UNFROZEN,
                    "Wallet unfrozen by agent",
                    Instant.now());
            emitComplianceEvent(event);

            Log.infof("Wallet unfrozen: wallet=%s, agent=%s", walletLower, agent);
            return true;
        });
    }

    /**
     * Check if a wallet is frozen
     */
    public boolean isWalletFrozen(String wallet) {
        return frozenWallets.contains(wallet.toLowerCase());
    }

    /**
     * Freeze specific token amount in a wallet
     */
    public Uni<Boolean> freezeTokens(String agent, String wallet, BigInteger amount, String reason) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Freeze tokens rejected: caller is not an agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            BigInteger balance = balances.getOrDefault(walletLower, BigInteger.ZERO);
            BigInteger currentFrozen = frozenTokens.getOrDefault(walletLower, BigInteger.ZERO);
            BigInteger availableToFreeze = balance.subtract(currentFrozen);

            if (amount.compareTo(availableToFreeze) > 0) {
                Log.warnf(
                        "Freeze tokens rejected: insufficient available balance. wallet=%s, available=%s, requested=%s",
                        walletLower, availableToFreeze, amount);
                return false;
            }

            frozenTokens.put(walletLower, currentFrozen.add(amount));

            ComplianceEvent event = new ComplianceEvent(
                    generateTransactionId(),
                    walletLower,
                    ComplianceAction.TOKENS_FROZEN,
                    String.format("Amount: %s, Reason: %s", amount, reason),
                    Instant.now());
            emitComplianceEvent(event);

            Log.infof("Tokens frozen: wallet=%s, amount=%s, reason=%s, agent=%s", walletLower, amount, reason, agent);
            return true;
        });
    }

    /**
     * Unfreeze specific token amount in a wallet
     */
    public Uni<Boolean> unfreezeTokens(String agent, String wallet, BigInteger amount) {
        return Uni.createFrom().item(() -> {
            if (!isAgent(agent)) {
                Log.warnf("Unfreeze tokens rejected: caller is not an agent. caller=%s", agent);
                return false;
            }

            String walletLower = wallet.toLowerCase();
            BigInteger currentFrozen = frozenTokens.getOrDefault(walletLower, BigInteger.ZERO);

            if (amount.compareTo(currentFrozen) > 0) {
                Log.warnf("Unfreeze tokens rejected: amount exceeds frozen balance. wallet=%s, frozen=%s, requested=%s",
                        walletLower, currentFrozen, amount);
                return false;
            }

            BigInteger newFrozen = currentFrozen.subtract(amount);
            if (newFrozen.equals(BigInteger.ZERO)) {
                frozenTokens.remove(walletLower);
            } else {
                frozenTokens.put(walletLower, newFrozen);
            }

            ComplianceEvent event = new ComplianceEvent(
                    generateTransactionId(),
                    walletLower,
                    ComplianceAction.TOKENS_UNFROZEN,
                    String.format("Amount: %s", amount),
                    Instant.now());
            emitComplianceEvent(event);

            Log.infof("Tokens unfrozen: wallet=%s, amount=%s, agent=%s", walletLower, amount, agent);
            return true;
        });
    }

    /**
     * Get frozen token amount for a wallet
     */
    public BigInteger getFrozenTokens(String wallet) {
        return frozenTokens.getOrDefault(wallet.toLowerCase(), BigInteger.ZERO);
    }

    /**
     * Get available (unfrozen) balance for a wallet
     */
    public Uni<BigInteger> availableBalance(String wallet) {
        return balanceOf(wallet).map(balance -> {
            BigInteger frozen = getFrozenTokens(wallet);
            return balance.subtract(frozen);
        });
    }

    // ==================== Agent Management ====================

    /**
     * Add an agent
     */
    public Uni<Boolean> addAgent(String caller, String agent) {
        return Uni.createFrom().item(() -> {
            if (!caller.equalsIgnoreCase(owner)) {
                Log.warnf("Add agent rejected: caller is not owner. caller=%s, owner=%s", caller, owner);
                return false;
            }
            agents.add(agent.toLowerCase());
            Log.infof("Agent added: agent=%s, by=%s", agent, caller);
            return true;
        });
    }

    /**
     * Remove an agent
     */
    public Uni<Boolean> removeAgent(String caller, String agent) {
        return Uni.createFrom().item(() -> {
            if (!caller.equalsIgnoreCase(owner)) {
                Log.warnf("Remove agent rejected: caller is not owner. caller=%s, owner=%s", caller, owner);
                return false;
            }
            String agentLower = agent.toLowerCase();
            if (agentLower.equals(owner.toLowerCase())) {
                Log.warnf("Remove agent rejected: cannot remove owner as agent. agent=%s", agent);
                return false;
            }
            agents.remove(agentLower);
            Log.infof("Agent removed: agent=%s, by=%s", agent, caller);
            return true;
        });
    }

    /**
     * Check if an address is an agent
     */
    public boolean isAgent(String address) {
        return agents.contains(address.toLowerCase());
    }

    /**
     * Get all agents
     */
    public Set<String> getAgents() {
        return Set.copyOf(agents);
    }

    // ==================== Info Functions ====================

    /**
     * Get token info
     */
    public TokenInfo getTokenInfo() {
        return new TokenInfo(name, symbol, decimals, totalSupply, paused, owner, agents.size());
    }

    /**
     * Get wallet status
     */
    public Uni<WalletStatus> getWalletStatus(String wallet) {
        String walletLower = wallet.toLowerCase();
        return balanceOf(walletLower)
                .flatMap(balance -> identityRegistry.isVerified(walletLower)
                        .flatMap(isVerified -> identityRegistry.getCountryCode(walletLower)
                                .map(countryCode -> new WalletStatus(
                                        walletLower,
                                        balance,
                                        getFrozenTokens(walletLower),
                                        isWalletFrozen(walletLower),
                                        isVerified,
                                        Optional.ofNullable(countryCode)))));
    }

    // ==================== Event Management ====================

    /**
     * Register an event listener
     */
    public void addEventListener(TokenEventListener listener) {
        eventListeners.add(listener);
        Log.debugf("Event listener added: %s", listener.getClass().getSimpleName());
    }

    /**
     * Remove an event listener
     */
    public void removeEventListener(TokenEventListener listener) {
        eventListeners.remove(listener);
        Log.debugf("Event listener removed: %s", listener.getClass().getSimpleName());
    }

    // ==================== Private Helper Methods ====================

    private Uni<Boolean> verifyAndTransfer(String from, String to, BigInteger amount, TransferType type) {
        return Uni.createFrom().item(() -> {
            // Check if paused (forced transfers bypass pause)
            if (paused && type == TransferType.STANDARD) {
                Log.warnf("Transfer rejected: token is paused. from=%s, to=%s", from, to);
                return false;
            }

            String fromLower = from.toLowerCase();
            String toLower = to.toLowerCase();

            // Check wallet frozen status (forced transfers can bypass for sender)
            if (type == TransferType.STANDARD) {
                if (isWalletFrozen(fromLower)) {
                    Log.warnf("Transfer rejected: sender wallet is frozen. from=%s", fromLower);
                    emitComplianceEvent(new ComplianceEvent(
                            generateTransactionId(), fromLower, ComplianceAction.TRANSFER_BLOCKED,
                            "Sender wallet is frozen", Instant.now()));
                    return false;
                }
            }

            if (isWalletFrozen(toLower)) {
                Log.warnf("Transfer rejected: recipient wallet is frozen. to=%s", toLower);
                emitComplianceEvent(new ComplianceEvent(
                        generateTransactionId(), toLower, ComplianceAction.TRANSFER_BLOCKED,
                        "Recipient wallet is frozen", Instant.now()));
                return false;
            }

            // Check available balance (including frozen tokens)
            BigInteger balance = balances.getOrDefault(fromLower, BigInteger.ZERO);
            BigInteger frozen = frozenTokens.getOrDefault(fromLower, BigInteger.ZERO);
            BigInteger available = balance.subtract(frozen);

            if (available.compareTo(amount) < 0) {
                Log.warnf("Transfer rejected: insufficient available balance. from=%s, available=%s, requested=%s",
                        fromLower, available, amount);
                return false;
            }

            return true;
        }).flatMap(basicChecksPass -> {
            if (!basicChecksPass)
                return Uni.createFrom().item(false);

            // Verify identities
            return identityRegistry.isVerified(from)
                    .flatMap(fromVerified -> {
                        if (!fromVerified && type == TransferType.STANDARD) {
                            Log.warnf("Transfer rejected: sender identity not verified. from=%s", from);
                            emitComplianceEvent(new ComplianceEvent(
                                    generateTransactionId(), from.toLowerCase(), ComplianceAction.TRANSFER_BLOCKED,
                                    "Sender identity not verified", Instant.now()));
                            return Uni.createFrom().item(false);
                        }
                        return identityRegistry.isVerified(to);
                    })
                    .flatMap(toVerified -> {
                        if (toVerified instanceof Boolean && !(Boolean) toVerified) {
                            return Uni.createFrom().item(false);
                        }
                        if (toVerified instanceof Boolean && (Boolean) toVerified) {
                            return complianceEngine.evaluateTransfer(from, to, amount, type == TransferType.FORCED);
                        }
                        return complianceEngine.evaluateTransfer(from, to, amount, type == TransferType.FORCED);
                    })
                    .flatMap(result -> {
                        if (result instanceof Boolean)
                            return Uni.createFrom().item((Boolean) result);
                        ComplianceResult complianceResult = (ComplianceResult) result;
                        if (!complianceResult.approved()) {
                            Log.warnf("Transfer rejected by compliance: from=%s, to=%s, reason=%s",
                                    from, to, complianceResult.reason());
                            emitComplianceEvent(new ComplianceEvent(
                                    generateTransactionId(), to.toLowerCase(), ComplianceAction.TRANSFER_BLOCKED,
                                    complianceResult.reason(), Instant.now()));
                            return Uni.createFrom().item(false);
                        }
                        return executeTransfer(from.toLowerCase(), to.toLowerCase(), amount, type);
                    });
        });
    }

    private Uni<Boolean> executeTransfer(String from, String to, BigInteger amount, TransferType type) {
        return Uni.createFrom().item(() -> {
            // Perform atomic transfer
            BigInteger fromBalance = balances.getOrDefault(from, BigInteger.ZERO);
            balances.put(from, fromBalance.subtract(amount));
            balances.merge(to, amount, BigInteger::add);

            // Emit transfer event
            TransferEvent event = new TransferEvent(
                    generateTransactionId(),
                    from,
                    to,
                    amount,
                    Instant.now(),
                    type);
            emitTransferEvent(event);

            Log.infof("Transfer executed: from=%s, to=%s, amount=%s, type=%s",
                    from, to, amount, type);
            return true;
        });
    }

    private void emitTransferEvent(TransferEvent event) {
        for (TokenEventListener listener : eventListeners) {
            try {
                listener.onTransfer(event);
            } catch (Exception e) {
                Log.errorf(e, "Error notifying transfer event listener: %s", listener.getClass().getSimpleName());
            }
        }
    }

    private void emitApprovalEvent(ApprovalEvent event) {
        for (TokenEventListener listener : eventListeners) {
            try {
                listener.onApproval(event);
            } catch (Exception e) {
                Log.errorf(e, "Error notifying approval event listener: %s", listener.getClass().getSimpleName());
            }
        }
    }

    private void emitComplianceEvent(ComplianceEvent event) {
        for (TokenEventListener listener : eventListeners) {
            try {
                listener.onCompliance(event);
            } catch (Exception e) {
                Log.errorf(e, "Error notifying compliance event listener: %s", listener.getClass().getSimpleName());
            }
        }
    }

    private String generateTransactionId() {
        return "tx-" + UUID.randomUUID().toString().substring(0, 8);
    }
}
