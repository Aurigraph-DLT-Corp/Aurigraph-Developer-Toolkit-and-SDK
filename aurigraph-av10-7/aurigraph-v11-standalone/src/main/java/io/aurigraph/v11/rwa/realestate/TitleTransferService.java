package io.aurigraph.v11.rwa.realestate;

import io.quarkus.logging.Log;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import io.aurigraph.v11.rwa.realestate.PropertyTitle.*;

/**
 * TitleTransferService - Handles real estate title transfers
 *
 * Provides comprehensive title transfer functionality including:
 * - Title search simulation
 * - Escrow integration and management
 * - Settlement/closing process
 * - Recording simulation (county recorder)
 * - Transfer tax calculation
 * - Compliance verification
 *
 * Features:
 * - Virtual thread support for concurrent operations
 * - Full audit trail for compliance
 * - Multi-jurisdiction tax calculation
 * - Escrow state machine management
 * - Settlement document generation
 *
 * @version 1.0.0
 * @author Aurigraph V12 RWA Team
 */
@ApplicationScoped
public class TitleTransferService {

    // ============================================
    // Dependencies
    // ============================================

    @Inject
    RealEstateTitleRegistry titleRegistry;

    @Inject
    LienRegistry lienRegistry;

    // ============================================
    // Storage
    // ============================================

    // Active transfers
    private final Map<String, TransferTransaction> activeTransfers = new ConcurrentHashMap<>();

    // Escrow accounts
    private final Map<String, EscrowAccount> escrowAccounts = new ConcurrentHashMap<>();

    // Recording queue (simulating county recorder)
    private final Map<String, RecordingRequest> recordingQueue = new ConcurrentHashMap<>();

    // Transfer history
    private final List<TransferRecord> transferHistory = Collections.synchronizedList(new ArrayList<>());

    // ============================================
    // Transfer Transaction Records
    // ============================================

    /**
     * Transfer transaction tracking record
     */
    public record TransferTransaction(
        String transactionId,
        String titleId,
        String propertyApn,
        TransferParty seller,
        TransferParty buyer,
        BigDecimal purchasePrice,
        BigDecimal earnestMoney,
        TransferType transferType,
        TransferStatus status,
        TitleSearchResult titleSearch,
        EscrowDetails escrow,
        SettlementDetails settlement,
        TransferCosts costs,
        ComplianceCheck compliance,
        List<TransferMilestone> milestones,
        Instant createdAt,
        Instant updatedAt,
        Instant targetClosingDate,
        Instant actualClosingDate,
        Map<String, Object> metadata
    ) {}

    /**
     * Transfer party (buyer or seller)
     */
    public record TransferParty(
        String partyId,
        String name,
        PartyType type,
        String walletAddress,
        String email,
        String phone,
        String attorney,
        String lender,
        boolean kycVerified,
        boolean accreditedInvestor,
        BigDecimal ownershipPercentage
    ) {}

    /**
     * Party type enumeration
     */
    public enum PartyType {
        INDIVIDUAL, CORPORATION, LLC, TRUST, ESTATE, PARTNERSHIP, REIT, DST
    }

    /**
     * Transfer type enumeration
     */
    public enum TransferType {
        SALE("Standard Sale"),
        REFINANCE("Refinance"),
        GIFT("Gift Transfer"),
        INHERITANCE("Inheritance"),
        FORECLOSURE("Foreclosure Sale"),
        SHORT_SALE("Short Sale"),
        EXCHANGE_1031("1031 Exchange"),
        TOKENIZATION("Tokenization Transfer"),
        FRACTIONAL_SALE("Fractional Ownership Sale"),
        DST_CONTRIBUTION("DST Contribution");

        private final String displayName;
        TransferType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    /**
     * Transfer status enumeration
     */
    public enum TransferStatus {
        INITIATED("Transfer Initiated"),
        TITLE_SEARCH_IN_PROGRESS("Title Search In Progress"),
        TITLE_SEARCH_COMPLETE("Title Search Complete"),
        TITLE_ISSUES_FOUND("Title Issues Found"),
        ESCROW_OPENED("Escrow Opened"),
        EARNEST_MONEY_DEPOSITED("Earnest Money Deposited"),
        INSPECTIONS_IN_PROGRESS("Inspections In Progress"),
        INSPECTIONS_COMPLETE("Inspections Complete"),
        APPRAISAL_ORDERED("Appraisal Ordered"),
        APPRAISAL_COMPLETE("Appraisal Complete"),
        LOAN_APPROVED("Loan Approved"),
        CLEAR_TO_CLOSE("Clear to Close"),
        CLOSING_SCHEDULED("Closing Scheduled"),
        DOCUMENTS_SIGNED("Documents Signed"),
        FUNDS_DISBURSED("Funds Disbursed"),
        RECORDED("Recorded"),
        COMPLETED("Transfer Complete"),
        CANCELLED("Cancelled"),
        ON_HOLD("On Hold");

