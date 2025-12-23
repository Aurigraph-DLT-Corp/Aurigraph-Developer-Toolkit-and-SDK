#!/usr/bin/env python3
"""
Aurigraph DLT Vizro Dashboard
Multi-page dashboard for monitoring blockchain performance
"""

import vizro as vm
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from vizro.models import Page, Graph, Card, Button, Layout
import requests
import json
from datetime import datetime
import time
import threading
from flask import Flask
from dash import dcc, html, Input, Output, callback
import dash

# Global variables for data storage
status_data = {}
metrics_data = {}
nodes_data = []
tps_history = []
latency_history = []
success_rate_history = []

# API endpoint
API_BASE = "http://localhost:4000"

def fetch_data():
    """Fetch data from the API continuously"""
    global status_data, metrics_data, nodes_data, tps_history, latency_history, success_rate_history
    
    while True:
        try:
            # Fetch status
            status_response = requests.get(f"{API_BASE}/channel/status", timeout=2)
            if status_response.status_code == 200:
                status_data = status_response.json()
            
            # Fetch metrics
            metrics_response = requests.get(f"{API_BASE}/channel/metrics", timeout=2)
            if metrics_response.status_code == 200:
                metrics_data = metrics_response.json()
                
                # Update history (keep last 50 points)
                timestamp = datetime.now()
                tps_history.append({'time': timestamp, 'tps': metrics_data.get('totalTPS', 0)})
                latency_history.append({'time': timestamp, 'latency': metrics_data.get('avgLatency', 0)})
                
                success_rate = 0
                if metrics_data.get('totalTransactions', 0) > 0:
                    success_rate = (metrics_data.get('confirmedTransactions', 0) / 
                                  metrics_data.get('totalTransactions', 1)) * 100
                success_rate_history.append({'time': timestamp, 'rate': success_rate})
                
                # Keep only last 50 points
                if len(tps_history) > 50:
                    tps_history.pop(0)
                if len(latency_history) > 50:
                    latency_history.pop(0)
                if len(success_rate_history) > 50:
                    success_rate_history.pop(0)
            
            # Fetch nodes
            nodes_response = requests.get(f"{API_BASE}/channel/nodes", timeout=2)
            if nodes_response.status_code == 200:
                nodes_data = nodes_response.json().get('nodes', [])
                
        except Exception as e:
            print(f"Error fetching data: {e}")
        
        time.sleep(2)  # Update every 2 seconds

# Start data fetching thread
data_thread = threading.Thread(target=fetch_data, daemon=True)
data_thread.start()

# Wait for initial data
time.sleep(1)

# STATUS PAGE
@vm.dashboard.callback
def get_status_kpis():
    """Generate KPI cards for status page"""
    if not status_data:
        return go.Figure()
    
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
               'bar': {'color': "#00ff00" if success_rate > 95 else "#ffaa00"},
               'bgcolor': "white",
               'borderwidth': 2,
               'bordercolor': "gray"},
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
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font={'color': "white", 'family': "Arial"},
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

# METRICS PAGE
@vm.dashboard.callback
def get_tps_chart():
    """Generate TPS over time chart"""
    if not tps_history:
        return go.Figure()
    
    df = pd.DataFrame(tps_history)
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df['time'],
        y=df['tps'],
        mode='lines+markers',
        name='TPS',
        line=dict(color='#00d4ff', width=3),
        fill='tozeroy',
        fillcolor='rgba(0, 212, 255, 0.2)'
    ))
    
    fig.update_layout(
        title="Transaction Throughput (TPS)",
        xaxis_title="Time",
        yaxis_title="Transactions per Second",
        height=400,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0.1)',
        font={'color': "white"},
        xaxis={'gridcolor': 'rgba(255,255,255,0.1)'},
        yaxis={'gridcolor': 'rgba(255,255,255,0.1)'}
    )
    
    return fig

@vm.dashboard.callback
def get_latency_chart():
    """Generate latency over time chart"""
    if not latency_history:
        return go.Figure()
    
    df = pd.DataFrame(latency_history)
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df['time'],
        y=df['latency'],
        mode='lines+markers',
        name='Latency',
        line=dict(color='#ff6b6b', width=3),
        fill='tozeroy',
        fillcolor='rgba(255, 107, 107, 0.2)'
    ))
    
    fig.update_layout(
        title="Average Latency",
        xaxis_title="Time",
        yaxis_title="Latency (ms)",
        height=400,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0.1)',
        font={'color': "white"},
        xaxis={'gridcolor': 'rgba(255,255,255,0.1)'},
        yaxis={'gridcolor': 'rgba(255,255,255,0.1)'}
    )
    
    return fig

