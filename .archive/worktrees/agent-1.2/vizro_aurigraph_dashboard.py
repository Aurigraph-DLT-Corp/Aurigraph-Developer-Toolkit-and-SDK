#!/usr/bin/env python3
"""
Aurigraph DLT Advanced Dashboard
Multi-page dashboard using Dash for monitoring blockchain performance
"""

from dash import Dash, html, dcc, callback, Input, Output, page_container
import dash
import plotly.graph_objects as go
import plotly.express as px
import requests
import json
from datetime import datetime
import pandas as pd

# Initialize Dash app with pages
app = Dash(__name__, use_pages=True, suppress_callback_exceptions=True)

# API endpoint
API_BASE = "http://localhost:4000"

# App layout with navigation
app.layout = html.Div([
    html.Div([
        html.H1("🌐 Aurigraph DLT Vizro Dashboard", 
                style={'textAlign': 'center', 'color': '#00d4ff', 'marginBottom': '20px'}),
        html.Div([
            dcc.Link("📊 Status", href="/", 
                    style={'margin': '0 15px', 'color': '#00d4ff', 'fontSize': '18px', 'textDecoration': 'none'}),
            html.Span("|", style={'color': '#666'}),
            dcc.Link("📈 Metrics", href="/metrics",
                    style={'margin': '0 15px', 'color': '#00d4ff', 'fontSize': '18px', 'textDecoration': 'none'}),
            html.Span("|", style={'color': '#666'}),
            dcc.Link("🖥️ Nodes", href="/nodes",
                    style={'margin': '0 15px', 'color': '#00d4ff', 'fontSize': '18px', 'textDecoration': 'none'}),
            html.Span("|", style={'color': '#666'}),
            html.A("🏠 HTML Dashboard", href="http://localhost:4000", target="_blank",
                   style={'margin': '0 15px', 'color': '#ffd700', 'fontSize': '18px', 'textDecoration': 'none'})
        ], style={'textAlign': 'center', 'marginBottom': '30px'}),
    ], style={'padding': '20px', 'backgroundColor': '#1a1a3a', 'borderBottom': '2px solid #00d4ff'}),
    
    page_container,
    
    # Auto-refresh every 2 seconds
    dcc.Interval(id='interval-component', interval=2000, n_intervals=0)
], style={'backgroundColor': '#0f0f23', 'minHeight': '100vh'})

# Helper functions
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

# Register pages
dash.register_page("home", path="/", name="Status")
dash.register_page("metrics", path="/metrics", name="Metrics")
dash.register_page("nodes", path="/nodes", name="Nodes")

