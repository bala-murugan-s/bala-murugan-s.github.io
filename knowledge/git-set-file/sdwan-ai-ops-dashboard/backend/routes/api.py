"""
API Routes for SD-WAN Operations Dashboard
"""
from flask import Blueprint, request, jsonify
from services.sdwan_service import simulate_fetch, get_dashboard_summary, load_sample_data
from agents.sdwan_agent import analyze

api_bp = Blueprint("api", __name__)

# In-memory session store (use Redis/DB in production)
_session = {}


@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "sdwan-ai-ops-dashboard"})


@api_bp.route("/setup", methods=["POST"])
def setup():
    """Save device connection details."""
    body = request.get_json(force=True)
    device_url = body.get("device_url", "").strip()
    username = body.get("username", "").strip()
    password = body.get("password", "").strip()

    if not device_url or not username or not password:
        return jsonify({"error": "device_url, username, and password are required"}), 400

    # Normalize URL
    if not device_url.startswith("http"):
        device_url = "https://" + device_url

    _session["device_url"] = device_url
    _session["username"] = username
    _session["password"] = password
    _session["data"] = None

    return jsonify({
        "message": "Device configuration saved successfully",
        "device_url": device_url,
        "username": username,
    })


@api_bp.route("/fetch-data", methods=["POST"])
def fetch_data():
    """Simulate fetching data from the SD-WAN controller."""
    if not _session.get("device_url"):
        return jsonify({"error": "No device configured. Please complete setup first."}), 400

    try:
        data = simulate_fetch(
            device_url=_session["device_url"],
            username=_session["username"],
            password=_session["password"],
        )
        _session["data"] = data
        return jsonify({
            "message": "Data fetched successfully",
            "device_count": len(data.get("devices", [])),
            "fetched_at": data.get("fetched_at"),
        })
    except PermissionError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": f"Fetch failed: {str(e)}"}), 500


@api_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """Return complete processed dashboard data with AI insights."""
    data = _session.get("data")
    if not data:
        # Allow demo mode: auto-load sample data if not fetched yet
        data = load_sample_data()
        from datetime import datetime, timezone
        data["fetched_at"] = datetime.now(timezone.utc).isoformat()
        data["source_url"] = "demo://sample-data"

    summary = get_dashboard_summary(data)
    insights = analyze(data)

    return jsonify({
        "summary": summary,
        "devices": data.get("devices", []),
        "policies": data.get("policies", []),
        "templates": data.get("templates", []),
        "logs": data.get("logs", []),
        "licenses": data.get("licenses", []),
        "insights": insights,
        "fetched_at": data.get("fetched_at"),
        "source_url": data.get("source_url", _session.get("device_url", "demo")),
    })


@api_bp.route("/demo", methods=["POST"])
def demo():
    """Load demo data without requiring setup."""
    data = load_sample_data()
    from datetime import datetime, timezone
    data["fetched_at"] = datetime.now(timezone.utc).isoformat()
    data["source_url"] = "demo://cisco-sdwan-lab"
    _session["data"] = data
    _session["device_url"] = "demo://cisco-sdwan-lab"
    _session["username"] = "demo"
    _session["password"] = "demo"
    return jsonify({"message": "Demo data loaded", "fetched_at": data["fetched_at"]})
