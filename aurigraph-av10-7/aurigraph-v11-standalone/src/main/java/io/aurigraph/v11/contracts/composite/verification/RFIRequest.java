package io.aurigraph.v11.contracts.composite.verification;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * RFI (Request for Information) - Manages information requests in verification workflow
 *
 * Supports the complete RFI value chain:
 * - Request creation with specific information needs
 * - Response tracking with attachments and third-party data
 * - Follow-up and clarification handling
 * - Deadline management and escalation
 * - Audit trail for compliance
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Third-Party Verification)
 */
public class RFIRequest {

    private final String rfiId;
    private final String taskId;
    private final String workflowId;
    private final String compositeId;

    // RFI Details
    private String subject;
    private String description;
    private RFIType rfiType;
    private RFIPriority priority;
    private RFIStatus status;
    private RFICategory category;

    // Parties
    private String requesterId;
    private String requesterName;
    private String requesterRole;
    private String respondentId;
    private String respondentName;
    private String respondentRole;
    private List<String> ccRecipients;

    // Information Items
    private List<RFIItem> requestedItems;
    private List<RFIResponse> responses;

    // Timeline
    private Instant createdAt;
    private Instant sentAt;
    private Instant dueDate;
    private Instant respondedAt;
    private Instant closedAt;
    private Duration reminderInterval;
    private int remindersSent;
    private Instant lastReminderSent;

    // Tracking
    private int responseAttempts;
    private int maxResponseAttempts;
    private boolean isEscalated;
    private String escalatedTo;
    private Instant escalatedAt;

    // Attachments and Data
    private List<RFIAttachment> requestAttachments;
    private List<RFIAttachment> responseAttachments;
    private List<ThirdPartyDataRequest> thirdPartyDataRequests;

    // Audit
    private List<RFIEvent> eventLog;
    private Map<String, Object> metadata;

    public RFIRequest(String taskId, String workflowId, String compositeId) {
        this.rfiId = "RFI-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        this.taskId = taskId;
        this.workflowId = workflowId;
        this.compositeId = compositeId;
        this.status = RFIStatus.DRAFT;
        this.priority = RFIPriority.NORMAL;
        this.requestedItems = new ArrayList<>();
        this.responses = new ArrayList<>();
        this.ccRecipients = new ArrayList<>();
        this.requestAttachments = new ArrayList<>();
        this.responseAttachments = new ArrayList<>();
        this.thirdPartyDataRequests = new ArrayList<>();
        this.eventLog = new ArrayList<>();
        this.metadata = new HashMap<>();
        this.createdAt = Instant.now();
        this.maxResponseAttempts = 3;
        this.reminderInterval = Duration.ofDays(2);

        addEvent(RFIEventType.RFI_CREATED, "system", "RFI created");
    }

    // ==================== ENUMS ====================

    public enum RFIType {
        DOCUMENT_REQUEST,      // Request for specific documents
        CLARIFICATION,         // Clarification on existing information
        DATA_REQUEST,          // Request for specific data points
        ACCESS_REQUEST,        // Request for access to property/systems
        CONTACT_REQUEST,       // Request for contact information
        VERIFICATION_REQUEST,  // Request for third-party verification
        FOLLOW_UP,             // Follow-up on previous request
        CORRECTION,            // Request for correction of information
        ADDITIONAL_INFO,       // Request for additional information
        APPROVAL_REQUEST,      // Request for approval/sign-off
        SCHEDULING_REQUEST     // Request to schedule inspection/meeting
    }

    public enum RFIPriority {
        LOW(1, Duration.ofDays(7)),
        NORMAL(2, Duration.ofDays(5)),
        HIGH(3, Duration.ofDays(3)),
        URGENT(4, Duration.ofDays(1)),
        CRITICAL(5, Duration.ofHours(12));

        private final int level;
        private final Duration defaultResponseTime;

        RFIPriority(int level, Duration defaultResponseTime) {
            this.level = level;
            this.defaultResponseTime = defaultResponseTime;
        }

        public int getLevel() { return level; }
        public Duration getDefaultResponseTime() { return defaultResponseTime; }
    }

    public enum RFIStatus {
        DRAFT,              // Being prepared
        SENT,               // Sent to respondent
        ACKNOWLEDGED,       // Respondent acknowledged receipt
        IN_PROGRESS,        // Respondent working on response
        PARTIALLY_ANSWERED, // Some items answered
        ANSWERED,           // All items answered
        UNDER_REVIEW,       // Response under review
        ACCEPTED,           // Response accepted
        REJECTED,           // Response rejected
        RESUBMISSION_REQUIRED, // Need to resubmit
        CLOSED,             // RFI closed
        CANCELLED,          // RFI cancelled
        EXPIRED,            // RFI expired without response
        ESCALATED           // Escalated to higher authority
    }

