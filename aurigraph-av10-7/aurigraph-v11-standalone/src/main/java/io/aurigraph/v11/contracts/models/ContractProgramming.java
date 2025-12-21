package io.aurigraph.v11.contracts.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * ContractProgramming - Executable logic component of a Ricardian ActiveContract
 *
 * Contains the programmatic logic of a contract:
 * - Triggers: Events that initiate actions (time, event, oracle, manual)
 * - Conditions: IF/THEN logic for execution gates
 * - Actions: Executable operations (transfer, notify, state change)
 * - Workflows: Multi-step RBAC-based execution flows
 * - Events: Emitted events for audit and integration
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
public class ContractProgramming {

    @JsonProperty("programmingId")
    private String programmingId;

    @JsonProperty("contractId")
    private String contractId;

    // ==================== Triggers ====================

    @JsonProperty("triggers")
    private List<ProgrammableTrigger> triggers = new ArrayList<>();

    // ==================== Conditions ====================

    @JsonProperty("conditions")
    private List<Condition> conditions = new ArrayList<>();

    // ==================== Actions ====================

    @JsonProperty("actions")
    private List<Action> actions = new ArrayList<>();

    // ==================== Workflows ====================

    @JsonProperty("workflows")
    private List<Workflow> workflows = new ArrayList<>();

    // ==================== Events ====================

    @JsonProperty("events")
    private List<ContractEvent> events = new ArrayList<>();

    // ==================== Oracle Connections ====================

    @JsonProperty("oracleConnections")
    private List<OracleConnection> oracleConnections = new ArrayList<>();

    // ==================== EI Node Integrations ====================

    @JsonProperty("eiNodeIntegrations")
    private List<EINodeIntegration> eiNodeIntegrations = new ArrayList<>();

    // ==================== Execution State ====================

    @JsonProperty("executionHistory")
    private List<ExecutionRecord> executionHistory = new ArrayList<>();

    @JsonProperty("enabled")
    private boolean enabled = true;

    @JsonProperty("testMode")
    private boolean testMode = false;

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("updatedAt")
    private Instant updatedAt;

