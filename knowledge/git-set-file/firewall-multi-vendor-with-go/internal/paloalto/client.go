package paloalto

import (
	"bytes"
	"crypto/tls"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

type SystemInfo struct {
	Hostname string `xml:"result>system>hostname"`
	Model    string `xml:"result>system>model"`
	Serial   string `xml:"result>system>serial"`
	Version  string `xml:"result>system>sw-version"`
	Uptime   string `xml:"result>system>uptime"`
}

type ResourceInfo struct {
	CPU     string `xml:"result>system>cpu-load"`
	Memory  string `xml:"result>system>memory-used-percentage"`
	Session string `xml:"result>system>session-active"`
}

type LicenseInfo struct {
	Licenses []struct {
		Name        string `xml:"name,attr"`
		Description string `xml:"description"`
		Expires     string `xml:"expires"`
	} `xml:"result>licenses>license"`
}

func NewClient(ip, apiKey, username, password string) (*Client, error) {
	client := &Client{
		BaseURL:    fmt.Sprintf("https://%s/api/", ip),
		HTTPClient: &http.Client{Timeout: 30 * time.Second, Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}},
	}

	if apiKey == "" && username != "" && password != "" {
		key, err := client.generateAPIKey(username, password)
		if err != nil {
			return nil, err
		}
		client.APIKey = key
	} else {
		client.APIKey = apiKey
	}

	return client, nil
}

func (c *Client) generateAPIKey(username, password string) (string, error) {
	params := url.Values{}
	params.Add("type", "keygen")
	params.Add("user", username)
	params.Add("password", password)

	resp, err := c.HTTPClient.Get(c.BaseURL + "?" + params.Encode())
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result struct {
		Result struct {
			Key string `xml:"key"`
		} `xml:"result"`
	}
	if err := xml.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse API key response: %v", err)
	}

	if result.Result.Key == "" {
		return "", fmt.Errorf("failed to get API key")
	}

	return result.Result.Key, nil
}