        private final String displayName;
        TransferStatus(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
    }

    // ============================================
    // Title Search Records
    // ============================================

    /**
     * Title search result
     */
    public record TitleSearchResult(
        String searchId,
        Instant searchDate,
        String searchedBy,
        TitleSearchStatus status,
        List<ChainOfTitleEntry> chainOfTitle,
        List<TitleDefect> defects,
        List<LienRegistry.Lien> liens,
        List<String> easements,
        List<String> restrictions,
        List<String> exceptions,
        boolean marketableTitle,
        String opinion,
        BigDecimal insurabilityAmount,
        Instant validUntil
    ) {}

    /**
     * Title search status
     */
    public enum TitleSearchStatus {
        PENDING, IN_PROGRESS, CLEAR, CLOUDED, UNMARKETABLE, REQUIRES_CURATIVE
    }

    /**
     * Title defect record
     */
    public record TitleDefect(
        String defectId,
        DefectType type,
        String description,
        DefectSeverity severity,
        boolean curativeRequired,
        String curativeAction,
        BigDecimal estimatedCost,
        boolean resolved,
        Instant resolvedDate
    ) {}

    /**
     * Defect type enumeration
     */
    public enum DefectType {
        LIEN_UNSATISFIED, JUDGMENT, TAX_DELINQUENT, BOUNDARY_DISPUTE,
        EASEMENT_CONFLICT, MISSING_HEIR, FORGERY, CLERICAL_ERROR,
        MECHANICS_LIEN, HOA_VIOLATION, ZONING_VIOLATION, ENCROACHMENT
    }

    /**
     * Defect severity
     */
    public enum DefectSeverity {
        MINOR, MODERATE, MAJOR, CRITICAL
    }

    // ============================================
    // Escrow Records
    // ============================================

    /**
     * Escrow details
     */
    public record EscrowDetails(
        String escrowNumber,
        String escrowCompany,
        String escrowOfficer,
        String escrowOfficerLicense,
        BigDecimal escrowAmount,
        Instant escrowOpenDate,
        Instant targetCloseDate,
        EscrowStatus status,
        List<EscrowDeposit> deposits,
        List<EscrowDisbursement> disbursements,
        String ioltaAccountNumber
    ) {}

    /**
     * Escrow account
     */
    public record EscrowAccount(
        String accountId,
        String transactionId,
        BigDecimal balance,
        List<EscrowDeposit> deposits,
        List<EscrowDisbursement> disbursements,
        EscrowStatus status,
        Instant createdAt,
        Instant updatedAt
    ) {}

    /**
     * Escrow deposit
     */
    public record EscrowDeposit(
        String depositId,
        String depositor,
        BigDecimal amount,
        String source,
        DepositType type,
        Instant depositDate,
        boolean cleared,
        String transactionReference
    ) {}

    /**
     * Deposit type
     */
    public enum DepositType {
        EARNEST_MONEY, DOWN_PAYMENT, LOAN_FUNDS, SELLER_CREDIT, BUYER_CREDIT, OTHER
    }

    /**
     * Escrow disbursement
     */
    public record EscrowDisbursement(
        String disbursementId,
        String payee,
        BigDecimal amount,
        DisbursementType type,
        Instant disbursementDate,
        String checkNumber,
        String wireReference
    ) {}

    /**
     * Disbursement type
     */
    public enum DisbursementType {
        SELLER_PROCEEDS, COMMISSION, LENDER_PAYOFF, TAX_PRORATION,
        INSURANCE, TITLE_INSURANCE, RECORDING_FEES, TRANSFER_TAX, OTHER
    }

    /**
     * Escrow status
     */
    public enum EscrowStatus {
        PENDING, OPEN, FUNDED, CLOSING, DISBURSING, CLOSED, CANCELLED
    }

    // ============================================
    // Settlement Records
    // ============================================

    /**
     * Settlement details (closing)
     */
    public record SettlementDetails(
        String settlementId,
        Instant settlementDate,
        String settlementAgent,
        String settlementLocation,
        BigDecimal purchasePrice,
        BigDecimal sellerCredits,
        BigDecimal buyerCredits,
        BigDecimal prorations,
        BigDecimal totalSellerProceeds,
        BigDecimal totalBuyerCash,
        List<SettlementLineItem> sellerItems,
        List<SettlementLineItem> buyerItems,
        SettlementStatus status,
        String closingDisclosureId,
        boolean fundsVerified,
        boolean documentsComplete
    ) {}

