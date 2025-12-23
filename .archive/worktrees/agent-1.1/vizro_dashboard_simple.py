#!/usr/bin/env python3
"""
Aurigraph DLT Vizro Dashboard - Simple Version
Multi-page dashboard for monitoring blockchain performance
"""

import vizro as vm
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import requests
import json
from datetime import datetime
import time

# API endpoint
API_BASE = "http://localhost:4000"

def fetch_status_data():
    """Fetch current status data"""
    try:
        response = requests.get(f"{API_BASE}/channel/status", timeout=2)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return {}

def fetch_metrics_data():
    """Fetch current metrics data"""
    try:
        response = requests.get(f"{API_BASE}/channel/metrics", timeout=2)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return {}

def fetch_nodes_data():
    """Fetch current nodes data"""
    try:
        response = requests.get(f"{API_BASE}/channel/nodes", timeout=2)
        if response.status_code == 200:
            return response.json().get('nodes', [])
    except:
        pass
    return []

def format_uptime(seconds):
    """Format uptime in human readable format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}h {minutes}m {secs}s"
    elif minutes > 0:
        return f"{minutes}m {secs}s"
    else:
        return f"{secs}s"

# STATUS PAGE COMPONENTS
def status_kpis(data_frame=None):
    """Generate KPI cards for status page"""
    status_data = fetch_status_data()
    
    if not status_data:
        fig = go.Figure()
        fig.add_annotation(text="No data available", x=0.5, y=0.5)
        return fig
    
    fig = go.Figure()
    
    # Create KPI indicators
    metrics = status_data.get('metrics', {})
    
    # Network Status
    fig.add_trace(go.Indicator(
        mode="number+delta",
        value=metrics.get('activeNodes', 0),
        title={"text": "Active Nodes"},
        delta={'reference': metrics.get('totalNodes', 57)},
        domain={'x': [0, 0.25], 'y': [0.7, 1]}
    ))
    
    # TPS
    fig.add_trace(go.Indicator(
        mode="gauge+number",
        value=metrics.get('totalTPS', 0),
        title={'text': "Total TPS"},
        gauge={'axis': {'range': [None, 300000]},
               'bar': {'color': "#00d4ff"},
               'steps': [
                   {'range': [0, 100000], 'color': "lightgray"},
                   {'range': [100000, 200000], 'color': "gray"}],
               'threshold': {'line': {'color': "red", 'width': 4},
                           'thickness': 0.75, 'value': 250000}},
        domain={'x': [0.3, 0.7], 'y': [0.7, 1]}
    ))
    
    # Success Rate
    success_rate = 0
    if metrics.get('totalTransactions', 0) > 0:
        success_rate = (metrics.get('confirmedTransactions', 0) / 
                       metrics.get('totalTransactions', 1)) * 100
    
    fig.add_trace(go.Indicator(
        mode="number+gauge",
        value=success_rate,
        title={'text': "Success Rate (%)"},
        number={'suffix': "%"},
        gauge={'axis': {'range': [0, 100]},
               'bar': {'color': "#00ff00" if success_rate > 95 else "#ffaa00"}},
        domain={'x': [0.75, 1], 'y': [0.7, 1]}
    ))
    
    # Block Height
    fig.add_trace(go.Indicator(
        mode="number",
        value=metrics.get('blockHeight', 0),
        title={'text': "Block Height"},
        number={'font': {'size': 40}},
        domain={'x': [0, 0.33], 'y': [0.35, 0.65]}
    ))
    
    # Total Transactions
    fig.add_trace(go.Indicator(
        mode="number",
        value=metrics.get('totalTransactions', 0),
        title={'text': "Total Transactions"},
        number={'font': {'size': 40}},
        domain={'x': [0.33, 0.66], 'y': [0.35, 0.65]}
    ))
    
    # Network Load
    fig.add_trace(go.Indicator(
        mode="gauge+number",
        value=metrics.get('networkLoad', 0),
        title={'text': "Network Load (%)"},
        number={'suffix': "%"},
        gauge={'axis': {'range': [0, 100]},
               'bar': {'color': "#ff6b6b" if metrics.get('networkLoad', 0) > 80 else "#4ecdc4"}},
        domain={'x': [0.66, 1], 'y': [0.35, 0.65]}
    ))
    
    # Leader Info
    fig.add_annotation(
        text=f"<b>Leader:</b> {status_data.get('leader', 'Unknown')}<br>" +
             f"<b>Consensus Term:</b> {status_data.get('consensusTerm', 0)}<br>" +
             f"<b>Uptime:</b> {format_uptime(status_data.get('uptime', 0))}",
        xref="paper", yref="paper",
        x=0.5, y=0.15,
        showarrow=False,
        font=dict(size=14),
        align="center",
        bordercolor="#00d4ff",
        borderwidth=2,
        borderpad=10,
        bgcolor="rgba(0, 212, 255, 0.1)"
    )
    
    fig.update_layout(
        height=600,
        title={
            'text': "🌐 Aurigraph DLT Network Status",
            'y': 0.98,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 24}
        }
    )
    
    return fig

# METRICS PAGE COMPONENTS
def transaction_distribution(data_frame=None):
    """Generate transaction distribution pie chart"""
    metrics_data = fetch_metrics_data()
    
    if not metrics_data:
        fig = go.Figure()
        fig.add_annotation(text="No data available", x=0.5, y=0.5)
        return fig
    
    confirmed = metrics_data.get('confirmedTransactions', 0)
    pending = metrics_data.get('totalTransactions', 0) - confirmed
    failed = metrics_data.get('failedTransactions', 0)
    
    fig = go.Figure(data=[go.Pie(
        labels=['Confirmed', 'Pending', 'Failed'],
        values=[confirmed, pending, failed],
        hole=0.4,
        marker_colors=['#00ff00', '#ffaa00', '#ff6b6b']
    )])
    
    fig.update_layout(
        title="Transaction Distribution",
        height=400
    )
    
    return fig

def metrics_summary(data_frame=None):
    """Generate metrics summary"""
    metrics_data = fetch_metrics_data()
    
    if not metrics_data:
        fig = go.Figure()
        fig.add_annotation(text="No data available", x=0.5, y=0.5)
        return fig
    
    # Create bar chart of key metrics
    metrics_names = ['TPS', 'Avg Latency (ms)', 'Block Height', 'Consensus Rounds']
    metrics_values = [
        metrics_data.get('totalTPS', 0),
        metrics_data.get('avgLatency', 0),
        metrics_data.get('blockHeight', 0),
        metrics_data.get('consensusRounds', 0)
    ]
    
    fig = go.Figure([go.Bar(
        x=metrics_names,
        y=metrics_values,
        marker_color=['#00d4ff', '#ff6b6b', '#4ecdc4', '#ffaa00']
    )])
    
    fig.update_layout(
        title="Key Performance Metrics",
        height=400,
        yaxis_title="Value"
    )
    
    return fig

# NODES PAGE COMPONENTS
def nodes_performance(data_frame=None):
    """Generate nodes performance visualization"""
    nodes_data = fetch_nodes_data()
    
    if not nodes_data:
        fig = go.Figure()
        fig.add_annotation(text="No data available", x=0.5, y=0.5)
        return fig
    
    # Prepare data for visualization
    validators = [n for n in nodes_data if n.get('type') == 'validator']
    basic_nodes = [n for n in nodes_data if n.get('type') == 'basic']
    
    fig = go.Figure()
    
    # Add validators
    if validators:
        validator_tps = [v.get('tps', 0) for v in validators[:7]]
        validator_names = [v.get('id', '') for v in validators[:7]]
        
        fig.add_trace(go.Bar(
            name='Validators',
            x=validator_names,
            y=validator_tps,
            marker_color='#ff6b6b',
            text=[f"{tps:,.0f} TPS" for tps in validator_tps],
            textposition='auto',
        ))
    
    # Add basic nodes (sample first 10)
    if basic_nodes:
        basic_tps = [n.get('tps', 0) for n in basic_nodes[:10]]
        basic_names = [n.get('id', '') for n in basic_nodes[:10]]
        
        fig.add_trace(go.Bar(
            name='Basic Nodes (Sample)',
            x=basic_names,
            y=basic_tps,
            marker_color='#4ecdc4',
            text=[f"{tps:,.0f} TPS" for tps in basic_tps],
            textposition='auto',
        ))
    
    fig.update_layout(
        title=f"Node Performance (Showing {min(17, len(nodes_data))} of {len(nodes_data)} nodes)",
        xaxis_title="Node ID",
        yaxis_title="Transactions per Second",
        height=500,
        barmode='group',
        xaxis={'tickangle': -45}
    )
    
    return fig

def node_summary_table(data_frame=None):
    """Generate node summary statistics table"""
    nodes_data = fetch_nodes_data()
    metrics_data = fetch_metrics_data()
    
    if not nodes_data:
        fig = go.Figure()
        fig.add_annotation(text="No data available", x=0.5, y=0.5)
        return fig
    
    validators = [n for n in nodes_data if n.get('type') == 'validator']
    basic_nodes = [n for n in nodes_data if n.get('type') == 'basic']
    
    # Calculate summary statistics
    validator_avg_tps = sum(v.get('tps', 0) for v in validators) / max(len(validators), 1) if validators else 0
    basic_avg_tps = sum(n.get('tps', 0) for n in basic_nodes) / max(len(basic_nodes), 1) if basic_nodes else 0
    validator_avg_latency = sum(v.get('latency', 0) for v in validators) / max(len(validators), 1) if validators else 0
    basic_avg_latency = sum(n.get('latency', 0) for n in basic_nodes) / max(len(basic_nodes), 1) if basic_nodes else 0
    
    fig = go.Figure(data=[go.Table(
        header=dict(
            values=['<b>Node Type</b>', '<b>Count</b>', '<b>Avg TPS</b>', '<b>Avg Latency (ms)</b>'],
            fill_color='#00d4ff',
            align='center',
            font=dict(color='white', size=14)
        ),
        cells=dict(
            values=[
                ['Validators', 'Basic Nodes', 'Total Network'],
                [len(validators), len(basic_nodes), len(nodes_data)],
                [f"{validator_avg_tps:,.0f}", f"{basic_avg_tps:,.0f}", f"{metrics_data.get('totalTPS', 0):,.0f}"],
                [f"{validator_avg_latency:.1f}", f"{basic_avg_latency:.1f}", f"{metrics_data.get('avgLatency', 0):.1f}"]
            ],
            fill_color=['rgba(100,100,100,0.2)'],
            align='center',
            font=dict(size=12)
        )
    )])
    
    fig.update_layout(
        title="Node Network Summary",
        height=300
    )
    
    return fig

# Create Vizro Dashboard
dashboard = vm.Dashboard(
    pages=[
        vm.Page(
            title="Status Overview",
            components=[
                vm.Graph(
                    id="status-kpis",
                    figure=status_kpis
                ),
                vm.Card(
                    text="""
                    ## 🌐 Aurigraph DLT Network Status
                    
                    Real-time monitoring of the blockchain network with 57 nodes 
                    (7 validators + 50 basic nodes) processing high-volume transactions.
                    
                    ### Navigation:
                    - [📊 Metrics Dashboard](#/metrics-dashboard)
                    - [🖥️ Node Network](#/node-network)
                    - [🏠 HTML Dashboard](http://localhost:4000)
                    """
                )
            ],
            layout=vm.Layout(grid=[[0], [1]])
        ),
        vm.Page(
            title="Metrics Dashboard",
            path="/metrics-dashboard",
            components=[
                vm.Graph(
                    id="transaction-dist",
                    figure=transaction_distribution
                ),
                vm.Graph(
                    id="metrics-summary",
                    figure=metrics_summary
                ),
                vm.Card(
                    text="""
                    ## 📈 Performance Metrics
                    
                    Live performance metrics from the Aurigraph blockchain demo.
                    
                    ### Navigation:
                    - [🏠 Status Overview](#/)
                    - [🖥️ Node Network](#/node-network)
                    - [🏠 HTML Dashboard](http://localhost:4000)
                    """
                )
            ],
            layout=vm.Layout(
                grid=[
                    [0, 1],
                    [2]
                ]
            )
        ),
        vm.Page(
            title="Node Network",
            path="/node-network",
            components=[
                vm.Graph(
                    id="nodes-perf",
                    figure=nodes_performance
                ),
                vm.Graph(
                    id="node-summary",
                    figure=node_summary_table
                ),
                vm.Card(
                    text="""
                    ## 🔗 Node Network Visualization
                    
                    Detailed view of all nodes in the network including validators 
                    and basic nodes with their performance metrics.
                    
                    ### Navigation:
                    - [🏠 Status Overview](#/)
                    - [📊 Metrics Dashboard](#/metrics-dashboard)
                    - [🏠 HTML Dashboard](http://localhost:4000)
                    """
                )
            ],
            layout=vm.Layout(
                grid=[
                    [0],
                    [1],
                    [2]
                ]
            )
        )
    ]
)

if __name__ == "__main__":
    print("🚀 Starting Aurigraph Vizro Dashboard...")
    print("📊 Dashboard will be available at: http://localhost:8050")
    print("🔗 Connected to API at: http://localhost:4000")
    print("⚠️  Make sure the demo is running on port 4000")
    print("\n📍 Dashboard Pages:")
    print("   - Status: http://localhost:8050/")
    print("   - Metrics: http://localhost:8050/metrics-dashboard")
    print("   - Nodes: http://localhost:8050/node-network")
    print("\n⚠️  Press Ctrl+C to stop the dashboard\n")
    
    # Run the dashboard
    Vizro().build(dashboard).run(port=8050)