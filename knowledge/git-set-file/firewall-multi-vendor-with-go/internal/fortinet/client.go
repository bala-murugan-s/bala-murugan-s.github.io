package fortinet

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

type Client struct {
	BaseURL    string
	Token      string
	HTTPClient *http.Client
}

func NewClient(ip, token string, port int) (*Client, error) {
	return &Client{
		BaseURL:    fmt.Sprintf("https://%s:%d/api/v2", ip, port),
		Token:      token,
		HTTPClient: &http.Client{Timeout: 30 * time.Second, Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}},
	}, nil
}

func (c *Client) doRequest(endpoint string) ([]byte, error) {
	req, err := http.NewRequest("GET", c.BaseURL+endpoint, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Accept", "application/json")
	
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	return io.ReadAll(resp.Body)
}

func (c *Client) TestConnection() error {
	_, err := c.doRequest("/monitor/system/status")
	return err
}

func (c *Client) GetDashboard() (map[string]interface{}, error) {
	// Get system status
	statusData, err := c.doRequest("/monitor/system/status")
	if err != nil {
		return nil, err
	}
	
	var statusResp struct {
		Results []struct {
			CPUUsage    float64 `json:"cpu_usage"`
			MemoryUsage float64 `json:"memory_usage"`
			Sessions    int     `json:"sessions"`
		} `json:"results"`
	}
	
	if err := json.Unmarshal(statusData, &statusResp); err != nil {
		return nil, err
	}
	
	var cpu, mem float64
	var sessions int
	if len(statusResp.Results) > 0 {
		cpu = statusResp.Results[0].CPUUsage
		mem = statusResp.Results[0].MemoryUsage
		sessions = statusResp.Results[0].Sessions
	}
	
	return map[string]interface{}{
		"cpu":      cpu,
		"memory":   mem,
		"sessions": sessions,
		"status":   "active",
		"alerts":   []interface{}{},
	}, nil
}

func (c *Client) GetInventory() (map[string]interface{}, error) {
	data, err := c.doRequest("/cmdb/system/status")
	if err != nil {
		return nil, err
	}
	
	var statusResp struct {
		Results []struct {
			Hostname    string `json:"hostname"`
			Firmware    string `json:"firmware"`
			Serial      string `json:"serial"`
			Uptime      string `json:"uptime"`
			Model       string `json:"model"`
		} `json:"results"`
	}
	
	if err := json.Unmarshal(data, &statusResp); err != nil {
		return nil, err
	}
	
	var result map[string]interface{}
	if len(statusResp.Results) > 0 {
		result = map[string]interface{}{
			"hostname":  statusResp.Results[0].Hostname,
			"ip":        c.BaseURL,
			"model":     statusResp.Results[0].Model,
			"serial":    statusResp.Results[0].Serial,
			"osVersion": statusResp.Results[0].Firmware,
			"uptime":    statusResp.Results[0].Uptime,
		}
	}
	
	return result, nil
}

func (c *Client) GetLicenses() ([]map[string]interface{}, error) {
	data, err := c.doRequest("/monitor/license")
	if err != nil {
		return nil, err
	}
	
	var licenseResp struct {
		Results []struct {
			Name       string `json:"name"`
			Status     string `json:"status"`
			Expiration string `json:"expiration"`
		} `json:"results"`
	}
	
	if err := json.Unmarshal(data, &licenseResp); err != nil {
		return nil, err
	}
	
	var result []map[string]interface{}
	for _, lic := range licenseResp.Results {
		result = append(result, map[string]interface{}{
			"name":        lic.Name,
			"status":      lic.Status,
			"expiration":  lic.Expiration,
			"description": lic.Name + " License",
		})
	}
	
	return result, nil
}

func (c *Client) GetLogs(logType, limit string) ([]map[string]interface{}, error) {
	limitInt, _ := strconv.Atoi(limit)
	if limitInt == 0 {
		limitInt = 50
	}
	
	endpoint := fmt.Sprintf("/monitor/log/fortigate/%s?limit=%d", logType, limitInt)
	data, err := c.doRequest(endpoint)
	if err != nil {
		return nil, err
	}
	
	var logResp struct {
		Results []struct {
			Timestamp   string `json:"timestamp"`
			SrcIP       string `json:"srcip"`
			DstIP       string `json:"dstip"`
			SrcPort     int    `json:"srcport"`
			DstPort     int    `json:"dstport"`
			Protocol    string `json:"protocol"`
			Action      string `json:"action"`
			Threat      string `json:"threat"`
			Severity    string `json:"severity"`
		} `json:"results"`
	}
	
	if err := json.Unmarshal(data, &logResp); err != nil {
		return nil, err
	}
	
	var result []map[string]interface{}
	for _, entry := range logResp.Results {
		logEntry := map[string]interface{}{
			"timestamp":  entry.Timestamp,
			"sourceIP":   entry.SrcIP,
			"destIP":     entry.DstIP,
			"sourcePort": entry.SrcPort,
			"destPort":   entry.DstPort,
			"protocol":   entry.Protocol,
			"action":     entry.Action,
		}
		if entry.Threat != "" {
			logEntry["threatName"] = entry.Threat
			logEntry["severity"] = entry.Severity
		}
		result = append(result, logEntry)
	}
	
	return result, nil
}

func (c *Client) ExecuteCLI(command string) (string, error) {
	endpoint := fmt.Sprintf("/monitor/system/cli?cmd=%s", command)
	data, err := c.doRequest(endpoint)
	if err != nil {
		return "", err
	}
	
	var cliResp struct {
		Results []struct {
			Output string `json:"output"`
		} `json:"results"`
	}
	
	if err := json.Unmarshal(data, &cliResp); err != nil {
		return string(data), nil
	}
	
	if len(cliResp.Results) > 0 {
		return cliResp.Results[0].Output, nil
	}
	
	return string(data), nil
}

func (c *Client) GetConfig() (map[string]interface{}, error) {
	// Get firewall policies
	policyData, err := c.doRequest("/cmdb/firewall/policy")
	if err != nil {
		return nil, err
	}
	
	var policyResp struct {
		Results []struct {
			Name     string `json:"name"`
			Srcintf  string `json:"srcintf"`
			Dstintf  string `json:"dstintf"`
			Srcaddr  string `json:"srcaddr"`
			Dstaddr  string `json:"dstaddr"`
			Service  string `json:"service"`
			Action   string `json:"action"`
			Status   string `json:"status"`
		} `json:"results"`
	}
	
	if err := json.Unmarshal(policyData, &policyResp); err != nil {
		return nil, err
	}
	
	var policies []map[string]interface{}
	for _, p := range policyResp.Results {
		policies = append(policies, map[string]interface{}{
			"name":        p.Name,
			"from":        p.Srcintf,
			"to":          p.Dstintf,
			"source":      p.Srcaddr,
			"destination": p.Dstaddr,
			"service":     p.Service,
			"action":      p.Action,
			"disabled":    p.Status == "down",
			"unused":      false,
		})
	}
	
	return map[string]interface{}{
		"policies": policies,
		"natRules": []interface{}{},
		"objects":  []interface{}{},
	}, nil
}