    /**
     * Settlement line item
     */
    public record SettlementLineItem(
        String lineNumber,
        String description,
        String category,
        BigDecimal debit,
        BigDecimal credit,
        String paidBy,
        String paidTo
    ) {}

    /**
     * Settlement status
     */
    public enum SettlementStatus {
        PENDING, SCHEDULED, IN_PROGRESS, DOCS_SIGNED, FUNDED, RECORDED, COMPLETE
    }

    // ============================================
    // Transfer Costs
    // ============================================

    /**
     * Transfer costs breakdown
     */
    public record TransferCosts(
        BigDecimal purchasePrice,
        BigDecimal transferTax,
        BigDecimal documentaryStamps,
        BigDecimal recordingFees,
        BigDecimal titleInsurance,
        BigDecimal titleSearch,
        BigDecimal escrowFees,
        BigDecimal attorneyFees,
        BigDecimal lenderFees,
        BigDecimal inspectionFees,
        BigDecimal appraisalFee,
        BigDecimal surveyFee,
        BigDecimal hoaTransferFee,
        BigDecimal prorations,
        BigDecimal sellerCommission,
        BigDecimal buyerAgentCommission,
        BigDecimal totalSellerCosts,
        BigDecimal totalBuyerCosts,
        BigDecimal netToSeller,
        BigDecimal totalDueFromBuyer,
        String jurisdiction
    ) {
        public static TransferCosts calculate(BigDecimal price, String jurisdiction) {
            // Get jurisdiction-specific rates
            var rates = JURISDICTION_RATES.getOrDefault(jurisdiction, DEFAULT_RATES);

            BigDecimal transferTax = price.multiply(rates.transferTaxRate());
            BigDecimal docStamps = price.multiply(rates.documentaryStampRate());
            BigDecimal recording = rates.recordingFee();
            BigDecimal titleIns = price.multiply(new BigDecimal("0.005")); // 0.5% typical
            BigDecimal titleSearch = new BigDecimal("250");
            BigDecimal escrow = price.multiply(new BigDecimal("0.01")); // 1%
            BigDecimal attorney = rates.attorneyRequired() ? new BigDecimal("1500") : BigDecimal.ZERO;
            BigDecimal sellerComm = price.multiply(new BigDecimal("0.03")); // 3%
            BigDecimal buyerComm = price.multiply(new BigDecimal("0.03")); // 3%

            BigDecimal sellerCosts = transferTax.add(docStamps).add(sellerComm);
            BigDecimal buyerCosts = recording.add(titleIns).add(titleSearch).add(escrow).add(attorney).add(buyerComm);

            return new TransferCosts(
                price, transferTax, docStamps, recording, titleIns, titleSearch,
                escrow, attorney, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, sellerComm, buyerComm,
                sellerCosts, buyerCosts,
                price.subtract(sellerCosts),
                price.add(buyerCosts),
                jurisdiction
            );
        }
    }

    // Jurisdiction rate record
    private record JurisdictionRates(
        BigDecimal transferTaxRate,
        BigDecimal documentaryStampRate,
        BigDecimal recordingFee,
        boolean attorneyRequired
    ) {}

    private static final JurisdictionRates DEFAULT_RATES = new JurisdictionRates(
        new BigDecimal("0.01"), new BigDecimal("0.0"), new BigDecimal("50"), false
    );

    private static final Map<String, JurisdictionRates> JURISDICTION_RATES = Map.of(
        "FL", new JurisdictionRates(new BigDecimal("0.007"), new BigDecimal("0.0035"), new BigDecimal("10"), false),
        "NY", new JurisdictionRates(new BigDecimal("0.004"), new BigDecimal("0.0"), new BigDecimal("75"), true),
        "CA", new JurisdictionRates(new BigDecimal("0.0011"), new BigDecimal("0.0"), new BigDecimal("15"), false),
        "TX", new JurisdictionRates(new BigDecimal("0.0"), new BigDecimal("0.0"), new BigDecimal("25"), true),
        "IL", new JurisdictionRates(new BigDecimal("0.001"), new BigDecimal("0.0"), new BigDecimal("35"), true)
    );

    // ============================================
    // Compliance Check
    // ============================================

