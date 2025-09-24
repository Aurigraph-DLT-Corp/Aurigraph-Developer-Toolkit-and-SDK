"""
Service Layer for Aurex HydroPulse Water Management System
Business logic and data processing services for water management, IoT, and AWD education
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc, text
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import json
import asyncio
import logging
from collections import defaultdict
import numpy as np
from statistics import mean, median, stdev
import math

from models import (
    WaterFacility, IoTSensor, WaterUsageReading, WaterQualityReading,
    ConservationProject, AWDEducationModule, UserProgress, VibeScore,
    Alert, OptimizationRecommendation, CommunityPost, AlertRule,
    SensorStatus, AlertSeverity, AlertStatus, ProjectStatus
)
from schemas import (
    FacilityCreate, SensorCreate, UsageReadingCreate, QualityReadingCreate,
    ProjectCreate, DashboardStats, UsageAnalyticsSchema, QualityAnalyticsSchema
)

logger = logging.getLogger(__name__)

class WaterManagementService:
    """Core water management business logic"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the service"""
        self.initialized = True
        logger.info("WaterManagementService initialized")
    
    async def create_facility(self, db: AsyncSession, facility_data: FacilityCreate, organization_id: UUID) -> WaterFacility:
        """Create a new water facility"""
        facility = WaterFacility(
            organization_id=organization_id,
            name=facility_data.name,
            facility_type=facility_data.facility_type,
            description=facility_data.description,
            location=facility_data.location.dict() if facility_data.location else None,
            capacity_liters=facility_data.capacity_liters,
            installation_date=facility_data.installation_date,
            operating_hours=facility_data.operating_hours.dict() if facility_data.operating_hours else None,
            contact_person=facility_data.contact_person,
            contact_phone=facility_data.contact_phone,
            contact_email=facility_data.contact_email,
            metadata=facility_data.metadata or {}
        )
        
        db.add(facility)
        await db.commit()
        await db.refresh(facility)
        
        # Initialize default alert rules
        await self._create_default_alert_rules(db, facility.id, organization_id)
        
        return facility
    
    async def get_facilities(self, db: AsyncSession, organization_id: UUID) -> List[WaterFacility]:
        """Get all facilities for an organization"""
        result = await db.execute(
            select(WaterFacility)
            .where(WaterFacility.organization_id == organization_id)
            .options(selectinload(WaterFacility.sensors))
            .order_by(WaterFacility.name)
        )
        return result.scalars().all()
    
    async def get_facility(self, db: AsyncSession, facility_id: UUID, organization_id: UUID) -> Optional[WaterFacility]:
        """Get a specific facility"""
        result = await db.execute(
            select(WaterFacility)
            .where(and_(
                WaterFacility.id == facility_id,
                WaterFacility.organization_id == organization_id
            ))
            .options(
                selectinload(WaterFacility.sensors),
                selectinload(WaterFacility.conservation_projects)
            )
        )
        return result.scalar_one_or_none()
    
    async def update_facility(self, db: AsyncSession, facility_id: UUID, 
                            facility_data: FacilityCreate, organization_id: UUID) -> Optional[WaterFacility]:
        """Update facility information"""
        result = await db.execute(
            select(WaterFacility)
            .where(and_(
                WaterFacility.id == facility_id,
                WaterFacility.organization_id == organization_id
            ))
        )
        facility = result.scalar_one_or_none()
        
        if not facility:
            return None
        
        # Update fields
        for field, value in facility_data.dict(exclude_unset=True).items():
            if hasattr(facility, field):
                if field == 'location' and value:
                    setattr(facility, field, value.dict() if hasattr(value, 'dict') else value)
                elif field == 'operating_hours' and value:
                    setattr(facility, field, value.dict() if hasattr(value, 'dict') else value)
                else:
                    setattr(facility, field, value)
        
        facility.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(facility)
        return facility
    
    async def get_usage_analytics(self, db: AsyncSession, organization_id: UUID, 
                                facility_id: Optional[UUID] = None, period: str = "month") -> Dict[str, Any]:
        """Get comprehensive usage analytics"""
        
        # Determine time range
        now = datetime.utcnow()
        if period == "day":
            start_date = now - timedelta(days=1)
        elif period == "week":
            start_date = now - timedelta(weeks=1)
        elif period == "month":
            start_date = now - timedelta(days=30)
        elif period == "year":
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)
        
        # Build base query
        query = select(WaterUsageReading).where(
            and_(
                WaterUsageReading.organization_id == organization_id,
                WaterUsageReading.reading_timestamp >= start_date
            )
        )
        
        if facility_id:
            query = query.where(WaterUsageReading.facility_id == facility_id)
        
        result = await db.execute(query.order_by(WaterUsageReading.reading_timestamp))
        readings = result.scalars().all()
        
        if not readings:
            return {
                "period": period,
                "total_usage_liters": 0.0,
                "average_daily_usage": 0.0,
                "efficiency_trend": "no_data",
                "readings_count": 0
            }
        
        # Calculate analytics
        total_usage = sum(r.volume_liters for r in readings)
        days_in_period = (now - start_date).days or 1
        avg_daily_usage = total_usage / days_in_period
        
        # Find peak usage
        daily_usage = defaultdict(float)
        for reading in readings:
            date_key = reading.reading_timestamp.date()
            daily_usage[date_key] += reading.volume_liters
        
        peak_day = max(daily_usage.items(), key=lambda x: x[1]) if daily_usage else (None, 0)
        
        # Calculate trend
        if len(daily_usage) > 7:
            recent_week = list(daily_usage.values())[-7:]
            previous_week = list(daily_usage.values())[-14:-7] if len(daily_usage) > 14 else []
            
            if previous_week:
                recent_avg = mean(recent_week)
                previous_avg = mean(previous_week)
                trend_pct = ((recent_avg - previous_avg) / previous_avg) * 100
                
                if trend_pct > 10:
                    efficiency_trend = "increasing"
                elif trend_pct < -10:
                    efficiency_trend = "decreasing"
                else:
                    efficiency_trend = "stable"
            else:
                efficiency_trend = "insufficient_data"
        else:
            efficiency_trend = "insufficient_data"
        
        # Calculate cost estimate (example rate: $0.001 per liter)
        cost_estimate = total_usage * 0.001
        
        return {
            "period": period,
            "total_usage_liters": round(total_usage, 2),
            "average_daily_usage": round(avg_daily_usage, 2),
            "peak_usage_day": peak_day[0],
            "peak_usage_amount": round(peak_day[1], 2),
            "efficiency_trend": efficiency_trend,
            "cost_estimate": round(cost_estimate, 2),
            "readings_count": len(readings),
            "daily_breakdown": dict(daily_usage)
        }
    
    async def get_quality_monitoring(self, db: AsyncSession, organization_id: UUID,
                                   facility_id: Optional[UUID] = None, 
                                   parameter: Optional[str] = None) -> Dict[str, Any]:
        """Get real-time quality monitoring data"""
        
        # Build query
        query = select(WaterQualityReading).where(
            WaterQualityReading.organization_id == organization_id
        )
        
        if facility_id:
            query = query.where(WaterQualityReading.facility_id == facility_id)
        
        # Get recent readings (last 24 hours)
        recent_time = datetime.utcnow() - timedelta(hours=24)
        query = query.where(WaterQualityReading.reading_timestamp >= recent_time)
        
        result = await db.execute(query.order_by(desc(WaterQualityReading.reading_timestamp)))
        readings = result.scalars().all()
        
        if not readings:
            return {"status": "no_recent_data", "readings": []}
        
        # Process readings
        quality_data = {
            "latest_reading": readings[0],
            "readings_count": len(readings),
            "average_scores": {},
            "parameter_trends": {},
            "compliance_status": "unknown"
        }
        
        # Calculate averages for each parameter
        parameters = ['ph_level', 'turbidity_ntu', 'conductivity_ms', 'dissolved_oxygen_mg',
                     'nitrates_mg', 'phosphates_mg', 'chlorine_mg']
        
        for param in parameters:
            values = [getattr(r, param) for r in readings if getattr(r, param) is not None]
            if values:
                quality_data["average_scores"][param] = {
                    "average": round(mean(values), 2),
                    "min": round(min(values), 2),
                    "max": round(max(values), 2),
                    "readings_count": len(values)
                }
        
        # Overall compliance
        compliance_scores = [r.compliance_score for r in readings if r.compliance_score is not None]
        if compliance_scores:
            avg_compliance = mean(compliance_scores)
            if avg_compliance >= 90:
                quality_data["compliance_status"] = "excellent"
            elif avg_compliance >= 80:
                quality_data["compliance_status"] = "good"
            elif avg_compliance >= 70:
                quality_data["compliance_status"] = "acceptable"
            else:
                quality_data["compliance_status"] = "needs_attention"
            
            quality_data["average_compliance_score"] = round(avg_compliance, 2)
        
        return quality_data
    
    async def check_quality_compliance(self, db: AsyncSession, facility_id: UUID, 
                                     standard: str, organization_id: UUID) -> Dict[str, Any]:
        """Check water quality compliance against standards"""
        
        # Get recent quality readings
        recent_time = datetime.utcnow() - timedelta(days=7)
        result = await db.execute(
            select(WaterQualityReading)
            .where(and_(
                WaterQualityReading.facility_id == facility_id,
                WaterQualityReading.organization_id == organization_id,
                WaterQualityReading.reading_timestamp >= recent_time
            ))
            .order_by(desc(WaterQualityReading.reading_timestamp))
        )
        readings = result.scalars().all()
        
        if not readings:
            return {"status": "no_data", "message": "No recent quality data available"}
        
        # WHO standards (example)
        who_standards = {
            "ph_level": {"min": 6.5, "max": 8.5},
            "turbidity_ntu": {"max": 5.0},
            "nitrates_mg": {"max": 50.0},
            "chlorine_mg": {"min": 0.2, "max": 5.0}
        }
        
        standards_map = {
            "WHO": who_standards,
            "EPA": who_standards,  # Simplified - use WHO standards
            "EU": who_standards    # Simplified - use WHO standards
        }
        
        current_standards = standards_map.get(standard, who_standards)
        compliance_results = {}
        violations = []
        
        for param, limits in current_standards.items():
            values = [getattr(r, param) for r in readings if getattr(r, param) is not None]
            if not values:
                continue
            
            latest_value = values[0]
            avg_value = mean(values)
            
            param_compliance = {
                "parameter": param,
                "latest_value": latest_value,
                "average_value": round(avg_value, 2),
                "standard_limits": limits,
                "compliant": True,
                "violation_type": None
            }
            
            # Check compliance
            if "min" in limits and latest_value < limits["min"]:
                param_compliance["compliant"] = False
                param_compliance["violation_type"] = "below_minimum"
                violations.append(f"{param}: {latest_value} < {limits['min']}")
            elif "max" in limits and latest_value > limits["max"]:
                param_compliance["compliant"] = False
                param_compliance["violation_type"] = "above_maximum"
                violations.append(f"{param}: {latest_value} > {limits['max']}")
            
            compliance_results[param] = param_compliance
        
        overall_compliant = len(violations) == 0
        compliance_percentage = ((len(compliance_results) - len(violations)) / len(compliance_results)) * 100 if compliance_results else 0
        
        return {
            "facility_id": str(facility_id),
            "standard": standard,
            "overall_compliant": overall_compliant,
            "compliance_percentage": round(compliance_percentage, 1),
            "violations_count": len(violations),
            "violations": violations,
            "parameter_compliance": compliance_results,
            "readings_analyzed": len(readings),
            "analysis_period_days": 7,
            "last_check": datetime.utcnow().isoformat()
        }
    
    async def create_conservation_project(self, db: AsyncSession, project_data: ProjectCreate, 
                                        organization_id: UUID) -> ConservationProject:
        """Create a new conservation project"""
        project = ConservationProject(
            organization_id=organization_id,
            facility_id=project_data.facility_id,
            name=project_data.name,
            description=project_data.description,
            project_type=project_data.project_type,
            start_date=project_data.start_date,
            expected_completion=project_data.expected_completion,
            budget_amount=project_data.budget_amount,
            currency=project_data.currency,
            funding_source=project_data.funding_source,
            expected_water_savings_liters=project_data.expected_water_savings_liters,
            expected_cost_savings=project_data.expected_cost_savings,
            project_manager=project_data.project_manager,
            team_members=project_data.team_members or [],
            milestones=project_data.milestones or [],
            metadata=project_data.metadata or {}
        )
        
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project
    
    async def get_conservation_projects(self, db: AsyncSession, organization_id: UUID,
                                      status: Optional[str] = None) -> List[ConservationProject]:
        """Get conservation projects with optional status filter"""
        query = select(ConservationProject).where(
            ConservationProject.organization_id == organization_id
        )
        
        if status:
            query = query.where(ConservationProject.status == status)
        
        result = await db.execute(query.order_by(desc(ConservationProject.created_at)))
        return result.scalars().all()
    
    async def calculate_project_roi(self, db: AsyncSession, project_id: UUID, 
                                  organization_id: UUID) -> Dict[str, Any]:
        """Calculate conservation project ROI and impact"""
        result = await db.execute(
            select(ConservationProject)
            .where(and_(
                ConservationProject.id == project_id,
                ConservationProject.organization_id == organization_id
            ))
        )
        project = result.scalar_one_or_none()
        
        if not project:
            return {"error": "Project not found"}
        
        # Calculate ROI metrics
        roi_data = {
            "project_id": str(project_id),
            "project_name": project.name,
            "status": project.status.value,
            "financial_metrics": {},
            "water_savings": {},
            "environmental_impact": {},
            "timeline_analysis": {}
        }
        
        # Financial metrics
        if project.budget_amount and project.expected_cost_savings:
            expected_payback = project.budget_amount / (project.expected_cost_savings / 12) if project.expected_cost_savings > 0 else None
            expected_roi = ((project.expected_cost_savings * 12 - project.budget_amount) / project.budget_amount) * 100 if project.budget_amount > 0 else None
            
            roi_data["financial_metrics"] = {
                "budget_amount": project.budget_amount,
                "actual_cost": project.actual_cost,
                "expected_annual_savings": project.expected_cost_savings,
                "actual_annual_savings": project.actual_cost_savings,
                "expected_payback_months": round(expected_payback, 1) if expected_payback else None,
                "expected_roi_percentage": round(expected_roi, 1) if expected_roi else None,
                "currency": project.currency
            }
        
        # Water savings
        roi_data["water_savings"] = {
            "expected_liters_per_month": project.expected_water_savings_liters,
            "actual_liters_per_month": project.actual_water_savings_liters,
            "conservation_percentage": None  # Would calculate based on baseline usage
        }
        
        # Environmental impact
        if project.carbon_reduction_kg:
            roi_data["environmental_impact"] = {
                "carbon_reduction_kg_per_year": project.carbon_reduction_kg,
                "carbon_reduction_tons_per_year": round(project.carbon_reduction_kg / 1000, 2),
                "equivalent_trees_planted": round(project.carbon_reduction_kg / 21.77, 0)  # Rough estimate
            }
        
        # Timeline analysis
        roi_data["timeline_analysis"] = {
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "expected_completion": project.expected_completion.isoformat() if project.expected_completion else None,
            "actual_completion": project.actual_completion.isoformat() if project.actual_completion else None,
            "progress_percentage": project.progress_percentage,
            "on_schedule": None
        }
        
        if project.start_date and project.expected_completion:
            total_duration = (project.expected_completion - project.start_date).days
            elapsed_days = (datetime.utcnow() - project.start_date).days
            expected_progress = (elapsed_days / total_duration) * 100 if total_duration > 0 else 0
            roi_data["timeline_analysis"]["expected_progress_percentage"] = round(min(expected_progress, 100), 1)
            roi_data["timeline_analysis"]["on_schedule"] = project.progress_percentage >= expected_progress
        
        return roi_data
    
    async def get_dashboard_stats(self, db: AsyncSession, organization_id: UUID,
                                facility_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Get comprehensive dashboard statistics"""
        
        # Get basic counts
        facilities_query = select(func.count(WaterFacility.id)).where(
            WaterFacility.organization_id == organization_id
        )
        if facility_id:
            facilities_query = facilities_query.where(WaterFacility.id == facility_id)
        
        facilities_count = await db.scalar(facilities_query)
        
        # Active sensors count
        sensors_query = select(func.count(IoTSensor.id)).where(
            and_(
                IoTSensor.organization_id == organization_id,
                IoTSensor.status == SensorStatus.ACTIVE
            )
        )
        if facility_id:
            sensors_query = sensors_query.where(IoTSensor.facility_id == facility_id)
        
        active_sensors_count = await db.scalar(sensors_query)
        
        # Usage analytics
        usage_analytics = await self.get_usage_analytics(db, organization_id, facility_id, "month")
        
        # Quality analytics
        quality_data = await self.get_quality_monitoring(db, organization_id, facility_id)
        
        # Active alerts
        alerts_query = select(func.count(Alert.id)).where(
            and_(
                Alert.organization_id == organization_id,
                Alert.status == AlertStatus.ACTIVE
            )
        )
        if facility_id:
            alerts_query = alerts_query.where(Alert.facility_id == facility_id)
        
        active_alerts_count = await db.scalar(alerts_query)
        
        # Conservation projects
        projects_query = select(func.count(ConservationProject.id)).where(
            ConservationProject.organization_id == organization_id
        )
        if facility_id:
            projects_query = projects_query.where(ConservationProject.facility_id == facility_id)
        
        conservation_projects_count = await db.scalar(projects_query)
        
        # Recent alerts
        recent_alerts_query = select(Alert).where(
            Alert.organization_id == organization_id
        ).order_by(desc(Alert.created_at)).limit(5)
        
        if facility_id:
            recent_alerts_query = recent_alerts_query.where(Alert.facility_id == facility_id)
        
        result = await db.execute(recent_alerts_query)
        recent_alerts = result.scalars().all()
        
        return {
            "facilities_count": facilities_count or 0,
            "active_sensors_count": active_sensors_count or 0,
            "total_usage_last_30_days": usage_analytics.get("total_usage_liters", 0),
            "average_quality_score": quality_data.get("average_compliance_score", 0),
            "active_alerts_count": active_alerts_count or 0,
            "conservation_projects_count": conservation_projects_count or 0,
            "water_savings_percentage": 0.0,  # Would calculate based on conservation projects
            "cost_savings_amount": usage_analytics.get("cost_estimate", 0),
            "efficiency_trend": usage_analytics.get("efficiency_trend", "unknown"),
            "recent_alerts": [
                {
                    "id": str(alert.id),
                    "title": alert.title,
                    "severity": alert.severity.value,
                    "created_at": alert.created_at.isoformat()
                }
                for alert in recent_alerts
            ],
            "usage_analytics": usage_analytics,
            "quality_summary": quality_data,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def export_usage_data(self, db: AsyncSession, facility_id: UUID, 
                              start_date: datetime, end_date: datetime,
                              format: str, organization_id: UUID) -> Dict[str, Any]:
        """Export water usage data for external analysis"""
        
        # Get usage readings
        result = await db.execute(
            select(WaterUsageReading)
            .where(and_(
                WaterUsageReading.facility_id == facility_id,
                WaterUsageReading.organization_id == organization_id,
                WaterUsageReading.reading_timestamp >= start_date,
                WaterUsageReading.reading_timestamp <= end_date
            ))
            .order_by(WaterUsageReading.reading_timestamp)
        )
        readings = result.scalars().all()
        
        export_data = {
            "export_id": str(uuid4()),
            "facility_id": str(facility_id),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "format": format,
            "records_count": len(readings),
            "generated_at": datetime.utcnow().isoformat()
        }
        
        if format == "json":
            export_data["data"] = [
                {
                    "timestamp": r.reading_timestamp.isoformat(),
                    "volume_liters": r.volume_liters,
                    "flow_rate": r.flow_rate,
                    "pressure_bar": r.pressure_bar,
                    "temperature_celsius": r.temperature_celsius,
                    "is_estimated": r.is_estimated,
                    "quality_score": r.quality_score
                }
                for r in readings
            ]
        elif format == "csv":
            # Generate CSV content
            csv_lines = ["timestamp,volume_liters,flow_rate,pressure_bar,temperature_celsius,is_estimated,quality_score"]
            for r in readings:
                csv_lines.append(
                    f"{r.reading_timestamp.isoformat()},{r.volume_liters},{r.flow_rate or ''},"
                    f"{r.pressure_bar or ''},{r.temperature_celsius or ''},{r.is_estimated},{r.quality_score or ''}"
                )
            export_data["csv_content"] = "\n".join(csv_lines)
        
        return export_data
    
    async def _create_default_alert_rules(self, db: AsyncSession, facility_id: UUID, organization_id: UUID):
        """Create default alert rules for a new facility"""
        default_rules = [
            {
                "name": "Low Water Level",
                "rule_type": "threshold",
                "condition_expression": "water_level < 20",
                "threshold_value": 20.0,
                "threshold_operator": "<",
                "severity": AlertSeverity.HIGH
            },
            {
                "name": "High Water Usage",
                "rule_type": "threshold", 
                "condition_expression": "daily_usage > baseline * 1.5",
                "severity": AlertSeverity.MEDIUM
            }
        ]
        
        for rule_data in default_rules:
            rule = AlertRule(
                organization_id=organization_id,
                facility_id=facility_id,
                **rule_data
            )
            db.add(rule)
        
        await db.commit()

class IoTDataProcessor:
    """IoT sensor data processing and analysis"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the IoT processor"""
        self.initialized = True
        logger.info("IoTDataProcessor initialized")
    
    async def create_sensor(self, db: AsyncSession, sensor_data: SensorCreate, organization_id: UUID) -> IoTSensor:
        """Register a new IoT sensor"""
        sensor = IoTSensor(
            organization_id=organization_id,
            facility_id=sensor_data.facility_id,
            sensor_type=sensor_data.sensor_type,
            name=sensor_data.name,
            description=sensor_data.description,
            device_id=sensor_data.device_id,
            manufacturer=sensor_data.manufacturer,
            model=sensor_data.model,
            measurement_unit=sensor_data.measurement_unit,
            measurement_range=sensor_data.measurement_range.dict() if sensor_data.measurement_range else None,
            accuracy=sensor_data.accuracy,
            sampling_frequency=sensor_data.sampling_frequency,
            threshold_config=sensor_data.threshold_config.dict() if sensor_data.threshold_config else None,
            communication_protocol=sensor_data.communication_protocol,
            metadata=sensor_data.metadata or {}
        )
        
        db.add(sensor)
        await db.commit()
        await db.refresh(sensor)
        return sensor
    
    async def get_sensors(self, db: AsyncSession, organization_id: UUID,
                         facility_id: Optional[UUID] = None,
                         sensor_type: Optional[str] = None,
                         status: Optional[str] = None) -> List[IoTSensor]:
        """Get sensors with optional filters"""
        query = select(IoTSensor).where(IoTSensor.organization_id == organization_id)
        
        if facility_id:
            query = query.where(IoTSensor.facility_id == facility_id)
        if sensor_type:
            query = query.where(IoTSensor.sensor_type == sensor_type)
        if status:
            query = query.where(IoTSensor.status == status)
        
        result = await db.execute(query.order_by(IoTSensor.name))
        return result.scalars().all()
    
    async def process_reading(self, db: AsyncSession, sensor_id: UUID, reading_data: Dict[str, Any]) -> WaterUsageReading:
        """Process and store sensor reading"""
        
        # Get sensor info
        result = await db.execute(
            select(IoTSensor).where(IoTSensor.id == sensor_id)
        )
        sensor = result.scalar_one_or_none()
        
        if not sensor:
            raise ValueError(f"Sensor {sensor_id} not found")
        
        # Create usage reading
        reading = WaterUsageReading(
            organization_id=sensor.organization_id,
            facility_id=sensor.facility_id,
            sensor_id=sensor_id,
            reading_timestamp=datetime.fromisoformat(reading_data.get("timestamp", datetime.utcnow().isoformat())),
            volume_liters=reading_data.get("volume_liters", 0.0),
            flow_rate=reading_data.get("flow_rate"),
            pressure_bar=reading_data.get("pressure_bar"),
            temperature_celsius=reading_data.get("temperature_celsius"),
            raw_data=reading_data
        )
        
        # Update sensor last reading time
        sensor.last_reading_at = reading.reading_timestamp
        sensor.battery_level = reading_data.get("battery_level", sensor.battery_level)
        sensor.signal_strength = reading_data.get("signal_strength", sensor.signal_strength)
        
        db.add(reading)
        await db.commit()
        await db.refresh(reading)
        
        return reading
    
    async def get_readings(self, db: AsyncSession, sensor_id: UUID,
                          start_date: Optional[datetime] = None,
                          end_date: Optional[datetime] = None,
                          limit: int = 100,
                          organization_id: UUID = None) -> List[WaterUsageReading]:
        """Get historical sensor readings"""
        
        query = select(WaterUsageReading).where(WaterUsageReading.sensor_id == sensor_id)
        
        if organization_id:
            query = query.where(WaterUsageReading.organization_id == organization_id)
        if start_date:
            query = query.where(WaterUsageReading.reading_timestamp >= start_date)
        if end_date:
            query = query.where(WaterUsageReading.reading_timestamp <= end_date)
        
        query = query.order_by(desc(WaterUsageReading.reading_timestamp)).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def analyze_anomalies(self, sensor_id: UUID, reading_data: Dict[str, Any]):
        """Analyze sensor data for anomalies (background task)"""
        # Implement anomaly detection logic
        # This would typically use machine learning models
        logger.info(f"Analyzing anomalies for sensor {sensor_id}: {reading_data}")

class AWDEducationService:
    """AWD (Alternate Wetting & Drying) education and community service"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the education service"""
        self.initialized = True
        logger.info("AWDEducationService initialized")
    
    async def get_modules(self, db: AsyncSession, category: Optional[str] = None,
                         difficulty: Optional[str] = None) -> List[AWDEducationModule]:
        """Get AWD educational modules"""
        query = select(AWDEducationModule).where(AWDEducationModule.is_published == True)
        
        if category:
            query = query.where(AWDEducationModule.category == category)
        if difficulty:
            query = query.where(AWDEducationModule.difficulty_level == difficulty)
        
        result = await db.execute(query.order_by(AWDEducationModule.title))
        return result.scalars().all()
    
    async def get_module_content(self, db: AsyncSession, module_id: UUID) -> Optional[Dict[str, Any]]:
        """Get detailed module content"""
        result = await db.execute(
            select(AWDEducationModule).where(AWDEducationModule.id == module_id)
        )
        module = result.scalar_one_or_none()
        
        if not module:
            return None
        
        return {
            "id": str(module.id),
            "title": module.title,
            "description": module.description,
            "content_data": module.content_data,
            "learning_objectives": module.learning_objectives,
            "video_url": module.video_url,
            "interactive_elements": module.interactive_elements,
            "assessment_questions": module.assessment_questions if module.has_assessment else None,
            "awd_principles": module.awd_principles,
            "calculation_examples": module.calculation_examples
        }
    
    async def update_progress(self, db: AsyncSession, user_id: UUID, module_id: UUID,
                            progress_data: Dict[str, Any]) -> UserProgress:
        """Update user learning progress"""
        
        # Get or create user progress
        result = await db.execute(
            select(UserProgress).where(and_(
                UserProgress.user_id == user_id,
                UserProgress.module_id == module_id
            ))
        )
        progress = result.scalar_one_or_none()
        
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                module_id=module_id,
                organization_id=progress_data.get("organization_id")
            )
            db.add(progress)
        
        # Update progress fields
        progress.progress_percentage = progress_data.get("progress_percentage", progress.progress_percentage)
        progress.time_spent_minutes += progress_data.get("time_increment", 0)
        progress.status = progress_data.get("status", progress.status)
        progress.last_accessed = datetime.utcnow()
        
        if progress_data.get("assessment_score"):
            progress.assessment_attempts += 1
            progress.latest_score = progress_data["assessment_score"]
            if not progress.best_score or progress_data["assessment_score"] > progress.best_score:
                progress.best_score = progress_data["assessment_score"]
            
            # Check if passed
            module_result = await db.execute(
                select(AWDEducationModule).where(AWDEducationModule.id == module_id)
            )
            module = module_result.scalar_one()
            if progress.latest_score >= module.passing_score:
                progress.passed_assessment = True
                progress.points_earned = module.certification_points
                if progress.progress_percentage >= 100:
                    progress.status = "completed"
                    progress.completed_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(progress)
        return progress
    
    async def calculate_awd_parameters(self, crop_type: str, field_area: float,
                                     soil_type: str, climate_zone: str) -> Dict[str, Any]:
        """Calculate AWD methodology parameters"""
        
        # AWD calculation logic based on scientific parameters
        # These are example calculations - real implementation would use validated models
        
        base_water_requirement = {
            "rice": 1500,  # mm per season
            "wheat": 450,
            "maize": 500,
            "soybeans": 450
        }
        
        soil_adjustment = {
            "clay": 1.2,
            "loam": 1.0,
            "sand": 0.8
        }
        
        climate_adjustment = {
            "arid": 1.3,
            "semi_arid": 1.1,
            "humid": 0.9,
            "tropical": 1.0
        }
        
        base_requirement = base_water_requirement.get(crop_type.lower(), 1000)
        soil_factor = soil_adjustment.get(soil_type.lower(), 1.0)
        climate_factor = climate_adjustment.get(climate_zone.lower(), 1.0)
        
        # Calculate total water requirement
        total_water_requirement = base_requirement * soil_factor * climate_factor
        
        # AWD savings (typically 15-30%)
        awd_savings_percentage = 20  # Conservative estimate
        awd_water_requirement = total_water_requirement * (1 - awd_savings_percentage / 100)
        
        # Calculate for field area
        total_volume_liters = (total_water_requirement / 1000) * field_area * 10000  # Convert mm to liters
        awd_volume_liters = (awd_water_requirement / 1000) * field_area * 10000
        
        return {
            "crop_type": crop_type,
            "field_area_hectares": field_area,
            "soil_type": soil_type,
            "climate_zone": climate_zone,
            "calculations": {
                "traditional_water_requirement_mm": round(total_water_requirement, 1),
                "awd_water_requirement_mm": round(awd_water_requirement, 1),
                "water_savings_mm": round(total_water_requirement - awd_water_requirement, 1),
                "savings_percentage": awd_savings_percentage,
                "total_volume_traditional_liters": round(total_volume_liters, 0),
                "total_volume_awd_liters": round(awd_volume_liters, 0),
                "water_savings_liters": round(total_volume_liters - awd_volume_liters, 0)
            },
            "recommendations": {
                "irrigation_frequency": "Every 3-5 days after drainage",
                "water_depth": "5-10 cm above soil surface",
                "drainage_timing": "When water level reaches 15cm below surface",
                "critical_stages": "Avoid stress during flowering and grain filling"
            },
            "environmental_benefits": {
                "methane_reduction_percentage": 30,
                "estimated_carbon_savings_kg": round((total_volume_liters - awd_volume_liters) * 0.001, 2)
            }
        }
    
    async def get_community_posts(self, db: AsyncSession, topic: Optional[str] = None,
                                limit: int = 50) -> List[CommunityPost]:
        """Get community knowledge sharing posts"""
        query = select(CommunityPost).where(CommunityPost.is_active == True)
        
        if topic:
            query = query.where(CommunityPost.topic == topic)
        
        result = await db.execute(
            query.order_by(desc(CommunityPost.last_activity)).limit(limit)
        )
        return result.scalars().all()
    
    async def create_community_post(self, db: AsyncSession, user_id: UUID,
                                  post_data: Dict[str, Any]) -> CommunityPost:
        """Create a new community post"""
        post = CommunityPost(
            author_id=user_id,
            author_organization_id=post_data.get("organization_id"),
            title=post_data["title"],
            content=post_data["content"],
            post_type=post_data["post_type"],
            topic=post_data["topic"],
            tags=post_data.get("tags", []),
            crop_types=post_data.get("crop_types", []),
            climate_zones=post_data.get("climate_zones", []),
            geographic_region=post_data.get("geographic_region"),
            difficulty_level=post_data.get("difficulty_level"),
            parent_post_id=post_data.get("parent_post_id")
        )
        
        db.add(post)
        await db.commit()
        await db.refresh(post)
        return post

