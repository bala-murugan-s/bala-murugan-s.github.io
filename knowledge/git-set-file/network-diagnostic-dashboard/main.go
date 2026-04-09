package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"embed"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

//go:embed static/*
var staticFiles embed.FS

type Server struct {
	httpServer *http.Server
}

type PingResult struct {
	Target     string  `json:"target"`
	Success    bool    `json:"success"`
	Latency    float64 `json:"latency_ms"`
	TTL        int     `json:"ttl"`
	PacketLoss float64 `json:"packet_loss"`
	Sent       int     `json:"sent"`
	Received   int     `json:"received"`
	Error      string  `json:"error,omitempty"`
}

type DNSResult struct {
	Domain      string   `json:"domain"`
	ARecords    []string `json:"a_records"`
	AAAARecords []string `json:"aaaa_records"`
	CNAME       string   `json:"cname"`
	MXRecords   []string `json:"mx_records"`
	NSRecords   []string `json:"ns_records"`
	TXTRecords  []string `json:"txt_records"`
	Error       string   `json:"error,omitempty"`
}

type PortScanResult struct {
	Host      string     `json:"host"`
	OpenPorts []PortInfo `json:"open_ports"`
	Closed    int        `json:"closed"`
	ScanTime  int64      `json:"scan_time_ms"`
}

type PortInfo struct {
	Port    int    `json:"port"`
	Service string `json:"service"`
}

type NetworkScanResult struct {
	Hosts    []LiveHost `json:"hosts"`
	Total    int        `json:"total"`
	ScanTime int64      `json:"scan_time_ms"`
}

type LiveHost struct {
	IP           string  `json:"ip"`
	Hostname     string  `json:"hostname,omitempty"`
	ResponseTime float64 `json:"response_time_ms"`
}

type CLIResult struct {
	Command string `json:"command"`
	Output  string `json:"output"`
	Error   string `json:"error,omitempty"`
}

type DiagnosticSummary struct {
	Connectivity string   `json:"connectivity"`
	Issues       []string `json:"issues"`
	Suggestions  []string `json:"suggestions"`
	Timestamp    int64    `json:"timestamp"`
}

type InterfaceInfo struct {
	Name string   `json:"name"`
	MAC  string   `json:"mac"`
	IPv4 []string `json:"ipv4"`
	IPv6 []string `json:"ipv6"`
	IsUp bool     `json:"is_up"`
	MTU  int      `json:"mtu"`
}

var serviceMap = map[int]string{
	20: "FTP-Data", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
	53: "DNS", 80: "HTTP", 88: "Kerberos", 110: "POP3", 111: "RPC",
	123: "NTP", 135: "MSRPC", 137: "NetBIOS-NS", 138: "NetBIOS-DGM",
	139: "NetBIOS", 143: "IMAP", 161: "SNMP", 162: "SNMP-Trap",
	389: "LDAP", 443: "HTTPS", 445: "SMB", 465: "SMTPS",
	587: "SMTP-TLS", 636: "LDAPS", 993: "IMAPS", 995: "POP3S",
	1433: "MSSQL", 1521: "Oracle", 2049: "NFS", 3306: "MySQL",
	3389: "RDP", 5432: "PostgreSQL", 5900: "VNC", 5985: "WinRM",
	6379: "Redis", 8080: "HTTP-Alt", 8443: "HTTPS-Alt", 27017: "MongoDB",
}

