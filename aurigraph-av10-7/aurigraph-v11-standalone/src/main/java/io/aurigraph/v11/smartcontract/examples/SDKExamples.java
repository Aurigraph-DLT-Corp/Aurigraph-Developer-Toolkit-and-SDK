package io.aurigraph.v11.smartcontract.examples;

import io.aurigraph.v11.smartcontract.SmartContract;
import io.aurigraph.v11.smartcontract.ContractExecution;
import io.aurigraph.v11.smartcontract.ContractMetadata;
import io.aurigraph.v11.smartcontract.sdk.AurigraphSDKClient;

import java.util.Map;
import java.util.List;

/**
 * Aurigraph Smart Contract SDK Examples
 *
 * Demonstrates how to use the Aurigraph Smart Contract SDK to deploy
 * and interact with smart contracts on the Aurigraph DLT platform.
 *
 * @version 11.2.1
 * @since 2025-10-12
 */
public class SDKExamples {

    /**
     * Example 1: Deploy a Token Contract
     */
    public static void deployTokenContractExample() {
        // Initialize SDK client
        AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");

        // Create token contract
        SmartContract tokenContract = new SmartContract(
            "MyToken",
            TokenContract.SOURCE_CODE,
            SmartContract.ContractLanguage.JAVA,
            "owner123"
        );
        tokenContract.setVersion("1.0.0");
        tokenContract.setAbi(TokenContract.ABI);

        // Set metadata
        ContractMetadata metadata = new ContractMetadata();
        metadata.setDescription("ERC-20 style token on Aurigraph DLT");
        metadata.setAuthor("Aurigraph Development Team");
        metadata.setLicense("MIT");
        metadata.setTags(new String[]{"token", "erc20", "fungible"});
        metadata.setGasLimit(1000000L);
        tokenContract.setMetadata(metadata);

        // Deploy contract
        SmartContract deployed = client.deployContract(tokenContract).join();

        System.out.println("✅ Token contract deployed!");
        System.out.println("   Contract ID: " + deployed.getContractId());
        System.out.println("   Status: " + deployed.getStatus());
        System.out.println("   Deployed At: " + deployed.getDeployedAt());
    }

    /**
     * Example 2: Execute Token Transfer
     */
    public static void executeTokenTransferExample(String contractId) {
        AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");

        // Prepare transfer parameters
        Map<String, Object> params = Map.of(
            "to", "recipient456",
            "amount", 100
        );

        // Execute transfer method
        ContractExecution execution = client.executeContract(
            contractId,
            "transfer",
            params,
            "caller123"
        ).join();

        System.out.println("✅ Transfer executed!");
        System.out.println("   Execution ID: " + execution.getExecutionId());
        System.out.println("   Status: " + execution.getStatus());
        System.out.println("   Gas Used: " + execution.getGasUsed());
        System.out.println("   Result: " + execution.getResult());
    }

    /**
     * Example 3: Query Contract Balance
     */
    public static void queryBalanceExample(String contractId) {
        AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");

        // Query balance
        Map<String, Object> params = Map.of("account", "user123");

        ContractExecution execution = client.executeContract(
            contractId,
            "balanceOf",
            params,
            "anonymous"
        ).join();

        System.out.println("✅ Balance query completed!");
        System.out.println("   Account: user123");
        System.out.println("   Balance: " + execution.getResult());
    }

    /**
     * Example 4: List All Contracts
     */
    public static void listContractsExample() {
        AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");

        // List all contracts
        List<SmartContract> contracts = client.listContracts().join();

        System.out.println("✅ Contracts retrieved!");
        System.out.println("   Total Contracts: " + contracts.size());

        contracts.forEach(contract -> {
            System.out.println("\n   Contract: " + contract.getName());
            System.out.println("   ID: " + contract.getContractId());
            System.out.println("   Owner: " + contract.getOwner());
            System.out.println("   Status: " + contract.getStatus());
            System.out.println("   Language: " + contract.getLanguage());
        });
    }

