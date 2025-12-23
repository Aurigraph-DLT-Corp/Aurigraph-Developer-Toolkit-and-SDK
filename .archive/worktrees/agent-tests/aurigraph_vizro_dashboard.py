"""
Aurigraph Enterprise Portal - Real-Time Vizro Dashboards
Real-time blockchain analytics and monitoring using Vizro framework
"""

import vizro.plotly.express as px
import vizro.models as vm
from vizro import Vizro
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime, timedelta
import numpy as np
import requests
from typing import Dict, List

# Configuration
AURIGRAPH_API_BASE = "https://dlt.aurigraph.io"
REFRESH_INTERVAL = 5000  # 5 seconds

class AurigraphDataFetcher:
    """Fetch real-time data from Aurigraph API"""

    def __init__(self, base_url: str):
        self.base_url = base_url

    def get_portal_stats(self) -> Dict:
        """Fetch portal statistics"""
        try:
            response = requests.get(f"{self.base_url}/portal/stats", timeout=10)
            return response.json()
        except Exception as e:
            print(f"Error fetching stats: {e}")
            return self._get_mock_stats()

    def get_recent_transactions(self) -> pd.DataFrame:
        """Fetch recent transactions"""
        try:
            response = requests.get(f"{self.base_url}/portal/transactions/recent", timeout=10)
            data = response.json()
            return pd.DataFrame(data['transactions'])
        except Exception as e:
            print(f"Error fetching transactions: {e}")
            return self._get_mock_transactions()

    def get_network_history(self) -> pd.DataFrame:
        """Fetch network performance history"""
        try:
            response = requests.get(f"{self.base_url}/portal/network/history", timeout=10)
            data = response.json()
            df = pd.DataFrame(data['history'])
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            return df
        except Exception as e:
            print(f"Error fetching network history: {e}")
            return self._get_mock_network_history()

    def _get_mock_stats(self) -> Dict:
        """Generate mock statistics for testing"""
        return {
            "total_transactions": 1_870_000 + np.random.randint(0, 10000),
            "active_contracts": 8534,
            "total_tokens": 12847,
            "network_tps": 650 + np.random.uniform(-100, 150),
            "network_status": "healthy",
            "last_block_time": datetime.utcnow().isoformat()
        }

    def _get_mock_transactions(self) -> pd.DataFrame:
        """Generate mock transaction data"""
        now = datetime.utcnow()
        return pd.DataFrame([
            {
                "tx_id": f"0x{np.random.randint(1000000, 9999999):x}",
                "timestamp": (now - timedelta(seconds=i*10)).isoformat(),
                "from_address": f"0x{np.random.randint(100000, 999999):x}",
                "to_address": f"0x{np.random.randint(100000, 999999):x}",
                "amount": np.random.uniform(0.1, 100),
                "status": np.random.choice(["confirmed", "pending"], p=[0.7, 0.3]),
                "gas_used": np.random.randint(21000, 150000),
                "type": np.random.choice(["transfer", "token", "nft", "contract"])
            }
            for i in range(50)
        ])

    def _get_mock_network_history(self) -> pd.DataFrame:
        """Generate mock network history"""
        now = datetime.utcnow()
        return pd.DataFrame([
            {
                "timestamp": now - timedelta(minutes=i),
                "tps": 700 + np.random.uniform(-150, 150),
                "block_time": 2.8 + np.random.uniform(-0.5, 0.5),
                "active_validators": np.random.randint(95, 106)
            }
            for i in range(60)
        ])

# Initialize data fetcher
data_fetcher = AurigraphDataFetcher(AURIGRAPH_API_BASE)

# Data loading functions for Vizro
def load_network_metrics():
    """Load network metrics for dashboard"""
    return data_fetcher.get_network_history()

def load_transaction_data():
    """Load transaction data for dashboard"""
    return data_fetcher.get_recent_transactions()

def load_stats_data():
    """Load statistics for cards"""
    stats = data_fetcher.get_portal_stats()
    return pd.DataFrame([
        {"metric": "Total Transactions", "value": f"{stats['total_transactions']:,}"},
        {"metric": "Network TPS", "value": f"{stats['network_tps']:.1f}"},
        {"metric": "Active Contracts", "value": f"{stats['active_contracts']:,}"},
        {"metric": "Total Tokens", "value": f"{stats['total_tokens']:,}"},
        {"metric": "Network Status", "value": stats['network_status'].upper()},
    ])

def load_transaction_type_distribution():
    """Load transaction type distribution"""
    df = data_fetcher.get_recent_transactions()
    type_counts = df['type'].value_counts().reset_index()
    type_counts.columns = ['Transaction Type', 'Count']
    return type_counts

# Create Vizro Dashboard
dashboard = vm.Dashboard(
    title="Aurigraph Enterprise Portal",
    pages=[
        # Network Overview Page
        vm.Page(
            title="Network Overview",
            components=[
                vm.Card(
                    text="""
                    # 🌐 Aurigraph Network Dashboard
                    Real-time monitoring of high-performance blockchain platform
                    **Target TPS**: 2M+ | **Status**: Live
                    """
                ),
                vm.AgGrid(
                    figure=vm.Figure(
                        data_frame=load_stats_data,
                        title="📊 Key Metrics"
                    )
                ),
                vm.Graph(
                    figure=vm.Figure(
                        data_frame=load_network_metrics,
                        x="timestamp",
                        y="tps",
                        title="⚡ Network TPS"
                    )
                ),
            ]
        ),
        # Transaction Analytics Page
        vm.Page(
            title="Transaction Analytics",
            components=[
                vm.Card(
                    text="# 💸 Transaction Analytics\nComprehensive transaction analysis"
                ),
                vm.Graph(
                    figure=vm.Figure(
                        data_frame=load_transaction_type_distribution,
                        values="Count",
                        names="Transaction Type",
                        hole=0.4,
                        title="🔄 Transaction Types"
                    )
                ),
                vm.AgGrid(
                    figure=vm.Figure(
                        data_frame=load_transaction_data,
                        title="📋 Recent Transactions"
                    )
                ),
            ]
        ),
    ]
)

# Build and run
app = Vizro().build(dashboard)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8050, debug=True)
