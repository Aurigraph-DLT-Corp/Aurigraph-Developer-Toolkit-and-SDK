#!/usr/bin/env python3

"""
Aurigraph DLT V11 - Simple Real-time Dashboard
Streamlined visualization for blockchain throughput demonstration
"""

import dash
from dash import dcc, html, Input, Output
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import requests
import json
from datetime import datetime
import time

# Initialize Dash app
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

# API Configuration
API_BASE_URL = "http://localhost:3088"

# Store for historical data
data_store = {
    'tps_history': [],
    'time_history': [],
    'latency_history': []
}

# Create app layout
app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("🚀 Aurigraph DLT V11 - Live Dashboard", className="text-center mb-4 text-primary"),
            html.Hr()
        ])
    ]),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("📊 Real-time Throughput"),
                dbc.CardBody([
                    dcc.Graph(id="tps-chart", style={'height': '400px'}),
                ])
            ])
        ], md=8),
        
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("⚡ Live Metrics"),
                dbc.CardBody([
                    html.Div(id="metrics-display"),
                    html.Hr(),
                    html.Div([
                        html.H6("Connection Status:", className="text-muted"),
                        dbc.Badge("Connected", id="connection-status", color="success")
                    ])
                ])
            ])
        ], md=4)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("🖥️ Network Activity"),
                dbc.CardBody([
                    dcc.Graph(id="network-chart", style={'height': '300px'})
                ])
            ])
        ], md=6),
        
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("📈 Performance Gauge"),
                dbc.CardBody([
                    dcc.Graph(id="performance-gauge", style={'height': '300px'})
                ])
            ])
        ], md=6)
    ], className="mb-4"),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("🎛️ Quick Controls"),
                dbc.CardBody([
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("📊 View API Status", id="api-status-btn", color="info", className="w-100 mb-2"),
                            html.Div(id="api-status-output")
                        ], md=6),
                        dbc.Col([
                            dbc.Button("🔄 Refresh Data", id="refresh-btn", color="secondary", className="w-100 mb-2"),
                            html.Div(id="refresh-output")
                        ], md=6)
                    ])
                ])
            ])
        ])
    ]),
    
    # Auto-refresh component
    dcc.Interval(
        id='interval-component',
        interval=500,  # Update every 500ms
        n_intervals=0
    )
], fluid=True)