    /**
     * Example 5: Get Contract Execution History
     */
    public static void getExecutionHistoryExample(String contractId) {
        AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");

        // Get execution history
        List<ContractExecution> history = client.getExecutionHistory(contractId).join();

        System.out.println("✅ Execution history retrieved!");
        System.out.println("   Total Executions: " + history.size());

        history.forEach(execution -> {
            System.out.println("\n   Execution: " + execution.getExecutionId());
            System.out.println("   Method: " + execution.getMethod());
            System.out.println("   Caller: " + execution.getCaller());
            System.out.println("   Status: " + execution.getStatus());
            System.out.println("   Gas Used: " + execution.getGasUsed());
            System.out.println("   Time: " + execution.getExecutionTimeMs() + "ms");
        });
    }

    /**
     * Example 6: Pause and Resume Contract
     */
    public static void pauseResumeContractExample(String contractId) {
        AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");

        // Pause contract
        SmartContract paused = client.pauseContract(contractId).join();
        System.out.println("✅ Contract paused!");
        System.out.println("   Status: " + paused.getStatus());

        // Resume contract
        SmartContract resumed = client.resumeContract(contractId).join();
        System.out.println("✅ Contract resumed!");
        System.out.println("   Status: " + resumed.getStatus());
    }

    /**
     * Example 7: Complete Token Workflow
     */
    public static void completeTokenWorkflowExample() {
        AurigraphSDKClient client = new AurigraphSDKClient("https://dlt.aurigraph.io/api/v11");

        System.out.println("=== Complete Token Workflow Example ===\n");

        // Step 1: Deploy token contract
        System.out.println("Step 1: Deploying token contract...");
        SmartContract contract = new SmartContract(
            "AurigraphToken",
            TokenContract.SOURCE_CODE,
            SmartContract.ContractLanguage.JAVA,
            "deployer123"
        );
        SmartContract deployed = client.deployContract(contract).join();
        System.out.println("✅ Deployed: " + deployed.getContractId() + "\n");

        // Step 2: Mint initial tokens
        System.out.println("Step 2: Minting initial tokens...");
        Map<String, Object> mintParams = Map.of("to", "user123", "amount", 1000);
        ContractExecution mintExec = client.executeContract(
            deployed.getContractId(),
            "mint",
            mintParams,
            "deployer123"
        ).join();
        System.out.println("✅ Minted 1000 tokens to user123\n");

        // Step 3: Transfer tokens
        System.out.println("Step 3: Transferring tokens...");
        Map<String, Object> transferParams = Map.of("to", "user456", "amount", 200);
        ContractExecution transferExec = client.executeContract(
            deployed.getContractId(),
            "transfer",
            transferParams,
            "user123"
        ).join();
        System.out.println("✅ Transferred 200 tokens to user456\n");

        // Step 4: Check balances
        System.out.println("Step 4: Checking balances...");
        Map<String, Object> balanceParams1 = Map.of("account", "user123");
        ContractExecution balance1 = client.executeContract(
            deployed.getContractId(),
            "balanceOf",
            balanceParams1,
            "anonymous"
        ).join();
        System.out.println("✅ user123 balance: " + balance1.getResult());

        Map<String, Object> balanceParams2 = Map.of("account", "user456");
        ContractExecution balance2 = client.executeContract(
            deployed.getContractId(),
            "balanceOf",
            balanceParams2,
            "anonymous"
        ).join();
        System.out.println("✅ user456 balance: " + balance2.getResult() + "\n");

        // Step 5: View execution history
        System.out.println("Step 5: Viewing execution history...");
        List<ContractExecution> history = client.getExecutionHistory(deployed.getContractId()).join();
        System.out.println("✅ Total executions: " + history.size());

        System.out.println("\n=== Workflow Complete! ===");
    }

    /**
     * Main method - Run all examples
     */
    public static void main(String[] args) {
        System.out.println("╔════════════════════════════════════════════════╗");
        System.out.println("║  Aurigraph Smart Contract SDK Examples        ║");
        System.out.println("║  Version 11.2.1                                ║");
        System.out.println("╚════════════════════════════════════════════════╝\n");

        try {
            // Run complete workflow example
            completeTokenWorkflowExample();

        } catch (Exception e) {
            System.err.println("❌ Error running examples: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
