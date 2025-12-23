package io.aurigraph.v11.services;

import io.aurigraph.v11.models.ActiveContract;
import io.aurigraph.v11.models.TripleEntryLedger;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Active Contract Service - Core service for contract management with triple-entry accounting
 *
 * Features:
 * - Contract lifecycle management (create, execute, cancel)
 * - Template-based contract instantiation
 * - Smart contract binding and execution
 * - Triple-entry ledger integration
 * - Multi-party contract orchestration
 * - Compliance validation
 * - Event-driven workflow
 * - Batch operations support
 *
 * Integration:
 * - ContractWorkflowEngine for state management
 * - TripleEntryLedger for accounting
 * - Blockchain service for smart contract execution
 *
 * @version 1.0.0
 * @since Sprint 13 (AV11-060)
 */
@ApplicationScoped
public class ActiveContractService {

    private static final Logger LOG = Logger.getLogger(ActiveContractService.class);

    @Inject
    EntityManager entityManager;

    @Inject
    ContractWorkflowEngine workflowEngine;

    @Inject
    ObjectMapper objectMapper;

    // In-memory cache for templates
    private final Map<String, ContractTemplate> templateCache = new ConcurrentHashMap<>();

    /**
     * Create a new active contract
     */
    @Transactional
    public ActiveContract createContract(
        String contractType,
        List<Map<String, Object>> parties,
        Map<String, Object> terms
    ) {
        LOG.infof("Creating new contract of type '%s' with %d parties", contractType, parties.size());

        try {
            // Generate unique contract ID
            String contractId = generateContractId(contractType);

            // Build contract
            ActiveContract contract = ActiveContract.builder()
                .contractId(contractId)
                .contractType(contractType)
                .parties(objectMapper.writeValueAsString(parties))
                .terms(objectMapper.writeValueAsString(terms))
                .createdAt(Instant.now())
                .build();

            // Calculate initial risk assessment
            assessRisk(contract);

            // Persist contract
            entityManager.persist(contract);
            entityManager.flush();

            LOG.infof("Contract created successfully: %s", contractId);
            return contract;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to create contract of type '%s'", contractType);
            throw new RuntimeException("Failed to create contract: " + e.getMessage(), e);
        }
    }

    /**
     * Execute a contract
     */
    @Transactional
    public ExecutionResult executeContract(String contractId, Map<String, Object> executionData) {
        LOG.infof("Executing contract: %s", contractId);

        try {
            ActiveContract contract = findContractById(contractId);
            if (contract == null) {
                return ExecutionResult.failure("Contract not found: " + contractId);
            }

            // Validate contract can be executed
            if (!contract.canExecute()) {
                return ExecutionResult.failure("Contract cannot be executed in current state");
            }

            // Execute via workflow engine
            Map<String, Object> params = new HashMap<>(executionData);
            var workflowResult = workflowEngine.executeAction(contract, "EXECUTE", params);

            if (!workflowResult.isSuccess()) {
                return ExecutionResult.failure(workflowResult.getMessage());
            }

            // Create ledger entries if contract has financial value
            if (contract.getContractValue() != null && contract.getContractValue().compareTo(BigDecimal.ZERO) > 0) {
                createLedgerEntries(contract, executionData);
            }

            // Trigger smart contract execution if bound
            if (contract.hasSmartContract()) {
                executeSmartContract(contract, executionData);
            }

            // Update contract
            entityManager.merge(contract);
            entityManager.flush();

            LOG.infof("Contract executed successfully: %s", contractId);
            return ExecutionResult.success(contract);

        } catch (Exception e) {
            LOG.errorf(e, "Failed to execute contract: %s", contractId);
            return ExecutionResult.failure("Execution failed: " + e.getMessage());
        }
    }

    /**
     * Cancel a contract
     */
    @Transactional
    public boolean cancelContract(String contractId, String reason, String cancelledBy) {
        LOG.infof("Cancelling contract: %s", contractId);

        try {
            ActiveContract contract = findContractById(contractId);
            if (contract == null) {
                LOG.warnf("Contract not found for cancellation: %s", contractId);
                return false;
            }

            Map<String, Object> params = new HashMap<>();
            params.put("reason", reason);
            params.put("cancelledBy", cancelledBy);

            var result = workflowEngine.executeAction(contract, "CANCEL", params);

            if (result.isSuccess()) {
                entityManager.merge(contract);
                entityManager.flush();
                LOG.infof("Contract cancelled successfully: %s", contractId);
                return true;
            } else {
                LOG.warnf("Failed to cancel contract: %s - %s", contractId, result.getMessage());
                return false;
            }

        } catch (Exception e) {
            LOG.errorf(e, "Error cancelling contract: %s", contractId);
            return false;
        }
    }

