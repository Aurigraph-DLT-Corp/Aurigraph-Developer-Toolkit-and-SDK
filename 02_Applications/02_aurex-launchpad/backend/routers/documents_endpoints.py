# ================================================================================
# AUREX LAUNCHPAD™ DOCUMENT INTELLIGENCE ENDPOINTS - PART 2
# Real-time status, analysis, and integration endpoints
# Agent: AI/ML Expert Agent + Document Intelligence Agent
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import json

# Database and authentication imports
from models.base_models import get_db
from models.auth_models import User
from routers.auth import get_current_user

# Document Intelligence models
from models.document_intelligence_models import (
    DocumentMaster, DocumentClassification, DocumentDataExtraction,
    DocumentProcessingLog, DocumentVersion, DocumentInsight,
    DocumentType, ProcessingStatus, DocumentCategory, ESGFramework,
    ExtractionMethod, ValidationStatus, ConfidenceLevel
)

# Pydantic models (from documents.py)
from routers.documents import (
    DocumentProcessingStatus, DocumentAnalysisResponse, DocumentListResponse,
    DocumentMetadata, ExtractedDataPoint, DocumentClassificationResult,
    DocumentInsightData, DocumentSearchRequest, BatchProcessingRequest,
    DataExtractionRequest, DocumentValidationRequest, DocumentComparisonRequest
)

# Service imports
from services.document_intelligence import DocumentIntelligenceService

router = APIRouter(prefix="/api/v1/documents", tags=["Document Intelligence & Processing"])
doc_intelligence_service = DocumentIntelligenceService()

# ================================================================================
# REAL-TIME PROCESSING STATUS ENDPOINTS
# ================================================================================

@router.get("/{document_id}/status", response_model=DocumentProcessingStatus)
async def get_document_processing_status(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time document processing status"""
    
    # Get document
    document = db.query(DocumentMaster).filter(
        DocumentMaster.id == document_id,
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentMaster.is_deleted == False
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Get latest processing logs
    latest_logs = db.query(DocumentProcessingLog).filter(
        DocumentProcessingLog.document_id == document_id
    ).order_by(DocumentProcessingLog.created_at.desc()).limit(5).all()
    
    # Calculate progress
    total_steps = len(doc_intelligence_service.pipeline_steps)
    completed_steps = len([log for log in latest_logs if log.step_status == "completed"])
    progress_percentage = (completed_steps / total_steps) * 100 if total_steps > 0 else 0
    
    # Determine current step
    current_step = "pending"
    if latest_logs:
        current_log = latest_logs[0]
        if current_log.step_status == "started":
            current_step = current_log.step_name
        elif current_log.step_status == "completed" and completed_steps < total_steps:
            next_step_index = completed_steps
            if next_step_index < len(doc_intelligence_service.pipeline_steps):
                current_step = doc_intelligence_service.pipeline_steps[next_step_index]
        else:
            current_step = "completed"
    
    # Calculate processing time
    processing_time = None
    if document.processing_started_at:
        end_time = document.processing_completed_at or datetime.utcnow()
        processing_time = (end_time - document.processing_started_at).total_seconds()
    
    # Estimate completion
    estimated_completion = None
    if document.processing_status == ProcessingStatus.PROCESSING and document.processing_started_at:
        estimated_time = doc_intelligence_service.processing_stats.get("avg_processing_time", 120)
        estimated_completion = document.processing_started_at + timedelta(seconds=estimated_time)
    
    return DocumentProcessingStatus(
        document_id=document_id,
        status=document.processing_status,
        current_step=current_step,
        progress_percentage=progress_percentage,
        steps_completed=completed_steps,
        total_steps=total_steps,
        processing_time_seconds=processing_time,
        estimated_completion=estimated_completion,
        error_message=document.processing_error
    )

@router.get("/{document_id}/logs")
async def get_document_processing_logs(
    document_id: UUID,
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed processing logs for document"""
    
    # Verify document access
    document = db.query(DocumentMaster).filter(
        DocumentMaster.id == document_id,
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentMaster.is_deleted == False
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Get processing logs
    logs = db.query(DocumentProcessingLog).filter(
        DocumentProcessingLog.document_id == document_id
    ).order_by(DocumentProcessingLog.started_at.desc()).limit(limit).all()
    
    # Format logs for response
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "id": log.id,
            "step_name": log.step_name,
            "step_order": log.step_order,
            "status": log.step_status,
            "started_at": log.started_at,
            "completed_at": log.completed_at,
            "duration_ms": log.duration_ms,
            "input_data": log.input_data,
            "output_data": log.output_data,
            "error_details": log.error_details,
            "warnings": log.warning_messages,
            "resource_usage": {
                "cpu_time_ms": log.cpu_time_ms,
                "memory_usage_mb": log.memory_usage_mb,
                "api_calls": log.api_calls_made,
                "tokens_processed": log.tokens_processed
            }
        })
    
    return {
        "document_id": document_id,
        "total_logs": len(formatted_logs),
        "logs": formatted_logs
    }

