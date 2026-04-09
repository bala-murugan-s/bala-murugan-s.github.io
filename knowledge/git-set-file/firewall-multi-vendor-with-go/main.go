package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"firewall-dashboard/internal/common"
	"firewall-dashboard/internal/fortinet"
	"firewall-dashboard/internal/paloalto"
)

//go:embed static/*
var staticFS embed.FS

//go:embed mock/*
var mockFS embed.FS

var (
	globalMode  = "demo" // demo or live
	paloCfg     *common.PaloAltoConfig
	fortiCfg    *common.FortinetConfig
	configMutex sync.RWMutex
	paloClient  *paloalto.Client
	fortiClient *fortinet.Client
)

func main() {
	// Initialize configs
	paloCfg = &common.PaloAltoConfig{}
	fortiCfg = &common.FortinetConfig{}

	// Setup routes
	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/api/health", healthHandler)
	http.HandleFunc("/api/mode", modeHandler)

	// Palo Alto routes
	http.HandleFunc("/api/paloalto/test", paloaltoTestHandler)
	http.HandleFunc("/api/paloalto/dashboard", paloaltoDashboardHandler)
	http.HandleFunc("/api/paloalto/inventory", paloaltoInventoryHandler)
	http.HandleFunc("/api/paloalto/licenses", paloaltoLicensesHandler)
	http.HandleFunc("/api/paloalto/logs", paloaltoLogsHandler)
	http.HandleFunc("/api/paloalto/cli", paloaltoCLIHandler)
	http.HandleFunc("/api/paloalto/config", paloaltoConfigHandler)

	// Fortinet routes
	http.HandleFunc("/api/fortinet/test", fortinetTestHandler)
	http.HandleFunc("/api/fortinet/dashboard", fortinetDashboardHandler)
	http.HandleFunc("/api/fortinet/inventory", fortinetInventoryHandler)
	http.HandleFunc("/api/fortinet/licenses", fortinetLicensesHandler)
	http.HandleFunc("/api/fortinet/logs", fortinetLogsHandler)
	http.HandleFunc("/api/fortinet/cli", fortinetCLIHandler)
	http.HandleFunc("/api/fortinet/config", fortinetConfigHandler)

	// Serve static files with correct MIME types
	http.Handle("/css/", serveStaticWithMIME("/css/"))
	http.Handle("/js/", serveStaticWithMIME("/js/"))

	// Start server
	addr := "localhost:14080"
	log.Printf("Starting firewall dashboard on http://%s", addr)

	// Auto-open browser
	go openBrowser("http://" + addr)

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}

// Custom handler to serve static files with correct MIME types
func serveStaticWithMIME(prefix string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Remove prefix from path
		path := strings.TrimPrefix(r.URL.Path, prefix)

		// Read file from embedded FS
		var filePath string
		if strings.HasPrefix(prefix, "/css") {
			filePath = fmt.Sprintf("static/css/%s", path)
		} else if strings.HasPrefix(prefix, "/js") {
			filePath = fmt.Sprintf("static/js/%s", path)
		} else {
			filePath = fmt.Sprintf("static/%s", path)
		}

		data, err := staticFS.ReadFile(filePath)
		if err != nil {
			http.Error(w, "File not found", http.StatusNotFound)
			return
		}

		// Set correct MIME type based on file extension
		ext := filepath.Ext(path)
		switch ext {
		case ".css":
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		case ".js":
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		case ".html":
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
		case ".json":
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
		case ".png":
			w.Header().Set("Content-Type", "image/png")
		case ".jpg", ".jpeg":
			w.Header().Set("Content-Type", "image/jpeg")
		case ".svg":
			w.Header().Set("Content-Type", "image/svg+xml")
		default:
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		}

		w.Write(data)
	})
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	data, err := staticFS.ReadFile("static/index.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func modeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Mode string `json:"mode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Mode != "live" && req.Mode != "demo" {
		http.Error(w, "Mode must be 'live' or 'demo'", http.StatusBadRequest)
		return
	}

	globalMode = req.Mode
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"mode": globalMode})
}

func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Printf("Failed to open browser: %v", err)
	}
}

// Helper function to read mock files
func readMockFile(vendor, filename string) ([]byte, error) {
	path := fmt.Sprintf("mock/%s/%s", vendor, filename)
	return mockFS.ReadFile(path)
}

// Palo Alto Handlers
func paloaltoTestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req common.PaloAltoConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	configMutex.Lock()
	defer configMutex.Unlock()

	*paloCfg = req

	if globalMode == "live" {
		client, err := paloalto.NewClient(req.IP, req.APIKey, req.Username, req.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		paloClient = client

		// Test connection
		if err := client.TestConnection(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "connected"})
}

func paloaltoDashboardHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("paloalto", "dashboard.json")
		if err != nil {
			// Return default mock data if file not found
			defaultData := `{"cpu":45.2,"memory":62.8,"sessions":12453,"status":"active","haStatus":"active-passive","alerts":[]}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := paloClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected. Please test connection first.", http.StatusBadRequest)
		return
	}

	dashboard, err := client.GetDashboard()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dashboard)
}

func paloaltoInventoryHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("paloalto", "inventory.json")
		if err != nil {
			defaultData := `{"hostname":"PA-VM-Demo","ip":"192.168.1.100","model":"PA-VM","serial":"DEMO001","osVersion":"PAN-OS 10.2.5","uptime":"45 days"}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := paloClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	inventory, err := client.GetInventory()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(inventory)
}

func paloaltoLicensesHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("paloalto", "licenses.json")
		if err != nil {
			defaultData := `[{"name":"Threat Prevention","status":"active","expiration":"2025-12-31","description":"IPS, Anti-Malware"}]`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := paloClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	licenses, err := client.GetLicenses()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(licenses)
}

func paloaltoLogsHandler(w http.ResponseWriter, r *http.Request) {
	logType := r.URL.Query().Get("type")
	if logType == "" {
		logType = "traffic"
	}
	limit := r.URL.Query().Get("limit")
	if limit == "" {
		limit = "50"
	}

	if globalMode == "demo" {
		data, err := readMockFile("paloalto", "logs.json")
		if err != nil {
			defaultData := `[{"timestamp":"2025-04-05T10:30:15Z","sourceIP":"10.0.1.25","destIP":"8.8.8.8","sourcePort":54321,"destPort":443,"protocol":"TCP","action":"allow"}]`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := paloClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	logs, err := client.GetLogs(logType, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func paloaltoCLIHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Command string `json:"command"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if globalMode == "demo" {
		data, err := readMockFile("paloalto", "cli.json")
		if err != nil {
			defaultData := `{"output":"PAN-OS 10.2.5\nHostname: PA-VM-Demo\nCPU Load: 45%\nMemory Usage: 62%"}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := paloClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	output, err := client.ExecuteCLI(req.Command)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}

func paloaltoConfigHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("paloalto", "config.json")
		if err != nil {
			defaultData := `{"policies":[{"name":"Allow-Outbound","from":"trust","to":"untrust","source":"10.0.0.0/8","destination":"any","service":"any","action":"allow","disabled":false,"unused":false}]}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := paloClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	config, err := client.GetConfig()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// Fortinet Handlers
func fortinetTestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req common.FortinetConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Port == 0 {
		req.Port = 443
	}

	configMutex.Lock()
	defer configMutex.Unlock()

	*fortiCfg = req

	if globalMode == "live" {
		client, err := fortinet.NewClient(req.IP, req.Token, req.Port)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		fortiClient = client

		// Test connection
		if err := client.TestConnection(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "connected"})
}

func fortinetDashboardHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("fortinet", "dashboard.json")
		if err != nil {
			defaultData := `{"cpu":38.5,"memory":55.2,"sessions":8762,"status":"active","alerts":[]}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := fortiClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	dashboard, err := client.GetDashboard()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dashboard)
}

func fortinetInventoryHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("fortinet", "inventory.json")
		if err != nil {
			defaultData := `{"hostname":"FG-Demo","ip":"192.168.1.200","model":"FortiGate-100D","serial":"DEMO002","osVersion":"FortiOS v7.2.5","uptime":"62 days"}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := fortiClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	inventory, err := client.GetInventory()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(inventory)
}

func fortinetLicensesHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("fortinet", "licenses.json")
		if err != nil {
			defaultData := `[{"name":"UTM Bundle","status":"active","expiration":"2025-10-31","description":"Antivirus, IPS, Web Filtering"}]`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := fortiClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	licenses, err := client.GetLicenses()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(licenses)
}

func fortinetLogsHandler(w http.ResponseWriter, r *http.Request) {
	logType := r.URL.Query().Get("type")
	if logType == "" {
		logType = "traffic"
	}
	limit := r.URL.Query().Get("limit")
	if limit == "" {
		limit = "50"
	}

	if globalMode == "demo" {
		data, err := readMockFile("fortinet", "logs.json")
		if err != nil {
			defaultData := `[{"timestamp":"2025-04-05T10:30:15Z","sourceIP":"10.0.1.25","destIP":"8.8.8.8","sourcePort":54321,"destPort":443,"protocol":"TCP","action":"accept"}]`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := fortiClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	logs, err := client.GetLogs(logType, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func fortinetCLIHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Command string `json:"command"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if globalMode == "demo" {
		data, err := readMockFile("fortinet", "cli.json")
		if err != nil {
			defaultData := `{"output":"FortiGate-100D\nVersion: FortiOS v7.2.5\nCPU: 38.5%\nMemory: 55.2%"}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := fortiClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	output, err := client.ExecuteCLI(req.Command)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"output": output})
}

func fortinetConfigHandler(w http.ResponseWriter, r *http.Request) {
	if globalMode == "demo" {
		data, err := readMockFile("fortinet", "config.json")
		if err != nil {
			defaultData := `{"policies":[{"name":"LAN to WAN","from":"internal","to":"external","source":"10.0.0.0/8","destination":"all","service":"ALL","action":"accept","disabled":false,"unused":false}]}`
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(defaultData))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}

	configMutex.RLock()
	client := fortiClient
	configMutex.RUnlock()

	if client == nil {
		http.Error(w, "Not connected", http.StatusBadRequest)
		return
	}

	config, err := client.GetConfig()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}