func (c *Client) doRequest(params map[string]string) ([]byte, error) {
	params["key"] = c.APIKey
	values := url.Values{}
	for k, v := range params {
		values.Add(k, v)
	}

	reqURL := c.BaseURL + "?" + values.Encode()
	resp, err := c.HTTPClient.Get(reqURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func (c *Client) TestConnection() error {
	params := map[string]string{
		"type": "op",
		"cmd":  "<show><system><info></info></system></show>",
	}
	_, err := c.doRequest(params)
	return err
}

func (c *Client) GetDashboard() (map[string]interface{}, error) {
	// Get resources
	resources, err := c.getResources()
	if err != nil {
		return nil, err
	}

	cpu, _ := strconv.ParseFloat(strings.TrimSuffix(resources.CPU, "%"), 64)
	mem, _ := strconv.ParseFloat(strings.TrimSuffix(resources.Memory, "%"), 64)
	sessions, _ := strconv.Atoi(resources.Session)

	return map[string]interface{}{
		"cpu":      cpu,
		"memory":   mem,
		"sessions": sessions,
		"status":   "active",
		"alerts":   []interface{}{},
	}, nil
}

func (c *Client) getSystemInfo() (*SystemInfo, error) {
	params := map[string]string{
		"type": "op",
		"cmd":  "<show><system><info></info></system></show>",
	}

	data, err := c.doRequest(params)
	if err != nil {
		return nil, err
	}

	var info SystemInfo
	if err := xml.Unmarshal(data, &info); err != nil {
		return nil, err
	}

	return &info, nil
}

func (c *Client) getResources() (*ResourceInfo, error) {
	params := map[string]string{
		"type": "op",
		"cmd":  "<show><system><resources></resources></system></show>",
	}

	data, err := c.doRequest(params)
	if err != nil {
		return nil, err
	}

	var resources ResourceInfo
	if err := xml.Unmarshal(data, &resources); err != nil {
		return nil, err
	}

	return &resources, nil
}

func (c *Client) GetInventory() (map[string]interface{}, error) {
	info, err := c.getSystemInfo()
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"hostname":  info.Hostname,
		"ip":        c.BaseURL,
		"model":     info.Model,
		"serial":    info.Serial,
		"osVersion": info.Version,
		"uptime":    info.Uptime,
	}, nil
}

func (c *Client) GetLicenses() ([]map[string]interface{}, error) {
	params := map[string]string{
		"type": "op",
		"cmd":  "<show><system><license></license></system></show>",
	}

	data, err := c.doRequest(params)
	if err != nil {
		return nil, err
	}

	var licenses LicenseInfo
	if err := xml.Unmarshal(data, &licenses); err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	for _, lic := range licenses.Licenses {
		result = append(result, map[string]interface{}{
			"name":        lic.Name,
			"status":      "active",
			"expiration":  lic.Expires,
			"description": lic.Description,
		})
	}

	return result, nil
}

func (c *Client) GetLogs(logType, limit string) ([]map[string]interface{}, error) {
	params := map[string]string{
		"type":     "log",
		"log-type": logType,
		"nlogs":    limit,
	}

	data, err := c.doRequest(params)
	if err != nil {
		return nil, err
	}

	// Parse XML logs
	var logs struct {
		Entries []struct {
			TimeGenerated string `xml:"time-generated,attr"`
			SourceIP      string `xml:"src,attr"`
			DestIP        string `xml:"dst,attr"`
			SourcePort    string `xml:"sport,attr"`
			DestPort      string `xml:"dport,attr"`
			Protocol      string `xml:"proto,attr"`
			Action        string `xml:"action,attr"`
		} `xml:"log"`
	}

	if err := xml.Unmarshal(data, &logs); err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	for _, entry := range logs.Entries {
		sport, _ := strconv.Atoi(entry.SourcePort)
		dport, _ := strconv.Atoi(entry.DestPort)
		result = append(result, map[string]interface{}{
			"timestamp":  entry.TimeGenerated,
			"sourceIP":   entry.SourceIP,
			"destIP":     entry.DestIP,
			"sourcePort": sport,
			"destPort":   dport,
			"protocol":   entry.Protocol,
			"action":     entry.Action,
		})
	}

	return result, nil
}

func (c *Client) ExecuteCLI(command string) (string, error) {
	// Convert CLI command to XML API format
	xmlCmd := fmt.Sprintf("<%s></%s>", strings.ReplaceAll(command, " ", "><"), strings.ReplaceAll(command, " ", "><"))
	if strings.Contains(command, "show system info") {
		xmlCmd = "<show><system><info></info></system></show>"
	} else if strings.Contains(command, "show running security-policy") {
		xmlCmd = "<show><config><running></running></config></show>"
	}

	params := map[string]string{
		"type": "op",
		"cmd":  xmlCmd,
	}

	data, err := c.doRequest(params)
	if err != nil {
		return "", err
	}

	// Pretty print XML - use bytes.Buffer directly
	var prettyBuf bytes.Buffer
	decoder := xml.NewDecoder(bytes.NewReader(data))
	encoder := xml.NewEncoder(&prettyBuf)
	encoder.Indent("", "  ")

	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		if err := encoder.EncodeToken(token); err != nil {
			return string(data), nil
		}
	}
	encoder.Flush()

	if prettyBuf.Len() > 0 {
		return prettyBuf.String(), nil
	}

	return string(data), nil
}

func (c *Client) GetConfig() (map[string]interface{}, error) {
	params := map[string]string{
		"type":   "config",
		"action": "show",
	}

	_, err := c.doRequest(params)
	if err != nil {
		return nil, err
	}

	// Parse policies from config
	var policies []map[string]interface{}

	// For demo purposes, return structure
	return map[string]interface{}{
		"policies": policies,
		"natRules": []interface{}{},
		"objects":  []interface{}{},
	}, nil
}
