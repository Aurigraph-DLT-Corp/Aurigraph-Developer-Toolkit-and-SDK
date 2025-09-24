# ================================================================================
# AUREX LAUNCHPAD™ EU TAXONOMY ENGINE
# Sub-Application #3: Advanced EU Taxonomy & ESRS Compliance Engine
# Module ID: LAU-EU-003-ENGINE - EU Taxonomy Compliance Service
# Created: August 8, 2025
# ================================================================================

import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
from decimal import Decimal
import json
import logging
from enum import Enum

from models.eu_taxonomy_models import (
    EnvironmentalObjective, TaxonomyAlignment, ComplianceStatus,
    MaterialityType, ESRSStandard, SafeguardPrinciple,
    TechnicalScreeningCriteria, DoubleMaturityAssessment,
    ESRSCompliance, SafeguardCompliance
)

# Configure logging
logger = logging.getLogger(__name__)

class EUTaxonomyEngine:
    """
    Advanced EU Taxonomy Compliance Engine
    
    Implements comprehensive EU Taxonomy assessment logic based on:
    - EU Taxonomy Regulation (2020/852)
    - Climate Delegated Act (2021/2139) 
    - Environmental Delegated Act (2023/2486)
    - Complementary Climate Delegated Act (2022/1214)
    - EU Taxonomy Compass guidance
    """
    
    def __init__(self):
        self.technical_criteria = self._load_technical_criteria()
        self.dnsh_criteria = self._load_dnsh_criteria()
        self.safeguard_requirements = self._load_safeguard_requirements()
        self.activity_mappings = self._load_activity_mappings()
        
    def _load_technical_criteria(self) -> Dict[str, Any]:
        """Load technical screening criteria for all environmental objectives"""
        return {
            EnvironmentalObjective.CLIMATE_MITIGATION: {
                "renewable_energy": {
                    "4.1_solar": {
                        "criteria": [
                            "Life-cycle GHG emissions from electricity generation < 100g CO2e/kWh",
                            "No significant harm to other environmental objectives"
                        ],
                        "metrics": ["ghg_emissions_kwh", "capacity_factor", "environmental_impact"]
                    },
                    "4.3_wind": {
                        "criteria": [
                            "Life-cycle GHG emissions from electricity generation < 100g CO2e/kWh",
                            "Manufacturing activities comply with waste prevention requirements"
                        ],
                        "metrics": ["ghg_emissions_kwh", "waste_generation", "land_use"]
                    }
                },
                "energy_efficiency": {
                    "7.3_building_renovation": {
                        "criteria": [
                            "Achieve primary energy demand reduction ≥ 30%",
                            "Meet energy performance requirements for building elements"
                        ],
                        "metrics": ["energy_reduction_percentage", "building_performance_class"]
                    }
                },
                "clean_transport": {
                    "6.5_urban_transport": {
                        "criteria": [
                            "Direct tailpipe CO2 emissions = 0g CO2/km",
                            "Or 50g CO2/km for vehicles > 3.5t until 31 Dec 2025"
                        ],
                        "metrics": ["co2_emissions_km", "vehicle_type", "fuel_type"]
                    }
                }
            },
            EnvironmentalObjective.CLIMATE_ADAPTATION: {
                "climate_solutions": {
                    "adaptation_solutions": {
                        "criteria": [
                            "Substantially reduce climate risk to activity itself",
                            "Or substantially reduce climate risk to people/nature/assets"
                        ],
                        "metrics": ["risk_reduction_percentage", "adaptation_measures", "resilience_score"]
                    }
                }
            }
            # Additional objectives would be fully implemented in production
        }
    
    def _load_dnsh_criteria(self) -> Dict[str, Any]:
        """Load Do No Significant Harm criteria for all objectives"""
        return {
            "cross_cutting": {
                "climate_mitigation": [
                    "Activity does not lead to significant GHG lock-in",
                    "Life-cycle GHG emissions < sector benchmark"
                ],
                "climate_adaptation": [
                    "Activity does not lead to adverse impact on adaptation",
                    "Climate risks are identified and addressed"
                ],
                "water_protection": [
                    "Environmental degradation risks identified and addressed",
                    "Water use and protection measures implemented"
                ],
                "circular_economy": [
                    "Waste hierarchy principles applied",
                    "Material efficiency maximized"
                ],
                "pollution_prevention": [
                    "Pollution to air, water, land is prevented/minimized",
                    "Best available techniques applied"
                ],
                "biodiversity_protection": [
                    "Environmental impact assessment conducted",
                    "Biodiversity-sensitive areas protected"
                ]
            }
        }
    
    def _load_safeguard_requirements(self) -> Dict[SafeguardPrinciple, List[str]]:
        """Load minimum safeguards requirements"""
        return {
            SafeguardPrinciple.OECD_GUIDELINES: [
                "Due diligence procedures in place",
                "Risk assessment conducted annually",
                "Grievance mechanisms established",
                "Stakeholder engagement processes active"
            ],
            SafeguardPrinciple.UN_GUIDING_PRINCIPLES: [
                "Human rights policy publicly available",
                "Human rights due diligence implemented",
                "Remedy mechanisms for adverse impacts",
                "Regular human rights impact assessments"
            ],
            SafeguardPrinciple.ILO_DECLARATION: [
                "Freedom of association respected",
                "Collective bargaining rights recognized",
                "No child labor in operations/supply chain",
                "No forced/compulsory labor",
                "No discrimination in employment"
            ],
            SafeguardPrinciple.INTERNATIONAL_BILL_RIGHTS: [
                "Fundamental human rights respected",
                "Economic, social, cultural rights protected",
                "Civil and political rights upheld",
                "Regular monitoring and reporting"
            ]
        }
    
    def _load_activity_mappings(self) -> Dict[str, Dict[str, Any]]:
        """Load NACE code to taxonomy activity mappings"""
        return {
            # Energy sector
            "35.11": {
                "name": "Production of electricity",
                "eligible_objectives": [EnvironmentalObjective.CLIMATE_MITIGATION],
                "taxonomy_activities": ["4.1", "4.3", "4.8"]
            },
            "35.12": {
                "name": "Transmission of electricity", 
                "eligible_objectives": [EnvironmentalObjective.CLIMATE_MITIGATION],
                "taxonomy_activities": ["4.9", "4.10"]
            },
            # Construction
            "41.20": {
                "name": "Construction of residential and non-residential buildings",
                "eligible_objectives": [EnvironmentalObjective.CLIMATE_MITIGATION, EnvironmentalObjective.CLIMATE_ADAPTATION],
                "taxonomy_activities": ["7.1", "7.2", "7.7"]
            },
            # Transportation
            "49.10": {
                "name": "Passenger rail transport",
                "eligible_objectives": [EnvironmentalObjective.CLIMATE_MITIGATION],
                "taxonomy_activities": ["6.1", "6.2"]
            },
            # Manufacturing
            "20.14": {
                "name": "Manufacture of other organic basic chemicals",
                "eligible_objectives": [EnvironmentalObjective.CIRCULAR_ECONOMY, EnvironmentalObjective.POLLUTION_PREVENTION],
                "taxonomy_activities": ["3.9", "3.14"]
            }
        }
    
    async def initialize_screening_criteria(
        self,
        assessment_id: str,
        selected_objectives: List[EnvironmentalObjective],
        economic_activities: List[str]
    ) -> Dict[str, Any]:
        """Initialize technical screening criteria for assessment"""
        try:
            logger.info(f"Initializing screening criteria for assessment {assessment_id}")
            
            criteria_generated = []
            
            for activity_code in economic_activities:
                # Get activity mapping
                activity_mapping = self.activity_mappings.get(activity_code, {})
                
                if not activity_mapping:
                    logger.warning(f"No taxonomy mapping found for NACE code {activity_code}")
                    continue
                
                # Check which objectives apply to this activity
                applicable_objectives = [
                    obj for obj in selected_objectives 
                    if obj in activity_mapping.get("eligible_objectives", [])
                ]
                
                for objective in applicable_objectives:
                    # Generate criteria for this objective-activity combination
                    objective_criteria = self.technical_criteria.get(objective, {})
                    
                    # Find matching taxonomy activities
                    taxonomy_activities = activity_mapping.get("taxonomy_activities", [])
                    
                    for taxonomy_activity in taxonomy_activities:
                        criteria = self._generate_criteria_for_activity(
                            assessment_id=assessment_id,
                            objective=objective,
                            activity_code=activity_code,
                            taxonomy_activity=taxonomy_activity,
                            activity_name=activity_mapping["name"]
                        )
                        criteria_generated.extend(criteria)
            
            return {
                "assessment_id": assessment_id,
                "criteria_generated": len(criteria_generated),
                "objectives_covered": len(selected_objectives),
                "activities_covered": len(economic_activities),
                "initialization_successful": True
            }
            
        except Exception as e:
            logger.error(f"Error initializing screening criteria: {str(e)}")
            raise Exception(f"Criteria initialization failed: {str(e)}")
    
    def _generate_criteria_for_activity(
        self,
        assessment_id: str,
        objective: EnvironmentalObjective,
        activity_code: str,
        taxonomy_activity: str,
        activity_name: str
    ) -> List[Dict[str, Any]]:
        """Generate specific criteria for an objective-activity combination"""
        criteria_list = []
        
        # Base criteria structure
        base_criteria = {
            "assessment_id": assessment_id,
            "environmental_objective": objective,
            "activity_code": activity_code,
            "activity_description": activity_name,
            "taxonomy_activity_code": taxonomy_activity
        }
        
        # Generate substantial contribution criteria
        substantial_criteria = {
            **base_criteria,
            "criteria_type": "substantial_contribution",
            "criteria_description": f"Substantial contribution to {objective.value}",
            "metric_requirements": self._get_substantial_contribution_metrics(objective, taxonomy_activity),
            "dnsh_assessment_required": True,
            "minimum_safeguards_applicable": True,
            "criteria_sequence": 1
        }
        criteria_list.append(substantial_criteria)
        
        # Generate DNSH criteria for other objectives
        dnsh_sequence = 2
        for other_objective in EnvironmentalObjective:
            if other_objective != objective:
                dnsh_criteria = {
                    **base_criteria,
                    "criteria_type": "dnsh",
                    "environmental_objective": other_objective,
                    "criteria_description": f"Do No Significant Harm to {other_objective.value}",
                    "metric_requirements": self._get_dnsh_metrics(other_objective, taxonomy_activity),
                    "dnsh_assessment_required": False,
                    "minimum_safeguards_applicable": False,
                    "criteria_sequence": dnsh_sequence
                }
                criteria_list.append(dnsh_criteria)
                dnsh_sequence += 1
        
        return criteria_list
    
    def _get_substantial_contribution_metrics(
        self, 
        objective: EnvironmentalObjective, 
        taxonomy_activity: str
    ) -> Dict[str, Any]:
        """Get specific metrics for substantial contribution assessment"""
        
        metrics_mapping = {
            EnvironmentalObjective.CLIMATE_MITIGATION: {
                "4.1": {  # Solar energy
                    "ghg_emissions_threshold": {"value": 100, "unit": "g CO2e/kWh"},
                    "capacity_factor": {"min": 20, "unit": "%"},
                    "life_cycle_assessment": {"required": True}
                },
                "4.3": {  # Wind energy
                    "ghg_emissions_threshold": {"value": 100, "unit": "g CO2e/kWh"},
                    "land_use_efficiency": {"metric": "MW/km²"},
                    "waste_prevention": {"required": True}
                },
                "7.1": {  # Building construction
                    "primary_energy_demand": {"reduction_min": 10, "unit": "%"},
                    "nzeb_compliance": {"required": True}
                }
            },
            EnvironmentalObjective.CLIMATE_ADAPTATION: {
                "default": {
                    "climate_risk_reduction": {"min": 30, "unit": "%"},
                    "resilience_measures": {"required": True},
                    "adaptation_plan": {"required": True}
                }
            },
            EnvironmentalObjective.CIRCULAR_ECONOMY: {
                "default": {
                    "waste_reduction": {"min": 15, "unit": "%"},
                    "material_recovery": {"min": 50, "unit": "%"},
                    "circular_design": {"required": True}
                }
            }
        }
        
        return metrics_mapping.get(objective, {}).get(taxonomy_activity, 
                                                      metrics_mapping.get(objective, {}).get("default", {}))
    
    def _get_dnsh_metrics(
        self, 
        objective: EnvironmentalObjective, 
        taxonomy_activity: str
    ) -> Dict[str, Any]:
        """Get DNSH assessment metrics for specific objective"""
        
        dnsh_metrics = {
            EnvironmentalObjective.CLIMATE_MITIGATION: {
                "ghg_lock_in_risk": {"assessment": "required"},
                "stranded_assets": {"evaluation": "required"}
            },
            EnvironmentalObjective.CLIMATE_ADAPTATION: {
                "climate_risk_assessment": {"required": True},
                "adaptation_measures": {"documented": True}
            },
            EnvironmentalObjective.WATER_PROTECTION: {
                "water_use_assessment": {"required": True},
                "water_quality_impact": {"evaluation": "required"},
                "water_management_plan": {"required": True}
            },
            EnvironmentalObjective.CIRCULAR_ECONOMY: {
                "waste_hierarchy": {"compliance": "required"},
                "material_efficiency": {"optimization": "required"}
            },
            EnvironmentalObjective.POLLUTION_PREVENTION: {
                "emission_assessment": {"required": True},
                "best_available_techniques": {"implementation": "required"}
            },
            EnvironmentalObjective.BIODIVERSITY_PROTECTION: {
                "environmental_impact_assessment": {"required": True},
                "biodiversity_management_plan": {"required": True}
            }
        }
        
        return dnsh_metrics.get(objective, {})
    
    async def assess_taxonomy_alignment(
        self,
        assessment_id: str,
        technical_responses: List[Dict[str, Any]],
        safeguard_compliance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess overall EU Taxonomy alignment based on responses"""
        try:
            logger.info(f"Assessing taxonomy alignment for assessment {assessment_id}")
            
            alignment_results = {
                "assessment_id": assessment_id,
                "overall_alignment": TaxonomyAlignment.UNDER_ASSESSMENT,
                "objective_alignments": {},
                "activity_alignments": {},
                "alignment_percentage": 0.0,
                "key_findings": [],
                "compliance_gaps": [],
                "recommendations": []
            }
            
            # Group responses by objective and activity
            objective_responses = {}
            for response in technical_responses:
                objective = response.get("environmental_objective")
                activity = response.get("activity_code")
                
                if objective not in objective_responses:
                    objective_responses[objective] = {}
                if activity not in objective_responses[objective]:
                    objective_responses[objective][activity] = []
                
                objective_responses[objective][activity].append(response)
            
            # Assess each objective-activity combination
            aligned_activities = 0
            total_activities = 0
            
            for objective, activities in objective_responses.items():
                objective_alignment = self._assess_objective_alignment(
                    objective, activities, safeguard_compliance
                )
                alignment_results["objective_alignments"][objective] = objective_alignment
                
                for activity, activity_alignment in objective_alignment["activities"].items():
                    total_activities += 1
                    if activity_alignment["aligned"]:
                        aligned_activities += 1
                    
                    alignment_results["activity_alignments"][activity] = activity_alignment
            
            # Calculate overall alignment
            if total_activities > 0:
                alignment_percentage = (aligned_activities / total_activities) * 100
                alignment_results["alignment_percentage"] = alignment_percentage
                
                if alignment_percentage >= 90:
                    alignment_results["overall_alignment"] = TaxonomyAlignment.ALIGNED
                elif alignment_percentage >= 50:
                    alignment_results["overall_alignment"] = TaxonomyAlignment.ELIGIBLE_NOT_ALIGNED
                else:
                    alignment_results["overall_alignment"] = TaxonomyAlignment.NOT_ELIGIBLE
            
            # Generate findings and recommendations
            alignment_results["key_findings"] = self._generate_alignment_findings(
                objective_responses, alignment_results
            )
            alignment_results["compliance_gaps"] = self._identify_compliance_gaps(
                technical_responses, safeguard_compliance
            )
            alignment_results["recommendations"] = self._generate_alignment_recommendations(
                alignment_results
            )
            
            return alignment_results
            
        except Exception as e:
            logger.error(f"Error assessing taxonomy alignment: {str(e)}")
            raise Exception(f"Alignment assessment failed: {str(e)}")
    
    def _assess_objective_alignment(
        self,
        objective: str,
        activities: Dict[str, List[Dict[str, Any]]],
        safeguard_compliance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess alignment for a specific environmental objective"""
        
        objective_result = {
            "objective": objective,
            "activities": {},
            "aligned_activities": 0,
            "total_activities": len(activities),
            "alignment_rate": 0.0
        }
        
        for activity_code, responses in activities.items():
            activity_alignment = self._assess_activity_alignment(
                objective, activity_code, responses, safeguard_compliance
            )
            objective_result["activities"][activity_code] = activity_alignment
            
            if activity_alignment["aligned"]:
                objective_result["aligned_activities"] += 1
        
        if objective_result["total_activities"] > 0:
            objective_result["alignment_rate"] = (
                objective_result["aligned_activities"] / objective_result["total_activities"]
            ) * 100
        
        return objective_result
    
    def _assess_activity_alignment(
        self,
        objective: str,
        activity_code: str,
        responses: List[Dict[str, Any]],
        safeguard_compliance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess alignment for a specific activity"""
        
        activity_result = {
            "activity_code": activity_code,
            "objective": objective,
            "aligned": False,
            "substantial_contribution": False,
            "dnsh_compliant": True,
            "safeguards_compliant": True,
            "criteria_results": [],
            "blocking_issues": []
        }
        
        # Check substantial contribution
        substantial_responses = [r for r in responses if r.get("criteria_type") == "substantial_contribution"]
        if substantial_responses:
            substantial_result = substantial_responses[0]
            activity_result["substantial_contribution"] = (
                substantial_result.get("compliance_status") == ComplianceStatus.COMPLIANT.value
            )
        
        # Check DNSH compliance
        dnsh_responses = [r for r in responses if r.get("criteria_type") == "dnsh"]
        for dnsh_response in dnsh_responses:
            if dnsh_response.get("compliance_status") == ComplianceStatus.NON_COMPLIANT.value:
                activity_result["dnsh_compliant"] = False
                activity_result["blocking_issues"].append(
                    f"DNSH violation: {dnsh_response.get('environmental_objective')}"
                )
        
        # Check minimum safeguards
        if not safeguard_compliance.get("overall_compliant", True):
            activity_result["safeguards_compliant"] = False
            activity_result["blocking_issues"].extend(
                safeguard_compliance.get("violations", [])
            )
        
        # Determine overall alignment
        activity_result["aligned"] = (
            activity_result["substantial_contribution"] and
            activity_result["dnsh_compliant"] and
            activity_result["safeguards_compliant"]
        )
        
        return activity_result
    
    def _generate_alignment_findings(
        self, 
        objective_responses: Dict[str, Any], 
        alignment_results: Dict[str, Any]
    ) -> List[str]:
        """Generate key findings from alignment assessment"""
        
        findings = []
        
        # Overall alignment finding
        overall_alignment = alignment_results["overall_alignment"]
        alignment_percentage = alignment_results["alignment_percentage"]
        
        findings.append(
            f"Overall taxonomy alignment: {overall_alignment.value} "
            f"({alignment_percentage:.1f}% of assessed activities)"
        )
        
        # Objective-specific findings
        for objective, results in alignment_results["objective_alignments"].items():
            alignment_rate = results["alignment_rate"]
            findings.append(
                f"{objective}: {alignment_rate:.1f}% alignment rate "
                f"({results['aligned_activities']}/{results['total_activities']} activities)"
            )
        
        # Performance highlights
        if alignment_percentage >= 80:
            findings.append("Strong taxonomy alignment demonstrates commitment to sustainable activities")
        elif alignment_percentage >= 50:
            findings.append("Moderate alignment with significant improvement opportunities identified")
        else:
            findings.append("Limited current alignment - comprehensive sustainability strategy recommended")
        
        return findings
    
    def _identify_compliance_gaps(
        self,
        technical_responses: List[Dict[str, Any]],
        safeguard_compliance: Dict[str, Any]
    ) -> List[str]:
        """Identify key compliance gaps"""
        
        gaps = []
        
        # Technical criteria gaps
        non_compliant_responses = [
            r for r in technical_responses 
            if r.get("compliance_status") == ComplianceStatus.NON_COMPLIANT.value
        ]
        
        if non_compliant_responses:
            gaps.append(f"{len(non_compliant_responses)} technical screening criteria not met")
        
        # DNSH gaps
        dnsh_violations = [
            r for r in non_compliant_responses 
            if r.get("criteria_type") == "dnsh"
        ]
        
        if dnsh_violations:
            affected_objectives = set(r.get("environmental_objective") for r in dnsh_violations)
            gaps.append(f"DNSH violations identified for: {', '.join(affected_objectives)}")
        
        # Safeguard gaps
        safeguard_violations = safeguard_compliance.get("violations", [])
        if safeguard_violations:
            gaps.extend([f"Minimum safeguard gap: {violation}" for violation in safeguard_violations])
        
        return gaps
    
    def _generate_alignment_recommendations(
        self, 
        alignment_results: Dict[str, Any]
    ) -> List[str]:
        """Generate specific recommendations for improving alignment"""
        
        recommendations = []
        
        alignment_percentage = alignment_results["alignment_percentage"]
        
        # Strategic recommendations based on alignment level
        if alignment_percentage < 30:
            recommendations.extend([
                "Develop comprehensive sustainability strategy with clear taxonomy alignment goals",
                "Prioritize activities with highest alignment potential for investment focus",
                "Establish taxonomy-aligned investment criteria for future capital allocation"
            ])
        elif alignment_percentage < 70:
            recommendations.extend([
                "Enhance existing activities to meet technical screening criteria",
                "Address identified DNSH compliance gaps through targeted improvements",
                "Develop roadmap for increasing taxonomy-eligible activity portfolio"
            ])
        else:
            recommendations.extend([
                "Maintain high alignment standards through continuous monitoring",
                "Explore opportunities to expand taxonomy-aligned activities",
                "Consider taxonomy leadership role in industry sector"
            ])
        
        # Specific technical recommendations
        compliance_gaps = alignment_results.get("compliance_gaps", [])
        if compliance_gaps:
            recommendations.append("Priority actions required for compliance gaps identified")
        
        # Safeguard recommendations
        for objective_results in alignment_results["objective_alignments"].values():
            for activity_results in objective_results["activities"].values():
                if not activity_results["safeguards_compliant"]:
                    recommendations.append(
                        "Strengthen minimum safeguards compliance across all business operations"
                    )
                    break
        
        return recommendations[:5]  # Return top 5 recommendations


class ESRSComplianceEngine:
    """Engine for ESRS compliance assessment and reporting"""
    
    def __init__(self):
        self.esrs_requirements = self._load_esrs_requirements()
        self.disclosure_mappings = self._load_disclosure_mappings()
    
    def _load_esrs_requirements(self) -> Dict[ESRSStandard, Dict[str, Any]]:
        """Load ESRS disclosure requirements"""
        return {
            ESRSStandard.ESRS_E1: {
                "name": "Climate Change",
                "mandatory_disclosures": [
                    "E1-1: Transition plan for climate change mitigation",
                    "E1-2: Policies related to climate change mitigation and adaptation",
                    "E1-3: Actions and resources related to climate change policies"
                ],
                "conditional_disclosures": [
                    "E1-4: Targets related to climate change mitigation and adaptation",
                    "E1-5: Energy consumption and mix",
                    "E1-6: Gross Scopes 1, 2, 3 and Total GHG emissions"
                ]
            }
            # Additional ESRS standards would be implemented
        }
    
    def _load_disclosure_mappings(self) -> Dict[str, Dict[str, Any]]:
        """Load disclosure requirement mappings"""
        return {
            "E1-6": {
                "datapoints": [
                    "Total gross direct GHG emissions in own operations (Scope 1)",
                    "Total gross indirect GHG emissions from electricity consumption (Scope 2)",
                    "Total gross other indirect GHG emissions (Scope 3)"
                ],
                "calculation_basis": "GHG Protocol Corporate Standard",
                "assurance_required": True
            }
        }


# ================================================================================
# FACTORY FUNCTIONS
# ================================================================================

def create_eu_taxonomy_engine() -> EUTaxonomyEngine:
    """Factory function to create EU Taxonomy engine"""
    return EUTaxonomyEngine()

def create_esrs_compliance_engine() -> ESRSComplianceEngine:
    """Factory function to create ESRS compliance engine"""
    return ESRSComplianceEngine()