@vm.dashboard.callback
def get_success_rate_chart():
    """Generate success rate over time chart"""
    if not success_rate_history:
        return go.Figure()
    
    df = pd.DataFrame(success_rate_history)
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df['time'],
        y=df['rate'],
        mode='lines+markers',
        name='Success Rate',
        line=dict(color='#00ff00', width=3),
        fill='tozeroy',
        fillcolor='rgba(0, 255, 0, 0.2)'
    ))
    
    fig.update_layout(
        title="Transaction Success Rate (%)",
        xaxis_title="Time",
        yaxis_title="Success Rate (%)",
        height=400,
        yaxis=dict(range=[0, 105]),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0.1)',
        font={'color': "white"},
        xaxis={'gridcolor': 'rgba(255,255,255,0.1)'},
        yaxis={'gridcolor': 'rgba(255,255,255,0.1)'}
    )
    
    return fig

@vm.dashboard.callback  
def get_transaction_distribution():
    """Generate transaction distribution pie chart"""
    if not metrics_data:
        return go.Figure()
    
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
        height=400,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font={'color': "white"}
    )
    
    return fig

# NODES PAGE
@vm.dashboard.callback
def get_nodes_visualization():
    """Generate nodes network visualization"""
    if not nodes_data:
        return go.Figure()
    
    # Prepare data for visualization
    validators = [n for n in nodes_data if n.get('type') == 'validator']
    basic_nodes = [n for n in nodes_data if n.get('type') == 'basic']
    
    fig = go.Figure()
    
    # Add validators
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
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0.1)',
        font={'color': "white"},
        xaxis={'gridcolor': 'rgba(255,255,255,0.1)', 'tickangle': -45},
        yaxis={'gridcolor': 'rgba(255,255,255,0.1)'}
    )
    
    return fig

@vm.dashboard.callback
def get_nodes_heatmap():
    """Generate nodes latency heatmap"""
    if not nodes_data:
        return go.Figure()
    
    # Create matrix for heatmap (7x8 grid for 56 nodes + leader indicator)
    latency_matrix = []
    node_labels = []
    
    for i in range(0, min(56, len(nodes_data)), 8):
        row_latencies = []
        row_labels = []
        for j in range(8):
            if i + j < len(nodes_data):
                node = nodes_data[i + j]
                row_latencies.append(node.get('latency', 0))
                row_labels.append(node.get('id', f'node-{i+j}'))
            else:
                row_latencies.append(0)
                row_labels.append('')
        latency_matrix.append(row_latencies)
        node_labels.append(row_labels)
    
    fig = go.Figure(data=go.Heatmap(
        z=latency_matrix,
        text=node_labels,
        texttemplate="%{text}<br>%{z:.1f}ms",
        textfont={"size": 10},
        colorscale=[
            [0, '#00ff00'],
            [0.5, '#ffaa00'],  
            [1, '#ff0000']
        ],
        colorbar=dict(title="Latency (ms)")
    ))
    
    fig.update_layout(
        title="Node Latency Heatmap",
        height=400,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font={'color': "white"},
        xaxis={'showticklabels': False},
        yaxis={'showticklabels': False}
    )
    
    return fig

