"""
Change Detection Model
Advanced ML model for detecting deforestation, forest degradation, and land use changes
Uses temporal satellite imagery analysis and multi-spectral indices
"""

import logging
from typing import Any, Dict, List, Optional, Tuple, Union
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import cv2
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import torch
import torch.nn as nn
import torch.nn.functional as F

from .base_model import BaseMLModel, ModelConfig
from ..utils.preprocessing import TemporalImagePreprocessor
from ..utils.geospatial import GeospatialAnalyzer

logger = logging.getLogger(__name__)


class TemporalConvLSTM(nn.Module):
    """
    Temporal Convolutional LSTM for time-series satellite imagery analysis
    Detects changes in forest cover over time
    """
    
    def __init__(self, 
                 input_channels: int = 10,  # Multi-spectral bands
                 hidden_channels: int = 64,
                 num_layers: int = 3,
                 image_size: Tuple[int, int] = (256, 256)):
        super().__init__()
        
        self.input_channels = input_channels
        self.hidden_channels = hidden_channels
        self.num_layers = num_layers
        self.image_size = image_size
        
        # Convolutional LSTM layers
        self.conv_lstm_layers = nn.ModuleList()
        
        # First layer: input -> hidden
        self.conv_lstm_layers.append(
            self._make_conv_lstm_cell(input_channels, hidden_channels)
        )
        
        # Subsequent layers: hidden -> hidden
        for _ in range(num_layers - 1):
            self.conv_lstm_layers.append(
                self._make_conv_lstm_cell(hidden_channels, hidden_channels)
            )
        
        # Change detection heads
        self.change_head = nn.Sequential(
            nn.Conv2d(hidden_channels, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.Conv2d(32, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.Conv2d(16, 1, kernel_size=1),  # Binary change map
            nn.Sigmoid()
        )
        
        # Change type classification head
        self.type_head = nn.Sequential(
            nn.Conv2d(hidden_channels, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.Conv2d(32, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.Conv2d(16, 5, kernel_size=1),  # 5 change types
            nn.Softmax(dim=1)
        )
        
        # Severity estimation head
        self.severity_head = nn.Sequential(
            nn.Conv2d(hidden_channels, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.Conv2d(32, 1, kernel_size=1),  # Severity score
            nn.Sigmoid()
        )
    
    def _make_conv_lstm_cell(self, input_dim: int, hidden_dim: int):
        """Create a ConvLSTM cell"""
        return ConvLSTMCell(input_dim, hidden_dim, kernel_size=3)
    
    def forward(self, x):
        """
        Forward pass through temporal ConvLSTM
        x: (batch, sequence, channels, height, width)
        """
        batch_size, seq_len = x.size(0), x.size(1)
        
        # Initialize hidden states
        h_states = []
        c_states = []
        for i in range(self.num_layers):
            h = torch.zeros(batch_size, self.hidden_channels, *self.image_size).to(x.device)
            c = torch.zeros(batch_size, self.hidden_channels, *self.image_size).to(x.device)
            h_states.append(h)
            c_states.append(c)
        
        # Process sequence
        for t in range(seq_len):
            input_t = x[:, t]  # (batch, channels, height, width)
            
            # Pass through ConvLSTM layers
            for layer_idx in range(self.num_layers):
                if layer_idx == 0:
                    h_states[layer_idx], c_states[layer_idx] = self.conv_lstm_layers[layer_idx](
                        input_t, (h_states[layer_idx], c_states[layer_idx])
                    )
                else:
                    h_states[layer_idx], c_states[layer_idx] = self.conv_lstm_layers[layer_idx](
                        h_states[layer_idx - 1], (h_states[layer_idx], c_states[layer_idx])
                    )
        
        # Final hidden state contains temporal information
        final_hidden = h_states[-1]
        
        # Generate outputs
        change_map = self.change_head(final_hidden)
        change_type = self.type_head(final_hidden)
        severity = self.severity_head(final_hidden)
        
        return {
            'change_probability': change_map,
            'change_type': change_type,
            'severity': severity,
            'features': final_hidden
        }


class ConvLSTMCell(nn.Module):
    """Convolutional LSTM Cell"""
    
    def __init__(self, input_dim, hidden_dim, kernel_size):
        super().__init__()
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        padding = kernel_size // 2
        
        self.conv = nn.Conv2d(
            input_dim + hidden_dim,
            4 * hidden_dim,
            kernel_size,
            padding=padding,
            bias=True
        )
    
    def forward(self, input_tensor, cur_state):
        h_cur, c_cur = cur_state
        
        combined = torch.cat([input_tensor, h_cur], dim=1)
        combined_conv = self.conv(combined)
        
        cc_i, cc_f, cc_o, cc_g = torch.split(combined_conv, self.hidden_dim, dim=1)
        i = torch.sigmoid(cc_i)
        f = torch.sigmoid(cc_f)
        o = torch.sigmoid(cc_o)
        g = torch.tanh(cc_g)
        
        c_next = f * c_cur + i * g
        h_next = o * torch.tanh(c_next)
        
        return h_next, c_next


class ChangeDetectionModel(BaseMLModel):
    """
    Advanced change detection model for forest monitoring
    
    Features:
    - Temporal analysis of satellite imagery
    - Multi-scale change detection
    - Change type classification (deforestation, degradation, regeneration)
    - Severity assessment
    - Anomaly detection for illegal activities
    """
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.image_preprocessor = TemporalImagePreprocessor()
        self.geospatial_analyzer = GeospatialAnalyzer()
        
        # Model components
        self.temporal_model = None
        self.anomaly_detector = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Change type mapping
        self.change_types = {
            0: 'no_change',
            1: 'deforestation', 
            2: 'degradation',
            3: 'regeneration',
            4: 'fire_damage'
        }
        
        # Spectral indices for change detection
        self.spectral_indices = [
            'ndvi', 'evi', 'ndwi', 'nbr', 'savi', 'msavi', 'ndmi'
        ]
    
    def _build_model(self) -> Dict[str, Any]:
        """Build change detection model components"""
        models = {}
        
        # Temporal ConvLSTM for change detection
        models['temporal_cnn'] = TemporalConvLSTM(
            input_channels=len(self.spectral_indices),
            hidden_channels=64,
            num_layers=3,
            image_size=(256, 256)
        ).to(self.device)
        
        # Isolation Forest for anomaly detection
        models['anomaly_detector'] = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_jobs=-1
        )
        
        return models
    
    def _prepare_features(self, data: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Prepare temporal image data and features"""
        features = {}
        
        # Process temporal image sequences
        if 'image_sequence' in data.columns:
            image_sequences = []
            for seq_data in data['image_sequence']:
                if isinstance(seq_data, str):
                    # Assume comma-separated file paths
                    image_paths = seq_data.split(',')
                else:
                    image_paths = seq_data
                
                # Load and preprocess image sequence
                sequence = self.image_preprocessor.load_temporal_sequence(
                    image_paths, target_size=(256, 256)
                )
                image_sequences.append(sequence)
            
            features['image_sequences'] = np.array(image_sequences)
        
        # Calculate spectral indices for each timestamp
        if 'spectral_data' in data.columns:
            spectral_features = []
            for spectral_data in data['spectral_data']:
                indices = self._calculate_spectral_indices(spectral_data)
                spectral_features.append(indices)
            features['spectral_indices'] = np.array(spectral_features)
        
        # Metadata features
        metadata_cols = ['elevation', 'slope', 'aspect', 'distance_to_road', 
                        'distance_to_settlement', 'protected_area']
        available_cols = [col for col in metadata_cols if col in data.columns]
        if available_cols:
            features['metadata'] = data[available_cols].fillna(0).values
        
        return features
    
    def _calculate_spectral_indices(self, spectral_data: Dict[str, np.ndarray]) -> np.ndarray:
        """Calculate spectral indices for change detection"""
        indices = []
        
        # Extract bands
        red = spectral_data.get('red', np.zeros_like(spectral_data.get('nir', [0])))
        nir = spectral_data.get('nir', np.zeros_like(red))
        green = spectral_data.get('green', np.zeros_like(red))
        blue = spectral_data.get('blue', np.zeros_like(red))
        swir1 = spectral_data.get('swir1', np.zeros_like(red))
        swir2 = spectral_data.get('swir2', np.zeros_like(red))
        
        # NDVI (Normalized Difference Vegetation Index)
        ndvi = (nir - red) / (nir + red + 1e-6)
        indices.append(ndvi)
        
        # EVI (Enhanced Vegetation Index)
        evi = 2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)
        indices.append(evi)
        
        # NDWI (Normalized Difference Water Index)
        ndwi = (green - nir) / (green + nir + 1e-6)
        indices.append(ndwi)
        
        # NBR (Normalized Burn Ratio)
        nbr = (nir - swir2) / (nir + swir2 + 1e-6)
        indices.append(nbr)
        
        # SAVI (Soil Adjusted Vegetation Index)
        L = 0.5
        savi = (1 + L) * (nir - red) / (nir + red + L)
        indices.append(savi)
        
        # MSAVI (Modified SAVI)
        msavi = (2 * nir + 1 - np.sqrt((2 * nir + 1)**2 - 8 * (nir - red))) / 2
        indices.append(msavi)
        
        # NDMI (Normalized Difference Moisture Index)
        ndmi = (nir - swir1) / (nir + swir1 + 1e-6)
        indices.append(ndmi)
        
        return np.stack(indices, axis=0)
    
    def _train_model(self, X: Dict[str, np.ndarray], y: np.ndarray,
                    X_val: Optional[Dict[str, np.ndarray]] = None,
                    y_val: Optional[np.ndarray] = None, **kwargs) -> None:
        """Train temporal change detection model"""
        
        # Train temporal ConvLSTM
        if 'image_sequences' in X:
            logger.info("Training Temporal ConvLSTM...")
            self._train_temporal_model(X, y, X_val, y_val, **kwargs)
        
        # Train anomaly detector on stable forest areas
        if 'metadata' in X:
            logger.info("Training anomaly detector...")
            stable_mask = (y == 0)  # No change areas
            if np.any(stable_mask):
                self.model['anomaly_detector'].fit(X['metadata'][stable_mask])
    
    def _train_temporal_model(self, X: Dict[str, np.ndarray], y: np.ndarray,
                             X_val: Optional[Dict[str, np.ndarray]] = None,
                             y_val: Optional[np.ndarray] = None, **kwargs) -> None:
        """Train the temporal ConvLSTM model"""
        
        # Prepare tensors
        sequences = torch.FloatTensor(X['image_sequences']).to(self.device)
        
        # Parse y for different tasks
        change_labels = torch.FloatTensor(y[:, 0]).unsqueeze(1).to(self.device)  # Binary change
        type_labels = torch.LongTensor(y[:, 1]).to(self.device)  # Change type
        severity_labels = torch.FloatTensor(y[:, 2]).unsqueeze(1).to(self.device)  # Severity
        
        # Training setup
        optimizer = torch.optim.AdamW(
            self.model['temporal_cnn'].parameters(),
            lr=kwargs.get('learning_rate', 0.001),
            weight_decay=kwargs.get('weight_decay', 0.01)
        )
        
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', factor=0.5, patience=10
        )
        
        # Loss functions
        bce_loss = nn.BCELoss()
        ce_loss = nn.CrossEntropyLoss()
        mse_loss = nn.MSELoss()
        
        # Training loop
        num_epochs = kwargs.get('epochs', 100)
        batch_size = kwargs.get('batch_size', 8)
        best_loss = float('inf')
        
        for epoch in range(num_epochs):
            self.model['temporal_cnn'].train()
            epoch_loss = 0.0
            num_batches = len(sequences) // batch_size
            
            for i in range(0, len(sequences), batch_size):
                end_idx = min(i + batch_size, len(sequences))
                batch_sequences = sequences[i:end_idx]
                batch_change = change_labels[i:end_idx]
                batch_type = type_labels[i:end_idx]
                batch_severity = severity_labels[i:end_idx]
                
                optimizer.zero_grad()
                
                # Forward pass
                outputs = self.model['temporal_cnn'](batch_sequences)
                
                # Calculate losses
                change_loss = bce_loss(outputs['change_probability'].mean(dim=(2, 3)), batch_change.squeeze())
                type_loss = ce_loss(outputs['change_type'].mean(dim=(2, 3)), batch_type)
                severity_loss = mse_loss(outputs['severity'].mean(dim=(2, 3)), batch_severity.squeeze())
                
                # Combined loss
                total_loss = change_loss + 0.5 * type_loss + 0.3 * severity_loss
                
                total_loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model['temporal_cnn'].parameters(), 1.0)
                optimizer.step()
                
                epoch_loss += total_loss.item()
            
            avg_loss = epoch_loss / num_batches
            scheduler.step(avg_loss)
            
            if avg_loss < best_loss:
                best_loss = avg_loss
            
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch}: Loss = {avg_loss:.6f}")
    
    def _predict(self, X: Dict[str, np.ndarray]) -> Tuple[np.ndarray, np.ndarray]:
        """Make change detection predictions"""
        
        if 'image_sequences' not in X:
            raise ValueError("Image sequences required for change detection")
        
        self.model['temporal_cnn'].eval()
        
        sequences = torch.FloatTensor(X['image_sequences']).to(self.device)
        predictions = []
        confidences = []
        
        batch_size = 4  # Smaller batch for inference
        
        with torch.no_grad():
            for i in range(0, len(sequences), batch_size):
                end_idx = min(i + batch_size, len(sequences))
                batch_sequences = sequences[i:end_idx]
                
                outputs = self.model['temporal_cnn'](batch_sequences)
                
                # Extract predictions
                change_prob = outputs['change_probability'].mean(dim=(2, 3))
                change_type = outputs['change_type'].mean(dim=(2, 3))
                severity = outputs['severity'].mean(dim=(2, 3))
                
                # Combine into prediction vector
                batch_preds = torch.cat([
                    change_prob,
                    change_type.argmax(dim=1, keepdim=True).float(),
                    severity
                ], dim=1)
                
                # Confidence based on probability values
                batch_conf = torch.max(change_type, dim=1)[0]
                
                predictions.append(batch_preds.cpu().numpy())
                confidences.append(batch_conf.cpu().numpy())
        
        final_predictions = np.vstack(predictions)
        final_confidences = np.hstack(confidences)
        
        # Apply anomaly detection if metadata available
        if 'metadata' in X and self.model['anomaly_detector'] is not None:
            anomaly_scores = self.model['anomaly_detector'].decision_function(X['metadata'])
            # Boost change probability for anomalous areas
            anomaly_mask = anomaly_scores < -0.1
            final_predictions[anomaly_mask, 0] = np.maximum(
                final_predictions[anomaly_mask, 0], 0.7
            )
        
        return final_predictions, final_confidences
    
    def detect_rapid_changes(self, data: pd.DataFrame, threshold: float = 0.8) -> Dict[str, Any]:
        """Detect rapid forest changes that might indicate illegal activities"""
        if not self.is_trained:
            raise ValueError("Model must be trained before change detection")
        
        X = self._prepare_features(data)
        predictions, confidences = self._predict(X)
        
        # Filter for high-confidence rapid changes
        rapid_changes = []
        for i, (pred, conf) in enumerate(zip(predictions, confidences)):
            change_prob, change_type, severity = pred[0], int(pred[1]), pred[2]
            
            if change_prob > threshold and conf > 0.7:
                change_info = {
                    'location_id': data.iloc[i].get('location_id', i),
                    'coordinates': data.iloc[i].get('coordinates', None),
                    'change_probability': float(change_prob),
                    'change_type': self.change_types.get(change_type, 'unknown'),
                    'severity': float(severity),
                    'confidence': float(conf),
                    'timestamp': datetime.utcnow().isoformat(),
                    'requires_investigation': change_type == 1 and severity > 0.6  # High-severity deforestation
                }
                rapid_changes.append(change_info)
        
        return {
            'rapid_changes': rapid_changes,
            'total_changes_detected': len(rapid_changes),
            'high_priority_alerts': len([c for c in rapid_changes if c['requires_investigation']]),
            'detection_threshold': threshold
        }
    
    def analyze_change_patterns(self, data: pd.DataFrame, time_window_days: int = 30) -> Dict[str, Any]:
        """Analyze temporal patterns in forest changes"""
        if not self.is_trained:
            raise ValueError("Model must be trained before pattern analysis")
        
        X = self._prepare_features(data)
        predictions, confidences = self._predict(X)
        
        # Group changes by time periods
        if 'timestamp' in data.columns:
            timestamps = pd.to_datetime(data['timestamp'])
            current_time = timestamps.max()
            
            patterns = {
                'recent_changes': {
                    'period': f'Last {time_window_days} days',
                    'change_count': 0,
                    'avg_severity': 0.0,
                    'dominant_type': 'no_change'
                },
                'change_velocity': {
                    'changes_per_day': 0.0,
                    'accelerating': False
                },
                'spatial_clustering': {
                    'clustered_changes': 0,
                    'cluster_centers': []
                }
            }
            
            # Recent changes analysis
            recent_mask = timestamps > (current_time - timedelta(days=time_window_days))
            if np.any(recent_mask):
                recent_preds = predictions[recent_mask]
                recent_changes = recent_preds[recent_preds[:, 0] > 0.5]
                
                if len(recent_changes) > 0:
                    patterns['recent_changes']['change_count'] = len(recent_changes)
                    patterns['recent_changes']['avg_severity'] = np.mean(recent_changes[:, 2])
                    
                    # Most common change type
                    type_counts = np.bincount(recent_changes[:, 1].astype(int))
                    dominant_type_idx = np.argmax(type_counts)
                    patterns['recent_changes']['dominant_type'] = self.change_types.get(
                        dominant_type_idx, 'unknown'
                    )
            
            # Spatial clustering analysis
            if 'coordinates' in data.columns and len(predictions) > 0:
                changed_locations = data.loc[predictions[:, 0] > 0.5, 'coordinates'].values
                if len(changed_locations) > 5:
                    # Apply DBSCAN clustering
                    coords = np.array([list(map(float, coord.split(','))) for coord in changed_locations])
                    clustering = DBSCAN(eps=0.01, min_samples=3).fit(coords)  # ~1km clustering
                    
                    patterns['spatial_clustering']['clustered_changes'] = np.sum(clustering.labels_ >= 0)
                    
                    # Find cluster centers
                    for cluster_id in np.unique(clustering.labels_):
                        if cluster_id >= 0:
                            cluster_mask = clustering.labels_ == cluster_id
                            center = np.mean(coords[cluster_mask], axis=0)
                            patterns['spatial_clustering']['cluster_centers'].append({
                                'lat': center[0],
                                'lon': center[1],
                                'size': np.sum(cluster_mask)
                            })
        
        return patterns