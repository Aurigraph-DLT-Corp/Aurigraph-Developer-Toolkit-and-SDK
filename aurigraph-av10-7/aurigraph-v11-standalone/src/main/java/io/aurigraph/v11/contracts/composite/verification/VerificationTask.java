package io.aurigraph.v11.contracts.composite.verification;

import io.aurigraph.v11.contracts.composite.VerificationLevel;
import io.aurigraph.v11.contracts.composite.VerifierTier;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Verification Task - Represents an assigned verification task to a third-party verifier
 *
 * Manages the complete lifecycle of a verification assignment including:
 * - Task creation and assignment
 * - Progress tracking and milestones
 * - Deliverable management
 * - Timeline and SLA tracking
 * - Communication and RFI handling
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Third-Party Verification)
 */
public class VerificationTask {

    private final String taskId;
    private final String workflowId;
    private final String compositeId;
    private final String assetId;
    private String verifierId;
    private String serviceId;
    private TaskStatus status;
    private TaskPriority priority;

    // Assignment details
    private AssignmentDetails assignment;
    private TaskScope scope;
    private TaskTimeline timeline;
    private TaskPricing pricing;

    // Progress tracking
    private List<TaskMilestone> milestones;
    private List<TaskChecklist> checklists;
    private BigDecimal progressPercent;
    private String currentPhase;

    // Deliverables
    private List<TaskDeliverable> deliverables;
    private List<TaskAttachment> attachments;

    // Communication
    private List<TaskComment> comments;
    private List<String> rfiIds;  // References to RFI records

    // Audit
    private List<TaskEvent> eventLog;
    private Instant createdAt;
    private Instant lastUpdated;
    private String createdBy;

    public VerificationTask(String workflowId, String compositeId, String assetId) {
        this.taskId = "TASK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        this.workflowId = workflowId;
        this.compositeId = compositeId;
        this.assetId = assetId;
        this.status = TaskStatus.CREATED;
        this.priority = TaskPriority.NORMAL;
        this.milestones = new ArrayList<>();
        this.checklists = new ArrayList<>();
        this.deliverables = new ArrayList<>();
        this.attachments = new ArrayList<>();
        this.comments = new ArrayList<>();
        this.rfiIds = new ArrayList<>();
        this.eventLog = new ArrayList<>();
        this.progressPercent = BigDecimal.ZERO;
        this.createdAt = Instant.now();
        this.lastUpdated = Instant.now();

        addEvent(TaskEventType.TASK_CREATED, "system", "Task created");
    }

    // ==================== TASK STATUS ====================

    public enum TaskStatus {
        CREATED,              // Task created, not yet assigned
        PENDING_ASSIGNMENT,   // Waiting for verifier assignment
        ASSIGNED,             // Assigned to verifier
        ACCEPTED,             // Verifier accepted the task
        REJECTED,             // Verifier rejected the task
        IN_PROGRESS,          // Work in progress
        PENDING_INFO,         // Waiting for information (RFI sent)
        ON_HOLD,              // Task on hold
        UNDER_REVIEW,         // Internal review by verifier
        PENDING_APPROVAL,     // Submitted, pending client approval
        REVISION_REQUESTED,   // Client requested revisions
        COMPLETED,            // Task completed successfully
        CANCELLED,            // Task cancelled
        EXPIRED,              // Task expired (deadline passed)
        DISPUTED              // Under dispute resolution
    }

    public enum TaskPriority {
        LOW(1),
        NORMAL(2),
        HIGH(3),
        URGENT(4),
        CRITICAL(5);

        private final int level;
        TaskPriority(int level) { this.level = level; }
        public int getLevel() { return level; }
    }

    // ==================== ASSIGNMENT DETAILS ====================

    public static class AssignmentDetails {
        private String assignedVerifierId;
        private String assignedVerifierName;
        private VerifierTier verifierTier;
        private Instant assignedAt;
        private Instant acceptedAt;
        private String assignmentNotes;
        private AssignmentMethod assignmentMethod;
        private List<String> previousVerifiers;  // If reassigned
        private String reassignmentReason;

        public AssignmentDetails() {
            this.previousVerifiers = new ArrayList<>();
        }

        public enum AssignmentMethod {
            AUTOMATIC,      // System assigned based on matching
            MANUAL,         // Manually assigned by admin
            BID_SELECTION,  // Selected from bids
            ROTATION,       // Round-robin assignment
            SPECIALIZED     // Specialized verifier requested
        }

