"""
SD-WAN Data Service
Handles loading sample data and simulating device connectivity.
In production, replace simulate_fetch() with real API calls to vManage/orchestrator.
"""
import json
import os
import time
import random
from datetime import datetime, timezone

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "sample_data.json")


def load_sample_data() -> dict:
    """Load the realistic sample dataset from JSON file."""
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def simulate_fetch(device_url: str, username: str, password: str) -> dict:
    """
    Simulate fetching data from an SD-WAN controller (e.g., Cisco vManage).
    
    In a real deployment, this would:
    1. POST to {device_url}/j_spring_security_check to authenticate
    2. GET /dataservice/device to list devices
    3. GET /dataservice/statistics/interface for telemetry
    4. GET /dataservice/template/policy/vedge for policies
    
    For this demo, we simulate network latency and return realistic data.
    """
    # Simulate authentication + data fetch latency
    time.sleep(random.uniform(0.8, 2.0))

    # Simulate occasional auth failures for realism
    if username == "wrong" or password == "wrong":
        raise PermissionError("Authentication failed: Invalid credentials")

    data = load_sample_data()

    # Add some randomness to make repeated fetches feel live
    for device in data["devices"]:
        if device["status"] == "up":
            device["cpu_percent"] = min(99, max(5, device["cpu_percent"] + random.randint(-5, 5)))
            device["memory_percent"] = min(99, max(10, device["memory_percent"] + random.randint(-3, 3)))
            for link in device.get("wan_links", []):
                if link["status"] == "up":
                    link["latency_ms"] = max(1, link["latency_ms"] + random.randint(-2, 2))
                    link["loss_percent"] = max(0.0, round(link["loss_percent"] + random.uniform(-0.1, 0.1), 2))

    data["fetched_at"] = datetime.now(timezone.utc).isoformat()
    data["source_url"] = device_url
    return data


def get_dashboard_summary(data: dict) -> dict:
    """Compute summary statistics from raw SD-WAN data."""
    devices = data.get("devices", [])
    total = len(devices)
    up = sum(1 for d in devices if d["status"] == "up")
    down = sum(1 for d in devices if d["status"] == "down")
    warning = sum(1 for d in devices if d["status"] == "warning")

    all_links = [link for d in devices for link in d.get("wan_links", [])]
    degraded_links = sum(1 for l in all_links if l["status"] in ("down", "degraded"))
    total_tunnels = sum(d.get("tunnel_count", 0) for d in devices)

    policies = data.get("policies", [])
    active_policies = sum(1 for p in policies if p.get("active"))
    unused_policies = sum(1 for p in policies if p.get("applied_devices", 0) == 0)

    return {
        "devices": {
            "total": total,
            "up": up,
            "down": down,
            "warning": warning,
            "availability_pct": round((up / total * 100) if total > 0 else 0, 1),
        },
        "wan": {
            "total_links": len(all_links),
            "degraded_links": degraded_links,
            "total_tunnels": total_tunnels,
        },
        "policies": {
            "total": len(policies),
            "active": active_policies,
            "unused": unused_policies,
        },
        "templates": {
            "total": len(data.get("templates", [])),
        },
        "licenses": data.get("licenses", []),
        "fetched_at": data.get("fetched_at"),
    }
