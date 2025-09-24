"""
DMRV Compliance API Router
API endpoints for Digital Monitoring, Reporting, Verification compliance workflows
Supports ISO 14064-2, Verra VCS, Gold Standard, and ART/TREES standards
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import json
import tempfile
import os

from ..database import get_db
from ..models.ml_models import ComplianceWorkflow, PDDDocument, MonitoringReport
from ..models.projects import Project
from ..models.monitoring import MonitoringData
from ..services.dmrv_service import DMRVService
from ..services.ipfs_service import IPFSService
from ..routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/dmrv", tags=["DMRV Compliance"])
logger = logging.getLogger(__name__)

# Pydantic models for API
class PDDGenerationRequest(BaseModel):
    """Request for PDD generation"""
    project_id: str
    standard: str  # iso_14064_2, verra_vcs, gold_standard, art_trees
    project_data: Dict[str, Any]
    auto_populate: bool = True


class MonitoringReportRequest(BaseModel):
    """Request for monitoring report generation"""
    project_id: str
    standard: str
    reporting_period_start: datetime
    reporting_period_end: datetime
    monitoring_data: Dict[str, Any]
    auto_generate: bool = True


class VVBWorkflowRequest(BaseModel):
    """Request for VVB workflow creation"""
    project_id: str
    standard: str
    workflow_stage: str  # validation, verification, issuance
    preferred_vvb: Optional[str] = None


class ComplianceStatusResponse(BaseModel):
    """Compliance status response"""
    project_id: str
    project_name: str
    overall_status: str
    standards_compliance: Dict[str, Any]
    monitoring_status: Dict[str, Any]
    verification_status: Dict[str, Any]
    next_actions: List[str]
    alerts: List[str]
    last_updated: datetime


class ComplianceDashboardResponse(BaseModel):
    """Compliance dashboard data"""
    summary: Dict[str, Any]
    projects: List[Dict[str, Any]]
    standards_breakdown: Dict[str, Any]
    upcoming_deadlines: List[Dict[str, Any]]
    performance_metrics: Dict[str, Any]


# Initialize services
ipfs_service = IPFSService()


def get_dmrv_service(db: Session = Depends(get_db)) -> DMRVService:
    """Get DMRV service instance"""
    return DMRVService(db, ipfs_service)


@router.post("/pdd/generate")
async def generate_pdd(
    request: PDDGenerationRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    dmrv_service: DMRVService = Depends(get_dmrv_service)
):
    """
    Generate Project Design Document (PDD) for carbon credit standards
    
    Supports ISO 14064-2, Verra VCS, Gold Standard, and ART/TREES
    """
    try:
        logger.info(f"Generating PDD for project {request.project_id} under {request.standard}")
        
        # Verify project access
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Generate PDD
        pdd_document = dmrv_service.generate_pdd(
            project_id=request.project_id,
            standard=request.standard,
            project_data=request.project_data
        )
        
        # Store in database
        db_pdd = PDDDocument(
            project_id=request.project_id,
            document_title=f"PDD - {project.name} ({request.standard.upper()})",
            document_version="1.0",
            standard=request.standard,
            sections=pdd_document["sections"],
            validation_status=pdd_document["validation_status"],
            compliance_score=1.0 if pdd_document["validation_status"] == "compliant" else 0.5,
            auto_generated=request.auto_populate,
            generation_method="automated_dmrv",
            ipfs_hash=pdd_document.get("ipfs_hash"),
            created_by=current_user.get("user_id")
        )
        
        db.add(db_pdd)
        db.commit()
        
        response = {
            "document_id": pdd_document["document_id"],
            "pdd_id": db_pdd.id,
            "project_id": request.project_id,
            "standard": request.standard,
            "validation_status": pdd_document["validation_status"],
            "compliance_checklist": pdd_document["compliance_checklist"],
            "sections": pdd_document["sections"],
            "ipfs_hash": pdd_document.get("ipfs_hash"),
            "generated_at": pdd_document["generated_at"].isoformat(),
            "required_actions": pdd_document.get("required_actions", [])
        }
        
        logger.info(f"PDD generated successfully with status: {pdd_document['validation_status']}")
        return response
        
    except Exception as e:
        logger.error(f"PDD generation failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"PDD generation failed: {str(e)}")


@router.post("/monitoring-report/generate")
async def generate_monitoring_report(
    request: MonitoringReportRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    dmrv_service: DMRVService = Depends(get_dmrv_service)
):
    """
    Generate automated monitoring report for compliance
    
    Includes carbon sequestration data, forest metrics, and compliance assessment
    """
    try:
        logger.info(f"Generating monitoring report for project {request.project_id}")
        
        # Verify project access
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Generate monitoring report
        report = dmrv_service.generate_monitoring_report(
            project_id=request.project_id,
            standard=request.standard,
            monitoring_data=request.monitoring_data,
            reporting_period=(request.reporting_period_start, request.reporting_period_end)
        )
        
        # Store in database
        db_report = MonitoringReport(
            project_id=request.project_id,
            report_title=f"Monitoring Report - {project.name} ({request.reporting_period_start.strftime('%Y-%m')})",
            report_period_start=request.reporting_period_start,
            report_period_end=request.reporting_period_end,
            carbon_sequestration_data=report.carbon_sequestration,
            forest_metrics=report.forest_metrics,
            compliance_status=report.compliance_status,
            verification_required=True,
            auto_generated=request.auto_generate,
            data_collection_methods=["remote_sensing", "ground_surveys", "ml_predictions"],
            ipfs_hash=report.ipfs_hash,
            created_by=current_user.get("user_id")
        )
        
        db.add(db_report)
        db.commit()
        
        response = {
            "report_id": report.report_id,
            "monitoring_report_id": db_report.id,
            "project_id": request.project_id,
            "reporting_period": {
                "start": request.reporting_period_start.isoformat(),
                "end": request.reporting_period_end.isoformat()
            },
            "compliance_status": report.compliance_status,
            "carbon_sequestration": report.carbon_sequestration,
            "forest_metrics": report.forest_metrics,
            "verification_data": report.verification_data,
            "ipfs_hash": report.ipfs_hash,
            "generated_at": report.generated_at.isoformat()
        }
        
        logger.info(f"Monitoring report generated with status: {report.compliance_status}")
        return response
        
    except Exception as e:
        logger.error(f"Monitoring report generation failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Monitoring report generation failed: {str(e)}")


@router.post("/vvb-workflow/create")
async def create_vvb_workflow(
    request: VVBWorkflowRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    dmrv_service: DMRVService = Depends(get_dmrv_service)
):
    """
    Create VVB (Validation and Verification Body) workflow
    
    Manages validation, verification, and credit issuance processes
    """
    try:
        logger.info(f"Creating VVB workflow for project {request.project_id}")
        
        # Verify project access
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Create VVB workflow
        workflow = dmrv_service.create_vvb_workflow(
            project_id=request.project_id,
            standard=request.standard,
            workflow_stage=request.workflow_stage
        )
        
        # Store in database
        db_workflow = ComplianceWorkflow(
            project_id=request.project_id,
            standard=request.standard,
            workflow_stage=request.workflow_stage,
            status=workflow.status,
            requirements=workflow.requirements,
            required_documents=[doc["name"] for doc in workflow.documents],
            assigned_vvb=workflow.assigned_vvb or request.preferred_vvb,
            start_date=datetime.utcnow(),
            expected_completion=workflow.timeline.get("expected_completion"),
            created_by=current_user.get("user_id")
        )
        
        db.add(db_workflow)
        db.commit()
        
        response = {
            "workflow_id": workflow.workflow_id,
            "compliance_workflow_id": db_workflow.id,
            "project_id": request.project_id,
            "standard": request.standard,
            "stage": request.workflow_stage,
            "status": workflow.status,
            "assigned_vvb": workflow.assigned_vvb,
            "requirements": workflow.requirements,
            "required_documents": workflow.documents,
            "timeline": workflow.timeline
        }
        
        logger.info(f"VVB workflow created for {request.workflow_stage} stage")
        return response
        
    except Exception as e:
        logger.error(f"VVB workflow creation failed: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"VVB workflow creation failed: {str(e)}")


@router.get("/compliance-status/{project_id}")
async def get_compliance_status(
    project_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    dmrv_service: DMRVService = Depends(get_dmrv_service)
):
    """Get comprehensive compliance status for a project"""
    try:
        logger.info(f"Getting compliance status for project {project_id}")
        
        # Verify project access
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get compliance status
        compliance_status = dmrv_service.track_compliance_status(project_id)
        
        return ComplianceStatusResponse(**compliance_status)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get compliance status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get compliance status")


@router.get("/dashboard")
async def get_compliance_dashboard(
    project_ids: Optional[str] = Query(None, description="Comma-separated project IDs"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    dmrv_service: DMRVService = Depends(get_dmrv_service)
):
    """Get compliance dashboard data for multiple projects"""
    try:
        if project_ids:
            project_id_list = [pid.strip() for pid in project_ids.split(",")]
        else:
            # Get all projects for user (simplified)
            projects = db.query(Project).all()
            project_id_list = [p.id for p in projects[:20]]  # Limit to 20 for performance
        
        logger.info(f"Getting compliance dashboard for {len(project_id_list)} projects")
        
        # Generate dashboard data
        dashboard_data = dmrv_service.generate_compliance_dashboard_data(project_id_list)
        
        return ComplianceDashboardResponse(**dashboard_data)
        
    except Exception as e:
        logger.error(f"Failed to get compliance dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get compliance dashboard")


@router.get("/standards")
async def get_supported_standards(
    current_user: dict = Depends(get_current_user),
    dmrv_service: DMRVService = Depends(get_dmrv_service)
):
    """Get list of supported carbon credit standards"""
    try:
        standards = []
        for std_key, std_config in dmrv_service.standards.items():
            standards.append({
                "key": std_key,
                "name": std_config.name,
                "version": std_config.version,
                "methodology_code": std_config.methodology_code,
                "monitoring_frequency": std_config.monitoring_frequency,
                "reporting_requirements": std_config.reporting_requirements,
                "description": f"Carbon credit standard with {std_config.monitoring_frequency}-day monitoring cycles"
            })
        
        return {
            "supported_standards": standards,
            "total_count": len(standards)
        }
        
    except Exception as e:
        logger.error(f"Failed to get supported standards: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get supported standards")


@router.get("/workflows/{project_id}")
async def get_project_workflows(
    project_id: str,
    status: Optional[str] = Query(None, description="Filter by workflow status"),
    standard: Optional[str] = Query(None, description="Filter by compliance standard"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all compliance workflows for a project"""
    try:
        # Verify project access
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        query = db.query(ComplianceWorkflow).filter(ComplianceWorkflow.project_id == project_id)
        
        if status:
            query = query.filter(ComplianceWorkflow.status == status)
        
        if standard:
            query = query.filter(ComplianceWorkflow.standard == standard)
        
        workflows = query.order_by(ComplianceWorkflow.created_at.desc()).all()
        
        result = []
        for workflow in workflows:
            result.append({
                "workflow_id": workflow.id,
                "standard": workflow.standard.value,
                "stage": workflow.workflow_stage.value,
                "status": workflow.status,
                "progress_percentage": workflow.progress_percentage,
                "assigned_vvb": workflow.assigned_vvb,
                "start_date": workflow.start_date,
                "expected_completion": workflow.expected_completion,
                "requirements": workflow.requirements,
                "required_documents": workflow.required_documents,
                "submitted_documents": workflow.submitted_documents,
                "created_at": workflow.created_at
            })
        
        return {
            "project_id": project_id,
            "workflows": result,
            "total_count": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project workflows: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get project workflows")


@router.get("/documents/{project_id}")
async def get_project_documents(
    project_id: str,
    document_type: Optional[str] = Query(None, description="Filter by document type (pdd, monitoring_report)"),
    standard: Optional[str] = Query(None, description="Filter by compliance standard"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all compliance documents for a project"""
    try:
        # Verify project access
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        result = {
            "project_id": project_id,
            "documents": {
                "pdd_documents": [],
                "monitoring_reports": []
            }
        }
        
        # Get PDD documents
        if not document_type or document_type == "pdd":
            pdd_query = db.query(PDDDocument).filter(PDDDocument.project_id == project_id)
            if standard:
                pdd_query = pdd_query.filter(PDDDocument.standard == standard)
            
            pdds = pdd_query.order_by(PDDDocument.created_at.desc()).all()
            
            for pdd in pdds:
                result["documents"]["pdd_documents"].append({
                    "document_id": pdd.id,
                    "title": pdd.document_title,
                    "version": pdd.document_version,
                    "standard": pdd.standard.value,
                    "validation_status": pdd.validation_status,
                    "compliance_score": pdd.compliance_score,
                    "ipfs_hash": pdd.ipfs_hash,
                    "created_at": pdd.created_at,
                    "pdf_available": bool(pdd.pdf_file_path)
                })
        
        # Get monitoring reports
        if not document_type or document_type == "monitoring_report":
            report_query = db.query(MonitoringReport).filter(MonitoringReport.project_id == project_id)
            
            reports = report_query.order_by(MonitoringReport.created_at.desc()).all()
            
            for report in reports:
                result["documents"]["monitoring_reports"].append({
                    "report_id": report.id,
                    "title": report.report_title,
                    "period_start": report.report_period_start,
                    "period_end": report.report_period_end,
                    "compliance_status": report.compliance_status,
                    "verification_status": report.verification_status,
                    "ipfs_hash": report.ipfs_hash,
                    "created_at": report.created_at,
                    "report_available": bool(report.report_file_path)
                })
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get project documents")


@router.post("/documents/{document_id}/download")
async def download_document(
    document_id: str,
    document_type: str = Query(..., description="Document type (pdd, monitoring_report)"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download compliance document (PDD or monitoring report)"""
    try:
        if document_type == "pdd":
            document = db.query(PDDDocument).filter(PDDDocument.id == document_id).first()
            if not document:
                raise HTTPException(status_code=404, detail="PDD document not found")
            
            file_path = document.pdf_file_path
            filename = f"PDD_{document.document_title}_{document.document_version}.pdf"
            
        elif document_type == "monitoring_report":
            document = db.query(MonitoringReport).filter(MonitoringReport.id == document_id).first()
            if not document:
                raise HTTPException(status_code=404, detail="Monitoring report not found")
            
            file_path = document.report_file_path
            filename = f"MonitoringReport_{document.report_title}.pdf"
        else:
            raise HTTPException(status_code=400, detail="Invalid document type")
        
        if not file_path or not os.path.exists(file_path):
            # Generate document on-demand if file doesn't exist
            if document_type == "pdd":
                # Generate PDF from stored sections
                content = json.dumps(document.sections, indent=2)
                temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
                temp_file.write(content)
                temp_file.close()
                file_path = temp_file.name
                filename = f"PDD_{document.document_title}.txt"
            else:
                raise HTTPException(status_code=404, detail="Document file not found")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download document: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download document")


@router.get("/analytics/compliance-trends")
async def get_compliance_trends(
    days: int = Query(90, description="Number of days to analyze"),
    project_ids: Optional[str] = Query(None, description="Comma-separated project IDs"),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get compliance trends and analytics"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        if project_ids:
            project_id_list = [pid.strip() for pid in project_ids.split(",")]
        else:
            projects = db.query(Project).all()
            project_id_list = [p.id for p in projects[:50]]
        
        # Query workflows in date range
        workflows = db.query(ComplianceWorkflow).filter(
            ComplianceWorkflow.project_id.in_(project_id_list),
            ComplianceWorkflow.created_at >= start_date
        ).all()
        
        # Calculate trends
        workflows_by_status = {}
        workflows_by_standard = {}
        workflows_by_stage = {}
        
        for workflow in workflows:
            # By status
            status = workflow.status
            workflows_by_status[status] = workflows_by_status.get(status, 0) + 1
            
            # By standard
            standard = workflow.standard.value
            workflows_by_standard[standard] = workflows_by_standard.get(standard, 0) + 1
            
            # By stage
            stage = workflow.workflow_stage.value
            workflows_by_stage[stage] = workflows_by_stage.get(stage, 0) + 1
        
        # Query documents
        pdds = db.query(PDDDocument).filter(
            PDDDocument.project_id.in_(project_id_list),
            PDDDocument.created_at >= start_date
        ).all()
        
        reports = db.query(MonitoringReport).filter(
            MonitoringReport.project_id.in_(project_id_list),
            MonitoringReport.created_at >= start_date
        ).all()
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "workflow_trends": {
                "total_workflows": len(workflows),
                "by_status": workflows_by_status,
                "by_standard": workflows_by_standard,
                "by_stage": workflows_by_stage
            },
            "document_trends": {
                "pdd_documents": len(pdds),
                "monitoring_reports": len(reports),
                "total_documents": len(pdds) + len(reports)
            },
            "compliance_metrics": {
                "active_projects": len(project_id_list),
                "avg_workflows_per_project": len(workflows) / max(len(project_id_list), 1),
                "completion_rate": len([w for w in workflows if w.status == "completed"]) / max(len(workflows), 1)
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get compliance trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get compliance trends")