@vm.dashboard.callback
def get_node_summary_table():
    """Generate node summary statistics table"""
    if not nodes_data:
        return go.Figure()
    
    validators = [n for n in nodes_data if n.get('type') == 'validator']
    basic_nodes = [n for n in nodes_data if n.get('type') == 'basic']
    
    # Calculate summary statistics
    validator_avg_tps = sum(v.get('tps', 0) for v in validators) / max(len(validators), 1)
    basic_avg_tps = sum(n.get('tps', 0) for n in basic_nodes) / max(len(basic_nodes), 1)
    validator_avg_latency = sum(v.get('latency', 0) for v in validators) / max(len(validators), 1)
    basic_avg_latency = sum(n.get('latency', 0) for n in basic_nodes) / max(len(basic_nodes), 1)
    
    fig = go.Figure(data=[go.Table(
        header=dict(
            values=['<b>Node Type</b>', '<b>Count</b>', '<b>Avg TPS</b>', '<b>Avg Latency (ms)</b>', '<b>Total Transactions</b>'],
            fill_color='#00d4ff',
            align='center',
            font=dict(color='white', size=14)
        ),
        cells=dict(
            values=[
                ['Validators', 'Basic Nodes', 'Total Network'],
                [len(validators), len(basic_nodes), len(nodes_data)],
                [f"{validator_avg_tps:,.0f}", f"{basic_avg_tps:,.0f}", f"{metrics_data.get('totalTPS', 0):,.0f}"],
                [f"{validator_avg_latency:.1f}", f"{basic_avg_latency:.1f}", f"{metrics_data.get('avgLatency', 0):.1f}"],
                [
                    sum(v.get('transactionCount', 0) for v in validators),
                    sum(n.get('transactionCount', 0) for n in basic_nodes),
                    metrics_data.get('totalTransactions', 0)
                ]
            ],
            fill_color=['rgba(255,255,255,0.05)'],
            align='center',
            font=dict(color='white', size=12)
        )
    )])
    
    fig.update_layout(
        title="Node Network Summary",
        height=300,
        paper_bgcolor='rgba(0,0,0,0)',
        font={'color': "white"}
    )
    
    return fig

# Create Vizro Dashboard
dashboard = vm.Dashboard(
    pages=[
        vm.Page(
            title="🏠 Status Overview",
            components=[
                vm.Graph(
                    id="status-kpis",
                    figure=get_status_kpis()
                ),
                vm.Card(
                    text="""
                    ## 🌐 Aurigraph DLT Network Status
                    
                    Real-time monitoring of the blockchain network with 57 nodes 
                    (7 validators + 50 basic nodes) processing high-volume transactions.
                    
                    **Navigation:**
                    - [📊 Metrics Dashboard](/metrics)
                    - [🖥️ Node Network](/nodes)
                    - [🏠 HTML Dashboard](http://localhost:4000)
                    """,
                    href="/"
                )
            ],
            layout=vm.Layout(grid=[[0], [1]])
        ),
        vm.Page(
            title="📊 Metrics Dashboard",
            components=[
                vm.Graph(
                    id="tps-chart",
                    figure=get_tps_chart()
                ),
                vm.Graph(
                    id="latency-chart", 
                    figure=get_latency_chart()
                ),
                vm.Graph(
                    id="success-rate-chart",
                    figure=get_success_rate_chart()
                ),
                vm.Graph(
                    id="transaction-distribution",
                    figure=get_transaction_distribution()
                ),
                vm.Card(
                    text="""
                    ## 📈 Performance Metrics
                    
                    Live performance metrics updated every 2 seconds from the 
                    Aurigraph blockchain demo.
                    
                    **Navigation:**
                    - [🏠 Status Overview](/)
                    - [🖥️ Node Network](/nodes)
                    - [🏠 HTML Dashboard](http://localhost:4000)
                    """,
                    href="/metrics"
                )
            ],
            layout=vm.Layout(
                grid=[
                    [0, 1],
                    [2, 3],
                    [4]
                ]
            )
        ),
        vm.Page(
            title="🖥️ Node Network",
            components=[
                vm.Graph(
                    id="nodes-visualization",
                    figure=get_nodes_visualization()
                ),
                vm.Graph(
                    id="nodes-heatmap",
                    figure=get_nodes_heatmap()
                ),
                vm.Graph(
                    id="node-summary",
                    figure=get_node_summary_table()
                ),
                vm.Card(
                    text="""
                    ## 🔗 Node Network Visualization
                    
                    Detailed view of all nodes in the network including validators 
                    and basic nodes with their performance metrics.
                    
                    **Navigation:**
                    - [🏠 Status Overview](/)
                    - [📊 Metrics Dashboard](/metrics)
                    - [🏠 HTML Dashboard](http://localhost:4000)
                    """,
                    href="/nodes"
                )
            ],
            layout=vm.Layout(
                grid=[
                    [0],
                    [1],
                    [2],
                    [3]
                ]
            )
        )
    ]
)

# Add custom CSS for dark theme
dashboard._theme = vm.themes.dark

if __name__ == "__main__":
    print("🚀 Starting Aurigraph Vizro Dashboard...")
    print("📊 Dashboard will be available at: http://localhost:8050")
    print("🔗 Connected to API at: http://localhost:4000")
    print("⚠️  Make sure the demo is running on port 4000")
    
    # Run the dashboard
    dashboard.build().run(debug=False, host="0.0.0.0", port=8050)