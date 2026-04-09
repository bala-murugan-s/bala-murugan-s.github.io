# SD-WAN AI Ops Dashboard

A production-ready, full-stack SD-WAN operations dashboard with an AI agent that detects anomalies, surfaces insights, and helps network engineers act faster.

```
Clone → Install → Run → See working SD-WAN dashboard with AI insights
```

---

## Screenshots

| Setup Wizard | Dashboard Overview | AI Insights |
|---|---|---|
| Connect to your SD-WAN controller or load demo data | Summary cards, device health, license usage | AI-generated findings with recommendations |

---

## Features

- **Setup Wizard** — Connect to a real vManage controller or load the built-in demo dataset instantly
- **Live Dashboard** — Device status, CPU/memory utilization, WAN link health, tunnel counts
- **AI Insights Panel** — Automated anomaly detection with severity levels and remediation steps
- **Event Log** — Filterable log viewer with severity and event-type filters
- **Policy Audit** — Flags unused and stale policies across your SD-WAN fabric
- **License Tracker** — Visual usage bars with expiry monitoring
- **Re-fetch** — Hit the refresh button to simulate live data polling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, plain CSS |
| Backend | Python 3.11, Flask 3, Flask-CORS |
| Data | JSON (sample), in-memory session |
| Fonts | JetBrains Mono + Syne (Google Fonts) |
| Containers | Docker + Docker Compose (optional) |

---

## Quick Start (Recommended)

### Option A — Manual (No Docker)

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/sdwan-ai-ops-dashboard.git
cd sdwan-ai-ops-dashboard
```

**2. Start the backend**
```bash
cd backend
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
python app.py
```
Backend runs at: **http://localhost:5000**

**3. Start the frontend** (new terminal)
```bash
cd frontend
npm install
npm start
```
Frontend runs at: **http://localhost:3000**

**4. Open the dashboard**

Navigate to **http://localhost:3000** in your browser.

- Click **"Load Demo Dataset"** to explore immediately, or
- Enter a real vManage URL + credentials and click **"Connect & Fetch Data"**

---

### Option B — Docker Compose

```bash
git clone https://github.com/YOUR_USERNAME/sdwan-ai-ops-dashboard.git
cd sdwan-ai-ops-dashboard
docker-compose up --build
```

Open **http://localhost:3000**

---

## Project Structure

```
sdwan-ai-ops-dashboard/
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── routes/
│   │   └── api.py              # REST endpoints: /setup /fetch-data /dashboard /demo
│   ├── services/
│   │   └── sdwan_service.py    # Data loading, fetch simulation, summary stats
│   ├── agents/
│   │   └── sdwan_agent.py      # AI analysis engine — all insight logic lives here
│   └── data/
│       └── sample_data.json    # Realistic 6-device SD-WAN dataset
│
└── frontend/
    ├── package.json
    ├── Dockerfile
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css            # Global design tokens and base styles
        ├── App.js               # Route between Setup and Dashboard
        ├── utils/
        │   └── api.js           # Fetch wrapper for all API calls
        ├── pages/
        │   ├── SetupPage.js     # Connection wizard
        │   ├── SetupPage.css
        │   ├── DashboardPage.js # Main dashboard with tabs
        │   └── DashboardPage.css
        └── components/
            ├── SummaryCards.js  # Top-level KPI cards
            ├── SummaryCards.css
            ├── InsightsPanel.js # AI insights with expandable cards
            ├── InsightsPanel.css
            ├── DeviceTable.js   # Expandable device rows + WAN detail
            ├── DeviceTable.css
            ├── PolicyTable.js   # Policy audit table
            ├── PolicyTable.css
            ├── LogsTable.js     # Filterable event log
            └── LogsTable.css
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/setup` | Save controller URL + credentials |
| `POST` | `/api/fetch-data` | Simulate/execute data fetch from controller |
| `GET` | `/api/dashboard` | Return full processed data + AI insights |
| `POST` | `/api/demo` | Load sample dataset (no credentials needed) |

### Example: Load demo and get dashboard
```bash
# Load demo data
curl -X POST http://localhost:5000/api/demo

# Get full dashboard payload
curl http://localhost:5000/api/dashboard | python -m json.tool
```

---

## AI Agent Logic

The agent in `backend/agents/sdwan_agent.py` runs these checks:

| Check | Trigger | Severity |
|---|---|---|
| Devices offline | `status == "down"` | Critical |
| Excessive reboots | `reboot_count_7d > 3` | Critical / High |
| High CPU/memory | `cpu > 80%` or `mem > 85%` | High |
| Degraded WAN links | `loss > 2%` or `latency > 100ms` | Medium |
| Software version drift | Multiple versions across fleet | Medium |
| Unused policies | `applied_devices == 0` | Low |
| Stale templates | `applied_count == 0` | Low |
| License expiry | `days_to_expiry < 90` | Medium → Critical |
| Tunnel health | `status == up` but `tunnel_count == 0` | High |

Each insight includes:
- Severity level
- Category and title
- Detailed description with device names
- Actionable recommendation

---

## Extending This Project

**Add a real vManage integration:**
Replace `simulate_fetch()` in `sdwan_service.py` with actual REST calls:
```python
import requests
requests.post(f"{url}/j_spring_security_check", data={"j_username": u, "j_password": p})
requests.get(f"{url}/dataservice/device")
```

**Add new AI checks:**
Add a function to `sdwan_agent.py` following the `_check_*` pattern and call it from `analyze()`.

**Persist data:**
Replace the `_session` dict in `routes/api.py` with SQLite or Redis.

---

## Requirements

- Python 3.9+
- Node.js 18+
- npm 9+
- (Optional) Docker + Docker Compose

---

## License

MIT