        // Builder pattern
        public AssignmentDetails verifierId(String id) { this.assignedVerifierId = id; return this; }
        public AssignmentDetails verifierName(String name) { this.assignedVerifierName = name; return this; }
        public AssignmentDetails tier(VerifierTier tier) { this.verifierTier = tier; return this; }
        public AssignmentDetails assignedAt(Instant time) { this.assignedAt = time; return this; }
        public AssignmentDetails acceptedAt(Instant time) { this.acceptedAt = time; return this; }
        public AssignmentDetails notes(String notes) { this.assignmentNotes = notes; return this; }
        public AssignmentDetails method(AssignmentMethod method) { this.assignmentMethod = method; return this; }

        // Getters
        public String getAssignedVerifierId() { return assignedVerifierId; }
        public String getAssignedVerifierName() { return assignedVerifierName; }
        public VerifierTier getVerifierTier() { return verifierTier; }
        public Instant getAssignedAt() { return assignedAt; }
        public Instant getAcceptedAt() { return acceptedAt; }
        public String getAssignmentNotes() { return assignmentNotes; }
        public AssignmentMethod getAssignmentMethod() { return assignmentMethod; }
        public List<String> getPreviousVerifiers() { return previousVerifiers; }
        public String getReassignmentReason() { return reassignmentReason; }
        public void setReassignmentReason(String reason) { this.reassignmentReason = reason; }
    }

    // ==================== TASK SCOPE ====================

    public static class TaskScope {
        private String scopeDescription;
        private VerificationLevel requiredLevel;
        private List<VerifierServiceCatalog.ServiceType> requiredServices;
        private List<String> specificRequirements;
        private List<String> exclusions;
        private String assetType;
        private String jurisdiction;
        private BigDecimal assetValue;
        private Map<String, Object> assetDetails;
        private List<String> accessRequirements;
        private boolean siteVisitRequired;
        private String siteAddress;
        private Map<String, String> contactInformation;

        public TaskScope() {
            this.requiredServices = new ArrayList<>();
            this.specificRequirements = new ArrayList<>();
            this.exclusions = new ArrayList<>();
            this.assetDetails = new HashMap<>();
            this.accessRequirements = new ArrayList<>();
            this.contactInformation = new HashMap<>();
        }

        // Builder pattern
        public TaskScope description(String desc) { this.scopeDescription = desc; return this; }
        public TaskScope requiredLevel(VerificationLevel level) { this.requiredLevel = level; return this; }
        public TaskScope addService(VerifierServiceCatalog.ServiceType service) {
            this.requiredServices.add(service); return this;
        }
        public TaskScope addRequirement(String req) { this.specificRequirements.add(req); return this; }
        public TaskScope addExclusion(String exc) { this.exclusions.add(exc); return this; }
        public TaskScope assetType(String type) { this.assetType = type; return this; }
        public TaskScope jurisdiction(String j) { this.jurisdiction = j; return this; }
        public TaskScope assetValue(BigDecimal value) { this.assetValue = value; return this; }
        public TaskScope siteVisitRequired(boolean required) { this.siteVisitRequired = required; return this; }
        public TaskScope siteAddress(String address) { this.siteAddress = address; return this; }
        public TaskScope addContact(String role, String contact) {
            this.contactInformation.put(role, contact); return this;
        }

        // Getters
        public String getScopeDescription() { return scopeDescription; }
        public VerificationLevel getRequiredLevel() { return requiredLevel; }
        public List<VerifierServiceCatalog.ServiceType> getRequiredServices() { return requiredServices; }
        public List<String> getSpecificRequirements() { return specificRequirements; }
        public List<String> getExclusions() { return exclusions; }
        public String getAssetType() { return assetType; }
        public String getJurisdiction() { return jurisdiction; }
        public BigDecimal getAssetValue() { return assetValue; }
        public Map<String, Object> getAssetDetails() { return assetDetails; }
        public List<String> getAccessRequirements() { return accessRequirements; }
        public boolean isSiteVisitRequired() { return siteVisitRequired; }
        public String getSiteAddress() { return siteAddress; }
        public Map<String, String> getContactInformation() { return contactInformation; }
    }

    // ==================== TASK TIMELINE ====================

    public static class TaskTimeline {
        private Instant createdAt;
        private Instant dueDate;
        private Instant targetCompletionDate;
        private Instant actualStartDate;
        private Instant actualCompletionDate;
        private Duration estimatedDuration;
        private Duration actualDuration;
        private boolean isExpress;
        private int extensionCount;
        private List<TimelineExtension> extensions;
        private SLAConfiguration sla;

        public TaskTimeline() {
            this.extensions = new ArrayList<>();
            this.extensionCount = 0;
        }