    /**
     * Get contract details
     */
    public ActiveContract getContractDetails(String contractId) {
        return findContractById(contractId);
    }

    /**
     * Get all contracts with filtering
     */
    public List<ActiveContract> getAllContracts(int limit, int offset, String statusFilter) {
        try {
            String query = "SELECT c FROM ActiveContract c";

            if (statusFilter != null && !statusFilter.isEmpty()) {
                query += " WHERE c.workflowState = :status";
            }

            query += " ORDER BY c.createdAt DESC";

            var typedQuery = entityManager.createQuery(query, ActiveContract.class)
                .setMaxResults(limit)
                .setFirstResult(offset);

            if (statusFilter != null && !statusFilter.isEmpty()) {
                typedQuery.setParameter("status", statusFilter);
            }

            return typedQuery.getResultList();

        } catch (Exception e) {
            LOG.errorf(e, "Failed to retrieve contracts");
            return Collections.emptyList();
        }
    }

    /**
     * Get available contract templates
     */
    public List<ContractTemplate> getContractTemplates() {
        if (templateCache.isEmpty()) {
            initializeDefaultTemplates();
        }
        return new ArrayList<>(templateCache.values());
    }

    /**
     * Instantiate a contract from template
     */
    @Transactional
    public ActiveContract instantiateTemplate(String templateId, Map<String, Object> params) {
        LOG.infof("Instantiating contract from template: %s", templateId);

        try {
            ContractTemplate template = templateCache.get(templateId);
            if (template == null) {
                throw new IllegalArgumentException("Template not found: " + templateId);
            }

            // Extract parameters
            List<Map<String, Object>> parties = (List<Map<String, Object>>) params.getOrDefault("parties", new ArrayList<>());
            Map<String, Object> terms = (Map<String, Object>) params.getOrDefault("terms", new HashMap<>());

            // Merge template terms with provided terms
            Map<String, Object> mergedTerms = new HashMap<>(template.getDefaultTerms());
            mergedTerms.putAll(terms);

            // Create contract
            ActiveContract contract = createContract(template.getContractType(), parties, mergedTerms);

            // Set template reference
            contract.setTemplateId(templateId);
            contract.setTemplateVersion(template.getVersion());

            entityManager.merge(contract);
            entityManager.flush();

            LOG.infof("Contract instantiated from template '%s': %s", templateId, contract.getContractId());
            return contract;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to instantiate template: %s", templateId);
            throw new RuntimeException("Template instantiation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Bind a smart contract to an active contract
     */
    @Transactional
    public boolean bindSmartContract(String contractId, String smartContractAddress, String version) {
        LOG.infof("Binding smart contract %s to contract %s", smartContractAddress, contractId);

        try {
            ActiveContract contract = findContractById(contractId);
            if (contract == null) {
                LOG.warnf("Contract not found: %s", contractId);
                return false;
            }

            contract.setSmartContractAddress(smartContractAddress);
            contract.setSmartContractVersion(version);

            entityManager.merge(contract);
            entityManager.flush();

            LOG.infof("Smart contract bound successfully to contract: %s", contractId);
            return true;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to bind smart contract to contract: %s", contractId);
            return false;
        }
    }

    /**
     * Add a signature to a contract
     */
    @Transactional
    public boolean addSignature(String contractId, String partyId, String signature, String publicKey) {
        LOG.infof("Adding signature to contract %s from party %s", contractId, partyId);

        try {
            ActiveContract contract = findContractById(contractId);
            if (contract == null) {
                LOG.warnf("Contract not found: %s", contractId);
                return false;
            }

            // Parse existing signatures
            List<Map<String, Object>> signatures = objectMapper.readValue(
                contract.getSignatures(),
                new TypeReference<>() {}
            );

            // Add new signature
            Map<String, Object> newSignature = new HashMap<>();
            newSignature.put("partyId", partyId);
            newSignature.put("signature", signature);
            newSignature.put("publicKey", publicKey);
            newSignature.put("timestamp", Instant.now().toString());

            signatures.add(newSignature);
            contract.setSignatures(objectMapper.writeValueAsString(signatures));

            // Execute SIGN action in workflow
            Map<String, Object> params = new HashMap<>();
            params.put("partyId", partyId);
            params.put("signature", signature);

            workflowEngine.executeAction(contract, "SIGN", params);

            entityManager.merge(contract);
            entityManager.flush();

            LOG.infof("Signature added successfully to contract: %s", contractId);
            return true;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to add signature to contract: %s", contractId);
            return false;
        }
    }

    /**
     * Get contracts by party address
     */
    public List<ActiveContract> getContractsByParty(String partyAddress, int limit, int offset) {
        try {
            // Note: This is a simplified query. In production, you'd use JSON functions
            // or a dedicated party table with proper indexing
            return entityManager.createQuery(
                "SELECT c FROM ActiveContract c WHERE c.parties LIKE :partyAddress ORDER BY c.createdAt DESC",
                ActiveContract.class
            )
            .setParameter("partyAddress", "%" + partyAddress + "%")
            .setMaxResults(limit)
            .setFirstResult(offset)
            .getResultList();

        } catch (Exception e) {
            LOG.errorf(e, "Failed to retrieve contracts for party: %s", partyAddress);
            return Collections.emptyList();
        }
    }

    /**
     * Get contracts expiring soon
     */
    public List<ActiveContract> getExpiringContracts(int daysAhead) {
        try {
            Instant threshold = Instant.now().plusSeconds(daysAhead * 86400L);

            return entityManager.createQuery(
                "SELECT c FROM ActiveContract c WHERE c.expiresAt <= :threshold AND c.status = 'ACTIVE' ORDER BY c.expiresAt ASC",
                ActiveContract.class
            )
            .setParameter("threshold", threshold)
            .setMaxResults(100)
            .getResultList();

        } catch (Exception e) {
            LOG.errorf(e, "Failed to retrieve expiring contracts");
            return Collections.emptyList();
        }
    }

    /**
     * Private helper methods
     */

    private ActiveContract findContractById(String contractId) {
        try {
            return entityManager.createQuery(
                "SELECT c FROM ActiveContract c WHERE c.contractId = :contractId",
                ActiveContract.class
            )
            .setParameter("contractId", contractId)
            .getSingleResult();
        } catch (Exception e) {
            LOG.debugf("Contract not found: %s", contractId);
            return null;
        }
    }

    private String generateContractId(String contractType) {
        return String.format("%s-%s-%s",
            contractType.toUpperCase(),
            Instant.now().toEpochMilli(),
            UUID.randomUUID().toString().substring(0, 8)
        );
    }

    private void createLedgerEntries(ActiveContract contract, Map<String, Object> executionData) {
        LOG.infof("Creating ledger entries for contract execution: %s", contract.getContractId());

        try {
            // Parse parties to determine debit/credit accounts
            List<Map<String, Object>> parties = objectMapper.readValue(
                contract.getParties(),
                new TypeReference<>() {}
            );

            // Find payer and payee
            String debitAccount = null;
            String creditAccount = null;

            for (Map<String, Object> party : parties) {
                String role = (String) party.get("role");
                String address = (String) party.get("address");

                if ("PAYER".equals(role) || "BUYER".equals(role)) {
                    debitAccount = address;
                } else if ("PAYEE".equals(role) || "SELLER".equals(role)) {
                    creditAccount = address;
                }
            }

            if (debitAccount != null && creditAccount != null) {
                // Generate blockchain receipt hash (in production, this would be actual blockchain hash)
                String receiptHash = generateReceiptHash(contract);

                // Create ledger entry
                TripleEntryLedger ledgerEntry = TripleEntryLedger.builder()
                    .transactionId(contract.getContractId() + "-exec-" + contract.getExecutionCount())
                    .receiptHash(receiptHash)
                    .debitAccount(debitAccount)
                    .creditAccount(creditAccount)
                    .amount(contract.getContractValue())
                    .currency(contract.getCurrency())
                    .description("Contract execution: " + contract.getContractName())
                    .contractId(contract.getContractId())
                    .timestamp(Instant.now())
                    .build();

                entityManager.persist(ledgerEntry);

                // Link ledger entry to contract
                linkLedgerEntry(contract, ledgerEntry.getId());
            }

        } catch (Exception e) {
            LOG.errorf(e, "Failed to create ledger entries for contract: %s", contract.getContractId());
        }
    }

    private void linkLedgerEntry(ActiveContract contract, UUID ledgerEntryId) {
        try {
            List<String> linkedEntries = objectMapper.readValue(
                contract.getLinkedLedgerEntries(),
                new TypeReference<>() {}
            );
            linkedEntries.add(ledgerEntryId.toString());
            contract.setLinkedLedgerEntries(objectMapper.writeValueAsString(linkedEntries));
        } catch (Exception e) {
            LOG.error("Failed to link ledger entry", e);
        }
    }

    private String generateReceiptHash(ActiveContract contract) {
        // In production, this would generate actual blockchain transaction hash
        return "0x" + UUID.randomUUID().toString().replace("-", "") +
               UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    private void executeSmartContract(ActiveContract contract, Map<String, Object> executionData) {
        LOG.infof("Executing smart contract at address: %s", contract.getSmartContractAddress());

        // TODO: Implement actual smart contract execution
        // This would integrate with blockchain service to execute the contract
        // For now, we just log the execution
    }

    private void assessRisk(ActiveContract contract) {
        // Simple risk assessment algorithm
        BigDecimal riskScore = BigDecimal.ZERO;

        // Factor in contract value
        if (contract.getContractValue() != null) {
            if (contract.getContractValue().compareTo(new BigDecimal("1000000")) > 0) {
                riskScore = riskScore.add(new BigDecimal("25"));
            }
        }

        // Factor in jurisdiction
        if (contract.getJurisdiction() == null) {
            riskScore = riskScore.add(new BigDecimal("15"));
        }

        // Factor in compliance
        if (contract.isComplianceCheckRequired() && !"PASSED".equals(contract.getComplianceStatus())) {
            riskScore = riskScore.add(new BigDecimal("20"));
        }

        contract.setRiskScore(riskScore);

        if (riskScore.compareTo(new BigDecimal("50")) > 0) {
            contract.setRiskLevel("HIGH");
        } else if (riskScore.compareTo(new BigDecimal("25")) > 0) {
            contract.setRiskLevel("MEDIUM");
        } else {
            contract.setRiskLevel("LOW");
        }
    }

    private void initializeDefaultTemplates() {
        // Escrow contract template
        ContractTemplate escrowTemplate = new ContractTemplate(
            "escrow-v1",
            "ESCROW",
            "1.0.0",
            "Standard Escrow Contract",
            Map.of(
                "holdPeriod", "30 days",
                "releaseCondition", "mutual_consent",
                "disputeResolution", "arbitration"
            )
        );
        templateCache.put(escrowTemplate.getId(), escrowTemplate);

        // Loan contract template
        ContractTemplate loanTemplate = new ContractTemplate(
            "loan-v1",
            "LOAN",
            "1.0.0",
            "Standard Loan Contract",
            Map.of(
                "interestRate", "5.0",
                "repaymentPeriod", "12 months",
                "collateralRequired", true
            )
        );
        templateCache.put(loanTemplate.getId(), loanTemplate);

        // Swap contract template
        ContractTemplate swapTemplate = new ContractTemplate(
            "swap-v1",
            "SWAP",
            "1.0.0",
            "Asset Swap Contract",
            Map.of(
                "swapType", "fixed_for_fixed",
                "settlementDate", "T+2",
                "autoSettle", true
            )
        );
        templateCache.put(swapTemplate.getId(), swapTemplate);

        LOG.infof("Initialized %d contract templates", templateCache.size());
    }
}

/**
 * Contract Template
 */
class ContractTemplate {
    private final String id;
    private final String contractType;
    private final String version;
    private final String description;
    private final Map<String, Object> defaultTerms;

    public ContractTemplate(String id, String contractType, String version, String description, Map<String, Object> defaultTerms) {
        this.id = id;
        this.contractType = contractType;
        this.version = version;
        this.description = description;
        this.defaultTerms = defaultTerms;
    }

    public String getId() { return id; }
    public String getContractType() { return contractType; }
    public String getVersion() { return version; }
    public String getDescription() { return description; }
    public Map<String, Object> getDefaultTerms() { return defaultTerms; }
}

/**
 * Execution Result
 */
class ExecutionResult {
    private final boolean success;
    private final String message;
    private final ActiveContract contract;

    private ExecutionResult(boolean success, String message, ActiveContract contract) {
        this.success = success;
        this.message = message;
        this.contract = contract;
    }

    public static ExecutionResult success(ActiveContract contract) {
        return new ExecutionResult(true, "Execution successful", contract);
    }

    public static ExecutionResult failure(String message) {
        return new ExecutionResult(false, message, null);
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public ActiveContract getContract() { return contract; }
}
