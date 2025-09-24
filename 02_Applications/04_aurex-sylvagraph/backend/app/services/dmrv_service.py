"""
DMRV (Digital Monitoring, Reporting, Verification) Compliance Service
Automated compliance engine for carbon credit standards (ISO 14064-2, Verra VCS, Gold Standard)
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from pathlib import Path
import uuid

import pandas as pd
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from ..models.projects import Project
from ..models.monitoring import MonitoringData
from .ipfs_service import IPFSService

logger = logging.getLogger(__name__)


class ComplianceStandard(BaseModel):
    """Configuration for different carbon credit standards"""
    name: str
    version: str
    methodology_code: str
    requirements: Dict[str, Any]
    monitoring_frequency: int  # days
    reporting_requirements: List[str]
    verification_criteria: Dict[str, Any]


class PDDSection(BaseModel):
    """Project Design Document section"""
    section_id: str
    title: str
    content: str
    required_data: List[str]
    validation_rules: Dict[str, Any]
    auto_populate: bool = False


class MonitoringReport(BaseModel):
    """Monitoring report structure"""
    report_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    reporting_period: Dict[str, datetime]
    carbon_sequestration: Dict[str, float]
    forest_metrics: Dict[str, Any]
    compliance_status: str
    verification_data: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    ipfs_hash: Optional[str] = None


class VVBWorkflow(BaseModel):
    """Validation and Verification Body workflow"""
    workflow_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    standard: str
    stage: str  # validation, verification, issuance
    requirements: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    status: str
    assigned_vvb: Optional[str] = None
    timeline: Dict[str, datetime]


class DMRVService:
    """
    DMRV Compliance Engine
    
    Provides:
    - Automated PDD generation for multiple standards
    - Continuous monitoring report generation
    - VVB workflow management
    - Compliance checking and validation
    - Immutable audit trail via IPFS
    """
    
    def __init__(self, db_session: Session, ipfs_service: IPFSService):
        self.db = db_session
        self.ipfs = ipfs_service
        
        # Load compliance standards configuration
        self.standards = self._load_compliance_standards()
        
        # PDD template sections
        self.pdd_sections = self._initialize_pdd_sections()
        
        # VVB registry
        self.vvb_registry = self._load_vvb_registry()
    
    def _load_compliance_standards(self) -> Dict[str, ComplianceStandard]:
        """Load configuration for different carbon credit standards"""
        standards = {}
        
        # ISO 14064-2 Standard
        standards['iso_14064_2'] = ComplianceStandard(
            name="ISO 14064-2",
            version="2019",
            methodology_code="ISO-14064-2",
            requirements={
                "baseline_period": 10,  # years
                "monitoring_frequency": 365,  # days
                "uncertainty_threshold": 0.1,  # 10%
                "permanence_period": 100,  # years
                "leakage_monitoring": True,
                "additionality_test": True
            },
            monitoring_frequency=365,
            reporting_requirements=[
                "carbon_stock_changes",
                "ghg_removals_enhancements", 
                "project_emissions",
                "leakage_assessment",
                "uncertainty_analysis",
                "quality_assurance"
            ],
            verification_criteria={
                "materiality_threshold": 0.05,
                "sampling_methodology": "stratified_random",
                "confidence_level": 0.95,
                "bias_assessment": True
            }
        )
        
        # Verra VCS Standard
        standards['verra_vcs'] = ComplianceStandard(
            name="Verra VCS",
            version="4.0",
            methodology_code="VM0034",  # Wetlands Restoration and Conservation
            requirements={
                "baseline_period": 10,
                "crediting_period": 30,
                "buffer_pool_contribution": 0.2,  # 20%
                "monitoring_frequency": 365,
                "safeguards_assessment": True,
                "stakeholder_consultation": True
            },
            monitoring_frequency=365,
            reporting_requirements=[
                "vcu_issuance_request",
                "monitoring_report",
                "verification_report",
                "safeguards_report",
                "stakeholder_feedback"
            ],
            verification_criteria={
                "validation_required": True,
                "verification_frequency": 365,
                "risk_assessment": True,
                "site_inspection": True
            }
        )
        
        # Gold Standard
        standards['gold_standard'] = ComplianceStandard(
            name="Gold Standard",
            version="4.0",
            methodology_code="GS-LUF-01",
            requirements={
                "sdg_impact_assessment": True,
                "stakeholder_consultation": True,
                "safeguards_assessment": True,
                "monitoring_frequency": 365,
                "baseline_reassessment": 7  # years
            },
            monitoring_frequency=365,
            reporting_requirements=[
                "monitoring_report",
                "sdg_impact_report",
                "safeguards_report", 
                "stakeholder_feedback_report",
                "verification_report"
            ],
            verification_criteria={
                "sdg_verification": True,
                "safeguards_verification": True,
                "stakeholder_verification": True,
                "performance_verification": True
            }
        )
        
        # ART/TREES
        standards['art_trees'] = ComplianceStandard(
            name="ART TREES",
            version="2.0", 
            methodology_code="ART-TREES-2.0",
            requirements={
                "jurisdictional_approach": True,
                "reference_level": True,
                "safeguards_assessment": True,
                "monitoring_frequency": 365,
                "participation_threshold": 0.8  # 80% participation
            },
            monitoring_frequency=365,
            reporting_requirements=[
                "monitoring_report",
                "reference_level_assessment",
                "safeguards_report",
                "participation_report",
                "verification_report"
            ],
            verification_criteria={
                "jurisdictional_verification": True,
                "reference_level_verification": True,
                "safeguards_verification": True
            }
        )
        
        return standards
    
    def _initialize_pdd_sections(self) -> Dict[str, PDDSection]:
        """Initialize PDD template sections"""
        sections = {}
        
        sections['project_description'] = PDDSection(
            section_id="1",
            title="Project Description",
            content="",
            required_data=[
                "project_name", "project_location", "project_proponent", 
                "project_objectives", "project_activities", "project_timeline"
            ],
            validation_rules={
                "min_project_area": 100,  # hectares
                "location_coordinates_required": True,
                "timeline_realistic": True
            },
            auto_populate=True
        )
        
        sections['baseline_scenario'] = PDDSection(
            section_id="2", 
            title="Baseline Scenario",
            content="",
            required_data=[
                "historical_land_use", "deforestation_drivers", "baseline_emissions",
                "reference_region", "additionality_analysis"
            ],
            validation_rules={
                "baseline_period_min": 10,  # years
                "reference_region_similarity": True,
                "additionality_demonstrated": True
            },
            auto_populate=True
        )
        
        sections['project_scenario'] = PDDSection(
            section_id="3",
            title="Project Scenario", 
            content="",
            required_data=[
                "conservation_activities", "enhancement_activities", "project_emissions",
                "leakage_assessment", "permanence_measures"
            ],
            validation_rules={
                "activities_feasible": True,
                "leakage_minimized": True,
                "permanence_assured": True
            },
            auto_populate=True
        )
        
        sections['monitoring_plan'] = PDDSection(
            section_id="4",
            title="Monitoring Plan",
            content="",
            required_data=[
                "monitoring_methodology", "data_collection_procedures", 
                "quality_assurance", "monitoring_schedule", "personnel_training"
            ],
            validation_rules={
                "methodology_approved": True,
                "procedures_detailed": True,
                "schedule_realistic": True
            },
            auto_populate=True
        )
        
        return sections
    
    def _load_vvb_registry(self) -> Dict[str, Dict[str, Any]]:
        """Load registry of approved Validation and Verification Bodies"""
        return {
            "verra_approved": [
                {"name": "SCS Global Services", "accreditation": ["VCS", "CCB"], "expertise": ["forestry", "agriculture"]},
                {"name": "DNV", "accreditation": ["VCS", "Gold Standard"], "expertise": ["forestry", "renewable_energy"]},
                {"name": "TUV NORD", "accreditation": ["VCS", "ISO14064"], "expertise": ["forestry", "land_use"]}
            ],
            "gold_standard_approved": [
                {"name": "DNV", "accreditation": ["Gold Standard", "VCS"], "expertise": ["forestry", "renewable_energy"]},
                {"name": "SGS", "accreditation": ["Gold Standard", "ISO14064"], "expertise": ["forestry", "community"]}
            ]
        }
    
    def generate_pdd(self, project_id: str, standard: str, 
                     project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate Project Design Document for specified standard
        
        Args:
            project_id: Project identifier
            standard: Compliance standard (iso_14064_2, verra_vcs, etc.)
            project_data: Project-specific data for PDD generation
            
        Returns:
            Generated PDD with metadata
        """
        if standard not in self.standards:
            raise ValueError(f"Unsupported standard: {standard}")
        
        logger.info(f"Generating PDD for project {project_id} under {standard}")
        
        compliance_std = self.standards[standard]
        pdd_document = {
            "document_id": str(uuid.uuid4()),
            "project_id": project_id,
            "standard": standard,
            "version": "1.0",
            "generated_at": datetime.utcnow(),
            "sections": {},
            "compliance_checklist": {},
            "validation_status": "draft"
        }
        
        # Generate each PDD section
        for section_id, section_template in self.pdd_sections.items():
            section_content = self._generate_pdd_section(
                section_template, project_data, compliance_std
            )
            pdd_document["sections"][section_id] = section_content
        
        # Perform compliance validation
        compliance_results = self._validate_pdd_compliance(
            pdd_document, compliance_std
        )
        pdd_document["compliance_checklist"] = compliance_results
        
        # Determine validation status
        if all(compliance_results.values()):
            pdd_document["validation_status"] = "compliant"
        else:
            pdd_document["validation_status"] = "non_compliant"
            pdd_document["required_actions"] = [
                f"Address {key}" for key, value in compliance_results.items() if not value
            ]
        
        # Store in IPFS for immutability
        pdd_json = json.dumps(pdd_document, default=str)
        ipfs_hash = self.ipfs.store_document(pdd_json, f"pdd_{project_id}_{standard}")
        pdd_document["ipfs_hash"] = ipfs_hash
        
        logger.info(f"PDD generated successfully. Status: {pdd_document['validation_status']}")
        return pdd_document
    
    def _generate_pdd_section(self, section: PDDSection, project_data: Dict[str, Any], 
                             standard: ComplianceStandard) -> Dict[str, Any]:
        """Generate content for a specific PDD section"""
        section_data = {
            "title": section.title,
            "content": "",
            "data_sources": [],
            "validation_status": "pending"
        }
        
        if section.auto_populate:
            # Auto-populate section based on project data and standard requirements
            if section.section_id == "1":  # Project Description
                section_data["content"] = self._generate_project_description(
                    project_data, standard
                )
            elif section.section_id == "2":  # Baseline Scenario
                section_data["content"] = self._generate_baseline_scenario(
                    project_data, standard
                )
            elif section.section_id == "3":  # Project Scenario
                section_data["content"] = self._generate_project_scenario(
                    project_data, standard
                )
            elif section.section_id == "4":  # Monitoring Plan
                section_data["content"] = self._generate_monitoring_plan(
                    project_data, standard
                )
        
        # Validate section content
        validation_passed = self._validate_section_content(
            section_data, section.validation_rules, project_data
        )
        section_data["validation_status"] = "passed" if validation_passed else "failed"
        
        return section_data
    
    def _generate_project_description(self, project_data: Dict[str, Any], 
                                    standard: ComplianceStandard) -> str:
        """Generate project description section"""
        description = f"""
        PROJECT TITLE: {project_data.get('project_name', 'Untitled Forest Conservation Project')}
        
        PROJECT LOCATION: 
        - Country: {project_data.get('country', 'TBD')}
        - Region: {project_data.get('region', 'TBD')} 
        - Coordinates: {project_data.get('coordinates', 'TBD')}
        - Total Area: {project_data.get('total_area_ha', 0):,.0f} hectares
        
        PROJECT PROPONENT: {project_data.get('proponent', 'TBD')}
        
        PROJECT OBJECTIVES:
        The primary objective of this forest conservation project is to prevent deforestation
        and forest degradation while enhancing carbon sequestration through sustainable
        forest management practices. The project aims to:
        
        1. Conserve {project_data.get('forest_area_ha', 0):,.0f} hectares of natural forest
        2. Restore {project_data.get('restoration_area_ha', 0):,.0f} hectares of degraded land
        3. Generate verified emission reductions of approximately {project_data.get('estimated_credits', 0):,.0f} tCO2e over the crediting period
        4. Provide sustainable livelihoods for local communities
        5. Protect biodiversity and ecosystem services
        
        PROJECT ACTIVITIES:
        - Implementation of forest protection measures
        - Sustainable forest management practices
        - Community engagement and capacity building
        - Biodiversity conservation initiatives
        - Monitoring and verification activities
        
        CREDITING PERIOD: {standard.requirements.get('crediting_period', 30)} years
        """
        
        return description.strip()
    
    def _generate_baseline_scenario(self, project_data: Dict[str, Any],
                                   standard: ComplianceStandard) -> str:
        """Generate baseline scenario section"""
        baseline = f"""
        BASELINE APPROACH:
        The baseline scenario represents the most likely land use pattern in the absence
        of the proposed project activities, based on historical trends and current drivers
        of deforestation and forest degradation.
        
        HISTORICAL ANALYSIS:
        - Reference Period: {project_data.get('baseline_start_year', 2010)} - {project_data.get('baseline_end_year', 2020)}
        - Annual Deforestation Rate: {project_data.get('historical_deforestation_rate', 0):.2f}% per year
        - Primary Drivers: {', '.join(project_data.get('deforestation_drivers', ['Agricultural expansion', 'Logging']))}
        
        BASELINE EMISSIONS:
        - Estimated Annual CO2 Emissions: {project_data.get('baseline_emissions_tco2_year', 0):,.0f} tCO2/year
        - Carbon Stock Estimates: {project_data.get('carbon_stock_tco2_ha', 0):,.0f} tCO2/ha
        - Biomass Loss Projections: Based on {standard.requirements.get('baseline_period', 10)}-year trend analysis
        
        ADDITIONALITY ANALYSIS:
        This project demonstrates additionality through:
        1. Investment Analysis: Conservation activities require significant upfront investment
        2. Barrier Analysis: Existing barriers to conservation include [list barriers]
        3. Common Practice Analysis: Similar conservation activities are not common practice in the region
        
        REFERENCE REGION:
        A reference region with similar ecological and socio-economic conditions has been
        identified for comparison and validation of baseline assumptions.
        """
        
        return baseline.strip()
    
    def generate_monitoring_report(self, project_id: str, standard: str,
                                  monitoring_data: Dict[str, Any],
                                  reporting_period: Tuple[datetime, datetime]) -> MonitoringReport:
        """
        Generate automated monitoring report for compliance
        
        Args:
            project_id: Project identifier
            standard: Compliance standard
            monitoring_data: Collected monitoring data
            reporting_period: Start and end dates for reporting period
            
        Returns:
            Generated monitoring report
        """
        if standard not in self.standards:
            raise ValueError(f"Unsupported standard: {standard}")
        
        logger.info(f"Generating monitoring report for project {project_id}")
        
        compliance_std = self.standards[standard]
        start_date, end_date = reporting_period
        
        # Calculate carbon sequestration metrics
        carbon_metrics = self._calculate_carbon_metrics(monitoring_data, compliance_std)
        
        # Compile forest metrics
        forest_metrics = self._compile_forest_metrics(monitoring_data)
        
        # Perform compliance assessment
        compliance_status = self._assess_compliance_status(
            carbon_metrics, forest_metrics, compliance_std
        )
        
        # Generate verification data
        verification_data = self._generate_verification_data(
            monitoring_data, carbon_metrics, compliance_std
        )
        
        # Create monitoring report
        report = MonitoringReport(
            project_id=project_id,
            reporting_period={
                "start_date": start_date,
                "end_date": end_date
            },
            carbon_sequestration=carbon_metrics,
            forest_metrics=forest_metrics,
            compliance_status=compliance_status,
            verification_data=verification_data
        )
        
        # Store in IPFS
        report_json = json.dumps(report.dict(), default=str)
        ipfs_hash = self.ipfs.store_document(
            report_json, f"monitoring_report_{project_id}_{start_date.strftime('%Y%m%d')}"
        )
        report.ipfs_hash = ipfs_hash
        
        logger.info(f"Monitoring report generated. Status: {compliance_status}")
        return report
    
    def _calculate_carbon_metrics(self, monitoring_data: Dict[str, Any],
                                 standard: ComplianceStandard) -> Dict[str, float]:
        """Calculate carbon sequestration metrics"""
        metrics = {}
        
        # Extract biomass data
        current_biomass = monitoring_data.get('current_biomass_tco2_ha', 0)
        baseline_biomass = monitoring_data.get('baseline_biomass_tco2_ha', 0)
        project_area = monitoring_data.get('project_area_ha', 0)
        
        # Calculate carbon stock changes
        carbon_stock_change = (current_biomass - baseline_biomass) * project_area
        metrics['carbon_stock_change_tco2'] = carbon_stock_change
        
        # Calculate emission reductions
        avoided_emissions = monitoring_data.get('avoided_emissions_tco2', 0)
        metrics['avoided_emissions_tco2'] = avoided_emissions
        
        # Total GHG benefits
        total_ghg_benefits = carbon_stock_change + avoided_emissions
        metrics['total_ghg_benefits_tco2'] = total_ghg_benefits
        
        # Apply uncertainty deduction
        uncertainty = monitoring_data.get('uncertainty_factor', 0.1)
        conservative_estimate = total_ghg_benefits * (1 - uncertainty)
        metrics['conservative_ghg_benefits_tco2'] = conservative_estimate
        
        # Apply buffer pool deduction (if required)
        if 'buffer_pool_contribution' in standard.requirements:
            buffer_rate = standard.requirements['buffer_pool_contribution']
            net_credits = conservative_estimate * (1 - buffer_rate)
            metrics['net_creditable_tco2'] = net_credits
        else:
            metrics['net_creditable_tco2'] = conservative_estimate
        
        return metrics
    
    def create_vvb_workflow(self, project_id: str, standard: str,
                           workflow_stage: str) -> VVBWorkflow:
        """
        Create VVB (Validation and Verification Body) workflow
        
        Args:
            project_id: Project identifier
            standard: Compliance standard
            workflow_stage: validation, verification, or issuance
            
        Returns:
            Created VVB workflow
        """
        if standard not in self.standards:
            raise ValueError(f"Unsupported standard: {standard}")
        
        logger.info(f"Creating VVB workflow for project {project_id}")
        
        compliance_std = self.standards[standard]
        
        # Define stage-specific requirements
        stage_requirements = self._get_vvb_stage_requirements(workflow_stage, compliance_std)
        
        # Generate document checklist
        required_documents = self._get_required_documents(workflow_stage, standard)
        
        # Create workflow timeline
        timeline = self._create_vvb_timeline(workflow_stage, compliance_std)
        
        # Create workflow
        workflow = VVBWorkflow(
            project_id=project_id,
            standard=standard,
            stage=workflow_stage,
            requirements=stage_requirements,
            documents=required_documents,
            status="pending_assignment",
            timeline=timeline
        )
        
        # Auto-assign VVB if possible
        available_vvbs = self._find_qualified_vvbs(standard)
        if available_vvbs:
            workflow.assigned_vvb = available_vvbs[0]["name"]
            workflow.status = "assigned"
        
        logger.info(f"VVB workflow created for {workflow_stage} stage")
        return workflow
    
    def _get_vvb_stage_requirements(self, stage: str, 
                                   standard: ComplianceStandard) -> List[Dict[str, Any]]:
        """Get requirements for specific VVB workflow stage"""
        requirements = []
        
        if stage == "validation":
            requirements = [
                {"requirement": "PDD completeness review", "status": "pending"},
                {"requirement": "Methodology compliance check", "status": "pending"},
                {"requirement": "Additionality assessment", "status": "pending"},
                {"requirement": "Baseline scenario validation", "status": "pending"},
                {"requirement": "Site visit and assessment", "status": "pending"}
            ]
        elif stage == "verification":
            requirements = [
                {"requirement": "Monitoring data verification", "status": "pending"},
                {"requirement": "Carbon calculation review", "status": "pending"},
                {"requirement": "Site inspection", "status": "pending"},
                {"requirement": "Stakeholder consultation", "status": "pending"},
                {"requirement": "Compliance assessment", "status": "pending"}
            ]
        elif stage == "issuance":
            requirements = [
                {"requirement": "Final verification report", "status": "pending"},
                {"requirement": "Credit calculation validation", "status": "pending"},
                {"requirement": "Registry submission", "status": "pending"},
                {"requirement": "Credit issuance approval", "status": "pending"}
            ]
        
        return requirements
    
    def track_compliance_status(self, project_id: str) -> Dict[str, Any]:
        """
        Track overall compliance status across all standards and workflows
        
        Args:
            project_id: Project identifier
            
        Returns:
            Comprehensive compliance status report
        """
        logger.info(f"Tracking compliance status for project {project_id}")
        
        # Get project data
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        compliance_report = {
            "project_id": project_id,
            "project_name": project.name,
            "last_updated": datetime.utcnow(),
            "standards_compliance": {},
            "monitoring_status": {},
            "verification_status": {},
            "overall_status": "unknown",
            "next_actions": [],
            "alerts": []
        }
        
        # Check compliance for each registered standard
        for standard in project.compliance_standards or []:
            if standard in self.standards:
                std_compliance = self._assess_standard_compliance(project_id, standard)
                compliance_report["standards_compliance"][standard] = std_compliance
        
        # Assess monitoring status
        monitoring_status = self._assess_monitoring_status(project_id)
        compliance_report["monitoring_status"] = monitoring_status
        
        # Check verification requirements
        verification_status = self._assess_verification_status(project_id)
        compliance_report["verification_status"] = verification_status
        
        # Determine overall status
        overall_status = self._determine_overall_status(
            compliance_report["standards_compliance"],
            monitoring_status,
            verification_status
        )
        compliance_report["overall_status"] = overall_status
        
        # Generate action items and alerts
        actions, alerts = self._generate_compliance_actions_alerts(compliance_report)
        compliance_report["next_actions"] = actions
        compliance_report["alerts"] = alerts
        
        return compliance_report
    
    def _assess_standard_compliance(self, project_id: str, standard: str) -> Dict[str, Any]:
        """Assess compliance with specific standard"""
        compliance_std = self.standards[standard]
        
        # Check PDD status
        pdd_status = "missing"  # This would check actual database
        
        # Check monitoring frequency
        monitoring_compliant = True  # This would check actual monitoring data
        
        # Check reporting status  
        reporting_current = True  # This would check latest reports
        
        return {
            "standard_name": compliance_std.name,
            "pdd_status": pdd_status,
            "monitoring_compliant": monitoring_compliant,
            "reporting_current": reporting_current,
            "last_verification": None,  # This would check verification records
            "next_verification_due": None,
            "compliance_score": 0.75  # Calculated based on above factors
        }
    
    def generate_compliance_dashboard_data(self, project_ids: List[str]) -> Dict[str, Any]:
        """
        Generate dashboard data for compliance monitoring
        
        Args:
            project_ids: List of project identifiers
            
        Returns:
            Dashboard data for frontend visualization
        """
        dashboard_data = {
            "summary": {
                "total_projects": len(project_ids),
                "compliant_projects": 0,
                "pending_verification": 0,
                "overdue_monitoring": 0,
                "active_alerts": 0
            },
            "projects": [],
            "standards_breakdown": {},
            "upcoming_deadlines": [],
            "performance_metrics": {}
        }
        
        for project_id in project_ids:
            try:
                compliance_status = self.track_compliance_status(project_id)
                
                # Update summary statistics
                if compliance_status["overall_status"] == "compliant":
                    dashboard_data["summary"]["compliant_projects"] += 1
                
                dashboard_data["summary"]["active_alerts"] += len(compliance_status["alerts"])
                
                # Add to projects list
                dashboard_data["projects"].append({
                    "project_id": project_id,
                    "project_name": compliance_status["project_name"],
                    "status": compliance_status["overall_status"],
                    "alerts": len(compliance_status["alerts"]),
                    "next_actions": len(compliance_status["next_actions"])
                })
                
            except Exception as e:
                logger.warning(f"Failed to get compliance status for project {project_id}: {e}")
        
        return dashboard_data