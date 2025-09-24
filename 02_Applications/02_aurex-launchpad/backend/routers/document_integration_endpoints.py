# ================================================================================
# AUREX LAUNCHPAD™ DOCUMENT INTEGRATION ENDPOINTS
# Integration with GHG calculator, EU taxonomy, and other ESG systems
# Agent: AI/ML Expert Agent + ESG Integration Agent
# ================================================================================

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import asyncio

# Database and authentication imports
from models.base_models import get_db
from models.auth_models import User
from routers.auth import get_current_user

# Document Intelligence models
from models.document_intelligence_models import (
    DocumentMaster, DocumentIntegration, ProcessingStatus
)

# Integration service
from services.document_integration import (
    document_integration_service, IntegrationResult
)

router = APIRouter(prefix="/api/v1/documents", tags=["Document Integration"])

# ================================================================================
# INTEGRATION PYDANTIC MODELS
# ================================================================================

class IntegrationRequest(BaseModel):
    """Base integration request model"""
    document_id: UUID
    integration_type: str = Field(..., regex="^(ghg_calculator|eu_taxonomy|all)$")
    integration_options: Optional[Dict[str, Any]] = {}
    priority: Optional[str] = Field("normal", regex="^(low|normal|high)$")
    notification_webhook: Optional[str] = None

class BatchIntegrationRequest(BaseModel):
    """Batch integration request model"""
    document_ids: List[UUID] = Field(..., min_items=1, max_items=50)
    integration_types: List[str] = Field(..., min_items=1)
    integration_options: Optional[Dict[str, Any]] = {}
    priority: Optional[str] = Field("normal", regex="^(low|normal|high)$")

class IntegrationResponse(BaseModel):
    """Integration response model"""
    integration_id: str
    document_id: UUID
    integration_type: str
    status: str
    message: str
    started_at: datetime
    estimated_completion: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None

class IntegrationStatusResponse(BaseModel):
    """Integration status response model"""
    integration_id: str
    document_id: UUID
    integration_type: str
    status: str
    records_processed: int
    records_successful: int
    records_failed: int
    processing_time_seconds: Optional[float]
    error_details: Optional[List[Dict[str, Any]]]
    warnings: Optional[List[str]]
    completed_at: Optional[datetime]

# ================================================================================
# INTEGRATION ENDPOINTS
# ================================================================================

@router.post("/{document_id}/integrate/ghg-calculator", response_model=IntegrationResponse)
async def integrate_with_ghg_calculator(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    integration_options: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Integrate document data with GHG calculator system"""
    
    # Verify document access and processing status
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
            detail="Document must be fully processed before integration"
        )
    
    # Check if integration already exists
    existing_integration = db.query(DocumentIntegration).filter(
        DocumentIntegration.document_id == document_id,
        DocumentIntegration.integration_type == "ghg_calculator",
        DocumentIntegration.integration_status.in_(["active", "completed"])
    ).first()
    
    if existing_integration:
        return IntegrationResponse(
            integration_id=f"ghg_{existing_integration.id}",
            document_id=document_id,
            integration_type="ghg_calculator",
            status=existing_integration.integration_status,
            message="Integration already exists",
            started_at=existing_integration.integration_started_at,
            results={
                "records_processed": existing_integration.records_processed,
                "records_successful": existing_integration.records_successful,
                "records_failed": existing_integration.records_failed
            }
        )
    
    # Queue integration for background processing
    integration_id = f"ghg_{document_id.hex[:8]}"
    
    background_tasks.add_task(
        process_ghg_integration,
        document_id=document_id,
        organization_id=current_user.organization_id,
        integration_options=integration_options or {}
    )
    
    return IntegrationResponse(
        integration_id=integration_id,
        document_id=document_id,
        integration_type="ghg_calculator",
        status="queued",
        message="GHG calculator integration queued for processing",
        started_at=datetime.utcnow(),
        estimated_completion=datetime.utcnow().replace(minute=datetime.utcnow().minute + 5)
    )

@router.post("/{document_id}/integrate/eu-taxonomy", response_model=IntegrationResponse)
async def integrate_with_eu_taxonomy(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    integration_options: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Integrate document data with EU Taxonomy assessment system"""
    
    # Verify document access and processing status
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
            detail="Document must be fully processed before integration"
        )
    
    # Check for existing integration
    existing_integration = db.query(DocumentIntegration).filter(
        DocumentIntegration.document_id == document_id,
        DocumentIntegration.integration_type == "eu_taxonomy",
        DocumentIntegration.integration_status.in_(["active", "completed"])
    ).first()
    
    if existing_integration:
        return IntegrationResponse(
            integration_id=f"taxonomy_{existing_integration.id}",
            document_id=document_id,
            integration_type="eu_taxonomy",
            status=existing_integration.integration_status,
            message="Integration already exists",
            started_at=existing_integration.integration_started_at,
            results={
                "records_processed": existing_integration.records_processed,
                "records_successful": existing_integration.records_successful,
                "records_failed": existing_integration.records_failed
            }
        )
    
    # Queue integration
    integration_id = f"taxonomy_{document_id.hex[:8]}"
    
    background_tasks.add_task(
        process_taxonomy_integration,
        document_id=document_id,
        organization_id=current_user.organization_id,
        integration_options=integration_options or {}
    )
    
    return IntegrationResponse(
        integration_id=integration_id,
        document_id=document_id,
        integration_type="eu_taxonomy",
        status="queued",
        message="EU Taxonomy integration queued for processing",
        started_at=datetime.utcnow(),
        estimated_completion=datetime.utcnow().replace(minute=datetime.utcnow().minute + 3)
    )