    /**
     * Compliance check record
     */
    public record ComplianceCheck(
        boolean buyerKycVerified,
        boolean sellerKycVerified,
        boolean amlCleared,
        boolean ofacCleared,
        boolean accreditedBuyer,
        boolean accreditedSeller,
        boolean holdingPeriodMet,
        int holdingPeriodDays,
        SECRegulation regulation,
        List<String> complianceIssues,
        Instant lastCheckDate
    ) {}

    // ============================================
    // Transfer Milestone
    // ============================================

    /**
     * Transfer milestone tracking
     */
    public record TransferMilestone(
        String milestoneId,
        String name,
        String description,
        Instant targetDate,
        Instant completedDate,
        boolean completed,
        String completedBy,
        String notes
    ) {}

    // ============================================
    // Recording Request
    // ============================================

    /**
     * Recording request for county recorder
     */
    public record RecordingRequest(
        String requestId,
        String transactionId,
        String titleId,
        String documentType,
        String jurisdiction,
        RecordingStatus status,
        Instant submittedAt,
        Instant recordedAt,
        String instrumentNumber,
        String book,
        String page,
        BigDecimal recordingFee,
        String txHash
    ) {}

    /**
     * Recording status
     */
    public enum RecordingStatus {
        PENDING, SUBMITTED, PROCESSING, RECORDED, REJECTED
    }

    // ============================================
    // Transfer Record (History)
    // ============================================

    /**
     * Transfer record for history
     */
    public record TransferRecord(
        String transferId,
        String titleId,
        String fromParty,
        String toParty,
        BigDecimal amount,
        TransferType type,
        Instant transferDate,
        String instrumentNumber,
        String txHash,
        TransferStatus finalStatus
    ) {}

    // ============================================
    // Transfer Initiation
    // ============================================

    /**
     * Initiate a new title transfer
     */
    public Uni<TransferTransaction> initiateTransfer(
            String titleId,
            TransferParty seller,
            TransferParty buyer,
            BigDecimal purchasePrice,
            TransferType transferType,
            Instant targetClosingDate
    ) {
        return Uni.createFrom().item(() -> {
            Log.infof("Initiating transfer for title %s: %s -> %s, Price: %s",
                titleId, seller.name(), buyer.name(), purchasePrice);

            String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

            // Get property info
            var titleOpt = titleRegistry.getTitleById(titleId).await().atMost(Duration.ofSeconds(5));
            if (titleOpt.isEmpty()) {
                throw new IllegalArgumentException("Title not found: " + titleId);
            }
            TitleRecord title = titleOpt.get();
            String jurisdiction = title.address() != null ? title.address().stateCode() : "XX";

            // Calculate costs
            TransferCosts costs = TransferCosts.calculate(purchasePrice, jurisdiction);

            // Create initial milestones
            List<TransferMilestone> milestones = createInitialMilestones(targetClosingDate);

            // Create transfer transaction
            TransferTransaction transfer = new TransferTransaction(
                transactionId,
                titleId,
                title.propertyId().assessorParcelNumber(),
                seller,
                buyer,
                purchasePrice,
                purchasePrice.multiply(new BigDecimal("0.01")), // 1% earnest money
                transferType,
                TransferStatus.INITIATED,
                null, // Title search pending
                null, // Escrow pending
                null, // Settlement pending
                costs,
                null, // Compliance check pending
                milestones,
                Instant.now(),
                Instant.now(),
                targetClosingDate,
                null,
                Map.of("jurisdiction", jurisdiction)
            );

            activeTransfers.put(transactionId, transfer);

            Log.infof("Transfer initiated: %s", transactionId);
            return transfer;
        });
    }

    // ============================================
    // Title Search
    // ============================================