# ================================================================================
# DOCUMENT RETRIEVAL AND ANALYSIS ENDPOINTS
# ================================================================================

@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    document_type: Optional[DocumentType] = Query(None),
    category: Optional[DocumentCategory] = Query(None),
    status: Optional[ProcessingStatus] = Query(None),
    search_query: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|filename|file_size|data_quality_score)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated list of documents with filtering and search"""
    
    # Base query
    query = db.query(DocumentMaster).filter(
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentMaster.is_deleted == False
    )
    
    # Apply filters
    if document_type:
        query = query.filter(DocumentMaster.document_type == document_type)
    
    if category:
        query = query.join(DocumentClassification).filter(
            DocumentClassification.primary_category == category
        )
    
    if status:
        query = query.filter(DocumentMaster.processing_status == status)
    
    if search_query:
        search_filter = f"%{search_query}%"
        query = query.filter(
            db.or_(
                DocumentMaster.title.ilike(search_filter),
                DocumentMaster.filename.ilike(search_filter),
                DocumentMaster.description.ilike(search_filter),
                DocumentMaster.original_filename.ilike(search_filter)
            )
        )
    
    # Apply sorting
    sort_column = getattr(DocumentMaster, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    documents = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    document_metadata = []
    for doc in documents:
        # Get classification info
        classification = db.query(DocumentClassification).filter(
            DocumentClassification.document_id == doc.id
        ).first()
        
        metadata = DocumentMetadata(
            id=doc.id,
            filename=doc.filename,
            original_filename=doc.original_filename,
            file_hash=doc.file_hash,
            document_type=doc.document_type,
            mime_type=doc.mime_type,
            file_size=doc.file_size,
            title=doc.title,
            description=doc.description,
            language=doc.language,
            document_date=doc.document_date,
            processing_status=doc.processing_status,
            processing_started_at=doc.processing_started_at,
            processing_completed_at=doc.processing_completed_at,
            processing_error=doc.processing_error,
            primary_category=classification.primary_category if classification else None,
            secondary_categories=classification.secondary_categories if classification else [],
            detected_frameworks=classification.detected_frameworks if classification else [],
            data_quality_score=doc.data_quality_score,
            ai_confidence_score=doc.ai_confidence_score,
            validation_status=doc.validation_status,
            uploaded_at=doc.created_at,
            updated_at=doc.updated_at
        )
        document_metadata.append(metadata)
    
    return DocumentListResponse(
        documents=document_metadata,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
        filters_applied={
            "document_type": document_type.value if document_type else None,
            "category": category.value if category else None,
            "status": status.value if status else None,
            "search_query": search_query
        }
    )

@router.get("/{document_id}", response_model=DocumentAnalysisResponse)
async def get_document_analysis(
    document_id: UUID,
    include_processing_logs: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete document analysis results"""
    
    # Get document with related data
    document = db.query(DocumentMaster).options(
        joinedload(DocumentMaster.classifications),
        joinedload(DocumentMaster.extractions),
        joinedload(DocumentMaster.insights)
    ).filter(
        DocumentMaster.id == document_id,
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentMaster.is_deleted == False
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Build metadata
    classification = document.classifications[0] if document.classifications else None
    
    metadata = DocumentMetadata(
        id=document.id,
        filename=document.filename,
        original_filename=document.original_filename,
        file_hash=document.file_hash,
        document_type=document.document_type,
        mime_type=document.mime_type,
        file_size=document.file_size,
        title=document.title,
        description=document.description,
        language=document.language,
        document_date=document.document_date,
        processing_status=document.processing_status,
        processing_started_at=document.processing_started_at,
        processing_completed_at=document.processing_completed_at,
        processing_error=document.processing_error,
        primary_category=classification.primary_category if classification else None,
        secondary_categories=classification.secondary_categories if classification else [],
        detected_frameworks=classification.detected_frameworks if classification else [],
        data_quality_score=document.data_quality_score,
        ai_confidence_score=document.ai_confidence_score,
        validation_status=document.validation_status,
        uploaded_at=document.created_at,
        updated_at=document.updated_at
    )
    
    # Build classification result
    classification_result = None
    if classification:
        classification_result = DocumentClassificationResult(
            id=classification.id,
            primary_category=classification.primary_category,
            secondary_categories=classification.secondary_categories or [],
            confidence_score=classification.confidence_score,
            detected_frameworks=classification.detected_frameworks or [],
            key_topics=classification.key_topics or [],
            content_summary=classification.content_summary,
            classification_date=classification.classification_date
        )
    
    # Build extracted data points
    extracted_data = []
    for extraction in document.extractions:
        data_point = ExtractedDataPoint(
            id=extraction.id,
            field_name=extraction.field_name,
            field_category=extraction.field_category,
            data_type=extraction.data_type,
            extracted_value=extraction.get_formatted_value(),
            unit_of_measurement=extraction.unit_of_measurement,
            confidence_level=extraction.confidence_level,
            confidence_score=extraction.confidence_score,
            extraction_method=extraction.extraction_method,
            page_number=extraction.page_number,
            section_name=extraction.section_name,
            validation_status=extraction.validation_status
        )
        extracted_data.append(data_point)
    
    # Build insights
    insights = []
    for insight in document.insights:
        insight_data = DocumentInsightData(
            id=insight.id,
            insight_type=insight.insight_type,
            insight_category=insight.insight_category,
            title=insight.title,
            description=insight.description,
            severity_level=insight.severity_level,
            confidence_score=insight.confidence_score,
            recommendations=insight.recommendations or [],
            supporting_data=insight.supporting_data,
            created_at=insight.created_at
        )
        insights.append(insight_data)
    
    # Get processing logs if requested
    processing_logs = None
    if include_processing_logs:
        logs = db.query(DocumentProcessingLog).filter(
            DocumentProcessingLog.document_id == document_id
        ).order_by(DocumentProcessingLog.started_at.desc()).limit(20).all()
        
        processing_logs = []
        for log in logs:
            processing_logs.append({
                "step_name": log.step_name,
                "status": log.step_status,
                "started_at": log.started_at,
                "duration_ms": log.duration_ms,
                "error_details": log.error_details
            })
    
    # Build quality metrics
    quality_metrics = {
        "data_quality_score": document.data_quality_score,
        "ai_confidence_score": document.ai_confidence_score,
        "validation_status": document.validation_status.value if document.validation_status else None,
        "extraction_count": len(extracted_data),
        "high_confidence_extractions": len([e for e in extracted_data if e.confidence_score > 0.8]),
        "framework_coverage": len(classification.detected_frameworks) if classification else 0,
        "processing_time_seconds": document.get_processing_duration()
    }
    
    return DocumentAnalysisResponse(
        metadata=metadata,
        classification=classification_result,
        extracted_data=extracted_data,
        insights=insights,
        processing_logs=processing_logs,
        quality_metrics=quality_metrics
    )

# ================================================================================
# ADVANCED ANALYSIS ENDPOINTS
# ================================================================================

@router.post("/{document_id}/extract-custom", response_model=Dict[str, Any])
async def extract_custom_data(
    document_id: UUID,
    request: DataExtractionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Extract custom data points from document using AI"""
    
    # Verify document access
    document = db.query(DocumentMaster).filter(
        DocumentMaster.id == document_id,
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentMaster.is_deleted == False
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.processing_status != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document processing not completed"
        )
    
    try:
        # Perform custom extraction
        result = await doc_intelligence_service.extract_custom_data(
            document_path=document.file_path,
            extraction_fields=request.extraction_fields,
            custom_patterns=request.custom_patterns,
            validation_required=request.validation_required
        )
        
        # Save extractions to database if successful
        if result.get("success", False):
            for field_name, extraction_data in result.get("extractions", {}).items():
                extraction = DocumentDataExtraction(
                    document_id=document_id,
                    field_name=field_name,
                    field_category="custom",
                    data_type="mixed",
                    extracted_value=extraction_data.get("value"),
                    confidence_score=extraction_data.get("confidence", 0.5),
                    extraction_method=ExtractionMethod.AI_INFERENCE,
                    confidence_level=_confidence_score_to_level(extraction_data.get("confidence", 0.5)),
                    validation_status=ValidationStatus.PENDING_VALIDATION if request.validation_required else ValidationStatus.VALIDATED
                )
                db.add(extraction)
            
            db.commit()
        
        return {
            "document_id": document_id,
            "extraction_results": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Custom extraction failed: {str(e)}"
        )

@router.post("/compare", response_model=Dict[str, Any])
async def compare_documents(
    request: DocumentComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare multiple documents for benchmarking and analysis"""
    
    # Verify all documents exist and are accessible
    documents = db.query(DocumentMaster).filter(
        DocumentMaster.id.in_(request.document_ids),
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentMaster.is_deleted == False
    ).all()
    
    if len(documents) != len(request.document_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more documents not found"
        )
    
    # Check all documents are processed
    unprocessed = [doc for doc in documents if doc.processing_status != ProcessingStatus.COMPLETED]
    if unprocessed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Documents not yet processed: {[str(doc.id) for doc in unprocessed]}"
        )
    
    try:
        # Perform comparison analysis
        comparison_result = await doc_intelligence_service.compare_documents(
            document_paths=[doc.file_path for doc in documents],
            document_ids=request.document_ids,
            comparison_type=request.comparison_type,
            focus_areas=request.focus_areas
        )
        
        return {
            "comparison_id": f"comp_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "documents_compared": len(documents),
            "comparison_type": request.comparison_type,
            "results": comparison_result,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document comparison failed: {str(e)}"
        )

# ================================================================================
# UTILITY FUNCTIONS
# ================================================================================

def _confidence_score_to_level(score: float) -> ConfidenceLevel:
    """Convert numeric confidence score to confidence level enum"""
    if score >= 0.95:
        return ConfidenceLevel.VERY_HIGH
    elif score >= 0.85:
        return ConfidenceLevel.HIGH
    elif score >= 0.70:
        return ConfidenceLevel.MEDIUM
    elif score >= 0.50:
        return ConfidenceLevel.LOW
    else:
        return ConfidenceLevel.VERY_LOW

print("✅ Document Intelligence API Endpoints Loaded Successfully!")
print("Features:")
print("  📊 Real-time Processing Status & Monitoring")
print("  📋 Comprehensive Document Management")
print("  🔍 Advanced Search & Filtering")
print("  📈 Complete Analysis & Insights")
print("  🎯 Custom Data Extraction")
print("  📊 Document Comparison & Benchmarking")
print("  ✅ Quality Metrics & Validation")
print("  🔄 Background Processing Pipeline")
print("  🛡️ Security & Access Control")
print("  📝 Comprehensive Audit Trail")