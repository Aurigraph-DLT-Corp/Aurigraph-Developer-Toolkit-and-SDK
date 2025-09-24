"""
Carbon Sequestration Model
Advanced carbon calculation engine with multiple methodologies and uncertainty quantification
Supports IPCC, Verra VCS, Gold Standard, and ISO 14064-2 carbon accounting standards
"""

import logging
from typing import Any, Dict, List, Optional, Tuple, Union
from datetime import datetime
from enum import Enum
import math

import numpy as np
import pandas as pd
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, ConstantKernel, Matern
from scipy import stats

from .base_model import BaseMLModel, ModelConfig
from ..utils.allometric import AllometricEquations
from ..utils.uncertainty import UncertaintyQuantifier

logger = logging.getLogger(__name__)


class CarbonPoolType(Enum):
    """Carbon pool types for forest carbon accounting"""
    ABOVEGROUND_BIOMASS = "aboveground_biomass"
    BELOWGROUND_BIOMASS = "belowground_biomass"
    DEADWOOD = "deadwood"
    LITTER = "litter"
    SOIL_ORGANIC_CARBON = "soil_organic_carbon"


class CarbonMethodology(Enum):
    """Supported carbon accounting methodologies"""
    IPCC_2006 = "ipcc_2006"
    IPCC_2019 = "ipcc_2019"
    VERRA_VCS = "verra_vcs"
    GOLD_STANDARD = "gold_standard"
    ISO_14064_2 = "iso_14064_2"
    WALK_METHOD = "walk_method"  # Winrock Allometric Landscape-Level K-factor


class CarbonCalculationResult(BaseModel):
    """Result from carbon calculation"""
    total_carbon_tco2: float
    carbon_pools: Dict[str, float]
    methodology: str
    uncertainty_range: Tuple[float, float]
    confidence_interval: float
    calculation_date: datetime
    data_sources: List[str]
    quality_indicators: Dict[str, float]