class VibeCalculator:
    """VIBE framework scoring calculator"""
    
    def __init__(self):
        self.initialized = False
    
    async def get_scores(self, db: AsyncSession, organization_id: UUID,
                        facility_id: Optional[UUID] = None,
                        metric_type: Optional[str] = None) -> List[VibeScore]:
        """Get VIBE framework scores"""
        query = select(VibeScore).where(VibeScore.organization_id == organization_id)
        
        if facility_id:
            query = query.where(VibeScore.facility_id == facility_id)
        
        result = await db.execute(query.order_by(desc(VibeScore.calculation_date)))
        return result.scalars().all()
    
    async def calculate_facility_scores(self, db: AsyncSession, facility_id: UUID):
        """Calculate VIBE scores for a facility (background task)"""
        # Implement VIBE scoring algorithm
        logger.info(f"Calculating VIBE scores for facility {facility_id}")

class OptimizationEngine:
    """AI-powered optimization and recommendations"""
    
    def __init__(self):
        self.initialized = False
    
    async def get_recommendations(self, db: AsyncSession, organization_id: UUID,
                                facility_id: Optional[UUID] = None,
                                category: Optional[str] = None) -> List[OptimizationRecommendation]:
        """Get optimization recommendations"""
        query = select(OptimizationRecommendation).where(
            and_(
                OptimizationRecommendation.organization_id == organization_id,
                OptimizationRecommendation.is_active == True
            )
        )
        
        if facility_id:
            query = query.where(OptimizationRecommendation.facility_id == facility_id)
        if category:
            query = query.where(OptimizationRecommendation.category == category)
        
        result = await db.execute(query.order_by(desc(OptimizationRecommendation.confidence_score)))
        return result.scalars().all()
    
    async def predict_usage(self, db: AsyncSession, facility_id: UUID,
                          days_ahead: int, organization_id: UUID) -> Dict[str, Any]:
        """Predict water usage using AI models"""
        
        # Get historical data
        lookback_days = min(days_ahead * 5, 90)  # Use 5x prediction period or 90 days max
        start_date = datetime.utcnow() - timedelta(days=lookback_days)
        
        result = await db.execute(
            select(WaterUsageReading)
            .where(and_(
                WaterUsageReading.facility_id == facility_id,
                WaterUsageReading.organization_id == organization_id,
                WaterUsageReading.reading_timestamp >= start_date
            ))
            .order_by(WaterUsageReading.reading_timestamp)
        )
        readings = result.scalars().all()
        
        if len(readings) < 7:  # Need at least a week of data
            return {
                "error": "Insufficient historical data for prediction",
                "required_days": 7,
                "available_days": len(readings)
            }
        
        # Simple prediction based on historical averages and trends
        # In production, this would use more sophisticated ML models
        daily_usage = defaultdict(float)
        for reading in readings:
            date_key = reading.reading_timestamp.date()
            daily_usage[date_key] += reading.volume_liters
        
        usage_values = list(daily_usage.values())
        avg_usage = mean(usage_values)
        
        # Calculate trend
        if len(usage_values) > 14:
            recent_avg = mean(usage_values[-7:])
            previous_avg = mean(usage_values[-14:-7])
            trend_factor = recent_avg / previous_avg if previous_avg > 0 else 1.0
        else:
            trend_factor = 1.0
        
        # Generate predictions
        predictions = []
        base_date = datetime.utcnow().date()
        
        for day in range(1, days_ahead + 1):
            prediction_date = base_date + timedelta(days=day)
            
            # Apply seasonal and weekly patterns (simplified)
            day_of_week = prediction_date.weekday()
            weekly_factor = 0.8 if day_of_week in [5, 6] else 1.0  # Lower usage on weekends
            
            predicted_usage = avg_usage * trend_factor * weekly_factor
            
            # Add some randomness for confidence intervals
            confidence_interval = predicted_usage * 0.15  # ±15%
            
            predictions.append({
                "date": prediction_date.isoformat(),
                "predicted_usage_liters": round(predicted_usage, 2),
                "confidence_interval_lower": round(predicted_usage - confidence_interval, 2),
                "confidence_interval_upper": round(predicted_usage + confidence_interval, 2),
                "confidence_level": 85.0
            })
        
        return {
            "facility_id": str(facility_id),
            "prediction_period_days": days_ahead,
            "historical_data_days": len(set(r.reading_timestamp.date() for r in readings)),
            "average_historical_usage": round(avg_usage, 2),
            "trend_factor": round(trend_factor, 3),
            "predictions": predictions,
            "model_version": "simple_trend_v1.0",
            "generated_at": datetime.utcnow().isoformat()
        }
    
    async def analyze_facility(self, db: AsyncSession, facility_id: UUID, organization_id: UUID):
        """Analyze facility for optimization opportunities (background task)"""
        logger.info(f"Analyzing facility {facility_id} for optimization opportunities")

