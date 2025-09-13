#!/usr/bin/env python3

"""
Aurigraph DLT V11 - Vizro Real-time Dashboard
Interactive visualization for blockchain throughput demonstration
"""

import vizro as vm
import pandas as pd
import plotly.graph_objects as go
from vizro.models import Page, Layout, Graph, Card, Button, Parameter
from vizro.actions import filter_interaction
import asyncio
import aiohttp
import json
from datetime import datetime
import dash
from dash import dcc, html, Input, Output, State
import dash_bootstrap_components as dbc

# API Configuration
API_BASE_URL = "http://localhost:3088"
WS_URL = "ws://localhost:3088/ws"

# Initialize Vizro app
app = vm.Vizro()

# Create real-time TPS chart
def create_tps_chart():
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=[],
        y=[],
        mode='lines+markers',
        name='TPS',
        line=dict(color='#667eea', width=3),
        fill='tozeroy',
        fillcolor='rgba(102, 126, 234, 0.2)'
    ))
    
    fig.update_layout(
        title="Real-time Throughput (TPS)",
        xaxis_title="Time",
        yaxis_title="Transactions Per Second",
        template="plotly_white",
        height=400,
        showlegend=False,
        xaxis=dict(
            showgrid=True,
            gridcolor='rgba(0,0,0,0.1)'
        ),
        yaxis=dict(
            showgrid=True,
            gridcolor='rgba(0,0,0,0.1)',
            tickformat=',.'
        )
    )
    return fig

# Create latency chart
def create_latency_chart():
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=[],
        y=[],
        mode='lines+markers',
        name='Latency',
        line=dict(color='#ef4444', width=2),
        marker=dict(size=6)
    ))
    
    fig.update_layout(
        title="Transaction Latency",
        xaxis_title="Time",
        yaxis_title="Latency (ms)",
        template="plotly_white",
        height=300,
        showlegend=False,
        xaxis=dict(showgrid=True, gridcolor='rgba(0,0,0,0.1)'),
        yaxis=dict(showgrid=True, gridcolor='rgba(0,0,0,0.1)')
    )
    return fig

# Create node status visualization
def create_node_visualization():
    fig = go.Figure()
    
    # Validators
    fig.add_trace(go.Bar(
        name='Validators',
        x=['Active', 'Idle'],
        y=[0, 0],
        marker_color='#10b981',
        text=[0, 0],
        textposition='auto',
    ))
    
    # Business Nodes
    fig.add_trace(go.Bar(
        name='Business Nodes',
        x=['Active', 'Idle'],
        y=[0, 0],
        marker_color='#3b82f6',
        text=[0, 0],
        textposition='auto',
    ))
    
    fig.update_layout(
        title="Node Activity Status",
        barmode='group',
        template="plotly_white",
        height=300,
        xaxis_title="Status",
        yaxis_title="Number of Nodes",
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        )
    )
    return fig

# Create consensus performance chart
def create_consensus_chart():
    fig = go.Figure()
    
    fig.add_trace(go.Indicator(
        mode="gauge+number+delta",
        value=0,
        title={'text': "Consensus Success Rate (%)"},
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
        height=250
    )
    return fig

# Create block height progress
def create_block_progress():
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=[],
        y=[],
        mode='lines',
        fill='tozeroy',
        line=dict(color='#764ba2', width=2),
        fillcolor='rgba(118, 75, 162, 0.2)',
        name='Block Height'
    ))
    
    fig.update_layout(
        title="Block Height Progress",
        xaxis_title="Time",
        yaxis_title="Block Height",
        template="plotly_white",
        height=250,
        showlegend=False
    )
    return fig

# Create performance metrics table
def create_metrics_table():
    df = pd.DataFrame({
        'Metric': ['Current TPS', 'Total Transactions', 'Avg Latency', 'Success Rate', 
                   'Active Nodes', 'Block Height', 'Consensus Rounds'],
        'Value': ['0', '0', '0 ms', '100%', '0', '0', '0']
    })
    
    fig = go.Figure(data=[go.Table(
        header=dict(
            values=['<b>Metric</b>', '<b>Value</b>'],
            fill_color='#667eea',
            font=dict(color='white', size=14),
            align='left',
            height=35
        ),
        cells=dict(
            values=[df.Metric, df.Value],
            fill_color=['#f3f4f6', 'white'],
            font=dict(size=12),
            align='left',
            height=30
        )
    )])
    
    fig.update_layout(
        height=300,
        margin=dict(l=0, r=0, t=20, b=0)
    )
    return fig

