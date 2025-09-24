# ================================================================================
# AUREX LAUNCHPAD™ SCOPE 3 CALCULATION ENGINE
# Sub-Application #2: Advanced Scope 3 Emissions Calculation Engine
# Module ID: LAU-GHG-002-SCOPE3-ENGINE - Scope 3 Calculation Service
# Created: August 8, 2025
# ================================================================================

import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, date
from decimal import Decimal
import json
import logging
import numpy as np
import pandas as pd
from enum import Enum
import statistics

from models.scope3_models import (
    Scope3CategoryType, DataQualityLevel, CalculationMethodology,
    SupplierDataStatus, Scope3ActivityData
)

# Configure logging
logger = logging.getLogger(__name__)

class Scope3CalculationEngine:
    """
    Advanced Scope 3 Emissions Calculation Engine
    
    Implements comprehensive Scope 3 calculation methodologies based on:
    - GHG Protocol Corporate Value Chain (Scope 3) Accounting and Reporting Standard
    - Technical Guidance for Calculating Scope 3 Emissions (Version 1.0)
    - EPA Environmentally-Extended Input-Output (EEIO) models
    - DEFRA Environmental Reporting Guidelines
    - Ecoinvent lifecycle inventory database
    """
    
    def __init__(self):
        self.emission_factors = self._load_emission_factors()
        self.eeio_multipliers = self._load_eeio_multipliers()
        self.data_quality_weights = self._initialize_data_quality_weights()
        self.uncertainty_parameters = self._load_uncertainty_parameters()
        self.category_mappings = self._initialize_category_mappings()
        
    def _load_emission_factors(self) -> Dict[str, Any]:
        """Load comprehensive emission factor databases"""
        return {
            "defra": {
                # Category 1: Purchased Goods and Services
                "purchased_goods_services": {
                    "food_products": 2.89,          # kgCO2e/£
                    "textiles": 4.12,               # kgCO2e/£
                    "chemicals": 1.75,              # kgCO2e/£
                    "machinery": 0.85,              # kgCO2e/£
                    "electronics": 0.92,            # kgCO2e/£
                    "paper_products": 3.45,         # kgCO2e/£
                    "plastic_products": 2.67,       # kgCO2e/£
                    "metal_products": 1.34,         # kgCO2e/£
                },
                # Category 2: Capital Goods
                "capital_goods": {
                    "construction_equipment": 0.78, # kgCO2e/£
                    "office_equipment": 0.92,       # kgCO2e/£
                    "manufacturing_equipment": 1.15, # kgCO2e/£
                    "vehicles": 1.23,               # kgCO2e/£
                    "buildings": 0.65,              # kgCO2e/£
                },
                # Category 3: Fuel and Energy Activities
                "fuel_energy_activities": {
                    "electricity_upstream": 0.048,  # kgCO2e/kWh (WTT)
                    "natural_gas_upstream": 0.205,  # kgCO2e/kWh (WTT)
                    "diesel_upstream": 0.58,        # kgCO2e/liter (WTT)
                    "petrol_upstream": 0.59,        # kgCO2e/liter (WTT)
                },
                # Category 4: Upstream Transportation
                "upstream_transport": {
                    "road_freight_hgv": 0.852,      # kgCO2e/tonne-km
                    "rail_freight": 0.0377,         # kgCO2e/tonne-km  
                    "sea_freight": 0.0141,          # kgCO2e/tonne-km
                    "air_freight": 2.51,            # kgCO2e/tonne-km
                    "pipeline": 0.015,              # kgCO2e/tonne-km
                },
                # Category 5: Waste Generated
                "waste_generated": {
                    "landfill_food_waste": 467,     # kgCO2e/tonne
                    "landfill_paper": 540,          # kgCO2e/tonne
                    "landfill_plastic": 21,         # kgCO2e/tonne
                    "incineration_mixed": 692,      # kgCO2e/tonne
                    "recycling_paper": 21,          # kgCO2e/tonne
                    "recycling_plastic": 31,        # kgCO2e/tonne
                    "composting_organic": 43,       # kgCO2e/tonne
                },
                # Category 6: Business Travel
                "business_travel": {
                    "flights_domestic_short": 0.251, # kgCO2e/passenger-km
                    "flights_domestic_long": 0.159,  # kgCO2e/passenger-km
                    "flights_international": 0.147,  # kgCO2e/passenger-km
                    "rail_national": 0.037,          # kgCO2e/passenger-km
                    "taxi_regular": 0.204,           # kgCO2e/passenger-km
                    "hotel_nights": 10.3,            # kgCO2e/room-night
                },
                # Category 7: Employee Commuting  
                "employee_commuting": {
                    "car_average": 0.171,            # kgCO2e/passenger-km
                    "bus": 0.082,                    # kgCO2e/passenger-km
                    "rail_light": 0.037,            # kgCO2e/passenger-km
                    "underground": 0.028,           # kgCO2e/passenger-km
                    "cycling": 0.021,               # kgCO2e/passenger-km
                    "walking": 0.0,                 # kgCO2e/passenger-km
                    "working_from_home": 0.168,     # kgCO2e/day
                }
            }
        }
    
    def _load_eeio_multipliers(self) -> Dict[str, float]:
        """Load EPA EEIO spend-based multipliers"""
        return {
            # NAICS-based multipliers (kgCO2e per USD)
            "111": 1.87,    # Crop Production
            "112": 2.45,    # Animal Production
            "113": 0.89,    # Forestry and Logging
            "211": 4.23,    # Oil and Gas Extraction
            "212": 2.67,    # Mining (except Oil and Gas)
            "221": 1.92,    # Utilities
            "236": 0.45,    # Construction of Buildings
            "311": 2.89,    # Food Manufacturing
            "313": 4.12,    # Textile Mills
            "314": 3.56,    # Textile Product Mills
            "315": 2.78,    # Apparel Manufacturing
            "321": 1.89,    # Wood Product Manufacturing
            "322": 3.45,    # Paper Manufacturing
            "324": 2.67,    # Petroleum and Coal Products
            "325": 1.75,    # Chemical Manufacturing
            "326": 2.34,    # Plastics and Rubber Products
            "327": 4.67,    # Nonmetallic Mineral Product
            "331": 8.92,    # Primary Metal Manufacturing
            "332": 1.34,    # Fabricated Metal Product
            "333": 0.85,    # Machinery Manufacturing
            "334": 0.92,    # Computer and Electronic Product
            "335": 1.23,    # Electrical Equipment
            "336": 1.45,    # Transportation Equipment
            "441": 0.23,    # Motor Vehicle Dealers
            "481": 0.58,    # Air Transportation
            "482": 1.23,    # Rail Transportation
            "483": 2.45,    # Water Transportation
            "484": 0.89,    # Truck Transportation
            "511": 0.15,    # Publishing Industries
            "518": 0.34,    # Data Processing/Hosting
            "541": 0.28,    # Professional Services
            "561": 0.45,    # Administrative Support
            "722": 1.67,    # Food Services
        }
    
    def _initialize_data_quality_weights(self) -> Dict[DataQualityLevel, float]:
        """Initialize data quality scoring weights"""
        return {
            DataQualityLevel.PRIMARY: 1.0,      # Highest quality - supplier-specific
            DataQualityLevel.SECONDARY: 0.75,   # Good quality - industry averages
            DataQualityLevel.TERTIARY: 0.5,     # Moderate quality - spend-based
            DataQualityLevel.UNCERTAIN: 0.25    # Low quality - estimates
        }
    
    def _load_uncertainty_parameters(self) -> Dict[str, Dict[str, float]]:
        """Load uncertainty parameters for Monte Carlo analysis"""
        return {
            "emission_factors": {
                "primary_data": 0.05,           # ±5% uncertainty
                "secondary_data": 0.15,         # ±15% uncertainty
                "spend_based": 0.30,            # ±30% uncertainty
                "proxy_data": 0.50              # ±50% uncertainty
            },
            "activity_data": {
                "measured": 0.02,               # ±2% uncertainty
                "calculated": 0.10,             # ±10% uncertainty
                "estimated": 0.25,              # ±25% uncertainty
                "proxy": 0.40                   # ±40% uncertainty
            },
            "temporal_correlation": {
                "same_year": 1.0,               # No adjustment
                "one_year_old": 0.95,           # 5% uncertainty increase
                "two_years_old": 0.90,          # 10% uncertainty increase
                "three_plus_years": 0.80        # 20% uncertainty increase
            }
        }
    
    def _initialize_category_mappings(self) -> Dict[Scope3CategoryType, Dict[str, Any]]:
        """Initialize category-specific calculation parameters"""
        return {
            Scope3CategoryType.PURCHASED_GOODS_SERVICES: {
                "preferred_methods": ["supplier_specific", "spend_based", "average_data"],
                "data_quality_threshold": 60,   # Minimum quality score
                "materiality_threshold": 0.05,  # 5% of total Scope 3
                "default_activity_unit": "USD",
                "calculation_complexity": "high"
            },
            Scope3CategoryType.CAPITAL_GOODS: {
                "preferred_methods": ["spend_based", "supplier_specific"],
                "data_quality_threshold": 50,
                "materiality_threshold": 0.03,  # 3% of total Scope 3
                "default_activity_unit": "USD",
                "calculation_complexity": "medium"
            },
            Scope3CategoryType.BUSINESS_TRAVEL: {
                "preferred_methods": ["physical_activity", "spend_based"],
                "data_quality_threshold": 70,
                "materiality_threshold": 0.02,  # 2% of total Scope 3
                "default_activity_unit": "km",
                "calculation_complexity": "low"
            },
            Scope3CategoryType.EMPLOYEE_COMMUTING: {
                "preferred_methods": ["physical_activity", "spend_based"],
                "data_quality_threshold": 60,
                "materiality_threshold": 0.02,
                "default_activity_unit": "km",
                "calculation_complexity": "medium"
            }
            # Additional categories would be fully mapped in production
        }
    
    async def initialize_category_frameworks(
        self,
        assessment_id: str,
        selected_categories: List[Scope3CategoryType],
        organization_type: str = "corporate"
    ) -> Dict[str, Any]:
        """Initialize calculation frameworks for selected categories"""
        try:
            logger.info(f"Initializing category frameworks for assessment {assessment_id}")
            
            frameworks_initialized = []
            
            for category in selected_categories:
                category_config = self.category_mappings.get(category, {})
                
                framework = {
                    "category": category.value,
                    "preferred_methods": category_config.get("preferred_methods", ["spend_based"]),
                    "data_requirements": self._get_category_data_requirements(category),
                    "emission_factors": self._get_category_emission_factors(category),
                    "calculation_guidance": self._get_category_guidance(category),
                    "materiality_threshold": category_config.get("materiality_threshold", 0.01)
                }
                
                frameworks_initialized.append(framework)
            
            return {
                "assessment_id": assessment_id,
                "frameworks_initialized": len(frameworks_initialized),
                "categories": [cat.value for cat in selected_categories],
                "organization_type": organization_type,
                "initialization_successful": True
            }
            
        except Exception as e:
            logger.error(f"Error initializing category frameworks: {str(e)}")
            raise Exception(f"Framework initialization failed: {str(e)}")
    
    def _get_category_data_requirements(self, category: Scope3CategoryType) -> List[Dict[str, Any]]:
        """Get data requirements for specific category"""
        
        requirements_mapping = {
            Scope3CategoryType.PURCHASED_GOODS_SERVICES: [
                {"data_type": "spend_data", "description": "Annual spend by procurement category", "unit": "USD", "required": True},
                {"data_type": "supplier_data", "description": "Supplier-specific emission factors", "unit": "kgCO2e/unit", "required": False},
                {"data_type": "physical_quantities", "description": "Physical quantities purchased", "unit": "various", "required": False}
            ],
            Scope3CategoryType.BUSINESS_TRAVEL: [
                {"data_type": "flight_data", "description": "Flight distances by route type", "unit": "km", "required": True},
                {"data_type": "ground_transport", "description": "Ground transportation distances", "unit": "km", "required": True},
                {"data_type": "accommodation", "description": "Hotel nights", "unit": "nights", "required": True}
            ],
            Scope3CategoryType.EMPLOYEE_COMMUTING: [
                {"data_type": "commute_survey", "description": "Employee commuting survey data", "unit": "various", "required": True},
                {"data_type": "working_patterns", "description": "Work-from-home frequency", "unit": "days", "required": True},
                {"data_type": "office_locations", "description": "Office locations and employee counts", "unit": "count", "required": True}
            ]
        }
        
        return requirements_mapping.get(category, [])
    
    def _get_category_emission_factors(self, category: Scope3CategoryType) -> Dict[str, Any]:
        """Get relevant emission factors for category"""
        
        defra_factors = self.emission_factors.get("defra", {})
        
        category_factor_mapping = {
            Scope3CategoryType.PURCHASED_GOODS_SERVICES: defra_factors.get("purchased_goods_services", {}),
            Scope3CategoryType.CAPITAL_GOODS: defra_factors.get("capital_goods", {}),
            Scope3CategoryType.BUSINESS_TRAVEL: defra_factors.get("business_travel", {}),
            Scope3CategoryType.EMPLOYEE_COMMUTING: defra_factors.get("employee_commuting", {}),
            Scope3CategoryType.UPSTREAM_TRANSPORT_DISTRIBUTION: defra_factors.get("upstream_transport", {}),
            Scope3CategoryType.WASTE_GENERATED: defra_factors.get("waste_generated", {})
        }
        
        return category_factor_mapping.get(category, {})
    
    def _get_category_guidance(self, category: Scope3CategoryType) -> Dict[str, Any]:
        """Get calculation guidance for category"""
        
        guidance_mapping = {
            Scope3CategoryType.PURCHASED_GOODS_SERVICES: {
                "description": "Include all purchased goods and services not covered in other categories",
                "boundary": "Cradle-to-gate emissions of purchased products",
                "allocation_approach": "Economic allocation typically used",
                "common_challenges": ["Data availability", "Supplier engagement", "Double counting"],
                "best_practices": ["Prioritize high-spend categories", "Engage key suppliers", "Use hybrid approach"]
            },
            Scope3CategoryType.BUSINESS_TRAVEL: {
                "description": "Transportation of employees for business activities",
                "boundary": "Well-to-wheel emissions from business travel",
                "allocation_approach": "Direct attribution to organization",
                "common_challenges": ["Data collection", "Trip purpose classification"],
                "best_practices": ["Use travel booking system data", "Include accommodation", "Consider virtual meeting alternatives"]
            }
        }
        
        return guidance_mapping.get(category, {})
    
    async def calculate_scope3_emissions(
        self,
        assessment_id: str,
        activity_data: List[Scope3ActivityData],
        calculation_parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive Scope 3 emissions with uncertainty analysis
        
        Args:
            assessment_id: Assessment identifier
            activity_data: List of activity data records
            calculation_parameters: Calculation configuration
            
        Returns:
            Dict containing calculation results, data quality assessment, and recommendations
        """
        try:
            logger.info(f"Starting Scope 3 calculation for assessment {assessment_id}")
            
            # Initialize results structure
            results = {
                "assessment_id": assessment_id,
                "total_scope3_emissions": 0.0,
                "emissions_by_category": {},
                "emissions_by_methodology": {
                    "supplier_specific": 0.0,
                    "spend_based": 0.0,
                    "average_data": 0.0,
                    "hybrid": 0.0
                },
                "data_quality_score": 0.0,
                "uncertainty_range": {},
                "calculation_metadata": {},
                "recommendations": [],
                "data_gaps": []
            }
            
            # Group activity data by category
            category_data = {}
            for data in activity_data:
                category = data.category
                if category not in category_data:
                    category_data[category] = []
                category_data[category].append(data)
            
            # Calculate emissions for each category
            total_emissions = 0.0
            category_emissions = {}
            methodology_emissions = {method: 0.0 for method in results["emissions_by_methodology"].keys()}
            quality_scores = []
            
            for category, data_list in category_data.items():
                category_result = await self._calculate_category_emissions(
                    category, data_list, calculation_parameters
                )
                
                category_emissions[category.value] = category_result["total_emissions"]
                total_emissions += category_result["total_emissions"]
                
                # Aggregate by methodology
                for method, emissions in category_result["methodology_breakdown"].items():
                    if method in methodology_emissions:
                        methodology_emissions[method] += emissions
                
                # Collect quality scores
                quality_scores.append(category_result["data_quality_score"])
            
            # Update results
            results["total_scope3_emissions"] = round(total_emissions, 2)
            results["emissions_by_category"] = {k: round(v, 2) for k, v in category_emissions.items()}
            results["emissions_by_methodology"] = {k: round(v, 2) for k, v in methodology_emissions.items()}
            results["data_quality_score"] = round(statistics.mean(quality_scores), 1) if quality_scores else 0.0
            
            # Perform uncertainty analysis if requested
            if calculation_parameters.get("uncertainty_analysis", True):
                uncertainty_results = await self._perform_uncertainty_analysis(
                    activity_data, 
                    category_emissions,
                    calculation_parameters.get("monte_carlo_iterations", 1000)
                )
                results["uncertainty_range"] = uncertainty_results
            
            # Generate recommendations and identify gaps
            results["recommendations"] = self._generate_recommendations(
                category_emissions, methodology_emissions, quality_scores
            )
            results["data_gaps"] = self._identify_data_gaps(activity_data, category_data)
            
            # Add calculation metadata
            results["calculation_metadata"] = {
                "calculation_date": datetime.utcnow().isoformat(),
                "methodology": "GHG Protocol Corporate Value Chain Standard",
                "emission_factors_source": calculation_parameters.get("emission_factors_source", "defra"),
                "total_data_points": len(activity_data),
                "categories_calculated": len(category_data),
                "base_currency": calculation_parameters.get("base_currency", "USD"),
                "reporting_year": calculation_parameters.get("reporting_year", datetime.now().year)
            }
            
            logger.info(f"Completed Scope 3 calculation: {total_emissions:.2f} tCO2e")
            return results
            
        except Exception as e:
            logger.error(f"Error calculating Scope 3 emissions: {str(e)}")
            raise Exception(f"Scope 3 calculation failed: {str(e)}")
    
    async def _calculate_category_emissions(
        self,
        category: Scope3CategoryType,
        data_list: List[Scope3ActivityData],
        calculation_parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate emissions for a specific category"""
        
        total_emissions = 0.0
        methodology_breakdown = {
            "supplier_specific": 0.0,
            "spend_based": 0.0,
            "average_data": 0.0,
            "hybrid": 0.0
        }
        quality_scores = []
        
        for data_point in data_list:
            # Calculate emissions for this data point
            emission_result = self._calculate_single_emission(data_point, calculation_parameters)
            
            total_emissions += emission_result["emissions"]
            methodology_breakdown[emission_result["methodology"]] += emission_result["emissions"]
            quality_scores.append(emission_result["quality_score"])
        
        return {
            "category": category.value,
            "total_emissions": total_emissions,
            "methodology_breakdown": methodology_breakdown,
            "data_quality_score": statistics.mean(quality_scores) if quality_scores else 0.0,
            "data_points_count": len(data_list)
        }
    
    def _calculate_single_emission(
        self,
        data_point: Scope3ActivityData,
        calculation_parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate emissions for a single activity data point"""
        
        # Select appropriate emission factor
        emission_factor = self._select_emission_factor(data_point, calculation_parameters)
        
        # Perform calculation based on methodology
        if data_point.calculation_methodology == CalculationMethodology.SUPPLIER_SPECIFIC:
            emissions = self._calculate_supplier_specific(data_point, emission_factor)
            methodology = "supplier_specific"
            
        elif data_point.calculation_methodology == CalculationMethodology.SPEND_BASED:
            emissions = self._calculate_spend_based(data_point, emission_factor)
            methodology = "spend_based"
            
        elif data_point.calculation_methodology == CalculationMethodology.AVERAGE_DATA:
            emissions = self._calculate_average_data(data_point, emission_factor)
            methodology = "average_data"
            
        else:  # Hybrid or other
            emissions = self._calculate_hybrid(data_point, emission_factor)
            methodology = "hybrid"
        
        # Calculate data quality score
        quality_score = self._calculate_data_quality_score(data_point)
        
        return {
            "emissions": emissions,
            "methodology": methodology,
            "quality_score": quality_score,
            "emission_factor_used": emission_factor
        }
    
    def _select_emission_factor(
        self,
        data_point: Scope3ActivityData,
        calculation_parameters: Dict[str, Any]
    ) -> float:
        """Select appropriate emission factor for calculation"""
        
        # Priority order: custom factor > supplier-specific > database
        if data_point.emission_factor_value:
            return data_point.emission_factor_value
        
        # Get category-specific factors
        category_factors = self._get_category_emission_factors(data_point.category)
        
        # For spend-based calculations, use EEIO multipliers
        if data_point.calculation_methodology == CalculationMethodology.SPEND_BASED:
            # Match to NAICS code based on spend category
            spend_category = data_point.spend_category or "general"
            naics_code = self._map_spend_to_naics(spend_category)
            return self.eeio_multipliers.get(naics_code, 0.5)  # Default factor
        
        # Use category-specific factors
        activity_desc = data_point.activity_description.lower()
        for factor_key, factor_value in category_factors.items():
            if factor_key.replace("_", " ") in activity_desc:
                return factor_value
        
        # Default factor based on category
        default_factors = {
            Scope3CategoryType.PURCHASED_GOODS_SERVICES: 2.0,  # kgCO2e/USD
            Scope3CategoryType.CAPITAL_GOODS: 1.0,
            Scope3CategoryType.BUSINESS_TRAVEL: 0.2,           # kgCO2e/km
            Scope3CategoryType.EMPLOYEE_COMMUTING: 0.15,       # kgCO2e/km
        }
        
        return default_factors.get(data_point.category, 1.0)
    
    def _calculate_supplier_specific(
        self,
        data_point: Scope3ActivityData,
        emission_factor: float
    ) -> float:
        """Calculate emissions using supplier-specific data"""
        return data_point.activity_amount * emission_factor
    
    def _calculate_spend_based(
        self,
        data_point: Scope3ActivityData,
        emission_factor: float
    ) -> float:
        """Calculate emissions using spend-based approach"""
        spend_amount = data_point.spend_amount or data_point.activity_amount
        return spend_amount * emission_factor
    
    def _calculate_average_data(
        self,
        data_point: Scope3ActivityData,
        emission_factor: float
    ) -> float:
        """Calculate emissions using average data approach"""
        return data_point.activity_amount * emission_factor
    
    def _calculate_hybrid(
        self,
        data_point: Scope3ActivityData,
        emission_factor: float
    ) -> float:
        """Calculate emissions using hybrid approach"""
        # Implement hybrid logic combining multiple approaches
        base_emission = data_point.activity_amount * emission_factor
        
        # Apply adjustment factors based on data quality
        quality_multiplier = self.data_quality_weights.get(data_point.data_quality_level, 0.5)
        
        return base_emission * quality_multiplier
    
    def _calculate_data_quality_score(self, data_point: Scope3ActivityData) -> float:
        """Calculate data quality score for a data point"""
        
        score = 0.0
        
        # Base score from data quality level
        quality_scores = {
            DataQualityLevel.PRIMARY: 90,
            DataQualityLevel.SECONDARY: 70,
            DataQualityLevel.TERTIARY: 50,
            DataQualityLevel.UNCERTAIN: 30
        }
        score += quality_scores.get(data_point.data_quality_level, 30)
        
        # Adjustments for other factors
        if data_point.supplier_specific_data:
            score += 10
            
        if data_point.validated:
            score += 5
            
        if data_point.confidence_level:
            confidence_bonus = (data_point.confidence_level - 3) * 2  # Scale 1-5 to bonus
            score += confidence_bonus
        
        # Temporal adjustment
        data_age_days = (datetime.utcnow() - data_point.collection_period_end).days
        if data_age_days > 365:
            score *= 0.9  # 10% penalty for old data
        
        return min(score, 100.0)
    
    def _map_spend_to_naics(self, spend_category: str) -> str:
        """Map spend category to NAICS code for EEIO factors"""
        
        mapping = {
            "food": "311",
            "textiles": "313",
            "chemicals": "325",
            "machinery": "333",
            "electronics": "334",
            "construction": "236",
            "utilities": "221",
            "transportation": "484",
            "professional_services": "541",
            "administrative": "561"
        }
        
        spend_lower = spend_category.lower()
        for key, naics in mapping.items():
            if key in spend_lower:
                return naics
        
        return "541"  # Default to professional services
    
    async def _perform_uncertainty_analysis(
        self,
        activity_data: List[Scope3ActivityData],
        category_emissions: Dict[str, float],
        iterations: int = 1000
    ) -> Dict[str, Any]:
        """Perform Monte Carlo uncertainty analysis"""
        
        try:
            # Simulate emissions with uncertainty
            simulation_results = []
            
            for _ in range(iterations):
                simulated_total = 0.0
                
                for data_point in activity_data:
                    # Get base emission
                    base_emission = category_emissions.get(data_point.category.value, 0.0)
                    
                    # Apply uncertainty based on data quality
                    uncertainty_factor = self.uncertainty_parameters["emission_factors"].get(
                        data_point.data_quality_level.value, 0.30
                    )
                    
                    # Generate random multiplier (normal distribution)
                    multiplier = np.random.normal(1.0, uncertainty_factor)
                    multiplier = max(0.1, multiplier)  # Ensure positive
                    
                    simulated_total += base_emission * multiplier
                
                simulation_results.append(simulated_total)
            
            # Calculate statistics
            results_array = np.array(simulation_results)
            
            return {
                "mean": float(np.mean(results_array)),
                "median": float(np.median(results_array)),
                "std_dev": float(np.std(results_array)),
                "min": float(np.min(results_array)),
                "max": float(np.max(results_array)),
                "p10": float(np.percentile(results_array, 10)),
                "p90": float(np.percentile(results_array, 90)),
                "confidence_interval_95": {
                    "lower": float(np.percentile(results_array, 2.5)),
                    "upper": float(np.percentile(results_array, 97.5))
                },
                "iterations": iterations
            }
            
        except Exception as e:
            logger.error(f"Error in uncertainty analysis: {str(e)}")
            return {"error": str(e)}
    
    def _generate_recommendations(
        self,
        category_emissions: Dict[str, float],
        methodology_emissions: Dict[str, float],
        quality_scores: List[float]
    ) -> List[str]:
        """Generate recommendations based on calculation results"""
        
        recommendations = []
        
        # Identify high-emission categories
        total_emissions = sum(category_emissions.values())
        for category, emissions in category_emissions.items():
            if emissions / total_emissions > 0.20:  # >20% of total
                recommendations.append(
                    f"Focus reduction efforts on {category} - represents {emissions/total_emissions*100:.1f}% of total Scope 3 emissions"
                )
        
        # Data quality recommendations
        avg_quality = statistics.mean(quality_scores) if quality_scores else 0
        if avg_quality < 60:
            recommendations.append(
                "Improve data quality through increased supplier engagement and primary data collection"
            )
        
        # Methodology recommendations
        spend_based_percentage = methodology_emissions["spend_based"] / total_emissions * 100
        if spend_based_percentage > 70:
            recommendations.append(
                "Consider transitioning to supplier-specific data for high-impact categories to improve accuracy"
            )
        
        # General recommendations
        recommendations.extend([
            "Engage top suppliers (covering 80% of spend) for primary data collection",
            "Establish systematic data collection processes for annual reporting",
            "Consider setting science-based targets for Scope 3 emission reductions"
        ])
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def _identify_data_gaps(
        self,
        activity_data: List[Scope3ActivityData],
        category_data: Dict[Scope3CategoryType, List[Scope3ActivityData]]
    ) -> List[str]:
        """Identify key data gaps in the assessment"""
        
        gaps = []
        
        # Check for missing categories
        all_categories = set(Scope3CategoryType)
        assessed_categories = set(category_data.keys())
        missing_categories = all_categories - assessed_categories
        
        if missing_categories:
            gaps.append(
                f"Missing data for categories: {', '.join([cat.value for cat in missing_categories])}"
            )
        
        # Check for low data quality
        low_quality_count = sum(1 for data in activity_data if data.data_quality_level == DataQualityLevel.UNCERTAIN)
        if low_quality_count > len(activity_data) * 0.5:
            gaps.append(
                f"{low_quality_count} data points have uncertain quality - consider improving data sources"
            )
        
        # Check for incomplete spend coverage
        spend_data_count = sum(1 for data in activity_data if data.spend_amount)
        if spend_data_count < len(activity_data) * 0.3:
            gaps.append("Limited spend data available - consider integrating procurement systems")
        
        # Check for supplier engagement gaps
        supplier_data_count = sum(1 for data in activity_data if data.supplier_specific_data)
        if supplier_data_count < len(activity_data) * 0.2:
            gaps.append("Low supplier engagement - consider expanding supplier data collection program")
        
        return gaps


# ================================================================================
# FACTORY FUNCTIONS
# ================================================================================

def create_scope3_calculation_engine() -> Scope3CalculationEngine:
    """Factory function to create Scope 3 calculation engine"""
    return Scope3CalculationEngine()