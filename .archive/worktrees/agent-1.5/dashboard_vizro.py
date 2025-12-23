#!/usr/bin/env python3
"""
Aurigraph DLT Vizro-Style Dashboard
Simple multi-tab dashboard for monitoring blockchain performance
"""

from dash import Dash, html, dcc, callback, Input, Output
import plotly.graph_objects as go
import requests
from datetime import datetime

# Initialize Dash app
app = Dash(__name__)
app.title = "Aurigraph DLT Vizro Dashboard"

# API endpoint
API_BASE = "http://localhost:4000"

# Helper functions
def fetch_data(endpoint):
    """Fetch data from API endpoint"""
    try:
        response = requests.get(f"{API_BASE}{endpoint}", timeout=2)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return {}

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

# App layout
app.layout = html.Div([
    # Header
    html.Div([
        html.H1("🌐 Aurigraph DLT Vizro Dashboard", 
                style={'textAlign': 'center', 'color': '#00d4ff', 'marginBottom': '10px'}),
        html.P("Real-time Blockchain Performance Monitoring", 
               style={'textAlign': 'center', 'color': '#aaa', 'marginTop': '0'}),
        html.Div([
            html.A("🏠 HTML Dashboard", href="http://localhost:4000", target="_blank",
                   style={'color': '#ffd700', 'fontSize': '16px', 'textDecoration': 'none'})
        ], style={'textAlign': 'center', 'marginBottom': '20px'})
    ], style={'padding': '20px', 'backgroundColor': '#1a1a3a', 'borderBottom': '3px solid #00d4ff'}),
    
    # Tabs
    dcc.Tabs(id='tabs', value='status', children=[
        dcc.Tab(label='📊 Status', value='status', style={'backgroundColor': '#2a2a4a', 'color': '#fff'},
                selected_style={'backgroundColor': '#00d4ff', 'color': '#000'}),
        dcc.Tab(label='📈 Metrics', value='metrics', style={'backgroundColor': '#2a2a4a', 'color': '#fff'},
                selected_style={'backgroundColor': '#00d4ff', 'color': '#000'}),
        dcc.Tab(label='🖥️ Nodes', value='nodes', style={'backgroundColor': '#2a2a4a', 'color': '#fff'},
                selected_style={'backgroundColor': '#00d4ff', 'color': '#000'})
    ], style={'marginBottom': '20px'}),
    
    # Tab content
    html.Div(id='tab-content', style={'padding': '20px'}),
    
    # Auto-refresh every 2 seconds
    dcc.Interval(id='interval', interval=2000, n_intervals=0)
], style={'backgroundColor': '#0f0f23', 'minHeight': '100vh', 'fontFamily': 'Arial, sans-serif'})

# Callbacks
@callback(
    Output('tab-content', 'children'),
    [Input('tabs', 'value'), Input('interval', 'n_intervals')]
)
def update_content(active_tab, n):
    if active_tab == 'status':
        return render_status_page()
    elif active_tab == 'metrics':
        return render_metrics_page()
    elif active_tab == 'nodes':
        return render_nodes_page()
    return html.Div("Select a tab", style={'color': 'white'})