    // Default constructor
    public ContractProgramming() {
        this.programmingId = "PROG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // Constructor with contract ID
    public ContractProgramming(String contractId) {
        this();
        this.contractId = contractId;
    }

    // ==================== Nested Classes ====================

    /**
     * Programmable trigger definition
     */
    public static class ProgrammableTrigger {
        @JsonProperty("triggerId")
        private String triggerId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("description")
        private String description;

        @JsonProperty("type")
        private TriggerType type;

        @JsonProperty("enabled")
        private boolean enabled = true;

        @JsonProperty("priority")
        private int priority = 0;

        // Time-based trigger config
        @JsonProperty("cronExpression")
        private String cronExpression;

        @JsonProperty("scheduledAt")
        private Instant scheduledAt;

        @JsonProperty("intervalSeconds")
        private long intervalSeconds;

        // Event-based trigger config
        @JsonProperty("eventType")
        private String eventType;

        @JsonProperty("eventSource")
        private String eventSource;

        @JsonProperty("eventFilters")
        private Map<String, String> eventFilters = new HashMap<>();

        // Oracle-based trigger config
        @JsonProperty("oracleId")
        private String oracleId;

        @JsonProperty("oracleCondition")
        private String oracleCondition;

        @JsonProperty("oracleThreshold")
        private BigDecimal oracleThreshold;

        // Condition references
        @JsonProperty("conditionIds")
        private List<String> conditionIds = new ArrayList<>();

        @JsonProperty("conditionOperator")
        private ConditionOperator conditionOperator = ConditionOperator.AND;

        // Action references
        @JsonProperty("actionIds")
        private List<String> actionIds = new ArrayList<>();

        // Execution config
        @JsonProperty("maxExecutions")
        private int maxExecutions = -1; // -1 = unlimited

        @JsonProperty("executionCount")
        private int executionCount = 0;

        @JsonProperty("cooldownSeconds")
        private long cooldownSeconds = 0;

        @JsonProperty("lastExecutedAt")
        private Instant lastExecutedAt;

        @JsonProperty("nextExecutionAt")
        private Instant nextExecutionAt;

        public ProgrammableTrigger() {
            this.triggerId = "TRIG-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public ProgrammableTrigger(String name, TriggerType type) {
            this();
            this.name = name;
            this.type = type;
        }

        // Getters and setters
        public String getTriggerId() { return triggerId; }
        public void setTriggerId(String triggerId) { this.triggerId = triggerId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public TriggerType getType() { return type; }
        public void setType(TriggerType type) { this.type = type; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getPriority() { return priority; }
        public void setPriority(int priority) { this.priority = priority; }
        public String getCronExpression() { return cronExpression; }
        public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }
        public Instant getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
        public long getIntervalSeconds() { return intervalSeconds; }
        public void setIntervalSeconds(long intervalSeconds) { this.intervalSeconds = intervalSeconds; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getEventSource() { return eventSource; }
        public void setEventSource(String eventSource) { this.eventSource = eventSource; }
        public Map<String, String> getEventFilters() { return eventFilters; }
        public void setEventFilters(Map<String, String> eventFilters) { this.eventFilters = eventFilters; }
        public String getOracleId() { return oracleId; }
        public void setOracleId(String oracleId) { this.oracleId = oracleId; }
        public String getOracleCondition() { return oracleCondition; }
        public void setOracleCondition(String oracleCondition) { this.oracleCondition = oracleCondition; }
        public BigDecimal getOracleThreshold() { return oracleThreshold; }
        public void setOracleThreshold(BigDecimal oracleThreshold) { this.oracleThreshold = oracleThreshold; }
        public List<String> getConditionIds() { return conditionIds; }
        public void setConditionIds(List<String> conditionIds) { this.conditionIds = conditionIds; }
        public ConditionOperator getConditionOperator() { return conditionOperator; }
        public void setConditionOperator(ConditionOperator conditionOperator) { this.conditionOperator = conditionOperator; }
        public List<String> getActionIds() { return actionIds; }
        public void setActionIds(List<String> actionIds) { this.actionIds = actionIds; }
        public int getMaxExecutions() { return maxExecutions; }
        public void setMaxExecutions(int maxExecutions) { this.maxExecutions = maxExecutions; }
        public int getExecutionCount() { return executionCount; }
        public void setExecutionCount(int executionCount) { this.executionCount = executionCount; }
        public long getCooldownSeconds() { return cooldownSeconds; }
        public void setCooldownSeconds(long cooldownSeconds) { this.cooldownSeconds = cooldownSeconds; }
        public Instant getLastExecutedAt() { return lastExecutedAt; }
        public void setLastExecutedAt(Instant lastExecutedAt) { this.lastExecutedAt = lastExecutedAt; }
        public Instant getNextExecutionAt() { return nextExecutionAt; }
        public void setNextExecutionAt(Instant nextExecutionAt) { this.nextExecutionAt = nextExecutionAt; }

        public boolean canExecute() {
            if (!enabled) return false;
            if (maxExecutions > 0 && executionCount >= maxExecutions) return false;
            if (cooldownSeconds > 0 && lastExecutedAt != null) {
                Instant cooldownEnd = lastExecutedAt.plusSeconds(cooldownSeconds);
                if (Instant.now().isBefore(cooldownEnd)) return false;
            }
            return true;
        }
    }

    /**
     * Condition definition (IF/THEN logic)
     */
    public static class Condition {
        @JsonProperty("conditionId")
        private String conditionId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("description")
        private String description;

        @JsonProperty("type")
        private ConditionType type;

        // Simple comparison
        @JsonProperty("leftOperand")
        private String leftOperand; // Variable name or value

        @JsonProperty("operator")
        private ComparisonOperator operator;

        @JsonProperty("rightOperand")
        private String rightOperand;

        // Complex expression
        @JsonProperty("expression")
        private String expression; // SpEL or custom DSL

        // Data source
        @JsonProperty("dataSource")
        private String dataSource; // parameter, oracle, ei-node

        @JsonProperty("dataPath")
        private String dataPath; // JSON path to value

        // Sub-conditions for complex logic
        @JsonProperty("subConditions")
        private List<Condition> subConditions = new ArrayList<>();

        @JsonProperty("subConditionOperator")
        private ConditionOperator subConditionOperator = ConditionOperator.AND;

        @JsonProperty("lastEvaluated")
        private Instant lastEvaluated;

        @JsonProperty("lastResult")
        private Boolean lastResult;

        public Condition() {
            this.conditionId = "COND-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public Condition(String name, ConditionType type) {
            this();
            this.name = name;
            this.type = type;
        }

        // Getters and setters
        public String getConditionId() { return conditionId; }
        public void setConditionId(String conditionId) { this.conditionId = conditionId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public ConditionType getType() { return type; }
        public void setType(ConditionType type) { this.type = type; }
        public String getLeftOperand() { return leftOperand; }
        public void setLeftOperand(String leftOperand) { this.leftOperand = leftOperand; }
        public ComparisonOperator getOperator() { return operator; }
        public void setOperator(ComparisonOperator operator) { this.operator = operator; }
        public String getRightOperand() { return rightOperand; }
        public void setRightOperand(String rightOperand) { this.rightOperand = rightOperand; }
        public String getExpression() { return expression; }
        public void setExpression(String expression) { this.expression = expression; }
        public String getDataSource() { return dataSource; }
        public void setDataSource(String dataSource) { this.dataSource = dataSource; }
        public String getDataPath() { return dataPath; }
        public void setDataPath(String dataPath) { this.dataPath = dataPath; }
        public List<Condition> getSubConditions() { return subConditions; }
        public void setSubConditions(List<Condition> subConditions) { this.subConditions = subConditions; }
        public ConditionOperator getSubConditionOperator() { return subConditionOperator; }
        public void setSubConditionOperator(ConditionOperator subConditionOperator) { this.subConditionOperator = subConditionOperator; }
        public Instant getLastEvaluated() { return lastEvaluated; }
        public void setLastEvaluated(Instant lastEvaluated) { this.lastEvaluated = lastEvaluated; }
        public Boolean getLastResult() { return lastResult; }
        public void setLastResult(Boolean lastResult) { this.lastResult = lastResult; }
    }

    /**
     * Action definition (executable operation)
     */
    public static class Action {
        @JsonProperty("actionId")
        private String actionId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("description")
        private String description;

        @JsonProperty("type")
        private ActionType type;

        @JsonProperty("enabled")
        private boolean enabled = true;

        @JsonProperty("order")
        private int order = 0;

        // Token transfer config
        @JsonProperty("fromAddress")
        private String fromAddress;

        @JsonProperty("toAddress")
        private String toAddress;

        @JsonProperty("tokenId")
        private String tokenId;

        @JsonProperty("amount")
        private BigDecimal amount;

        @JsonProperty("amountExpression")
        private String amountExpression; // Dynamic amount calculation

        // Notification config
        @JsonProperty("notificationType")
        private NotificationType notificationType;

        @JsonProperty("recipients")
        private List<String> recipients = new ArrayList<>();

        @JsonProperty("subject")
        private String subject;

        @JsonProperty("message")
        private String message;

        @JsonProperty("templateId")
        private String templateId;

        // State change config
        @JsonProperty("stateKey")
        private String stateKey;

        @JsonProperty("stateValue")
        private String stateValue;

        @JsonProperty("stateExpression")
        private String stateExpression;

        // External call config
        @JsonProperty("externalContractAddress")
        private String externalContractAddress;

        @JsonProperty("externalMethod")
        private String externalMethod;

        @JsonProperty("externalParams")
        private Map<String, Object> externalParams = new HashMap<>();

        // Workflow config
        @JsonProperty("workflowId")
        private String workflowId;

        @JsonProperty("workflowInput")
        private Map<String, Object> workflowInput = new HashMap<>();

        // Escrow config
        @JsonProperty("escrowAction")
        private EscrowAction escrowAction;

        @JsonProperty("escrowCondition")
        private String escrowCondition;

        // Execution tracking
        @JsonProperty("executionCount")
        private int executionCount = 0;

        @JsonProperty("lastExecutedAt")
        private Instant lastExecutedAt;

        @JsonProperty("lastStatus")
        private ActionStatus lastStatus;

        @JsonProperty("retryOnFailure")
        private boolean retryOnFailure = false;

        @JsonProperty("maxRetries")
        private int maxRetries = 3;

        public Action() {
            this.actionId = "ACT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public Action(String name, ActionType type) {
            this();
            this.name = name;
            this.type = type;
        }

        // Getters and setters
        public String getActionId() { return actionId; }
        public void setActionId(String actionId) { this.actionId = actionId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public ActionType getType() { return type; }
        public void setType(ActionType type) { this.type = type; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getOrder() { return order; }
        public void setOrder(int order) { this.order = order; }
        public String getFromAddress() { return fromAddress; }
        public void setFromAddress(String fromAddress) { this.fromAddress = fromAddress; }
        public String getToAddress() { return toAddress; }
        public void setToAddress(String toAddress) { this.toAddress = toAddress; }
        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getAmountExpression() { return amountExpression; }
        public void setAmountExpression(String amountExpression) { this.amountExpression = amountExpression; }
        public NotificationType getNotificationType() { return notificationType; }
        public void setNotificationType(NotificationType notificationType) { this.notificationType = notificationType; }
        public List<String> getRecipients() { return recipients; }
        public void setRecipients(List<String> recipients) { this.recipients = recipients; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getTemplateId() { return templateId; }
        public void setTemplateId(String templateId) { this.templateId = templateId; }
        public String getStateKey() { return stateKey; }
        public void setStateKey(String stateKey) { this.stateKey = stateKey; }
        public String getStateValue() { return stateValue; }
        public void setStateValue(String stateValue) { this.stateValue = stateValue; }
        public String getStateExpression() { return stateExpression; }
        public void setStateExpression(String stateExpression) { this.stateExpression = stateExpression; }
        public String getExternalContractAddress() { return externalContractAddress; }
        public void setExternalContractAddress(String externalContractAddress) { this.externalContractAddress = externalContractAddress; }
        public String getExternalMethod() { return externalMethod; }
        public void setExternalMethod(String externalMethod) { this.externalMethod = externalMethod; }
        public Map<String, Object> getExternalParams() { return externalParams; }
        public void setExternalParams(Map<String, Object> externalParams) { this.externalParams = externalParams; }
        public String getWorkflowId() { return workflowId; }
        public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }
        public Map<String, Object> getWorkflowInput() { return workflowInput; }
        public void setWorkflowInput(Map<String, Object> workflowInput) { this.workflowInput = workflowInput; }
        public EscrowAction getEscrowAction() { return escrowAction; }
        public void setEscrowAction(EscrowAction escrowAction) { this.escrowAction = escrowAction; }
        public String getEscrowCondition() { return escrowCondition; }
        public void setEscrowCondition(String escrowCondition) { this.escrowCondition = escrowCondition; }
        public int getExecutionCount() { return executionCount; }
        public void setExecutionCount(int executionCount) { this.executionCount = executionCount; }
        public Instant getLastExecutedAt() { return lastExecutedAt; }
        public void setLastExecutedAt(Instant lastExecutedAt) { this.lastExecutedAt = lastExecutedAt; }
        public ActionStatus getLastStatus() { return lastStatus; }
        public void setLastStatus(ActionStatus lastStatus) { this.lastStatus = lastStatus; }
        public boolean isRetryOnFailure() { return retryOnFailure; }
        public void setRetryOnFailure(boolean retryOnFailure) { this.retryOnFailure = retryOnFailure; }
        public int getMaxRetries() { return maxRetries; }
        public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }
    }

    /**
     * Workflow definition (multi-step RBAC execution)
     */
    public static class Workflow {
        @JsonProperty("workflowId")
        private String workflowId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("description")
        private String description;

        @JsonProperty("type")
        private WorkflowType type;

        @JsonProperty("steps")
        private List<WorkflowStep> steps = new ArrayList<>();

        @JsonProperty("currentStepIndex")
        private int currentStepIndex = 0;

        @JsonProperty("status")
        private WorkflowStatus status = WorkflowStatus.PENDING;

        @JsonProperty("startedAt")
        private Instant startedAt;

        @JsonProperty("completedAt")
        private Instant completedAt;

        @JsonProperty("timeout")
        private long timeoutSeconds;

        public Workflow() {
            this.workflowId = "WF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getWorkflowId() { return workflowId; }
        public void setWorkflowId(String workflowId) { this.workflowId = workflowId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public WorkflowType getType() { return type; }
        public void setType(WorkflowType type) { this.type = type; }
        public List<WorkflowStep> getSteps() { return steps; }
        public void setSteps(List<WorkflowStep> steps) { this.steps = steps; }
        public int getCurrentStepIndex() { return currentStepIndex; }
        public void setCurrentStepIndex(int currentStepIndex) { this.currentStepIndex = currentStepIndex; }
        public WorkflowStatus getStatus() { return status; }
        public void setStatus(WorkflowStatus status) { this.status = status; }
        public Instant getStartedAt() { return startedAt; }
        public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
        public long getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(long timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    }

    /**
     * Workflow step
     */
    public static class WorkflowStep {
        @JsonProperty("stepId")
        private String stepId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("order")
        private int order;

        @JsonProperty("requiredRole")
        private String requiredRole; // RBAC role required

        @JsonProperty("requiredPartyId")
        private String requiredPartyId;

        @JsonProperty("actionIds")
        private List<String> actionIds = new ArrayList<>();

        @JsonProperty("status")
        private StepStatus status = StepStatus.PENDING;

        @JsonProperty("completedBy")
        private String completedBy;

        @JsonProperty("completedAt")
        private Instant completedAt;

        @JsonProperty("autoExecute")
        private boolean autoExecute = false;

        public WorkflowStep() {
            this.stepId = "STEP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getStepId() { return stepId; }
        public void setStepId(String stepId) { this.stepId = stepId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getOrder() { return order; }
        public void setOrder(int order) { this.order = order; }
        public String getRequiredRole() { return requiredRole; }
        public void setRequiredRole(String requiredRole) { this.requiredRole = requiredRole; }
        public String getRequiredPartyId() { return requiredPartyId; }
        public void setRequiredPartyId(String requiredPartyId) { this.requiredPartyId = requiredPartyId; }
        public List<String> getActionIds() { return actionIds; }
        public void setActionIds(List<String> actionIds) { this.actionIds = actionIds; }
        public StepStatus getStatus() { return status; }
        public void setStatus(StepStatus status) { this.status = status; }
        public String getCompletedBy() { return completedBy; }
        public void setCompletedBy(String completedBy) { this.completedBy = completedBy; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
        public boolean isAutoExecute() { return autoExecute; }
        public void setAutoExecute(boolean autoExecute) { this.autoExecute = autoExecute; }
    }

    /**
     * Contract event definition
     */
    public static class ContractEvent {
        @JsonProperty("eventId")
        private String eventId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("description")
        private String description;

        @JsonProperty("emittedOn")
        private List<String> emittedOn = new ArrayList<>(); // Trigger or action IDs

        @JsonProperty("parameters")
        private Map<String, String> parameters = new HashMap<>();

        @JsonProperty("indexed")
        private List<String> indexed = new ArrayList<>();

        public ContractEvent() {
            this.eventId = "EVT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public List<String> getEmittedOn() { return emittedOn; }
        public void setEmittedOn(List<String> emittedOn) { this.emittedOn = emittedOn; }
        public Map<String, String> getParameters() { return parameters; }
        public void setParameters(Map<String, String> parameters) { this.parameters = parameters; }
        public List<String> getIndexed() { return indexed; }
        public void setIndexed(List<String> indexed) { this.indexed = indexed; }
    }

    /**
     * Oracle connection configuration
     */
    public static class OracleConnection {
        @JsonProperty("oracleId")
        private String oracleId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("type")
        private OracleType type;

        @JsonProperty("endpoint")
        private String endpoint;

        @JsonProperty("dataPath")
        private String dataPath;

        @JsonProperty("refreshIntervalSeconds")
        private int refreshIntervalSeconds;

        @JsonProperty("lastValue")
        private String lastValue;

        @JsonProperty("lastUpdated")
        private Instant lastUpdated;

        public OracleConnection() {
            this.oracleId = "ORACLE-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getOracleId() { return oracleId; }
        public void setOracleId(String oracleId) { this.oracleId = oracleId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public OracleType getType() { return type; }
        public void setType(OracleType type) { this.type = type; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public String getDataPath() { return dataPath; }
        public void setDataPath(String dataPath) { this.dataPath = dataPath; }
        public int getRefreshIntervalSeconds() { return refreshIntervalSeconds; }
        public void setRefreshIntervalSeconds(int refreshIntervalSeconds) { this.refreshIntervalSeconds = refreshIntervalSeconds; }
        public String getLastValue() { return lastValue; }
        public void setLastValue(String lastValue) { this.lastValue = lastValue; }
        public Instant getLastUpdated() { return lastUpdated; }
        public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
    }

    /**
     * EI Node integration configuration
     */
    public static class EINodeIntegration {
        @JsonProperty("integrationId")
        private String integrationId;

        @JsonProperty("eiNodeId")
        private String eiNodeId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("type")
        private EINodeType type;

        @JsonProperty("endpoint")
        private String endpoint;

        @JsonProperty("credentials")
        private String credentials; // Encrypted reference

        @JsonProperty("dataMapping")
        private Map<String, String> dataMapping = new HashMap<>();

        @JsonProperty("enabled")
        private boolean enabled = true;

        @JsonProperty("lastSyncAt")
        private Instant lastSyncAt;

        public EINodeIntegration() {
            this.integrationId = "EI-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        // Getters and setters
        public String getIntegrationId() { return integrationId; }
        public void setIntegrationId(String integrationId) { this.integrationId = integrationId; }
        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public EINodeType getType() { return type; }
        public void setType(EINodeType type) { this.type = type; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public String getCredentials() { return credentials; }
        public void setCredentials(String credentials) { this.credentials = credentials; }
        public Map<String, String> getDataMapping() { return dataMapping; }
        public void setDataMapping(Map<String, String> dataMapping) { this.dataMapping = dataMapping; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public Instant getLastSyncAt() { return lastSyncAt; }
        public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    }

    /**
     * Execution record for audit trail
     */
    public static class ExecutionRecord {
        @JsonProperty("recordId")
        private String recordId;

        @JsonProperty("triggerId")
        private String triggerId;

        @JsonProperty("actionId")
        private String actionId;

        @JsonProperty("executedAt")
        private Instant executedAt;

        @JsonProperty("status")
        private ActionStatus status;

        @JsonProperty("input")
        private Map<String, Object> input = new HashMap<>();

        @JsonProperty("output")
        private Map<String, Object> output = new HashMap<>();

        @JsonProperty("error")
        private String error;

        @JsonProperty("transactionHash")
        private String transactionHash;

        @JsonProperty("gasUsed")
        private long gasUsed;

        public ExecutionRecord() {
            this.recordId = "EXEC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.executedAt = Instant.now();
        }

        // Getters and setters
        public String getRecordId() { return recordId; }
        public void setRecordId(String recordId) { this.recordId = recordId; }
        public String getTriggerId() { return triggerId; }
        public void setTriggerId(String triggerId) { this.triggerId = triggerId; }
        public String getActionId() { return actionId; }
        public void setActionId(String actionId) { this.actionId = actionId; }
        public Instant getExecutedAt() { return executedAt; }
        public void setExecutedAt(Instant executedAt) { this.executedAt = executedAt; }
        public ActionStatus getStatus() { return status; }
        public void setStatus(ActionStatus status) { this.status = status; }
        public Map<String, Object> getInput() { return input; }
        public void setInput(Map<String, Object> input) { this.input = input; }
        public Map<String, Object> getOutput() { return output; }
        public void setOutput(Map<String, Object> output) { this.output = output; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        public String getTransactionHash() { return transactionHash; }
        public void setTransactionHash(String transactionHash) { this.transactionHash = transactionHash; }
        public long getGasUsed() { return gasUsed; }
        public void setGasUsed(long gasUsed) { this.gasUsed = gasUsed; }
    }

    // ==================== Enums ====================

    public enum TriggerType {
        TIME_BASED,         // At specific date/time or interval
        EVENT_BASED,        // On blockchain event
        ORACLE_BASED,       // On external data update
        MANUAL,             // Requires user action
        CONDITIONAL,        // Based on parameter value
        MILESTONE,          // On milestone completion
        SIGNATURE           // On signature received
    }

    public enum ConditionType {
        SIMPLE,             // Simple comparison
        EXPRESSION,         // Complex expression
        COMPOSITE,          // Multiple sub-conditions
        TIME_WINDOW,        // Within time range
        THRESHOLD,          // Value threshold
        STATE               // Contract state check
    }

    public enum ConditionOperator {
        AND,
        OR,
        NOT,
        XOR
    }

    public enum ComparisonOperator {
        EQUALS,
        NOT_EQUALS,
        GREATER_THAN,
        LESS_THAN,
        GREATER_OR_EQUAL,
        LESS_OR_EQUAL,
        CONTAINS,
        STARTS_WITH,
        ENDS_WITH,
        REGEX_MATCH,
        IN,
        NOT_IN
    }

    public enum ActionType {
        TOKEN_TRANSFER,     // Transfer tokens between parties
        NOTIFICATION,       // Send notification
        STATE_CHANGE,       // Update contract state
        EXTERNAL_CALL,      // Call external contract
        WORKFLOW_START,     // Start RBAC workflow
        ESCROW_RELEASE,     // Release escrowed assets
        ESCROW_LOCK,        // Lock assets in escrow
        MINT_TOKEN,         // Mint new tokens
        BURN_TOKEN,         // Burn tokens
        EMIT_EVENT,         // Emit contract event
        LOG,                // Add audit log entry
        CUSTOM              // Custom action
    }

    public enum NotificationType {
        EMAIL,
        WEBHOOK,
        SMS,
        PUSH,
        IN_APP,
        BLOCKCHAIN_EVENT
    }

    public enum EscrowAction {
        DEPOSIT,
        RELEASE,
        REFUND,
        PARTIAL_RELEASE
    }

    public enum ActionStatus {
        PENDING,
        EXECUTING,
        SUCCESS,
        FAILED,
        RETRYING,
        CANCELLED,
        SKIPPED
    }

    public enum WorkflowType {
        SEQUENTIAL,         // Steps in order
        PARALLEL,           // Steps can run in parallel
        CONDITIONAL,        // Branch based on conditions
        APPROVAL            // Multi-party approval
    }

    public enum WorkflowStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        CANCELLED,
        TIMED_OUT
    }

    public enum StepStatus {
        PENDING,
        WAITING_APPROVAL,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        SKIPPED
    }

    public enum OracleType {
        CHAINLINK,
        BAND_PROTOCOL,
        AURIGRAPH_EI,
        CUSTOM_API,
        IOT_GATEWAY
    }

    public enum EINodeType {
        CRYPTO_EXCHANGE,    // Binance, Coinbase
        CARBON_REGISTRY,    // Verra, Gold Standard
        LAND_REGISTRY,      // Government registry
        IOT_GATEWAY,        // IoT data
        ORACLE,             // Chainlink, Band
        CUSTOM              // Custom integration
    }

    // ==================== Utility Methods ====================

    public ProgrammableTrigger getTriggerById(String triggerId) {
        return triggers.stream()
            .filter(t -> triggerId.equals(t.getTriggerId()))
            .findFirst()
            .orElse(null);
    }

    public Condition getConditionById(String conditionId) {
        return conditions.stream()
            .filter(c -> conditionId.equals(c.getConditionId()))
            .findFirst()
            .orElse(null);
    }

    public Action getActionById(String actionId) {
        return actions.stream()
            .filter(a -> actionId.equals(a.getActionId()))
            .findFirst()
            .orElse(null);
    }

    public Workflow getWorkflowById(String workflowId) {
        return workflows.stream()
            .filter(w -> workflowId.equals(w.getWorkflowId()))
            .findFirst()
            .orElse(null);
    }

    public void addTrigger(ProgrammableTrigger trigger) {
        triggers.add(trigger);
        this.updatedAt = Instant.now();
    }

    public void addCondition(Condition condition) {
        conditions.add(condition);
        this.updatedAt = Instant.now();
    }

    public void addAction(Action action) {
        actions.add(action);
        this.updatedAt = Instant.now();
    }

    public void addWorkflow(Workflow workflow) {
        workflows.add(workflow);
        this.updatedAt = Instant.now();
    }

    public void addExecutionRecord(ExecutionRecord record) {
        executionHistory.add(record);
    }

    // ==================== Getters and Setters ====================

    public String getProgrammingId() { return programmingId; }
    public void setProgrammingId(String programmingId) { this.programmingId = programmingId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public List<ProgrammableTrigger> getTriggers() { return triggers; }
    public void setTriggers(List<ProgrammableTrigger> triggers) { this.triggers = triggers; }

    public List<Condition> getConditions() { return conditions; }
    public void setConditions(List<Condition> conditions) { this.conditions = conditions; }

    public List<Action> getActions() { return actions; }
    public void setActions(List<Action> actions) { this.actions = actions; }

    public List<Workflow> getWorkflows() { return workflows; }
    public void setWorkflows(List<Workflow> workflows) { this.workflows = workflows; }

    public List<ContractEvent> getEvents() { return events; }
    public void setEvents(List<ContractEvent> events) { this.events = events; }

    public List<OracleConnection> getOracleConnections() { return oracleConnections; }
    public void setOracleConnections(List<OracleConnection> oracleConnections) { this.oracleConnections = oracleConnections; }

    public List<EINodeIntegration> getEiNodeIntegrations() { return eiNodeIntegrations; }
    public void setEiNodeIntegrations(List<EINodeIntegration> eiNodeIntegrations) { this.eiNodeIntegrations = eiNodeIntegrations; }

    public List<ExecutionRecord> getExecutionHistory() { return executionHistory; }
    public void setExecutionHistory(List<ExecutionRecord> executionHistory) { this.executionHistory = executionHistory; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public boolean isTestMode() { return testMode; }
    public void setTestMode(boolean testMode) { this.testMode = testMode; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return String.format("ContractProgramming{id='%s', contractId='%s', triggers=%d, conditions=%d, actions=%d, workflows=%d}",
            programmingId, contractId, triggers.size(), conditions.size(), actions.size(), workflows.size());
    }
}
