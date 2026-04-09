# Multi-Vendor Firewall Dashboard & Operations Tool

A production-grade firewall management tool supporting Palo Alto PAN-OS and Fortinet FortiOS firewalls. Built with Go and vanilla JavaScript.

## Features

- **Multi-Vendor Support**: Palo Alto and Fortinet firewalls
- **Live & Demo Modes**: Test with real devices or use realistic mock data
- **Real-time Dashboard**: CPU, memory, sessions, and alerts
- **Inventory Management**: Device information and status
- **License Monitoring**: Subscription and feature license status
- **Log Viewer**: Traffic, threat, and system logs with filtering
- **CLI Execution**: Run commands and get real output
- **Configuration Viewer**: Policies, NAT rules, and objects
- **Copy to Clipboard**: Every output includes copy functionality
- **Air-Gap Ready**: Single binary, no external dependencies

## Installation

### Prerequisites
- Go 1.21 or higher

### Build from Source

```bash
# Clone the repository
git clone https://github.com/your-repo/firewall-dashboard.git
cd firewall-dashboard

# Build the binary
go build -o firewall-dashboard cmd/main.go

# Run the application
./firewall-dashboard


The application will automatically open in your default browser at http://localhost:8080

Usage Guide
1. Select Vendor
Choose between Palo Alto or Fortinet firewall.

2. Choose Mode
Live Mode: Connect to real firewalls using API

Demo Mode: Use realistic mock data (no connection needed)

3. Configure Connection
Palo Alto Configuration
Option 1 - API Key: Enter firewall IP and API key

Option 2 - Username/Password: Enter credentials to auto-generate API key

Click "Test Connection" to verify

Fortinet Configuration
Enter firewall IP and API token

Specify port (default: 443)

Click "Test Connection" to verify

4. Dashboard Features
Dashboard Tab
Real-time CPU, memory, and session metrics

Active alerts and HA status

Inventory Tab
Device hostname, model, serial number

OS version and uptime

Licenses Tab
Active subscriptions and feature licenses

Expiration dates

Logs Tab
Filter by log type (traffic/threat/system)

Adjust result limit (20-100 entries)

Pagination and time range filtering

CLI Tab
Execute supported commands:

Palo Alto: show system info, show running security-policy

Fortinet: get system status, show firewall policy

View raw API responses

Configuration Tab
View security policies

NAT rules and address objects

Highlight disabled/unused rules

Sample Inputs
Palo Alto (Live Mode)
IP: 192.168.1.1

API Key: LUFRPT1...

Username: admin

Password: your-password

Fortinet (Live Mode)
IP: 192.168.1.1

Token: your-api-token

Port: 443

Troubleshooting
Connection Failed
Verify firewall IP is reachable

Check API credentials

Ensure API access is enabled on firewall

For self-signed certificates, the tool accepts them (testing only)

Authentication Issues
Palo Alto: Generate new API key via username/password

Fortinet: Verify API token permissions (needs at least read access)

SSL/TLS Errors
The tool accepts self-signed certificates for testing

For production, use valid certificates

Demo Mode Not Loading
Verify mock JSON files exist in mock/ directory

Check file permissions

Security Considerations
Local Operation Only: Runs on localhost, no external communication

Credential Storage: Credentials stored in memory only (no persistence)

Air-Gapped Environments: Works without internet access

API Keys: Never logged or stored to disk

API Endpoints
Common
GET /api/health - Health check

POST /api/mode - Set mode (live/demo)

Palo Alto
POST /api/paloalto/test - Test connection

GET /api/paloalto/dashboard - Get metrics

GET /api/paloalto/inventory - Get device info

GET /api/paloalto/licenses - Get licenses

GET /api/paloalto/logs - Get logs

POST /api/paloalto/cli - Execute CLI

GET /api/paloalto/config - Get configuration

Fortinet
Similar endpoints under /api/fortinet/

Development
Project Structure
text
firewall-dashboard/
├── cmd/              # Main entry point
├── internal/         # Vendor-specific logic
│   ├── common/       # Shared models
│   ├── paloalto/     # Palo Alto implementation
│   └── fortinet/     # Fortinet implementation
├── static/           # Frontend assets
├── mock/             # Demo mode data
└── README.md
Adding New Vendors
Create new package in internal/

Implement client interface with required methods

Add API handlers

Update frontend vendor selection

License
MIT License - Use freely in enterprise environments.

Support
For issues or feature requests, please open an issue on GitHub.

Built for network and security engineers by engineers.

text

## Building and Running

To build and run the application:

```bash
# Navigate to the project root
cd firewall-dashboard

# Build the binary
go build -o firewall-dashboard cmd/main.go

# Run the application
./firewall-dashboard
The tool will automatically open http://localhost:8080 in your default browser.

Important Notes
Live Mode: Requires valid firewall credentials and network access

Demo Mode: Uses mock data files - perfect for testing and demonstrations

Security: Credentials are stored in memory only and never persisted

Production Use: Test thoroughly in your environment before deploying to production

This tool provides real operational value for network engineers managing multi-vendor firewall environments, serving as a lightweight alternative to expensive management platforms.

