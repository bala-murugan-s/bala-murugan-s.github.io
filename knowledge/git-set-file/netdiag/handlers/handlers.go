package handlers

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strings"
	"time"

	"netdiag/tools/dns"
	"netdiag/tools/ping"
	"netdiag/tools/ssl"
)

// ── Helpers ───────────────────────────────────────────────────────────────────

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
func ok(w http.ResponseWriter, data interface{}) {
	writeJSON(w, 200, APIResponse{Success: true, Data: data})
}
func fail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, APIResponse{Success: false, Error: msg})
}
func methodCheck(w http.ResponseWriter, r *http.Request, method string) bool {
	if r.Method != method {
		fail(w, 405, "Method not allowed")
		return false
	}
	return true
}

// ── Page ─────────────────────────────────────────────────────────────────────

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/index.html")
	if err != nil {
		http.Error(w, "Template error: "+err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl.Execute(w, nil)
}

// ── Ping ─────────────────────────────────────────────────────────────────────

func PingSingleHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		IP      string `json:"ip"`
		Timeout int    `json:"timeout_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	ip := strings.TrimSpace(body.IP)
	if ip == "" {
		fail(w, 400, "ip required")
		return
	}
	timeout := time.Duration(body.Timeout) * time.Millisecond
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	result := ping.SinglePing(ip, timeout)
	ok(w, map[string]interface{}{"ip": ip, "result": result})
}

func PingMultipleHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		IPs     []string `json:"ips"`
		Timeout int      `json:"timeout_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	if len(body.IPs) == 0 {
		fail(w, 400, "ips required")
		return
	}
	if len(body.IPs) > 200 {
		fail(w, 400, "max 200 IPs")
		return
	}
	timeout := time.Duration(body.Timeout) * time.Millisecond
	if timeout <= 0 {
		timeout = 3 * time.Second
	}
	results := ping.MultiPing(body.IPs, timeout)
	ok(w, results)
}

func PingContinuousStartHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		IPs      []string `json:"ips"`
		Interval int      `json:"interval_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	if len(body.IPs) == 0 {
		fail(w, 400, "ips required")
		return
	}
	interval := time.Duration(body.Interval) * time.Millisecond
	if interval < 500*time.Millisecond {
		interval = 1 * time.Second
	}
	started := []string{}
	for _, ip := range body.IPs {
		ip = strings.TrimSpace(ip)
		if ip != "" {
			ping.GlobalManager.StartContinuous(ip, interval)
			started = append(started, ip)
		}
	}
	ok(w, map[string]interface{}{"started": started, "interval_ms": interval.Milliseconds()})
}

func PingContinuousStopHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		IP string `json:"ip"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	ping.GlobalManager.StopContinuous(strings.TrimSpace(body.IP))
	ok(w, map[string]string{"stopped": body.IP})
}

func PingContinuousStopAllHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	ping.GlobalManager.StopAll()
	ok(w, map[string]string{"status": "all stopped"})
}

func PingStatusHandler(w http.ResponseWriter, r *http.Request) {
	ok(w, ping.GlobalManager.GetAllSnapshots())
}

// PingStreamHandler — SSE endpoint, each client gets its own fan-out channel
func PingStreamHandler(w http.ResponseWriter, r *http.Request) {
	flusher, canFlush := w.(http.Flusher)
	if !canFlush {
		fail(w, 500, "streaming not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Each SSE client gets its own private channel from the broadcaster
	ch := ping.GlobalManager.Subscribe()
	defer ping.GlobalManager.Unsubscribe(ch)

	// Send current state immediately so client isn't blank on connect
	if snap, err := json.Marshal(map[string]interface{}{
		"type": "init",
		"data": ping.GlobalManager.GetAllSnapshots(),
	}); err == nil {
		fmt.Fprintf(w, "data: %s\n\n", snap)
		flusher.Flush()
	}

	hb := time.NewTicker(25 * time.Second)
	defer hb.Stop()
	done := r.Context().Done()

	for {
		select {
		case <-done:
			return
		case <-hb.C:
			fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		case ev, open := <-ch:
			if !open {
				return
			}
			data, err := json.Marshal(ev)
			if err != nil {
				log.Println("SSE marshal error:", err)
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

// ── DNS ───────────────────────────────────────────────────────────────────────

func DNSResolveHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		Domain   string   `json:"domain"`
		Types    []string `json:"types"`    // e.g. ["A","MX","TXT"]
		Resolver string   `json:"resolver"` // informational only
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	domain := strings.TrimSpace(body.Domain)
	if domain == "" {
		fail(w, 400, "domain required")
		return
	}

	var rtypes []dns.RecordType
	for _, t := range body.Types {
		rtypes = append(rtypes, dns.RecordType(strings.ToUpper(t)))
	}

	resolver := body.Resolver
	if resolver == "" {
		resolver = "system default"
	}

	result := dns.Resolve(domain, rtypes, resolver)
	ok(w, result)
}

func DNSBulkHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		Domains  []string `json:"domains"`
		Types    []string `json:"types"`
		Resolver string   `json:"resolver"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	if len(body.Domains) == 0 {
		fail(w, 400, "domains required")
		return
	}
	if len(body.Domains) > 50 {
		fail(w, 400, "max 50 domains")
		return
	}

	var rtypes []dns.RecordType
	for _, t := range body.Types {
		rtypes = append(rtypes, dns.RecordType(strings.ToUpper(t)))
	}
	resolver := body.Resolver
	if resolver == "" {
		resolver = "system default"
	}

	results := make([]dns.ResolveResult, 0, len(body.Domains))
	for _, d := range body.Domains {
		d = strings.TrimSpace(d)
		if d != "" {
			results = append(results, dns.Resolve(d, rtypes, resolver))
		}
	}
	ok(w, results)
}

// ── SSL ───────────────────────────────────────────────────────────────────────

func SSLAnalyzeHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		Host    string `json:"host"`
		Port    string `json:"port"`
		Timeout int    `json:"timeout_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	host := strings.TrimSpace(body.Host)
	if host == "" {
		fail(w, 400, "host required")
		return
	}
	port := strings.TrimSpace(body.Port)
	if port == "" {
		port = "443"
	}
	timeout := time.Duration(body.Timeout) * time.Millisecond
	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	result := ssl.Analyze(host, port, timeout)
	ok(w, result)
}

func SSLBulkHandler(w http.ResponseWriter, r *http.Request) {
	if !methodCheck(w, r, http.MethodPost) {
		return
	}
	var body struct {
		Hosts   []string `json:"hosts"`
		Port    string   `json:"port"`
		Timeout int      `json:"timeout_ms"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		fail(w, 400, "Invalid JSON")
		return
	}
	if len(body.Hosts) == 0 {
		fail(w, 400, "hosts required")
		return
	}
	if len(body.Hosts) > 20 {
		fail(w, 400, "max 20 hosts for SSL bulk scan")
		return
	}
	port := strings.TrimSpace(body.Port)
	if port == "" {
		port = "443"
	}
	timeout := time.Duration(body.Timeout) * time.Millisecond
	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	results := make([]ssl.AnalyzeResult, 0, len(body.Hosts))
	for _, h := range body.Hosts {
		h = strings.TrimSpace(h)
		if h != "" {
			results = append(results, ssl.Analyze(h, port, timeout))
		}
	}
	ok(w, results)
}
