package io.aurigraph.v11.contracts.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.*;

/**
 * ContractProse - Legal text component of a Ricardian ActiveContract
 *
 * Contains the human-readable legal prose with structured sections:
 * - Preamble: Introduction and context
 * - Recitals: Background statements (WHEREAS clauses)
 * - Terms: Main contractual terms
 * - Clauses: Specific contractual provisions
 * - Schedules: Supplementary documents
 * - Exhibits: Attachments and supporting materials
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
public class ContractProse {

    @JsonProperty("proseId")
    private String proseId;

    @JsonProperty("contractId")
    private String contractId;

    @JsonProperty("preamble")
    private String preamble;

    @JsonProperty("recitals")
    private List<Recital> recitals = new ArrayList<>();

    @JsonProperty("definitions")
    private Map<String, String> definitions = new LinkedHashMap<>();

    @JsonProperty("clauses")
    private List<Clause> clauses = new ArrayList<>();

    @JsonProperty("schedules")
    private List<Schedule> schedules = new ArrayList<>();

    @JsonProperty("exhibits")
    private List<Exhibit> exhibits = new ArrayList<>();

    @JsonProperty("signatures")
    private String signatureBlock;

    @JsonProperty("governingLaw")
    private String governingLaw;

    @JsonProperty("disputeResolution")
    private String disputeResolution;

    @JsonProperty("jurisdiction")
    private String jurisdiction;

    @JsonProperty("language")
    private String language = "en";

    @JsonProperty("templateId")
    private String templateId;

    @JsonProperty("templateVersion")
    private String templateVersion;

    @JsonProperty("hash")
    private String hash; // SHA-256 hash of prose content

    @JsonProperty("createdAt")
    private Instant createdAt;

    @JsonProperty("updatedAt")
    private Instant updatedAt;

    @JsonProperty("metadata")
    private Map<String, String> metadata = new HashMap<>();

    // Default constructor
    public ContractProse() {
        this.proseId = "PROSE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // Constructor with contract ID
    public ContractProse(String contractId) {
        this();
        this.contractId = contractId;
    }

    // ==================== Nested Classes ====================

    /**
     * Recital - WHEREAS clause in legal documents
     */
    public static class Recital {
        @JsonProperty("recitalId")
        private String recitalId;

        @JsonProperty("label")
        private String label; // A, B, C or FIRST, SECOND

        @JsonProperty("text")
        private String text;

        @JsonProperty("order")
        private int order;

        public Recital() {
            this.recitalId = "REC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public Recital(String label, String text, int order) {
            this();
            this.label = label;
            this.text = text;
            this.order = order;
        }

        // Getters and setters
        public String getRecitalId() { return recitalId; }
        public void setRecitalId(String recitalId) { this.recitalId = recitalId; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public int getOrder() { return order; }
        public void setOrder(int order) { this.order = order; }
    }

    /**
     * Clause - Individual contractual provision
     */
    public static class Clause {
        @JsonProperty("clauseId")
        private String clauseId;

        @JsonProperty("number")
        private String number; // 1, 1.1, 1.1.1, etc.

        @JsonProperty("title")
        private String title;

        @JsonProperty("text")
        private String text;

        @JsonProperty("type")
        private ClauseType type = ClauseType.STANDARD;

        @JsonProperty("subClauses")
        private List<Clause> subClauses = new ArrayList<>();

        @JsonProperty("references")
        private List<String> references = new ArrayList<>(); // References to other clauses

        @JsonProperty("mandatory")
        private boolean mandatory = true;

        @JsonProperty("negotiable")
        private boolean negotiable = false;

        @JsonProperty("order")
        private int order;

        public Clause() {
            this.clauseId = "CL-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public Clause(String number, String title, String text) {
            this();
            this.number = number;
            this.title = title;
            this.text = text;
        }

        // Getters and setters
        public String getClauseId() { return clauseId; }
        public void setClauseId(String clauseId) { this.clauseId = clauseId; }
        public String getNumber() { return number; }
        public void setNumber(String number) { this.number = number; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public ClauseType getType() { return type; }
        public void setType(ClauseType type) { this.type = type; }
        public List<Clause> getSubClauses() { return subClauses; }
        public void setSubClauses(List<Clause> subClauses) { this.subClauses = subClauses; }
        public List<String> getReferences() { return references; }
        public void setReferences(List<String> references) { this.references = references; }
        public boolean isMandatory() { return mandatory; }
        public void setMandatory(boolean mandatory) { this.mandatory = mandatory; }
        public boolean isNegotiable() { return negotiable; }
        public void setNegotiable(boolean negotiable) { this.negotiable = negotiable; }
        public int getOrder() { return order; }
        public void setOrder(int order) { this.order = order; }

        public void addSubClause(Clause subClause) {
            this.subClauses.add(subClause);
        }
    }

    /**
     * Schedule - Supplementary document attached to contract
     */
    public static class Schedule {
        @JsonProperty("scheduleId")
        private String scheduleId;

        @JsonProperty("number")
        private String number; // Schedule A, B, C or 1, 2, 3

        @JsonProperty("title")
        private String title;

        @JsonProperty("content")
        private String content;

        @JsonProperty("contentType")
        private String contentType = "text/plain";

        @JsonProperty("fileReference")
        private String fileReference; // Reference to uploaded file

        @JsonProperty("hash")
        private String hash;

        @JsonProperty("order")
        private int order;

        public Schedule() {
            this.scheduleId = "SCH-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public Schedule(String number, String title, String content) {
            this();
            this.number = number;
            this.title = title;
            this.content = content;
        }

        // Getters and setters
        public String getScheduleId() { return scheduleId; }
        public void setScheduleId(String scheduleId) { this.scheduleId = scheduleId; }
        public String getNumber() { return number; }
        public void setNumber(String number) { this.number = number; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        public String getFileReference() { return fileReference; }
        public void setFileReference(String fileReference) { this.fileReference = fileReference; }
        public String getHash() { return hash; }
        public void setHash(String hash) { this.hash = hash; }
        public int getOrder() { return order; }
        public void setOrder(int order) { this.order = order; }
    }

    /**
     * Exhibit - Attachment or supporting material
     */
    public static class Exhibit {
        @JsonProperty("exhibitId")
        private String exhibitId;

        @JsonProperty("label")
        private String label; // Exhibit A, B, C

        @JsonProperty("title")
        private String title;

        @JsonProperty("description")
        private String description;

        @JsonProperty("fileReference")
        private String fileReference;

        @JsonProperty("fileType")
        private String fileType;

        @JsonProperty("fileSize")
        private long fileSize;

        @JsonProperty("hash")
        private String hash;

        @JsonProperty("order")
        private int order;

        public Exhibit() {
            this.exhibitId = "EXH-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }

        public Exhibit(String label, String title, String description) {
            this();
            this.label = label;
            this.title = title;
            this.description = description;
        }

        // Getters and setters
        public String getExhibitId() { return exhibitId; }
        public void setExhibitId(String exhibitId) { this.exhibitId = exhibitId; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getFileReference() { return fileReference; }
        public void setFileReference(String fileReference) { this.fileReference = fileReference; }
        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }
        public long getFileSize() { return fileSize; }
        public void setFileSize(long fileSize) { this.fileSize = fileSize; }
        public String getHash() { return hash; }
        public void setHash(String hash) { this.hash = hash; }
        public int getOrder() { return order; }
        public void setOrder(int order) { this.order = order; }
    }

    /**
     * Clause types for categorization
     */
    public enum ClauseType {
        STANDARD,           // Normal contractual clause
        DEFINITION,         // Definition clause
        OBLIGATION,         // Party obligation
        RIGHT,              // Party right
        CONDITION,          // Condition precedent/subsequent
        WARRANTY,           // Warranty/representation
        INDEMNITY,          // Indemnification clause
        LIMITATION,         // Limitation of liability
        TERMINATION,        // Termination provisions
        CONFIDENTIALITY,    // Confidentiality clause
        DISPUTE,            // Dispute resolution
        GOVERNING_LAW,      // Governing law
        FORCE_MAJEURE,      // Force majeure
        ASSIGNMENT,         // Assignment restrictions
        AMENDMENT,          // Amendment provisions
        SEVERABILITY,       // Severability clause
        ENTIRE_AGREEMENT,   // Entire agreement clause
        NOTICES,            // Notice provisions
        CUSTOM              // Custom clause type
    }

    // ==================== Utility Methods ====================

    /**
     * Get total number of clauses including sub-clauses
     */
    public int getTotalClauseCount() {
        return countClauses(clauses);
    }

    private int countClauses(List<Clause> clauseList) {
        int count = 0;
        for (Clause clause : clauseList) {
            count++;
            count += countClauses(clause.getSubClauses());
        }
        return count;
    }

    /**
     * Get full prose text for hashing
     */
    public String getFullText() {
        StringBuilder sb = new StringBuilder();
        sb.append(preamble != null ? preamble : "");

        for (Recital r : recitals) {
            sb.append(r.getText());
        }

        for (Clause c : clauses) {
            appendClauseText(sb, c);
        }

        for (Schedule s : schedules) {
            sb.append(s.getContent() != null ? s.getContent() : "");
        }

        return sb.toString();
    }

    private void appendClauseText(StringBuilder sb, Clause clause) {
        sb.append(clause.getText() != null ? clause.getText() : "");
        for (Clause sub : clause.getSubClauses()) {
            appendClauseText(sb, sub);
        }
    }

    /**
     * Add a recital
     */
    public void addRecital(String label, String text) {
        recitals.add(new Recital(label, text, recitals.size()));
    }

    /**
     * Add a clause
     */
    public void addClause(String number, String title, String text) {
        Clause clause = new Clause(number, title, text);
        clause.setOrder(clauses.size());
        clauses.add(clause);
    }

    /**
     * Add a schedule
     */
    public void addSchedule(String number, String title, String content) {
        Schedule schedule = new Schedule(number, title, content);
        schedule.setOrder(schedules.size());
        schedules.add(schedule);
    }

    /**
     * Add an exhibit
     */
    public void addExhibit(String label, String title, String description) {
        Exhibit exhibit = new Exhibit(label, title, description);
        exhibit.setOrder(exhibits.size());
        exhibits.add(exhibit);
    }

    /**
     * Add a definition
     */
    public void addDefinition(String term, String definition) {
        definitions.put(term, definition);
    }

    // ==================== Getters and Setters ====================

    public String getProseId() { return proseId; }
    public void setProseId(String proseId) { this.proseId = proseId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getPreamble() { return preamble; }
    public void setPreamble(String preamble) {
        this.preamble = preamble;
        this.updatedAt = Instant.now();
    }

    public List<Recital> getRecitals() { return recitals; }
    public void setRecitals(List<Recital> recitals) {
        this.recitals = recitals;
        this.updatedAt = Instant.now();
    }

    public Map<String, String> getDefinitions() { return definitions; }
    public void setDefinitions(Map<String, String> definitions) {
        this.definitions = definitions;
        this.updatedAt = Instant.now();
    }

    public List<Clause> getClauses() { return clauses; }
    public void setClauses(List<Clause> clauses) {
        this.clauses = clauses;
        this.updatedAt = Instant.now();
    }

    public List<Schedule> getSchedules() { return schedules; }
    public void setSchedules(List<Schedule> schedules) {
        this.schedules = schedules;
        this.updatedAt = Instant.now();
    }

    public List<Exhibit> getExhibits() { return exhibits; }
    public void setExhibits(List<Exhibit> exhibits) {
        this.exhibits = exhibits;
        this.updatedAt = Instant.now();
    }

    public String getSignatureBlock() { return signatureBlock; }
    public void setSignatureBlock(String signatureBlock) { this.signatureBlock = signatureBlock; }

    public String getGoverningLaw() { return governingLaw; }
    public void setGoverningLaw(String governingLaw) { this.governingLaw = governingLaw; }

    public String getDisputeResolution() { return disputeResolution; }
    public void setDisputeResolution(String disputeResolution) { this.disputeResolution = disputeResolution; }

    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public String getTemplateVersion() { return templateVersion; }
    public void setTemplateVersion(String templateVersion) { this.templateVersion = templateVersion; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }

    @Override
    public String toString() {
        return String.format("ContractProse{id='%s', contractId='%s', clauses=%d, schedules=%d, exhibits=%d}",
            proseId, contractId, clauses.size(), schedules.size(), exhibits.size());
    }
}