# Create Vizro dashboard pages
dashboard_page = vm.Page(
    title="Aurigraph DLT V11 - Performance Dashboard",
    layout=vm.Layout(
        grid=[
            [0, 0, 1, 1],
            [2, 2, 3, 3],
            [4, 5, 6, 6]
        ]
    ),
    components=[
        vm.Graph(
            id="tps-chart",
            figure=create_tps_chart()
        ),
        vm.Graph(
            id="metrics-table",
            figure=create_metrics_table()
        ),
        vm.Graph(
            id="latency-chart",
            figure=create_latency_chart()
        ),
        vm.Graph(
            id="node-viz",
            figure=create_node_visualization()
        ),
        vm.Graph(
            id="consensus-gauge",
            figure=create_consensus_chart()
        ),
        vm.Graph(
            id="block-progress",
            figure=create_block_progress()
        )
    ]
)

control_page = vm.Page(
    title="Simulation Control Panel",
    layout=vm.Layout(
        grid=[
            [0],
            [1],
            [2]
        ]
    ),
    components=[
        vm.Card(
            text="""
            ## Network Configuration
            
            Configure the blockchain network parameters for the simulation.
            """,
            id="config-card"
        ),
        vm.Card(
            text="""
            ### Controls
            - **Channel**: Network channel name
            - **Validators**: Number of validator nodes (1-20)
            - **Business Nodes**: Number of business nodes (1-50)
            - **Target TPS**: Target transactions per second
            - **Batch Size**: Transaction batch size
            - **Consensus Type**: Consensus algorithm (HyperRAFT++, PBFT, RAFT)
            """,
            id="control-info"
        ),
        vm.Card(
            text="""
            ### Actions
            - Click **Start Simulation** to begin the test
            - Click **Stop Simulation** to end the test
            - View real-time metrics on the Dashboard page
            """,
            id="action-info"
        )
    ]
)

# Create Vizro dashboard
dashboard = vm.Dashboard(
    pages=[dashboard_page, control_page],
    title="Aurigraph DLT V11 Demo Platform"
)

# Custom Dash app for real-time updates
dash_app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

dash_app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("🚀 Aurigraph DLT V11 - Live Demo", className="text-center mb-4"),
            html.Hr()
        ])
    ]),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H4("Network Configuration", className="card-title"),
                    dbc.Form([
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("Channel Name"),
                                dbc.Input(id="channel-input", value="main-channel", type="text")
                            ], md=6),
                            dbc.Col([
                                dbc.Label("Consensus Type"),
                                dbc.Select(
                                    id="consensus-select",
                                    options=[
                                        {"label": "HyperRAFT++", "value": "hyperraft"},
                                        {"label": "PBFT", "value": "pbft"},
                                        {"label": "RAFT", "value": "raft"}
                                    ],
                                    value="hyperraft"
                                )
                            ], md=6)
                        ], className="mb-3"),
                        
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("Validators"),
                                dcc.Slider(id="validator-slider", min=1, max=20, value=4, 
                                         marks={i: str(i) for i in range(1, 21, 5)})
                            ], md=6),
                            dbc.Col([
                                dbc.Label("Business Nodes"),
                                dcc.Slider(id="business-slider", min=1, max=50, value=10,
                                         marks={i: str(i) for i in range(1, 51, 10)})
                            ], md=6)
                        ], className="mb-3"),
                        
                        dbc.Row([
                            dbc.Col([
                                dbc.Label("Target TPS"),
                                dbc.Select(
                                    id="tps-select",
                                    options=[
                                        {"label": "1,000", "value": "1000"},
                                        {"label": "10,000", "value": "10000"},
                                        {"label": "100,000", "value": "100000"},
                                        {"label": "500,000", "value": "500000"},
                                        {"label": "1,000,000", "value": "1000000"},
                                        {"label": "2,000,000", "value": "2000000"}
                                    ],
                                    value="100000"
                                )
                            ], md=6),
                            dbc.Col([
                                dbc.Label("Batch Size"),
                                dbc.Input(id="batch-input", value="1000", type="number", min=100, max=10000)
                            ], md=6)
                        ], className="mb-3"),
                        
                        dbc.ButtonGroup([
                            dbc.Button("▶️ Start Simulation", id="start-btn", color="primary", size="lg"),
                            dbc.Button("⏹️ Stop Simulation", id="stop-btn", color="danger", size="lg", disabled=True)
                        ], className="d-grid gap-2")
                    ])
                ])
            ], className="mb-4")
        ], md=4),
        
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H4("Live Metrics", className="card-title"),
                    dcc.Graph(id="live-tps-chart"),
                    dcc.Interval(id="interval-component", interval=100, n_intervals=0)
                ])
            ])
        ], md=8)
    ]),
    
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H4("Performance Metrics", className="card-title"),
                    html.Div(id="metrics-display")
                ])
            ])
        ], md=4),
        
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H4("Node Activity", className="card-title"),
                    dcc.Graph(id="node-activity-chart")
                ])
            ])
        ], md=4),
        
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    html.H4("Consensus Performance", className="card-title"),
                    dcc.Graph(id="consensus-gauge-chart")
                ])
            ])
        ], md=4)
    ], className="mt-4")
], fluid=True)

