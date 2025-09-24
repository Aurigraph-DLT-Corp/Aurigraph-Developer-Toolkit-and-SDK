"""
Base ML Model Class
Abstract base class for all machine learning models in Sylvagraph
"""

import abc
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from ..utils.metrics import ModelMetrics
from ..utils.validation import validate_input_data


logger = logging.getLogger(__name__)


class ModelConfig(BaseModel):
    """Configuration schema for ML models"""
    name: str
    version: str
    model_type: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    input_features: List[str]
    output_features: List[str]
    target_accuracy: float = 0.98
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PredictionResult(BaseModel):
    """Standard prediction result schema"""
    prediction: Union[float, List[float], Dict[str, Any]]
    confidence: float
    uncertainty: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    model_version: str
    processing_time_ms: float


class BaseMLModel(abc.ABC):
    """
    Abstract base class for all ML models in Sylvagraph
    
    Provides standardized interface for:
    - Model training and validation
    - Prediction with confidence intervals
    - Model persistence and versioning
    - Performance monitoring
    - Uncertainty quantification
    """
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.model = None
        self.is_trained = False
        self.metrics = ModelMetrics()
        self._model_path: Optional[Path] = None
        
    @abc.abstractmethod
    def _build_model(self) -> Any:
        """Build the underlying ML model architecture"""
        pass
    
    @abc.abstractmethod 
    def _prepare_features(self, data: pd.DataFrame) -> np.ndarray:
        """Prepare input features for training/prediction"""
        pass
    
    @abc.abstractmethod
    def _train_model(self, X: np.ndarray, y: np.ndarray, **kwargs) -> None:
        """Train the model on prepared data"""
        pass
    
    @abc.abstractmethod
    def _predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Make predictions with confidence intervals"""
        pass
    
    def train(self, 
              train_data: pd.DataFrame, 
              validation_data: Optional[pd.DataFrame] = None,
              **kwargs) -> Dict[str, Any]:
        """
        Train the model with standardized workflow
        
        Args:
            train_data: Training dataset
            validation_data: Optional validation dataset
            **kwargs: Additional training parameters
            
        Returns:
            Training results and metrics
        """
        logger.info(f"Starting training for {self.config.name} v{self.config.version}")
        
        # Validate input data
        validate_input_data(train_data, self.config.input_features)
        
        # Prepare features and targets
        X_train = self._prepare_features(train_data)
        y_train = train_data[self.config.output_features].values
        
        X_val, y_val = None, None
        if validation_data is not None:
            validate_input_data(validation_data, self.config.input_features)
            X_val = self._prepare_features(validation_data)
            y_val = validation_data[self.config.output_features].values
        
        # Build model if not exists
        if self.model is None:
            self.model = self._build_model()
        
        # Train the model
        start_time = datetime.utcnow()
        self._train_model(X_train, y_train, X_val=X_val, y_val=y_val, **kwargs)
        training_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Calculate training metrics
        train_predictions, train_confidence = self._predict(X_train)
        train_metrics = self.metrics.calculate_metrics(y_train, train_predictions)
        
        val_metrics = {}
        if X_val is not None and y_val is not None:
            val_predictions, val_confidence = self._predict(X_val)
            val_metrics = self.metrics.calculate_metrics(y_val, val_predictions)
        
        self.is_trained = True
        self.config.updated_at = datetime.utcnow()
        
        results = {
            "training_time_seconds": training_time,
            "train_metrics": train_metrics,
            "validation_metrics": val_metrics,
            "model_config": self.config.dict(),
            "feature_count": X_train.shape[1],
            "training_samples": X_train.shape[0]
        }
        
        logger.info(f"Training completed. Accuracy: {train_metrics.get('accuracy', 0):.4f}")
        return results
    
    def predict(self, data: pd.DataFrame, return_confidence: bool = True) -> List[PredictionResult]:
        """
        Make predictions with confidence intervals
        
        Args:
            data: Input data for prediction
            return_confidence: Whether to include confidence scores
            
        Returns:
            List of prediction results
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        validate_input_data(data, self.config.input_features)
        
        start_time = datetime.utcnow()
        X = self._prepare_features(data)
        predictions, confidence = self._predict(X)
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        results = []
        for i, (pred, conf) in enumerate(zip(predictions, confidence)):
            result = PredictionResult(
                prediction=pred.tolist() if isinstance(pred, np.ndarray) else pred,
                confidence=float(conf) if return_confidence else 1.0,
                model_version=self.config.version,
                processing_time_ms=processing_time / len(predictions),
                metadata={
                    "row_index": i,
                    "input_features": self.config.input_features,
                    "model_name": self.config.name
                }
            )
            results.append(result)
        
        return results
    
    def evaluate(self, test_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Evaluate model performance on test data
        
        Args:
            test_data: Test dataset
            
        Returns:
            Evaluation metrics
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation")
        
        validate_input_data(test_data, self.config.input_features)
        
        X_test = self._prepare_features(test_data)
        y_test = test_data[self.config.output_features].values
        
        predictions, confidence = self._predict(X_test)
        metrics = self.metrics.calculate_metrics(y_test, predictions)
        
        # Add confidence-based metrics
        avg_confidence = np.mean(confidence)
        confidence_calibration = self.metrics.calculate_calibration(y_test, predictions, confidence)
        
        return {
            **metrics,
            "average_confidence": avg_confidence,
            "confidence_calibration": confidence_calibration,
            "test_samples": len(test_data),
            "meets_target_accuracy": metrics.get("accuracy", 0) >= self.config.target_accuracy
        }
    
    def save(self, model_path: Union[str, Path]) -> None:
        """Save model to disk"""
        model_path = Path(model_path)
        model_path.mkdir(parents=True, exist_ok=True)
        
        # Save model
        model_file = model_path / "model.pkl"
        joblib.dump(self.model, model_file)
        
        # Save configuration
        config_file = model_path / "config.json"
        with open(config_file, 'w') as f:
            json.dump(self.config.dict(), f, indent=2, default=str)
        
        # Save metadata
        metadata = {
            "is_trained": self.is_trained,
            "model_class": self.__class__.__name__,
            "saved_at": datetime.utcnow().isoformat()
        }
        metadata_file = model_path / "metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        self._model_path = model_path
        logger.info(f"Model saved to {model_path}")
    
    def load(self, model_path: Union[str, Path]) -> None:
        """Load model from disk"""
        model_path = Path(model_path)
        
        # Load model
        model_file = model_path / "model.pkl"
        if model_file.exists():
            self.model = joblib.load(model_file)
        
        # Load configuration
        config_file = model_path / "config.json"
        if config_file.exists():
            with open(config_file, 'r') as f:
                config_data = json.load(f)
            self.config = ModelConfig(**config_data)
        
        # Load metadata
        metadata_file = model_path / "metadata.json"
        if metadata_file.exists():
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            self.is_trained = metadata.get("is_trained", False)
        
        self._model_path = model_path
        logger.info(f"Model loaded from {model_path}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        if not self.is_trained:
            return {}
        
        # Default implementation - override in subclasses for model-specific logic
        if hasattr(self.model, 'feature_importances_'):
            importance = self.model.feature_importances_
            return dict(zip(self.config.input_features, importance))
        
        return {}
    
    def explain_prediction(self, data: pd.DataFrame, sample_idx: int = 0) -> Dict[str, Any]:
        """Explain individual predictions"""
        if not self.is_trained:
            raise ValueError("Model must be trained before explanation")
        
        # Basic explanation - override in subclasses for advanced explainability
        feature_importance = self.get_feature_importance()
        sample_values = data.iloc[sample_idx][self.config.input_features].to_dict()
        
        return {
            "sample_values": sample_values,
            "feature_importance": feature_importance,
            "explanation_method": "basic_feature_importance"
        }