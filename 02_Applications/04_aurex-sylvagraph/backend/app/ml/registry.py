"""
ML Model Registry
Centralized registry for managing ML model versions, deployments, and metadata
"""

import logging
import json
import pickle
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass
import hashlib
import shutil

from .models.base_model import BaseMLModel, ModelConfig
from .models.biomass_estimation import BiomassEstimationModel
from .models.change_detection import ChangeDetectionModel
from .models.carbon_sequestration import CarbonSequestrationModel

logger = logging.getLogger(__name__)


@dataclass
class ModelMetadata:
    """Metadata for registered models"""
    model_id: str
    name: str
    version: str
    model_type: str
    status: str
    accuracy: float
    created_at: datetime
    updated_at: datetime
    file_path: str
    config_hash: str
    tags: List[str]
    metrics: Dict[str, float]


class ModelRegistry:
    """
    Centralized registry for ML model management
    
    Features:
    - Model versioning and tracking
    - A/B testing support
    - Performance monitoring
    - Automated deployment
    - Model comparison and rollback
    """
    
    def __init__(self, registry_path: str = "/tmp/sylvagraph_models"):
        self.registry_path = Path(registry_path)
        self.registry_path.mkdir(parents=True, exist_ok=True)
        
        # Registry database (in production, use proper database)
        self.registry_file = self.registry_path / "registry.json"
        self.models_storage = self.registry_path / "models"
        self.models_storage.mkdir(exist_ok=True)
        
        # In-memory model cache
        self.model_cache: Dict[str, BaseMLModel] = {}
        self.metadata_cache: Dict[str, ModelMetadata] = {}
        
        # Load existing registry
        self._load_registry()
    
    def _load_registry(self):
        """Load model registry from disk"""
        if self.registry_file.exists():
            try:
                with open(self.registry_file, 'r') as f:
                    registry_data = json.load(f)
                
                for model_data in registry_data.get('models', []):
                    metadata = ModelMetadata(
                        model_id=model_data['model_id'],
                        name=model_data['name'],
                        version=model_data['version'],
                        model_type=model_data['model_type'],
                        status=model_data['status'],
                        accuracy=model_data.get('accuracy', 0.0),
                        created_at=datetime.fromisoformat(model_data['created_at']),
                        updated_at=datetime.fromisoformat(model_data['updated_at']),
                        file_path=model_data['file_path'],
                        config_hash=model_data['config_hash'],
                        tags=model_data.get('tags', []),
                        metrics=model_data.get('metrics', {})
                    )
                    self.metadata_cache[model_data['model_id']] = metadata
                
                logger.info(f"Loaded {len(self.metadata_cache)} models from registry")
                
            except Exception as e:
                logger.error(f"Failed to load model registry: {e}")
                self.metadata_cache = {}
    
    def _save_registry(self):
        """Save model registry to disk"""
        try:
            registry_data = {
                'models': [],
                'last_updated': datetime.utcnow().isoformat()
            }
            
            for metadata in self.metadata_cache.values():
                model_data = {
                    'model_id': metadata.model_id,
                    'name': metadata.name,
                    'version': metadata.version,
                    'model_type': metadata.model_type,
                    'status': metadata.status,
                    'accuracy': metadata.accuracy,
                    'created_at': metadata.created_at.isoformat(),
                    'updated_at': metadata.updated_at.isoformat(),
                    'file_path': metadata.file_path,
                    'config_hash': metadata.config_hash,
                    'tags': metadata.tags,
                    'metrics': metadata.metrics
                }
                registry_data['models'].append(model_data)
            
            with open(self.registry_file, 'w') as f:
                json.dump(registry_data, f, indent=2, default=str)
                
            logger.debug("Model registry saved to disk")
            
        except Exception as e:
            logger.error(f"Failed to save model registry: {e}")
    
    def _generate_model_id(self, name: str, version: str) -> str:
        """Generate unique model ID"""
        return f"{name}_{version}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    def _calculate_config_hash(self, config: ModelConfig) -> str:
        """Calculate hash of model configuration"""
        config_str = json.dumps(config.dict(), sort_keys=True)
        return hashlib.md5(config_str.encode()).hexdigest()
    
    def register_model(self, 
                      model: BaseMLModel,
                      tags: Optional[List[str]] = None,
                      metrics: Optional[Dict[str, float]] = None) -> str:
        """
        Register a new model in the registry
        
        Args:
            model: Trained ML model
            tags: Optional tags for categorization
            metrics: Performance metrics
            
        Returns:
            Model ID
        """
        if not model.is_trained:
            raise ValueError("Only trained models can be registered")
        
        model_id = self._generate_model_id(model.config.name, model.config.version)
        config_hash = self._calculate_config_hash(model.config)
        
        # Create model storage directory
        model_dir = self.models_storage / model_id
        model_dir.mkdir(exist_ok=True)
        
        # Save model
        model.save(model_dir)
        
        # Create metadata
        metadata = ModelMetadata(
            model_id=model_id,
            name=model.config.name,
            version=model.config.version,
            model_type=model.config.model_type,
            status="registered",
            accuracy=metrics.get('accuracy', 0.0) if metrics else 0.0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            file_path=str(model_dir),
            config_hash=config_hash,
            tags=tags or [],
            metrics=metrics or {}
        )
        
        # Store in registry
        self.metadata_cache[model_id] = metadata
        self.model_cache[model_id] = model
        
        # Save to disk
        self._save_registry()
        
        logger.info(f"Registered model {model.config.name} v{model.config.version} as {model_id}")
        return model_id
    
    def get_model(self, 
                  model_id: Optional[str] = None,
                  model_type: Optional[str] = None,
                  version: Optional[str] = "latest") -> Optional[BaseMLModel]:
        """
        Get model from registry
        
        Args:
            model_id: Specific model ID
            model_type: Model type for latest version lookup
            version: Model version ('latest' for most recent)
            
        Returns:
            Loaded model or None
        """
        target_model_id = model_id
        
        # Find model by type and version if ID not provided
        if not target_model_id and model_type:
            matching_models = [
                (mid, metadata) for mid, metadata in self.metadata_cache.items()
                if metadata.model_type == model_type and metadata.status in ["registered", "deployed"]
            ]
            
            if not matching_models:
                logger.warning(f"No models found for type {model_type}")
                return None
            
            if version == "latest":
                # Get most recent model
                matching_models.sort(key=lambda x: x[1].created_at, reverse=True)
                target_model_id = matching_models[0][0]
            else:
                # Find specific version
                version_matches = [
                    (mid, metadata) for mid, metadata in matching_models
                    if metadata.version == version
                ]
                if version_matches:
                    target_model_id = version_matches[0][0]
        
        if not target_model_id:
            logger.warning(f"Model not found: type={model_type}, version={version}")
            return None
        
        # Return from cache if available
        if target_model_id in self.model_cache:
            return self.model_cache[target_model_id]
        
        # Load model from disk
        if target_model_id not in self.metadata_cache:
            logger.error(f"Model metadata not found: {target_model_id}")
            return None
        
        metadata = self.metadata_cache[target_model_id]
        model = self._load_model_from_disk(metadata)
        
        if model:
            self.model_cache[target_model_id] = model
        
        return model
    
    def _load_model_from_disk(self, metadata: ModelMetadata) -> Optional[BaseMLModel]:
        """Load model from disk storage"""
        try:
            model_path = Path(metadata.file_path)
            
            # Load configuration
            config_file = model_path / "config.json"
            if not config_file.exists():
                logger.error(f"Model config not found: {config_file}")
                return None
            
            with open(config_file, 'r') as f:
                config_data = json.load(f)
            config = ModelConfig(**config_data)
            
            # Create model instance based on type
            if metadata.model_type == "biomass_estimation":
                model = BiomassEstimationModel(config)
            elif metadata.model_type == "change_detection":
                model = ChangeDetectionModel(config)
            elif metadata.model_type == "carbon_sequestration":
                model = CarbonSequestrationModel(config)
            else:
                logger.error(f"Unknown model type: {metadata.model_type}")
                return None
            
            # Load model weights/state
            model.load(model_path)
            
            logger.info(f"Loaded model {metadata.name} v{metadata.version}")
            return model
            
        except Exception as e:
            logger.error(f"Failed to load model {metadata.model_id}: {e}")
            return None
    
    def list_models(self, 
                   model_type: Optional[str] = None,
                   status: Optional[str] = None,
                   tags: Optional[List[str]] = None) -> List[ModelMetadata]:
        """
        List models in registry with optional filtering
        
        Args:
            model_type: Filter by model type
            status: Filter by status
            tags: Filter by tags (any match)
            
        Returns:
            List of model metadata
        """
        models = list(self.metadata_cache.values())
        
        if model_type:
            models = [m for m in models if m.model_type == model_type]
        
        if status:
            models = [m for m in models if m.status == status]
        
        if tags:
            models = [m for m in models if any(tag in m.tags for tag in tags)]
        
        # Sort by creation date (newest first)
        models.sort(key=lambda x: x.created_at, reverse=True)
        
        return models
    
    def deploy_model(self, model_id: str, deployment_target: str = "production") -> bool:
        """
        Deploy model for serving
        
        Args:
            model_id: Model to deploy
            deployment_target: Deployment environment
            
        Returns:
            Success status
        """
        if model_id not in self.metadata_cache:
            logger.error(f"Model not found: {model_id}")
            return False
        
        try:
            metadata = self.metadata_cache[model_id]
            
            # Update status
            metadata.status = "deployed"
            metadata.updated_at = datetime.utcnow()
            
            # Add deployment tag
            if deployment_target not in metadata.tags:
                metadata.tags.append(deployment_target)
            
            self._save_registry()
            
            logger.info(f"Deployed model {model_id} to {deployment_target}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to deploy model {model_id}: {e}")
            return False
    
    def retire_model(self, model_id: str) -> bool:
        """Retire a model (mark as inactive)"""
        if model_id not in self.metadata_cache:
            logger.error(f"Model not found: {model_id}")
            return False
        
        metadata = self.metadata_cache[model_id]
        metadata.status = "retired"
        metadata.updated_at = datetime.utcnow()
        
        # Remove from cache
        if model_id in self.model_cache:
            del self.model_cache[model_id]
        
        self._save_registry()
        
        logger.info(f"Retired model {model_id}")
        return True
    
    def compare_models(self, model_ids: List[str]) -> Dict[str, Any]:
        """
        Compare multiple models
        
        Args:
            model_ids: List of model IDs to compare
            
        Returns:
            Comparison results
        """
        comparison = {
            'models': [],
            'best_accuracy': None,
            'best_model_id': None,
            'metrics_comparison': {}
        }
        
        best_accuracy = 0
        best_model_id = None
        
        for model_id in model_ids:
            if model_id not in self.metadata_cache:
                logger.warning(f"Model not found for comparison: {model_id}")
                continue
            
            metadata = self.metadata_cache[model_id]
            
            model_info = {
                'model_id': model_id,
                'name': metadata.name,
                'version': metadata.version,
                'accuracy': metadata.accuracy,
                'metrics': metadata.metrics,
                'created_at': metadata.created_at.isoformat()
            }
            
            comparison['models'].append(model_info)
            
            if metadata.accuracy > best_accuracy:
                best_accuracy = metadata.accuracy
                best_model_id = model_id
        
        comparison['best_accuracy'] = best_accuracy
        comparison['best_model_id'] = best_model_id
        
        # Compare specific metrics
        if comparison['models']:
            all_metrics = set()
            for model in comparison['models']:
                all_metrics.update(model['metrics'].keys())
            
            for metric in all_metrics:
                values = []
                for model in comparison['models']:
                    if metric in model['metrics']:
                        values.append({
                            'model_id': model['model_id'],
                            'value': model['metrics'][metric]
                        })
                
                if values:
                    best_value = max(values, key=lambda x: x['value'])
                    comparison['metrics_comparison'][metric] = {
                        'values': values,
                        'best': best_value
                    }
        
        return comparison
    
    def cleanup_old_models(self, keep_versions: int = 5, days_threshold: int = 30):
        """
        Cleanup old model versions
        
        Args:
            keep_versions: Number of versions to keep per model type
            days_threshold: Remove models older than this many days
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
        
        # Group models by type and name
        model_groups = {}
        for model_id, metadata in self.metadata_cache.items():
            key = f"{metadata.model_type}_{metadata.name}"
            if key not in model_groups:
                model_groups[key] = []
            model_groups[key].append((model_id, metadata))
        
        removed_count = 0
        
        for group_models in model_groups.values():
            # Sort by creation date (newest first)
            group_models.sort(key=lambda x: x[1].created_at, reverse=True)
            
            for i, (model_id, metadata) in enumerate(group_models):
                should_remove = False
                
                # Keep deployed models
                if metadata.status == "deployed":
                    continue
                
                # Remove if beyond version limit
                if i >= keep_versions:
                    should_remove = True
                
                # Remove if older than threshold
                if metadata.created_at < cutoff_date:
                    should_remove = True
                
                if should_remove:
                    try:
                        # Remove model files
                        model_path = Path(metadata.file_path)
                        if model_path.exists():
                            shutil.rmtree(model_path)
                        
                        # Remove from registry
                        del self.metadata_cache[model_id]
                        
                        # Remove from cache
                        if model_id in self.model_cache:
                            del self.model_cache[model_id]
                        
                        removed_count += 1
                        logger.info(f"Removed old model: {model_id}")
                        
                    except Exception as e:
                        logger.error(f"Failed to remove model {model_id}: {e}")
        
        if removed_count > 0:
            self._save_registry()
            logger.info(f"Cleanup completed: removed {removed_count} models")
    
    def get_model_metrics(self, model_id: str) -> Dict[str, Any]:
        """Get detailed metrics for a model"""
        if model_id not in self.metadata_cache:
            return {}
        
        metadata = self.metadata_cache[model_id]
        
        return {
            'model_id': model_id,
            'name': metadata.name,
            'version': metadata.version,
            'model_type': metadata.model_type,
            'status': metadata.status,
            'accuracy': metadata.accuracy,
            'metrics': metadata.metrics,
            'tags': metadata.tags,
            'created_at': metadata.created_at.isoformat(),
            'updated_at': metadata.updated_at.isoformat()
        }