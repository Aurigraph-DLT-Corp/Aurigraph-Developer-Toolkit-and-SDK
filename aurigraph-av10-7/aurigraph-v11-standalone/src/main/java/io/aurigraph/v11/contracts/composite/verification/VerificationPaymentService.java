package io.aurigraph.v11.contracts.composite.verification;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Verification Payment Service - Handles payment processing for verification services
 *
 * Manages the complete payment lifecycle including:
 * - Quote generation based on rate cards
 * - Escrow management for secure payments
 * - Milestone-based payment releases
 * - Fee distribution to verifiers
 * - Platform commission handling
 * - Refund processing
 * - Payment reconciliation
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Third-Party Verification)
 */
@ApplicationScoped
public class VerificationPaymentService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VerificationPaymentService.class);

    // Platform commission rates
    private static final BigDecimal PLATFORM_COMMISSION_RATE = BigDecimal.valueOf(0.05); // 5%
    private static final BigDecimal ESCROW_FEE_RATE = BigDecimal.valueOf(0.01);          // 1%

    // Storage
    private final Map<String, PaymentOrder> paymentOrders = new ConcurrentHashMap<>();
    private final Map<String, EscrowAccount> escrowAccounts = new ConcurrentHashMap<>();
    private final Map<String, Invoice> invoices = new ConcurrentHashMap<>();
    private final Map<String, PaymentTransaction> transactions = new ConcurrentHashMap<>();
    private final Map<String, VerifierPayoutAccount> verifierAccounts = new ConcurrentHashMap<>();

    // ==================== QUOTE GENERATION ====================

    /**
     * Generate a quote for verification services
     */
    public Uni<VerificationQuote> generateQuote(QuoteRequest request) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Generating quote for task: {}", request.taskId);

            VerificationQuote quote = new VerificationQuote(request.taskId, request.compositeId);
            quote.setClientId(request.clientId);
            quote.setCurrency(request.currency != null ? request.currency : "USD");

            // Calculate service fees
            BigDecimal serviceFees = calculateServiceFees(request);
            quote.setServiceFees(serviceFees);

            // Calculate platform commission
            BigDecimal platformCommission = serviceFees.multiply(PLATFORM_COMMISSION_RATE)
                .setScale(2, RoundingMode.HALF_UP);
            quote.setPlatformCommission(platformCommission);

            // Calculate escrow fee if applicable
            if (request.useEscrow) {
                BigDecimal escrowFee = serviceFees.multiply(ESCROW_FEE_RATE)
                    .setScale(2, RoundingMode.HALF_UP);
                quote.setEscrowFee(escrowFee);
            }

            // Apply express multiplier
            if (request.isExpress) {
                BigDecimal expressFee = serviceFees.multiply(BigDecimal.valueOf(0.5))
                    .setScale(2, RoundingMode.HALF_UP);
                quote.setExpressFee(expressFee);
            }

            // Apply any discounts
            BigDecimal discount = calculateDiscount(request);
            quote.setDiscount(discount);

            // Calculate tax if applicable
            BigDecimal tax = calculateTax(request, serviceFees);
            quote.setTax(tax);

            // Calculate total
            quote.calculateTotal();

            // Set validity
            quote.setValidUntil(Instant.now().plus(Duration.ofDays(7)));

            // Create line items
            for (ServiceLineItem item : request.services) {
                quote.addLineItem(new QuoteLineItem(
                    item.serviceType,
                    item.description,
                    item.quantity,
                    item.unitPrice
                ));
            }

            LOGGER.info("Quote generated: {} - Total: {} {}", quote.getQuoteId(),
                quote.getTotalAmount(), quote.getCurrency());

            return quote;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    private BigDecimal calculateServiceFees(QuoteRequest request) {
        return request.services.stream()
            .map(item -> item.unitPrice.multiply(BigDecimal.valueOf(item.quantity)))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateDiscount(QuoteRequest request) {
        BigDecimal discount = BigDecimal.ZERO;

        // Volume discount
        if (request.services.size() >= 3) {
            discount = discount.add(BigDecimal.valueOf(0.05)); // 5% for 3+ services
        }

        // Loyalty discount
        if (request.loyaltyTier != null && request.loyaltyTier.equals("GOLD")) {
            discount = discount.add(BigDecimal.valueOf(0.10)); // 10% for gold tier
        }

        return calculateServiceFees(request).multiply(discount).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTax(QuoteRequest request, BigDecimal baseAmount) {
        if (request.taxExempt) {
            return BigDecimal.ZERO;
        }
        // Default tax rate - should be configurable based on jurisdiction
        BigDecimal taxRate = BigDecimal.valueOf(0.08); // 8%
        return baseAmount.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
    }

    // ==================== PAYMENT ORDER ====================

    /**
     * Create a payment order from an accepted quote
     */
    public Uni<PaymentOrder> createPaymentOrder(String quoteId, PaymentOrderRequest request) {
        return Uni.createFrom().item(() -> {
            PaymentOrder order = new PaymentOrder(quoteId, request.clientId);
            order.setTaskId(request.taskId);
            order.setAmount(request.amount);
            order.setCurrency(request.currency);
            order.setPaymentTerms(request.paymentTerms);

            // Set up milestone payments if requested
            if (request.milestonePayments != null && !request.milestonePayments.isEmpty()) {
                order.setMilestonePayments(request.milestonePayments);
                order.setPaymentType(PaymentOrder.PaymentType.MILESTONE_BASED);
            } else if (request.useEscrow) {
                order.setPaymentType(PaymentOrder.PaymentType.ESCROW);
            } else {
                order.setPaymentType(PaymentOrder.PaymentType.DIRECT);
            }

            paymentOrders.put(order.getOrderId(), order);
            LOGGER.info("Payment order created: {} for amount {} {}",
                order.getOrderId(), order.getAmount(), order.getCurrency());

            return order;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== ESCROW MANAGEMENT ====================

    /**
     * Create an escrow account for a payment
     */
    public Uni<EscrowAccount> createEscrowAccount(String orderId, String clientId, BigDecimal amount) {
        return Uni.createFrom().item(() -> {
            EscrowAccount escrow = new EscrowAccount(orderId, clientId);
            escrow.setTotalAmount(amount);
            escrow.setHeldAmount(BigDecimal.ZERO);
            escrow.setReleasedAmount(BigDecimal.ZERO);

            escrowAccounts.put(escrow.getEscrowId(), escrow);
            LOGGER.info("Escrow account created: {} for order {}", escrow.getEscrowId(), orderId);

            return escrow;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Fund an escrow account
     */
    public Uni<EscrowTransaction> fundEscrow(String escrowId, BigDecimal amount, String transactionRef) {
        return Uni.createFrom().item(() -> {
            EscrowAccount escrow = escrowAccounts.get(escrowId);
            if (escrow == null) {
                throw new IllegalArgumentException("Escrow account not found: " + escrowId);
            }

            EscrowTransaction transaction = new EscrowTransaction(
                escrowId,
                EscrowTransaction.TransactionType.DEPOSIT,
                amount
            );
            transaction.setExternalReference(transactionRef);
            transaction.complete();

            escrow.setHeldAmount(escrow.getHeldAmount().add(amount));
            escrow.setStatus(EscrowAccount.EscrowStatus.FUNDED);
            escrow.getTransactions().add(transaction);

            LOGGER.info("Escrow funded: {} with amount {}", escrowId, amount);

            return transaction;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Release funds from escrow to verifier
     */
    public Uni<EscrowTransaction> releaseFromEscrow(String escrowId, String verifierId,
                                                    BigDecimal amount, String reason) {
        return Uni.createFrom().item(() -> {
            EscrowAccount escrow = escrowAccounts.get(escrowId);
            if (escrow == null) {
                throw new IllegalArgumentException("Escrow account not found: " + escrowId);
            }

            if (escrow.getHeldAmount().compareTo(amount) < 0) {
                throw new IllegalStateException("Insufficient escrow balance");
            }

            EscrowTransaction transaction = new EscrowTransaction(
                escrowId,
                EscrowTransaction.TransactionType.RELEASE,
                amount
            );
            transaction.setBeneficiaryId(verifierId);
            transaction.setReason(reason);
            transaction.complete();

            escrow.setHeldAmount(escrow.getHeldAmount().subtract(amount));
            escrow.setReleasedAmount(escrow.getReleasedAmount().add(amount));
            escrow.getTransactions().add(transaction);

            // Update escrow status
            if (escrow.getHeldAmount().compareTo(BigDecimal.ZERO) == 0) {
                escrow.setStatus(EscrowAccount.EscrowStatus.RELEASED);
            } else {
                escrow.setStatus(EscrowAccount.EscrowStatus.PARTIALLY_RELEASED);
            }

            // Credit verifier account
            creditVerifierAccount(verifierId, amount, transaction.getTransactionId());

            LOGGER.info("Released {} from escrow {} to verifier {}", amount, escrowId, verifierId);

            return transaction;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Refund from escrow back to client
     */
    public Uni<EscrowTransaction> refundFromEscrow(String escrowId, BigDecimal amount, String reason) {
        return Uni.createFrom().item(() -> {
            EscrowAccount escrow = escrowAccounts.get(escrowId);
            if (escrow == null) {
                throw new IllegalArgumentException("Escrow account not found: " + escrowId);
            }

            if (escrow.getHeldAmount().compareTo(amount) < 0) {
                throw new IllegalStateException("Insufficient escrow balance for refund");
            }

            EscrowTransaction transaction = new EscrowTransaction(
                escrowId,
                EscrowTransaction.TransactionType.REFUND,
                amount
            );
            transaction.setBeneficiaryId(escrow.getClientId());
            transaction.setReason(reason);
            transaction.complete();

            escrow.setHeldAmount(escrow.getHeldAmount().subtract(amount));
            escrow.setRefundedAmount(escrow.getRefundedAmount().add(amount));
            escrow.getTransactions().add(transaction);

            if (escrow.getHeldAmount().compareTo(BigDecimal.ZERO) == 0) {
                escrow.setStatus(EscrowAccount.EscrowStatus.REFUNDED);
            }

            LOGGER.info("Refunded {} from escrow {} to client", amount, escrowId);

            return transaction;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== INVOICE MANAGEMENT ====================

    /**
     * Generate invoice for a payment order
     */
    public Uni<Invoice> generateInvoice(String orderId) {
        return Uni.createFrom().item(() -> {
            PaymentOrder order = paymentOrders.get(orderId);
            if (order == null) {
                throw new IllegalArgumentException("Payment order not found: " + orderId);
            }

            Invoice invoice = new Invoice(orderId, order.getClientId());
            invoice.setAmount(order.getAmount());
            invoice.setCurrency(order.getCurrency());
            invoice.setDueDate(Instant.now().plus(Duration.ofDays(30)));

            // Add line items from order
            invoice.setLineItems(order.getLineItems());

            // Calculate totals
            invoice.calculateTotals();

            invoices.put(invoice.getInvoiceId(), invoice);

            // Update order with invoice reference
            order.setInvoiceId(invoice.getInvoiceId());

            LOGGER.info("Invoice generated: {} for order {}", invoice.getInvoiceId(), orderId);

            return invoice;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Record payment against invoice
     */
    public Uni<PaymentTransaction> recordPayment(String invoiceId, PaymentDetails details) {
        return Uni.createFrom().item(() -> {
            Invoice invoice = invoices.get(invoiceId);
            if (invoice == null) {
                throw new IllegalArgumentException("Invoice not found: " + invoiceId);
            }

            PaymentTransaction transaction = new PaymentTransaction(
                invoiceId,
                details.amount,
                details.paymentMethod
            );
            transaction.setExternalReference(details.externalReference);
            transaction.setPayerId(details.payerId);
            transaction.complete();

            transactions.put(transaction.getTransactionId(), transaction);

            // Update invoice
            invoice.recordPayment(details.amount);

            // If fully paid, update order status
            if (invoice.getStatus() == Invoice.InvoiceStatus.PAID) {
                PaymentOrder order = paymentOrders.get(invoice.getOrderId());
                if (order != null) {
                    order.setStatus(PaymentOrder.OrderStatus.PAID);
                }
            }

            LOGGER.info("Payment recorded: {} for invoice {}", transaction.getTransactionId(), invoiceId);

            return transaction;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== VERIFIER PAYOUT ====================

    /**
     * Get or create verifier payout account
     */
    public Uni<VerifierPayoutAccount> getVerifierAccount(String verifierId) {
        return Uni.createFrom().item(() -> {
            return verifierAccounts.computeIfAbsent(verifierId, id -> {
                VerifierPayoutAccount account = new VerifierPayoutAccount(id);
                LOGGER.info("Created payout account for verifier: {}", id);
                return account;
            });
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    private void creditVerifierAccount(String verifierId, BigDecimal amount, String transactionRef) {
        VerifierPayoutAccount account = verifierAccounts.computeIfAbsent(verifierId,
            id -> new VerifierPayoutAccount(id));
        account.credit(amount, transactionRef);
    }

    /**
     * Process payout to verifier
     */
    public Uni<PayoutTransaction> processVerifierPayout(String verifierId, BigDecimal amount,
                                                        PayoutDetails details) {
        return Uni.createFrom().item(() -> {
            VerifierPayoutAccount account = verifierAccounts.get(verifierId);
            if (account == null) {
                throw new IllegalArgumentException("Verifier account not found: " + verifierId);
            }

            if (account.getAvailableBalance().compareTo(amount) < 0) {
                throw new IllegalStateException("Insufficient balance for payout");
            }

            PayoutTransaction payout = new PayoutTransaction(verifierId, amount);
            payout.setPayoutMethod(details.payoutMethod);
            payout.setBankDetails(details.bankDetails);

            // Deduct from account
            account.debit(amount, payout.getPayoutId());

            // Process payout (in real implementation, would call payment gateway)
            payout.setStatus(PayoutTransaction.PayoutStatus.PROCESSING);

            LOGGER.info("Payout initiated: {} for verifier {} amount {}",
                payout.getPayoutId(), verifierId, amount);

            return payout;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== FEE DISTRIBUTION ====================

    /**
     * Calculate and distribute fees for completed verification
     */
    public Uni<FeeDistribution> distributeFees(String taskId, BigDecimal totalAmount,
                                               List<VerifierFeeShare> verifierShares) {
        return Uni.createFrom().item(() -> {
            FeeDistribution distribution = new FeeDistribution(taskId, totalAmount);

            // Calculate platform commission
            BigDecimal platformFee = totalAmount.multiply(PLATFORM_COMMISSION_RATE)
                .setScale(2, RoundingMode.HALF_UP);
            distribution.setPlatformFee(platformFee);

            // Remaining amount for verifiers
            BigDecimal verifierPool = totalAmount.subtract(platformFee);

            // Distribute to verifiers based on shares
            for (VerifierFeeShare share : verifierShares) {
                BigDecimal verifierAmount = verifierPool.multiply(share.sharePercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                distribution.addVerifierPayout(share.verifierId, verifierAmount);

                // Credit verifier account
                creditVerifierAccount(share.verifierId, verifierAmount, taskId);
            }

            LOGGER.info("Fee distribution completed for task {}: Platform={}, Verifiers={}",
                taskId, platformFee, verifierPool);

            return distribution;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== REPORTING ====================

    /**
     * Get payment statistics
     */
    public Uni<PaymentStats> getPaymentStats() {
        return Uni.createFrom().item(() -> {
            PaymentStats stats = new PaymentStats();

            stats.totalOrders = paymentOrders.size();
            stats.totalAmount = paymentOrders.values().stream()
                .map(PaymentOrder::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            stats.paidOrders = (int) paymentOrders.values().stream()
                .filter(o -> o.getStatus() == PaymentOrder.OrderStatus.PAID)
                .count();

            stats.pendingOrders = (int) paymentOrders.values().stream()
                .filter(o -> o.getStatus() == PaymentOrder.OrderStatus.PENDING)
                .count();

            stats.totalEscrowHeld = escrowAccounts.values().stream()
                .map(EscrowAccount::getHeldAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            stats.totalVerifierPayouts = verifierAccounts.values().stream()
                .map(VerifierPayoutAccount::getTotalEarnings)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            return stats;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== DATA CLASSES ====================

    /**
     * Quote request input
     */
    public static class QuoteRequest {
        public String taskId;
        public String compositeId;
        public String clientId;
        public String currency;
        public List<ServiceLineItem> services = new ArrayList<>();
        public boolean useEscrow;
        public boolean isExpress;
        public boolean taxExempt;
        public String loyaltyTier;
        public String jurisdiction;
    }

    public static class ServiceLineItem {
        public String serviceType;
        public String description;
        public int quantity;
        public BigDecimal unitPrice;
    }

    /**
     * Verification Quote
     */
    public static class VerificationQuote {
        private final String quoteId;
        private final String taskId;
        private final String compositeId;
        private String clientId;
        private String currency;
        private List<QuoteLineItem> lineItems = new ArrayList<>();
        private BigDecimal serviceFees = BigDecimal.ZERO;
        private BigDecimal platformCommission = BigDecimal.ZERO;
        private BigDecimal escrowFee = BigDecimal.ZERO;
        private BigDecimal expressFee = BigDecimal.ZERO;
        private BigDecimal discount = BigDecimal.ZERO;
        private BigDecimal tax = BigDecimal.ZERO;
        private BigDecimal totalAmount = BigDecimal.ZERO;
        private Instant createdAt;
        private Instant validUntil;
        private QuoteStatus status = QuoteStatus.DRAFT;

        public VerificationQuote(String taskId, String compositeId) {
            this.quoteId = "QT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.taskId = taskId;
            this.compositeId = compositeId;
            this.createdAt = Instant.now();
        }

        public void calculateTotal() {
            this.totalAmount = serviceFees
                .add(platformCommission)
                .add(escrowFee != null ? escrowFee : BigDecimal.ZERO)
                .add(expressFee != null ? expressFee : BigDecimal.ZERO)
                .subtract(discount != null ? discount : BigDecimal.ZERO)
                .add(tax != null ? tax : BigDecimal.ZERO);
        }

        public void addLineItem(QuoteLineItem item) {
            this.lineItems.add(item);
        }

        public enum QuoteStatus {
            DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
        }

        // Getters and setters
        public String getQuoteId() { return quoteId; }
        public String getTaskId() { return taskId; }
        public String getCompositeId() { return compositeId; }
        public String getClientId() { return clientId; }
        public void setClientId(String id) { this.clientId = id; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public List<QuoteLineItem> getLineItems() { return lineItems; }
        public BigDecimal getServiceFees() { return serviceFees; }
        public void setServiceFees(BigDecimal fees) { this.serviceFees = fees; }
        public BigDecimal getPlatformCommission() { return platformCommission; }
        public void setPlatformCommission(BigDecimal comm) { this.platformCommission = comm; }
        public BigDecimal getEscrowFee() { return escrowFee; }
        public void setEscrowFee(BigDecimal fee) { this.escrowFee = fee; }
        public BigDecimal getExpressFee() { return expressFee; }
        public void setExpressFee(BigDecimal fee) { this.expressFee = fee; }
        public BigDecimal getDiscount() { return discount; }
        public void setDiscount(BigDecimal discount) { this.discount = discount; }
        public BigDecimal getTax() { return tax; }
        public void setTax(BigDecimal tax) { this.tax = tax; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getValidUntil() { return validUntil; }
        public void setValidUntil(Instant valid) { this.validUntil = valid; }
        public QuoteStatus getStatus() { return status; }
        public void setStatus(QuoteStatus status) { this.status = status; }
    }

    public static class QuoteLineItem {
        public String serviceType;
        public String description;
        public int quantity;
        public BigDecimal unitPrice;
        public BigDecimal totalPrice;

        public QuoteLineItem(String serviceType, String description, int quantity, BigDecimal unitPrice) {
            this.serviceType = serviceType;
            this.description = description;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }

    /**
     * Payment Order
     */
    public static class PaymentOrder {
        private final String orderId;
        private final String quoteId;
        private final String clientId;
        private String taskId;
        private BigDecimal amount;
        private String currency;
        private PaymentType paymentType;
        private String paymentTerms;
        private OrderStatus status;
        private String invoiceId;
        private List<QuoteLineItem> lineItems = new ArrayList<>();
        private List<MilestonePayment> milestonePayments = new ArrayList<>();
        private Instant createdAt;
        private Instant paidAt;

        public PaymentOrder(String quoteId, String clientId) {
            this.orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.quoteId = quoteId;
            this.clientId = clientId;
            this.status = OrderStatus.PENDING;
            this.createdAt = Instant.now();
        }

        public enum PaymentType {
            DIRECT,
            ESCROW,
            MILESTONE_BASED
        }

        public enum OrderStatus {
            PENDING,
            INVOICED,
            PARTIALLY_PAID,
            PAID,
            OVERDUE,
            CANCELLED,
            REFUNDED
        }

        // Getters and setters
        public String getOrderId() { return orderId; }
        public String getQuoteId() { return quoteId; }
        public String getClientId() { return clientId; }
        public String getTaskId() { return taskId; }
        public void setTaskId(String id) { this.taskId = id; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public PaymentType getPaymentType() { return paymentType; }
        public void setPaymentType(PaymentType type) { this.paymentType = type; }
        public String getPaymentTerms() { return paymentTerms; }
        public void setPaymentTerms(String terms) { this.paymentTerms = terms; }
        public OrderStatus getStatus() { return status; }
        public void setStatus(OrderStatus status) { this.status = status; }
        public String getInvoiceId() { return invoiceId; }
        public void setInvoiceId(String id) { this.invoiceId = id; }
        public List<QuoteLineItem> getLineItems() { return lineItems; }
        public void setLineItems(List<QuoteLineItem> items) { this.lineItems = items; }
        public List<MilestonePayment> getMilestonePayments() { return milestonePayments; }
        public void setMilestonePayments(List<MilestonePayment> payments) { this.milestonePayments = payments; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getPaidAt() { return paidAt; }
        public void setPaidAt(Instant paid) { this.paidAt = paid; }
    }

    public static class PaymentOrderRequest {
        public String clientId;
        public String taskId;
        public BigDecimal amount;
        public String currency;
        public String paymentTerms;
        public boolean useEscrow;
        public List<MilestonePayment> milestonePayments;
    }

    public static class MilestonePayment {
        public String milestoneId;
        public String milestoneName;
        public BigDecimal amount;
        public BigDecimal percentage;
        public MilestoneStatus status = MilestoneStatus.PENDING;

        public enum MilestoneStatus {
            PENDING, COMPLETED, PAID, CANCELLED
        }
    }

    /**
     * Escrow Account
     */
    public static class EscrowAccount {
        private final String escrowId;
        private final String orderId;
        private final String clientId;
        private BigDecimal totalAmount;
        private BigDecimal heldAmount;
        private BigDecimal releasedAmount;
        private BigDecimal refundedAmount = BigDecimal.ZERO;
        private EscrowStatus status;
        private List<EscrowTransaction> transactions = new ArrayList<>();
        private Instant createdAt;

        public EscrowAccount(String orderId, String clientId) {
            this.escrowId = "ESC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.orderId = orderId;
            this.clientId = clientId;
            this.status = EscrowStatus.CREATED;
            this.createdAt = Instant.now();
        }

        public enum EscrowStatus {
            CREATED,
            FUNDED,
            PARTIALLY_RELEASED,
            RELEASED,
            REFUNDED,
            DISPUTED,
            CLOSED
        }

        // Getters and setters
        public String getEscrowId() { return escrowId; }
        public String getOrderId() { return orderId; }
        public String getClientId() { return clientId; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal amount) { this.totalAmount = amount; }
        public BigDecimal getHeldAmount() { return heldAmount; }
        public void setHeldAmount(BigDecimal amount) { this.heldAmount = amount; }
        public BigDecimal getReleasedAmount() { return releasedAmount; }
        public void setReleasedAmount(BigDecimal amount) { this.releasedAmount = amount; }
        public BigDecimal getRefundedAmount() { return refundedAmount; }
        public void setRefundedAmount(BigDecimal amount) { this.refundedAmount = amount; }
        public EscrowStatus getStatus() { return status; }
        public void setStatus(EscrowStatus status) { this.status = status; }
        public List<EscrowTransaction> getTransactions() { return transactions; }
        public Instant getCreatedAt() { return createdAt; }
    }

    public static class EscrowTransaction {
        private final String transactionId;
        private final String escrowId;
        private final TransactionType type;
        private final BigDecimal amount;
        private String beneficiaryId;
        private String reason;
        private String externalReference;
        private TransactionStatus status = TransactionStatus.PENDING;
        private Instant createdAt;
        private Instant completedAt;

        public EscrowTransaction(String escrowId, TransactionType type, BigDecimal amount) {
            this.transactionId = "ESCTX-" + UUID.randomUUID().toString().substring(0, 8);
            this.escrowId = escrowId;
            this.type = type;
            this.amount = amount;
            this.createdAt = Instant.now();
        }

        public enum TransactionType {
            DEPOSIT, RELEASE, REFUND, FEE
        }

        public enum TransactionStatus {
            PENDING, COMPLETED, FAILED
        }

        public void complete() {
            this.status = TransactionStatus.COMPLETED;
            this.completedAt = Instant.now();
        }

        // Getters and setters
        public String getTransactionId() { return transactionId; }
        public String getEscrowId() { return escrowId; }
        public TransactionType getType() { return type; }
        public BigDecimal getAmount() { return amount; }
        public String getBeneficiaryId() { return beneficiaryId; }
        public void setBeneficiaryId(String id) { this.beneficiaryId = id; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getExternalReference() { return externalReference; }
        public void setExternalReference(String ref) { this.externalReference = ref; }
        public TransactionStatus getStatus() { return status; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getCompletedAt() { return completedAt; }
    }

    /**
     * Invoice
     */
    public static class Invoice {
        private final String invoiceId;
        private final String orderId;
        private final String clientId;
        private String invoiceNumber;
        private BigDecimal amount;
        private BigDecimal paidAmount = BigDecimal.ZERO;
        private String currency;
        private List<QuoteLineItem> lineItems = new ArrayList<>();
        private InvoiceStatus status = InvoiceStatus.DRAFT;
        private Instant issuedAt;
        private Instant dueDate;
        private Instant paidAt;

        public Invoice(String orderId, String clientId) {
            this.invoiceId = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.orderId = orderId;
            this.clientId = clientId;
            this.invoiceNumber = generateInvoiceNumber();
            this.issuedAt = Instant.now();
        }

        private String generateInvoiceNumber() {
            return "INV-" + System.currentTimeMillis();
        }

        public void calculateTotals() {
            this.amount = lineItems.stream()
                .map(item -> item.totalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        public void recordPayment(BigDecimal paymentAmount) {
            this.paidAmount = this.paidAmount.add(paymentAmount);
            if (this.paidAmount.compareTo(this.amount) >= 0) {
                this.status = InvoiceStatus.PAID;
                this.paidAt = Instant.now();
            } else {
                this.status = InvoiceStatus.PARTIALLY_PAID;
            }
        }

        public enum InvoiceStatus {
            DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED, VOID
        }

        // Getters and setters
        public String getInvoiceId() { return invoiceId; }
        public String getOrderId() { return orderId; }
        public String getClientId() { return clientId; }
        public String getInvoiceNumber() { return invoiceNumber; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public BigDecimal getPaidAmount() { return paidAmount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public List<QuoteLineItem> getLineItems() { return lineItems; }
        public void setLineItems(List<QuoteLineItem> items) { this.lineItems = items; }
        public InvoiceStatus getStatus() { return status; }
        public Instant getIssuedAt() { return issuedAt; }
        public Instant getDueDate() { return dueDate; }
        public void setDueDate(Instant due) { this.dueDate = due; }
        public Instant getPaidAt() { return paidAt; }
    }

    /**
     * Payment Transaction
     */
    public static class PaymentTransaction {
        private final String transactionId;
        private final String invoiceId;
        private final BigDecimal amount;
        private final String paymentMethod;
        private String payerId;
        private String externalReference;
        private TransactionStatus status = TransactionStatus.PENDING;
        private Instant createdAt;
        private Instant completedAt;

        public PaymentTransaction(String invoiceId, BigDecimal amount, String paymentMethod) {
            this.transactionId = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.invoiceId = invoiceId;
            this.amount = amount;
            this.paymentMethod = paymentMethod;
            this.createdAt = Instant.now();
        }

        public enum TransactionStatus {
            PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
        }

        public void complete() {
            this.status = TransactionStatus.COMPLETED;
            this.completedAt = Instant.now();
        }

        // Getters and setters
        public String getTransactionId() { return transactionId; }
        public String getInvoiceId() { return invoiceId; }
        public BigDecimal getAmount() { return amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public String getPayerId() { return payerId; }
        public void setPayerId(String id) { this.payerId = id; }
        public String getExternalReference() { return externalReference; }
        public void setExternalReference(String ref) { this.externalReference = ref; }
        public TransactionStatus getStatus() { return status; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getCompletedAt() { return completedAt; }
    }

    public static class PaymentDetails {
        public BigDecimal amount;
        public String paymentMethod;
        public String payerId;
        public String externalReference;
    }

    /**
     * Verifier Payout Account
     */
    public static class VerifierPayoutAccount {
        private final String accountId;
        private final String verifierId;
        private BigDecimal availableBalance = BigDecimal.ZERO;
        private BigDecimal pendingBalance = BigDecimal.ZERO;
        private BigDecimal totalEarnings = BigDecimal.ZERO;
        private BigDecimal totalWithdrawn = BigDecimal.ZERO;
        private List<AccountTransaction> transactions = new ArrayList<>();
        private BankDetails bankDetails;
        private Instant createdAt;

        public VerifierPayoutAccount(String verifierId) {
            this.accountId = "VACC-" + UUID.randomUUID().toString().substring(0, 8);
            this.verifierId = verifierId;
            this.createdAt = Instant.now();
        }

        public void credit(BigDecimal amount, String reference) {
            this.availableBalance = this.availableBalance.add(amount);
            this.totalEarnings = this.totalEarnings.add(amount);
            transactions.add(new AccountTransaction(
                AccountTransaction.Type.CREDIT, amount, reference
            ));
        }

        public void debit(BigDecimal amount, String reference) {
            this.availableBalance = this.availableBalance.subtract(amount);
            this.totalWithdrawn = this.totalWithdrawn.add(amount);
            transactions.add(new AccountTransaction(
                AccountTransaction.Type.DEBIT, amount, reference
            ));
        }

        // Getters
        public String getAccountId() { return accountId; }
        public String getVerifierId() { return verifierId; }
        public BigDecimal getAvailableBalance() { return availableBalance; }
        public BigDecimal getPendingBalance() { return pendingBalance; }
        public BigDecimal getTotalEarnings() { return totalEarnings; }
        public BigDecimal getTotalWithdrawn() { return totalWithdrawn; }
        public List<AccountTransaction> getTransactions() { return transactions; }
        public BankDetails getBankDetails() { return bankDetails; }
        public void setBankDetails(BankDetails details) { this.bankDetails = details; }
        public Instant getCreatedAt() { return createdAt; }
    }

    public static class AccountTransaction {
        public String transactionId;
        public Type type;
        public BigDecimal amount;
        public String reference;
        public Instant timestamp;

        public AccountTransaction(Type type, BigDecimal amount, String reference) {
            this.transactionId = "ATX-" + UUID.randomUUID().toString().substring(0, 8);
            this.type = type;
            this.amount = amount;
            this.reference = reference;
            this.timestamp = Instant.now();
        }

        public enum Type {
            CREDIT, DEBIT, HOLD, RELEASE
        }
    }

    /**
     * Payout Transaction
     */
    public static class PayoutTransaction {
        private final String payoutId;
        private final String verifierId;
        private final BigDecimal amount;
        private PayoutMethod payoutMethod;
        private BankDetails bankDetails;
        private PayoutStatus status = PayoutStatus.PENDING;
        private String externalReference;
        private Instant createdAt;
        private Instant processedAt;

        public PayoutTransaction(String verifierId, BigDecimal amount) {
            this.payoutId = "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.verifierId = verifierId;
            this.amount = amount;
            this.createdAt = Instant.now();
        }

        public enum PayoutMethod {
            BANK_TRANSFER, PAYPAL, CRYPTO, CHECK
        }

        public enum PayoutStatus {
            PENDING, PROCESSING, COMPLETED, FAILED
        }

        // Getters and setters
        public String getPayoutId() { return payoutId; }
        public String getVerifierId() { return verifierId; }
        public BigDecimal getAmount() { return amount; }
        public PayoutMethod getPayoutMethod() { return payoutMethod; }
        public void setPayoutMethod(PayoutMethod method) { this.payoutMethod = method; }
        public BankDetails getBankDetails() { return bankDetails; }
        public void setBankDetails(BankDetails details) { this.bankDetails = details; }
        public PayoutStatus getStatus() { return status; }
        public void setStatus(PayoutStatus status) { this.status = status; }
        public String getExternalReference() { return externalReference; }
        public void setExternalReference(String ref) { this.externalReference = ref; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getProcessedAt() { return processedAt; }
    }

    public static class PayoutDetails {
        public PayoutTransaction.PayoutMethod payoutMethod;
        public BankDetails bankDetails;
    }

    public static class BankDetails {
        public String bankName;
        public String accountNumber;
        public String routingNumber;
        public String swiftCode;
        public String accountHolderName;
        public String accountType;
        public String country;
    }

    /**
     * Fee Distribution
     */
    public static class FeeDistribution {
        private final String distributionId;
        private final String taskId;
        private final BigDecimal totalAmount;
        private BigDecimal platformFee;
        private Map<String, BigDecimal> verifierPayouts = new HashMap<>();
        private Instant distributedAt;

        public FeeDistribution(String taskId, BigDecimal totalAmount) {
            this.distributionId = "FD-" + UUID.randomUUID().toString().substring(0, 8);
            this.taskId = taskId;
            this.totalAmount = totalAmount;
            this.distributedAt = Instant.now();
        }

        public void addVerifierPayout(String verifierId, BigDecimal amount) {
            this.verifierPayouts.put(verifierId, amount);
        }

        // Getters
        public String getDistributionId() { return distributionId; }
        public String getTaskId() { return taskId; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public BigDecimal getPlatformFee() { return platformFee; }
        public void setPlatformFee(BigDecimal fee) { this.platformFee = fee; }
        public Map<String, BigDecimal> getVerifierPayouts() { return verifierPayouts; }
        public Instant getDistributedAt() { return distributedAt; }
    }

    public static class VerifierFeeShare {
        public String verifierId;
        public BigDecimal sharePercent;

        public VerifierFeeShare(String verifierId, BigDecimal sharePercent) {
            this.verifierId = verifierId;
            this.sharePercent = sharePercent;
        }
    }

    /**
     * Payment Statistics
     */
    public static class PaymentStats {
        public int totalOrders;
        public int paidOrders;
        public int pendingOrders;
        public BigDecimal totalAmount;
        public BigDecimal totalEscrowHeld;
        public BigDecimal totalVerifierPayouts;
    }
}