func main() {
	server := &Server{}

	// API routes
	http.HandleFunc("/api/health", server.handleHealth)
	http.HandleFunc("/api/interfaces", server.handleInterfaces)
	http.HandleFunc("/api/ping", server.handlePing)
	http.HandleFunc("/api/dns", server.handleDNS)
	http.HandleFunc("/api/port-scan", server.handlePortScan)
	http.HandleFunc("/api/network-scan", server.handleNetworkScan)
	http.HandleFunc("/api/cli", server.handleCLI)
	http.HandleFunc("/api/diagnostic", server.handleDiagnostic)
	http.HandleFunc("/api/traceroute", server.handleTraceroute)
	http.HandleFunc("/api/ssl", server.handleSSL)
	http.HandleFunc("/api/bulk-ping", server.handleBulkPing)
	http.HandleFunc("/api/bulk-dns", server.handleBulkDNS)

	// Static files - serve index.html for root
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			content, err := staticFiles.ReadFile("static/index.html")
			if err != nil {
				http.Error(w, "Could not load index.html", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/html")
			w.Write(content)
			return
		}

		// Serve other static files
		content, err := staticFiles.ReadFile("static" + r.URL.Path)
		if err != nil {
			http.NotFound(w, r)
			return
		}

		// Set content type based on extension
		if strings.HasSuffix(r.URL.Path, ".css") {
			w.Header().Set("Content-Type", "text/css")
		} else if strings.HasSuffix(r.URL.Path, ".js") {
			w.Header().Set("Content-Type", "application/javascript")
		}

		w.Write(content)
	})

	port := "21121"
	addr := ":" + port

	server.httpServer = &http.Server{
		Addr:         addr,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	// Open browser
	url := "http://localhost:" + port
	fmt.Printf("\n🔧 Network Diagnostic Tool\n")
	fmt.Printf("===============================\n")
	fmt.Printf("Server started successfully!\n")
	fmt.Printf("Open in browser: %s\n", url)
	fmt.Printf("Press Ctrl+C to stop the server\n\n")

	go openBrowser(url)

	if err := server.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Printf("Server error: %v\n", err)
		os.Exit(1)
	}
}

func openBrowser(url string) {
	time.Sleep(500 * time.Millisecond)
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Start()
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Unix(),
		"os":        runtime.GOOS,
	})
}

func (s *Server) handleInterfaces(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	interfaces, err := net.Interfaces()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var results []InterfaceInfo
	for _, iface := range interfaces {
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		var ipv4, ipv6 []string
		for _, addr := range addrs {
			ipnet, ok := addr.(*net.IPNet)
			if !ok {
				continue
			}
			if ipnet.IP.To4() != nil {
				ipv4 = append(ipv4, ipnet.IP.String())
			} else if ipnet.IP.To16() != nil {
				ipv6 = append(ipv6, ipnet.IP.String())
			}
		}

		results = append(results, InterfaceInfo{
			Name: iface.Name,
			MAC:  iface.HardwareAddr.String(),
			IPv4: ipv4,
			IPv6: ipv6,
			IsUp: iface.Flags&net.FlagUp != 0,
			MTU:  iface.MTU,
		})
	}

	json.NewEncoder(w).Encode(results)
}

func (s *Server) handlePing(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Host  string `json:"host"`
		Count int    `json:"count"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Host == "" {
		req.Host = "google.com"
	}
	if req.Count <= 0 {
		req.Count = 4
	}

	result := PingResult{
		Target: req.Host,
		Sent:   req.Count,
	}

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("ping", "-n", strconv.Itoa(req.Count), req.Host)
	} else {
		cmd = exec.Command("ping", "-c", strconv.Itoa(req.Count), req.Host)
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		result.Error = err.Error()
		result.Success = false
		json.NewEncoder(w).Encode(result)
		return
	}

	outputStr := string(output)
	result.Success = true

	// Parse ping output
	lines := strings.Split(outputStr, "\n")
	for _, line := range lines {
		if strings.Contains(line, "time=") || strings.Contains(line, "time<") {
			parts := strings.Split(line, "time=")
			if len(parts) > 1 {
				timePart := strings.Split(parts[1], " ")[0]
				timePart = strings.TrimSuffix(timePart, "ms")
				if t, err := strconv.ParseFloat(timePart, 64); err == nil {
					result.Latency = t
				}
			}
			if strings.Contains(line, "ttl=") {
				ttlParts := strings.Split(line, "ttl=")
				if len(ttlParts) > 1 {
					ttlStr := strings.Split(ttlParts[1], " ")[0]
					if ttl, err := strconv.Atoi(ttlStr); err == nil {
						result.TTL = ttl
					}
				}
			}
			result.Received++
		}
	}

	if result.Sent > 0 {
		result.PacketLoss = float64(result.Sent-result.Received) / float64(result.Sent) * 100
	}

	json.NewEncoder(w).Encode(result)
}

func (s *Server) handleDNS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Domain string `json:"domain"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Domain == "" {
		req.Domain = "google.com"
	}

	result := DNSResult{Domain: req.Domain}

	// A Records
	ips, err := net.LookupIP(req.Domain)
	if err == nil {
		for _, ip := range ips {
			if ip.To4() != nil {
				result.ARecords = append(result.ARecords, ip.String())
			} else {
				result.AAAARecords = append(result.AAAARecords, ip.String())
			}
		}
	}

	// CNAME
	cname, err := net.LookupCNAME(req.Domain)
	if err == nil && cname != "" {
		result.CNAME = strings.TrimSuffix(cname, ".")
	}

	// MX Records
	mxRecords, err := net.LookupMX(req.Domain)
	if err == nil {
		for _, mx := range mxRecords {
			result.MXRecords = append(result.MXRecords, fmt.Sprintf("%s (priority %d)", mx.Host, mx.Pref))
		}
	}

	// NS Records
	nsRecords, err := net.LookupNS(req.Domain)
	if err == nil {
		for _, ns := range nsRecords {
			result.NSRecords = append(result.NSRecords, ns.Host)
		}
	}

	// TXT Records
	txtRecords, err := net.LookupTXT(req.Domain)
	if err == nil {
		result.TXTRecords = txtRecords
	}

	json.NewEncoder(w).Encode(result)
}