    public enum RFICategory {
        OWNERSHIP,          // Ownership documentation
        LEGAL,              // Legal documents
        FINANCIAL,          // Financial information
        TECHNICAL,          // Technical specifications
        COMPLIANCE,         // Compliance certifications
        ENVIRONMENTAL,      // Environmental assessments
        INSURANCE,          // Insurance documentation
        TAX,                // Tax documents
        VALUATION,          // Valuation related
        PHYSICAL_ACCESS,    // Physical site access
        OPERATIONAL,        // Operational information
        HISTORICAL,         // Historical records
        THIRD_PARTY,        // Third-party verifications
        OTHER               // Other categories
    }

    // ==================== RFI ITEM ====================

    /**
     * Individual information item within an RFI
     */
    public static class RFIItem {
        private String itemId;
        private int itemNumber;
        private String question;
        private String description;
        private ItemType itemType;
        private boolean isMandatory;
        private ItemStatus status;
        private List<String> acceptedFormats;
        private String validationCriteria;
        private RFIItemResponse response;
        private List<RFIFollowUp> followUps;

        public RFIItem(int itemNumber, String question) {
            this.itemId = "ITEM-" + UUID.randomUUID().toString().substring(0, 8);
            this.itemNumber = itemNumber;
            this.question = question;
            this.itemType = ItemType.TEXT_RESPONSE;
            this.status = ItemStatus.PENDING;
            this.acceptedFormats = new ArrayList<>();
            this.followUps = new ArrayList<>();
        }

        public enum ItemType {
            TEXT_RESPONSE,
            DOCUMENT_UPLOAD,
            DATA_EXTRACT,
            YES_NO,
            MULTIPLE_CHOICE,
            DATE,
            NUMERIC,
            CONTACT_INFO,
            ADDRESS,
            FILE_UPLOAD,
            SIGNATURE,
            THIRD_PARTY_VERIFICATION
        }

        public enum ItemStatus {
            PENDING,
            ANSWERED,
            PARTIALLY_ANSWERED,
            REQUIRES_CLARIFICATION,
            ACCEPTED,
            REJECTED,
            NOT_APPLICABLE,
            WAIVED
        }

        // Builder pattern
        public RFIItem description(String desc) { this.description = desc; return this; }
        public RFIItem itemType(ItemType type) { this.itemType = type; return this; }
        public RFIItem mandatory(boolean mandatory) { this.isMandatory = mandatory; return this; }
        public RFIItem addAcceptedFormat(String format) { this.acceptedFormats.add(format); return this; }
        public RFIItem validationCriteria(String criteria) { this.validationCriteria = criteria; return this; }

        public void respond(RFIItemResponse response) {
            this.response = response;
            this.status = ItemStatus.ANSWERED;
        }

        public void addFollowUp(RFIFollowUp followUp) {
            this.followUps.add(followUp);
            this.status = ItemStatus.REQUIRES_CLARIFICATION;
        }

        public void accept() { this.status = ItemStatus.ACCEPTED; }
        public void reject() { this.status = ItemStatus.REJECTED; }
        public void waive() { this.status = ItemStatus.WAIVED; }

        // Getters
        public String getItemId() { return itemId; }
        public int getItemNumber() { return itemNumber; }
        public String getQuestion() { return question; }
        public String getDescription() { return description; }
        public ItemType getItemType() { return itemType; }
        public boolean isMandatory() { return isMandatory; }
        public ItemStatus getStatus() { return status; }
        public List<String> getAcceptedFormats() { return acceptedFormats; }
        public String getValidationCriteria() { return validationCriteria; }
        public RFIItemResponse getResponse() { return response; }
        public List<RFIFollowUp> getFollowUps() { return followUps; }
    }

    /**
     * Response to an individual RFI item
     */
    public static class RFIItemResponse {
        private String responseId;
        private String itemId;
        private String textResponse;
        private Map<String, Object> structuredData;
        private List<String> attachmentIds;
        private String respondentId;
        private Instant respondedAt;
        private String notes;
        private boolean isPartial;
        private String thirdPartyDataId;

        public RFIItemResponse(String itemId) {
            this.responseId = "RESP-" + UUID.randomUUID().toString().substring(0, 8);
            this.itemId = itemId;
            this.structuredData = new HashMap<>();
            this.attachmentIds = new ArrayList<>();
            this.respondedAt = Instant.now();
        }