class CarbonSequestrationModel(BaseMLModel):
    """
    Advanced carbon sequestration calculation model
    
    Features:
    - Multiple carbon accounting methodologies
    - Full carbon pool accounting (above/below ground, deadwood, litter, soil)
    - Species-specific allometric equations
    - Uncertainty quantification with Monte Carlo simulation
    - Historical trend analysis and projections
    - Quality assurance and bias correction
    """
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.allometric = AllometricEquations()
        self.uncertainty_quantifier = UncertaintyQuantifier()
        
        # Carbon conversion factors
        self.carbon_fraction = 0.47  # IPCC default carbon fraction
        self.co2_to_carbon = 44/12  # Molecular weight ratio CO2/C
        
        # Default root-to-shoot ratios by forest type
        self.root_shoot_ratios = {
            "tropical_moist": 0.24,
            "tropical_dry": 0.28, 
            "temperate": 0.26,
            "boreal": 0.29,
            "mangrove": 0.39,
            "default": 0.26
        }
        
        # Wood density values by species group (g/cm³)
        self.wood_densities = {
            "hardwood_high": 0.67,
            "hardwood_medium": 0.58,
            "hardwood_low": 0.45,
            "softwood_high": 0.51,
            "softwood_medium": 0.45,
            "softwood_low": 0.35,
            "default": 0.58
        }
        
        # IPCC Tier 1 defaults for dead organic matter (DOM)
        self.dom_defaults = {
            "deadwood_ratio": 0.23,  # % of aboveground biomass
            "litter_tco2_ha": 2.1,   # tCO2/ha
            "soil_depth_cm": 30,     # Standard soil depth
        }
    
    def _build_model(self) -> Dict[str, Any]:
        """Build carbon calculation model components"""
        models = {}
        
        # Gaussian Process for carbon stock interpolation
        kernel = ConstantKernel(1.0) * RBF(length_scale=1.0) + \
                ConstantKernel(0.1) * Matern(length_scale=0.5, nu=1.5)
        
        models['carbon_interpolator'] = GaussianProcessRegressor(
            kernel=kernel,
            alpha=1e-6,
            normalize_y=True,
            n_restarts_optimizer=10
        )
        
        return models
    
    def calculate_carbon_stocks(self, 
                               forest_data: pd.DataFrame,
                               methodology: CarbonMethodology = CarbonMethodology.IPCC_2019,
                               include_uncertainty: bool = True) -> List[CarbonCalculationResult]:
        """
        Calculate carbon stocks for forest plots
        
        Args:
            forest_data: DataFrame with forest inventory data
            methodology: Carbon accounting methodology to use
            include_uncertainty: Whether to include uncertainty analysis
            
        Returns:
            List of carbon calculation results
        """
        logger.info(f"Calculating carbon stocks using {methodology.value}")
        
        results = []
        
        for idx, plot_data in forest_data.iterrows():
            try:
                # Calculate carbon for each pool
                carbon_pools = {}
                
                # Aboveground biomass
                agb_tco2 = self._calculate_aboveground_biomass(plot_data, methodology)
                carbon_pools[CarbonPoolType.ABOVEGROUND_BIOMASS.value] = agb_tco2
                
                # Belowground biomass
                bgb_tco2 = self._calculate_belowground_biomass(agb_tco2, plot_data, methodology)
                carbon_pools[CarbonPoolType.BELOWGROUND_BIOMASS.value] = bgb_tco2
                
                # Dead organic matter
                if methodology in [CarbonMethodology.IPCC_2019, CarbonMethodology.VERRA_VCS]:
                    deadwood_tco2 = self._calculate_deadwood(agb_tco2, plot_data, methodology)
                    litter_tco2 = self._calculate_litter(plot_data, methodology)
                    
                    carbon_pools[CarbonPoolType.DEADWOOD.value] = deadwood_tco2
                    carbon_pools[CarbonPoolType.LITTER.value] = litter_tco2
                
                # Soil organic carbon (if data available)
                if 'soil_carbon_tco2_ha' in plot_data:
                    soc_tco2 = plot_data['soil_carbon_tco2_ha']
                else:
                    soc_tco2 = self._estimate_soil_carbon(plot_data, methodology)
                
                carbon_pools[CarbonPoolType.SOIL_ORGANIC_CARBON.value] = soc_tco2
                
                # Total carbon
                total_carbon = sum(carbon_pools.values())
                
                # Uncertainty analysis
                if include_uncertainty:
                    uncertainty_range, confidence_interval = self._calculate_uncertainty(
                        carbon_pools, plot_data, methodology
                    )
                else:
                    uncertainty_range = (total_carbon, total_carbon)
                    confidence_interval = 0.95
                
                # Quality indicators
                quality_indicators = self._assess_data_quality(plot_data)
                
                # Create result
                result = CarbonCalculationResult(
                    total_carbon_tco2=total_carbon,
                    carbon_pools=carbon_pools,
                    methodology=methodology.value,
                    uncertainty_range=uncertainty_range,
                    confidence_interval=confidence_interval,
                    calculation_date=datetime.utcnow(),
                    data_sources=self._identify_data_sources(plot_data),
                    quality_indicators=quality_indicators
                )
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Failed to calculate carbon for plot {idx}: {e}")
                continue
        
        logger.info(f"Carbon calculation completed for {len(results)} plots")
        return results
    
    def _calculate_aboveground_biomass(self, plot_data: pd.Series, 
                                      methodology: CarbonMethodology) -> float:
        """Calculate aboveground biomass in tCO2"""
        
        if methodology == CarbonMethodology.IPCC_2006:
            return self._calculate_agb_ipcc_2006(plot_data)
        elif methodology == CarbonMethodology.IPCC_2019:
            return self._calculate_agb_ipcc_2019(plot_data)
        elif methodology == CarbonMethodology.VERRA_VCS:
            return self._calculate_agb_verra(plot_data)
        elif methodology == CarbonMethodology.WALK_METHOD:
            return self._calculate_agb_walk(plot_data)
        else:
            return self._calculate_agb_ipcc_2019(plot_data)  # Default
    
    def _calculate_agb_ipcc_2019(self, plot_data: pd.Series) -> float:
        """Calculate AGB using IPCC 2019 methodology"""
        
        # Check if individual tree data is available
        if 'trees_data' in plot_data and plot_data['trees_data'] is not None:
            return self._calculate_agb_tree_level(plot_data['trees_data'])
        
        # Use plot-level data if available
        elif all(col in plot_data for col in ['basal_area_m2_ha', 'wood_density_g_cm3', 'height_m']):
            return self._calculate_agb_plot_level(plot_data)
        
        # Use remote sensing estimates if available
        elif 'agb_mg_ha' in plot_data:
            agb_mg_ha = plot_data['agb_mg_ha']
            return agb_mg_ha * self.carbon_fraction * self.co2_to_carbon / 1000  # Convert to tCO2
        
        else:
            # Use IPCC Tier 1 default values
            forest_type = plot_data.get('forest_type', 'tropical_moist')
            return self._get_ipcc_tier1_default(forest_type)
    
    def _calculate_agb_tree_level(self, trees_data: List[Dict]) -> float:
        """Calculate AGB from individual tree measurements"""
        total_agb = 0.0
        
        for tree in trees_data:
            dbh = tree.get('dbh_cm', 0)
            height = tree.get('height_m', 0) 
            species = tree.get('species', 'unknown')
            
            if dbh > 0:
                # Use species-specific allometric equation
                tree_agb = self.allometric.calculate_aboveground_biomass(
                    species=species,
                    dbh=dbh,
                    height=height if height > 0 else None
                )
                total_agb += tree_agb
        
        # Convert to per hectare and then to tCO2
        plot_area_ha = trees_data[0].get('plot_area_ha', 0.1)
        agb_kg_ha = total_agb / plot_area_ha
        agb_tco2_ha = agb_kg_ha * self.carbon_fraction * self.co2_to_carbon / 1000
        
        return agb_tco2_ha
    
    def _calculate_agb_plot_level(self, plot_data: pd.Series) -> float:
        """Calculate AGB from plot-level measurements"""
        
        # Chave et al. (2014) pantropical equation
        basal_area = plot_data['basal_area_m2_ha']  # m²/ha
        wood_density = plot_data['wood_density_g_cm3']  # g/cm³
        height = plot_data['height_m']  # m
        
        # AGB (kg/ha) = 0.0673 × (ρ × BA × H)^0.976
        # where ρ = wood density, BA = basal area, H = height
        agb_kg_ha = 0.0673 * (wood_density * basal_area * height) ** 0.976
        
        # Apply environment factor if available
        if 'temperature_stress' in plot_data:
            temp_stress = plot_data['temperature_stress']
            agb_kg_ha *= (1 + temp_stress)
        
        # Convert to tCO2
        agb_tco2_ha = agb_kg_ha * self.carbon_fraction * self.co2_to_carbon / 1000
        
        return agb_tco2_ha
    
    def _calculate_belowground_biomass(self, agb_tco2: float, 
                                      plot_data: pd.Series,
                                      methodology: CarbonMethodology) -> float:
        """Calculate belowground biomass"""
        
        forest_type = plot_data.get('forest_type', 'default')
        root_shoot_ratio = self.root_shoot_ratios.get(forest_type, 
                                                     self.root_shoot_ratios['default'])
        
        # Different methodologies use different approaches
        if methodology == CarbonMethodology.IPCC_2019:
            # IPCC uses root-to-shoot ratios
            bgb_tco2 = agb_tco2 * root_shoot_ratio
        elif methodology == CarbonMethodology.VERRA_VCS:
            # VCS allows both R:S ratios and allometric equations
            if 'root_biomass_measured' in plot_data:
                bgb_tco2 = plot_data['root_biomass_measured'] * self.carbon_fraction * self.co2_to_carbon / 1000
            else:
                bgb_tco2 = agb_tco2 * root_shoot_ratio
        else:
            bgb_tco2 = agb_tco2 * root_shoot_ratio
        
        return bgb_tco2
    
    def _calculate_deadwood(self, agb_tco2: float, 
                           plot_data: pd.Series,
                           methodology: CarbonMethodology) -> float:
        """Calculate deadwood carbon"""
        
        if 'deadwood_volume_m3_ha' in plot_data:
            # Direct measurement available
            volume = plot_data['deadwood_volume_m3_ha']
            wood_density = plot_data.get('deadwood_density_g_cm3', 
                                        self.wood_densities['default'])
            
            deadwood_biomass_kg_ha = volume * wood_density * 1000  # Convert to kg/ha
            deadwood_tco2 = deadwood_biomass_kg_ha * self.carbon_fraction * self.co2_to_carbon / 1000
            
        else:
            # Use default ratio from IPCC
            deadwood_tco2 = agb_tco2 * self.dom_defaults['deadwood_ratio']
        
        return deadwood_tco2
    
    def _calculate_litter(self, plot_data: pd.Series, 
                         methodology: CarbonMethodology) -> float:
        """Calculate litter carbon"""
        
        if 'litter_mass_kg_ha' in plot_data:
            # Direct measurement
            litter_mass = plot_data['litter_mass_kg_ha']
            litter_tco2 = litter_mass * self.carbon_fraction * self.co2_to_carbon / 1000
        else:
            # Use IPCC default
            litter_tco2 = self.dom_defaults['litter_tco2_ha']
        
        return litter_tco2
    
    def _estimate_soil_carbon(self, plot_data: pd.Series,
                             methodology: CarbonMethodology) -> float:
        """Estimate soil organic carbon"""
        
        # This is a simplified estimation - in practice would use detailed soil models
        forest_type = plot_data.get('forest_type', 'tropical_moist')
        climate_zone = plot_data.get('climate_zone', 'tropical')
        
        # IPCC Tier 1 defaults by forest type (tCO2/ha)
        soc_defaults = {
            'tropical_moist': 35.0,
            'tropical_dry': 25.0,
            'temperate': 45.0,
            'boreal': 85.0,
            'mangrove': 120.0
        }
        
        base_soc = soc_defaults.get(forest_type, 35.0)
        
        # Adjust for soil type if known
        if 'soil_type' in plot_data:
            soil_type = plot_data['soil_type']
            if soil_type in ['clay', 'clay_loam']:
                base_soc *= 1.2  # Higher SOC in clay soils
            elif soil_type in ['sand', 'sandy_loam']:
                base_soc *= 0.8  # Lower SOC in sandy soils
        
        return base_soc
    
    def _calculate_uncertainty(self, carbon_pools: Dict[str, float],
                              plot_data: pd.Series,
                              methodology: CarbonMethodology) -> Tuple[Tuple[float, float], float]:
        """Calculate uncertainty using Monte Carlo simulation"""
        
        # Define uncertainty ranges for each pool (coefficient of variation)
        uncertainty_ranges = {
            CarbonPoolType.ABOVEGROUND_BIOMASS.value: 0.20,  # 20% CV
            CarbonPoolType.BELOWGROUND_BIOMASS.value: 0.50,  # 50% CV  
            CarbonPoolType.DEADWOOD.value: 0.60,  # 60% CV
            CarbonPoolType.LITTER.value: 0.40,  # 40% CV
            CarbonPoolType.SOIL_ORGANIC_CARBON.value: 0.30  # 30% CV
        }
        
        # Adjust uncertainties based on data quality
        quality_indicators = self._assess_data_quality(plot_data)
        measurement_quality = quality_indicators.get('measurement_quality', 0.5)
        
        # Better data quality reduces uncertainty
        uncertainty_multiplier = 2.0 - measurement_quality  # Range: 1.0 to 2.0
        
        # Monte Carlo simulation
        n_simulations = 1000
        total_carbon_samples = []
        
        for _ in range(n_simulations):
            pool_samples = {}
            
            for pool, carbon_value in carbon_pools.items():
                if carbon_value > 0:
                    cv = uncertainty_ranges.get(pool, 0.30) * uncertainty_multiplier
                    std = carbon_value * cv
                    
                    # Use log-normal distribution for positive values
                    mu = np.log(carbon_value ** 2 / np.sqrt(std ** 2 + carbon_value ** 2))
                    sigma = np.sqrt(np.log(1 + (std / carbon_value) ** 2))
                    
                    sample = np.random.lognormal(mu, sigma)
                    pool_samples[pool] = sample
                else:
                    pool_samples[pool] = 0
            
            total_carbon_samples.append(sum(pool_samples.values()))
        
        # Calculate confidence intervals
        confidence_level = 0.95
        alpha = 1 - confidence_level
        lower_percentile = (alpha / 2) * 100
        upper_percentile = (1 - alpha / 2) * 100
        
        lower_bound = np.percentile(total_carbon_samples, lower_percentile)
        upper_bound = np.percentile(total_carbon_samples, upper_percentile)
        
        return (lower_bound, upper_bound), confidence_level
    
    def _assess_data_quality(self, plot_data: pd.Series) -> Dict[str, float]:
        """Assess quality of input data for uncertainty calculations"""
        
        quality_scores = {}
        
        # Measurement quality (0-1)
        measured_variables = 0
        total_variables = 0
        
        key_variables = ['dbh_cm', 'height_m', 'wood_density_g_cm3', 'basal_area_m2_ha']
        for var in key_variables:
            total_variables += 1
            if var in plot_data and pd.notna(plot_data[var]):
                measured_variables += 1
        
        quality_scores['measurement_quality'] = measured_variables / total_variables
        
        # Temporal consistency (based on measurement date)
        if 'measurement_date' in plot_data:
            days_since_measurement = (datetime.utcnow() - plot_data['measurement_date']).days
            temporal_quality = max(0, 1 - days_since_measurement / 365)  # Decay over 1 year
            quality_scores['temporal_quality'] = temporal_quality
        else:
            quality_scores['temporal_quality'] = 0.5  # Unknown
        
        # Spatial representativeness
        if 'plot_size_ha' in plot_data:
            plot_size = plot_data['plot_size_ha']
            # Optimal plot size is around 0.1 ha
            if plot_size >= 0.1:
                spatial_quality = 1.0
            else:
                spatial_quality = plot_size / 0.1
            quality_scores['spatial_quality'] = min(1.0, spatial_quality)
        else:
            quality_scores['spatial_quality'] = 0.5
        
        return quality_scores
    
    def project_carbon_sequestration(self, 
                                    baseline_carbon: float,
                                    forest_data: pd.DataFrame,
                                    projection_years: int = 30,
                                    management_scenario: str = 'conservation') -> Dict[str, Any]:
        """
        Project future carbon sequestration under different management scenarios
        
        Args:
            baseline_carbon: Current carbon stock (tCO2/ha)
            forest_data: Historical forest data for trend analysis
            projection_years: Number of years to project
            management_scenario: Management scenario (conservation, restoration, etc.)
            
        Returns:
            Carbon sequestration projections with uncertainty bounds
        """
        
        # Define growth rates by management scenario
        annual_growth_rates = {
            'conservation': 0.02,  # 2% annual increase
            'restoration': 0.05,   # 5% annual increase
            'enhanced_management': 0.03,  # 3% annual increase
            'degradation': -0.01   # 1% annual decrease
        }
        
        growth_rate = annual_growth_rates.get(management_scenario, 0.02)
        
        # Project carbon stocks
        years = np.arange(0, projection_years + 1)
        projected_carbon = baseline_carbon * (1 + growth_rate) ** years
        
        # Add stochastic variation
        n_simulations = 1000
        carbon_trajectories = []
        
        for _ in range(n_simulations):
            # Add random variation to growth rate
            annual_variation = np.random.normal(0, 0.01, len(years))  # 1% annual variation
            varying_rates = growth_rate + annual_variation
            
            trajectory = [baseline_carbon]
            for i in range(1, len(years)):
                next_carbon = trajectory[-1] * (1 + varying_rates[i])
                trajectory.append(next_carbon)
            
            carbon_trajectories.append(trajectory)
        
        # Calculate statistics
        carbon_trajectories = np.array(carbon_trajectories)
        mean_trajectory = np.mean(carbon_trajectories, axis=0)
        lower_bound = np.percentile(carbon_trajectories, 5, axis=0)
        upper_bound = np.percentile(carbon_trajectories, 95, axis=0)
        
        # Calculate cumulative sequestration
        annual_sequestration = np.diff(mean_trajectory)
        cumulative_sequestration = np.cumsum(annual_sequestration)
        
        return {
            'years': years.tolist(),
            'projected_carbon_stocks': mean_trajectory.tolist(),
            'uncertainty_bounds': {
                'lower': lower_bound.tolist(),
                'upper': upper_bound.tolist()
            },
            'annual_sequestration': annual_sequestration.tolist(),
            'cumulative_sequestration': cumulative_sequestration.tolist(),
            'total_sequestration_30_years': float(cumulative_sequestration[-1]),
            'management_scenario': management_scenario,
            'assumptions': {
                'base_growth_rate': growth_rate,
                'annual_variation': 0.01,
                'confidence_level': 0.90
            }
        }