# ================================================================================
# AUREX LAUNCHPAD™ DOCUMENT INTELLIGENCE MODELS
# Comprehensive AI-powered document processing and analytics models
# Agent: AI/ML Expert Agent + Document Intelligence Agent
# ================================================================================

from sqlalchemy import Column, String, DateTime, Boolean, JSON, Text, Integer, Float, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
import uuid
from typing import Optional, Dict, Any, List, Union
from enum import Enum

from .base_models import BaseModelWithSoftDelete, TimestampMixin

# ================================================================================
# DOCUMENT INTELLIGENCE ENUMS AND CONSTANTS
# ================================================================================

class DocumentType(Enum):
    """Supported document types for AI processing"""
    PDF = "pdf"
    EXCEL = "excel"
    WORD = "word"
    CSV = "csv"
    IMAGE = "image"
    TEXT = "text"
    XML = "xml"
    JSON = "json"
    POWERPOINT = "powerpoint"
    EMAIL = "email"
    WEB_PAGE = "web_page"
    UNKNOWN = "unknown"

class ProcessingStatus(Enum):
    """Document processing pipeline status"""
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"
    REPROCESSING = "reprocessing"

class DocumentCategory(Enum):
    """ESG document categories for classification"""
    SUSTAINABILITY_REPORT = "sustainability_report"
    EMISSIONS_DATA = "emissions_data"
    ENERGY_CONSUMPTION = "energy_consumption"
    WATER_USAGE = "water_usage"
    WASTE_MANAGEMENT = "waste_management"
    SUPPLY_CHAIN = "supply_chain"
    EMPLOYEE_DATA = "employee_data"
    GOVERNANCE_REPORT = "governance_report"
    COMPLIANCE_DOCUMENT = "compliance_document"
    FINANCIAL_REPORT = "financial_report"
    CERTIFICATION = "certification"
    POLICY_DOCUMENT = "policy_document"
    TRAINING_MATERIAL = "training_material"
    ASSESSMENT_FORM = "assessment_form"
    THIRD_PARTY_VERIFICATION = "third_party_verification"
    UNKNOWN = "unknown"

class ESGFramework(Enum):
    """ESG frameworks for document alignment"""
    GRI = "gri"
    SASB = "sasb"
    TCFD = "tcfd"
    CDP = "cdp"
    ISO14064 = "iso14064"
    EU_TAXONOMY = "eu_taxonomy"
    SEC_CLIMATE = "sec_climate"
    UN_GLOBAL_COMPACT = "un_global_compact"
    CUSTOM = "custom"

class ExtractionMethod(Enum):
    """Methods used for data extraction"""
    OCR = "ocr"
    TEXT_PARSING = "text_parsing"
    TABLE_EXTRACTION = "table_extraction"
    NLP_EXTRACTION = "nlp_extraction"
    AI_INFERENCE = "ai_inference"
    PATTERN_MATCHING = "pattern_matching"
    MANUAL_ENTRY = "manual_entry"
    API_INTEGRATION = "api_integration"

class ValidationStatus(Enum):
    """Validation status for extracted data"""
    VALIDATED = "validated"
    PENDING_VALIDATION = "pending_validation"
    FLAGGED = "flagged"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"

class ConfidenceLevel(Enum):
    """Confidence levels for AI extraction"""
    VERY_HIGH = "very_high"  # >95%
    HIGH = "high"           # 85-95%
    MEDIUM = "medium"       # 70-85%
    LOW = "low"            # 50-70%
    VERY_LOW = "very_low"  # <50%

# ================================================================================
# CORE DOCUMENT MODELS
# ================================================================================