        // Builder pattern
        public RFIItemResponse textResponse(String text) { this.textResponse = text; return this; }
        public RFIItemResponse addData(String key, Object value) { this.structuredData.put(key, value); return this; }
        public RFIItemResponse addAttachment(String attachmentId) { this.attachmentIds.add(attachmentId); return this; }
        public RFIItemResponse respondentId(String id) { this.respondentId = id; return this; }
        public RFIItemResponse notes(String notes) { this.notes = notes; return this; }
        public RFIItemResponse partial(boolean partial) { this.isPartial = partial; return this; }
        public RFIItemResponse thirdPartyDataId(String id) { this.thirdPartyDataId = id; return this; }

        // Getters
        public String getResponseId() { return responseId; }
        public String getItemId() { return itemId; }
        public String getTextResponse() { return textResponse; }
        public Map<String, Object> getStructuredData() { return structuredData; }
        public List<String> getAttachmentIds() { return attachmentIds; }
        public String getRespondentId() { return respondentId; }
        public Instant getRespondedAt() { return respondedAt; }
        public String getNotes() { return notes; }
        public boolean isPartial() { return isPartial; }
        public String getThirdPartyDataId() { return thirdPartyDataId; }
    }

    /**
     * Follow-up question or clarification request
     */
    public static class RFIFollowUp {
        private String followUpId;
        private String originalItemId;
        private String question;
        private String requestedBy;
        private Instant requestedAt;
        private String response;
        private String respondedBy;
        private Instant respondedAt;
        private FollowUpStatus status;

        public RFIFollowUp(String originalItemId, String question, String requestedBy) {
            this.followUpId = "FU-" + UUID.randomUUID().toString().substring(0, 8);
            this.originalItemId = originalItemId;
            this.question = question;
            this.requestedBy = requestedBy;
            this.requestedAt = Instant.now();
            this.status = FollowUpStatus.PENDING;
        }

        public enum FollowUpStatus {
            PENDING,
            ANSWERED,
            CLOSED,
            ESCALATED
        }

        public void respond(String response, String respondedBy) {
            this.response = response;
            this.respondedBy = respondedBy;
            this.respondedAt = Instant.now();
            this.status = FollowUpStatus.ANSWERED;
        }

        // Getters
        public String getFollowUpId() { return followUpId; }
        public String getOriginalItemId() { return originalItemId; }
        public String getQuestion() { return question; }
        public String getRequestedBy() { return requestedBy; }
        public Instant getRequestedAt() { return requestedAt; }
        public String getResponse() { return response; }
        public String getRespondedBy() { return respondedBy; }
        public Instant getRespondedAt() { return respondedAt; }
        public FollowUpStatus getStatus() { return status; }
    }

    // ==================== RFI RESPONSE (OVERALL) ====================

    /**
     * Overall RFI response submission
     */
    public static class RFIResponse {
        private String responseId;
        private int responseNumber;
        private String respondentId;
        private String respondentName;
        private Instant submittedAt;
        private String coverLetter;
        private List<RFIItemResponse> itemResponses;
        private List<String> attachmentIds;
        private ResponseStatus status;
        private String reviewNotes;
        private String reviewedBy;
        private Instant reviewedAt;

        public RFIResponse(String respondentId, String respondentName) {
            this.responseId = "RFIRESP-" + UUID.randomUUID().toString().substring(0, 8);
            this.respondentId = respondentId;
            this.respondentName = respondentName;
            this.submittedAt = Instant.now();
            this.itemResponses = new ArrayList<>();
            this.attachmentIds = new ArrayList<>();
            this.status = ResponseStatus.SUBMITTED;
        }

        public enum ResponseStatus {
            DRAFT,
            SUBMITTED,
            UNDER_REVIEW,
            ACCEPTED,
            PARTIALLY_ACCEPTED,
            REJECTED,
            REVISION_REQUIRED
        }

        public void addItemResponse(RFIItemResponse itemResponse) {
            this.itemResponses.add(itemResponse);
        }

        public void review(String reviewedBy, ResponseStatus status, String notes) {
            this.reviewedBy = reviewedBy;
            this.status = status;
            this.reviewNotes = notes;
            this.reviewedAt = Instant.now();
        }

