"""
Aurex Platform - Graph Neural Network Architecture
Purpose: Enhanced traceability, pattern detection, and relationship modeling
Version: 1.0.0
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, GATConv, global_mean_pool, global_max_pool
from torch_geometric.data import Data, DataLoader
import numpy as np
from typing import List, Dict, Tuple, Optional
import networkx as nx
from sklearn.preprocessing import StandardScaler


class AurexSupplyChainGNN(nn.Module):
    """
    Graph Neural Network for Supply Chain Traceability
    Models relationships between farmers, processors, distributors, and consumers
    """

    def __init__(self,
                 num_node_features: int = 128,
                 num_edge_features: int = 64,
                 hidden_channels: int = 256,
                 num_classes: int = 10,
                 num_layers: int = 3,
                 dropout_rate: float = 0.2):
        super(AurexSupplyChainGNN, self).__init__()

        # Graph Attention layers for node embeddings
        self.conv_layers = nn.ModuleList()
        self.batch_norms = nn.ModuleList()

        # First layer
        self.conv_layers.append(
            GATConv(num_node_features, hidden_channels, heads=8, dropout=dropout_rate)
        )
        self.batch_norms.append(nn.BatchNorm1d(hidden_channels * 8))

        # Hidden layers
        for _ in range(num_layers - 2):
            self.conv_layers.append(
                GATConv(hidden_channels * 8, hidden_channels, heads=8, dropout=dropout_rate)
            )
            self.batch_norms.append(nn.BatchNorm1d(hidden_channels * 8))

        # Output layer
        self.conv_layers.append(
            GATConv(hidden_channels * 8, num_classes, heads=1, concat=False, dropout=dropout_rate)
        )

        # Edge feature processing
        self.edge_encoder = nn.Sequential(
            nn.Linear(num_edge_features, hidden_channels),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_channels, hidden_channels)
        )

        # Global context aggregation
        self.global_pool = nn.Sequential(
            nn.Linear(num_classes * 2, hidden_channels),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_channels, num_classes)
        )

        self.dropout = nn.Dropout(dropout_rate)

    def forward(self, x, edge_index, edge_attr=None, batch=None):
        # Process through GAT layers
        for i, (conv, bn) in enumerate(zip(self.conv_layers[:-1], self.batch_norms)):
            x = conv(x, edge_index)
            x = bn(x)
            x = F.relu(x)
            x = self.dropout(x)

        # Final convolution
        x = self.conv_layers[-1](x, edge_index)

        # Global pooling for graph-level predictions
        if batch is not None:
            x_mean = global_mean_pool(x, batch)
            x_max = global_max_pool(x, batch)
            x = torch.cat([x_mean, x_max], dim=1)
            x = self.global_pool(x)

        return F.log_softmax(x, dim=1)

    def predict_anomalies(self, x, edge_index, threshold=0.95):
        """Detect anomalies in supply chain patterns"""
        with torch.no_grad():
            output = self.forward(x, edge_index)
            probabilities = torch.exp(output)
            anomaly_scores = 1 - probabilities.max(dim=1)[0]
            anomalies = anomaly_scores > threshold
        return anomalies, anomaly_scores


class WaterManagementGNN(nn.Module):
    """
    Graph Neural Network for Water Resource Management
    Models water flow networks, irrigation systems, and sensor relationships
    """

    def __init__(self,
                 sensor_features: int = 32,
                 weather_features: int = 16,
                 hidden_dim: int = 128,
                 num_predictions: int = 7):  # 7-day water demand forecast
        super(WaterManagementGNN, self).__init__()

        input_features = sensor_features + weather_features

        # Spatial-temporal graph convolutions
        self.spatial_conv1 = GCNConv(input_features, hidden_dim)
        self.spatial_conv2 = GCNConv(hidden_dim, hidden_dim)
        self.spatial_conv3 = GCNConv(hidden_dim, hidden_dim)

        # Temporal processing with LSTM
        self.temporal_lstm = nn.LSTM(
            hidden_dim, hidden_dim,
            num_layers=2, batch_first=True, dropout=0.2
        )

        # Attention mechanism for important nodes
        self.attention = nn.MultiheadAttention(hidden_dim, num_heads=4)

        # Prediction heads
        self.water_demand_predictor = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim // 2, num_predictions)
        )

        self.irrigation_optimizer = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1),
            nn.Sigmoid()  # Output irrigation efficiency 0-1
        )

    def forward(self, x, edge_index, temporal_data=None):
        # Spatial processing
        h = F.relu(self.spatial_conv1(x, edge_index))
        h = F.dropout(h, p=0.2, training=self.training)
        h = F.relu(self.spatial_conv2(h, edge_index))
        h = F.dropout(h, p=0.2, training=self.training)
        h = self.spatial_conv3(h, edge_index)

        # Temporal processing if available
        if temporal_data is not None:
            h_temporal, _ = self.temporal_lstm(temporal_data)
            h = h + h_temporal[:, -1, :]  # Add last temporal state

        # Self-attention for node importance
        h_att, _ = self.attention(h.unsqueeze(0), h.unsqueeze(0), h.unsqueeze(0))
        h = h + h_att.squeeze(0)

        # Predictions
        water_demand = self.water_demand_predictor(h)
        irrigation_efficiency = self.irrigation_optimizer(h)

        return {
            'water_demand': water_demand,
            'irrigation_efficiency': irrigation_efficiency,
            'node_embeddings': h
        }


class CarbonCreditGNN(nn.Module):
    """
    Graph Neural Network for Carbon Credit Verification and Trading
    Models carbon sequestration networks and credit flow
    """

    def __init__(self,
                 project_features: int = 64,
                 verification_features: int = 32,
                 hidden_channels: int = 128):
        super(CarbonCreditGNN, self).__init__()

        input_features = project_features + verification_features

        # Graph convolutions for carbon project relationships
        self.conv1 = GATConv(input_features, hidden_channels, heads=4)
        self.conv2 = GATConv(hidden_channels * 4, hidden_channels, heads=4)
        self.conv3 = GATConv(hidden_channels * 4, hidden_channels, heads=1)

        # Credit verification network
        self.verification_net = nn.Sequential(
            nn.Linear(hidden_channels, hidden_channels),
            nn.ReLU(),
            nn.BatchNorm1d(hidden_channels),
            nn.Dropout(0.3),
            nn.Linear(hidden_channels, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()  # Verification confidence 0-1
        )

        # Carbon sequestration predictor
        self.sequestration_predictor = nn.Sequential(
            nn.Linear(hidden_channels, 64),
            nn.ReLU(),
            nn.Linear(64, 1)  # Tons of CO2
        )

        # Fraud detection module
        self.fraud_detector = nn.Sequential(
            nn.Linear(hidden_channels * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 2)  # Binary classification
        )

    def forward(self, x, edge_index, edge_attr=None):
        # Graph convolutions
        h = F.dropout(x, p=0.2, training=self.training)
        h = F.elu(self.conv1(h, edge_index))
        h = F.dropout(h, p=0.2, training=self.training)
        h = F.elu(self.conv2(h, edge_index))
        h = self.conv3(h, edge_index)

        # Verification confidence
        verification_score = self.verification_net(h)

        # Carbon sequestration prediction
        sequestration = self.sequestration_predictor(h)

        # Fraud detection (using node pairs)
        row, col = edge_index
        edge_features = torch.cat([h[row], h[col]], dim=1)
        fraud_scores = self.fraud_detector(edge_features)

        return {
            'verification_confidence': verification_score,
            'sequestration_amount': sequestration,
            'fraud_probability': F.softmax(fraud_scores, dim=1)[:, 1],
            'embeddings': h
        }


class ForestEcosystemGNN(nn.Module):
    """
    Graph Neural Network for Forest Ecosystem Monitoring
    Models tree relationships, biodiversity patterns, and health indicators
    """

    def __init__(self,
                 satellite_features: int = 256,  # From satellite imagery
                 sensor_features: int = 64,      # From IoT sensors
                 species_features: int = 128,    # Species characteristics
                 output_dim: int = 32):
        super(ForestEcosystemGNN, self).__init__()

        input_features = satellite_features + sensor_features + species_features

        # Hierarchical graph processing
        self.tree_level_conv = GCNConv(input_features, 256)
        self.patch_level_conv = GCNConv(256, 128)
        self.forest_level_conv = GCNConv(128, output_dim)

        # Health assessment network
        self.health_assessor = nn.Sequential(
            nn.Linear(output_dim, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.Linear(64, 5)  # 5 health categories
        )

        # Biodiversity calculator
        self.biodiversity_net = nn.Sequential(
            nn.Linear(output_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()  # Biodiversity index 0-1
        )

        # Deforestation risk predictor
        self.risk_predictor = nn.Sequential(
            nn.Linear(output_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 3)  # Low, Medium, High risk
        )

    def forward(self, x, edge_index_tree, edge_index_patch, edge_index_forest):
        # Hierarchical processing
        h = F.relu(self.tree_level_conv(x, edge_index_tree))
        h = F.dropout(h, p=0.2, training=self.training)

        h = F.relu(self.patch_level_conv(h, edge_index_patch))
        h = F.dropout(h, p=0.2, training=self.training)

        h = self.forest_level_conv(h, edge_index_forest)

        # Assessments
        health_status = self.health_assessor(h)
        biodiversity_index = self.biodiversity_net(h)

        # Risk assessment using temporal features
        h_temporal = torch.cat([h[:-1], h[1:]], dim=1)  # Compare consecutive time steps
        deforestation_risk = self.risk_predictor(h_temporal)

        return {
            'health_classification': F.softmax(health_status, dim=1),
            'biodiversity_index': biodiversity_index,
            'deforestation_risk': F.softmax(deforestation_risk, dim=1),
            'forest_embeddings': h
        }


class IntegratedAurexGNN(nn.Module):
    """
    Master GNN that integrates all domain-specific GNNs
    Provides holistic insights across the entire Aurex platform
    """

    def __init__(self):
        super(IntegratedAurexGNN, self).__init__()

        # Initialize domain-specific GNNs
        self.supply_chain_gnn = AurexSupplyChainGNN()
        self.water_gnn = WaterManagementGNN()
        self.carbon_gnn = CarbonCreditGNN()
        self.forest_gnn = ForestEcosystemGNN()

        # Cross-domain integration layers
        self.integration_layer = nn.Sequential(
            nn.Linear(256, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(0.2),
            nn.Linear(512, 256)
        )

        # Holistic insight generator
        self.insight_generator = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, 10)  # 10 insight categories
        )

    def forward(self, supply_data, water_data, carbon_data, forest_data):
        # Process each domain
        supply_output = self.supply_chain_gnn(**supply_data)
        water_output = self.water_gnn(**water_data)
        carbon_output = self.carbon_gnn(**carbon_data)
        forest_output = self.forest_gnn(**forest_data)

        # Combine embeddings
        combined = torch.cat([
            supply_output.get('embeddings', torch.zeros(1, 64)),
            water_output['node_embeddings'],
            carbon_output['embeddings'],
            forest_output['forest_embeddings']
        ], dim=1)

        # Generate integrated insights
        integrated_features = self.integration_layer(combined)
        insights = self.insight_generator(integrated_features)

        return {
            'supply_chain': supply_output,
            'water_management': water_output,
            'carbon_credits': carbon_output,
            'forest_ecosystem': forest_output,
            'integrated_insights': F.softmax(insights, dim=1)
        }


# Utility functions for graph construction and processing
class GraphBuilder:
    """Utility class for building graphs from Aurex platform data"""

    @staticmethod
    def build_supply_chain_graph(transactions: List[Dict]) -> Data:
        """Build graph from supply chain transactions"""
        edges = []
        node_features = []

        for tx in transactions:
            edges.append([tx['from_id'], tx['to_id']])
            node_features.append(tx.get('features', []))

        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
        x = torch.tensor(node_features, dtype=torch.float)

        return Data(x=x, edge_index=edge_index)

    @staticmethod
    def build_water_network_graph(sensors: List[Dict], connections: List[Tuple]) -> Data:
        """Build graph from water sensor network"""
        node_features = []
        for sensor in sensors:
            features = [
                sensor.get('flow_rate', 0),
                sensor.get('pressure', 0),
                sensor.get('quality', 0),
                sensor.get('temperature', 0)
            ]
            node_features.append(features)

        edge_index = torch.tensor(connections, dtype=torch.long).t().contiguous()
        x = torch.tensor(node_features, dtype=torch.float)

        return Data(x=x, edge_index=edge_index)

    @staticmethod
    def build_carbon_project_graph(projects: List[Dict], relationships: List[Dict]) -> Data:
        """Build graph from carbon credit projects"""
        node_features = []
        edges = []

        for project in projects:
            features = [
                project.get('sequestration_rate', 0),
                project.get('verification_score', 0),
                project.get('area_hectares', 0),
                project.get('age_years', 0)
            ]
            node_features.append(features)

        for rel in relationships:
            edges.append([rel['source'], rel['target']])

        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
        x = torch.tensor(node_features, dtype=torch.float)

        return Data(x=x, edge_index=edge_index)


# Training utilities
class GNNTrainer:
    """Training utilities for Aurex GNN models"""

    def __init__(self, model: nn.Module, learning_rate: float = 0.001):
        self.model = model
        self.optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
        self.scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode='min', factor=0.5, patience=10
        )

    def train_epoch(self, data_loader: DataLoader, criterion: nn.Module) -> float:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0

        for batch in data_loader:
            self.optimizer.zero_grad()
            output = self.model(batch.x, batch.edge_index, batch.batch)
            loss = criterion(output, batch.y)
            loss.backward()
            self.optimizer.step()
            total_loss += loss.item()

        return total_loss / len(data_loader)

    def evaluate(self, data_loader: DataLoader, criterion: nn.Module) -> Dict:
        """Evaluate model performance"""
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for batch in data_loader:
                output = self.model(batch.x, batch.edge_index, batch.batch)
                loss = criterion(output, batch.y)
                total_loss += loss.item()

                pred = output.argmax(dim=1)
                correct += (pred == batch.y).sum().item()
                total += batch.y.size(0)

        return {
            'loss': total_loss / len(data_loader),
            'accuracy': correct / total
        }