        public boolean isOverdue() {
            if (actualCompletionDate != null) return false;
            return dueDate != null && Instant.now().isAfter(dueDate);
        }

        public Duration getRemainingTime() {
            if (actualCompletionDate != null || dueDate == null) {
                return Duration.ZERO;
            }
            Duration remaining = Duration.between(Instant.now(), dueDate);
            return remaining.isNegative() ? Duration.ZERO : remaining;
        }

        // Builder pattern
        public TaskTimeline createdAt(Instant time) { this.createdAt = time; return this; }
        public TaskTimeline dueDate(Instant date) { this.dueDate = date; return this; }
        public TaskTimeline targetCompletionDate(Instant date) { this.targetCompletionDate = date; return this; }
        public TaskTimeline estimatedDuration(Duration duration) { this.estimatedDuration = duration; return this; }
        public TaskTimeline express(boolean isExpress) { this.isExpress = isExpress; return this; }
        public TaskTimeline sla(SLAConfiguration sla) { this.sla = sla; return this; }

        public void recordStart() { this.actualStartDate = Instant.now(); }
        public void recordCompletion() {
            this.actualCompletionDate = Instant.now();
            if (actualStartDate != null) {
                this.actualDuration = Duration.between(actualStartDate, actualCompletionDate);
            }
        }

        public void addExtension(TimelineExtension extension) {
            this.extensions.add(extension);
            this.extensionCount++;
            if (extension.newDueDate != null) {
                this.dueDate = extension.newDueDate;
            }
        }

        // Getters
        public Instant getCreatedAt() { return createdAt; }
        public Instant getDueDate() { return dueDate; }
        public Instant getTargetCompletionDate() { return targetCompletionDate; }
        public Instant getActualStartDate() { return actualStartDate; }
        public Instant getActualCompletionDate() { return actualCompletionDate; }
        public Duration getEstimatedDuration() { return estimatedDuration; }
        public Duration getActualDuration() { return actualDuration; }
        public boolean isExpress() { return isExpress; }
        public int getExtensionCount() { return extensionCount; }
        public List<TimelineExtension> getExtensions() { return extensions; }
        public SLAConfiguration getSla() { return sla; }
    }

    public static class TimelineExtension {
        public String extensionId;
        public Instant previousDueDate;
        public Instant newDueDate;
        public String reason;
        public String approvedBy;
        public Instant approvedAt;

        public TimelineExtension(Instant previousDue, Instant newDue, String reason) {
            this.extensionId = "EXT-" + UUID.randomUUID().toString().substring(0, 8);
            this.previousDueDate = previousDue;
            this.newDueDate = newDue;
            this.reason = reason;
        }
    }

    public static class SLAConfiguration {
        public Duration maxDuration;
        public Duration warningThreshold;
        public Duration criticalThreshold;
        public int maxExtensions;
        public BigDecimal latePenaltyPercent;
        public BigDecimal earlyBonusPercent;

        public SLAConfiguration() {
            this.maxDuration = Duration.ofDays(7);
            this.warningThreshold = Duration.ofDays(2);
            this.criticalThreshold = Duration.ofHours(12);
            this.maxExtensions = 2;
            this.latePenaltyPercent = BigDecimal.valueOf(5);
            this.earlyBonusPercent = BigDecimal.valueOf(2);
        }
    }

    // ==================== TASK PRICING ====================

    public static class TaskPricing {
        private String quoteId;
        private BigDecimal basePrice;
        private BigDecimal expressMultiplier;
        private BigDecimal complexityMultiplier;
        private List<PricingLineItem> lineItems;
        private List<PricingAdjustment> adjustments;
        private BigDecimal subtotal;
        private BigDecimal discount;
        private BigDecimal tax;
        private BigDecimal totalPrice;
        private String currency;
        private PaymentTerms paymentTerms;
        private PaymentStatus paymentStatus;
        private List<Payment> payments;

        public TaskPricing() {
            this.lineItems = new ArrayList<>();
            this.adjustments = new ArrayList<>();
            this.payments = new ArrayList<>();
            this.currency = "USD";
            this.paymentStatus = PaymentStatus.PENDING;
            this.expressMultiplier = BigDecimal.ONE;
            this.complexityMultiplier = BigDecimal.ONE;
        }

