package io.aurigraph.v11.integration;

import io.aurigraph.v11.contracts.SmartContractService;
import io.aurigraph.v11.contracts.models.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for SmartContractService
 *
 * Tests smart contract lifecycle, RWA contracts, templates, and performance.
 * Target: 20 comprehensive integration tests
 *
 * @version Phase 3 Day 5
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SmartContractServiceIntegrationTest {

    private static final Logger logger = LoggerFactory.getLogger(SmartContractServiceIntegrationTest.class);

    @Inject
    SmartContractService contractService;

    private String testContractId;

    // ==================== Service Initialization ====================

    @Test
    @Order(1)
    @DisplayName("CIT-01: Should inject SmartContractService")
    void testServiceInjection() {
        assertThat(contractService).isNotNull();
        logger.info("✓ Contract service properly injected");
    }

    @Test
    @Order(2)
    @DisplayName("CIT-02: Should initialize with statistics")
    void testInitialStatistics() {
        Map<String, Object> stats = contractService.getStatistics()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
        assertThat(stats).containsKeys("contractsCreated", "contractsDeployed", "contractsExecuted");

        logger.info("✓ Contract statistics initialized");
    }

    // ==================== Contract Creation ====================

    @Test
    @Order(3)
    @DisplayName("CIT-03: Should create smart contract")
    void testCreateContract() {
        ContractCreationRequest request = ContractCreationRequest.builder()
            .contractName("SimpleContract")
            .contractType("STANDARD")
            .creatorAddress("0xCreator123")
            .executableCode("contract SimpleContract { function execute() public { } }")
            .legalText("Simple test contract")
            .parameters(new java.util.HashMap<>())
            .build();

        SmartContract contract = contractService.createContract(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract).isNotNull();
        assertThat(contract.getContractId()).isNotNull().isNotEmpty();
        assertThat(contract.getName()).contains("SimpleContract");
        assertThat(contract.getStatus()).isEqualTo(ContractStatus.DRAFT);

        testContractId = contract.getContractId();
        logger.info("✓ Contract created: {}", testContractId);
    }

    @Test
    @Order(4)
    @DisplayName("CIT-04: Should retrieve created contract")
    void testGetContract() {
        SmartContract contract = contractService.getContract(testContractId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract).isNotNull();
        assertThat(contract.getContractId()).isEqualTo(testContractId);
        assertThat(contract.getStatus()).isEqualTo(ContractStatus.DRAFT);

        logger.info("✓ Retrieved contract: {}", testContractId);
    }

    @Test
    @Order(5)
    @DisplayName("CIT-05: Should create multiple contracts")
    void testCreateMultipleContracts() {
        List<String> contractIds = new ArrayList<>();

        for (int i = 0; i < 5; i++) {
            ContractCreationRequest request = ContractCreationRequest.builder()
                .contractName("Contract-" + i)
                .contractType("STANDARD")
                .creatorAddress("0xCreator" + i)
                .executableCode("contract Test" + i + " { }")
                .legalText("Test contract " + i)
                .parameters(new HashMap<>())
                .build();

            SmartContract contract = contractService.createContract(request)
                .await().atMost(Duration.ofSeconds(5));

            contractIds.add(contract.getContractId());
        }

        assertThat(contractIds).hasSize(5);
        logger.info("✓ Created 5 contracts");
    }

    // ==================== Contract Deployment ====================

    @Test
    @Order(6)
    @DisplayName("CIT-06: Should deploy smart contract")
    void testDeployContract() {
        Map<String, Object> params = new HashMap<>();
        params.put("initialValue", "1000");

        SmartContractService.DeploymentResult result = contractService.deployContract(testContractId, params)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(result).isNotNull();
        assertThat(result.contractId()).isEqualTo(testContractId);
        assertThat(result.contractAddress()).isNotNull();
        assertThat(result.verificationScore()).isGreaterThanOrEqualTo(0);
        assertThat(result.transactionHash()).isNotNull();

        logger.info("✓ Contract deployed: {}", result.contractAddress());
    }

    @Test
    @Order(7)
    @DisplayName("CIT-07: Should verify deployed contract status")
    void testDeployedContractStatus() {
        SmartContract contract = contractService.getContract(testContractId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract.getStatus()).isEqualTo(ContractStatus.DEPLOYED);
        assertThat(contract.getDeployedAt()).isNotNull();

        logger.info("✓ Contract status: DEPLOYED");
    }

    // ==================== Contract Execution ====================

    @Test
    @Order(8)
    @DisplayName("CIT-08: Should execute smart contract")
    void testExecuteContract() {
        Map<String, Object> params = new HashMap<>();
        params.put("action", "test");

        SmartContractService.ExecutionResult result = contractService.executeContract(testContractId, params)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(result).isNotNull();
        assertThat(result.contractId()).isEqualTo(testContractId);
        assertThat(result.status()).isEqualTo("SUCCESS");
        assertThat(result.output()).containsKey("gasUsed");

        logger.info("✓ Contract executed successfully");
    }

    @Test
    @Order(9)
    @DisplayName("CIT-09: Should track multiple executions")
    void testMultipleExecutions() {
        for (int i = 0; i < 3; i++) {
            Map<String, Object> params = new HashMap<>();
            params.put("iteration", i);

            SmartContractService.ExecutionResult result = contractService.executeContract(testContractId, params)
                .await().atMost(Duration.ofSeconds(5));

            assertThat(result.status()).isEqualTo("SUCCESS");
        }

        SmartContract contract = contractService.getContract(testContractId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract.getExecutionCount()).isGreaterThanOrEqualTo(4); // 1 from CIT-08 + 3 from this test

        logger.info("✓ Multiple executions tracked");
    }

    // ==================== Contract Lifecycle ====================

    @Test
    @Order(10)
    @DisplayName("CIT-10: Should activate contract")
    void testActivateContract() {
        SmartContract contract = contractService.activateContract(testContractId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract.getStatus()).isEqualTo(ContractStatus.ACTIVE);

        logger.info("✓ Contract activated");
    }

    @Test
    @Order(11)
    @DisplayName("CIT-11: Should complete contract")
    void testCompleteContract() {
        SmartContract contract = contractService.completeContract(testContractId)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract.getStatus()).isEqualTo(ContractStatus.COMPLETED);
        assertThat(contract.getCompletedAt()).isNotNull();

        logger.info("✓ Contract completed");
    }

    @Test
    @Order(12)
    @DisplayName("CIT-12: Should terminate contract")
    void testTerminateContract() {
        // Create a new contract for termination test
        ContractCreationRequest request = ContractCreationRequest.builder()
            .contractName("TerminateTest")
            .contractType("STANDARD")
            .creatorAddress("0xTerminator")
            .executableCode("contract Test { }")
            .legalText("Test termination")
            .parameters(new HashMap<>())
            .build();

        SmartContract contract = contractService.createContract(request)
            .await().atMost(Duration.ofSeconds(5));

        String terminateId = contract.getContractId();

        SmartContract terminated = contractService.terminateContract(terminateId, "Test termination")
            .await().atMost(Duration.ofSeconds(5));

        assertThat(terminated.getStatus()).isEqualTo(ContractStatus.TERMINATED);

        logger.info("✓ Contract terminated");
    }

    // ==================== RWA Contracts ====================

    @Test
    @Order(13)
    @DisplayName("CIT-13: Should create RWA contract")
    void testCreateRWAContract() {
        SmartContractService.RWAContractRequest request = new SmartContractService.RWAContractRequest();
        request.setAssetName("RealEstate-001");
        request.setAssetType(AssetType.REAL_ESTATE);
        request.setAssetValue(new BigDecimal("500000.00"));
        request.setCurrency("USD");
        request.setOwner("PropertyOwner123");

        SmartContract contract = contractService.createRWAContract(request)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract).isNotNull();
        assertThat(contract.getIsRWA()).isTrue();
        assertThat(contract.getAssetType()).isEqualTo(AssetType.REAL_ESTATE);
        assertThat(contract.getValue()).isEqualByComparingTo(new BigDecimal("500000.00"));

        logger.info("✓ RWA contract created");
    }

    @Test
    @Order(14)
    @DisplayName("CIT-14: Should list RWA contracts")
    void testGetRWAContracts() {
        List<SmartContract> rwaContracts = contractService.getRWAContracts()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(rwaContracts).isNotEmpty();
        assertThat(rwaContracts).allMatch(c -> c.getIsRWA());

        logger.info("✓ Found {} RWA contracts", rwaContracts.size());
    }

    // ==================== Contract Templates ====================

    @Test
    @Order(15)
    @DisplayName("CIT-15: Should get contract templates")
    void testGetTemplates() {
        List<SmartContractService.ContractTemplate> templates = contractService.getTemplates()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(templates).isNotEmpty();
        assertThat(templates).allMatch(t -> t.id() != null);

        logger.info("✓ Found {} templates", templates.size());
    }

    @Test
    @Order(16)
    @DisplayName("CIT-16: Should create contract from template")
    void testCreateFromTemplate() {
        // Get first template
        List<SmartContractService.ContractTemplate> templates = contractService.getTemplates()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(templates).isNotEmpty();
        String templateId = templates.get(0).id();

        Map<String, Object> variables = new HashMap<>();
        variables.put("owner", "0xTemplateUser");
        variables.put("name", "TemplateContract");

        SmartContract contract = contractService.createFromTemplate(templateId, variables)
            .await().atMost(Duration.ofSeconds(5));

        assertThat(contract).isNotNull();
        assertThat(contract.getTemplateId()).isEqualTo(templateId);

        logger.info("✓ Contract created from template: {}", templateId);
    }

    // ==================== Statistics ====================

    @Test
    @Order(17)
    @DisplayName("CIT-17: Should track contract statistics")
    void testContractStatistics() {
        Map<String, Object> stats = contractService.getStatistics()
            .await().atMost(Duration.ofSeconds(5));

        assertThat(stats).isNotNull();
        assertThat(stats.get("contractsCreated")).asInstanceOf(LONG).isGreaterThan(0L);
        assertThat(stats.get("contractsDeployed")).asInstanceOf(LONG).isGreaterThan(0L);
        assertThat(stats.get("contractsExecuted")).asInstanceOf(LONG).isGreaterThan(0L);

        logger.info("✓ Statistics: created={}, deployed={}, executed={}",
            stats.get("contractsCreated"),
            stats.get("contractsDeployed"),
            stats.get("contractsExecuted"));
    }

    // ==================== Performance ====================

    @Test
    @Order(18)
    @DisplayName("CIT-18: Should handle concurrent contract creation")
    void testConcurrentCreation() throws InterruptedException {
        int concurrentOperations = 10;
        ExecutorService executor = Executors.newFixedThreadPool(5);
        CountDownLatch latch = new CountDownLatch(concurrentOperations);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < concurrentOperations; i++) {
            int index = i;
            executor.submit(() -> {
                try {
                    ContractCreationRequest request = ContractCreationRequest.builder()
                        .contractName("Concurrent-" + index)
                        .contractType("STANDARD")
                        .creatorAddress("0xConcurrent" + index)
                        .executableCode("contract Test" + index + " { }")
                        .legalText("Concurrent test " + index)
                        .parameters(new HashMap<>())
                        .build();

                    SmartContract contract = contractService.createContract(request)
                        .await().atMost(Duration.ofSeconds(10));

                    if (contract != null && contract.getContractId() != null) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    logger.error("Concurrent creation failed", e);
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        assertThat(successCount.get()).isGreaterThan(7); // 70%+ success rate

        logger.info("✓ Concurrent operations: {}/{} successful", successCount.get(), concurrentOperations);
    }

    @Test
    @Order(19)
    @DisplayName("CIT-19: Should measure contract execution performance")
    void testExecutionPerformance() {
        // Create a contract for performance testing
        ContractCreationRequest createRequest = ContractCreationRequest.builder()
            .contractName("PerfTest")
            .contractType("STANDARD")
            .creatorAddress("0xPerf")
            .executableCode("contract Perf { }")
            .legalText("Performance test")
            .parameters(new HashMap<>())
            .build();

        SmartContract contract = contractService.createContract(createRequest)
            .await().atMost(Duration.ofSeconds(5));

        // Deploy it
        contractService.deployContract(contract.getContractId(), Map.of())
            .await().atMost(Duration.ofSeconds(5));

        // Activate it so it can be executed
        contractService.activateContract(contract.getContractId())
            .await().atMost(Duration.ofSeconds(5));

        // Execute multiple times and measure
        long startTime = System.currentTimeMillis();
        int executions = 10;

        for (int i = 0; i < executions; i++) {
            contractService.executeContract(contract.getContractId(), Map.of("iteration", i))
                .await().atMost(Duration.ofSeconds(5));
        }

        long duration = System.currentTimeMillis() - startTime;
        double executionsPerSecond = (executions * 1000.0) / duration;

        assertThat(executionsPerSecond).isGreaterThan(1.0);

        logger.info("✓ Executed {} contracts in {}ms ({} exec/sec)",
            executions, duration, String.format("%.2f", executionsPerSecond));
    }

    // ==================== Error Handling ====================

    @Test
    @Order(20)
    @DisplayName("CIT-20: Should handle non-existent contract")
    void testNonExistentContract() {
        assertThatThrownBy(() ->
            contractService.getContract("NON-EXISTENT-ID")
                .await().atMost(Duration.ofSeconds(5))
        ).isInstanceOf(Exception.class);

        logger.info("✓ Non-existent contract handled correctly");
    }
}
