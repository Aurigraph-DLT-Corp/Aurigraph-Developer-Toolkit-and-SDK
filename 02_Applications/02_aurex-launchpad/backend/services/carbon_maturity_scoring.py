# ================================================================================
# AUREX LAUNCHPAD™ CARBON MATURITY SCORING ENGINE
# Sub-Application #13: CMM 5-Level Scoring with Weighted KPI Calculations
# Module ID: LAU-MAT-013 - Carbon Maturity Scoring Service
# Created: August 7, 2025
# ================================================================================

from typing import Dict, List, Optional, Tuple, Any
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
import json
import math
from dataclasses import dataclass, asdict
from enum import Enum

# Import models
from models.carbon_maturity_models import (
    MaturityLevel, IndustryCategory, MaturityAssessment, 
    AssessmentResponse, AssessmentQuestion, AssessmentScoring
)

# ================================================================================
# SCORING CONFIGURATION AND CONSTANTS
# ================================================================================

class ScoringMethod(Enum):
    """Scoring calculation methods"""
    WEIGHTED_AVERAGE = "weighted_average"
    THRESHOLD_BASED = "threshold_based"
    CUMULATIVE = "cumulative"
    BEST_FIT = "best_fit"

@dataclass
class KPIDefinition:
    """Definition of a Key Performance Indicator for maturity assessment"""
    kpi_id: str
    name: str
    description: str
    weight: float  # 0.0 to 1.0
    measurement_unit: str
    maturity_level: int  # 1-5
    industry_category: str
    calculation_method: str
    threshold_values: Dict[int, float]  # Level -> threshold value
    is_binary: bool = False  # True for yes/no questions
    is_required: bool = True

@dataclass
class ScoringWeights:
    """Industry-specific scoring weights for different assessment areas"""
    governance: float = 0.20        # Leadership and governance
    strategy: float = 0.25          # Carbon strategy and planning
    risk_management: float = 0.15   # Risk identification and management
    metrics_targets: float = 0.25   # Metrics, targets, and tracking
    disclosure: float = 0.15        # Transparency and disclosure

# ================================================================================
# INDUSTRY-SPECIFIC KPI DEFINITIONS
# ================================================================================