func (s *Server) handlePortScan(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Host    string `json:"host"`
		Ports   []int  `json:"ports"`
		Timeout int    `json:"timeout"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Host == "" {
		req.Host = "localhost"
	}

	if len(req.Ports) == 0 {
		req.Ports = []int{22, 80, 443, 3306, 5432, 8080, 8443}
	}

	if req.Timeout <= 0 {
		req.Timeout = 1
	}

	startTime := time.Now()
	result := PortScanResult{Host: req.Host}

	var wg sync.WaitGroup
	var mu sync.Mutex
	semaphore := make(chan struct{}, 50)

	for _, port := range req.Ports {
		wg.Add(1)
		go func(p int) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			address := fmt.Sprintf("%s:%d", req.Host, p)
			conn, err := net.DialTimeout("tcp", address, time.Duration(req.Timeout)*time.Second)

			mu.Lock()
			defer mu.Unlock()

			if err == nil {
				conn.Close()
				service := serviceMap[p]
				if service == "" {
					service = "unknown"
				}
				result.OpenPorts = append(result.OpenPorts, PortInfo{
					Port:    p,
					Service: service,
				})
			} else {
				result.Closed++
			}
		}(port)
	}

	wg.Wait()
	result.ScanTime = time.Since(startTime).Milliseconds()

	json.NewEncoder(w).Encode(result)
}

func (s *Server) handleNetworkScan(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Subnet  string `json:"subnet"`
		Timeout int    `json:"timeout"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Subnet == "" {
		req.Subnet = "192.168.1.0/24"
	}

	if req.Timeout <= 0 {
		req.Timeout = 1
	}

	_, ipnet, err := net.ParseCIDR(req.Subnet)
	if err != nil {
		http.Error(w, "invalid subnet format", http.StatusBadRequest)
		return
	}

	startTime := time.Now()
	result := NetworkScanResult{}

	var ips []string
	ip := ipnet.IP.Mask(ipnet.Mask)
	for ip := ip.Mask(ipnet.Mask); ipnet.Contains(ip); inc(ip) {
		if ip[3] == 0 || ip[3] == 255 {
			continue
		}
		ips = append(ips, ip.String())
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	semaphore := make(chan struct{}, 20)

	for _, ipAddr := range ips {
		wg.Add(1)
		go func(ipAddr string) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:80", ipAddr), time.Duration(req.Timeout)*time.Second)

			mu.Lock()
			defer mu.Unlock()

			if err == nil {
				conn.Close()
				host := LiveHost{
					IP:           ipAddr,
					ResponseTime: float64(req.Timeout * 1000),
				}

				names, err := net.LookupAddr(ipAddr)
				if err == nil && len(names) > 0 {
					host.Hostname = strings.TrimSuffix(names[0], ".")
				}

				result.Hosts = append(result.Hosts, host)
				result.Total++
			}
		}(ipAddr)
	}

	wg.Wait()
	result.ScanTime = time.Since(startTime).Milliseconds()

	json.NewEncoder(w).Encode(result)
}

