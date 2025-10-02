"""
Model Performance Metrics
Comprehensive metrics calculation for ML model evaluation
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, classification_report
)
from scipy.stats import pearsonr


class ModelMetrics:
    """
    Comprehensive model performance metrics calculator
    Supports both regression and classification tasks
    """
    
    def calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, 
                         task_type: str = "auto") -> Dict[str, float]:
        """
        Calculate appropriate metrics based on task type
        
        Args:
            y_true: True values
            y_pred: Predicted values
            task_type: 'regression', 'classification', or 'auto'
            
        Returns:
            Dictionary of metrics
        """
        if task_type == "auto":
            task_type = self._detect_task_type(y_true)
        
        if task_type == "regression":
            return self._calculate_regression_metrics(y_true, y_pred)
        else:
            return self._calculate_classification_metrics(y_true, y_pred)
    
    def _detect_task_type(self, y_true: np.ndarray) -> str:
        """Automatically detect if task is regression or classification"""
        unique_values = np.unique(y_true)
        
        # If all values are integers and limited unique values, likely classification
        if len(unique_values) <= 20 and all(isinstance(val, (int, np.integer)) for val in unique_values):
            return "classification"
        else:
            return "regression"
    
    def _calculate_regression_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate regression metrics"""
        metrics = {}
        
        # Basic regression metrics
        metrics['mse'] = mean_squared_error(y_true, y_pred)
        metrics['rmse'] = np.sqrt(metrics['mse'])
        metrics['mae'] = mean_absolute_error(y_true, y_pred)
        metrics['r2'] = r2_score(y_true, y_pred)
        
        # Mean Absolute Percentage Error
        non_zero_mask = y_true != 0
        if np.any(non_zero_mask):
            metrics['mape'] = np.mean(np.abs((y_true[non_zero_mask] - y_pred[non_zero_mask]) / y_true[non_zero_mask])) * 100
        else:
            metrics['mape'] = float('inf')
        
        # Pearson correlation
        correlation, _ = pearsonr(y_true.flatten(), y_pred.flatten())
        metrics['correlation'] = correlation if not np.isnan(correlation) else 0.0
        
        # Bias (systematic error)
        metrics['bias'] = np.mean(y_pred - y_true)
        
        # Normalized RMSE
        y_range = np.max(y_true) - np.min(y_true)
        if y_range > 0:
            metrics['nrmse'] = metrics['rmse'] / y_range
        else:
            metrics['nrmse'] = 0.0
        
        return metrics
    
    def _calculate_classification_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate classification metrics"""
        metrics = {}
        
        # Convert to integer if needed
        if y_pred.dtype != int:
            y_pred = np.round(y_pred).astype(int)
        
        # Basic classification metrics
        metrics['accuracy'] = accuracy_score(y_true, y_pred)
        
        # Handle multi-class vs binary
        unique_classes = np.unique(np.concatenate([y_true, y_pred]))
        average = 'binary' if len(unique_classes) <= 2 else 'weighted'
        
        metrics['precision'] = precision_score(y_true, y_pred, average=average, zero_division=0)
        metrics['recall'] = recall_score(y_true, y_pred, average=average, zero_division=0)
        metrics['f1'] = f1_score(y_true, y_pred, average=average, zero_division=0)
        
        return metrics
    
    def calculate_calibration(self, y_true: np.ndarray, y_pred: np.ndarray, 
                            confidence: np.ndarray, n_bins: int = 10) -> Dict[str, float]:
        """
        Calculate calibration metrics for uncertainty quantification
        
        Args:
            y_true: True values
            y_pred: Predicted values
            confidence: Prediction confidence scores
            n_bins: Number of bins for calibration curve
            
        Returns:
            Calibration metrics
        """
        # Sort by confidence
        sort_indices = np.argsort(confidence)
        confidence_sorted = confidence[sort_indices]
        y_true_sorted = y_true[sort_indices]
        y_pred_sorted = y_pred[sort_indices]
        
        # Create bins
        bin_boundaries = np.linspace(0, 1, n_bins + 1)
        bin_lowers = bin_boundaries[:-1]
        bin_uppers = bin_boundaries[1:]
        
        calibration_metrics = {
            'expected_calibration_error': 0.0,
            'maximum_calibration_error': 0.0,
            'calibration_curve': []
        }
        
        total_samples = len(confidence)
        ece = 0.0
        mce = 0.0
        
        for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
            # Find samples in this bin
            in_bin = (confidence_sorted > bin_lower) & (confidence_sorted <= bin_upper)
            prop_in_bin = in_bin.mean()
            
            if prop_in_bin > 0:
                # Calculate accuracy in bin
                accuracy_in_bin = np.mean(np.abs(y_pred_sorted[in_bin] - y_true_sorted[in_bin]) < 0.1)  # Within 10% for regression
                avg_confidence_in_bin = confidence_sorted[in_bin].mean()
                
                # Update metrics
                calibration_error = abs(avg_confidence_in_bin - accuracy_in_bin)
                ece += prop_in_bin * calibration_error
                mce = max(mce, calibration_error)
                
                calibration_metrics['calibration_curve'].append({
                    'bin_lower': bin_lower,
                    'bin_upper': bin_upper,
                    'accuracy': accuracy_in_bin,
                    'confidence': avg_confidence_in_bin,
                    'count': np.sum(in_bin)
                })
        
        calibration_metrics['expected_calibration_error'] = ece
        calibration_metrics['maximum_calibration_error'] = mce
        
        return calibration_metrics
    
    def calculate_feature_importance_metrics(self, feature_importance: Dict[str, float]) -> Dict[str, Any]:
        """Calculate metrics for feature importance analysis"""
        if not feature_importance:
            return {}
        
        importance_values = list(feature_importance.values())
        feature_names = list(feature_importance.keys())
        
        metrics = {
            'total_importance': sum(importance_values),
            'mean_importance': np.mean(importance_values),
            'std_importance': np.std(importance_values),
            'max_importance': max(importance_values),
            'min_importance': min(importance_values),
            'top_features': []
        }
        
        # Sort features by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        # Get top 10 features
        metrics['top_features'] = [
            {'feature': name, 'importance': importance}
            for name, importance in sorted_features[:10]
        ]
        
        # Calculate cumulative importance
        cumulative_importance = 0
        for i, (name, importance) in enumerate(sorted_features):
            cumulative_importance += importance
            if cumulative_importance >= 0.8 * metrics['total_importance']:
                metrics['features_for_80_percent'] = i + 1
                break
        
        return metrics
    
    def calculate_error_analysis(self, y_true: np.ndarray, y_pred: np.ndarray, 
                               feature_data: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """Perform detailed error analysis"""
        errors = y_pred - y_true
        abs_errors = np.abs(errors)
        
        analysis = {
            'error_statistics': {
                'mean_error': np.mean(errors),
                'median_error': np.median(errors),
                'std_error': np.std(errors),
                'max_error': np.max(abs_errors),
                'min_error': np.min(abs_errors),
                'q25_error': np.percentile(abs_errors, 25),
                'q75_error': np.percentile(abs_errors, 75)
            },
            'outliers': {
                'count': 0,
                'percentage': 0.0,
                'threshold': 0.0
            }
        }
        
        # Detect outliers using IQR method
        q1 = np.percentile(abs_errors, 25)
        q3 = np.percentile(abs_errors, 75)
        iqr = q3 - q1
        outlier_threshold = q3 + 1.5 * iqr
        
        outliers = abs_errors > outlier_threshold
        analysis['outliers']['count'] = np.sum(outliers)
        analysis['outliers']['percentage'] = (np.sum(outliers) / len(errors)) * 100
        analysis['outliers']['threshold'] = outlier_threshold
        
        # Error distribution by magnitude
        magnitude_ranges = [
            (0, 0.1, 'very_small'),
            (0.1, 0.5, 'small'),
            (0.5, 1.0, 'medium'),
            (1.0, 2.0, 'large'),
            (2.0, float('inf'), 'very_large')
        ]
        
        error_distribution = {}
        for min_val, max_val, category in magnitude_ranges:
            mask = (abs_errors >= min_val) & (abs_errors < max_val)
            count = np.sum(mask)
            error_distribution[category] = {
                'count': int(count),
                'percentage': (count / len(errors)) * 100,
                'range': f"{min_val}-{max_val if max_val != float('inf') else '∞'}"
            }
        
        analysis['error_distribution'] = error_distribution
        
        return analysis
    
    def calculate_model_stability_metrics(self, predictions_history: List[np.ndarray]) -> Dict[str, float]:
        """Calculate model stability metrics across multiple runs"""
        if len(predictions_history) < 2:
            return {'stability_score': 1.0, 'prediction_variance': 0.0}
        
        # Stack predictions
        all_predictions = np.stack(predictions_history, axis=0)
        
        # Calculate variance across runs
        prediction_variance = np.var(all_predictions, axis=0)
        mean_variance = np.mean(prediction_variance)
        
        # Calculate correlation between runs
        correlations = []
        for i in range(len(predictions_history)):
            for j in range(i + 1, len(predictions_history)):
                corr, _ = pearsonr(predictions_history[i].flatten(), predictions_history[j].flatten())
                if not np.isnan(corr):
                    correlations.append(corr)
        
        stability_score = np.mean(correlations) if correlations else 1.0
        
        return {
            'stability_score': stability_score,
            'prediction_variance': mean_variance,
            'run_correlations': correlations
        }