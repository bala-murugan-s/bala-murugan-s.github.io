package common

type PaloAltoConfig struct {
	IP       string `json:"ip"`
	APIKey   string `json:"apiKey"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type FortinetConfig struct {
	IP    string `json:"ip"`
	Token string `json:"token"`
	Port  int    `json:"port"`
}

type Dashboard struct {
	CPU      float64 `json:"cpu"`
	Memory   float64 `json:"memory"`
	Sessions int     `json:"sessions"`
	Status   string  `json:"status"`
	HAStatus string  `json:"haStatus,omitempty"`
	Alerts   []Alert `json:"alerts,omitempty"`
}

type Alert struct {
	Level   string `json:"level"`
	Message string `json:"message"`
	Time    string `json:"time"`
}

type Inventory struct {
	Hostname  string `json:"hostname"`
	IP        string `json:"ip"`
	Model     string `json:"model"`
	Serial    string `json:"serial"`
	OSVersion string `json:"osVersion"`
	Uptime    string `json:"uptime"`
}

type License struct {
	Name       string `json:"name"`
	Status     string `json:"status"`
	Expiration string `json:"expiration"`
	Description string `json:"description"`
}

type LogEntry struct {
	Timestamp   string `json:"timestamp"`
	SourceIP    string `json:"sourceIP"`
	DestIP      string `json:"destIP"`
	SourcePort  int    `json:"sourcePort"`
	DestPort    int    `json:"destPort"`
	Protocol    string `json:"protocol"`
	Action      string `json:"action"`
	ThreatName  string `json:"threatName,omitempty"`
	Severity    string `json:"severity,omitempty"`
}

type Policy struct {
	Name        string `json:"name"`
	From        string `json:"from"`
	To          string `json:"to"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
	Service     string `json:"service"`
	Action      string `json:"action"`
	Disabled    bool   `json:"disabled"`
	Unused      bool   `json:"unused"`
}