class AlertManager:
    """Alert and notification management"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize alert manager"""
        self.initialized = True
        logger.info("AlertManager initialized")
    
    async def get_alerts(self, db: AsyncSession, organization_id: UUID,
                        facility_id: Optional[UUID] = None,
                        severity: Optional[str] = None,
                        status: Optional[str] = None) -> List[Alert]:
        """Get alerts with filters"""
        query = select(Alert).where(Alert.organization_id == organization_id)
        
        if facility_id:
            query = query.where(Alert.facility_id == facility_id)
        if severity:
            query = query.where(Alert.severity == severity)
        if status:
            query = query.where(Alert.status == status)
        
        result = await db.execute(query.order_by(desc(Alert.trigger_timestamp)))
        return result.scalars().all()
    
    async def acknowledge_alert(self, db: AsyncSession, alert_id: UUID,
                              user_id: UUID, organization_id: UUID) -> Dict[str, Any]:
        """Acknowledge an alert"""
        result = await db.execute(
            select(Alert).where(and_(
                Alert.id == alert_id,
                Alert.organization_id == organization_id
            ))
        )
        alert = result.scalar_one_or_none()
        
        if not alert:
            return {"error": "Alert not found"}
        
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_at = datetime.utcnow()
        alert.acknowledged_by = user_id
        
        await db.commit()
        
        return {
            "alert_id": str(alert_id),
            "status": "acknowledged",
            "acknowledged_at": alert.acknowledged_at.isoformat(),
            "acknowledged_by": str(user_id)
        }

