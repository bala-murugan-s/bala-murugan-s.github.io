package dns

import (
	"fmt"
	"net"
	"strings"
	"time"
)

type RecordType string

const (
	RecordA     RecordType = "A"
	RecordAAAA  RecordType = "AAAA"
	RecordCNAME RecordType = "CNAME"
	RecordMX    RecordType = "MX"
	RecordNS    RecordType = "NS"
	RecordTXT   RecordType = "TXT"
	RecordPTR   RecordType = "PTR"
)

type DNSRecord struct {
	Type  RecordType `json:"type"`
	Value string     `json:"value"`
	TTL   string     `json:"ttl,omitempty"`
}

type ResolveResult struct {
	Domain     string      `json:"domain"`
	Records    []DNSRecord `json:"records"`
	QueryTime  float64     `json:"query_time_ms"`
	Resolver   string      `json:"resolver"`
	Error      string      `json:"error,omitempty"`
	ResolvedAt time.Time   `json:"resolved_at"`
}

// Resolve performs DNS lookup for the given domain and record types
func Resolve(domain string, types []RecordType, resolver string) ResolveResult {
	start := time.Now()
	domain = strings.TrimSpace(domain)

	result := ResolveResult{
		Domain:     domain,
		Records:    []DNSRecord{},
		Resolver:   resolver,
		ResolvedAt: start,
	}

	if len(types) == 0 {
		types = []RecordType{RecordA, RecordAAAA, RecordCNAME, RecordMX, RecordNS, RecordTXT}
	}

	var allErrors []string

	for _, t := range types {
		records, err := lookupType(domain, t)
		if err != nil {
			allErrors = append(allErrors, fmt.Sprintf("%s: %v", t, err))
			continue
		}
		result.Records = append(result.Records, records...)
	}

	result.QueryTime = float64(time.Since(start).Microseconds()) / 1000.0

	if len(result.Records) == 0 && len(allErrors) > 0 {
		result.Error = strings.Join(allErrors, "; ")
	}

	return result
}

func lookupType(domain string, t RecordType) ([]DNSRecord, error) {
	var records []DNSRecord

	switch t {
	case RecordA:
		addrs, err := net.LookupIP(domain)
		if err != nil {
			return nil, err
		}
		for _, addr := range addrs {
			if v4 := addr.To4(); v4 != nil {
				records = append(records, DNSRecord{Type: RecordA, Value: v4.String()})
			}
		}

	case RecordAAAA:
		addrs, err := net.LookupIP(domain)
		if err != nil {
			return nil, err
		}
		for _, addr := range addrs {
			if addr.To4() == nil && addr.To16() != nil {
				records = append(records, DNSRecord{Type: RecordAAAA, Value: addr.String()})
			}
		}

	case RecordCNAME:
		cname, err := net.LookupCNAME(domain)
		if err != nil {
			return nil, err
		}
		if cname != domain+"." && cname != domain {
			records = append(records, DNSRecord{Type: RecordCNAME, Value: strings.TrimSuffix(cname, ".")})
		}

	case RecordMX:
		mxs, err := net.LookupMX(domain)
		if err != nil {
			return nil, err
		}
		for _, mx := range mxs {
			records = append(records, DNSRecord{
				Type:  RecordMX,
				Value: fmt.Sprintf("%d %s", mx.Pref, strings.TrimSuffix(mx.Host, ".")),
			})
		}

	case RecordNS:
		nss, err := net.LookupNS(domain)
		if err != nil {
			return nil, err
		}
		for _, ns := range nss {
			records = append(records, DNSRecord{Type: RecordNS, Value: strings.TrimSuffix(ns.Host, ".")})
		}

	case RecordTXT:
		txts, err := net.LookupTXT(domain)
		if err != nil {
			return nil, err
		}
		for _, txt := range txts {
			records = append(records, DNSRecord{Type: RecordTXT, Value: txt})
		}

	case RecordPTR:
		// domain should be an IP for PTR
		names, err := net.LookupAddr(domain)
		if err != nil {
			return nil, err
		}
		for _, name := range names {
			records = append(records, DNSRecord{Type: RecordPTR, Value: strings.TrimSuffix(name, ".")})
		}
	}

	return records, nil
}