# Store for metrics data
metrics_store = {
    'tps_history': [],
    'time_history': [],
    'latency_history': []
}

@dash_app.callback(
    [Output("live-tps-chart", "figure"),
     Output("metrics-display", "children"),
     Output("node-activity-chart", "figure"),
     Output("consensus-gauge-chart", "figure")],
    [Input("interval-component", "n_intervals")]
)
async def update_metrics(n):
    # Fetch metrics from API
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_BASE_URL}/api/metrics") as response:
                metrics = await response.json()
            
            async with session.get(f"{API_BASE_URL}/api/metrics/history") as response:
                history = await response.json()
        
        # Update TPS chart
        tps_fig = create_tps_chart()
        if history['time'] and history['tps']:
            tps_fig.data[0].x = history['time'][-50:]  # Last 50 points
            tps_fig.data[0].y = history['tps'][-50:]
        
        # Update metrics display
        metrics_cards = dbc.Row([
            dbc.Col(dbc.Card([
                dbc.CardBody([
                    html.H5("Current TPS", className="text-muted"),
                    html.H3(f"{metrics.get('tps', 0):,.0f}", className="text-primary")
                ])
            ])),
            dbc.Col(dbc.Card([
                dbc.CardBody([
                    html.H5("Total Transactions", className="text-muted"),
                    html.H3(f"{metrics.get('totalTransactions', 0):,}", className="text-success")
                ])
            ])),
            dbc.Col(dbc.Card([
                dbc.CardBody([
                    html.H5("Avg Latency", className="text-muted"),
                    html.H3(f"{metrics.get('latency', 0):.2f} ms", className="text-warning")
                ])
            ]))
        ])
        
        # Update node activity chart
        node_fig = create_node_visualization()
        active_nodes = metrics.get('activeNodes', 0)
        total_nodes = 14  # Default total
        node_fig.data[0].y = [active_nodes, total_nodes - active_nodes]
        
        # Update consensus gauge
        consensus_fig = create_consensus_chart()
        consensus_fig.data[0].value = metrics.get('successRate', 100)
        
        return tps_fig, metrics_cards, node_fig, consensus_fig
    
    except Exception as e:
        print(f"Error fetching metrics: {e}")
        return create_tps_chart(), html.Div("No data"), create_node_visualization(), create_consensus_chart()

@dash_app.callback(
    [Output("start-btn", "disabled"),
     Output("stop-btn", "disabled")],
    [Input("start-btn", "n_clicks"),
     Input("stop-btn", "n_clicks")],
    [State("channel-input", "value"),
     State("validator-slider", "value"),
     State("business-slider", "value"),
     State("tps-select", "value"),
     State("batch-input", "value"),
     State("consensus-select", "value")]
)
async def control_simulation(start_clicks, stop_clicks, channel, validators, business_nodes, 
                            target_tps, batch_size, consensus_type):
    ctx = dash.callback_context
    
    if not ctx.triggered:
        return False, True
    
    button_id = ctx.triggered[0]['prop_id'].split('.')[0]
    
    try:
        async with aiohttp.ClientSession() as session:
            if button_id == "start-btn":
                config = {
                    "channel": channel,
                    "validators": validators,
                    "businessNodes": business_nodes,
                    "targetTps": int(target_tps),
                    "batchSize": int(batch_size),
                    "consensusType": consensus_type
                }
                async with session.post(f"{API_BASE_URL}/api/start", json=config) as response:
                    if response.status == 200:
                        return True, False
            
            elif button_id == "stop-btn":
                async with session.post(f"{API_BASE_URL}/api/stop") as response:
                    if response.status == 200:
                        return False, True
    
    except Exception as e:
        print(f"Error controlling simulation: {e}")
    
    return False, True

if __name__ == "__main__":
    print("""
    ========================================
    🎨 Aurigraph DLT V11 - Vizro Dashboard
    ========================================
    
    Dashboard running on:
    - Vizro: http://localhost:8050
    - API Server: http://localhost:3088
    
    Make sure the API server is running first!
    ========================================
    """)
    
    # Run Dash app for real-time dashboard
    dash_app.run_server(debug=True, port=8050)