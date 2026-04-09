package ssl

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"strings"
	"time"
)

type CertInfo struct {
	Subject            string    `json:"subject"`
	Issuer             string    `json:"issuer"`
	CommonName         string    `json:"common_name"`
	SANs               []string  `json:"sans"`
	NotBefore          time.Time `json:"not_before"`
	NotAfter           time.Time `json:"not_after"`
	DaysUntilExpiry    int       `json:"days_until_expiry"`
	IsExpired          bool      `json:"is_expired"`
	IsExpiringSoon     bool      `json:"is_expiring_soon"` // within 30 days
	SerialNumber       string    `json:"serial_number"`
	SignatureAlgorithm string    `json:"signature_algorithm"`
	PublicKeyAlgorithm string    `json:"public_key_algorithm"`
	KeySize            int       `json:"key_size"`
	Version            int       `json:"version"`
	IsCA               bool      `json:"is_ca"`
	OCSPServers        []string  `json:"ocsp_servers"`
	CRLDistribution    []string  `json:"crl_distribution"`
}

type TLSInfo struct {
	Version     string `json:"version"`
	CipherSuite string `json:"cipher_suite"`
}

type AnalyzeResult struct {
	Host          string     `json:"host"`
	Port          string     `json:"port"`
	Connected     bool       `json:"connected"`
	TLS           *TLSInfo   `json:"tls,omitempty"`
	Certificate   *CertInfo  `json:"certificate,omitempty"`
	Chain         []CertInfo `json:"chain,omitempty"`
	ConnectTimeMs float64    `json:"connect_time_ms"`
	Grade         string     `json:"grade"` // A/B/C/F
	Issues        []string   `json:"issues"`
	Error         string     `json:"error,omitempty"`
	AnalyzedAt    time.Time  `json:"analyzed_at"`
}

// Analyze performs a full TLS/SSL analysis of host:port
func Analyze(host, port string, timeout time.Duration) AnalyzeResult {
	start := time.Now()
	result := AnalyzeResult{
		Host:       host,
		Port:       port,
		Issues:     []string{},
		Chain:      []CertInfo{},
		AnalyzedAt: start,
	}

	if port == "" {
		port = "443"
	}

	addr := net.JoinHostPort(host, port)
	dialer := &net.Dialer{Timeout: timeout}

	tlsCfg := &tls.Config{
		ServerName:         host,
		InsecureSkipVerify: false,
		MinVersion:         tls.VersionTLS10,
	}

	conn, err := tls.DialWithDialer(dialer, "tcp", addr, tlsCfg)
	result.ConnectTimeMs = float64(time.Since(start).Microseconds()) / 1000.0

	if err != nil {
		// Try with InsecureSkipVerify to get cert info even if invalid
		tlsCfgInsecure := &tls.Config{
			ServerName:         host,
			InsecureSkipVerify: true,
			MinVersion:         tls.VersionTLS10,
		}
		conn2, err2 := tls.DialWithDialer(dialer, "tcp", addr, tlsCfgInsecure)
		if err2 != nil {
			result.Error = fmt.Sprintf("Connection failed: %v", err)
			result.Grade = "F"
			result.Issues = append(result.Issues, "Cannot connect to host")
			return result
		}
		defer conn2.Close()
		result.Connected = true
		result.Issues = append(result.Issues, fmt.Sprintf("TLS verification failed: %v", err))
		fillFromConn(conn2, &result)
		result.Grade = gradeResult(&result)
		return result
	}

	defer conn.Close()
	result.Connected = true
	fillFromConn(conn, &result)
	result.Grade = gradeResult(&result)
	return result
}

