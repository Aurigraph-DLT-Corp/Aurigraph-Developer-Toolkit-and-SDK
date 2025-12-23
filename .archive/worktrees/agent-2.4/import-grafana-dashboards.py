#!/usr/bin/env python3
"""
Grafana Dashboard Import Script for Aurigraph V11
Sprint 16 Phase 1: Import 5 dashboards with 49 panels
"""

import json
import sys
import os
import requests
from typing import Dict, List, Any
from datetime import datetime

# Configuration
GRAFANA_URL = os.getenv("GRAFANA_URL", "http://localhost:3000")
GRAFANA_USER = os.getenv("GRAFANA_USER", "admin")
GRAFANA_PASSWORD = os.getenv("GRAFANA_PASSWORD", "admin")
DASHBOARD_CONFIG_FILE = "SPRINT-16-GRAFANA-DASHBOARDS.json"

# Color codes for terminal output
class Colors:
    BLUE = '\033[0;34m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'  # No Color

def log_info(msg: str):
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {msg}")

def log_success(msg: str):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {msg}")

def log_warning(msg: str):
    print(f"{Colors.YELLOW}[WARNING]{Colors.NC} {msg}")

def log_error(msg: str):
    print(f"{Colors.RED}[ERROR]{Colors.NC} {msg}")

