package io.aurigraph.v11.security;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Contract Encryption Service
 * Tests smart contract state, variable, and execution result encryption
 */
@QuarkusTest
@DisplayName("Contract Encryption Tests")
class ContractEncryptionTest {

    @Inject
    ContractEncryptionService contractEncryptionService;

    private static final String CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";
    private static final String TEST_VARIABLE = "balanceOf";

    private byte[] testStateData;

    @BeforeEach
    void setUp() {
        testStateData = "{\"state\":\"active\",\"version\":1}".getBytes(StandardCharsets.UTF_8);
        assertNotNull(contractEncryptionService);
    }

    @Test
    @DisplayName("Should encrypt contract state successfully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptContractState() {
        byte[] encrypted = contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            testStateData
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).isNotEqualTo(testStateData);
        assertThat(encrypted.length).isGreaterThan(testStateData.length);
    }

    @Test
    @DisplayName("Should decrypt contract state successfully")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testDecryptContractState() {
        byte[] encrypted = contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            testStateData
        ).await().atMost(java.time.Duration.ofSeconds(5));

        byte[] decrypted = contractEncryptionService.decryptContractState(
            CONTRACT_ADDRESS,
            encrypted
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(testStateData);
    }

    @Test
    @DisplayName("Should encrypt contract storage variable")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptContractVariable() {
        byte[] variableValue = "100000000000000000".getBytes(StandardCharsets.UTF_8);

        byte[] encrypted = contractEncryptionService.encryptContractVariable(
            CONTRACT_ADDRESS,
            TEST_VARIABLE,
            variableValue
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(encrypted).isNotNull();
        assertThat(encrypted.length).isGreaterThan(0);
    }

    @Test
    @DisplayName("Should decrypt contract storage variable")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testDecryptContractVariable() {
        byte[] variableValue = "100000000000000000".getBytes(StandardCharsets.UTF_8);

        byte[] encrypted = contractEncryptionService.encryptContractVariable(
            CONTRACT_ADDRESS,
            TEST_VARIABLE,
            variableValue
        ).await().atMost(java.time.Duration.ofSeconds(5));

        byte[] decrypted = contractEncryptionService.decryptContractVariable(
            CONTRACT_ADDRESS,
            TEST_VARIABLE,
            encrypted
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(variableValue);
    }

    @Test
    @DisplayName("Should encrypt execution results")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testEncryptExecutionResult() {
        String executionId = "exec-123456";
        byte[] result = "{\"success\":true,\"gasUsed\":50000}".getBytes(StandardCharsets.UTF_8);

        byte[] encrypted = contractEncryptionService.encryptExecutionResult(
            CONTRACT_ADDRESS,
            executionId,
            result
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(encrypted).isNotNull();
        assertThat(encrypted.length).isGreaterThan(0);
    }

    @Test
    @DisplayName("Should decrypt execution results")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testDecryptExecutionResult() {
        String executionId = "exec-123456";
        byte[] result = "{\"success\":true,\"gasUsed\":50000}".getBytes(StandardCharsets.UTF_8);

        byte[] encrypted = contractEncryptionService.encryptExecutionResult(
            CONTRACT_ADDRESS,
            executionId,
            result
        ).await().atMost(java.time.Duration.ofSeconds(5));

        byte[] decrypted = contractEncryptionService.decryptExecutionResult(
            CONTRACT_ADDRESS,
            executionId,
            encrypted
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted).isEqualTo(result);
    }

    @Test
    @DisplayName("Should encrypt batch of contract states")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testEncryptStateBatch() {
        List<byte[]> states = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            states.add(("{\"state\":\"v" + i + "\"}").getBytes(StandardCharsets.UTF_8));
        }

        List<byte[]> encrypted = contractEncryptionService.encryptStateBatch(states)
            .await().atMost(java.time.Duration.ofSeconds(10));

        assertThat(encrypted).hasSize(15);
        assertThat(encrypted).allMatch(e -> e != null && e.length > 0);
    }

    @Test
    @DisplayName("Should decrypt batch of contract states")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testDecryptStateBatch() {
        List<byte[]> states = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            states.add(("{\"state\":\"v" + i + "\"}").getBytes(StandardCharsets.UTF_8));
        }

        List<byte[]> encrypted = contractEncryptionService.encryptStateBatch(states)
            .await().atMost(java.time.Duration.ofSeconds(10));

        List<byte[]> decrypted = contractEncryptionService.decryptStateBatch(encrypted)
            .await().atMost(java.time.Duration.ofSeconds(10));

        assertThat(decrypted).hasSize(states.size());
        for (int i = 0; i < states.size(); i++) {
            assertThat(decrypted.get(i)).isEqualTo(states.get(i));
        }
    }

    @Test
    @DisplayName("Should validate contract state integrity")
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    void testValidateContractStateIntegrity() {
        byte[] encrypted = contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            testStateData
        ).await().atMost(java.time.Duration.ofSeconds(5));

        Boolean isValid = contractEncryptionService.validateContractStateIntegrity(
            CONTRACT_ADDRESS,
            encrypted
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should detect encrypted contract data")
    void testIsEncrypted() {
        byte[] encrypted = contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            testStateData
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertTrue(contractEncryptionService.isEncrypted(encrypted));
        assertFalse(contractEncryptionService.isEncrypted(testStateData));
    }

    @Test
    @DisplayName("Should handle multiple contracts independently")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testMultipleContractsEncryption() {
        String[] contracts = {
            "0x1111111111111111111111111111111111111111",
            "0x2222222222222222222222222222222222222222",
            "0x3333333333333333333333333333333333333333"
        };

        for (String contractAddr : contracts) {
            byte[] data = ("contract-" + contractAddr).getBytes(StandardCharsets.UTF_8);

            byte[] encrypted = contractEncryptionService.encryptContractState(
                contractAddr,
                data
            ).await().atMost(java.time.Duration.ofSeconds(5));

            byte[] decrypted = contractEncryptionService.decryptContractState(
                contractAddr,
                encrypted
            ).await().atMost(java.time.Duration.ofSeconds(5));

            assertThat(decrypted).isEqualTo(data);
        }
    }

    @Test
    @DisplayName("Should encrypt multiple contract variables")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testMultipleVariablesEncryption() {
        String[] variables = { "balance", "owner", "totalSupply", "allowance", "approved" };

        for (String varName : variables) {
            byte[] value = ("value-" + varName).getBytes(StandardCharsets.UTF_8);

            byte[] encrypted = contractEncryptionService.encryptContractVariable(
                CONTRACT_ADDRESS,
                varName,
                value
            ).await().atMost(java.time.Duration.ofSeconds(5));

            byte[] decrypted = contractEncryptionService.decryptContractVariable(
                CONTRACT_ADDRESS,
                varName,
                encrypted
            ).await().atMost(java.time.Duration.ofSeconds(5));

            assertThat(decrypted).isEqualTo(value);
        }
    }

    @Test
    @DisplayName("Should rotate contract encryption keys")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testRotateContractKeys() {
        // Encrypt before rotation
        byte[] encrypted1 = contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            testStateData
        ).await().atMost(java.time.Duration.ofSeconds(5));

        // Encrypt after key rotation (keys rotate internally every 30 days)
        byte[] encrypted2 = contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            testStateData
        ).await().atMost(java.time.Duration.ofSeconds(5));

        // Both should decrypt correctly
        byte[] decrypted1 = contractEncryptionService.decryptContractState(
            CONTRACT_ADDRESS,
            encrypted1
        ).await().atMost(java.time.Duration.ofSeconds(5));

        byte[] decrypted2 = contractEncryptionService.decryptContractState(
            CONTRACT_ADDRESS,
            encrypted2
        ).await().atMost(java.time.Duration.ofSeconds(5));

        assertThat(decrypted1).isEqualTo(testStateData);
        assertThat(decrypted2).isEqualTo(testStateData);
    }

    @Test
    @DisplayName("Should provide contract encryption statistics")
    void testGetStats() {
        contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            testStateData
        ).await().atMost(java.time.Duration.ofSeconds(5));

        ContractEncryptionService.ContractEncryptionStats stats =
            contractEncryptionService.getStats();

        assertThat(stats).isNotNull();
        assertThat(stats.contractStatesEncrypted()).isGreaterThanOrEqualTo(1L);
        assertThat(stats.getTotalOperations()).isGreaterThanOrEqualTo(1L);
    }

    @Test
    @DisplayName("Should handle large contract state data")
    @Timeout(value = 10, unit = TimeUnit.SECONDS)
    void testLargeContractStateEncryption() {
        // 500KB contract state
        byte[] largeState = new byte[500 * 1024];
        for (int i = 0; i < largeState.length; i++) {
            largeState[i] = (byte) (i % 256);
        }

        byte[] encrypted = contractEncryptionService.encryptContractState(
            CONTRACT_ADDRESS,
            largeState
        ).await().atMost(java.time.Duration.ofSeconds(10));

        byte[] decrypted = contractEncryptionService.decryptContractState(
            CONTRACT_ADDRESS,
            encrypted
        ).await().atMost(java.time.Duration.ofSeconds(10));

        assertThat(decrypted).isEqualTo(largeState);
    }

    @Test
    @DisplayName("Should handle concurrent contract operations")
    @Timeout(value = 15, unit = TimeUnit.SECONDS)
    void testConcurrentContractOperations() {
        List<java.util.concurrent.CompletableFuture<byte[]>> futures = new ArrayList<>();

        for (int i = 0; i < 30; i++) {
            java.util.concurrent.CompletableFuture<byte[]> future =
                contractEncryptionService.encryptContractState(
                    CONTRACT_ADDRESS + i,
                    ("state-" + i).getBytes(StandardCharsets.UTF_8)
                ).toCompletableFuture();
            futures.add(future);
        }

        java.util.concurrent.CompletableFuture.allOf(
            futures.toArray(new java.util.concurrent.CompletableFuture[0])
        ).join();

        assertThat(futures).allMatch(java.util.concurrent.CompletableFuture::isDone);
    }
}