# STATUS PAGE
@dash.page.callback(
    Output('status-graph', 'figure'),
    Input('interval-component', 'n_intervals')
)
def update_status_graph(n):
    status_data = fetch_status_data()
    
    if not status_data:
        fig = go.Figure()
        fig.add_annotation(text="No data available", x=0.5, y=0.5)
        return fig
    
    fig = go.Figure()
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
                   {'range': [0, 100000], 'color': "#333"},
                   {'range': [100000, 200000], 'color': "#555"}]},
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
        number={'font': {'size': 40, 'color': '#4ecdc4'}},
        domain={'x': [0, 0.33], 'y': [0.35, 0.65]}
    ))
    
    # Total Transactions
    fig.add_trace(go.Indicator(
        mode="number",
        value=metrics.get('totalTransactions', 0),
        title={'text': "Total Transactions"},
        number={'font': {'size': 40, 'color': '#ff6b6b'}},
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
        font=dict(size=14, color='white'),
        align="center",
        bordercolor="#00d4ff",
        borderwidth=2,
        borderpad=10,
        bgcolor="rgba(0, 212, 255, 0.1)"
    )
    
    fig.update_layout(
        height=600,
        paper_bgcolor='#1a1a3a',
        plot_bgcolor='#1a1a3a',
        font={'color': 'white'},
        title={
            'text': "Network Status Overview",
            'y': 0.98,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top',
            'font': {'size': 24, 'color': '#00d4ff'}
        }
    )
    
    return fig

# Define status page layout
dash.page.layout = html.Div([
    dcc.Graph(id='status-graph', style={'height': '600px'})
], style={'padding': '20px'})

# METRICS PAGE
@dash.page.callback(
    Output('metrics-charts', 'children'),
    Input('interval-component', 'n_intervals')
)
def update_metrics_charts(n):
    metrics_data = fetch_metrics_data()
    
    if not metrics_data:
        return html.Div("No data available", style={'color': 'white', 'textAlign': 'center', 'padding': '50px'})
    
    # Transaction Distribution Pie Chart
    confirmed = metrics_data.get('confirmedTransactions', 0)
    pending = metrics_data.get('totalTransactions', 0) - confirmed
    failed = metrics_data.get('failedTransactions', 0)
    
    pie_fig = go.Figure(data=[go.Pie(
        labels=['Confirmed', 'Pending', 'Failed'],
        values=[confirmed, pending, failed],
        hole=0.4,
        marker_colors=['#00ff00', '#ffaa00', '#ff6b6b']
    )])
    
    pie_fig.update_layout(
        title="Transaction Distribution",
        height=400,
        paper_bgcolor='#1a1a3a',
        plot_bgcolor='#1a1a3a',
        font={'color': 'white'}
    )
    
    # Key Metrics Bar Chart
    metrics_names = ['TPS', 'Avg Latency (ms)', 'Block Height', 'Consensus Rounds']
    metrics_values = [
        metrics_data.get('totalTPS', 0),
        metrics_data.get('avgLatency', 0),
        metrics_data.get('blockHeight', 0),
        metrics_data.get('consensusRounds', 0)
    ]
    
    bar_fig = go.Figure([go.Bar(
        x=metrics_names,
        y=metrics_values,
        marker_color=['#00d4ff', '#ff6b6b', '#4ecdc4', '#ffaa00'],
        text=[f"{v:,.0f}" if i != 1 else f"{v:.1f}" for i, v in enumerate(metrics_values)],
        textposition='auto'
    )])
    
    bar_fig.update_layout(
        title="Key Performance Metrics",
        height=400,
        yaxis_title="Value",
        paper_bgcolor='#1a1a3a',
        plot_bgcolor='#1a1a3a',
        font={'color': 'white'},
        xaxis={'gridcolor': 'rgba(255,255,255,0.1)'},
        yaxis={'gridcolor': 'rgba(255,255,255,0.1)'}
    )
    
    return html.Div([
        html.Div([
            dcc.Graph(figure=pie_fig, style={'width': '48%', 'display': 'inline-block'}),
            dcc.Graph(figure=bar_fig, style={'width': '48%', 'display': 'inline-block', 'marginLeft': '4%'})
        ])
    ])

# Define metrics page layout
dash.page.layout = html.Div([
    html.Div(id='metrics-charts')
], style={'padding': '20px'})

# NODES PAGE
@dash.page.callback(
    Output('nodes-visualization', 'children'),
    Input('interval-component', 'n_intervals')
)
def update_nodes_visualization(n):
    nodes_data = fetch_nodes_data()
    metrics_data = fetch_metrics_data()
    
    if not nodes_data:
        return html.Div("No data available", style={'color': 'white', 'textAlign': 'center', 'padding': '50px'})
    
    # Node Performance Bar Chart
    validators = [n for n in nodes_data if n.get('type') == 'validator']
    basic_nodes = [n for n in nodes_data if n.get('type') == 'basic']
    
    perf_fig = go.Figure()
    
    # Add validators
    if validators:
        validator_tps = [v.get('tps', 0) for v in validators[:7]]
        validator_names = [v.get('id', '') for v in validators[:7]]
        
        perf_fig.add_trace(go.Bar(
            name='Validators',
            x=validator_names,
            y=validator_tps,
            marker_color='#ff6b6b',
            text=[f"{tps:,.0f}" for tps in validator_tps],
            textposition='auto',
        ))
    
    # Add basic nodes (sample first 10)
    if basic_nodes:
        basic_tps = [n.get('tps', 0) for n in basic_nodes[:10]]
        basic_names = [n.get('id', '') for n in basic_nodes[:10]]
        
        perf_fig.add_trace(go.Bar(
            name='Basic Nodes (Sample)',
            x=basic_names,
            y=basic_tps,
            marker_color='#4ecdc4',
            text=[f"{tps:,.0f}" for tps in basic_tps],
            textposition='auto',
        ))
    
    perf_fig.update_layout(
        title=f"Node Performance (Showing {min(17, len(nodes_data))} of {len(nodes_data)} nodes)",
        xaxis_title="Node ID",
        yaxis_title="Transactions per Second",
        height=500,
        barmode='group',
        paper_bgcolor='#1a1a3a',
        plot_bgcolor='#1a1a3a',
        font={'color': 'white'},
        xaxis={'tickangle': -45, 'gridcolor': 'rgba(255,255,255,0.1)'},
        yaxis={'gridcolor': 'rgba(255,255,255,0.1)'}
    )
    
    # Summary Statistics Table
    validator_avg_tps = sum(v.get('tps', 0) for v in validators) / max(len(validators), 1) if validators else 0
    basic_avg_tps = sum(n.get('tps', 0) for n in basic_nodes) / max(len(basic_nodes), 1) if basic_nodes else 0
    validator_avg_latency = sum(v.get('latency', 0) for v in validators) / max(len(validators), 1) if validators else 0
    basic_avg_latency = sum(n.get('latency', 0) for n in basic_nodes) / max(len(basic_nodes), 1) if basic_nodes else 0
    
    table_fig = go.Figure(data=[go.Table(
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
            fill_color='#2a2a4a',
            align='center',
            font=dict(color='white', size=12)
        )
    )])
    
    table_fig.update_layout(
        title="Node Network Summary",
        height=300,
        paper_bgcolor='#1a1a3a',
        font={'color': 'white'}
    )
    
    return html.Div([
        dcc.Graph(figure=perf_fig),
        dcc.Graph(figure=table_fig)
    ])

# Define nodes page layout
dash.page.layout = html.Div([
    html.Div(id='nodes-visualization')
], style={'padding': '20px'})

if __name__ == "__main__":
    print("🚀 Starting Aurigraph Vizro Dashboard...")
    print("📊 Dashboard will be available at: http://localhost:8050")
    print("🔗 Connected to API at: http://localhost:4000")
    print("⚠️  Make sure the demo is running on port 4000")
    print("\n📍 Dashboard Pages:")
    print("   - Status: http://localhost:8050/")
    print("   - Metrics: http://localhost:8050/metrics")
    print("   - Nodes: http://localhost:8050/nodes")
    print("   - HTML Dashboard: http://localhost:4000")
    print("\n⚠️  Press Ctrl+C to stop the dashboard\n")
    
    app.run_server(debug=False, host="0.0.0.0", port=8050)