func inc(ip net.IP) {
	for j := len(ip) - 1; j >= 0; j-- {
		ip[j]++
		if ip[j] > 0 {
			break
		}
	}
}

func (s *Server) handleCLI(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Command string `json:"command"`
		Args    string `json:"args"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result := CLIResult{Command: req.Command + " " + req.Args}

	var cmd *exec.Cmd
	switch req.Command {
	case "ping":
		cmd = exec.Command("ping", strings.Fields(req.Args)...)
	case "netstat":
		if runtime.GOOS == "windows" {
			cmd = exec.Command("netstat", "-an")
		} else {
			cmd = exec.Command("netstat", "-tun")
		}
	case "ipconfig":
		if runtime.GOOS == "windows" {
			cmd = exec.Command("ipconfig", "/all")
		} else {
			cmd = exec.Command("ifconfig")
		}
	default:
		cmd = exec.Command(req.Command, strings.Fields(req.Args)...)
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		result.Error = err.Error()
	}
	result.Output = string(output)

	json.NewEncoder(w).Encode(result)
}

func (s *Server) handleDiagnostic(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	summary := DiagnosticSummary{
		Timestamp:   time.Now().Unix(),
		Issues:      []string{},
		Suggestions: []string{},
	}

	// Check internet connectivity
	_, err := net.DialTimeout("tcp", "8.8.8.8:53", 3*time.Second)
	if err != nil {
		summary.Connectivity = "Limited/No Internet"
		summary.Issues = append(summary.Issues, "Cannot reach external DNS servers")
		summary.Suggestions = append(summary.Suggestions, "Check your network connection and firewall settings")
	} else {
		summary.Connectivity = "Internet Connected"

		// Check DNS resolution
		_, err := net.LookupHost("google.com")
		if err != nil {
			summary.Issues = append(summary.Issues, "DNS resolution is failing")
			summary.Suggestions = append(summary.Suggestions, "Check DNS server configuration")
		} else {
			summary.Suggestions = append(summary.Suggestions, "DNS resolution is working properly")
		}
	}

	// Check local interfaces
	interfaces, err := net.Interfaces()
	if err == nil {
		hasUp := false
		for _, iface := range interfaces {
			if iface.Flags&net.FlagUp != 0 && iface.Flags&net.FlagLoopback == 0 {
				hasUp = true
				break
			}
		}
		if !hasUp {
			summary.Issues = append(summary.Issues, "No active network interfaces found")
			summary.Suggestions = append(summary.Suggestions, "Check if your network adapter is enabled")
		}
	}

	json.NewEncoder(w).Encode(summary)
}

// Traceroute endpoint
func (s *Server) handleTraceroute(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Host    string `json:"host"`
		MaxHops int    `json:"max_hops"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Host == "" {
		req.Host = "google.com"
	}
	if req.MaxHops <= 0 {
		req.MaxHops = 30
	}

	var hops []map[string]interface{}

	// Use system traceroute command with better parsing
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("tracert", "-d", "-h", strconv.Itoa(req.MaxHops), "-w", "1000", req.Host)
	} else {
		// Linux/Mac - use traceroute with numeric output
		cmd = exec.Command("traceroute", "-n", "-m", strconv.Itoa(req.MaxHops), "-w", "1", "-q", "1", req.Host)
	}

	output, err := cmd.CombinedOutput()
	outputStr := string(output)

	if err != nil {
		// If traceroute fails, try to at least show the first hop
		hops = append(hops, map[string]interface{}{
			"hop":     1,
			"address": req.Host,
			"rtt1":    0,
			"rtt2":    0,
			"rtt3":    0,
		})
		json.NewEncoder(w).Encode(hops)
		return
	}

	// Parse output line by line
	lines := strings.Split(outputStr, "\n")
	hopNum := 1

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Skip header lines
		if strings.Contains(line, "traceroute") || strings.Contains(line, "Tracing") ||
			strings.Contains(line, "over a maximum") || strings.Contains(line, "ms") == false {
			continue
		}

		// Extract hop number, IP, and RTT
		fields := strings.Fields(line)
		var hopAddr string
		var rtt float64

		for i, field := range fields {
			// Check if field looks like an IP address
			if strings.Count(field, ".") == 3 && !strings.Contains(field, "ms") {
				// Clean up the IP (remove any trailing punctuation)
				hopAddr = strings.Trim(field, ".*")
			}
			// Extract RTT value
			if strings.Contains(field, "ms") {
				rttStr := strings.TrimSuffix(field, "ms")
				rttStr = strings.TrimSuffix(rttStr, "ms")
				if val, parseErr := strconv.ParseFloat(rttStr, 64); parseErr == nil {
					rtt = val
				}
			}
			// Sometimes the hop number is in the first field
			if i == 0 && hopNum == 1 {
				if num, parseErr := strconv.Atoi(field); parseErr == nil {
					hopNum = num
				}
			}
		}

		// If we found an IP or RTT, add to results
		if hopAddr != "" || rtt > 0 {
			hops = append(hops, map[string]interface{}{
				"hop":     hopNum,
				"address": hopAddr,
				"rtt1":    rtt,
				"rtt2":    0,
				"rtt3":    0,
			})
			hopNum++
		}

		// Stop if we reached the destination
		if hopAddr == req.Host || strings.Contains(line, "reached") {
			break
		}

		// Limit hops
		if hopNum > req.MaxHops {
			break
		}
	}

	// If no hops were parsed, return a basic result
	if len(hops) == 0 {
		hops = append(hops, map[string]interface{}{
			"hop":     1,
			"address": req.Host,
			"rtt1":    0,
			"rtt2":    0,
			"rtt3":    0,
		})
	}

	json.NewEncoder(w).Encode(hops)
}

