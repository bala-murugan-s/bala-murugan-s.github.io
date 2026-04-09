"""
SD-WAN AI Agent
Analyzes device telemetry, logs, and policies to surface actionable insights.
"""
from datetime import datetime, timezone


SEVERITY_CRITICAL = "critical"
SEVERITY_HIGH = "high"
SEVERITY_MEDIUM = "medium"
SEVERITY_LOW = "low"
SEVERITY_INFO = "info"


def analyze(data: dict) -> list[dict]:
    """
    Run all analysis checks against the SD-WAN dataset.
    Returns a list of insight objects sorted by severity.
    """
    insights = []

    insights.extend(_check_devices_down(data.get("devices", [])))
    insights.extend(_check_frequent_reboots(data.get("devices", [])))
    insights.extend(_check_high_resource_usage(data.get("devices", [])))
    insights.extend(_check_degraded_wan_links(data.get("devices", [])))
    insights.extend(_check_unused_policies(data.get("policies", [])))
    insights.extend(_check_unused_templates(data.get("templates", [])))
    insights.extend(_check_software_version_drift(data.get("devices", [])))
    insights.extend(_check_license_expiry(data.get("licenses", [])))
    insights.extend(_check_tunnel_health(data.get("devices", [])))

    severity_order = {
        SEVERITY_CRITICAL: 0,
        SEVERITY_HIGH: 1,
        SEVERITY_MEDIUM: 2,
        SEVERITY_LOW: 3,
        SEVERITY_INFO: 4,
    }
    insights.sort(key=lambda x: severity_order.get(x["severity"], 99))

    for i, insight in enumerate(insights):
        insight["id"] = f"insight-{i+1:03d}"

    return insights


