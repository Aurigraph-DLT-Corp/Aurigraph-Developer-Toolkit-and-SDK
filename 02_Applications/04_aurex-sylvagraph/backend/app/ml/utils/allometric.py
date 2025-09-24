"""
Allometric Equations
Species-specific biomass calculation equations for accurate carbon estimation
Supports major tropical, temperate, and boreal tree species
"""

import logging
import math
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class AllometricEquations:
    """
    Comprehensive allometric equation library for biomass estimation
    
    Includes:
    - Species-specific equations from literature
    - Regional default equations
    - Multi-species equations for mixed forests
    - Height-diameter relationships
    - Root biomass estimation
    """
    
    def __init__(self):
        self.species_equations = self._load_species_equations()
        self.regional_equations = self._load_regional_equations()
        self.height_diameter_equations = self._load_height_diameter_equations()
        
        # Default parameters
        self.default_wood_density = 0.58  # g/cm³
        self.default_height_dbh_ratio = 20  # Height = 20 * DBH for unknown species
        
    def _load_species_equations(self) -> Dict[str, Dict]:
        """Load species-specific allometric equations from literature"""
        equations = {}
        
        # Tropical species (examples from major publications)
        equations.update({
            # Central African species
            'entandrophragma_cylindricum': {  # Sapele
                'region': 'central_africa',
                'equation': 'chave_2005',
                'parameters': {'a': 0.0673, 'b': 0.976},
                'wood_density': 0.65,
                'height_equation': 'feldpausch_2012',
                'reference': 'Chave et al. 2005'
            },
            
            'terminalia_superba': {  # Limba
                'region': 'west_africa', 
                'equation': 'henry_2010',
                'parameters': {'a': 0.0509, 'b': 2.579},
                'wood_density': 0.47,
                'height_equation': 'feldpausch_2012',
                'reference': 'Henry et al. 2010'
            },
            
            # Southeast Asian species
            'dipterocarpus_alatus': {  # Yang
                'region': 'southeast_asia',
                'equation': 'chave_2014',
                'parameters': {'a': 0.0673, 'b': 0.976},
                'wood_density': 0.67,
                'height_equation': 'feldpausch_2012',
                'reference': 'Chave et al. 2014'
            },
            
            'shorea_robusta': {  # Sal
                'region': 'south_asia',
                'equation': 'brown_1989',
                'parameters': {'a': 34.4703, 'b': -8.0671, 'c': 0.6589},
                'wood_density': 0.79,
                'height_equation': 'local_height_model',
                'reference': 'Brown 1989'
            },
            
            # Latin American species
            'cecropia_peltata': {  # Trumpet tree
                'region': 'central_america',
                'equation': 'chave_2005',
                'parameters': {'a': 0.0673, 'b': 0.976},
                'wood_density': 0.35,
                'height_equation': 'feldpausch_2012',
                'reference': 'Chave et al. 2005'
            },
            
            'swietenia_macrophylla': {  # Mahogany
                'region': 'amazon',
                'equation': 'hunter_2013',
                'parameters': {'a': 0.0558, 'b': 0.993},
                'wood_density': 0.55,
                'height_equation': 'hunter_2013_h',
                'reference': 'Hunter et al. 2013'
            },
            
            # Temperate species
            'quercus_alba': {  # White oak
                'region': 'temperate_north_america',
                'equation': 'jenkins_2003',
                'parameters': {'a': 0.7346, 'b': 2.2518},
                'wood_density': 0.68,
                'height_equation': 'curtis_1967',
                'reference': 'Jenkins et al. 2003'
            },
            
            'fagus_sylvatica': {  # European beech
                'region': 'temperate_europe',
                'equation': 'zianis_2005',
                'parameters': {'a': 0.1394, 'b': 2.3124},
                'wood_density': 0.70,
                'height_equation': 'european_standard',
                'reference': 'Zianis & Mencuccini 2005'
            },
            
            # Boreal species
            'picea_abies': {  # Norway spruce
                'region': 'boreal_europe',
                'equation': 'marklund_1988',
                'parameters': {'a': -1.2063, 'b': 7.2146, 'c': 0.0493},
                'wood_density': 0.43,
                'height_equation': 'marklund_1988_h',
                'reference': 'Marklund 1988'
            },
            
            'pinus_sylvestris': {  # Scots pine
                'region': 'boreal_europe',
                'equation': 'marklund_1988',
                'parameters': {'a': -2.0571, 'b': 7.2717, 'c': 0.0539},
                'wood_density': 0.52,
                'height_equation': 'marklund_1988_h',
                'reference': 'Marklund 1988'
            },
            
            # Mangrove species
            'rhizophora_mangle': {  # Red mangrove
                'region': 'mangrove',
                'equation': 'komiyama_2005',
                'parameters': {'a': 0.1282, 'b': 2.60},
                'wood_density': 1.00,
                'height_equation': 'soares_2003',
                'reference': 'Komiyama et al. 2005'
            },
            
            'avicennia_marina': {  # Grey mangrove
                'region': 'mangrove',
                'equation': 'comley_2005',
                'parameters': {'a': 0.1848, 'b': 2.3524},
                'wood_density': 0.67,
                'height_equation': 'soares_2003',
                'reference': 'Comley & McGuinness 2005'
            }
        })
        
        return equations
    
    def _load_regional_equations(self) -> Dict[str, Dict]:
        """Load regional default equations for unknown species"""
        return {
            'pantropical': {
                'equation': 'chave_2014',
                'formula': 'exp(-2.977 + ln(ρ * D² * H))',
                'parameters': {'intercept': -2.977, 'coefficient': 1.0},
                'reference': 'Chave et al. 2014',
                'applicability': 'Mixed tropical forests'
            },
            
            'tropical_dry': {
                'equation': 'chave_2005_dry',
                'formula': 'ρ * exp(-0.667 + 1.784*ln(D) + 0.207*(ln(D))² - 0.0281*(ln(D))³)',
                'parameters': {'a': -0.667, 'b': 1.784, 'c': 0.207, 'd': -0.0281},
                'reference': 'Chave et al. 2005',
                'applicability': 'Dry tropical forests'
            },
            
            'temperate_broadleaf': {
                'equation': 'jenkins_2003_hardwood',
                'formula': 'exp(β₀ + β₁*ln(D))',
                'parameters': {'beta0': -2.4800, 'beta1': 2.4835},
                'reference': 'Jenkins et al. 2003',
                'applicability': 'Temperate hardwood forests'
            },
            
            'temperate_coniferous': {
                'equation': 'jenkins_2003_softwood', 
                'formula': 'exp(β₀ + β₁*ln(D))',
                'parameters': {'beta0': -2.5356, 'beta1': 2.4349},
                'reference': 'Jenkins et al. 2003',
                'applicability': 'Temperate coniferous forests'
            },
            
            'boreal': {
                'equation': 'ter_mikaelian_1997',
                'formula': 'a * D^b',
                'parameters': {'a': 0.1277, 'b': 2.3651},
                'reference': 'Ter-Mikaelian & Korzukhin 1997',
                'applicability': 'Boreal forests'
            },
            
            'mangrove': {
                'equation': 'komiyama_2005_general',
                'formula': '0.251 * ρ * D^2.46',
                'parameters': {'a': 0.251, 'b': 2.46},
                'reference': 'Komiyama et al. 2005',
                'applicability': 'Mangrove forests'
            }
        }
    
    def _load_height_diameter_equations(self) -> Dict[str, Dict]:
        """Load height-diameter relationship equations"""
        return {
            'feldpausch_2012': {
                'formula': 'ln(H) = a + b*ln(D) + c*ln(D)² + d*P + e*T + f*S',
                'parameters': {'a': 0.893, 'b': 0.760, 'c': -0.0340},
                'environmental_factors': True,
                'reference': 'Feldpausch et al. 2012'
            },
            
            'chave_2014_height': {
                'formula': 'ln(H) = a + b*ln(D) + c*ln(ρ)',
                'parameters': {'a': 0.893, 'b': 0.760, 'c': 0.0340},
                'reference': 'Chave et al. 2014'
            },
            
            'weibull_height': {
                'formula': 'H = a * (1 - exp(-(D/b)^c))',
                'parameters': {'a': 30, 'b': 20, 'c': 1.5},
                'reference': 'Weibull height model'
            }
        }
    
    def calculate_aboveground_biomass(self, 
                                    species: str,
                                    dbh: float, 
                                    height: Optional[float] = None,
                                    wood_density: Optional[float] = None) -> float:
        """
        Calculate aboveground biomass for a tree
        
        Args:
            species: Tree species (scientific name)
            dbh: Diameter at breast height (cm)
            height: Tree height (m), optional
            wood_density: Wood density (g/cm³), optional
            
        Returns:
            Aboveground biomass in kg
        """
        
        if dbh <= 0:
            return 0.0
        
        # Get species-specific equation if available
        species_key = species.lower().replace(' ', '_')
        
        if species_key in self.species_equations:
            equation_data = self.species_equations[species_key]
            return self._apply_species_equation(equation_data, dbh, height, wood_density)
        
        # Fall back to regional equation
        region = self._determine_region(species)
        if region in self.regional_equations:
            equation_data = self.regional_equations[region]
            return self._apply_regional_equation(equation_data, dbh, height, wood_density)
        
        # Use pantropical equation as ultimate fallback
        return self._apply_pantropical_equation(dbh, height, wood_density)
    
    def _apply_species_equation(self, equation_data: Dict, 
                               dbh: float, height: Optional[float],
                               wood_density: Optional[float]) -> float:
        """Apply species-specific allometric equation"""
        
        equation_type = equation_data['equation']
        params = equation_data['parameters']
        default_wd = equation_data.get('wood_density', self.default_wood_density)
        
        # Use provided wood density or species default
        wd = wood_density if wood_density is not None else default_wd
        
        # Estimate height if not provided
        if height is None:
            height = self._estimate_height(dbh, equation_data.get('height_equation', 'default'))
        
        # Apply equation based on type
        if equation_type == 'chave_2005' or equation_type == 'chave_2014':
            # Chave equation: AGB = a * (ρ * D² * H)^b
            biomass = params['a'] * (wd * dbh**2 * height) ** params['b']
            
        elif equation_type == 'brown_1989':
            # Brown equation: AGB = a + b*ln(D) + c*ln(D)²
            ln_d = math.log(dbh)
            biomass = params['a'] + params['b'] * ln_d + params['c'] * ln_d**2
            biomass = math.exp(biomass) / 1000  # Convert g to kg
            
        elif equation_type == 'jenkins_2003':
            # Jenkins equation: ln(biomass) = a + b*ln(D)
            ln_d = math.log(dbh)
            ln_biomass = params['a'] + params['b'] * ln_d
            biomass = math.exp(ln_biomass)
            
        elif equation_type == 'marklund_1988':
            # Marklund equation: ln(biomass) = a + b*ln(D) + c*ln(D)²
            ln_d = math.log(dbh)
            ln_biomass = params['a'] + params['b'] * ln_d + params['c'] * ln_d**2
            biomass = math.exp(ln_biomass)
            
        elif equation_type == 'komiyama_2005':
            # Komiyama equation: AGB = a * D^b
            biomass = params['a'] * dbh**params['b']
            
        else:
            # Default to simple power equation
            biomass = params.get('a', 0.1) * dbh**params.get('b', 2.5)
        
        return max(0, biomass)  # Ensure non-negative
    
    def _apply_regional_equation(self, equation_data: Dict,
                                dbh: float, height: Optional[float],
                                wood_density: Optional[float]) -> float:
        """Apply regional default equation"""
        
        equation_type = equation_data['equation']
        params = equation_data['parameters']
        
        wd = wood_density if wood_density is not None else self.default_wood_density
        
        if height is None:
            height = self._estimate_height(dbh, 'default')
        
        if equation_type == 'chave_2014':
            # Pantropical equation: AGB = exp(-2.977 + ln(ρ * D² * H))
            biomass = math.exp(params['intercept'] + math.log(wd * dbh**2 * height))
            
        elif equation_type == 'chave_2005_dry':
            # Dry forest equation
            ln_d = math.log(dbh)
            biomass = wd * math.exp(params['a'] + params['b']*ln_d + 
                                  params['c']*ln_d**2 + params['d']*ln_d**3)
            
        elif 'jenkins' in equation_type:
            # Jenkins equations
            ln_d = math.log(dbh)
            ln_biomass = params['beta0'] + params['beta1'] * ln_d
            biomass = math.exp(ln_biomass)
            
        elif equation_type == 'ter_mikaelian_1997':
            # Boreal equation: AGB = a * D^b
            biomass = params['a'] * dbh**params['b']
            
        elif equation_type == 'komiyama_2005_general':
            # General mangrove equation: AGB = 0.251 * ρ * D^2.46
            biomass = params['a'] * wd * dbh**params['b']
            
        else:
            biomass = 0.1 * dbh**2.5  # Simple fallback
        
        return max(0, biomass)
    
    def _apply_pantropical_equation(self, dbh: float, height: Optional[float], 
                                   wood_density: Optional[float]) -> float:
        """Apply Chave et al. 2014 pantropical equation as final fallback"""
        
        wd = wood_density if wood_density is not None else self.default_wood_density
        
        if height is None:
            height = self._estimate_height(dbh, 'default')
        
        # AGB = exp(-2.977 + ln(ρ * D² * H))
        biomass = math.exp(-2.977 + math.log(wd * dbh**2 * height))
        
        return max(0, biomass)
    
    def _estimate_height(self, dbh: float, height_equation: str) -> float:
        """Estimate tree height from DBH"""
        
        if height_equation == 'feldpausch_2012':
            # Feldpausch et al. 2012 pantropical height model
            ln_h = 0.893 + 0.760 * math.log(dbh) - 0.0340 * math.log(dbh)**2
            height = math.exp(ln_h)
            
        elif height_equation == 'chave_2014_height':
            # Simplified height model from Chave et al. 2014
            ln_h = 0.893 + 0.760 * math.log(dbh)
            height = math.exp(ln_h)
            
        elif height_equation == 'weibull_height':
            # Weibull height model
            height = 30 * (1 - math.exp(-(dbh/20)**1.5))
            
        else:
            # Simple linear relationship
            height = self.default_height_dbh_ratio * dbh / 100  # Convert cm to m
        
        return max(0.5, height)  # Minimum height of 0.5m
    
    def _determine_region(self, species: str) -> str:
        """Determine biogeographical region from species name"""
        
        # This is simplified - in practice would use taxonomic databases
        species_lower = species.lower()
        
        if any(genus in species_lower for genus in ['dipterocarpus', 'shorea', 'dryobalanops']):
            return 'tropical_moist'
        elif any(genus in species_lower for genus in ['quercus', 'fagus', 'acer', 'fraxinus']):
            return 'temperate_broadleaf'  
        elif any(genus in species_lower for genus in ['pinus', 'picea', 'abies', 'larix']):
            if any(indicator in species_lower for indicator in ['sylvestris', 'abies']):
                return 'boreal'
            else:
                return 'temperate_coniferous'
        elif any(genus in species_lower for genus in ['rhizophora', 'avicennia', 'bruguiera']):
            return 'mangrove'
        elif any(indicator in species_lower for indicator in ['tropical', 'amazon', 'congo']):
            return 'pantropical'
        else:
            return 'pantropical'  # Default
    
    def calculate_belowground_biomass(self, aboveground_biomass: float,
                                     species: str, dbh: float,
                                     forest_type: str = 'tropical_moist') -> float:
        """
        Calculate belowground (root) biomass
        
        Args:
            aboveground_biomass: AGB in kg
            species: Tree species
            dbh: Diameter at breast height (cm)
            forest_type: Forest ecosystem type
            
        Returns:
            Belowground biomass in kg
        """
        
        # Root-to-shoot ratios by forest type (IPCC defaults)
        root_shoot_ratios = {
            'tropical_moist': 0.24,
            'tropical_dry': 0.28,
            'temperate_broadleaf': 0.26,
            'temperate_coniferous': 0.29,
            'boreal': 0.30,
            'mangrove': 0.39
        }
        
        # Use species-specific ratio if available
        species_key = species.lower().replace(' ', '_')
        if species_key in self.species_equations:
            equation_data = self.species_equations[species_key]
            if 'root_shoot_ratio' in equation_data:
                ratio = equation_data['root_shoot_ratio']
                return aboveground_biomass * ratio
        
        # Use forest type default
        ratio = root_shoot_ratios.get(forest_type, 0.26)
        
        # Apply size-dependent correction for large trees
        if dbh > 50:  # Large trees often have lower root-to-shoot ratios
            ratio *= 0.9
        
        return aboveground_biomass * ratio
    
    def calculate_total_tree_biomass(self, species: str, dbh: float,
                                    height: Optional[float] = None,
                                    wood_density: Optional[float] = None,
                                    forest_type: str = 'tropical_moist') -> Dict[str, float]:
        """
        Calculate total tree biomass (above + belowground)
        
        Returns:
            Dictionary with biomass components in kg
        """
        
        agb = self.calculate_aboveground_biomass(species, dbh, height, wood_density)
        bgb = self.calculate_belowground_biomass(agb, species, dbh, forest_type)
        
        return {
            'aboveground_biomass_kg': agb,
            'belowground_biomass_kg': bgb,
            'total_biomass_kg': agb + bgb,
            'carbon_content_kg': (agb + bgb) * 0.47,  # IPCC carbon fraction
            'co2_equivalent_kg': (agb + bgb) * 0.47 * 44/12  # Convert C to CO2
        }
    
    def validate_equation_applicability(self, species: str, dbh: float,
                                      height: Optional[float] = None) -> Dict[str, Any]:
        """
        Validate if the selected equation is appropriate for the given measurements
        
        Returns:
            Validation results with warnings and recommendations
        """
        
        validation_result = {
            'is_valid': True,
            'warnings': [],
            'recommendations': [],
            'confidence_level': 'high'
        }
        
        # Check DBH range
        if dbh < 5:
            validation_result['warnings'].append('DBH below typical range (5+ cm)')
            validation_result['confidence_level'] = 'low'
        elif dbh > 200:
            validation_result['warnings'].append('DBH above typical range (<200 cm)')
            validation_result['confidence_level'] = 'medium'
        
        # Check height if provided
        if height is not None:
            expected_height = self._estimate_height(dbh, 'default')
            height_ratio = height / expected_height
            
            if height_ratio < 0.5 or height_ratio > 2.0:
                validation_result['warnings'].append('Height-DBH ratio unusual')
                validation_result['confidence_level'] = 'medium'
        
        # Check species equation availability
        species_key = species.lower().replace(' ', '_')
        if species_key not in self.species_equations:
            validation_result['recommendations'].append('Consider using species-specific equation if available')
            if validation_result['confidence_level'] == 'high':
                validation_result['confidence_level'] = 'medium'
        
        return validation_result