    /**
     * Perform title search (simulation)
     */
    public Uni<TitleSearchResult> performTitleSearch(String transactionId) {
        return Uni.createFrom().item(() -> {
            TransferTransaction transfer = activeTransfers.get(transactionId);
            if (transfer == null) {
                throw new IllegalArgumentException("Transfer not found: " + transactionId);
            }

            Log.infof("Performing title search for transaction %s, title %s",
                transactionId, transfer.titleId());

            // Update status
            updateTransferStatus(transactionId, TransferStatus.TITLE_SEARCH_IN_PROGRESS);

            // Get title and liens
            var titleOpt = titleRegistry.getTitleById(transfer.titleId()).await().atMost(Duration.ofSeconds(5));
            TitleRecord title = titleOpt.orElseThrow(() ->
                new IllegalStateException("Title not found: " + transfer.titleId()));

            // Get liens
            List<LienRegistry.Lien> liens = lienRegistry.getLiensForProperty(transfer.titleId())
                .await().atMost(Duration.ofSeconds(5));

            // Simulate title search - check for defects
            List<TitleDefect> defects = new ArrayList<>();

            // Check for unsatisfied liens
            for (LienRegistry.Lien lien : liens) {
                if (lien.status() == LienRegistry.LienStatus.ACTIVE) {
                    defects.add(new TitleDefect(
                        "DEF-" + UUID.randomUUID().toString().substring(0, 8),
                        DefectType.LIEN_UNSATISFIED,
                        String.format("%s lien by %s for %s",
                            lien.lienType().name(), lien.lienholder(), lien.amount()),
                        lien.lienType() == LienRegistry.LienType.TAX_LIEN ?
                            DefectSeverity.CRITICAL : DefectSeverity.MAJOR,
                        true,
                        "Lien must be satisfied at closing",
                        lien.amount(),
                        false,
                        null
                    ));
                }
            }

            boolean marketable = defects.isEmpty() ||
                defects.stream().allMatch(d -> d.severity() != DefectSeverity.CRITICAL);

            TitleSearchResult searchResult = new TitleSearchResult(
                "SEARCH-" + UUID.randomUUID().toString().substring(0, 8),
                Instant.now(),
                "Aurigraph Title Services",
                marketable ? TitleSearchStatus.CLEAR : TitleSearchStatus.CLOUDED,
                title.chainOfTitle(),
                defects,
                liens,
                List.of(), // Easements
                List.of(), // Restrictions
                List.of(), // Exceptions
                marketable,
                marketable ? "Title is marketable" : "Title has defects requiring resolution",
                transfer.purchasePrice(),
                Instant.now().plus(90, ChronoUnit.DAYS)
            );

            // Update transfer with search result
            TransferTransaction updated = new TransferTransaction(
                transfer.transactionId(),
                transfer.titleId(),
                transfer.propertyApn(),
                transfer.seller(),
                transfer.buyer(),
                transfer.purchasePrice(),
                transfer.earnestMoney(),
                transfer.transferType(),
                marketable ? TransferStatus.TITLE_SEARCH_COMPLETE : TransferStatus.TITLE_ISSUES_FOUND,
                searchResult,
                transfer.escrow(),
                transfer.settlement(),
                transfer.costs(),
                transfer.compliance(),
                transfer.milestones(),
                transfer.createdAt(),
                Instant.now(),
                transfer.targetClosingDate(),
                transfer.actualClosingDate(),
                transfer.metadata()
            );
            activeTransfers.put(transactionId, updated);

            Log.infof("Title search complete: %s - %s",
                transactionId, marketable ? "CLEAR" : "ISSUES FOUND");
            return searchResult;
        });
    }

    // ============================================
    // Escrow Operations
    // ============================================

    /**
     * Open escrow account
     */
    public Uni<EscrowDetails> openEscrow(String transactionId, String escrowCompany, String escrowOfficer) {
        return Uni.createFrom().item(() -> {
            TransferTransaction transfer = activeTransfers.get(transactionId);
            if (transfer == null) {
                throw new IllegalArgumentException("Transfer not found: " + transactionId);
            }

            Log.infof("Opening escrow for transaction %s with %s", transactionId, escrowCompany);

            String escrowNumber = "ESC-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

            EscrowDetails escrow = new EscrowDetails(
                escrowNumber,
                escrowCompany,
                escrowOfficer,
                "ESC-LIC-" + UUID.randomUUID().toString().substring(0, 6),
                transfer.purchasePrice(),
                Instant.now(),
                transfer.targetClosingDate(),
                EscrowStatus.OPEN,
                new ArrayList<>(),
                new ArrayList<>(),
                "IOLTA-" + UUID.randomUUID().toString().substring(0, 8)
            );

            // Create escrow account
            EscrowAccount account = new EscrowAccount(
                escrowNumber,
                transactionId,
                BigDecimal.ZERO,
                new ArrayList<>(),
                new ArrayList<>(),
                EscrowStatus.OPEN,
                Instant.now(),
                Instant.now()
            );
            escrowAccounts.put(escrowNumber, account);

            // Update transfer
            TransferTransaction updated = new TransferTransaction(
                transfer.transactionId(),
                transfer.titleId(),
                transfer.propertyApn(),
                transfer.seller(),
                transfer.buyer(),
                transfer.purchasePrice(),
                transfer.earnestMoney(),
                transfer.transferType(),
                TransferStatus.ESCROW_OPENED,
                transfer.titleSearch(),
                escrow,
                transfer.settlement(),
                transfer.costs(),
                transfer.compliance(),
                transfer.milestones(),
                transfer.createdAt(),
                Instant.now(),
                transfer.targetClosingDate(),
                transfer.actualClosingDate(),
                transfer.metadata()
            );
            activeTransfers.put(transactionId, updated);

            Log.infof("Escrow opened: %s", escrowNumber);
            return escrow;
        });
    }