def fetch_metrics():
    """Fetch metrics from the API"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/status", timeout=2)
        if response.status_code == 200:
            data = response.json()
            return data, True
        return {}, False
    except Exception as e:
        print(f"Error fetching metrics: {e}")
        return {}, False

def create_tps_chart(tps_history, time_history):
    """Create TPS line chart"""
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=time_history,
        y=tps_history,
        mode='lines+markers',
        name='TPS',
        line=dict(color='#667eea', width=3),
        fill='tozeroy',
        fillcolor='rgba(102, 126, 234, 0.1)'
    ))
    
    fig.update_layout(
        title="Real-time Transactions Per Second",
        xaxis_title="Time",
        yaxis_title="TPS",
        template="plotly_white",
        showlegend=False,
        yaxis=dict(tickformat=','),
        margin=dict(l=0, r=0, t=40, b=0)
    )
    
    return fig

def create_network_chart(metrics):
    """Create network activity chart"""
    fig = go.Figure()
    
    active_nodes = metrics.get('metrics', {}).get('active_nodes', 0)
    total_tx = metrics.get('metrics', {}).get('total_transactions', 0)
    block_height = metrics.get('metrics', {}).get('block_height', 0)
    
    fig.add_trace(go.Bar(
        x=['Active Nodes', 'Block Height', 'Total Tx (K)'],
        y=[active_nodes, block_height, total_tx / 1000],
        marker_color=['#10b981', '#3b82f6', '#ef4444'],
        text=[str(active_nodes), str(block_height), f"{total_tx/1000:.1f}K"],
        textposition='auto'
    ))
    
    fig.update_layout(
        title="Network Statistics",
        template="plotly_white",
        showlegend=False,
        margin=dict(l=0, r=0, t=40, b=0)
    )
    
    return fig

def create_performance_gauge(metrics):
    """Create performance gauge"""
    success_rate = metrics.get('metrics', {}).get('success_rate', 100)
    
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=success_rate,
        title={'text': "Success Rate (%)"},
        domain={'x': [0, 1], 'y': [0, 1]},
        gauge={
            'axis': {'range': [None, 100]},
            'bar': {'color': "#667eea"},
            'steps': [
                {'range': [0, 50], 'color': "lightgray"},
                {'range': [50, 80], 'color': "gray"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 95
            }
        }
    ))
    
    fig.update_layout(
        template="plotly_white",
        margin=dict(l=0, r=0, t=0, b=0)
    )
    
    return fig

@app.callback(
    [Output('tps-chart', 'figure'),
     Output('metrics-display', 'children'),
     Output('network-chart', 'figure'),
     Output('performance-gauge', 'figure'),
     Output('connection-status', 'children'),
     Output('connection-status', 'color')],
    [Input('interval-component', 'n_intervals')]
)
def update_dashboard(n):
    """Update all dashboard components"""
    
    metrics, connected = fetch_metrics()
    
    # Update connection status
    status_text = "Connected" if connected else "Disconnected"
    status_color = "success" if connected else "danger"
    
    if connected:
        # Update historical data
        current_tps = metrics.get('metrics', {}).get('tps', 0)
        current_time = datetime.now().strftime("%H:%M:%S")
        
        data_store['tps_history'].append(current_tps)
        data_store['time_history'].append(current_time)
        
        # Keep only last 50 points
        if len(data_store['tps_history']) > 50:
            data_store['tps_history'] = data_store['tps_history'][-50:]
            data_store['time_history'] = data_store['time_history'][-50:]
        
        # Create metrics display
        metrics_data = metrics.get('metrics', {})
        metrics_cards = dbc.Row([
            dbc.Col([
                html.H6("Current TPS", className="text-muted mb-1"),
                html.H4(f"{metrics_data.get('tps', 0):,.0f}", className="text-primary mb-0")
            ], md=6),
            dbc.Col([
                html.H6("Total TX", className="text-muted mb-1"),
                html.H4(f"{metrics_data.get('total_transactions', 0):,}", className="text-success mb-0")
            ], md=6),
            dbc.Col([
                html.H6("Latency", className="text-muted mb-1"),
                html.H4(f"{metrics_data.get('latency', 0):.2f}ms", className="text-warning mb-0")
            ], md=6, className="mt-3"),
            dbc.Col([
                html.H6("Active Nodes", className="text-muted mb-1"),
                html.H4(f"{metrics_data.get('active_nodes', 0)}", className="text-info mb-0")
            ], md=6, className="mt-3")
        ])
        
        # Create charts
        tps_chart = create_tps_chart(data_store['tps_history'], data_store['time_history'])
        network_chart = create_network_chart(metrics)
        gauge_chart = create_performance_gauge(metrics)
        
        return tps_chart, metrics_cards, network_chart, gauge_chart, status_text, status_color
    
    else:
        # Return empty charts when disconnected
        empty_fig = go.Figure()
        empty_fig.update_layout(template="plotly_white")
        
        error_display = dbc.Alert(
            "Cannot connect to Aurigraph API server. Make sure it's running on port 3088.",
            color="warning"
        )
        
        return empty_fig, error_display, empty_fig, empty_fig, status_text, status_color

@app.callback(
    Output('api-status-output', 'children'),
    [Input('api-status-btn', 'n_clicks')]
)
def show_api_status(n_clicks):
    if not n_clicks:
        return ""
    
    metrics, connected = fetch_metrics()
    if connected:
        return dbc.Alert(f"✅ API Connected. Running: {metrics.get('is_running', False)}", color="success")
    else:
        return dbc.Alert("❌ API Disconnected", color="danger")

@app.callback(
    Output('refresh-output', 'children'),
    [Input('refresh-btn', 'n_clicks')]
)
def refresh_data(n_clicks):
    if not n_clicks:
        return ""
    
    # Clear historical data for fresh start
    data_store['tps_history'].clear()
    data_store['time_history'].clear()
    
    return dbc.Alert("Data refreshed!", color="info", duration=2000)

if __name__ == "__main__":
    print("""
    ========================================
    🎨 Aurigraph DLT V11 - Simple Dashboard  
    ========================================
    
    Dashboard running on:
    - URL: http://localhost:8050
    - API: http://localhost:3088
    
    Features:
    ✓ Real-time TPS monitoring
    ✓ Live metrics display  
    ✓ Network activity charts
    ✓ Performance gauges
    ✓ Auto-refresh every 500ms
    
    Make sure the FastAPI server is running!
    ========================================
    """)
    
    app.run(debug=False, host='0.0.0.0', port=8050)