func fillFromConn(conn *tls.Conn, result *AnalyzeResult) {
	state := conn.ConnectionState()

	result.TLS = &TLSInfo{
		Version:     tlsVersionName(state.Version),
		CipherSuite: tls.CipherSuiteName(state.CipherSuite),
	}

	// Check TLS version issues
	if state.Version < tls.VersionTLS12 {
		result.Issues = append(result.Issues, fmt.Sprintf("Outdated TLS version: %s (TLS 1.2+ recommended)", tlsVersionName(state.Version)))
	}

	if len(state.PeerCertificates) == 0 {
		result.Issues = append(result.Issues, "No certificates presented")
		return
	}

	// Primary cert
	cert := state.PeerCertificates[0]
	result.Certificate = certInfoFromX509(cert)

	if result.Certificate.IsExpired {
		result.Issues = append(result.Issues, "Certificate is EXPIRED")
	} else if result.Certificate.IsExpiringSoon {
		result.Issues = append(result.Issues, fmt.Sprintf("Certificate expires in %d days", result.Certificate.DaysUntilExpiry))
	}

	if result.Certificate.KeySize < 2048 {
		result.Issues = append(result.Issues, fmt.Sprintf("Weak key size: %d bits (2048+ recommended)", result.Certificate.KeySize))
	}

	// Chain (intermediate certs)
	for _, c := range state.PeerCertificates[1:] {
		result.Chain = append(result.Chain, *certInfoFromX509(c))
	}
}

func certInfoFromX509(cert *x509.Certificate) *CertInfo {
	now := time.Now()
	daysLeft := int(cert.NotAfter.Sub(now).Hours() / 24)

	info := &CertInfo{
		Subject:            cert.Subject.String(),
		Issuer:             cert.Issuer.String(),
		CommonName:         cert.Subject.CommonName,
		SANs:               cert.DNSNames,
		NotBefore:          cert.NotBefore,
		NotAfter:           cert.NotAfter,
		DaysUntilExpiry:    daysLeft,
		IsExpired:          now.After(cert.NotAfter),
		IsExpiringSoon:     daysLeft >= 0 && daysLeft <= 30,
		SerialNumber:       cert.SerialNumber.String(),
		SignatureAlgorithm: cert.SignatureAlgorithm.String(),
		PublicKeyAlgorithm: cert.PublicKeyAlgorithm.String(),
		Version:            cert.Version,
		IsCA:               cert.IsCA,
		OCSPServers:        cert.OCSPServer,
		CRLDistribution:    cert.CRLDistributionPoints,
	}

	// ✅ Extract key size properly
	switch pub := cert.PublicKey.(type) {

	case *rsa.PublicKey:
		info.KeySize = pub.N.BitLen()

	case *ecdsa.PublicKey:
		info.KeySize = pub.Params().BitSize

	case ed25519.PublicKey:
		info.KeySize = len(pub) * 8

	default:
		info.KeySize = 0 // unknown type
	}

	// ✅ Fallback (only if key size couldn't be determined)
	if info.KeySize == 0 && len(cert.RawSubjectPublicKeyInfo) > 0 {
		bits := (len(cert.RawSubjectPublicKeyInfo) - 24) * 8
		if bits > 128 {
			info.KeySize = bits
		}
	}

	// ✅ Avoid nil slices (clean JSON output)
	if info.SANs == nil {
		info.SANs = []string{}
	}
	if info.OCSPServers == nil {
		info.OCSPServers = []string{}
	}
	if info.CRLDistribution == nil {
		info.CRLDistribution = []string{}
	}

	return info
}

func tlsVersionName(v uint16) string {
	switch v {
	case tls.VersionTLS10:
		return "TLS 1.0"
	case tls.VersionTLS11:
		return "TLS 1.1"
	case tls.VersionTLS12:
		return "TLS 1.2"
	case tls.VersionTLS13:
		return "TLS 1.3"
	default:
		return fmt.Sprintf("Unknown (0x%04x)", v)
	}
}

func gradeResult(r *AnalyzeResult) string {
	if !r.Connected {
		return "F"
	}
	if r.Certificate != nil && r.Certificate.IsExpired {
		return "F"
	}
	score := 100
	for _, issue := range r.Issues {
		lower := strings.ToLower(issue)
		switch {
		case strings.Contains(lower, "expired"):
			score -= 50
		case strings.Contains(lower, "verification failed"):
			score -= 40
		case strings.Contains(lower, "outdated tls"):
			score -= 25
		case strings.Contains(lower, "weak key"):
			score -= 20
		case strings.Contains(lower, "expiring"):
			score -= 5
		}
	}
	switch {
	case score >= 90:
		return "A"
	case score >= 75:
		return "B"
	case score >= 50:
		return "C"
	default:
		return "F"
	}
}