def render_status_page():
    """Render the status page content"""
    status_data = fetch_data('/channel/status')
    
    if not status_data:
        return html.Div("No data available", style={'color': 'white', 'textAlign': 'center', 'padding': '50px'})
    
    metrics = status_data.get('metrics', {})
    
    # Create status indicators figure
    fig = go.Figure()
    
    # Active Nodes
    fig.add_trace(go.Indicator(
        mode="number+delta",
        value=metrics.get('activeNodes', 0),
        title={"text": "Active Nodes", "font": {"color": "white"}},
        delta={'reference': metrics.get('totalNodes', 57)},
        number={'font': {'color': '#00d4ff'}},
        domain={'x': [0, 0.25], 'y': [0.7, 1]}
    ))
    
    # Total TPS
    fig.add_trace(go.Indicator(
        mode="gauge+number",
        value=metrics.get('totalTPS', 0),
        title={'text': "Total TPS", "font": {"color": "white"}},
        number={'font': {'color': '#00d4ff'}},
        gauge={'axis': {'range': [None, 300000]},
               'bar': {'color': "#00d4ff"},
               'bgcolor': '#2a2a4a',
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
        title={'text': "Success Rate (%)", "font": {"color": "white"}},
        number={'suffix': "%", 'font': {'color': '#00ff00'}},
        gauge={'axis': {'range': [0, 100]},
               'bar': {'color': "#00ff00" if success_rate > 95 else "#ffaa00"},
               'bgcolor': '#2a2a4a'},
        domain={'x': [0.75, 1], 'y': [0.7, 1]}
    ))
    
    # Block Height
    fig.add_trace(go.Indicator(
        mode="number",
        value=metrics.get('blockHeight', 0),
        title={'text': "Block Height", "font": {"color": "white"}},
        number={'font': {'size': 40, 'color': '#4ecdc4'}},
        domain={'x': [0, 0.33], 'y': [0.35, 0.65]}
    ))
    
    # Total Transactions
    fig.add_trace(go.Indicator(
        mode="number",
        value=metrics.get('totalTransactions', 0),
        title={'text': "Total Transactions", "font": {"color": "white"}},
        number={'font': {'size': 40, 'color': '#ff6b6b'}},
        domain={'x': [0.33, 0.66], 'y': [0.35, 0.65]}
    ))
    
    # Network Load
    fig.add_trace(go.Indicator(
        mode="gauge+number",
        value=metrics.get('networkLoad', 0),
        title={'text': "Network Load (%)", "font": {"color": "white"}},
        number={'suffix': "%", 'font': {'color': 'white'}},
        gauge={'axis': {'range': [0, 100]},
               'bar': {'color': "#ff6b6b" if metrics.get('networkLoad', 0) > 80 else "#4ecdc4"},
               'bgcolor': '#2a2a4a'},
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
    
    return html.Div([
        dcc.Graph(figure=fig, style={'height': '600px'})
    ])

def render_metrics_page():
    """Render the metrics page content"""
    metrics_data = fetch_data('/channel/metrics')
    
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
        marker_colors=['#00ff00', '#ffaa00', '#ff6b6b'],
        textfont={'color': 'white'}
    )])
    
    pie_fig.update_layout(
        title={'text': "Transaction Distribution", 'font': {'color': '#00d4ff', 'size': 20}},
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
        textposition='auto',
        textfont={'color': 'white'}
    )])
    
    bar_fig.update_layout(
        title={'text': "Key Performance Metrics", 'font': {'color': '#00d4ff', 'size': 20}},
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

def render_nodes_page():
    """Render the nodes page content"""
    nodes_data = fetch_data('/channel/nodes').get('nodes', [])
    metrics_data = fetch_data('/channel/metrics')
    
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
            textfont={'color': 'white'}
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
            textfont={'color': 'white'}
        ))
    
    perf_fig.update_layout(
        title={'text': f"Node Performance (Showing {min(17, len(nodes_data))} of {len(nodes_data)} nodes)", 
               'font': {'color': '#00d4ff', 'size': 20}},
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
        title={'text': "Node Network Summary", 'font': {'color': '#00d4ff', 'size': 20}},
        height=300,
        paper_bgcolor='#1a1a3a',
        font={'color': 'white'}
    )
    
    return html.Div([
        dcc.Graph(figure=perf_fig),
        dcc.Graph(figure=table_fig)
    ])

if __name__ == "__main__":
    print("🚀 Starting Aurigraph Vizro-Style Dashboard...")
    print("📊 Dashboard will be available at: http://localhost:8050")
    print("🔗 Connected to API at: http://localhost:4000")
    print("⚠️  Make sure the demo is running on port 4000")
    print("\n📍 Dashboard Pages (via tabs):")
    print("   - 📊 Status: Real-time network status")
    print("   - 📈 Metrics: Transaction and performance metrics")
    print("   - 🖥️ Nodes: Node network visualization")
    print("   - 🏠 HTML Dashboard: http://localhost:4000")
    print("\n⚠️  Press Ctrl+C to stop the dashboard\n")
    
    app.run(debug=False, host="0.0.0.0", port=8050)