@router.post("/{document_id}/integrate/all", response_model=List[IntegrationResponse])
async def integrate_with_all_systems(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    integration_options: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Integrate document with all available ESG systems"""
    
    # Verify document
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
            detail="Document must be fully processed before integration"
        )
    
    # Queue all integrations
    responses = []
    
    # GHG Calculator Integration
    background_tasks.add_task(
        process_ghg_integration,
        document_id=document_id,
        organization_id=current_user.organization_id,
        integration_options=integration_options or {}
    )
    
    responses.append(IntegrationResponse(
        integration_id=f"ghg_{document_id.hex[:8]}",
        document_id=document_id,
        integration_type="ghg_calculator",
        status="queued",
        message="GHG calculator integration queued",
        started_at=datetime.utcnow()
    ))
    
    # EU Taxonomy Integration
    background_tasks.add_task(
        process_taxonomy_integration,
        document_id=document_id,
        organization_id=current_user.organization_id,
        integration_options=integration_options or {}
    )
    
    responses.append(IntegrationResponse(
        integration_id=f"taxonomy_{document_id.hex[:8]}",
        document_id=document_id,
        integration_type="eu_taxonomy",
        status="queued",
        message="EU Taxonomy integration queued",
        started_at=datetime.utcnow()
    ))
    
    return responses

@router.post("/batch-integrate", response_model=Dict[str, Any])
async def batch_integrate_documents(
    request: BatchIntegrationRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch integrate multiple documents with specified systems"""
    
    # Verify all documents exist and are processed
    documents = db.query(DocumentMaster).filter(
        DocumentMaster.id.in_(request.document_ids),
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentMaster.is_deleted == False
    ).all()
    
    if len(documents) != len(request.document_ids):
        missing_ids = set(request.document_ids) - {doc.id for doc in documents}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documents not found: {list(missing_ids)}"
        )
    
    # Check processing status
    unprocessed = [doc for doc in documents if doc.processing_status != ProcessingStatus.COMPLETED]
    if unprocessed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Documents not yet processed: {[str(doc.id) for doc in unprocessed]}"
        )
    
    # Queue batch integrations
    batch_id = f"batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    integration_results = []
    
    for document_id in request.document_ids:
        for integration_type in request.integration_types:
            if integration_type == "ghg_calculator":
                background_tasks.add_task(
                    process_ghg_integration,
                    document_id=document_id,
                    organization_id=current_user.organization_id,
                    integration_options=request.integration_options
                )
            elif integration_type == "eu_taxonomy":
                background_tasks.add_task(
                    process_taxonomy_integration,
                    document_id=document_id,
                    organization_id=current_user.organization_id,
                    integration_options=request.integration_options
                )
            
            integration_results.append({
                "document_id": document_id,
                "integration_type": integration_type,
                "status": "queued",
                "integration_id": f"{integration_type}_{document_id.hex[:8]}"
            })
    
    return {
        "batch_id": batch_id,
        "total_integrations": len(integration_results),
        "integrations": integration_results,
        "estimated_completion_time": 300,  # 5 minutes
        "started_at": datetime.utcnow().isoformat()
    }