        // Getters
        public String getResponseId() { return responseId; }
        public int getResponseNumber() { return responseNumber; }
        public void setResponseNumber(int num) { this.responseNumber = num; }
        public String getRespondentId() { return respondentId; }
        public String getRespondentName() { return respondentName; }
        public Instant getSubmittedAt() { return submittedAt; }
        public String getCoverLetter() { return coverLetter; }
        public void setCoverLetter(String letter) { this.coverLetter = letter; }
        public List<RFIItemResponse> getItemResponses() { return itemResponses; }
        public List<String> getAttachmentIds() { return attachmentIds; }
        public ResponseStatus getStatus() { return status; }
        public String getReviewNotes() { return reviewNotes; }
        public String getReviewedBy() { return reviewedBy; }
        public Instant getReviewedAt() { return reviewedAt; }
    }

    // ==================== ATTACHMENTS ====================

    /**
     * RFI Attachment with full metadata
     */
    public static class RFIAttachment {
        private String attachmentId;
        private String fileName;
        private String originalFileName;
        private String fileType;
        private String mimeType;
        private long fileSize;
        private String storageUrl;
        private String hash;
        private String hashAlgorithm;
        private AttachmentSource source;
        private String uploadedBy;
        private Instant uploadedAt;
        private String description;
        private boolean isConfidential;
        private String accessLevel;
        private List<String> relatedItemIds;
        private Map<String, String> metadata;
        private VirusScanStatus virusScanStatus;
        private Instant virusScannedAt;

        public RFIAttachment(String fileName, String storageUrl) {
            this.attachmentId = "RFIATT-" + UUID.randomUUID().toString().substring(0, 8);
            this.fileName = fileName;
            this.originalFileName = fileName;
            this.storageUrl = storageUrl;
            this.uploadedAt = Instant.now();
            this.hashAlgorithm = "SHA-256";
            this.relatedItemIds = new ArrayList<>();
            this.metadata = new HashMap<>();
            this.virusScanStatus = VirusScanStatus.PENDING;
        }

        public enum AttachmentSource {
            REQUESTER_UPLOAD,
            RESPONDENT_UPLOAD,
            THIRD_PARTY_DATA,
            SYSTEM_GENERATED,
            EXTERNAL_LINK
        }

        public enum VirusScanStatus {
            PENDING,
            CLEAN,
            INFECTED,
            SCAN_FAILED,
            SKIPPED
        }

        // Builder pattern
        public RFIAttachment fileType(String type) { this.fileType = type; return this; }
        public RFIAttachment mimeType(String mime) { this.mimeType = mime; return this; }
        public RFIAttachment fileSize(long size) { this.fileSize = size; return this; }
        public RFIAttachment hash(String hash) { this.hash = hash; return this; }
        public RFIAttachment source(AttachmentSource src) { this.source = src; return this; }
        public RFIAttachment uploadedBy(String user) { this.uploadedBy = user; return this; }
        public RFIAttachment description(String desc) { this.description = desc; return this; }
        public RFIAttachment confidential(boolean conf) { this.isConfidential = conf; return this; }
        public RFIAttachment accessLevel(String level) { this.accessLevel = level; return this; }
        public RFIAttachment addRelatedItem(String itemId) { this.relatedItemIds.add(itemId); return this; }
        public RFIAttachment addMetadata(String key, String value) { this.metadata.put(key, value); return this; }

        public void markVirusScan(VirusScanStatus status) {
            this.virusScanStatus = status;
            this.virusScannedAt = Instant.now();
        }

        // Getters
        public String getAttachmentId() { return attachmentId; }
        public String getFileName() { return fileName; }
        public String getOriginalFileName() { return originalFileName; }
        public String getFileType() { return fileType; }
        public String getMimeType() { return mimeType; }
        public long getFileSize() { return fileSize; }
        public String getStorageUrl() { return storageUrl; }
        public String getHash() { return hash; }
        public String getHashAlgorithm() { return hashAlgorithm; }
        public AttachmentSource getSource() { return source; }
        public String getUploadedBy() { return uploadedBy; }
        public Instant getUploadedAt() { return uploadedAt; }
        public String getDescription() { return description; }
        public boolean isConfidential() { return isConfidential; }
        public String getAccessLevel() { return accessLevel; }
        public List<String> getRelatedItemIds() { return relatedItemIds; }
        public Map<String, String> getMetadata() { return metadata; }
        public VirusScanStatus getVirusScanStatus() { return virusScanStatus; }
        public Instant getVirusScannedAt() { return virusScannedAt; }
    }

    // ==================== THIRD-PARTY DATA ====================