// SSL Certificate endpoint
func (s *Server) handleSSL(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Host string `json:"host"`
		Port int    `json:"port"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Host == "" {
		req.Host = "google.com"
	}
	if req.Port <= 0 {
		req.Port = 443
	}

	address := fmt.Sprintf("%s:%d", req.Host, req.Port)

	// Connect with TLS
	conf := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         req.Host,
	}

	conn, err := tls.DialWithDialer(&net.Dialer{Timeout: 10 * time.Second}, "tcp", address, conf)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		})
		return
	}
	defer conn.Close()

	// Get certificate
	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   "No certificate found",
		})
		return
	}

	cert := certs[0]

	// Parse certificate details
	subject := cert.Subject
	issuer := cert.Issuer

	// Get organization names
	issuerOrg := ""
	if len(issuer.Organization) > 0 {
		issuerOrg = issuer.Organization[0]
	}

	certInfo := map[string]interface{}{
		"subject_cn":          subject.CommonName,
		"issuer_o":            issuerOrg,
		"issuer_cn":           issuer.CommonName,
		"not_before":          cert.NotBefore.Format("2006-01-02 15:04:05 MST"),
		"not_after":           cert.NotAfter.Format("2006-01-02 15:04:05 MST"),
		"signature_algorithm": cert.SignatureAlgorithm.String(),
		"key_size":            getKeySize(cert),
		"san":                 cert.DNSNames,
	}

	// Get protocol and cipher
	connState := conn.ConnectionState()
	protocol := "TLS"
	switch connState.Version {
	case tls.VersionTLS13:
		protocol = "TLS 1.3"
	case tls.VersionTLS12:
		protocol = "TLS 1.2"
	case tls.VersionTLS11:
		protocol = "TLS 1.1"
	case tls.VersionTLS10:
		protocol = "TLS 1.0"
	}

	cipher := tls.CipherSuiteName(connState.CipherSuite)
	if cipher == "" {
		cipher = "Unknown"
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"protocol": protocol,
		"cipher":   cipher,
		"cert":     certInfo,
	})
}

func getKeySize(cert *x509.Certificate) string {
	switch key := cert.PublicKey.(type) {
	case *rsa.PublicKey:
		return fmt.Sprintf("%d-bit RSA", key.N.BitLen())
	case *ecdsa.PublicKey:
		return fmt.Sprintf("%d-bit ECDSA", key.Params().BitSize)
	default:
		return "N/A"
	}
}

// Bulk Ping endpoint
func (s *Server) handleBulkPing(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Hosts   []string `json:"hosts"`
		Count   int      `json:"count"`
		Timeout int      `json:"timeout"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(req.Hosts) == 0 {
		req.Hosts = []string{"google.com", "github.com", "cloudflare.com"}
	}
	if req.Count <= 0 {
		req.Count = 2
	}
	if req.Timeout <= 0 {
		req.Timeout = 2
	}

	results := make([]map[string]interface{}, 0)
	var mu sync.Mutex
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 10) // Limit concurrent pings

	for _, host := range req.Hosts {
		wg.Add(1)
		go func(h string) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			var cmd *exec.Cmd
			if runtime.GOOS == "windows" {
				cmd = exec.Command("ping", "-n", strconv.Itoa(req.Count), "-w", strconv.Itoa(req.Timeout*1000), h)
			} else {
				cmd = exec.Command("ping", "-c", strconv.Itoa(req.Count), "-W", strconv.Itoa(req.Timeout), h)
			}

			output, err := cmd.CombinedOutput()
			outputStr := string(output)

			result := map[string]interface{}{
				"host":    h,
				"success": err == nil,
				"output":  outputStr,
			}

			// Parse latency
			lines := strings.Split(outputStr, "\n")
			for _, line := range lines {
				if strings.Contains(line, "time=") || strings.Contains(line, "time<") {
					parts := strings.Split(line, "time=")
					if len(parts) > 1 {
						timePart := strings.Split(parts[1], " ")[0]
						timePart = strings.TrimSuffix(timePart, "ms")
						if t, parseErr := strconv.ParseFloat(timePart, 64); parseErr == nil {
							result["latency_ms"] = t
							break
						}
					}
				}
			}

			if err != nil {
				result["error"] = err.Error()
			}

			mu.Lock()
			results = append(results, result)
			mu.Unlock()
		}(host)
	}

	wg.Wait()
	json.NewEncoder(w).Encode(results)
}