def load_dashboard_config() -> Dict[str, Any]:
    """Load the dashboard configuration from JSON file"""
    log_info(f"Loading dashboard configuration from {DASHBOARD_CONFIG_FILE}")

    try:
        with open(DASHBOARD_CONFIG_FILE, 'r') as f:
            config = json.load(f)

        log_success(f"Loaded {len(config['dashboards'])} dashboards")
        log_info(f"Total panels: {config['metadata']['totalPanels']}")
        log_info(f"Total alerts: {config['metadata']['totalAlerts']}")

        return config
    except FileNotFoundError:
        log_error(f"Configuration file not found: {DASHBOARD_CONFIG_FILE}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        log_error(f"Invalid JSON in configuration file: {e}")
        sys.exit(1)

def convert_panel_to_grafana(panel: Dict[str, Any], dashboard_id: int, panel_idx: int) -> Dict[str, Any]:
    """Convert our panel format to Grafana panel format"""

    # Calculate grid position (3 columns layout)
    col = panel_idx % 3
    row = panel_idx // 3

    grafana_panel = {
        "id": panel["id"] + (dashboard_id * 100),  # Ensure unique IDs across dashboards
        "title": panel["title"],
        "type": map_panel_type(panel["type"]),
        "gridPos": {
            "h": 8,  # Height
            "w": 8,  # Width (24/3 = 8 for 3 columns)
            "x": col * 8,
            "y": row * 8
        },
        "targets": []
    }

    # Add targets (Prometheus queries)
    for idx, target in enumerate(panel.get("targets", [])):
        grafana_target = {
            "expr": target["expr"],
            "refId": chr(65 + idx),  # A, B, C, etc.
            "legendFormat": target.get("legendFormat", "")
        }
        grafana_panel["targets"].append(grafana_target)

    # Add field config for units and thresholds
    field_config = {
        "defaults": {
            "unit": panel.get("unit", "short"),
            "decimals": 2
        }
    }

    # Add thresholds if specified
    if "thresholds" in panel:
        threshold_values = panel["thresholds"].split(",")
        steps = [{"value": float(val), "color": get_threshold_color(i)}
                 for i, val in enumerate(threshold_values)]
        field_config["defaults"]["thresholds"] = {
            "mode": "absolute",
            "steps": steps
        }

    grafana_panel["fieldConfig"] = field_config

    # Add options based on panel type
    grafana_panel["options"] = get_panel_options(panel["type"])

    return grafana_panel

def map_panel_type(panel_type: str) -> str:
    """Map our panel types to Grafana panel types"""
    type_mapping = {
        "gauge": "gauge",
        "stat": "stat",
        "graph": "timeseries",
        "piechart": "piechart",
        "barchart": "barchart",
        "table": "table",
        "heatmap": "heatmap",
        "counter": "stat",
        "status": "stat"
    }
    return type_mapping.get(panel_type, "timeseries")

def get_threshold_color(index: int) -> str:
    """Get color for threshold step"""
    colors = ["red", "orange", "yellow", "green", "blue"]
    return colors[index % len(colors)]

def get_panel_options(panel_type: str) -> Dict[str, Any]:
    """Get default options for panel type"""
    if panel_type in ["gauge", "stat"]:
        return {
            "orientation": "auto",
            "textMode": "auto",
            "colorMode": "value",
            "graphMode": "area",
            "justifyMode": "auto"
        }
    elif panel_type == "graph":
        return {
            "legend": {
                "displayMode": "list",
                "placement": "bottom"
            },
            "tooltip": {
                "mode": "single"
            }
        }
    else:
        return {}

def convert_dashboard_to_grafana(dashboard: Dict[str, Any]) -> Dict[str, Any]:
    """Convert our dashboard format to Grafana dashboard format"""

    log_info(f"Converting dashboard: {dashboard['name']}")

    # Convert panels
    grafana_panels = []
    for idx, panel in enumerate(dashboard["panels"]):
        grafana_panel = convert_panel_to_grafana(panel, dashboard["id"], idx)
        grafana_panels.append(grafana_panel)

    # Create Grafana dashboard structure
    grafana_dashboard = {
        "dashboard": {
            "id": None,  # Let Grafana assign ID
            "uid": f"aurigraph-v11-{dashboard['id']}",
            "title": dashboard["name"],
            "description": dashboard["description"],
            "tags": ["aurigraph", "v11", "blockchain", "sprint-16"],
            "timezone": "browser",
            "schemaVersion": 39,
            "version": 1,
            "refresh": dashboard.get("refresh", "5s"),
            "time": {
                "from": "now-1h",
                "to": "now"
            },
            "panels": grafana_panels,
            "templating": {
                "list": []
            },
            "annotations": {
                "list": []
            }
        },
        "folderId": 0,
        "overwrite": True,
        "message": f"Imported from Sprint 16 - {datetime.now().isoformat()}"
    }

    log_success(f"Converted {len(grafana_panels)} panels for {dashboard['name']}")

    return grafana_dashboard

def import_dashboard(grafana_dashboard: Dict[str, Any]) -> bool:
    """Import dashboard to Grafana via API"""

    dashboard_title = grafana_dashboard["dashboard"]["title"]
    log_info(f"Importing dashboard: {dashboard_title}")

    try:
        response = requests.post(
            f"{GRAFANA_URL}/api/dashboards/db",
            auth=(GRAFANA_USER, GRAFANA_PASSWORD),
            headers={"Content-Type": "application/json"},
            json=grafana_dashboard,
            timeout=30
        )

        if response.status_code in [200, 201]:
            result = response.json()
            dashboard_url = f"{GRAFANA_URL}{result.get('url', '')}"
            log_success(f"Dashboard imported: {dashboard_title}")
            log_info(f"Dashboard URL: {dashboard_url}")
            return True
        else:
            log_error(f"Failed to import {dashboard_title}")
            log_error(f"Status: {response.status_code}")
            log_error(f"Response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        log_error(f"Network error importing {dashboard_title}: {e}")
        return False

def create_alert_rules(alert_rules: List[Dict[str, Any]]) -> int:
    """Create alert rules in Grafana"""

    log_info(f"Creating {len(alert_rules)} alert rules...")

    success_count = 0

    # Note: Grafana alerting API varies by version
    # This is a placeholder for the alert creation logic
    log_warning("Alert rule creation requires Grafana 8.0+ and unified alerting")
    log_info("Please create alert rules manually or use Grafana provisioning")

    # Display alert rules for manual creation
    for rule in alert_rules:
        log_info(f"Alert: {rule['name']} - {rule['severity']}")
        log_info(f"  Condition: {rule['condition']}")
        log_info(f"  Duration: {rule['for']}")

    return success_count

def main():
    """Main execution function"""

    print()
    log_info("=" * 60)
    log_info("Aurigraph V11 Grafana Dashboard Import")
    log_info("Sprint 16 Phase 1")
    log_info("=" * 60)
    print()

    # Load configuration
    config = load_dashboard_config()

    # Import each dashboard
    imported_count = 0
    total_panels = 0

    for dashboard in config["dashboards"]:
        grafana_dashboard = convert_dashboard_to_grafana(dashboard)

        if import_dashboard(grafana_dashboard):
            imported_count += 1
            total_panels += len(dashboard["panels"])

        print()  # Spacing between dashboards

    # Create alert rules
    alert_count = create_alert_rules(config.get("alertRules", []))

    # Summary
    print()
    log_info("=" * 60)
    log_success("Import Complete!")
    log_info("=" * 60)
    log_info(f"Dashboards imported: {imported_count}/{len(config['dashboards'])}")
    log_info(f"Total panels: {total_panels}")
    log_info(f"Alert rules: {len(config.get('alertRules', []))}")
    log_info(f"Grafana URL: {GRAFANA_URL}")
    print()

    if imported_count == len(config["dashboards"]):
        log_success("All dashboards imported successfully!")
        return 0
    else:
        log_warning("Some dashboards failed to import")
        return 1

if __name__ == "__main__":
    sys.exit(main())