    /**
     * Request for third-party data integration
     */
    public static class ThirdPartyDataRequest {
        private String requestId;
        private String rfiItemId;
        private ThirdPartyDataSource dataSource;
        private String dataType;
        private Map<String, String> queryParameters;
        private DataRequestStatus status;
        private ThirdPartyDataResult result;
        private String requestedBy;
        private Instant requestedAt;
        private Instant completedAt;
        private BigDecimal cost;
        private String errorMessage;
        private int retryCount;

        public ThirdPartyDataRequest(String rfiItemId, ThirdPartyDataSource dataSource) {
            this.requestId = "TPDR-" + UUID.randomUUID().toString().substring(0, 8);
            this.rfiItemId = rfiItemId;
            this.dataSource = dataSource;
            this.queryParameters = new HashMap<>();
            this.status = DataRequestStatus.PENDING;
            this.requestedAt = Instant.now();
            this.retryCount = 0;
        }

        public enum ThirdPartyDataSource {
            // Property Data
            PROPERTY_REGISTRY,
            LAND_REGISTRY,
            TITLE_COMPANY,
            MLS_DATABASE,

            // Financial Data
            CREDIT_BUREAU,
            BANK_VERIFICATION,
            FINANCIAL_INSTITUTION,

            // Legal Data
            COURT_RECORDS,
            LIEN_DATABASE,
            BANKRUPTCY_RECORDS,

            // Identity Verification
            GOVERNMENT_ID_VERIFICATION,
            FACIAL_RECOGNITION,
            BIOMETRIC_VERIFICATION,

            // Business Data
            COMPANY_REGISTRY,
            SEC_FILINGS,
            BUSINESS_CREDIT,

            // Environmental
            ENVIRONMENTAL_DATABASE,
            FLOOD_ZONE_DATA,
            HAZARD_DATABASE,

            // Valuation
            COMPARABLE_SALES,
            MARKET_DATA,
            APPRAISAL_DATABASE,

            // Compliance
            SANCTIONS_LIST,
            PEP_DATABASE,
            AML_DATABASE,

            // Insurance
            INSURANCE_VERIFICATION,
            CLAIMS_HISTORY,

            // Custom
            CUSTOM_API,
            MANUAL_VERIFICATION
        }

        public enum DataRequestStatus {
            PENDING,
            SUBMITTED,
            PROCESSING,
            COMPLETED,
            FAILED,
            PARTIAL,
            CANCELLED,
            TIMEOUT
        }

        public void addParameter(String key, String value) {
            this.queryParameters.put(key, value);
        }

        public void complete(ThirdPartyDataResult result) {
            this.result = result;
            this.status = DataRequestStatus.COMPLETED;
            this.completedAt = Instant.now();
        }

        public void fail(String errorMessage) {
            this.errorMessage = errorMessage;
            this.status = DataRequestStatus.FAILED;
            this.completedAt = Instant.now();
        }

        public void retry() {
            this.retryCount++;
            this.status = DataRequestStatus.PENDING;
        }

        // Getters and setters
        public String getRequestId() { return requestId; }
        public String getRfiItemId() { return rfiItemId; }
        public ThirdPartyDataSource getDataSource() { return dataSource; }
        public String getDataType() { return dataType; }
        public void setDataType(String type) { this.dataType = type; }
        public Map<String, String> getQueryParameters() { return queryParameters; }
        public DataRequestStatus getStatus() { return status; }
        public void setStatus(DataRequestStatus status) { this.status = status; }
        public ThirdPartyDataResult getResult() { return result; }
        public String getRequestedBy() { return requestedBy; }
        public void setRequestedBy(String user) { this.requestedBy = user; }
        public Instant getRequestedAt() { return requestedAt; }
        public Instant getCompletedAt() { return completedAt; }
        public BigDecimal getCost() { return cost; }
        public void setCost(BigDecimal cost) { this.cost = cost; }
        public String getErrorMessage() { return errorMessage; }
        public int getRetryCount() { return retryCount; }
    }

    /**
     * Result from third-party data request
     */
    public static class ThirdPartyDataResult {
        private String resultId;
        private String dataSourceId;
        private Map<String, Object> data;
        private String rawResponse;
        private String dataFormat;
        private DataConfidenceLevel confidenceLevel;
        private Instant dataTimestamp;
        private Instant retrievedAt;
        private String sourceReference;
        private boolean isVerified;
        private String verificationMethod;
        private Map<String, String> extractedFields;
        private List<DataQualityFlag> qualityFlags;

        public ThirdPartyDataResult() {
            this.resultId = "TPRES-" + UUID.randomUUID().toString().substring(0, 8);
            this.data = new HashMap<>();
            this.extractedFields = new HashMap<>();
            this.qualityFlags = new ArrayList<>();
            this.retrievedAt = Instant.now();
        }