class WebSocketManager:
    """WebSocket connection management for real-time updates"""
    
    def __init__(self):
        self.connections: Dict[str, List[Any]] = defaultdict(list)
    
    async def connect(self, websocket, channel: str):
        """Add websocket connection to channel"""
        await websocket.accept()
        self.connections[channel].append(websocket)
        logger.info(f"WebSocket connected to channel {channel}")
    
    def disconnect(self, websocket, channel: str):
        """Remove websocket connection from channel"""
        if websocket in self.connections[channel]:
            self.connections[channel].remove(websocket)
            logger.info(f"WebSocket disconnected from channel {channel}")
    
    async def broadcast_sensor_data(self, sensor_id: UUID, data: Dict[str, Any]):
        """Broadcast sensor data to relevant channels"""
        message = {
            "type": "sensor_data",
            "sensor_id": str(sensor_id),
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast to general monitoring channel
        await self._broadcast_to_channel("monitoring", message)
        
        # Broadcast to sensor-specific channel if exists
        sensor_channel = f"sensor_{sensor_id}"
        await self._broadcast_to_channel(sensor_channel, message)
    
    async def _broadcast_to_channel(self, channel: str, message: Dict[str, Any]):
        """Broadcast message to all connections in a channel"""
        if channel in self.connections:
            disconnected = []
            for websocket in self.connections[channel]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to websocket: {e}")
                    disconnected.append(websocket)
            
            # Remove disconnected websockets
            for ws in disconnected:
                self.connections[channel].remove(ws)
    
    async def disconnect_all(self):
        """Disconnect all websocket connections"""
        for channel, connections in self.connections.items():
            for websocket in connections:
                try:
                    await websocket.close()
                except Exception:
                    pass
        self.connections.clear()
        logger.info("All WebSocket connections disconnected")

# Export all services
__all__ = [
    "WaterManagementService", "IoTDataProcessor", "AWDEducationService",
    "VibeCalculator", "OptimizationEngine", "AlertManager", "WebSocketManager"
]