    /**
     * Deposit earnest money
     */
    public Uni<EscrowDeposit> depositEarnestMoney(
            String transactionId,
            BigDecimal amount,
            String depositor,
            String source
    ) {
        return Uni.createFrom().item(() -> {
            TransferTransaction transfer = activeTransfers.get(transactionId);
            if (transfer == null || transfer.escrow() == null) {
                throw new IllegalArgumentException("Transfer or escrow not found: " + transactionId);
            }

            String escrowNumber = transfer.escrow().escrowNumber();
            EscrowAccount account = escrowAccounts.get(escrowNumber);
            if (account == null) {
                throw new IllegalStateException("Escrow account not found: " + escrowNumber);
            }

            EscrowDeposit deposit = new EscrowDeposit(
                "DEP-" + UUID.randomUUID().toString().substring(0, 8),
                depositor,
                amount,
                source,
                DepositType.EARNEST_MONEY,
                Instant.now(),
                true,
                generateTxHash()
            );

            // Update account
            List<EscrowDeposit> deposits = new ArrayList<>(account.deposits());
            deposits.add(deposit);
            EscrowAccount updatedAccount = new EscrowAccount(
                account.accountId(),
                account.transactionId(),
                account.balance().add(amount),
                deposits,
                account.disbursements(),
                EscrowStatus.FUNDED,
                account.createdAt(),
                Instant.now()
            );
            escrowAccounts.put(escrowNumber, updatedAccount);

            updateTransferStatus(transactionId, TransferStatus.EARNEST_MONEY_DEPOSITED);

            Log.infof("Earnest money deposited: %s in escrow %s", amount, escrowNumber);
            return deposit;
        });
    }

    // ============================================
    // Settlement Process
    // ============================================

    /**
     * Schedule settlement/closing
     */
    public Uni<SettlementDetails> scheduleSettlement(
            String transactionId,
            Instant settlementDate,
            String settlementAgent,
            String location
    ) {
        return Uni.createFrom().item(() -> {
            TransferTransaction transfer = activeTransfers.get(transactionId);
            if (transfer == null) {
                throw new IllegalArgumentException("Transfer not found: " + transactionId);
            }

            Log.infof("Scheduling settlement for %s on %s", transactionId, settlementDate);

            // Calculate settlement amounts
            TransferCosts costs = transfer.costs();

            List<SettlementLineItem> sellerItems = List.of(
                new SettlementLineItem("100", "Contract Sales Price", "PRICE", BigDecimal.ZERO, costs.purchasePrice(), null, "Seller"),
                new SettlementLineItem("500", "Transfer Tax", "TAX", costs.transferTax(), BigDecimal.ZERO, "Seller", "County"),
                new SettlementLineItem("501", "Documentary Stamps", "TAX", costs.documentaryStamps(), BigDecimal.ZERO, "Seller", "State"),
                new SettlementLineItem("700", "Seller Commission", "COMMISSION", costs.sellerCommission(), BigDecimal.ZERO, "Seller", "Broker")
            );

            List<SettlementLineItem> buyerItems = List.of(
                new SettlementLineItem("100", "Contract Sales Price", "PRICE", costs.purchasePrice(), BigDecimal.ZERO, "Buyer", "Seller"),
                new SettlementLineItem("1100", "Title Insurance", "TITLE", costs.titleInsurance(), BigDecimal.ZERO, "Buyer", "Title Co"),
                new SettlementLineItem("1200", "Recording Fees", "RECORDING", costs.recordingFees(), BigDecimal.ZERO, "Buyer", "County"),
                new SettlementLineItem("1300", "Escrow Fees", "ESCROW", costs.escrowFees(), BigDecimal.ZERO, "Buyer", "Escrow Co")
            );

            SettlementDetails settlement = new SettlementDetails(
                "SETTLE-" + UUID.randomUUID().toString().substring(0, 8),
                settlementDate,
                settlementAgent,
                location,
                costs.purchasePrice(),
                BigDecimal.ZERO, // Seller credits
                BigDecimal.ZERO, // Buyer credits
                BigDecimal.ZERO, // Prorations
                costs.netToSeller(),
                costs.totalDueFromBuyer(),
                sellerItems,
                buyerItems,
                SettlementStatus.SCHEDULED,
                "CD-" + UUID.randomUUID().toString().substring(0, 8),
                false,
                false
            );

            // Update transfer
            TransferTransaction updated = new TransferTransaction(
                transfer.transactionId(),
                transfer.titleId(),
                transfer.propertyApn(),
                transfer.seller(),
                transfer.buyer(),
                transfer.purchasePrice(),
                transfer.earnestMoney(),
                transfer.transferType(),
                TransferStatus.CLOSING_SCHEDULED,
                transfer.titleSearch(),
                transfer.escrow(),
                settlement,
                transfer.costs(),
                transfer.compliance(),
                transfer.milestones(),
                transfer.createdAt(),
                Instant.now(),
                transfer.targetClosingDate(),
                transfer.actualClosingDate(),
                transfer.metadata()
            );
            activeTransfers.put(transactionId, updated);

            Log.infof("Settlement scheduled: %s on %s", settlement.settlementId(), settlementDate);
            return settlement;
        });
    }