        public enum DataConfidenceLevel {
            HIGH,       // 95%+ confidence
            MEDIUM,     // 80-95% confidence
            LOW,        // 60-80% confidence
            UNCERTAIN,  // <60% confidence
            MANUAL_REVIEW_REQUIRED
        }

        public static class DataQualityFlag {
            public String flagType;
            public String description;
            public String field;
            public FlagSeverity severity;

            public enum FlagSeverity {
                INFO,
                WARNING,
                ERROR,
                CRITICAL
            }

            public DataQualityFlag(String flagType, String description, FlagSeverity severity) {
                this.flagType = flagType;
                this.description = description;
                this.severity = severity;
            }
        }

        // Builder pattern
        public ThirdPartyDataResult dataSourceId(String id) { this.dataSourceId = id; return this; }
        public ThirdPartyDataResult addData(String key, Object value) { this.data.put(key, value); return this; }
        public ThirdPartyDataResult rawResponse(String raw) { this.rawResponse = raw; return this; }
        public ThirdPartyDataResult dataFormat(String format) { this.dataFormat = format; return this; }
        public ThirdPartyDataResult confidenceLevel(DataConfidenceLevel level) { this.confidenceLevel = level; return this; }
        public ThirdPartyDataResult dataTimestamp(Instant ts) { this.dataTimestamp = ts; return this; }
        public ThirdPartyDataResult sourceReference(String ref) { this.sourceReference = ref; return this; }
        public ThirdPartyDataResult verified(boolean verified) { this.isVerified = verified; return this; }
        public ThirdPartyDataResult verificationMethod(String method) { this.verificationMethod = method; return this; }
        public ThirdPartyDataResult addExtractedField(String key, String value) {
            this.extractedFields.put(key, value); return this;
        }
        public ThirdPartyDataResult addQualityFlag(DataQualityFlag flag) { this.qualityFlags.add(flag); return this; }

        // Getters
        public String getResultId() { return resultId; }
        public String getDataSourceId() { return dataSourceId; }
        public Map<String, Object> getData() { return data; }
        public String getRawResponse() { return rawResponse; }
        public String getDataFormat() { return dataFormat; }
        public DataConfidenceLevel getConfidenceLevel() { return confidenceLevel; }
        public Instant getDataTimestamp() { return dataTimestamp; }
        public Instant getRetrievedAt() { return retrievedAt; }
        public String getSourceReference() { return sourceReference; }
        public boolean isVerified() { return isVerified; }
        public String getVerificationMethod() { return verificationMethod; }
        public Map<String, String> getExtractedFields() { return extractedFields; }
        public List<DataQualityFlag> getQualityFlags() { return qualityFlags; }
    }

    // ==================== EVENT LOG ====================

    public enum RFIEventType {
        RFI_CREATED,
        RFI_SENT,
        RFI_ACKNOWLEDGED,
        RFI_VIEWED,
        RESPONSE_STARTED,
        ITEM_ANSWERED,
        RESPONSE_SUBMITTED,
        RESPONSE_REVIEWED,
        RESPONSE_ACCEPTED,
        RESPONSE_REJECTED,
        FOLLOW_UP_REQUESTED,
        FOLLOW_UP_ANSWERED,
        ATTACHMENT_UPLOADED,
        THIRD_PARTY_DATA_REQUESTED,
        THIRD_PARTY_DATA_RECEIVED,
        REMINDER_SENT,
        ESCALATED,
        EXTENDED,
        CANCELLED,
        CLOSED,
        REOPENED
    }

    public static class RFIEvent {
        public String eventId;
        public RFIEventType eventType;
        public String actor;
        public String description;
        public Instant timestamp;
        public Map<String, Object> data;

        public RFIEvent(RFIEventType type, String actor, String description) {
            this.eventId = "RFIEVT-" + UUID.randomUUID().toString().substring(0, 8);
            this.eventType = type;
            this.actor = actor;
            this.description = description;
            this.timestamp = Instant.now();
            this.data = new HashMap<>();
        }
    }

    // ==================== RFI METHODS ====================

    public void send() {
        this.status = RFIStatus.SENT;
        this.sentAt = Instant.now();
        if (dueDate == null) {
            this.dueDate = Instant.now().plus(priority.getDefaultResponseTime());
        }
        addEvent(RFIEventType.RFI_SENT, requesterId, "RFI sent to " + respondentName);
    }