def _make_insight(severity: str, category: str, title: str, description: str, affected: list, recommendation: str) -> dict:
    return {
        "severity": severity,
        "category": category,
        "title": title,
        "description": description,
        "affected": affected,
        "recommendation": recommendation,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _check_devices_down(devices: list) -> list:
    insights = []
    down_devices = [d for d in devices if d.get("status") == "down"]
    if down_devices:
        names = [d["hostname"] for d in down_devices]
        insights.append(_make_insight(
            severity=SEVERITY_CRITICAL,
            category="Availability",
            title=f"{len(down_devices)} Device(s) Offline",
            description=f"{len(down_devices)} SD-WAN edge device(s) are currently unreachable: {', '.join(names)}. All WAN links on these devices are reporting down.",
            affected=names,
            recommendation="Immediately investigate physical connectivity, power status, and upstream ISP/MPLS circuits. Consider dispatching on-site personnel if remote access is unavailable."
        ))
    return insights


def _check_frequent_reboots(devices: list) -> list:
    insights = []
    threshold = 3
    flagged = [d for d in devices if d.get("reboot_count_7d", 0) > threshold]
    for device in flagged:
        count = device["reboot_count_7d"]
        severity = SEVERITY_CRITICAL if count >= 6 else SEVERITY_HIGH
        insights.append(_make_insight(
            severity=severity,
            category="Stability",
            title=f"Excessive Reboots: {device['hostname']}",
            description=f"{device['hostname']} at {device['site']} has rebooted {count} times in the past 7 days (threshold: {threshold}). This indicates instability that may impact branch connectivity.",
            affected=[device["hostname"]],
            recommendation="Review crash logs, check for memory leaks, validate recent config changes, and consider OS upgrade or RMA if hardware fault is suspected."
        ))
    return insights


def _check_high_resource_usage(devices: list) -> list:
    insights = []
    cpu_threshold = 80
    mem_threshold = 85
    flagged = [
        d for d in devices
        if d.get("status") != "down" and (
            d.get("cpu_percent", 0) >= cpu_threshold or
            d.get("memory_percent", 0) >= mem_threshold
        )
    ]
    for device in flagged:
        cpu = device.get("cpu_percent", 0)
        mem = device.get("memory_percent", 0)
        metrics = []
        if cpu >= cpu_threshold:
            metrics.append(f"CPU at {cpu}%")
        if mem >= mem_threshold:
            metrics.append(f"Memory at {mem}%")
        insights.append(_make_insight(
            severity=SEVERITY_HIGH,
            category="Performance",
            title=f"High Resource Usage: {device['hostname']}",
            description=f"{device['hostname']} at {device['site']} is experiencing high resource utilization: {', '.join(metrics)}. This may degrade SD-WAN data plane performance.",
            affected=[device["hostname"]],
            recommendation="Investigate top processes consuming resources, review DPI/firewall inspection load, consider traffic offloading, or evaluate hardware upgrade."
        ))
    return insights


def _check_degraded_wan_links(devices: list) -> list:
    insights = []
    for device in devices:
        if device.get("status") == "down":
            continue
        degraded_links = [
            link for link in device.get("wan_links", [])
            if link.get("status") == "degraded" or link.get("loss_percent", 0) > 2.0 or link.get("latency_ms", 0) > 100
        ]
        for link in degraded_links:
            insights.append(_make_insight(
                severity=SEVERITY_MEDIUM,
                category="WAN Health",
                title=f"Degraded WAN Link: {link['name']} on {device['hostname']}",
                description=f"Link '{link['name']}' on {device['hostname']} is underperforming: {link['loss_percent']}% packet loss, {link['latency_ms']}ms latency. Status: {link['status']}.",
                affected=[f"{device['hostname']} → {link['name']}"],
                recommendation="Contact ISP to investigate link quality. Validate SLA metrics and consider increasing weight on healthier paths in the SD-WAN policy."
            ))
    return insights


def _check_unused_policies(policies: list) -> list:
    insights = []
    unused = [p for p in policies if p.get("applied_devices", 0) == 0]
    if unused:
        names = [p["name"] for p in unused]
        insights.append(_make_insight(
            severity=SEVERITY_LOW,
            category="Policy Hygiene",
            title=f"{len(unused)} Unused Policy(ies) Detected",
            description=f"The following policies are not applied to any device and may be stale: {', '.join(names)}. Unused policies clutter the policy database and can cause confusion.",
            affected=names,
            recommendation="Review and archive or delete unused policies. Document the reason for retention if needed for compliance."
        ))
    return insights


def _check_unused_templates(templates: list) -> list:
    insights = []
    unused = [t for t in templates if t.get("applied_count", 0) == 0]
    if unused:
        names = [t["name"] for t in unused]
        insights.append(_make_insight(
            severity=SEVERITY_LOW,
            category="Configuration Hygiene",
            title=f"{len(unused)} Unused Template(s) Detected",
            description=f"The following device/feature templates have zero applied devices: {', '.join(names)}. Stale templates add maintenance overhead.",
            affected=names,
            recommendation="Audit and remove deprecated templates. Ensure template versioning is documented in your change management system."
        ))
    return insights


def _check_software_version_drift(devices: list) -> list:
    insights = []
    up_devices = [d for d in devices if d.get("status") != "down"]
    versions = {}
    for d in up_devices:
        v = d.get("software_version", "unknown")
        versions.setdefault(v, []).append(d["hostname"])

    if len(versions) > 1:
        # Find the most common version (assumed to be target)
        dominant = max(versions, key=lambda v: len(versions[v]))
        drifted = {v: hosts for v, hosts in versions.items() if v != dominant}
        drifted_hosts = [h for hosts in drifted.values() for h in hosts]
        drifted_versions = list(drifted.keys())
        insights.append(_make_insight(
            severity=SEVERITY_MEDIUM,
            category="Compliance",
            title="Software Version Drift Detected",
            description=f"Not all devices are running the same software version. Target version appears to be {dominant}. Devices on non-standard versions ({', '.join(drifted_versions)}): {', '.join(drifted_hosts)}.",
            affected=drifted_hosts,
            recommendation="Schedule a maintenance window to upgrade non-compliant devices. Standardize on the latest stable release across all edge nodes."
        ))
    return insights


def _check_license_expiry(licenses: list) -> list:
    insights = []
    today = datetime.now(timezone.utc)
    for lic in licenses:
        try:
            expiry = datetime.fromisoformat(lic["expiry"]).replace(tzinfo=timezone.utc)
            days_left = (expiry - today).days
            if days_left <= 90:
                severity = SEVERITY_CRITICAL if days_left <= 30 else SEVERITY_HIGH if days_left <= 60 else SEVERITY_MEDIUM
                insights.append(_make_insight(
                    severity=severity,
                    category="Licensing",
                    title=f"License Expiring Soon: {lic['type']}",
                    description=f"License '{lic['type']}' expires in {days_left} days ({lic['expiry']}). Currently {lic['used']} of {lic['total']} seats used.",
                    affected=[lic["type"]],
                    recommendation="Initiate renewal process with Cisco/vendor. Involve procurement and ensure continuity of SD-WAN feature availability."
                ))
        except (KeyError, ValueError):
            pass
    return insights


def _check_tunnel_health(devices: list) -> list:
    insights = []
    down_with_tunnels = [d for d in devices if d.get("status") == "up" and d.get("tunnel_count", 0) < 4]
    for device in down_with_tunnels:
        if device.get("tunnel_count", 0) == 0:
            insights.append(_make_insight(
                severity=SEVERITY_HIGH,
                category="Tunnel Health",
                title=f"Zero Active Tunnels: {device['hostname']}",
                description=f"{device['hostname']} at {device['site']} shows device status as up but has no active SD-WAN tunnels. This indicates control plane issues.",
                affected=[device["hostname"]],
                recommendation="Check SD-WAN controller connectivity, validate BFD sessions, and review OMP peering status with the vSmart controller."
            ))
    return insights