class DocumentMaster(BaseModelWithSoftDelete, TimestampMixin):
    """Master registry for all processed documents"""
    __tablename__ = "document_master"
    
    # Document identification
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=False, unique=True, index=True)  # SHA-256
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    # File storage information
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_bucket = Column(String(100), nullable=True)
    storage_region = Column(String(50), nullable=True)
    
    # Document metadata
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    language = Column(String(10), default="en")
    document_date = Column(DateTime, nullable=True)
    version = Column(String(50), nullable=True)
    
    # Organization and ownership
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    uploaded_by_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    upload_source = Column(String(100), default="manual")  # manual, api, integration, email
    
    # Processing status
    processing_status = Column(SQLEnum(ProcessingStatus), default=ProcessingStatus.PENDING)
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    processing_error = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Security and access control
    access_level = Column(String(50), default="organization")  # public, organization, restricted, confidential
    is_confidential = Column(Boolean, default=False)
    encryption_key_id = Column(String(255), nullable=True)
    data_classification = Column(String(50), nullable=True)
    
    # Document validity
    expiry_date = Column(DateTime, nullable=True)
    superseded_by_id = Column(UUID(as_uuid=True), nullable=True)
    is_superseded = Column(Boolean, default=False)
    
    # Usage tracking
    download_count = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime, nullable=True)
    
    # Quality and validation
    data_quality_score = Column(Float, nullable=True)  # 0.0 to 1.0
    validation_status = Column(SQLEnum(ValidationStatus), default=ValidationStatus.PENDING_VALIDATION)
    validated_by_id = Column(UUID(as_uuid=True), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    
    # AI processing results
    ai_processing_time_ms = Column(Integer, nullable=True)
    ai_confidence_score = Column(Float, nullable=True)
    ai_processing_cost = Column(Float, nullable=True)  # Track AI API costs
    
    # Document relationships
    parent_document_id = Column(UUID(as_uuid=True), nullable=True)  # For extracted pages or sections
    document_set_id = Column(UUID(as_uuid=True), nullable=True)  # Group related documents
    
    # Relationships
    classifications = relationship("DocumentClassification", back_populates="document")
    extractions = relationship("DocumentDataExtraction", back_populates="document")
    processing_logs = relationship("DocumentProcessingLog", back_populates="document")
    versions = relationship("DocumentVersion", back_populates="document")
    annotations = relationship("DocumentAnnotation", back_populates="document")
    insights = relationship("DocumentInsight", back_populates="document")
    
    def get_file_extension(self) -> str:
        """Get file extension from filename"""
        return self.original_filename.split('.')[-1].lower() if '.' in self.original_filename else ''
    
    def is_image_document(self) -> bool:
        """Check if document is an image type"""
        return self.document_type == DocumentType.IMAGE
    
    def is_structured_document(self) -> bool:
        """Check if document has structured data (Excel, CSV, JSON)"""
        return self.document_type in [DocumentType.EXCEL, DocumentType.CSV, DocumentType.JSON]
    
    def can_extract_text(self) -> bool:
        """Check if document supports text extraction"""
        return self.document_type in [
            DocumentType.PDF, DocumentType.WORD, DocumentType.TEXT, 
            DocumentType.IMAGE, DocumentType.POWERPOINT
        ]
    
    def get_processing_duration(self) -> Optional[int]:
        """Get processing duration in seconds"""
        if self.processing_started_at and self.processing_completed_at:
            return int((self.processing_completed_at - self.processing_started_at).total_seconds())
        return None

class DocumentClassification(BaseModelWithSoftDelete, TimestampMixin):
    """AI-powered document classification results"""
    __tablename__ = "document_classifications"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Classification results
    primary_category = Column(SQLEnum(DocumentCategory), nullable=False)
    secondary_categories = Column(ARRAY(String), nullable=True)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    
    # ESG framework alignment
    detected_frameworks = Column(ARRAY(String), nullable=True)
    framework_coverage = Column(JSON, nullable=True)  # Framework-specific coverage analysis
    
    # Content analysis
    key_topics = Column(ARRAY(String), nullable=True)
    document_themes = Column(JSON, nullable=True)
    content_summary = Column(Text, nullable=True)
    
    # Classification metadata
    classifier_model = Column(String(100), nullable=False)
    classifier_version = Column(String(50), nullable=False)
    classification_date = Column(DateTime, default=datetime.utcnow)
    
    # Manual override capability
    manual_classification = Column(SQLEnum(DocumentCategory), nullable=True)
    manual_override_reason = Column(Text, nullable=True)
    classified_by_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Quality indicators
    content_quality_score = Column(Float, nullable=True)
    completeness_score = Column(Float, nullable=True)
    structure_score = Column(Float, nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster", back_populates="classifications")

class DocumentDataExtraction(BaseModelWithSoftDelete, TimestampMixin):
    """Extracted data points from documents"""
    __tablename__ = "document_data_extractions"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Extraction identification
    field_name = Column(String(255), nullable=False)
    field_category = Column(String(100), nullable=False)  # environmental, social, governance
    data_type = Column(String(50), nullable=False)  # numeric, text, boolean, date, currency
    
    # Extracted values (flexible storage)
    extracted_value = Column(JSON, nullable=True)
    numeric_value = Column(Float, nullable=True)
    text_value = Column(Text, nullable=True)
    boolean_value = Column(Boolean, nullable=True)
    date_value = Column(DateTime, nullable=True)
    
    # Units and context
    unit_of_measurement = Column(String(100), nullable=True)
    reporting_period = Column(String(100), nullable=True)
    geographic_scope = Column(String(255), nullable=True)
    organizational_scope = Column(String(255), nullable=True)
    
    # Extraction metadata
    extraction_method = Column(SQLEnum(ExtractionMethod), nullable=False)
    confidence_level = Column(SQLEnum(ConfidenceLevel), nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    
    # Source location information
    page_number = Column(Integer, nullable=True)
    section_name = Column(String(255), nullable=True)
    table_name = Column(String(255), nullable=True)
    cell_reference = Column(String(50), nullable=True)  # Excel cell reference
    text_coordinates = Column(JSON, nullable=True)  # For OCR extractions
    
    # Context and validation
    surrounding_context = Column(Text, nullable=True)
    extraction_notes = Column(Text, nullable=True)
    validation_status = Column(SQLEnum(ValidationStatus), default=ValidationStatus.PENDING_VALIDATION)
    validation_notes = Column(Text, nullable=True)
    
    # Quality indicators
    data_quality_flags = Column(ARRAY(String), nullable=True)
    anomaly_score = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)
    
    # Manual validation
    validated_by_id = Column(UUID(as_uuid=True), nullable=True)
    validated_at = Column(DateTime, nullable=True)
    corrected_value = Column(JSON, nullable=True)
    correction_reason = Column(Text, nullable=True)
    
    # AI enhancement
    ai_suggested_corrections = Column(JSON, nullable=True)
    ai_confidence_factors = Column(JSON, nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster", back_populates="extractions")
    
    def get_formatted_value(self) -> Any:
        """Get appropriately formatted value based on data type"""
        if self.corrected_value is not None:
            return self.corrected_value
        elif self.numeric_value is not None:
            return self.numeric_value
        elif self.boolean_value is not None:
            return self.boolean_value
        elif self.date_value is not None:
            return self.date_value
        elif self.text_value is not None:
            return self.text_value
        elif self.extracted_value is not None:
            return self.extracted_value
        return None
    
    def is_high_quality(self) -> bool:
        """Check if extraction meets high quality standards"""
        return (self.confidence_score >= 0.8 and 
                self.validation_status == ValidationStatus.VALIDATED and
                not self.data_quality_flags)

# ================================================================================
# DOCUMENT PROCESSING AND WORKFLOW MODELS
# ================================================================================

class DocumentProcessingLog(BaseModelWithSoftDelete, TimestampMixin):
    """Detailed logging of document processing steps"""
    __tablename__ = "document_processing_logs"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Processing step information
    step_name = Column(String(100), nullable=False)
    step_order = Column(Integer, nullable=False)
    step_status = Column(String(50), nullable=False)  # started, completed, failed, skipped
    
    # Timing information
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    
    # Processing details
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_details = Column(Text, nullable=True)
    warning_messages = Column(ARRAY(String), nullable=True)
    
    # Resource usage
    cpu_time_ms = Column(Integer, nullable=True)
    memory_usage_mb = Column(Integer, nullable=True)
    api_calls_made = Column(Integer, nullable=True)
    tokens_processed = Column(Integer, nullable=True)
    
    # Processing context
    processor_version = Column(String(50), nullable=True)
    model_versions = Column(JSON, nullable=True)
    configuration = Column(JSON, nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster", back_populates="processing_logs")

class DocumentVersion(BaseModelWithSoftDelete, TimestampMixin):
    """Document version control and change tracking"""
    __tablename__ = "document_versions"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Version information
    version_number = Column(Integer, nullable=False)
    version_name = Column(String(100), nullable=True)
    change_description = Column(Text, nullable=True)
    change_type = Column(String(50), nullable=False)  # upload, reprocess, correction, merge
    
    # Version metadata
    created_by_id = Column(UUID(as_uuid=True), nullable=False)
    parent_version_id = Column(UUID(as_uuid=True), nullable=True)
    is_current = Column(Boolean, default=True)
    
    # Content changes
    content_hash = Column(String(64), nullable=False)
    extraction_count = Column(Integer, default=0)
    changes_summary = Column(JSON, nullable=True)
    
    # File information for this version
    file_path = Column(String(1000), nullable=True)
    file_size = Column(Integer, nullable=True)
    processing_results = Column(JSON, nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster", back_populates="versions")

class DocumentAnnotation(BaseModelWithSoftDelete, TimestampMixin):
    """Manual annotations and comments on documents"""
    __tablename__ = "document_annotations"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Annotation content
    annotation_text = Column(Text, nullable=False)
    annotation_type = Column(String(50), nullable=False)  # comment, correction, question, highlight
    
    # Location information
    page_number = Column(Integer, nullable=True)
    coordinates = Column(JSON, nullable=True)  # x, y, width, height for highlights
    text_selection = Column(Text, nullable=True)
    
    # Annotation metadata
    created_by_id = Column(UUID(as_uuid=True), nullable=False)
    is_resolved = Column(Boolean, default=False)
    resolved_by_id = Column(UUID(as_uuid=True), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Visibility and access
    visibility = Column(String(50), default="organization")  # private, team, organization, public
    tags = Column(ARRAY(String), nullable=True)
    
    # Threading and replies
    parent_annotation_id = Column(UUID(as_uuid=True), nullable=True)
    reply_count = Column(Integer, default=0)
    
    # Relationships
    document = relationship("DocumentMaster", back_populates="annotations")

# ================================================================================
# AI INSIGHTS AND ANALYTICS MODELS
# ================================================================================

class DocumentInsight(BaseModelWithSoftDelete, TimestampMixin):
    """AI-generated insights and analytics from documents"""
    __tablename__ = "document_insights"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Insight classification
    insight_type = Column(String(100), nullable=False)  # trend, anomaly, gap, recommendation, benchmark
    insight_category = Column(String(100), nullable=False)  # data_quality, compliance, performance, risk
    
    # Insight content
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    detailed_analysis = Column(Text, nullable=True)
    
    # Impact and priority
    severity_level = Column(String(50), nullable=False)  # critical, high, medium, low, info
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    potential_impact = Column(String(50), nullable=True)  # high, medium, low
    
    # Supporting data
    supporting_data = Column(JSON, nullable=True)
    evidence_references = Column(ARRAY(String), nullable=True)
    statistical_metrics = Column(JSON, nullable=True)
    
    # Recommendations
    recommendations = Column(ARRAY(String), nullable=True)
    action_items = Column(JSON, nullable=True)
    estimated_effort = Column(String(50), nullable=True)  # low, medium, high
    
    # Context and scope
    affected_frameworks = Column(ARRAY(String), nullable=True)
    related_metrics = Column(ARRAY(String), nullable=True)
    time_period = Column(String(100), nullable=True)
    
    # AI metadata
    ai_model_version = Column(String(100), nullable=False)
    processing_date = Column(DateTime, default=datetime.utcnow)
    prompt_version = Column(String(50), nullable=True)
    
    # User feedback
    user_rating = Column(Integer, nullable=True)  # 1-5 stars
    user_feedback = Column(Text, nullable=True)
    is_useful = Column(Boolean, nullable=True)
    
    # Status tracking
    status = Column(String(50), default="active")  # active, dismissed, resolved, archived
    assigned_to_id = Column(UUID(as_uuid=True), nullable=True)
    due_date = Column(DateTime, nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster", back_populates="insights")

class DocumentBenchmark(BaseModelWithSoftDelete, TimestampMixin):
    """Document performance benchmarking and comparison"""
    __tablename__ = "document_benchmarks"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Benchmark context
    benchmark_type = Column(String(100), nullable=False)  # industry, peer, historical, best_practice
    benchmark_name = Column(String(255), nullable=False)
    benchmark_description = Column(Text, nullable=True)
    
    # Benchmark data
    metric_name = Column(String(255), nullable=False)
    document_value = Column(Float, nullable=False)
    benchmark_value = Column(Float, nullable=False)
    percentile_rank = Column(Float, nullable=True)  # 0.0 to 100.0
    
    # Performance analysis
    performance_gap = Column(Float, nullable=True)  # Difference from benchmark
    performance_category = Column(String(50), nullable=True)  # leading, average, lagging
    improvement_potential = Column(Float, nullable=True)
    
    # Benchmark metadata
    data_source = Column(String(255), nullable=True)
    sample_size = Column(Integer, nullable=True)
    confidence_interval = Column(JSON, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Geographic and industry context
    industry_code = Column(String(20), nullable=True)
    region = Column(String(100), nullable=True)
    organization_size_category = Column(String(50), nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster")

# ================================================================================
# INTEGRATION AND WORKFLOW MODELS  
# ================================================================================

class DocumentWorkflow(BaseModelWithSoftDelete, TimestampMixin):
    """Document processing and approval workflows"""
    __tablename__ = "document_workflows"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Workflow definition
    workflow_name = Column(String(255), nullable=False)
    workflow_type = Column(String(100), nullable=False)  # processing, approval, review, integration
    workflow_version = Column(String(50), nullable=True)
    
    # Workflow state
    current_step = Column(String(100), nullable=False)
    workflow_status = Column(String(50), nullable=False)  # active, completed, failed, cancelled
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Workflow configuration
    workflow_config = Column(JSON, nullable=True)
    step_definitions = Column(JSON, nullable=False)
    approval_rules = Column(JSON, nullable=True)
    
    # Progress tracking
    steps_completed = Column(Integer, default=0)
    total_steps = Column(Integer, nullable=False)
    completion_percentage = Column(Float, default=0.0)
    
    # Assignment and responsibility
    assigned_to_id = Column(UUID(as_uuid=True), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), nullable=False)
    escalation_level = Column(Integer, default=0)
    
    # SLA and timing
    target_completion_date = Column(DateTime, nullable=True)
    actual_completion_date = Column(DateTime, nullable=True)
    is_overdue = Column(Boolean, default=False)
    
    # Results and outputs
    workflow_results = Column(JSON, nullable=True)
    output_artifacts = Column(ARRAY(String), nullable=True)
    quality_metrics = Column(JSON, nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster")

class DocumentIntegration(BaseModelWithSoftDelete, TimestampMixin):
    """Integration with external systems and services"""
    __tablename__ = "document_integrations"
    
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_master.id"), nullable=False, index=True)
    
    # Integration details
    integration_type = Column(String(100), nullable=False)  # ghg_calculator, eu_taxonomy, reporting_tool
    external_system = Column(String(255), nullable=False)
    integration_status = Column(String(50), nullable=False)  # pending, active, completed, failed
    
    # Data mapping
    field_mappings = Column(JSON, nullable=False)
    data_transformations = Column(JSON, nullable=True)
    validation_rules = Column(JSON, nullable=True)
    
    # Integration results
    records_processed = Column(Integer, default=0)
    records_successful = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_details = Column(JSON, nullable=True)
    
    # Timing and performance
    integration_started_at = Column(DateTime, nullable=False)
    integration_completed_at = Column(DateTime, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    
    # Configuration
    integration_config = Column(JSON, nullable=True)
    retry_settings = Column(JSON, nullable=True)
    notification_settings = Column(JSON, nullable=True)
    
    # Quality assurance
    data_quality_checks = Column(JSON, nullable=True)
    validation_results = Column(JSON, nullable=True)
    audit_trail = Column(JSON, nullable=True)
    
    # Relationships
    document = relationship("DocumentMaster")

print("✅ Document Intelligence Models Loaded Successfully!")
print("Features:")
print("  📄 Complete Document Lifecycle Management")
print("  🤖 AI-Powered Classification & Extraction") 
print("  📊 50+ ESG Document Categories")
print("  🔍 Multi-Method Data Extraction")
print("  ✅ Advanced Validation & Quality Control")
print("  📈 Real-time Processing Status")
print("  🔄 Version Control & Audit Trail")
print("  💡 AI Insights & Benchmarking")
print("  🔗 Enterprise System Integration")
print("  🛡️ Security & Access Control")