    public void acknowledge() {
        this.status = RFIStatus.ACKNOWLEDGED;
        addEvent(RFIEventType.RFI_ACKNOWLEDGED, respondentId, "RFI acknowledged by respondent");
    }

    public void startResponse() {
        this.status = RFIStatus.IN_PROGRESS;
        addEvent(RFIEventType.RESPONSE_STARTED, respondentId, "Response in progress");
    }

    public void submitResponse(RFIResponse response) {
        response.setResponseNumber(responses.size() + 1);
        responses.add(response);
        this.respondedAt = Instant.now();
        this.responseAttempts++;

        // Update item statuses from response
        for (RFIItemResponse itemResponse : response.getItemResponses()) {
            requestedItems.stream()
                .filter(item -> item.getItemId().equals(itemResponse.getItemId()))
                .findFirst()
                .ifPresent(item -> item.respond(itemResponse));
        }

        // Check if all mandatory items answered
        boolean allMandatoryAnswered = requestedItems.stream()
            .filter(RFIItem::isMandatory)
            .allMatch(item -> item.getStatus() == RFIItem.ItemStatus.ANSWERED ||
                            item.getStatus() == RFIItem.ItemStatus.ACCEPTED);

        this.status = allMandatoryAnswered ? RFIStatus.ANSWERED : RFIStatus.PARTIALLY_ANSWERED;
        addEvent(RFIEventType.RESPONSE_SUBMITTED, respondentId, "Response #" + response.getResponseNumber() + " submitted");
    }

    public void acceptResponse(String reviewedBy, String notes) {
        this.status = RFIStatus.ACCEPTED;
        requestedItems.forEach(item -> {
            if (item.getStatus() == RFIItem.ItemStatus.ANSWERED) {
                item.accept();
            }
        });
        addEvent(RFIEventType.RESPONSE_ACCEPTED, reviewedBy, "Response accepted: " + notes);
    }

    public void rejectResponse(String reviewedBy, String notes) {
        this.status = RFIStatus.REJECTED;
        addEvent(RFIEventType.RESPONSE_REJECTED, reviewedBy, "Response rejected: " + notes);
    }

    public void requestResubmission(String reviewedBy, String notes) {
        this.status = RFIStatus.RESUBMISSION_REQUIRED;
        addEvent(RFIEventType.RESPONSE_REVIEWED, reviewedBy, "Resubmission required: " + notes);
    }

    public void addItem(RFIItem item) {
        item.itemNumber = requestedItems.size() + 1;
        requestedItems.add(item);
    }

    public void addRequestAttachment(RFIAttachment attachment) {
        requestAttachments.add(attachment);
        addEvent(RFIEventType.ATTACHMENT_UPLOADED, attachment.getUploadedBy(),
            "Request attachment uploaded: " + attachment.getFileName());
    }

    public void addResponseAttachment(RFIAttachment attachment) {
        responseAttachments.add(attachment);
        addEvent(RFIEventType.ATTACHMENT_UPLOADED, attachment.getUploadedBy(),
            "Response attachment uploaded: " + attachment.getFileName());
    }

    public void requestThirdPartyData(ThirdPartyDataRequest request) {
        thirdPartyDataRequests.add(request);
        addEvent(RFIEventType.THIRD_PARTY_DATA_REQUESTED, request.getRequestedBy(),
            "Third-party data requested from " + request.getDataSource());
    }

    public void receiveThirdPartyData(String requestId, ThirdPartyDataResult result) {
        thirdPartyDataRequests.stream()
            .filter(req -> req.getRequestId().equals(requestId))
            .findFirst()
            .ifPresent(req -> {
                req.complete(result);
                addEvent(RFIEventType.THIRD_PARTY_DATA_RECEIVED, "system",
                    "Third-party data received from " + req.getDataSource());
            });
    }

    public void sendReminder() {
        this.remindersSent++;
        this.lastReminderSent = Instant.now();
        addEvent(RFIEventType.REMINDER_SENT, "system", "Reminder #" + remindersSent + " sent");
    }

    public void escalate(String escalatedTo, String reason) {
        this.isEscalated = true;
        this.escalatedTo = escalatedTo;
        this.escalatedAt = Instant.now();
        this.status = RFIStatus.ESCALATED;
        addEvent(RFIEventType.ESCALATED, "system", "Escalated to " + escalatedTo + ": " + reason);
    }

    public void extend(Duration extension, String reason, String approvedBy) {
        Instant previousDue = this.dueDate;
        this.dueDate = this.dueDate.plus(extension);
        addEvent(RFIEventType.EXTENDED, approvedBy,
            String.format("Extended from %s to %s: %s", previousDue, dueDate, reason));
    }