class KPIRegistry:
    """Registry of all KPIs by industry and maturity level"""
    
    @staticmethod
    def get_manufacturing_kpis() -> List[KPIDefinition]:
        """KPIs for manufacturing industry"""
        return [
            # Level 1: Initial
            KPIDefinition(
                kpi_id="MFG_L1_001",
                name="Carbon Emissions Awareness",
                description="Organization has basic awareness of carbon emissions",
                weight=0.3,
                measurement_unit="binary",
                maturity_level=1,
                industry_category="manufacturing",
                calculation_method="binary",
                threshold_values={1: 1.0},
                is_binary=True
            ),
            KPIDefinition(
                kpi_id="MFG_L1_002",
                name="Energy Consumption Tracking",
                description="Basic energy consumption data collection",
                weight=0.4,
                measurement_unit="percentage",
                maturity_level=1,
                industry_category="manufacturing",
                calculation_method="threshold",
                threshold_values={1: 50.0, 2: 70.0, 3: 85.0, 4: 95.0, 5: 100.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L1_003",
                name="Basic Environmental Compliance",
                description="Compliance with basic environmental regulations",
                weight=0.3,
                measurement_unit="binary",
                maturity_level=1,
                industry_category="manufacturing",
                calculation_method="binary",
                threshold_values={1: 1.0},
                is_binary=True
            ),
            
            # Level 2: Managed
            KPIDefinition(
                kpi_id="MFG_L2_001",
                name="GHG Inventory Completeness",
                description="Comprehensive GHG inventory covering all scopes",
                weight=0.35,
                measurement_unit="percentage",
                maturity_level=2,
                industry_category="manufacturing",
                calculation_method="threshold",
                threshold_values={1: 30.0, 2: 60.0, 3: 80.0, 4: 90.0, 5: 95.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L2_002",
                name="Carbon Reduction Targets",
                description="Established science-based carbon reduction targets",
                weight=0.25,
                measurement_unit="binary",
                maturity_level=2,
                industry_category="manufacturing",
                calculation_method="binary",
                threshold_values={2: 1.0},
                is_binary=True
            ),
            KPIDefinition(
                kpi_id="MFG_L2_003",
                name="Energy Management System",
                description="Implementation of ISO 50001 or equivalent EMS",
                weight=0.4,
                measurement_unit="percentage",
                maturity_level=2,
                industry_category="manufacturing",
                calculation_method="threshold",
                threshold_values={1: 25.0, 2: 50.0, 3: 75.0, 4: 90.0, 5: 100.0}
            ),
            
            # Level 3: Defined
            KPIDefinition(
                kpi_id="MFG_L3_001",
                name="Carbon Management Integration",
                description="Carbon management integrated into business processes",
                weight=0.3,
                measurement_unit="score",
                maturity_level=3,
                industry_category="manufacturing",
                calculation_method="weighted",
                threshold_values={1: 2.0, 2: 3.0, 3: 4.0, 4: 4.5, 5: 5.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L3_002",
                name="Supply Chain Engagement",
                description="Engagement with suppliers on carbon management",
                weight=0.25,
                measurement_unit="percentage",
                maturity_level=3,
                industry_category="manufacturing",
                calculation_method="threshold",
                threshold_values={1: 20.0, 2: 40.0, 3: 60.0, 4: 80.0, 5: 90.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L3_003",
                name="Product Carbon Footprint",
                description="Product-level carbon footprint assessment",
                weight=0.45,
                measurement_unit="percentage",
                maturity_level=3,
                industry_category="manufacturing",
                calculation_method="threshold",
                threshold_values={1: 10.0, 2: 30.0, 3: 50.0, 4: 70.0, 5: 85.0}
            ),
            
            # Level 4: Quantitatively Managed
            KPIDefinition(
                kpi_id="MFG_L4_001",
                name="Carbon Performance Analytics",
                description="Advanced analytics for carbon performance optimization",
                weight=0.4,
                measurement_unit="score",
                maturity_level=4,
                industry_category="manufacturing",
                calculation_method="weighted",
                threshold_values={2: 2.0, 3: 3.0, 4: 4.0, 5: 5.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L4_002",
                name="Real-time Carbon Monitoring",
                description="Real-time monitoring and automated reporting",
                weight=0.35,
                measurement_unit="percentage",
                maturity_level=4,
                industry_category="manufacturing",
                calculation_method="threshold",
                threshold_values={2: 20.0, 3: 40.0, 4: 70.0, 5: 90.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L4_003",
                name="Carbon ROI Optimization",
                description="ROI-based optimization of carbon reduction investments",
                weight=0.25,
                measurement_unit="binary",
                maturity_level=4,
                industry_category="manufacturing",
                calculation_method="binary",
                threshold_values={4: 1.0, 5: 1.0},
                is_binary=True
            ),
            
            # Level 5: Optimizing
            KPIDefinition(
                kpi_id="MFG_L5_001",
                name="Innovation Integration",
                description="Integration of carbon considerations into innovation processes",
                weight=0.3,
                measurement_unit="score",
                maturity_level=5,
                industry_category="manufacturing",
                calculation_method="weighted",
                threshold_values={3: 2.0, 4: 3.0, 5: 4.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L5_002",
                name="Ecosystem Leadership",
                description="Leadership in industry carbon management ecosystem",
                weight=0.4,
                measurement_unit="percentage",
                maturity_level=5,
                industry_category="manufacturing",
                calculation_method="threshold",
                threshold_values={3: 30.0, 4: 60.0, 5: 80.0}
            ),
            KPIDefinition(
                kpi_id="MFG_L5_003",
                name="Regenerative Impact",
                description="Net positive carbon impact through regenerative practices",
                weight=0.3,
                measurement_unit="binary",
                maturity_level=5,
                industry_category="manufacturing",
                calculation_method="binary",
                threshold_values={5: 1.0},
                is_binary=True
            )
        ]
    
    @staticmethod
    def get_energy_utilities_kpis() -> List[KPIDefinition]:
        """KPIs for energy and utilities industry"""
        return [
            # Level 1: Initial
            KPIDefinition(
                kpi_id="ENU_L1_001",
                name="Emission Factor Tracking",
                description="Basic tracking of grid emission factors",
                weight=0.4,
                measurement_unit="percentage",
                maturity_level=1,
                industry_category="energy_utilities",
                calculation_method="threshold",
                threshold_values={1: 60.0, 2: 75.0, 3: 85.0, 4: 95.0, 5: 100.0}
            ),
            KPIDefinition(
                kpi_id="ENU_L1_002",
                name="Renewable Energy Portfolio",
                description="Percentage of renewable energy in portfolio",
                weight=0.6,
                measurement_unit="percentage",
                maturity_level=1,
                industry_category="energy_utilities",
                calculation_method="threshold",
                threshold_values={1: 10.0, 2: 25.0, 3: 40.0, 4: 60.0, 5: 80.0}
            ),
            
            # Additional levels would continue...
        ]
    
    @staticmethod
    def get_industry_kpis(industry: IndustryCategory) -> List[KPIDefinition]:
        """Get KPIs for specific industry"""
        industry_mapping = {
            IndustryCategory.MANUFACTURING: KPIRegistry.get_manufacturing_kpis,
            IndustryCategory.ENERGY_UTILITIES: KPIRegistry.get_energy_utilities_kpis,
            # Add other industries as needed
        }
        
        kpi_getter = industry_mapping.get(industry)
        if kpi_getter:
            return kpi_getter()
        else:
            # Return default manufacturing KPIs for unsupported industries
            return KPIRegistry.get_manufacturing_kpis()

# ================================================================================
# SCORING ENGINE IMPLEMENTATION
# ================================================================================

class CarbonMaturityScoringEngine:
    """
    Advanced scoring engine for Carbon Maturity Navigator assessments
    Implements CMM 5-level scoring with industry-specific weighted KPI calculations
    """
    
    def __init__(self):
        self.kpi_registry = KPIRegistry()
        self.scoring_weights = ScoringWeights()
        self.calculation_precision = Decimal('0.01')
    
    def calculate_assessment_score(
        self, 
        assessment_id: str,
        responses: List[Dict[str, Any]],
        industry_category: IndustryCategory,
        include_evidence_quality: bool = True
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive assessment score with detailed breakdown
        
        Args:
            assessment_id: Unique assessment identifier
            responses: List of assessment responses
            industry_category: Industry for KPI selection
            include_evidence_quality: Include evidence quality in scoring
            
        Returns:
            Comprehensive scoring results with breakdown by level and category
        """
        
        # Get industry-specific KPIs
        industry_kpis = self.kpi_registry.get_industry_kpis(industry_category)
        
        # Initialize scoring structure
        scoring_results = {
            'assessment_id': assessment_id,
            'calculation_timestamp': datetime.utcnow().isoformat(),
            'industry_category': industry_category.value,
            'total_score': 0.0,
            'max_possible_score': 500.0,  # 100 points per level
            'score_percentage': 0.0,
            'calculated_maturity_level': 1,
            'level_confidence': 0.0,
            'level_scores': {},
            'category_scores': {},
            'kpi_scores': {},
            'data_quality_metrics': {},
            'scoring_details': {}
        }
        
        # Calculate scores by maturity level (1-5)
        for level in range(1, 6):
            level_score = self._calculate_level_score(
                level, responses, industry_kpis, include_evidence_quality
            )
            scoring_results['level_scores'][f'level_{level}'] = level_score
            scoring_results['total_score'] += level_score['weighted_score']
        
        # Calculate overall score percentage
        scoring_results['score_percentage'] = (
            scoring_results['total_score'] / scoring_results['max_possible_score']
        ) * 100
        
        # Determine maturity level and confidence
        maturity_results = self._calculate_maturity_level(scoring_results['level_scores'])
        scoring_results['calculated_maturity_level'] = maturity_results['level']
        scoring_results['level_confidence'] = maturity_results['confidence']
        
        # Calculate category scores (governance, strategy, etc.)
        scoring_results['category_scores'] = self._calculate_category_scores(
            responses, industry_kpis
        )
        
        # Calculate individual KPI scores
        scoring_results['kpi_scores'] = self._calculate_kpi_scores(
            responses, industry_kpis
        )
        
        # Calculate data quality metrics
        scoring_results['data_quality_metrics'] = self._calculate_data_quality(
            responses, industry_kpis
        )
        
        # Add detailed scoring breakdown
        scoring_results['scoring_details'] = self._generate_scoring_details(
            responses, industry_kpis, scoring_results
        )
        
        return scoring_results
    
    def _calculate_level_score(
        self,
        level: int,
        responses: List[Dict[str, Any]],
        industry_kpis: List[KPIDefinition],
        include_evidence_quality: bool
    ) -> Dict[str, Any]:
        """Calculate score for a specific maturity level"""
        
        # Filter KPIs for this level
        level_kpis = [kpi for kpi in industry_kpis if kpi.maturity_level == level]
        
        if not level_kpis:
            return {
                'level': level,
                'raw_score': 0.0,
                'weighted_score': 0.0,
                'max_score': 100.0,
                'percentage': 0.0,
                'kpi_count': 0,
                'completed_kpis': 0
            }
        
        total_weight = sum(kpi.weight for kpi in level_kpis)
        weighted_score = 0.0
        completed_kpis = 0
        
        # Response lookup for faster access
        response_lookup = {r.get('question_id'): r for r in responses}
        
        for kpi in level_kpis:
            # Find matching response
            response = None
            for r in responses:
                if r.get('kpi_id') == kpi.kpi_id or r.get('question_number') == kpi.kpi_id:
                    response = r
                    break
            
            if response:
                kpi_score = self._calculate_kpi_score(kpi, response, include_evidence_quality)
                weighted_score += (kpi_score * kpi.weight / total_weight) * 100
                completed_kpis += 1
        
        return {
            'level': level,
            'raw_score': weighted_score,
            'weighted_score': weighted_score,
            'max_score': 100.0,
            'percentage': weighted_score,
            'kpi_count': len(level_kpis),
            'completed_kpis': completed_kpis
        }
    
    def _calculate_kpi_score(
        self,
        kpi: KPIDefinition,
        response: Dict[str, Any],
        include_evidence_quality: bool
    ) -> float:
        """Calculate score for individual KPI based on response"""
        
        answer_value = response.get('answer_value')
        if answer_value is None:
            return 0.0
        
        try:
            if kpi.is_binary:
                # Binary (Yes/No) questions
                if str(answer_value).lower() in ['yes', 'true', '1', 'implemented', 'available']:
                    base_score = 1.0
                else:
                    base_score = 0.0
            else:
                # Numeric or percentage values
                numeric_value = float(answer_value)
                base_score = self._calculate_threshold_score(kpi, numeric_value)
            
            # Apply evidence quality multiplier if enabled
            if include_evidence_quality:
                evidence_quality = response.get('evidence_quality', 1.0)
                base_score *= evidence_quality
            
            return min(base_score, 1.0)  # Cap at 1.0
            
        except (ValueError, TypeError):
            return 0.0
    
    def _calculate_threshold_score(self, kpi: KPIDefinition, value: float) -> float:
        """Calculate score based on threshold values"""
        
        thresholds = kpi.threshold_values
        if not thresholds:
            return 0.0
        
        # Sort thresholds by level
        sorted_thresholds = sorted(thresholds.items())
        
        # Find appropriate score based on value
        for level, threshold in sorted_thresholds:
            if value >= threshold:
                continue
            else:
                # Interpolate between thresholds if possible
                if len(sorted_thresholds) > 1:
                    prev_level = level - 1
                    if prev_level in thresholds:
                        prev_threshold = thresholds[prev_level]
                        # Linear interpolation
                        if threshold != prev_threshold:
                            interpolation = (value - prev_threshold) / (threshold - prev_threshold)
                            return max(0.0, min(1.0, (prev_level + interpolation) / 5.0))
                
                return max(0.0, (level - 1) / 5.0)
        
        # Value exceeds all thresholds
        return 1.0
    
    def _calculate_maturity_level(self, level_scores: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall maturity level based on level scores"""
        
        # CMM progression logic: Must achieve minimum threshold at each level
        current_level = 1
        confidence_scores = []
        
        for level in range(1, 6):
            level_key = f'level_{level}'
            level_data = level_scores.get(level_key, {})
            level_percentage = level_data.get('percentage', 0.0)
            
            # Require 70% to pass each level
            if level_percentage >= 70.0:
                current_level = level
                confidence_scores.append(level_percentage / 100.0)
            else:
                break
        
        # Calculate confidence based on consistency across achieved levels
        if confidence_scores:
            confidence = sum(confidence_scores) / len(confidence_scores)
        else:
            confidence = 0.0
        
        return {
            'level': current_level,
            'confidence': round(confidence, 3)
        }
    
    def _calculate_category_scores(
        self,
        responses: List[Dict[str, Any]],
        industry_kpis: List[KPIDefinition]
    ) -> Dict[str, float]:
        """Calculate scores by category (governance, strategy, etc.)"""
        
        # Map KPIs to categories based on naming patterns
        category_mapping = {
            'governance': ['governance', 'leadership', 'policy', 'oversight'],
            'strategy': ['strategy', 'planning', 'target', 'objective'],
            'risk_management': ['risk', 'assessment', 'mitigation', 'resilience'],
            'metrics_targets': ['metric', 'kpi', 'measurement', 'tracking', 'monitoring'],
            'disclosure': ['disclosure', 'reporting', 'transparency', 'communication']
        }
        
        category_scores = {}
        
        for category, keywords in category_mapping.items():
            category_kpis = []
            for kpi in industry_kpis:
                kpi_text = (kpi.name + ' ' + kpi.description).lower()
                if any(keyword in kpi_text for keyword in keywords):
                    category_kpis.append(kpi)
            
            if category_kpis:
                total_score = 0.0
                total_weight = 0.0
                
                for kpi in category_kpis:
                    # Find matching response
                    response = None
                    for r in responses:
                        if r.get('kpi_id') == kpi.kpi_id:
                            response = r
                            break
                    
                    if response:
                        kpi_score = self._calculate_kpi_score(kpi, response, True)
                        total_score += kpi_score * kpi.weight
                        total_weight += kpi.weight
                
                category_scores[category] = (
                    total_score / total_weight * 100 if total_weight > 0 else 0.0
                )
            else:
                category_scores[category] = 0.0
        
        return category_scores
    
    def _calculate_kpi_scores(
        self,
        responses: List[Dict[str, Any]],
        industry_kpis: List[KPIDefinition]
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate individual KPI scores with details"""
        
        kpi_scores = {}
        
        for kpi in industry_kpis:
            # Find matching response
            response = None
            for r in responses:
                if r.get('kpi_id') == kpi.kpi_id:
                    response = r
                    break
            
            if response:
                score = self._calculate_kpi_score(kpi, response, True)
                kpi_scores[kpi.kpi_id] = {
                    'name': kpi.name,
                    'level': kpi.maturity_level,
                    'weight': kpi.weight,
                    'score': score,
                    'percentage': score * 100,
                    'answered': True,
                    'answer_value': response.get('answer_value'),
                    'evidence_available': response.get('has_evidence', False)
                }
            else:
                kpi_scores[kpi.kpi_id] = {
                    'name': kpi.name,
                    'level': kpi.maturity_level,
                    'weight': kpi.weight,
                    'score': 0.0,
                    'percentage': 0.0,
                    'answered': False,
                    'answer_value': None,
                    'evidence_available': False
                }
        
        return kpi_scores
    
    def _calculate_data_quality(
        self,
        responses: List[Dict[str, Any]],
        industry_kpis: List[KPIDefinition]
    ) -> Dict[str, float]:
        """Calculate data quality metrics"""
        
        total_kpis = len(industry_kpis)
        answered_kpis = len([r for r in responses if r.get('answer_value') is not None])
        evidence_provided = len([r for r in responses if r.get('has_evidence', False)])
        validated_responses = len([r for r in responses if r.get('is_validated', False)])
        
        return {
            'completeness': (answered_kpis / total_kpis * 100) if total_kpis > 0 else 0.0,
            'evidence_coverage': (evidence_provided / total_kpis * 100) if total_kpis > 0 else 0.0,
            'validation_rate': (validated_responses / answered_kpis * 100) if answered_kpis > 0 else 0.0,
            'overall_quality': (
                ((answered_kpis / total_kpis) * 0.4 +
                 (evidence_provided / total_kpis) * 0.3 +
                 (validated_responses / answered_kpis if answered_kpis > 0 else 0) * 0.3) * 100
            ) if total_kpis > 0 else 0.0
        }
    
    def _generate_scoring_details(
        self,
        responses: List[Dict[str, Any]],
        industry_kpis: List[KPIDefinition],
        scoring_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate detailed scoring breakdown for transparency"""
        
        return {
            'calculation_method': 'weighted_kpi_aggregation',
            'industry_customization_applied': True,
            'evidence_quality_included': True,
            'total_kpis_evaluated': len(industry_kpis),
            'kpis_by_level': {
                f'level_{i}': len([kpi for kpi in industry_kpis if kpi.maturity_level == i])
                for i in range(1, 6)
            },
            'scoring_weights_used': asdict(self.scoring_weights),
            'threshold_method': 'progressive_achievement',
            'confidence_calculation': 'consistency_based',
            'data_quality_impact': 'evidence_multiplier',
            'algorithm_version': '1.0.0'
        }

# ================================================================================
# BENCHMARKING AND COMPARISON ALGORITHMS
# ================================================================================

class MaturityBenchmarkingEngine:
    """
    Industry benchmarking and peer comparison engine
    Provides statistical analysis and positioning insights
    """
    
    def __init__(self, scoring_engine: CarbonMaturityScoringEngine):
        self.scoring_engine = scoring_engine
    
    def calculate_industry_benchmark(
        self,
        industry_category: IndustryCategory,
        organization_size: str,
        region: str = None
    ) -> Dict[str, Any]:
        """Calculate industry benchmark statistics"""
        
        # This would typically query historical assessment data
        # For now, return mock benchmark data
        
        benchmark_data = {
            'industry': industry_category.value,
            'organization_size': organization_size,
            'region': region,
            'benchmark_date': datetime.utcnow().isoformat(),
            'sample_size': 150,  # Number of assessments in benchmark
            'statistics': {
                'mean_score': 320.5,
                'median_score': 315.0,
                'std_deviation': 45.2,
                'percentiles': {
                    'p25': 285.0,
                    'p50': 315.0,
                    'p75': 355.0,
                    'p90': 390.0,
                    'p95': 420.0
                }
            },
            'maturity_distribution': {
                'level_1': 15,  # 10%
                'level_2': 45,  # 30%
                'level_3': 60,  # 40%
                'level_4': 25,  # 16.7%
                'level_5': 5   # 3.3%
            },
            'category_benchmarks': {
                'governance': {'mean': 72.5, 'median': 70.0},
                'strategy': {'mean': 68.2, 'median': 65.0},
                'risk_management': {'mean': 58.9, 'median': 60.0},
                'metrics_targets': {'mean': 71.3, 'median': 72.0},
                'disclosure': {'mean': 64.7, 'median': 62.0}
            }
        }
        
        return benchmark_data
    
    def calculate_peer_comparison(
        self,
        assessment_score: Dict[str, Any],
        industry_benchmark: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate peer comparison and positioning"""
        
        org_total_score = assessment_score['total_score']
        benchmark_stats = industry_benchmark['statistics']
        
        # Calculate percentile rank
        percentile_rank = self._calculate_percentile_rank(
            org_total_score, benchmark_stats
        )
        
        # Determine peer group positioning
        positioning = self._determine_positioning(percentile_rank)
        
        # Calculate gaps and opportunities
        gaps_analysis = self._analyze_gaps(
            assessment_score,
            industry_benchmark
        )
        
        return {
            'overall_positioning': {
                'percentile_rank': percentile_rank,
                'positioning': positioning,
                'score_vs_mean': org_total_score - benchmark_stats['mean_score'],
                'score_vs_median': org_total_score - benchmark_stats['median_score'],
                'performance_category': self._get_performance_category(percentile_rank)
            },
            'category_comparison': self._compare_categories(
                assessment_score.get('category_scores', {}),
                industry_benchmark.get('category_benchmarks', {})
            ),
            'maturity_level_comparison': {
                'organization_level': assessment_score['calculated_maturity_level'],
                'industry_average_level': self._calculate_average_maturity_level(
                    industry_benchmark['maturity_distribution']
                )
            },
            'gaps_and_opportunities': gaps_analysis,
            'improvement_potential': self._calculate_improvement_potential(
                assessment_score, benchmark_stats
            )
        }
    
    def _calculate_percentile_rank(
        self,
        score: float,
        benchmark_stats: Dict[str, float]
    ) -> float:
        """Calculate percentile rank using normal distribution approximation"""
        
        mean = benchmark_stats['mean_score']
        std_dev = benchmark_stats['std_deviation']
        
        if std_dev == 0:
            return 50.0  # If no variation, assume median
        
        z_score = (score - mean) / std_dev
        
        # Convert z-score to percentile (approximate)
        # Using error function approximation
        percentile = 50 * (1 + math.erf(z_score / math.sqrt(2)))
        
        return max(0.0, min(100.0, percentile))
    
    def _determine_positioning(self, percentile_rank: float) -> str:
        """Determine market positioning based on percentile rank"""
        
        if percentile_rank >= 90:
            return "Industry Leader"
        elif percentile_rank >= 75:
            return "Above Average"
        elif percentile_rank >= 50:
            return "Industry Average"
        elif percentile_rank >= 25:
            return "Below Average"
        else:
            return "Improvement Needed"
    
    def _get_performance_category(self, percentile_rank: float) -> str:
        """Get performance category for reporting"""
        
        if percentile_rank >= 95:
            return "Exceptional"
        elif percentile_rank >= 85:
            return "Excellent"
        elif percentile_rank >= 70:
            return "Good"
        elif percentile_rank >= 50:
            return "Satisfactory"
        elif percentile_rank >= 30:
            return "Fair"
        else:
            return "Needs Improvement"
    
    def _compare_categories(
        self,
        org_categories: Dict[str, float],
        benchmark_categories: Dict[str, Dict[str, float]]
    ) -> Dict[str, Dict[str, float]]:
        """Compare organization categories against benchmarks"""
        
        comparison = {}
        
        for category, org_score in org_categories.items():
            if category in benchmark_categories:
                benchmark_data = benchmark_categories[category]
                comparison[category] = {
                    'organization_score': org_score,
                    'industry_mean': benchmark_data.get('mean', 0.0),
                    'industry_median': benchmark_data.get('median', 0.0),
                    'gap_vs_mean': org_score - benchmark_data.get('mean', 0.0),
                    'gap_vs_median': org_score - benchmark_data.get('median', 0.0)
                }
        
        return comparison
    
    def _calculate_average_maturity_level(
        self,
        maturity_distribution: Dict[str, int]
    ) -> float:
        """Calculate weighted average maturity level"""
        
        total_assessments = sum(maturity_distribution.values())
        if total_assessments == 0:
            return 1.0
        
        weighted_sum = 0
        for level_str, count in maturity_distribution.items():
            level = int(level_str.split('_')[1])
            weighted_sum += level * count
        
        return weighted_sum / total_assessments
    
    def _analyze_gaps(
        self,
        assessment_score: Dict[str, Any],
        industry_benchmark: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze gaps and improvement opportunities"""
        
        gaps = {
            'critical_gaps': [],
            'improvement_opportunities': [],
            'strengths': []
        }
        
        # Analyze category gaps
        org_categories = assessment_score.get('category_scores', {})
        benchmark_categories = industry_benchmark.get('category_benchmarks', {})
        
        for category, org_score in org_categories.items():
            if category in benchmark_categories:
                benchmark_mean = benchmark_categories[category].get('mean', 0.0)
                gap = org_score - benchmark_mean
                
                if gap < -20:  # 20 points below benchmark
                    gaps['critical_gaps'].append({
                        'category': category,
                        'gap': gap,
                        'priority': 'high'
                    })
                elif gap < -10:  # 10 points below benchmark
                    gaps['improvement_opportunities'].append({
                        'category': category,
                        'gap': gap,
                        'priority': 'medium'
                    })
                elif gap > 10:  # 10 points above benchmark
                    gaps['strengths'].append({
                        'category': category,
                        'advantage': gap,
                        'level': 'significant' if gap > 20 else 'moderate'
                    })
        
        return gaps
    
    def _calculate_improvement_potential(
        self,
        assessment_score: Dict[str, Any],
        benchmark_stats: Dict[str, float]
    ) -> Dict[str, float]:
        """Calculate improvement potential metrics"""
        
        current_score = assessment_score['total_score']
        top_quartile = benchmark_stats['percentiles']['p75']
        top_decile = benchmark_stats['percentiles']['p90']
        
        return {
            'points_to_top_quartile': max(0, top_quartile - current_score),
            'points_to_top_decile': max(0, top_decile - current_score),
            'potential_level_advancement': min(
                5, assessment_score['calculated_maturity_level'] + 
                int((top_quartile - current_score) / 100)
            )
        }

# ================================================================================
# EXPORT AND INITIALIZATION
# ================================================================================

def create_scoring_engine() -> CarbonMaturityScoringEngine:
    """Factory function to create scoring engine instance"""
    return CarbonMaturityScoringEngine()

def create_benchmarking_engine(scoring_engine: CarbonMaturityScoringEngine) -> MaturityBenchmarkingEngine:
    """Factory function to create benchmarking engine instance"""
    return MaturityBenchmarkingEngine(scoring_engine)

print("✅ Carbon Maturity Scoring Engine Loaded Successfully!")
print("Features:")
print("  🎯 CMM 5-Level Scoring Algorithm")
print("  🏭 Industry-Specific KPI Registry")
print("  ⚖️ Weighted Scoring with Thresholds")
print("  📊 Comprehensive Benchmarking")
print("  🔍 Data Quality Assessment")
print("  📈 Peer Comparison Analytics")
print("  💡 Gap Analysis and Opportunities")
print("  🎯 Maturity Level Confidence Scoring")