// Bulk DNS endpoint with predefined servers
func (s *Server) handleBulkDNS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Domains []string `json:"domains"`
		Servers []string `json:"servers"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(req.Domains) == 0 {
		req.Domains = []string{"google.com", "github.com", "cloudflare.com"}
	}

	// Predefined DNS servers
	predefinedServers := map[string]string{
		"Cloudflare": "1.1.1.1",
		"Google":     "8.8.8.8",
		"Quad9":      "9.9.9.9",
		"OpenDNS":    "208.67.222.222",
		"Comodo":     "8.26.56.26",
		"Verisign":   "64.6.64.6",
		"DNS.WATCH":  "84.200.69.80",
		"AdGuard":    "94.140.14.14",
	}

	// If custom servers provided, use them, otherwise use predefined
	dnsServers := req.Servers
	if len(dnsServers) == 0 {
		for name, ip := range predefinedServers {
			dnsServers = append(dnsServers, fmt.Sprintf("%s (%s)", name, ip))
		}
	}

	results := make([]map[string]interface{}, 0)
	var mu sync.Mutex
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 20)

	for _, domain := range req.Domains {
		for _, server := range dnsServers {
			wg.Add(1)
			go func(d, s string) {
				defer wg.Done()
				semaphore <- struct{}{}
				defer func() { <-semaphore }()

				// Extract IP from server string if it has name
				serverIP := s
				if strings.Contains(s, "(") {
					start := strings.Index(s, "(")
					end := strings.Index(s, ")")
					if start > 0 && end > start {
						serverIP = s[start+1 : end]
					}
				}

				resolver := net.Resolver{
					PreferGo: true,
					Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
						d := net.Dialer{Timeout: 5 * time.Second}
						return d.DialContext(ctx, "udp", fmt.Sprintf("%s:53", serverIP))
					},
				}

				ips, err := resolver.LookupHost(context.Background(), d)

				result := map[string]interface{}{
					"domain":  d,
					"server":  s,
					"success": err == nil,
				}

				if err == nil {
					result["ip_addresses"] = ips
				} else {
					result["error"] = err.Error()
				}

				mu.Lock()
				results = append(results, result)
				mu.Unlock()
			}(domain, server)
		}
	}

	wg.Wait()
	json.NewEncoder(w).Encode(results)
}