    public void close(String closedBy, String reason) {
        this.status = RFIStatus.CLOSED;
        this.closedAt = Instant.now();
        addEvent(RFIEventType.CLOSED, closedBy, "RFI closed: " + reason);
    }

    public void cancel(String cancelledBy, String reason) {
        this.status = RFIStatus.CANCELLED;
        this.closedAt = Instant.now();
        addEvent(RFIEventType.CANCELLED, cancelledBy, "RFI cancelled: " + reason);
    }

    public boolean isOverdue() {
        if (status == RFIStatus.CLOSED || status == RFIStatus.CANCELLED ||
            status == RFIStatus.ACCEPTED) {
            return false;
        }
        return dueDate != null && Instant.now().isAfter(dueDate);
    }

    public Duration getRemainingTime() {
        if (dueDate == null) return null;
        Duration remaining = Duration.between(Instant.now(), dueDate);
        return remaining.isNegative() ? Duration.ZERO : remaining;
    }

    public BigDecimal getCompletionPercent() {
        if (requestedItems.isEmpty()) return BigDecimal.ZERO;
        long answeredCount = requestedItems.stream()
            .filter(item -> item.getStatus() == RFIItem.ItemStatus.ANSWERED ||
                          item.getStatus() == RFIItem.ItemStatus.ACCEPTED)
            .count();
        return BigDecimal.valueOf(answeredCount * 100.0 / requestedItems.size());
    }

    private void addEvent(RFIEventType type, String actor, String description) {
        eventLog.add(new RFIEvent(type, actor, description));
    }

    // ==================== GETTERS AND SETTERS ====================

    public String getRfiId() { return rfiId; }
    public String getTaskId() { return taskId; }
    public String getWorkflowId() { return workflowId; }
    public String getCompositeId() { return compositeId; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getDescription() { return description; }
    public void setDescription(String desc) { this.description = desc; }
    public RFIType getRfiType() { return rfiType; }
    public void setRfiType(RFIType type) { this.rfiType = type; }
    public RFIPriority getPriority() { return priority; }
    public void setPriority(RFIPriority priority) { this.priority = priority; }
    public RFIStatus getStatus() { return status; }
    public RFICategory getCategory() { return category; }
    public void setCategory(RFICategory category) { this.category = category; }
    public String getRequesterId() { return requesterId; }
    public void setRequesterId(String id) { this.requesterId = id; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String name) { this.requesterName = name; }
    public String getRequesterRole() { return requesterRole; }
    public void setRequesterRole(String role) { this.requesterRole = role; }
    public String getRespondentId() { return respondentId; }
    public void setRespondentId(String id) { this.respondentId = id; }
    public String getRespondentName() { return respondentName; }
    public void setRespondentName(String name) { this.respondentName = name; }
    public String getRespondentRole() { return respondentRole; }
    public void setRespondentRole(String role) { this.respondentRole = role; }
    public List<String> getCcRecipients() { return ccRecipients; }
    public List<RFIItem> getRequestedItems() { return requestedItems; }
    public List<RFIResponse> getResponses() { return responses; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getSentAt() { return sentAt; }
    public Instant getDueDate() { return dueDate; }
    public void setDueDate(Instant due) { this.dueDate = due; }
    public Instant getRespondedAt() { return respondedAt; }
    public Instant getClosedAt() { return closedAt; }
    public Duration getReminderInterval() { return reminderInterval; }
    public void setReminderInterval(Duration interval) { this.reminderInterval = interval; }
    public int getRemindersSent() { return remindersSent; }
    public Instant getLastReminderSent() { return lastReminderSent; }
    public int getResponseAttempts() { return responseAttempts; }
    public int getMaxResponseAttempts() { return maxResponseAttempts; }
    public void setMaxResponseAttempts(int max) { this.maxResponseAttempts = max; }
    public boolean isEscalated() { return isEscalated; }
    public String getEscalatedTo() { return escalatedTo; }
    public Instant getEscalatedAt() { return escalatedAt; }
    public List<RFIAttachment> getRequestAttachments() { return requestAttachments; }
    public List<RFIAttachment> getResponseAttachments() { return responseAttachments; }
    public List<ThirdPartyDataRequest> getThirdPartyDataRequests() { return thirdPartyDataRequests; }
    public List<RFIEvent> getEventLog() { return eventLog; }
    public Map<String, Object> getMetadata() { return metadata; }
}
