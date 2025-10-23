package io.aurigraph.v11.smartcontract;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Smart Contract SDK Tests
 *
 * Comprehensive test suite for the Aurigraph Smart Contract SDK.
 *
 * @version 11.2.1
 * @since 2025-10-12
 */
@QuarkusTest
class SmartContractTest {

    @Inject
    SmartContractService contractService;

    private SmartContract testContract;

    @BeforeEach
    void setUp() {
        // Create test contract
        testContract = new SmartContract(
            "TestContract",
            "contract TestContract { function test() { return true; } }",
            SmartContract.ContractLanguage.JAVA,
            "test_owner"
        );
        testContract.setVersion("1.0.0");
    }

    @Test
    void testDeployContract() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Verify deployment
        assertNotNull(deployed.getContractId());
        assertEquals("TestContract", deployed.getName());
        assertEquals(SmartContract.ContractStatus.DEPLOYED, deployed.getStatus());
        assertNotNull(deployed.getDeployedAt());
        assertNotNull(deployed.getMetadata());
    }

    @Test
    void testDeployContractWithMetadata() {
        // Add metadata
        ContractMetadata metadata = new ContractMetadata();
        metadata.setDescription("Test contract with metadata");
        metadata.setAuthor("Test Author");
        metadata.setLicense("MIT");
        metadata.setTags(new String[]{"test", "example"});
        metadata.setGasLimit(500000L);
        testContract.setMetadata(metadata);

        // Deploy
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Verify metadata
        assertEquals("Test contract with metadata", deployed.getMetadata().getDescription());
        assertEquals("Test Author", deployed.getMetadata().getAuthor());
        assertEquals("MIT", deployed.getMetadata().getLicense());
        assertEquals(500000L, deployed.getMetadata().getGasLimit());
    }

    @Test
    void testExecuteContract() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Execute method
        Map<String, Object> params = new HashMap<>();
        params.put("value", 100);

        ContractExecution execution = contractService.executeContract(
            deployed.getContractId(),
            "test",
            params,
            "test_caller"
        ).await().indefinitely();

        // Verify execution
        assertNotNull(execution.getExecutionId());
        assertEquals(deployed.getContractId(), execution.getContractId());
        assertEquals("test", execution.getMethod());
        assertEquals(ContractExecution.ExecutionStatus.SUCCESS, execution.getStatus());
        assertNotNull(execution.getResult());
        assertTrue(execution.getGasUsed() > 0);
        assertTrue(execution.getExecutionTimeMs() >= 0);
    }

    @Test
    void testExecuteContractNotFound() {
        // Try to execute non-existent contract
        Map<String, Object> params = new HashMap<>();

        assertThrows(SmartContractService.ContractNotFoundException.class, () -> {
            contractService.executeContract(
                "non-existent-id",
                "test",
                params,
                "caller"
            ).await().indefinitely();
        });
    }

    @Test
    void testGetContract() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Get contract
        SmartContract retrieved = contractService.getContract(deployed.getContractId())
            .await().indefinitely();

        // Verify
        assertEquals(deployed.getContractId(), retrieved.getContractId());
        assertEquals(deployed.getName(), retrieved.getName());
    }

    @Test
    void testGetContractNotFound() {
        assertThrows(SmartContractService.ContractNotFoundException.class, () -> {
            contractService.getContract("non-existent-id")
                .await().indefinitely();
        });
    }

    @Test
    void testListContracts() {
        // Deploy multiple contracts
        SmartContract contract1 = new SmartContract("Contract1", "code1", SmartContract.ContractLanguage.JAVA, "owner1");
        SmartContract contract2 = new SmartContract("Contract2", "code2", SmartContract.ContractLanguage.JAVA, "owner2");

        contractService.deployContract(contract1).await().indefinitely();
        contractService.deployContract(contract2).await().indefinitely();

        // List all contracts
        List<SmartContract> contracts = contractService.listContracts()
            .await().indefinitely();

        // Verify
        assertTrue(contracts.size() >= 2);
    }

    @Test
    void testListContractsByOwner() {
        // Deploy contracts with specific owner
        SmartContract contract1 = new SmartContract("Contract1", "code1", SmartContract.ContractLanguage.JAVA, "owner123");
        SmartContract contract2 = new SmartContract("Contract2", "code2", SmartContract.ContractLanguage.JAVA, "owner123");
        SmartContract contract3 = new SmartContract("Contract3", "code3", SmartContract.ContractLanguage.JAVA, "other_owner");

        contractService.deployContract(contract1).await().indefinitely();
        contractService.deployContract(contract2).await().indefinitely();
        contractService.deployContract(contract3).await().indefinitely();

        // List contracts by owner
        List<SmartContract> ownerContracts = contractService.listContractsByOwner("owner123")
            .await().indefinitely();

        // Verify
        assertTrue(ownerContracts.size() >= 2);
        ownerContracts.forEach(c -> assertEquals("owner123", c.getOwner()));
    }

    @Test
    void testGetExecutionHistory() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Execute multiple times
        Map<String, Object> params = new HashMap<>();
        contractService.executeContract(deployed.getContractId(), "method1", params, "caller1").await().indefinitely();
        contractService.executeContract(deployed.getContractId(), "method2", params, "caller2").await().indefinitely();
        contractService.executeContract(deployed.getContractId(), "method3", params, "caller3").await().indefinitely();

        // Get execution history
        List<ContractExecution> history = contractService.getExecutionHistory(deployed.getContractId())
            .await().indefinitely();

        // Verify
        assertEquals(3, history.size());
    }

    @Test
    void testUpdateContractState() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Update state
        Map<String, Object> newState = new HashMap<>();
        newState.put("counter", 42);
        newState.put("name", "Updated Name");

        SmartContract updated = contractService.updateContractState(deployed.getContractId(), newState)
            .await().indefinitely();

        // Verify
        assertEquals(42, updated.getState().get("counter"));
        assertEquals("Updated Name", updated.getState().get("name"));
    }

    @Test
    void testPauseContract() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Pause contract
        SmartContract paused = contractService.pauseContract(deployed.getContractId())
            .await().indefinitely();

        // Verify
        assertEquals(SmartContract.ContractStatus.PAUSED, paused.getStatus());
    }

    @Test
    void testResumeContract() {
        // Deploy and pause contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();
        contractService.pauseContract(deployed.getContractId()).await().indefinitely();

        // Resume contract
        SmartContract resumed = contractService.resumeContract(deployed.getContractId())
            .await().indefinitely();

        // Verify
        assertEquals(SmartContract.ContractStatus.ACTIVE, resumed.getStatus());
    }

    @Test
    void testExecutionMetadataUpdate() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        Long initialExecutionCount = deployed.getMetadata().getExecutionCount();

        // Execute contract
        Map<String, Object> params = new HashMap<>();
        contractService.executeContract(deployed.getContractId(), "test", params, "caller")
            .await().indefinitely();

        // Get updated contract
        SmartContract updated = contractService.getContract(deployed.getContractId())
            .await().indefinitely();

        // Verify execution count increased
        assertTrue(updated.getMetadata().getExecutionCount() > initialExecutionCount);
        assertNotNull(updated.getMetadata().getLastExecutedAt());
    }

    @Test
    void testGasCalculation() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Execute with different parameters
        Map<String, Object> smallParams = Map.of("value", 1);
        Map<String, Object> largeParams = Map.of(
            "value1", 1,
            "value2", 2,
            "value3", 3,
            "value4", 4
        );

        ContractExecution exec1 = contractService.executeContract(
            deployed.getContractId(), "test", smallParams, "caller"
        ).await().indefinitely();

        ContractExecution exec2 = contractService.executeContract(
            deployed.getContractId(), "test", largeParams, "caller"
        ).await().indefinitely();

        // Verify gas usage (more parameters = more gas)
        assertTrue(exec2.getGasUsed() > exec1.getGasUsed());
    }

    @Test
    void testContractValidation() {
        // Test missing name
        SmartContract invalidContract1 = new SmartContract();
        invalidContract1.setCode("code");
        invalidContract1.setLanguage(SmartContract.ContractLanguage.JAVA);
        invalidContract1.setOwner("owner");

        assertThrows(SmartContractService.ContractValidationException.class, () -> {
            contractService.deployContract(invalidContract1).await().indefinitely();
        });

        // Test missing code
        SmartContract invalidContract2 = new SmartContract();
        invalidContract2.setName("TestContract");
        invalidContract2.setLanguage(SmartContract.ContractLanguage.JAVA);
        invalidContract2.setOwner("owner");

        assertThrows(SmartContractService.ContractValidationException.class, () -> {
            contractService.deployContract(invalidContract2).await().indefinitely();
        });

        // Test missing owner
        SmartContract invalidContract3 = new SmartContract();
        invalidContract3.setName("TestContract");
        invalidContract3.setCode("code");
        invalidContract3.setLanguage(SmartContract.ContractLanguage.JAVA);

        assertThrows(SmartContractService.ContractValidationException.class, () -> {
            contractService.deployContract(invalidContract3).await().indefinitely();
        });
    }

    @Test
    void testMultipleExecutions() {
        // Deploy contract
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();

        // Execute multiple times
        int executionCount = 10;
        for (int i = 0; i < executionCount; i++) {
            Map<String, Object> params = Map.of("iteration", i);
            ContractExecution execution = contractService.executeContract(
                deployed.getContractId(),
                "test",
                params,
                "caller_" + i
            ).await().indefinitely();

            assertEquals(ContractExecution.ExecutionStatus.SUCCESS, execution.getStatus());
        }

        // Verify execution history
        List<ContractExecution> history = contractService.getExecutionHistory(deployed.getContractId())
            .await().indefinitely();

        assertEquals(executionCount, history.size());
    }

    @Test
    void testContractLifecycle() {
        // 1. Deploy
        SmartContract deployed = contractService.deployContract(testContract)
            .await().indefinitely();
        assertEquals(SmartContract.ContractStatus.DEPLOYED, deployed.getStatus());

        // 2. Execute (becomes ACTIVE implicitly)
        Map<String, Object> params = new HashMap<>();
        ContractExecution execution = contractService.executeContract(
            deployed.getContractId(), "test", params, "caller"
        ).await().indefinitely();
        assertEquals(ContractExecution.ExecutionStatus.SUCCESS, execution.getStatus());

        // 3. Pause
        SmartContract paused = contractService.pauseContract(deployed.getContractId())
            .await().indefinitely();
        assertEquals(SmartContract.ContractStatus.PAUSED, paused.getStatus());

        // 4. Resume
        SmartContract resumed = contractService.resumeContract(deployed.getContractId())
            .await().indefinitely();
        assertEquals(SmartContract.ContractStatus.ACTIVE, resumed.getStatus());
    }
}