        public void calculateTotal() {
            this.subtotal = lineItems.stream()
                .map(item -> item.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal adjustmentTotal = adjustments.stream()
                .map(adj -> adj.isDiscount ? adj.amount.negate() : adj.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal afterAdjustments = subtotal.add(adjustmentTotal);

            // Apply multipliers
            afterAdjustments = afterAdjustments
                .multiply(expressMultiplier)
                .multiply(complexityMultiplier);

            this.discount = adjustments.stream()
                .filter(adj -> adj.isDiscount)
                .map(adj -> adj.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Calculate tax if applicable
            if (tax == null) tax = BigDecimal.ZERO;

            this.totalPrice = afterAdjustments.add(tax);
        }

        public void addLineItem(PricingLineItem item) {
            this.lineItems.add(item);
            calculateTotal();
        }

        public void addAdjustment(PricingAdjustment adjustment) {
            this.adjustments.add(adjustment);
            calculateTotal();
        }

        public void recordPayment(Payment payment) {
            this.payments.add(payment);
            BigDecimal totalPaid = payments.stream()
                .filter(p -> p.status == Payment.PaymentStatus.COMPLETED)
                .map(p -> p.amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalPaid.compareTo(totalPrice) >= 0) {
                this.paymentStatus = PaymentStatus.PAID;
            } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                this.paymentStatus = PaymentStatus.PARTIAL;
            }
        }

        // Getters
        public String getQuoteId() { return quoteId; }
        public BigDecimal getBasePrice() { return basePrice; }
        public BigDecimal getSubtotal() { return subtotal; }
        public BigDecimal getDiscount() { return discount; }
        public BigDecimal getTax() { return tax; }
        public BigDecimal getTotalPrice() { return totalPrice; }
        public String getCurrency() { return currency; }
        public PaymentTerms getPaymentTerms() { return paymentTerms; }
        public PaymentStatus getPaymentStatus() { return paymentStatus; }
        public List<Payment> getPayments() { return payments; }
        public List<PricingLineItem> getLineItems() { return lineItems; }
        public List<PricingAdjustment> getAdjustments() { return adjustments; }

        // Setters
        public void setQuoteId(String id) { this.quoteId = id; }
        public void setBasePrice(BigDecimal price) { this.basePrice = price; }
        public void setExpressMultiplier(BigDecimal mult) { this.expressMultiplier = mult; }
        public void setComplexityMultiplier(BigDecimal mult) { this.complexityMultiplier = mult; }
        public void setCurrency(String currency) { this.currency = currency; }
        public void setPaymentTerms(PaymentTerms terms) { this.paymentTerms = terms; }
        public void setTax(BigDecimal tax) { this.tax = tax; calculateTotal(); }
    }

    public static class PricingLineItem {
        public String itemId;
        public String description;
        public String serviceId;
        public int quantity;
        public BigDecimal unitPrice;
        public BigDecimal amount;

        public PricingLineItem(String description, BigDecimal amount) {
            this.itemId = "LI-" + UUID.randomUUID().toString().substring(0, 8);
            this.description = description;
            this.quantity = 1;
            this.unitPrice = amount;
            this.amount = amount;
        }
    }

    public static class PricingAdjustment {
        public String adjustmentId;
        public String description;
        public AdjustmentType type;
        public BigDecimal amount;
        public boolean isDiscount;

        public PricingAdjustment(String description, AdjustmentType type, BigDecimal amount, boolean isDiscount) {
            this.adjustmentId = "ADJ-" + UUID.randomUUID().toString().substring(0, 8);
            this.description = description;
            this.type = type;
            this.amount = amount;
            this.isDiscount = isDiscount;
        }

        public enum AdjustmentType {
            VOLUME_DISCOUNT,
            LOYALTY_DISCOUNT,
            RUSH_FEE,
            WEEKEND_FEE,
            COMPLEXITY_SURCHARGE,
            TRAVEL_EXPENSES,
            SPECIAL_EQUIPMENT,
            EXPEDITED_PROCESSING,
            PENALTY,
            BONUS
        }
    }

    public enum PaymentStatus {
        PENDING,
        INVOICED,
        PARTIAL,
        PAID,
        OVERDUE,
        REFUNDED,
        DISPUTED
    }

    public static class PaymentTerms {
        public PaymentType paymentType;
        public int netDays;
        public BigDecimal depositPercent;
        public BigDecimal milestonePercent;
        public BigDecimal finalPercent;
        public boolean escrowRequired;
        public String escrowProvider;

        public PaymentTerms() {
            this.paymentType = PaymentType.NET_30;
            this.netDays = 30;
        }

        public enum PaymentType {
            PREPAID,
            NET_15,
            NET_30,
            NET_45,
            NET_60,
            MILESTONE_BASED,
            ESCROW
        }
    }

    public static class Payment {
        public String paymentId;
        public BigDecimal amount;
        public String currency;
        public PaymentMethod method;
        public PaymentStatus status;
        public Instant paidAt;
        public String transactionId;
        public String reference;

        public Payment(BigDecimal amount, PaymentMethod method) {
            this.paymentId = "PAY-" + UUID.randomUUID().toString().substring(0, 8);
            this.amount = amount;
            this.method = method;
            this.currency = "USD";
            this.status = PaymentStatus.PENDING;
        }

        public enum PaymentMethod {
            BANK_TRANSFER,
            CREDIT_CARD,
            CRYPTO,
            ESCROW_RELEASE,
            PLATFORM_CREDIT
        }

        public enum PaymentStatus {
            PENDING,
            PROCESSING,
            COMPLETED,
            FAILED,
            REFUNDED
        }
    }

    // ==================== MILESTONES & CHECKLISTS ====================

    public static class TaskMilestone {
        private String milestoneId;
        private String name;
        private String description;
        private int sequenceNumber;
        private MilestoneStatus status;
        private BigDecimal progressWeight;  // % of overall progress
        private Instant targetDate;
        private Instant completedDate;
        private String completedBy;
        private List<String> deliverableIds;
        private boolean requiresApproval;
        private String approvedBy;

        public TaskMilestone(String name, int sequence, BigDecimal weight) {
            this.milestoneId = "MS-" + UUID.randomUUID().toString().substring(0, 8);
            this.name = name;
            this.sequenceNumber = sequence;
            this.progressWeight = weight;
            this.status = MilestoneStatus.PENDING;
            this.deliverableIds = new ArrayList<>();
        }

        public enum MilestoneStatus {
            PENDING,
            IN_PROGRESS,
            COMPLETED,
            SKIPPED,
            BLOCKED
        }

        // Getters and setters
        public String getMilestoneId() { return milestoneId; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public void setDescription(String desc) { this.description = desc; }
        public int getSequenceNumber() { return sequenceNumber; }
        public MilestoneStatus getStatus() { return status; }
        public void setStatus(MilestoneStatus status) { this.status = status; }
        public BigDecimal getProgressWeight() { return progressWeight; }
        public Instant getTargetDate() { return targetDate; }
        public void setTargetDate(Instant date) { this.targetDate = date; }
        public Instant getCompletedDate() { return completedDate; }
        public void complete(String completedBy) {
            this.status = MilestoneStatus.COMPLETED;
            this.completedDate = Instant.now();
            this.completedBy = completedBy;
        }
        public String getCompletedBy() { return completedBy; }
        public List<String> getDeliverableIds() { return deliverableIds; }
        public boolean isRequiresApproval() { return requiresApproval; }
        public void setRequiresApproval(boolean required) { this.requiresApproval = required; }
        public String getApprovedBy() { return approvedBy; }
        public void approve(String approver) { this.approvedBy = approver; }
    }

    public static class TaskChecklist {
        private String checklistId;
        private String name;
        private String category;
        private List<ChecklistItem> items;
        private boolean isCompleted;

        public TaskChecklist(String name, String category) {
            this.checklistId = "CL-" + UUID.randomUUID().toString().substring(0, 8);
            this.name = name;
            this.category = category;
            this.items = new ArrayList<>();
        }

        public void addItem(String description, boolean isMandatory) {
            items.add(new ChecklistItem(description, isMandatory));
        }

        public void checkItem(String itemId, String checkedBy) {
            items.stream()
                .filter(i -> i.itemId.equals(itemId))
                .findFirst()
                .ifPresent(i -> i.check(checkedBy));
            updateCompletionStatus();
        }

        private void updateCompletionStatus() {
            this.isCompleted = items.stream()
                .filter(i -> i.isMandatory)
                .allMatch(i -> i.isChecked);
        }

        public BigDecimal getCompletionPercent() {
            if (items.isEmpty()) return BigDecimal.valueOf(100);
            long checkedCount = items.stream().filter(i -> i.isChecked).count();
            return BigDecimal.valueOf(checkedCount * 100.0 / items.size());
        }

        // Getters
        public String getChecklistId() { return checklistId; }
        public String getName() { return name; }
        public String getCategory() { return category; }
        public List<ChecklistItem> getItems() { return items; }
        public boolean isCompleted() { return isCompleted; }
    }

    public static class ChecklistItem {
        public String itemId;
        public String description;
        public boolean isMandatory;
        public boolean isChecked;
        public String checkedBy;
        public Instant checkedAt;
        public String notes;

        public ChecklistItem(String description, boolean isMandatory) {
            this.itemId = "CI-" + UUID.randomUUID().toString().substring(0, 8);
            this.description = description;
            this.isMandatory = isMandatory;
            this.isChecked = false;
        }

        public void check(String checkedBy) {
            this.isChecked = true;
            this.checkedBy = checkedBy;
            this.checkedAt = Instant.now();
        }
    }

    // ==================== DELIVERABLES ====================

    public static class TaskDeliverable {
        private String deliverableId;
        private String name;
        private VerifierServiceCatalog.DeliverableType type;
        private String description;
        private DeliverableStatus status;
        private boolean isMandatory;
        private Instant dueDate;
        private Instant submittedDate;
        private String submittedBy;
        private List<String> attachmentIds;
        private String reviewNotes;
        private String reviewedBy;
        private Instant reviewedAt;
        private int revisionNumber;

        public TaskDeliverable(String name, VerifierServiceCatalog.DeliverableType type) {
            this.deliverableId = "DEL-" + UUID.randomUUID().toString().substring(0, 8);
            this.name = name;
            this.type = type;
            this.status = DeliverableStatus.PENDING;
            this.attachmentIds = new ArrayList<>();
            this.revisionNumber = 0;
        }

        public enum DeliverableStatus {
            PENDING,
            IN_PROGRESS,
            SUBMITTED,
            UNDER_REVIEW,
            APPROVED,
            REJECTED,
            REVISION_REQUIRED
        }

        public void submit(String submittedBy, List<String> attachmentIds) {
            this.status = DeliverableStatus.SUBMITTED;
            this.submittedDate = Instant.now();
            this.submittedBy = submittedBy;
            this.attachmentIds.addAll(attachmentIds);
        }

        public void approve(String reviewedBy, String notes) {
            this.status = DeliverableStatus.APPROVED;
            this.reviewedBy = reviewedBy;
            this.reviewNotes = notes;
            this.reviewedAt = Instant.now();
        }

        public void requestRevision(String reviewedBy, String notes) {
            this.status = DeliverableStatus.REVISION_REQUIRED;
            this.reviewedBy = reviewedBy;
            this.reviewNotes = notes;
            this.reviewedAt = Instant.now();
            this.revisionNumber++;
        }

        // Getters
        public String getDeliverableId() { return deliverableId; }
        public String getName() { return name; }
        public VerifierServiceCatalog.DeliverableType getType() { return type; }
        public String getDescription() { return description; }
        public void setDescription(String desc) { this.description = desc; }
        public DeliverableStatus getStatus() { return status; }
        public boolean isMandatory() { return isMandatory; }
        public void setMandatory(boolean mandatory) { this.isMandatory = mandatory; }
        public Instant getDueDate() { return dueDate; }
        public void setDueDate(Instant date) { this.dueDate = date; }
        public Instant getSubmittedDate() { return submittedDate; }
        public String getSubmittedBy() { return submittedBy; }
        public List<String> getAttachmentIds() { return attachmentIds; }
        public String getReviewNotes() { return reviewNotes; }
        public String getReviewedBy() { return reviewedBy; }
        public Instant getReviewedAt() { return reviewedAt; }
        public int getRevisionNumber() { return revisionNumber; }
    }

    // ==================== ATTACHMENTS ====================

    public static class TaskAttachment {
        private String attachmentId;
        private String fileName;
        private String fileType;
        private String mimeType;
        private long fileSize;
        private String storageUrl;
        private String hash;
        private AttachmentCategory category;
        private String uploadedBy;
        private Instant uploadedAt;
        private String description;
        private boolean isConfidential;
        private Map<String, String> metadata;

        public TaskAttachment(String fileName, String storageUrl) {
            this.attachmentId = "ATT-" + UUID.randomUUID().toString().substring(0, 8);
            this.fileName = fileName;
            this.storageUrl = storageUrl;
            this.uploadedAt = Instant.now();
            this.metadata = new HashMap<>();
        }

        public enum AttachmentCategory {
            INPUT_DOCUMENT,
            EVIDENCE,
            PHOTO,
            VIDEO,
            REPORT,
            CERTIFICATE,
            CORRESPONDENCE,
            LEGAL_DOCUMENT,
            FINANCIAL_DOCUMENT,
            THIRD_PARTY_DATA,
            OTHER
        }

        // Builder pattern
        public TaskAttachment fileType(String type) { this.fileType = type; return this; }
        public TaskAttachment mimeType(String mime) { this.mimeType = mime; return this; }
        public TaskAttachment fileSize(long size) { this.fileSize = size; return this; }
        public TaskAttachment hash(String hash) { this.hash = hash; return this; }
        public TaskAttachment category(AttachmentCategory cat) { this.category = cat; return this; }
        public TaskAttachment uploadedBy(String user) { this.uploadedBy = user; return this; }
        public TaskAttachment description(String desc) { this.description = desc; return this; }
        public TaskAttachment confidential(boolean conf) { this.isConfidential = conf; return this; }
        public TaskAttachment addMetadata(String key, String value) { this.metadata.put(key, value); return this; }

        // Getters
        public String getAttachmentId() { return attachmentId; }
        public String getFileName() { return fileName; }
        public String getFileType() { return fileType; }
        public String getMimeType() { return mimeType; }
        public long getFileSize() { return fileSize; }
        public String getStorageUrl() { return storageUrl; }
        public String getHash() { return hash; }
        public AttachmentCategory getCategory() { return category; }
        public String getUploadedBy() { return uploadedBy; }
        public Instant getUploadedAt() { return uploadedAt; }
        public String getDescription() { return description; }
        public boolean isConfidential() { return isConfidential; }
        public Map<String, String> getMetadata() { return metadata; }
    }

    // ==================== COMMENTS ====================

    public static class TaskComment {
        private String commentId;
        private String authorId;
        private String authorName;
        private String content;
        private CommentType type;
        private Instant createdAt;
        private Instant editedAt;
        private String parentCommentId;
        private List<String> attachmentIds;
        private boolean isInternal;
        private List<String> mentions;

        public TaskComment(String authorId, String authorName, String content) {
            this.commentId = "CMT-" + UUID.randomUUID().toString().substring(0, 8);
            this.authorId = authorId;
            this.authorName = authorName;
            this.content = content;
            this.type = CommentType.GENERAL;
            this.createdAt = Instant.now();
            this.attachmentIds = new ArrayList<>();
            this.mentions = new ArrayList<>();
        }

        public enum CommentType {
            GENERAL,
            QUESTION,
            ANSWER,
            UPDATE,
            ISSUE,
            RESOLUTION,
            APPROVAL,
            REJECTION,
            SYSTEM
        }

        // Getters and setters
        public String getCommentId() { return commentId; }
        public String getAuthorId() { return authorId; }
        public String getAuthorName() { return authorName; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; this.editedAt = Instant.now(); }
        public CommentType getType() { return type; }
        public void setType(CommentType type) { this.type = type; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getEditedAt() { return editedAt; }
        public String getParentCommentId() { return parentCommentId; }
        public void setParentCommentId(String parentId) { this.parentCommentId = parentId; }
        public List<String> getAttachmentIds() { return attachmentIds; }
        public boolean isInternal() { return isInternal; }
        public void setInternal(boolean internal) { this.isInternal = internal; }
        public List<String> getMentions() { return mentions; }
        public void addMention(String userId) { this.mentions.add(userId); }
    }

    // ==================== EVENT LOG ====================

    public enum TaskEventType {
        TASK_CREATED,
        TASK_ASSIGNED,
        TASK_ACCEPTED,
        TASK_REJECTED,
        TASK_STARTED,
        STATUS_CHANGED,
        MILESTONE_COMPLETED,
        DELIVERABLE_SUBMITTED,
        DELIVERABLE_APPROVED,
        DELIVERABLE_REJECTED,
        RFI_SENT,
        RFI_RESPONDED,
        COMMENT_ADDED,
        ATTACHMENT_UPLOADED,
        EXTENSION_REQUESTED,
        EXTENSION_APPROVED,
        PAYMENT_RECEIVED,
        TASK_COMPLETED,
        TASK_CANCELLED,
        ESCALATION_TRIGGERED
    }

    public static class TaskEvent {
        public String eventId;
        public TaskEventType eventType;
        public String actor;
        public String description;
        public Instant timestamp;
        public Map<String, Object> data;

        public TaskEvent(TaskEventType type, String actor, String description) {
            this.eventId = "EVT-" + UUID.randomUUID().toString().substring(0, 8);
            this.eventType = type;
            this.actor = actor;
            this.description = description;
            this.timestamp = Instant.now();
            this.data = new HashMap<>();
        }
    }

    // ==================== TASK METHODS ====================

    public void assignToVerifier(String verifierId, String verifierName, VerifierTier tier) {
        this.verifierId = verifierId;
        this.assignment = new AssignmentDetails()
            .verifierId(verifierId)
            .verifierName(verifierName)
            .tier(tier)
            .assignedAt(Instant.now())
            .method(AssignmentDetails.AssignmentMethod.AUTOMATIC);
        this.status = TaskStatus.ASSIGNED;
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.TASK_ASSIGNED, "system", "Task assigned to " + verifierName);
    }

    public void accept() {
        if (assignment != null) {
            assignment.acceptedAt(Instant.now());
        }
        this.status = TaskStatus.ACCEPTED;
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.TASK_ACCEPTED, verifierId, "Task accepted by verifier");
    }

    public void reject(String reason) {
        this.status = TaskStatus.REJECTED;
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.TASK_REJECTED, verifierId, "Task rejected: " + reason);
    }