    /**
     * Complete settlement and record
     */
    public Uni<TransferTransaction> completeSettlement(String transactionId, String actor) {
        return Uni.createFrom().item(() -> {
            TransferTransaction transfer = activeTransfers.get(transactionId);
            if (transfer == null) {
                throw new IllegalArgumentException("Transfer not found: " + transactionId);
            }

            Log.infof("Completing settlement for %s", transactionId);

            // Simulate recording
            RecordingRequest recording = new RecordingRequest(
                "REC-" + UUID.randomUUID().toString().substring(0, 8),
                transactionId,
                transfer.titleId(),
                "WARRANTY_DEED",
                (String) transfer.metadata().get("jurisdiction"),
                RecordingStatus.RECORDED,
                Instant.now(),
                Instant.now(),
                generateInstrumentNumber(),
                generateBookNumber(),
                generatePageNumber(),
                transfer.costs().recordingFees(),
                generateTxHash()
            );
            recordingQueue.put(recording.requestId(), recording);

            // Create chain of title entry
            ChainOfTitleEntry cotEntry = new ChainOfTitleEntry(
                "COT-" + UUID.randomUUID().toString().substring(0, 8),
                0, // Will be updated by registry
                transfer.seller().name(),
                transfer.buyer().name(),
                DeedType.WARRANTY_DEED,
                recording.instrumentNumber(),
                recording.book(),
                recording.page(),
                recording.recordedAt(),
                recording.recordedAt(),
                transfer.purchasePrice(),
                transfer.costs().documentaryStamps(),
                transfer.costs().transferTax(),
                recording.txHash(),
                System.currentTimeMillis() / 1000,
                true,
                "Transfer completed via Aurigraph"
            );

            // Add to title chain
            titleRegistry.addChainOfTitleEntry(transfer.titleId(), cotEntry, actor)
                .await().atMost(Duration.ofSeconds(5));

            // Update transfer to completed
            TransferTransaction completed = new TransferTransaction(
                transfer.transactionId(),
                transfer.titleId(),
                transfer.propertyApn(),
                transfer.seller(),
                transfer.buyer(),
                transfer.purchasePrice(),
                transfer.earnestMoney(),
                transfer.transferType(),
                TransferStatus.COMPLETED,
                transfer.titleSearch(),
                transfer.escrow(),
                transfer.settlement(),
                transfer.costs(),
                transfer.compliance(),
                transfer.milestones(),
                transfer.createdAt(),
                Instant.now(),
                transfer.targetClosingDate(),
                Instant.now(),
                transfer.metadata()
            );
            activeTransfers.put(transactionId, completed);

            // Add to history
            transferHistory.add(new TransferRecord(
                transactionId,
                transfer.titleId(),
                transfer.seller().name(),
                transfer.buyer().name(),
                transfer.purchasePrice(),
                transfer.transferType(),
                Instant.now(),
                recording.instrumentNumber(),
                recording.txHash(),
                TransferStatus.COMPLETED
            ));

            Log.infof("Settlement complete: %s, Instrument: %s",
                transactionId, recording.instrumentNumber());
            return completed;
        });
    }

    // ============================================
    // Transfer Tax Calculation
    // ============================================

