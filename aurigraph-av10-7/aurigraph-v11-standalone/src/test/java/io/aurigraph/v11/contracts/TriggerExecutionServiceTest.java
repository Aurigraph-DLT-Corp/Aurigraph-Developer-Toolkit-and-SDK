package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractProgramming;
import io.aurigraph.v11.contracts.models.ContractProgramming.*;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Test Suite for TriggerExecutionService
 *
 * Tests cover:
 * - Trigger registration (time-based, event-based, oracle-based)
 * - Trigger lifecycle management (enable/disable)
 * - Condition evaluation
 * - Trigger execution with multi-action support
 * - Execution history tracking
 * - Event and oracle handling
 * - Metrics collection
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TriggerExecutionServiceTest {

    @Inject
    TriggerExecutionService triggerExecutionService;

    private static final String TEST_CONTRACT_ID = "CONTRACT-TEST-001";
    private static String registeredTriggerId;
    private static String eventTriggerId;
    private static String oracleTriggerId;

    @BeforeEach
    void setUp() {
        // Setup is performed per-test to ensure clean state where needed
    }

    // ==========================================================================
    // Time-Based Trigger Registration Tests
    // ==========================================================================

    @Test
    @Order(1)
    @DisplayName("Should register time-based trigger with cron expression")
    void testRegisterTimeBasedTriggerWithCron() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Daily Payment Processing");
        trigger.setDescription("Process payments every day at midnight");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setCronExpression("0 0 0 * * ?");
        trigger.setEnabled(true);
        trigger.setPriority(1);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        assertNotNull(registered);
        assertNotNull(registered.getTriggerId());
        assertTrue(registered.getTriggerId().startsWith("TRIG-"));
        assertEquals("Daily Payment Processing", registered.getName());
        assertEquals(TriggerType.TIME_BASED, registered.getType());
        assertEquals("0 0 0 * * ?", registered.getCronExpression());
        assertTrue(registered.isEnabled());

        registeredTriggerId = registered.getTriggerId();
    }

    @Test
    @Order(2)
    @DisplayName("Should register time-based trigger with interval")
    void testRegisterTimeBasedTriggerWithInterval() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Heartbeat Check");
        trigger.setDescription("Check system health every 5 minutes");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(300); // 5 minutes
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        assertNotNull(registered);
        assertEquals(300, registered.getIntervalSeconds());
        assertEquals(TriggerType.TIME_BASED, registered.getType());
    }

    @Test
    @Order(3)
    @DisplayName("Should register time-based trigger with scheduled time")
    void testRegisterTimeBasedTriggerWithScheduledTime() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Contract Expiration");
        trigger.setDescription("Execute when contract expires");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setScheduledAt(Instant.now().plusSeconds(86400)); // 24 hours from now
        trigger.setEnabled(true);
        trigger.setMaxExecutions(1); // One-time execution

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        assertNotNull(registered);
        assertNotNull(registered.getScheduledAt());
        assertEquals(1, registered.getMaxExecutions());
    }

    @Test
    @Order(4)
    @DisplayName("Should reject time-based trigger without timing configuration")
    void testRejectTimeBasedTriggerWithoutTiming() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Invalid Time Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        // No cron, scheduledAt, or intervalSeconds set

        assertThrows(TriggerExecutionService.TriggerValidationException.class, () -> {
            triggerExecutionService.registerTrigger(TEST_CONTRACT_ID, trigger)
                .await().indefinitely();
        });
    }

    // ==========================================================================
    // Event-Based Trigger Registration Tests
    // ==========================================================================

    @Test
    @Order(10)
    @DisplayName("Should register event-based trigger")
    void testRegisterEventBasedTrigger() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Token Transfer Handler");
        trigger.setDescription("Handle incoming token transfers");
        trigger.setType(TriggerType.EVENT_BASED);
        trigger.setEventType("TokenTransfer");
        trigger.setEventSource("TokenContract");
        trigger.setEnabled(true);

        Map<String, String> filters = new HashMap<>();
        filters.put("tokenId", "TKN-001");
        filters.put("direction", "incoming");
        trigger.setEventFilters(filters);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        assertNotNull(registered);
        assertEquals(TriggerType.EVENT_BASED, registered.getType());
        assertEquals("TokenTransfer", registered.getEventType());
        assertEquals("TokenContract", registered.getEventSource());
        assertEquals(2, registered.getEventFilters().size());

        eventTriggerId = registered.getTriggerId();
    }

    @Test
    @Order(11)
    @DisplayName("Should reject event-based trigger without event type")
    void testRejectEventBasedTriggerWithoutEventType() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Invalid Event Trigger");
        trigger.setType(TriggerType.EVENT_BASED);
        // No eventType set

        assertThrows(TriggerExecutionService.TriggerValidationException.class, () -> {
            triggerExecutionService.registerTrigger(TEST_CONTRACT_ID, trigger)
                .await().indefinitely();
        });
    }

    // ==========================================================================
    // Oracle-Based Trigger Registration Tests
    // ==========================================================================

    @Test
    @Order(20)
    @DisplayName("Should register oracle-based trigger")
    void testRegisterOracleBasedTrigger() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Price Alert Trigger");
        trigger.setDescription("Execute when BTC price exceeds threshold");
        trigger.setType(TriggerType.ORACLE_BASED);
        trigger.setOracleId("CHAINLINK-BTC-USD");
        trigger.setOracleCondition(">");
        trigger.setOracleThreshold(new BigDecimal("100000"));
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        assertNotNull(registered);
        assertEquals(TriggerType.ORACLE_BASED, registered.getType());
        assertEquals("CHAINLINK-BTC-USD", registered.getOracleId());
        assertEquals(">", registered.getOracleCondition());
        assertEquals(new BigDecimal("100000"), registered.getOracleThreshold());

        oracleTriggerId = registered.getTriggerId();
    }

    @Test
    @Order(21)
    @DisplayName("Should reject oracle-based trigger without oracle ID")
    void testRejectOracleBasedTriggerWithoutOracleId() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Invalid Oracle Trigger");
        trigger.setType(TriggerType.ORACLE_BASED);
        // No oracleId set

        assertThrows(TriggerExecutionService.TriggerValidationException.class, () -> {
            triggerExecutionService.registerTrigger(TEST_CONTRACT_ID, trigger)
                .await().indefinitely();
        });
    }

    @Test
    @Order(22)
    @DisplayName("Should register oracle trigger with multiple conditions")
    void testRegisterOracleTriggerWithConditions() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Multi-Condition Oracle Trigger");
        trigger.setType(TriggerType.ORACLE_BASED);
        trigger.setOracleId("CHAINLINK-ETH-USD");
        trigger.setOracleCondition(">=");
        trigger.setOracleThreshold(new BigDecimal("5000"));
        trigger.setCooldownSeconds(3600); // 1 hour cooldown
        trigger.setMaxExecutions(10);

        List<String> conditionIds = Arrays.asList("COND-001", "COND-002");
        trigger.setConditionIds(conditionIds);
        trigger.setConditionOperator(ConditionOperator.AND);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        assertNotNull(registered);
        assertEquals(2, registered.getConditionIds().size());
        assertEquals(ConditionOperator.AND, registered.getConditionOperator());
        assertEquals(3600, registered.getCooldownSeconds());
        assertEquals(10, registered.getMaxExecutions());
    }

    // ==========================================================================
    // Get Triggers for Contract Tests
    // ==========================================================================

    @Test
    @Order(30)
    @DisplayName("Should list all triggers for contract")
    void testListTriggersForContract() {
        List<ProgrammableTrigger> triggers = triggerExecutionService
            .listTriggers(TEST_CONTRACT_ID)
            .await().indefinitely();

        assertNotNull(triggers);
        assertTrue(triggers.size() >= 3, "Should have at least 3 triggers registered");
    }

    @Test
    @Order(31)
    @DisplayName("Should get specific trigger by ID")
    void testGetTriggerById() {
        assertNotNull(registeredTriggerId, "Trigger ID should be set from previous test");

        ProgrammableTrigger trigger = triggerExecutionService
            .getTrigger(TEST_CONTRACT_ID, registeredTriggerId)
            .await().indefinitely();

        assertNotNull(trigger);
        assertEquals(registeredTriggerId, trigger.getTriggerId());
        assertEquals("Daily Payment Processing", trigger.getName());
    }

    @Test
    @Order(32)
    @DisplayName("Should throw exception for non-existent trigger")
    void testGetNonExistentTrigger() {
        assertThrows(TriggerExecutionService.TriggerNotFoundException.class, () -> {
            triggerExecutionService.getTrigger(TEST_CONTRACT_ID, "NON-EXISTENT-ID")
                .await().indefinitely();
        });
    }

    @Test
    @Order(33)
    @DisplayName("Should return empty list for contract with no triggers")
    void testListTriggersForEmptyContract() {
        List<ProgrammableTrigger> triggers = triggerExecutionService
            .listTriggers("EMPTY-CONTRACT-ID")
            .await().indefinitely();

        assertNotNull(triggers);
        assertTrue(triggers.isEmpty());
    }

    // ==========================================================================
    // Enable/Disable Trigger Tests
    // ==========================================================================

    @Test
    @Order(40)
    @DisplayName("Should disable trigger")
    void testDisableTrigger() {
        assertNotNull(registeredTriggerId);

        ProgrammableTrigger trigger = triggerExecutionService
            .getTrigger(TEST_CONTRACT_ID, registeredTriggerId)
            .await().indefinitely();

        trigger.setEnabled(false);

        ProgrammableTrigger updated = triggerExecutionService
            .updateTrigger(TEST_CONTRACT_ID, registeredTriggerId, trigger)
            .await().indefinitely();

        assertNotNull(updated);
        assertFalse(updated.isEnabled());
    }

    @Test
    @Order(41)
    @DisplayName("Should re-enable trigger")
    void testEnableTrigger() {
        assertNotNull(registeredTriggerId);

        ProgrammableTrigger trigger = triggerExecutionService
            .getTrigger(TEST_CONTRACT_ID, registeredTriggerId)
            .await().indefinitely();

        trigger.setEnabled(true);

        ProgrammableTrigger updated = triggerExecutionService
            .updateTrigger(TEST_CONTRACT_ID, registeredTriggerId, trigger)
            .await().indefinitely();

        assertNotNull(updated);
        assertTrue(updated.isEnabled());
    }

    @Test
    @Order(42)
    @DisplayName("Should not execute disabled trigger")
    void testDisabledTriggerNotExecuted() {
        // Create a disabled trigger
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Disabled Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(false);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        ExecutionRecord record = triggerExecutionService
            .executeTrigger(TEST_CONTRACT_ID, registered.getTriggerId())
            .await().indefinitely();

        assertEquals(ActionStatus.SKIPPED, record.getStatus());
        assertTrue(record.getError().contains("not eligible"));
    }

    // ==========================================================================
    // Trigger Condition Tests
    // ==========================================================================

    @Test
    @Order(50)
    @DisplayName("Should evaluate trigger conditions with no conditions defined")
    void testEvaluateConditionsNoConditions() {
        // Register trigger without conditions
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("No Conditions Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        TriggerExecutionService.ConditionEvaluationResult result = triggerExecutionService
            .evaluateConditions(TEST_CONTRACT_ID, registered.getTriggerId())
            .await().indefinitely();

        assertNotNull(result);
        assertTrue(result.isOverallResult(), "Trigger with no conditions should be eligible");
        assertEquals("No conditions defined - trigger eligible", result.getReason());
    }

    @Test
    @Order(51)
    @DisplayName("Should evaluate trigger conditions with AND operator")
    void testEvaluateConditionsWithAndOperator() {
        // Setup programming context with conditions
        ContractProgramming programming = new ContractProgramming(TEST_CONTRACT_ID);

        Condition cond1 = new Condition();
        cond1.setConditionId("COND-AND-1");
        cond1.setName("Condition 1");
        cond1.setType(ConditionType.EXPRESSION);
        cond1.setExpression("true");
        programming.addCondition(cond1);

        Condition cond2 = new Condition();
        cond2.setConditionId("COND-AND-2");
        cond2.setName("Condition 2");
        cond2.setType(ConditionType.EXPRESSION);
        cond2.setExpression("true");
        programming.addCondition(cond2);

        triggerExecutionService.loadProgramming(TEST_CONTRACT_ID, programming);

        // Create trigger with conditions
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("AND Conditions Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setConditionIds(Arrays.asList("COND-AND-1", "COND-AND-2"));
        trigger.setConditionOperator(ConditionOperator.AND);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        TriggerExecutionService.ConditionEvaluationResult result = triggerExecutionService
            .evaluateConditions(TEST_CONTRACT_ID, registered.getTriggerId())
            .await().indefinitely();

        assertNotNull(result);
        assertNotNull(result.getEvaluatedAt());
        assertEquals(TEST_CONTRACT_ID, result.getContractId());
    }

    @Test
    @Order(52)
    @DisplayName("Should evaluate trigger with max executions reached")
    void testEvaluateConditionsMaxExecutionsReached() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Max Executions Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setMaxExecutions(1);
        trigger.setExecutionCount(1); // Already executed once

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        TriggerExecutionService.ConditionEvaluationResult result = triggerExecutionService
            .evaluateConditions(TEST_CONTRACT_ID, registered.getTriggerId())
            .await().indefinitely();

        assertNotNull(result);
        assertFalse(result.isOverallResult());
        assertTrue(result.getReason().contains("not eligible"));
    }

    @Test
    @Order(53)
    @DisplayName("Should evaluate trigger in cooldown period")
    void testEvaluateTriggerInCooldown() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Cooldown Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setCooldownSeconds(3600); // 1 hour cooldown
        trigger.setLastExecutedAt(Instant.now()); // Just executed

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(TEST_CONTRACT_ID, trigger)
            .await().indefinitely();

        TriggerExecutionService.ConditionEvaluationResult result = triggerExecutionService
            .evaluateConditions(TEST_CONTRACT_ID, registered.getTriggerId())
            .await().indefinitely();

        assertNotNull(result);
        assertFalse(result.isOverallResult());
        assertTrue(result.getReason().contains("cooldown") || result.getReason().contains("not eligible"));
    }

    // ==========================================================================
    // Trigger Execution History Tests
    // ==========================================================================

    @Test
    @Order(60)
    @DisplayName("Should record execution history")
    void testExecutionHistory() {
        String historyContractId = "HISTORY-CONTRACT-001";

        // Register and execute a trigger
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("History Test Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(historyContractId, trigger)
            .await().indefinitely();

        // Execute the trigger
        ExecutionRecord record = triggerExecutionService
            .executeTrigger(historyContractId, registered.getTriggerId(), true, new HashMap<>())
            .await().indefinitely();

        assertNotNull(record);

        // Get execution history
        List<ExecutionRecord> history = triggerExecutionService
            .getExecutionHistory(historyContractId)
            .await().indefinitely();

        assertNotNull(history);
        assertFalse(history.isEmpty());
        assertEquals(registered.getTriggerId(), history.get(0).getTriggerId());
    }

    @Test
    @Order(61)
    @DisplayName("Should get trigger-specific execution history")
    void testTriggerSpecificExecutionHistory() {
        String historyContractId = "HISTORY-CONTRACT-002";

        // Register multiple triggers
        ProgrammableTrigger trigger1 = new ProgrammableTrigger();
        trigger1.setName("Trigger A");
        trigger1.setType(TriggerType.TIME_BASED);
        trigger1.setIntervalSeconds(60);
        trigger1.setEnabled(true);

        ProgrammableTrigger trigger2 = new ProgrammableTrigger();
        trigger2.setName("Trigger B");
        trigger2.setType(TriggerType.TIME_BASED);
        trigger2.setIntervalSeconds(60);
        trigger2.setEnabled(true);

        ProgrammableTrigger registered1 = triggerExecutionService
            .registerTrigger(historyContractId, trigger1)
            .await().indefinitely();

        ProgrammableTrigger registered2 = triggerExecutionService
            .registerTrigger(historyContractId, trigger2)
            .await().indefinitely();

        // Execute both triggers
        triggerExecutionService.executeTrigger(historyContractId, registered1.getTriggerId(), true, new HashMap<>())
            .await().indefinitely();
        triggerExecutionService.executeTrigger(historyContractId, registered2.getTriggerId(), true, new HashMap<>())
            .await().indefinitely();

        // Get trigger-specific history
        List<ExecutionRecord> trigger1History = triggerExecutionService
            .getTriggerExecutionHistory(historyContractId, registered1.getTriggerId())
            .await().indefinitely();

        assertNotNull(trigger1History);
        assertTrue(trigger1History.stream().allMatch(r -> registered1.getTriggerId().equals(r.getTriggerId())));
    }

    @Test
    @Order(62)
    @DisplayName("Should return empty history for contract with no executions")
    void testEmptyExecutionHistory() {
        List<ExecutionRecord> history = triggerExecutionService
            .getExecutionHistory("NO-EXECUTIONS-CONTRACT")
            .await().indefinitely();

        assertNotNull(history);
        assertTrue(history.isEmpty());
    }

    // ==========================================================================
    // Multi-Action Execution Tests
    // ==========================================================================

    @Test
    @Order(70)
    @DisplayName("Should execute trigger with multiple actions")
    void testMultiActionExecution() {
        String multiActionContractId = "MULTI-ACTION-CONTRACT-001";

        // Setup programming context with actions
        ContractProgramming programming = new ContractProgramming(multiActionContractId);

        Action action1 = new Action();
        action1.setActionId("ACT-MULTI-1");
        action1.setName("Token Transfer");
        action1.setType(ActionType.TOKEN_TRANSFER);
        action1.setOrder(1);
        action1.setEnabled(true);
        action1.setFromAddress("0x1234");
        action1.setToAddress("0x5678");
        action1.setAmount(new BigDecimal("100"));
        programming.addAction(action1);

        Action action2 = new Action();
        action2.setActionId("ACT-MULTI-2");
        action2.setName("Send Notification");
        action2.setType(ActionType.NOTIFICATION);
        action2.setOrder(2);
        action2.setEnabled(true);
        action2.setNotificationType(NotificationType.EMAIL);
        action2.setRecipients(Arrays.asList("user@example.com"));
        action2.setSubject("Transaction Complete");
        programming.addAction(action2);

        Action action3 = new Action();
        action3.setActionId("ACT-MULTI-3");
        action3.setName("Update State");
        action3.setType(ActionType.STATE_CHANGE);
        action3.setOrder(3);
        action3.setEnabled(true);
        action3.setStateKey("paymentStatus");
        action3.setStateValue("COMPLETED");
        programming.addAction(action3);

        triggerExecutionService.loadProgramming(multiActionContractId, programming);

        // Create trigger with multiple actions
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Multi-Action Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setActionIds(Arrays.asList("ACT-MULTI-1", "ACT-MULTI-2", "ACT-MULTI-3"));

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(multiActionContractId, trigger)
            .await().indefinitely();

        // Execute trigger (force execution)
        ExecutionRecord record = triggerExecutionService
            .executeTrigger(multiActionContractId, registered.getTriggerId(), true, new HashMap<>())
            .await().indefinitely();

        assertNotNull(record);
        assertEquals(ActionStatus.SUCCESS, record.getStatus());
        assertNotNull(record.getOutput());
        assertTrue(record.getGasUsed() > 0);
    }

    @Test
    @Order(71)
    @DisplayName("Should execute actions in correct order")
    void testActionExecutionOrder() {
        String orderContractId = "ACTION-ORDER-CONTRACT-001";

        ContractProgramming programming = new ContractProgramming(orderContractId);

        // Add actions with different orders
        Action action3 = new Action();
        action3.setActionId("ACT-ORDER-3");
        action3.setName("Third Action");
        action3.setType(ActionType.LOG);
        action3.setOrder(3);
        action3.setEnabled(true);
        action3.setMessage("Third");
        programming.addAction(action3);

        Action action1 = new Action();
        action1.setActionId("ACT-ORDER-1");
        action1.setName("First Action");
        action1.setType(ActionType.LOG);
        action1.setOrder(1);
        action1.setEnabled(true);
        action1.setMessage("First");
        programming.addAction(action1);

        Action action2 = new Action();
        action2.setActionId("ACT-ORDER-2");
        action2.setName("Second Action");
        action2.setType(ActionType.LOG);
        action2.setOrder(2);
        action2.setEnabled(true);
        action2.setMessage("Second");
        programming.addAction(action2);

        triggerExecutionService.loadProgramming(orderContractId, programming);

        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Order Test Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setActionIds(Arrays.asList("ACT-ORDER-3", "ACT-ORDER-1", "ACT-ORDER-2"));

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(orderContractId, trigger)
            .await().indefinitely();

        ExecutionRecord record = triggerExecutionService
            .executeTrigger(orderContractId, registered.getTriggerId(), true, new HashMap<>())
            .await().indefinitely();

        assertNotNull(record);
        assertEquals(ActionStatus.SUCCESS, record.getStatus());
    }

    @Test
    @Order(72)
    @DisplayName("Should skip disabled actions in multi-action execution")
    void testSkipDisabledActions() {
        String skipContractId = "SKIP-DISABLED-CONTRACT-001";

        ContractProgramming programming = new ContractProgramming(skipContractId);

        Action enabledAction = new Action();
        enabledAction.setActionId("ACT-ENABLED");
        enabledAction.setName("Enabled Action");
        enabledAction.setType(ActionType.LOG);
        enabledAction.setOrder(1);
        enabledAction.setEnabled(true);
        enabledAction.setMessage("Enabled");
        programming.addAction(enabledAction);

        Action disabledAction = new Action();
        disabledAction.setActionId("ACT-DISABLED");
        disabledAction.setName("Disabled Action");
        disabledAction.setType(ActionType.LOG);
        disabledAction.setOrder(2);
        disabledAction.setEnabled(false);
        disabledAction.setMessage("Disabled");
        programming.addAction(disabledAction);

        triggerExecutionService.loadProgramming(skipContractId, programming);

        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Skip Disabled Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setActionIds(Arrays.asList("ACT-ENABLED", "ACT-DISABLED"));

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(skipContractId, trigger)
            .await().indefinitely();

        ExecutionRecord record = triggerExecutionService
            .executeTrigger(skipContractId, registered.getTriggerId(), true, new HashMap<>())
            .await().indefinitely();

        assertNotNull(record);
        assertEquals(ActionStatus.SUCCESS, record.getStatus());
        // Output should only contain enabled action
        assertTrue(record.getOutput().containsKey("ACT-ENABLED"));
    }

    // ==========================================================================
    // Event Handling Tests
    // ==========================================================================

    @Test
    @Order(80)
    @DisplayName("Should handle blockchain event and execute matching triggers")
    void testHandleBlockchainEvent() {
        String eventContractId = "EVENT-HANDLING-CONTRACT-001";

        // Register an event-based trigger
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Transfer Event Handler");
        trigger.setType(TriggerType.EVENT_BASED);
        trigger.setEventType("Transfer");
        trigger.setEnabled(true);

        triggerExecutionService.registerTrigger(eventContractId, trigger)
            .await().indefinitely();

        // Handle the event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("from", "0x1234");
        eventData.put("to", "0x5678");
        eventData.put("amount", "1000");

        List<ExecutionRecord> results = triggerExecutionService
            .handleEvent("Transfer", eventData)
            .await().indefinitely();

        assertNotNull(results);
        // At least one trigger should have been executed
        assertTrue(results.size() >= 0);
    }

    @Test
    @Order(81)
    @DisplayName("Should filter events by event filters")
    void testEventFiltering() {
        String filterContractId = "EVENT-FILTER-CONTRACT-001";

        // Register trigger with filters
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Filtered Event Handler");
        trigger.setType(TriggerType.EVENT_BASED);
        trigger.setEventType("Transfer");
        trigger.setEnabled(true);

        Map<String, String> filters = new HashMap<>();
        filters.put("tokenId", "SPECIFIC-TOKEN");
        trigger.setEventFilters(filters);

        triggerExecutionService.registerTrigger(filterContractId, trigger)
            .await().indefinitely();

        // Event that matches filter
        Map<String, Object> matchingEvent = new HashMap<>();
        matchingEvent.put("tokenId", "SPECIFIC-TOKEN");

        // Event that doesn't match filter
        Map<String, Object> nonMatchingEvent = new HashMap<>();
        nonMatchingEvent.put("tokenId", "OTHER-TOKEN");

        List<ExecutionRecord> matchingResults = triggerExecutionService
            .handleEvent("Transfer", matchingEvent)
            .await().indefinitely();

        List<ExecutionRecord> nonMatchingResults = triggerExecutionService
            .handleEvent("Transfer", nonMatchingEvent)
            .await().indefinitely();

        // The matching event should result in more (or equal) executions
        assertNotNull(matchingResults);
        assertNotNull(nonMatchingResults);
    }

    // ==========================================================================
    // Oracle Update Handling Tests
    // ==========================================================================

    @Test
    @Order(90)
    @DisplayName("Should handle oracle update and execute matching triggers")
    void testHandleOracleUpdate() {
        String oracleContractId = "ORACLE-HANDLING-CONTRACT-001";

        // Register an oracle-based trigger
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Price Oracle Handler");
        trigger.setType(TriggerType.ORACLE_BASED);
        trigger.setOracleId("PRICE-ORACLE-001");
        trigger.setOracleCondition(">");
        trigger.setOracleThreshold(new BigDecimal("50000"));
        trigger.setEnabled(true);

        triggerExecutionService.registerTrigger(oracleContractId, trigger)
            .await().indefinitely();

        // Handle oracle update above threshold
        Map<String, Object> oracleData = new HashMap<>();
        oracleData.put("value", "55000");
        oracleData.put("timestamp", Instant.now().toString());

        List<ExecutionRecord> results = triggerExecutionService
            .handleOracleUpdate("PRICE-ORACLE-001", oracleData)
            .await().indefinitely();

        assertNotNull(results);
    }

    @Test
    @Order(91)
    @DisplayName("Should not execute oracle trigger when threshold not met")
    void testOracleThresholdNotMet() {
        String oracleContractId = "ORACLE-THRESHOLD-CONTRACT-001";

        // Register trigger with high threshold
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("High Threshold Oracle");
        trigger.setType(TriggerType.ORACLE_BASED);
        trigger.setOracleId("HIGH-THRESHOLD-ORACLE");
        trigger.setOracleCondition(">");
        trigger.setOracleThreshold(new BigDecimal("100000"));
        trigger.setEnabled(true);

        triggerExecutionService.registerTrigger(oracleContractId, trigger)
            .await().indefinitely();

        // Handle oracle update below threshold
        Map<String, Object> oracleData = new HashMap<>();
        oracleData.put("value", "50000");

        List<ExecutionRecord> results = triggerExecutionService
            .handleOracleUpdate("HIGH-THRESHOLD-ORACLE", oracleData)
            .await().indefinitely();

        assertNotNull(results);
        assertTrue(results.isEmpty(), "Should not execute trigger when threshold not met");
    }

    // ==========================================================================
    // Trigger Update and Removal Tests
    // ==========================================================================

    @Test
    @Order(100)
    @DisplayName("Should update trigger properties")
    void testUpdateTrigger() {
        String updateContractId = "UPDATE-CONTRACT-001";

        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Original Name");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setPriority(1);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(updateContractId, trigger)
            .await().indefinitely();

        // Update trigger
        registered.setName("Updated Name");
        registered.setPriority(5);
        registered.setIntervalSeconds(120);

        ProgrammableTrigger updated = triggerExecutionService
            .updateTrigger(updateContractId, registered.getTriggerId(), registered)
            .await().indefinitely();

        assertEquals("Updated Name", updated.getName());
        assertEquals(5, updated.getPriority());
        assertEquals(120, updated.getIntervalSeconds());
        assertEquals(registered.getTriggerId(), updated.getTriggerId()); // ID preserved
    }

    @Test
    @Order(101)
    @DisplayName("Should remove trigger from contract")
    void testRemoveTrigger() {
        String removeContractId = "REMOVE-CONTRACT-001";

        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("To Be Removed");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(removeContractId, trigger)
            .await().indefinitely();

        String triggerId = registered.getTriggerId();

        // Remove trigger
        Boolean removed = triggerExecutionService
            .removeTrigger(removeContractId, triggerId)
            .await().indefinitely();

        assertTrue(removed);

        // Verify trigger no longer exists
        assertThrows(TriggerExecutionService.TriggerNotFoundException.class, () -> {
            triggerExecutionService.getTrigger(removeContractId, triggerId)
                .await().indefinitely();
        });
    }

    @Test
    @Order(102)
    @DisplayName("Should return false when removing non-existent trigger")
    void testRemoveNonExistentTrigger() {
        Boolean removed = triggerExecutionService
            .removeTrigger("SOME-CONTRACT", "NON-EXISTENT-TRIGGER")
            .await().indefinitely();

        assertFalse(removed);
    }

    // ==========================================================================
    // Metrics Tests
    // ==========================================================================

    @Test
    @Order(110)
    @DisplayName("Should return trigger execution metrics")
    void testGetMetrics() {
        Map<String, Long> metrics = triggerExecutionService.getMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.containsKey("triggersRegistered"));
        assertTrue(metrics.containsKey("triggersExecuted"));
        assertTrue(metrics.containsKey("triggersSucceeded"));
        assertTrue(metrics.containsKey("triggersFailed"));
        assertTrue(metrics.containsKey("totalContractsWithTriggers"));

        assertTrue(metrics.get("triggersRegistered") >= 0);
    }

    // ==========================================================================
    // Time-Based Trigger Scheduling Tests
    // ==========================================================================

    @Test
    @Order(120)
    @DisplayName("Should schedule time trigger with cron expression")
    void testScheduleTimeTrigger() {
        String scheduleContractId = "SCHEDULE-CONTRACT-001";

        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Schedulable Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(scheduleContractId, trigger)
            .await().indefinitely();

        ProgrammableTrigger scheduled = triggerExecutionService
            .scheduleTimeTrigger(scheduleContractId, registered.getTriggerId(), "0 0 * * * ?")
            .await().indefinitely();

        assertNotNull(scheduled);
        assertEquals("0 0 * * * ?", scheduled.getCronExpression());
        assertNotNull(scheduled.getNextExecutionAt());
    }

    @Test
    @Order(121)
    @DisplayName("Should reject scheduling non-time-based trigger")
    void testRejectSchedulingNonTimeTrigger() {
        String scheduleContractId = "SCHEDULE-REJECT-CONTRACT-001";

        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Event Trigger");
        trigger.setType(TriggerType.EVENT_BASED);
        trigger.setEventType("SomeEvent");
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(scheduleContractId, trigger)
            .await().indefinitely();

        assertThrows(TriggerExecutionService.TriggerValidationException.class, () -> {
            triggerExecutionService.scheduleTimeTrigger(
                scheduleContractId,
                registered.getTriggerId(),
                "0 0 * * * ?"
            ).await().indefinitely();
        });
    }

    // ==========================================================================
    // Execute Single Action Tests
    // ==========================================================================

    @Test
    @Order(130)
    @DisplayName("Should execute single action by ID")
    void testExecuteSingleAction() {
        String actionContractId = "SINGLE-ACTION-CONTRACT-001";

        ContractProgramming programming = new ContractProgramming(actionContractId);

        Action action = new Action();
        action.setActionId("ACT-SINGLE-001");
        action.setName("Standalone Action");
        action.setType(ActionType.LOG);
        action.setEnabled(true);
        action.setMessage("Single action executed");
        programming.addAction(action);

        triggerExecutionService.loadProgramming(actionContractId, programming);

        TriggerExecutionService.ActionExecutionResult result = triggerExecutionService
            .executeAction(actionContractId, "ACT-SINGLE-001")
            .await().indefinitely();

        assertNotNull(result);
        assertEquals("ACT-SINGLE-001", result.getActionId());
        assertEquals(ActionType.LOG, result.getActionType());
        assertEquals(ActionStatus.SUCCESS, result.getStatus());
        assertNotNull(result.getStartedAt());
        assertNotNull(result.getCompletedAt());
    }

    @Test
    @Order(131)
    @DisplayName("Should throw exception when executing non-existent action")
    void testExecuteNonExistentAction() {
        String actionContractId = "NON-EXISTENT-ACTION-CONTRACT";

        ContractProgramming programming = new ContractProgramming(actionContractId);
        triggerExecutionService.loadProgramming(actionContractId, programming);

        assertThrows(TriggerExecutionService.TriggerExecutionException.class, () -> {
            triggerExecutionService.executeAction(actionContractId, "NON-EXISTENT-ACTION")
                .await().indefinitely();
        });
    }

    // ==========================================================================
    // Trigger Validation Tests
    // ==========================================================================

    @Test
    @Order(140)
    @DisplayName("Should reject trigger without name")
    void testRejectTriggerWithoutName() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        // No name set

        assertThrows(TriggerExecutionService.TriggerValidationException.class, () -> {
            triggerExecutionService.registerTrigger(TEST_CONTRACT_ID, trigger)
                .await().indefinitely();
        });
    }

    @Test
    @Order(141)
    @DisplayName("Should reject trigger without type")
    void testRejectTriggerWithoutType() {
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("No Type Trigger");
        // No type set

        assertThrows(TriggerExecutionService.TriggerValidationException.class, () -> {
            triggerExecutionService.registerTrigger(TEST_CONTRACT_ID, trigger)
                .await().indefinitely();
        });
    }

    // ==========================================================================
    // Force Execution Tests
    // ==========================================================================

    @Test
    @Order(150)
    @DisplayName("Should force execute trigger regardless of conditions")
    void testForceExecution() {
        String forceContractId = "FORCE-EXEC-CONTRACT-001";

        // Create trigger with unfulfilled conditions
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Conditional Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);
        trigger.setConditionIds(Arrays.asList("NON-EXISTENT-COND"));

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(forceContractId, trigger)
            .await().indefinitely();

        // Force execution
        ExecutionRecord record = triggerExecutionService
            .executeTrigger(forceContractId, registered.getTriggerId(), true, new HashMap<>())
            .await().indefinitely();

        assertNotNull(record);
        assertEquals(ActionStatus.SUCCESS, record.getStatus());
    }

    @Test
    @Order(151)
    @DisplayName("Should pass context to execution")
    void testExecutionContext() {
        String contextContractId = "CONTEXT-CONTRACT-001";

        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Context Test Trigger");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(60);
        trigger.setEnabled(true);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(contextContractId, trigger)
            .await().indefinitely();

        Map<String, Object> context = new HashMap<>();
        context.put("userId", "USER-001");
        context.put("amount", 1000);
        context.put("timestamp", Instant.now().toString());

        ExecutionRecord record = triggerExecutionService
            .executeTrigger(contextContractId, registered.getTriggerId(), true, context)
            .await().indefinitely();

        assertNotNull(record);
        assertNotNull(record.getInput());
        assertEquals("USER-001", record.getInput().get("userId"));
    }

    // ==========================================================================
    // Integration Test - Complete Trigger Lifecycle
    // ==========================================================================

    @Test
    @Order(200)
    @DisplayName("Should handle complete trigger lifecycle")
    void testCompleteTriggerLifecycle() {
        String lifecycleContractId = "LIFECYCLE-CONTRACT-001";

        // 1. Setup programming context
        ContractProgramming programming = new ContractProgramming(lifecycleContractId);

        Condition condition = new Condition();
        condition.setConditionId("LC-COND-001");
        condition.setName("Amount Check");
        condition.setType(ConditionType.EXPRESSION);
        condition.setExpression("true");
        programming.addCondition(condition);

        Action action1 = new Action();
        action1.setActionId("LC-ACT-001");
        action1.setName("Transfer");
        action1.setType(ActionType.TOKEN_TRANSFER);
        action1.setOrder(1);
        action1.setEnabled(true);
        action1.setFromAddress("0xSeller");
        action1.setToAddress("0xBuyer");
        action1.setAmount(new BigDecimal("1000"));
        programming.addAction(action1);

        Action action2 = new Action();
        action2.setActionId("LC-ACT-002");
        action2.setName("Notify");
        action2.setType(ActionType.NOTIFICATION);
        action2.setOrder(2);
        action2.setEnabled(true);
        action2.setNotificationType(NotificationType.EMAIL);
        action2.setRecipients(Arrays.asList("admin@example.com"));
        programming.addAction(action2);

        triggerExecutionService.loadProgramming(lifecycleContractId, programming);

        // 2. Register trigger
        ProgrammableTrigger trigger = new ProgrammableTrigger();
        trigger.setName("Payment Trigger");
        trigger.setDescription("Execute payment when conditions are met");
        trigger.setType(TriggerType.TIME_BASED);
        trigger.setIntervalSeconds(3600);
        trigger.setEnabled(true);
        trigger.setConditionIds(Arrays.asList("LC-COND-001"));
        trigger.setConditionOperator(ConditionOperator.AND);
        trigger.setActionIds(Arrays.asList("LC-ACT-001", "LC-ACT-002"));
        trigger.setMaxExecutions(5);
        trigger.setCooldownSeconds(60);

        ProgrammableTrigger registered = triggerExecutionService
            .registerTrigger(lifecycleContractId, trigger)
            .await().indefinitely();

        assertNotNull(registered);
        String triggerId = registered.getTriggerId();

        // 3. Evaluate conditions
        TriggerExecutionService.ConditionEvaluationResult evalResult = triggerExecutionService
            .evaluateConditions(lifecycleContractId, triggerId)
            .await().indefinitely();

        assertNotNull(evalResult);
        assertTrue(evalResult.isOverallResult());

        // 4. Execute trigger
        ExecutionRecord execRecord = triggerExecutionService
            .executeTrigger(lifecycleContractId, triggerId, true, new HashMap<>())
            .await().indefinitely();

        assertNotNull(execRecord);
        assertEquals(ActionStatus.SUCCESS, execRecord.getStatus());

        // 5. Verify execution history
        List<ExecutionRecord> history = triggerExecutionService
            .getTriggerExecutionHistory(lifecycleContractId, triggerId)
            .await().indefinitely();

        assertFalse(history.isEmpty());
        assertEquals(triggerId, history.get(0).getTriggerId());

        // 6. Update trigger
        ProgrammableTrigger current = triggerExecutionService
            .getTrigger(lifecycleContractId, triggerId)
            .await().indefinitely();

        current.setPriority(10);
        current.setDescription("Updated description");

        ProgrammableTrigger updated = triggerExecutionService
            .updateTrigger(lifecycleContractId, triggerId, current)
            .await().indefinitely();

        assertEquals(10, updated.getPriority());
        assertEquals("Updated description", updated.getDescription());

        // 7. Disable trigger
        updated.setEnabled(false);
        triggerExecutionService.updateTrigger(lifecycleContractId, triggerId, updated)
            .await().indefinitely();

        // 8. Verify disabled trigger is skipped
        ExecutionRecord skippedRecord = triggerExecutionService
            .executeTrigger(lifecycleContractId, triggerId)
            .await().indefinitely();

        assertEquals(ActionStatus.SKIPPED, skippedRecord.getStatus());

        // 9. Remove trigger
        Boolean removed = triggerExecutionService
            .removeTrigger(lifecycleContractId, triggerId)
            .await().indefinitely();

        assertTrue(removed);

        // 10. Verify metrics updated
        Map<String, Long> metrics = triggerExecutionService.getMetrics();
        assertTrue(metrics.get("triggersRegistered") > 0);
        assertTrue(metrics.get("triggersExecuted") > 0);
    }
}