    public void start() {
        this.status = TaskStatus.IN_PROGRESS;
        if (timeline != null) {
            timeline.recordStart();
        }
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.TASK_STARTED, verifierId, "Work started on task");
    }

    public void complete() {
        this.status = TaskStatus.COMPLETED;
        if (timeline != null) {
            timeline.recordCompletion();
        }
        this.progressPercent = BigDecimal.valueOf(100);
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.TASK_COMPLETED, verifierId, "Task completed");
    }

    public void cancel(String reason, String cancelledBy) {
        this.status = TaskStatus.CANCELLED;
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.TASK_CANCELLED, cancelledBy, "Task cancelled: " + reason);
    }

    public void updateProgress(BigDecimal progress, String phase) {
        this.progressPercent = progress;
        this.currentPhase = phase;
        this.lastUpdated = Instant.now();
    }

    public void addMilestone(TaskMilestone milestone) {
        milestones.add(milestone);
        this.lastUpdated = Instant.now();
    }

    public void completeMilestone(String milestoneId, String completedBy) {
        milestones.stream()
            .filter(m -> m.getMilestoneId().equals(milestoneId))
            .findFirst()
            .ifPresent(m -> {
                m.complete(completedBy);
                addEvent(TaskEventType.MILESTONE_COMPLETED, completedBy, "Milestone completed: " + m.getName());
                recalculateProgress();
            });
    }

    private void recalculateProgress() {
        BigDecimal completedWeight = milestones.stream()
            .filter(m -> m.getStatus() == TaskMilestone.MilestoneStatus.COMPLETED)
            .map(TaskMilestone::getProgressWeight)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.progressPercent = completedWeight;
    }

    public void addDeliverable(TaskDeliverable deliverable) {
        deliverables.add(deliverable);
        this.lastUpdated = Instant.now();
    }

    public void addAttachment(TaskAttachment attachment) {
        attachments.add(attachment);
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.ATTACHMENT_UPLOADED, attachment.getUploadedBy(),
            "Attachment uploaded: " + attachment.getFileName());
    }

    public void addComment(TaskComment comment) {
        comments.add(comment);
        this.lastUpdated = Instant.now();
        addEvent(TaskEventType.COMMENT_ADDED, comment.getAuthorId(),
            "Comment added by " + comment.getAuthorName());
    }

    public void linkRfi(String rfiId) {
        rfiIds.add(rfiId);
        this.lastUpdated = Instant.now();
    }

    private void addEvent(TaskEventType type, String actor, String description) {
        eventLog.add(new TaskEvent(type, actor, description));
    }

    // ==================== GETTERS ====================

    public String getTaskId() { return taskId; }
    public String getWorkflowId() { return workflowId; }
    public String getCompositeId() { return compositeId; }
    public String getAssetId() { return assetId; }
    public String getVerifierId() { return verifierId; }
    public String getServiceId() { return serviceId; }
    public void setServiceId(String id) { this.serviceId = id; }
    public TaskStatus getStatus() { return status; }
    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }
    public AssignmentDetails getAssignment() { return assignment; }
    public TaskScope getScope() { return scope; }
    public void setScope(TaskScope scope) { this.scope = scope; }
    public TaskTimeline getTimeline() { return timeline; }
    public void setTimeline(TaskTimeline timeline) { this.timeline = timeline; }
    public TaskPricing getPricing() { return pricing; }
    public void setPricing(TaskPricing pricing) { this.pricing = pricing; }
    public List<TaskMilestone> getMilestones() { return milestones; }
    public List<TaskChecklist> getChecklists() { return checklists; }
    public BigDecimal getProgressPercent() { return progressPercent; }
    public String getCurrentPhase() { return currentPhase; }
    public List<TaskDeliverable> getDeliverables() { return deliverables; }
    public List<TaskAttachment> getAttachments() { return attachments; }
    public List<TaskComment> getComments() { return comments; }
    public List<String> getRfiIds() { return rfiIds; }
    public List<TaskEvent> getEventLog() { return eventLog; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastUpdated() { return lastUpdated; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String creator) { this.createdBy = creator; }
}