    /**
     * Calculate transfer taxes for a jurisdiction
     */
    public Uni<TransferTaxBreakdown> calculateTransferTax(
            BigDecimal purchasePrice,
            String jurisdiction
    ) {
        return Uni.createFrom().item(() -> {
            JurisdictionRates rates = JURISDICTION_RATES.getOrDefault(jurisdiction, DEFAULT_RATES);

            BigDecimal stateTax = purchasePrice.multiply(rates.transferTaxRate())
                .setScale(2, RoundingMode.HALF_UP);
            BigDecimal docStamps = purchasePrice.multiply(rates.documentaryStampRate())
                .setScale(2, RoundingMode.HALF_UP);
            BigDecimal recording = rates.recordingFee();

            // Some jurisdictions have additional county/city taxes
            BigDecimal countyTax = BigDecimal.ZERO;
            BigDecimal cityTax = BigDecimal.ZERO;

            BigDecimal total = stateTax.add(docStamps).add(recording).add(countyTax).add(cityTax);

            return new TransferTaxBreakdown(
                jurisdiction,
                purchasePrice,
                stateTax,
                countyTax,
                cityTax,
                docStamps,
                recording,
                total,
                rates.transferTaxRate(),
                rates.documentaryStampRate()
            );
        });
    }

    /**
     * Transfer tax breakdown
     */
    public record TransferTaxBreakdown(
        String jurisdiction,
        BigDecimal purchasePrice,
        BigDecimal stateTax,
        BigDecimal countyTax,
        BigDecimal cityTax,
        BigDecimal documentaryStamps,
        BigDecimal recordingFees,
        BigDecimal totalTax,
        BigDecimal stateTaxRate,
        BigDecimal docStampRate
    ) {}

    // ============================================
    // Query Methods
    // ============================================

    /**
     * Get transfer by ID
     */
    public Uni<Optional<TransferTransaction>> getTransfer(String transactionId) {
        return Uni.createFrom().item(() ->
            Optional.ofNullable(activeTransfers.get(transactionId))
        );
    }

    /**
     * Get transfers for a title
     */
    public Uni<List<TransferTransaction>> getTransfersForTitle(String titleId) {
        return Uni.createFrom().item(() ->
            activeTransfers.values().stream()
                .filter(t -> t.titleId().equals(titleId))
                .toList()
        );
    }

    /**
     * Get transfer history
     */
    public Uni<List<TransferRecord>> getTransferHistory(int limit) {
        return Uni.createFrom().item(() -> {
            int size = transferHistory.size();
            int start = Math.max(0, size - limit);
            return new ArrayList<>(transferHistory.subList(start, size));
        });
    }

    // ============================================
    // Helper Methods
    // ============================================

    private void updateTransferStatus(String transactionId, TransferStatus newStatus) {
        TransferTransaction transfer = activeTransfers.get(transactionId);
        if (transfer != null) {
            TransferTransaction updated = new TransferTransaction(
                transfer.transactionId(),
                transfer.titleId(),
                transfer.propertyApn(),
                transfer.seller(),
                transfer.buyer(),
                transfer.purchasePrice(),
                transfer.earnestMoney(),
                transfer.transferType(),
                newStatus,
                transfer.titleSearch(),
                transfer.escrow(),
                transfer.settlement(),
                transfer.costs(),
                transfer.compliance(),
                transfer.milestones(),
                transfer.createdAt(),
                Instant.now(),
                transfer.targetClosingDate(),
                transfer.actualClosingDate(),
                transfer.metadata()
            );
            activeTransfers.put(transactionId, updated);
        }
    }

    private List<TransferMilestone> createInitialMilestones(Instant targetClose) {
        return List.of(
            new TransferMilestone("M1", "Title Search", "Complete title search", targetClose.minus(30, ChronoUnit.DAYS), null, false, null, null),
            new TransferMilestone("M2", "Open Escrow", "Open escrow account", targetClose.minus(28, ChronoUnit.DAYS), null, false, null, null),
            new TransferMilestone("M3", "Earnest Money", "Deposit earnest money", targetClose.minus(25, ChronoUnit.DAYS), null, false, null, null),
            new TransferMilestone("M4", "Inspections", "Complete inspections", targetClose.minus(20, ChronoUnit.DAYS), null, false, null, null),
            new TransferMilestone("M5", "Appraisal", "Complete appraisal", targetClose.minus(15, ChronoUnit.DAYS), null, false, null, null),
            new TransferMilestone("M6", "Clear to Close", "Receive clear to close", targetClose.minus(7, ChronoUnit.DAYS), null, false, null, null),
            new TransferMilestone("M7", "Settlement", "Complete settlement", targetClose, null, false, null, null)
        );
    }

    private String generateTxHash() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest((UUID.randomUUID().toString() + Instant.now().toEpochMilli()).getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return UUID.randomUUID().toString();
        }
    }

    private String generateInstrumentNumber() {
        return String.format("2024%08d", System.currentTimeMillis() % 100000000);
    }

    private String generateBookNumber() {
        return String.format("%04d", (System.currentTimeMillis() % 10000));
    }

    private String generatePageNumber() {
        return String.format("%04d", (System.currentTimeMillis() / 1000 % 10000));
    }
}
