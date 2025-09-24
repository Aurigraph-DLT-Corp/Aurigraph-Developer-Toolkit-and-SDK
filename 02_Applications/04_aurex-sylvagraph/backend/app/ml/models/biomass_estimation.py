"""
Biomass Estimation Model
Advanced ML model for accurate forest biomass estimation using multi-modal data
Target: 98%+ accuracy for carbon credit calculations
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import cross_val_score
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

from .base_model import BaseMLModel, ModelConfig
from ..utils.preprocessing import ImagePreprocessor, SpectralPreprocessor
from ..utils.allometric import AllometricEquations

logger = logging.getLogger(__name__)


class BiomassEnsembleNet(nn.Module):
    """
    Neural network component of the biomass estimation ensemble
    Processes multi-modal inputs: satellite imagery, LiDAR, climate data
    """
    
    def __init__(self, 
                 image_channels: int = 10,  # Multi-spectral bands
                 climate_features: int = 12,  # Climate variables
                 lidar_features: int = 8,   # LiDAR metrics
                 hidden_dim: int = 512):
        super().__init__()
        
        # Image processing branch (for satellite/drone imagery)
        self.image_conv = nn.Sequential(
            nn.Conv2d(image_channels, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),
            
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2),
            
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4)),
        )
        
        # Feature fusion network
        image_feature_dim = 256 * 4 * 4
        total_input_dim = image_feature_dim + climate_features + lidar_features
        
        self.fusion_network = nn.Sequential(
            nn.Linear(total_input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.BatchNorm1d(hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(hidden_dim // 2, hidden_dim // 4),
            nn.BatchNorm1d(hidden_dim // 4),
            nn.ReLU(),
            
            nn.Linear(hidden_dim // 4, 2)  # Biomass estimate + uncertainty
        )
        
    def forward(self, image_data, climate_data, lidar_data):
        # Process image data
        image_features = self.image_conv(image_data)
        image_features = image_features.view(image_features.size(0), -1)
        
        # Concatenate all features
        combined_features = torch.cat([image_features, climate_data, lidar_data], dim=1)
        
        # Generate biomass prediction and uncertainty estimate
        output = self.fusion_network(combined_features)
        biomass_pred = output[:, 0]
        uncertainty = torch.sigmoid(output[:, 1])  # Uncertainty in [0,1]
        
        return biomass_pred, uncertainty


class BiomassEstimationModel(BaseMLModel):
    """
    Advanced biomass estimation model using ensemble methods
    
    Combines:
    - Deep learning for multi-modal data fusion
    - Random Forest for tabular data
    - Gradient Boosting for non-linear patterns
    - Allometric equations for validation
    - Uncertainty quantification
    """
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.image_preprocessor = ImagePreprocessor()
        self.spectral_preprocessor = SpectralPreprocessor()
        self.allometric = AllometricEquations()
        self.scaler = RobustScaler()
        
        # Model components
        self.neural_net = None
        self.random_forest = None
        self.gradient_boosting = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Feature groups for different model components
        self.tabular_features = [
            'canopy_height', 'canopy_cover', 'tree_density', 'dbh_mean', 'dbh_std',
            'elevation', 'slope', 'aspect', 'precipitation', 'temperature', 
            'soil_type', 'forest_age', 'species_diversity'
        ]
        
        self.spectral_features = [
            'ndvi', 'evi', 'ndwi', 'savi', 'red_edge', 'nir', 'swir1', 'swir2',
            'blue', 'green', 'red', 'coastal_aerosol'
        ]
        
        self.lidar_features = [
            'height_p95', 'height_p75', 'height_p50', 'height_mean', 
            'canopy_relief_ratio', 'cover_fraction', 'gap_fraction', 'lai_estimate'
        ]
    
    def _build_model(self) -> Dict[str, Any]:
        """Build ensemble model components"""
        models = {}
        
        # Neural network for multi-modal fusion
        models['neural_net'] = BiomassEnsembleNet(
            image_channels=len(self.spectral_features),
            climate_features=5,  # Subset of tabular features
            lidar_features=len(self.lidar_features)
        ).to(self.device)
        
        # Random Forest for tabular data
        models['random_forest'] = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        # Gradient Boosting for non-linear patterns
        models['gradient_boosting'] = GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=8,
            subsample=0.8,
            random_state=42
        )
        
        return models
    
    def _prepare_features(self, data: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Prepare different feature types for ensemble models"""
        features = {}
        
        # Tabular features
        tabular_cols = [col for col in self.tabular_features if col in data.columns]
        if tabular_cols:
            tabular_data = data[tabular_cols].fillna(data[tabular_cols].median())
            features['tabular'] = self.scaler.fit_transform(tabular_data)
        
        # Spectral/satellite features  
        spectral_cols = [col for col in self.spectral_features if col in data.columns]
        if spectral_cols:
            spectral_data = data[spectral_cols].fillna(0)
            features['spectral'] = self.spectral_preprocessor.process(spectral_data.values)
        
        # LiDAR features
        lidar_cols = [col for col in self.lidar_features if col in data.columns]
        if lidar_cols:
            lidar_data = data[lidar_cols].fillna(0)
            features['lidar'] = lidar_data.values
        
        # Image data (if available)
        if 'image_path' in data.columns:
            image_paths = data['image_path'].values
            features['images'] = self.image_preprocessor.load_batch(image_paths)
        
        return features
    
    def _train_model(self, X: Dict[str, np.ndarray], y: np.ndarray, 
                    X_val: Optional[Dict[str, np.ndarray]] = None,
                    y_val: Optional[np.ndarray] = None, **kwargs) -> None:
        """Train ensemble model components"""
        
        # Train Random Forest on tabular features
        if 'tabular' in X:
            logger.info("Training Random Forest on tabular features...")
            self.model['random_forest'].fit(X['tabular'], y.ravel())
            
            # Cross-validation score
            cv_scores = cross_val_score(
                self.model['random_forest'], X['tabular'], y.ravel(), cv=5, scoring='r2'
            )
            logger.info(f"Random Forest CV R² Score: {np.mean(cv_scores):.4f} ± {np.std(cv_scores):.4f}")
        
        # Train Gradient Boosting
        if 'tabular' in X:
            logger.info("Training Gradient Boosting...")
            self.model['gradient_boosting'].fit(X['tabular'], y.ravel())
        
        # Train Neural Network (if multi-modal data available)
        if all(key in X for key in ['spectral', 'lidar']) and len(X['spectral']) > 0:
            logger.info("Training Neural Network for multi-modal fusion...")
            self._train_neural_network(X, y, X_val, y_val, **kwargs)
    
    def _train_neural_network(self, X: Dict[str, np.ndarray], y: np.ndarray,
                             X_val: Optional[Dict[str, np.ndarray]] = None,
                             y_val: Optional[np.ndarray] = None, **kwargs) -> None:
        """Train the neural network component"""
        
        # Prepare data for PyTorch
        spectral_tensor = torch.FloatTensor(X['spectral']).to(self.device)
        climate_tensor = torch.FloatTensor(X['tabular'][:, :5]).to(self.device)  # First 5 features
        lidar_tensor = torch.FloatTensor(X['lidar']).to(self.device)
        target_tensor = torch.FloatTensor(y).to(self.device)
        
        # Create dataset and dataloader
        dataset = TensorDataset(spectral_tensor, climate_tensor, lidar_tensor, target_tensor)
        dataloader = DataLoader(dataset, batch_size=kwargs.get('batch_size', 32), shuffle=True)
        
        # Training setup
        criterion = nn.MSELoss()
        optimizer = optim.AdamW(self.model['neural_net'].parameters(), 
                               lr=kwargs.get('learning_rate', 0.001),
                               weight_decay=kwargs.get('weight_decay', 0.01))
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
        
        # Training loop
        num_epochs = kwargs.get('epochs', 100)
        best_loss = float('inf')
        patience_counter = 0
        
        for epoch in range(num_epochs):
            self.model['neural_net'].train()
            epoch_loss = 0.0
            
            for spectral_batch, climate_batch, lidar_batch, target_batch in dataloader:
                optimizer.zero_grad()
                
                pred_biomass, pred_uncertainty = self.model['neural_net'](
                    spectral_batch, climate_batch, lidar_batch
                )
                
                # Loss combines biomass prediction and uncertainty calibration
                mse_loss = criterion(pred_biomass, target_batch)
                uncertainty_loss = torch.mean(pred_uncertainty)  # Regularize uncertainty
                total_loss = mse_loss + 0.1 * uncertainty_loss
                
                total_loss.backward()
                optimizer.step()
                epoch_loss += total_loss.item()
            
            avg_loss = epoch_loss / len(dataloader)
            scheduler.step(avg_loss)
            
            # Early stopping
            if avg_loss < best_loss:
                best_loss = avg_loss
                patience_counter = 0
            else:
                patience_counter += 1
                
            if patience_counter >= kwargs.get('patience', 20):
                logger.info(f"Early stopping at epoch {epoch}")
                break
                
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch}: Loss = {avg_loss:.6f}")
    
    def _predict(self, X: Dict[str, np.ndarray]) -> Tuple[np.ndarray, np.ndarray]:
        """Make ensemble predictions with uncertainty quantification"""
        predictions = []
        uncertainties = []
        
        # Random Forest predictions
        if 'tabular' in X and self.model['random_forest'] is not None:
            rf_pred = self.model['random_forest'].predict(X['tabular'])
            # Estimate uncertainty from tree variance
            tree_predictions = np.array([tree.predict(X['tabular']) for tree in self.model['random_forest'].estimators_])
            rf_uncertainty = np.std(tree_predictions, axis=0)
            predictions.append(rf_pred)
            uncertainties.append(rf_uncertainty)
        
        # Gradient Boosting predictions
        if 'tabular' in X and self.model['gradient_boosting'] is not None:
            gb_pred = self.model['gradient_boosting'].predict(X['tabular'])
            # Estimate uncertainty from staged predictions
            staged_preds = np.array(list(self.model['gradient_boosting'].staged_predict(X['tabular'])))
            gb_uncertainty = np.std(staged_preds[-10:], axis=0)  # Last 10 stages
            predictions.append(gb_pred)
            uncertainties.append(gb_uncertainty)
        
        # Neural Network predictions
        if (all(key in X for key in ['spectral', 'lidar']) and 
            self.model['neural_net'] is not None and len(X['spectral']) > 0):
            
            self.model['neural_net'].eval()
            with torch.no_grad():
                spectral_tensor = torch.FloatTensor(X['spectral']).to(self.device)
                climate_tensor = torch.FloatTensor(X['tabular'][:, :5]).to(self.device)
                lidar_tensor = torch.FloatTensor(X['lidar']).to(self.device)
                
                nn_pred, nn_uncertainty = self.model['neural_net'](
                    spectral_tensor, climate_tensor, lidar_tensor
                )
                
                predictions.append(nn_pred.cpu().numpy())
                uncertainties.append(nn_uncertainty.cpu().numpy())
        
        # Ensemble combination with uncertainty-weighted averaging
        if len(predictions) > 1:
            # Inverse uncertainty weighting
            weights = [1.0 / (unc + 1e-6) for unc in uncertainties]
            weight_sum = np.sum(weights, axis=0)
            
            final_pred = np.sum([w * p for w, p in zip(weights, predictions)], axis=0) / weight_sum
            final_uncertainty = np.sqrt(np.sum([w * u**2 for w, u in zip(weights, uncertainties)], axis=0) / weight_sum)
        elif len(predictions) == 1:
            final_pred = predictions[0]
            final_uncertainty = uncertainties[0]
        else:
            raise ValueError("No valid predictions generated")
        
        # Apply allometric validation and correction
        if 'species' in X and 'dbh_mean' in X:
            allometric_pred = self.allometric.predict_biomass(
                species=X.get('species', ['unknown'] * len(final_pred)),
                dbh=X.get('dbh_mean', np.zeros(len(final_pred))),
                height=X.get('canopy_height', np.zeros(len(final_pred)))
            )
            
            # Blend with allometric if significant difference
            pred_diff = np.abs(final_pred - allometric_pred) / (allometric_pred + 1e-6)
            correction_weight = np.clip(pred_diff, 0, 0.3)  # Max 30% correction
            
            final_pred = (1 - correction_weight) * final_pred + correction_weight * allometric_pred
        
        return final_pred, final_uncertainty
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get combined feature importance from ensemble components"""
        importance = {}
        
        # Random Forest importance
        if self.model['random_forest'] is not None:
            rf_importance = self.model['random_forest'].feature_importances_
            for i, feature in enumerate(self.tabular_features):
                if i < len(rf_importance):
                    importance[f"rf_{feature}"] = rf_importance[i]
        
        # Gradient Boosting importance
        if self.model['gradient_boosting'] is not None:
            gb_importance = self.model['gradient_boosting'].feature_importances_
            for i, feature in enumerate(self.tabular_features):
                if i < len(gb_importance):
                    importance[f"gb_{feature}"] = gb_importance[i]
        
        return importance
    
    def calibrate_uncertainty(self, validation_data: pd.DataFrame) -> Dict[str, Any]:
        """Calibrate uncertainty estimates using validation data"""
        if not self.is_trained:
            raise ValueError("Model must be trained before uncertainty calibration")
        
        X_val = self._prepare_features(validation_data)
        y_val = validation_data[self.config.output_features].values
        
        predictions, uncertainties = self._predict(X_val)
        
        # Calculate calibration metrics
        abs_errors = np.abs(predictions - y_val.ravel())
        
        # Bin by uncertainty and check if error correlates with uncertainty
        uncertainty_bins = np.percentile(uncertainties, [25, 50, 75])
        calibration_results = {}
        
        for i, threshold in enumerate([0] + list(uncertainty_bins) + [np.inf]):
            if i == len(uncertainty_bins):
                break
                
            next_threshold = uncertainty_bins[i] if i < len(uncertainty_bins) else np.inf
            mask = (uncertainties >= threshold) & (uncertainties < next_threshold)
            
            if np.sum(mask) > 0:
                calibration_results[f"bin_{i}"] = {
                    "uncertainty_range": [threshold, next_threshold],
                    "mean_error": np.mean(abs_errors[mask]),
                    "mean_uncertainty": np.mean(uncertainties[mask]),
                    "sample_count": np.sum(mask)
                }
        
        return calibration_results