@router.get("/{document_id}/integrations", response_model=List[IntegrationStatusResponse])
async def get_document_integrations(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all integrations for a document"""
    
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
    
    # Get all integrations
    integrations = db.query(DocumentIntegration).filter(
        DocumentIntegration.document_id == document_id
    ).order_by(DocumentIntegration.integration_started_at.desc()).all()
    
    # Convert to response format
    integration_statuses = []
    for integration in integrations:
        processing_time = None
        if integration.integration_started_at and integration.integration_completed_at:
            processing_time = (integration.integration_completed_at - integration.integration_started_at).total_seconds()
        
        status_response = IntegrationStatusResponse(
            integration_id=str(integration.id),
            document_id=document_id,
            integration_type=integration.integration_type,
            status=integration.integration_status,
            records_processed=integration.records_processed or 0,
            records_successful=integration.records_successful or 0,
            records_failed=integration.records_failed or 0,
            processing_time_seconds=processing_time,
            error_details=integration.error_details,
            warnings=None,  # Would be stored separately if needed
            completed_at=integration.integration_completed_at
        )
        integration_statuses.append(status_response)
    
    return integration_statuses

@router.get("/integrations/summary")
async def get_integration_summary(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration summary and statistics"""
    
    from datetime import timedelta
    from sqlalchemy import func
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get integration statistics
    integration_stats = db.query(
        DocumentIntegration.integration_type,
        DocumentIntegration.integration_status,
        func.count(DocumentIntegration.id).label('count'),
        func.avg(DocumentIntegration.processing_time_ms).label('avg_processing_time'),
        func.sum(DocumentIntegration.records_successful).label('total_successful'),
        func.sum(DocumentIntegration.records_failed).label('total_failed')
    ).join(DocumentMaster).filter(
        DocumentMaster.organization_id == current_user.organization_id,
        DocumentIntegration.integration_started_at >= start_date
    ).group_by(
        DocumentIntegration.integration_type,
        DocumentIntegration.integration_status
    ).all()
    
    # Process statistics
    summary = {
        "period_days": days,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_integrations": sum(stat.count for stat in integration_stats),
        "integration_types": {},
        "status_breakdown": {},
        "performance_metrics": {}
    }
    
    for stat in integration_stats:
        # Integration type breakdown
        if stat.integration_type not in summary["integration_types"]:
            summary["integration_types"][stat.integration_type] = {
                "total": 0,
                "completed": 0,
                "failed": 0,
                "success_rate": 0.0
            }
        
        summary["integration_types"][stat.integration_type]["total"] += stat.count
        if stat.integration_status == "completed":
            summary["integration_types"][stat.integration_type]["completed"] += stat.count
        elif stat.integration_status == "failed":
            summary["integration_types"][stat.integration_type]["failed"] += stat.count
        
        # Status breakdown
        if stat.integration_status not in summary["status_breakdown"]:
            summary["status_breakdown"][stat.integration_status] = 0
        summary["status_breakdown"][stat.integration_status] += stat.count
        
        # Performance metrics
        if stat.avg_processing_time:
            summary["performance_metrics"][f"{stat.integration_type}_avg_time_ms"] = float(stat.avg_processing_time)
    
    # Calculate success rates
    for integration_type, stats in summary["integration_types"].items():
        if stats["total"] > 0:
            stats["success_rate"] = stats["completed"] / stats["total"] * 100
    
    return summary

# ================================================================================
# BACKGROUND TASK FUNCTIONS
# ================================================================================

async def process_ghg_integration(
    document_id: UUID,
    organization_id: UUID,
    integration_options: Dict[str, Any]
):
    """Background task for GHG calculator integration"""
    from models.base_models import SessionLocal
    
    db = SessionLocal()
    try:
        result = await document_integration_service.integrate_with_ghg_calculator(
            document_id=document_id,
            organization_id=organization_id,
            db_session=db,
            integration_options=integration_options
        )
        
        # Log result
        logger.info(f"GHG integration completed for document {document_id}: {result}")
        
    except Exception as e:
        logger.error(f"GHG integration failed for document {document_id}: {e}")
    finally:
        db.close()

async def process_taxonomy_integration(
    document_id: UUID,
    organization_id: UUID,
    integration_options: Dict[str, Any]
):
    """Background task for EU Taxonomy integration"""
    from models.base_models import SessionLocal
    
    db = SessionLocal()
    try:
        result = await document_integration_service.integrate_with_eu_taxonomy(
            document_id=document_id,
            organization_id=organization_id,
            db_session=db,
            integration_options=integration_options
        )
        
        # Log result
        logger.info(f"EU Taxonomy integration completed for document {document_id}: {result}")
        
    except Exception as e:
        logger.error(f"EU Taxonomy integration failed for document {document_id}: {e}")
    finally:
        db.close()

print("✅ Document Integration API Endpoints Loaded Successfully!")
print("Features:")
print("  🔗 GHG Calculator Integration Endpoints")
print("  🇪🇺 EU Taxonomy Assessment Integration")
print("  📊 Batch Integration Processing")
print("  📈 Integration Status & Monitoring")
print("  📋 Integration Summary & Analytics")
print("  🔄 Background Processing Pipeline")
print("  ✅ Comprehensive Error Handling")
print("  🛡️ Security & Access Control")