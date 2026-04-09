// ========== Utility Functions ==========
async function apiCall(endpoint, data) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

function formatResult(data, type) {
    if (!data) return '<div class="loading">No data available</div>';
    return `<pre class="result-container">${JSON.stringify(data, null, 2)}</pre>`;
}

function clearResult(elementId) {
    document.getElementById(elementId).innerHTML = '';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--accent-primary);
        color: var(--bg-primary);
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ========== Tab Management ==========
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;

        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');

        // Load data when tab is opened
        if (tabId === 'interfaces') loadInterfaces();
        if (tabId === 'dashboard') runFullDiagnostic();
    });
});

// ========== Health Check ==========
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            document.getElementById('statusText').textContent = 'Connected';
        }
    } catch (error) {
        document.getElementById('statusText').textContent = 'Disconnected';
    }
}
setInterval(checkHealth, 30000);
checkHealth();

// ========== Ping Function ==========
async function runPing() {
    const host = document.getElementById('pingHost').value;
    const count = parseInt(document.getElementById('pingCount').value) || 4;
    const resultDiv = document.getElementById('pingResult');

    if (!host) {
        resultDiv.innerHTML = '<div class="loading">Please enter a hostname or IP</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Pinging...</div>';

    try {
        const data = await apiCall('/api/ping', { host, count });

        if (data.success) {
            resultDiv.innerHTML = `
                <div class="result-container">
                    <div class="result-header">
                        <span>Ping Results for ${data.target}</span>
                        <button class="copy-btn" onclick="copyToClipboard('${data.target} - ${data.received}/${data.sent} packets received, loss ${data.packet_loss.toFixed(1)}%')">Copy</button>
                    </div>
                    <div style="margin-top: 12px;">
                        <div><span class="badge ${data.packet_loss === 0 ? 'badge-success' : 'badge-warning'}">Packets: ${data.received}/${data.sent}</span></div>
                        <div><span class="badge badge-info">Loss: ${data.packet_loss.toFixed(1)}%</span></div>
                        <div><span class="badge badge-info">Latency: ${data.latency ? data.latency.toFixed(2) + 'ms' : 'N/A'}</span></div>
                        <div><span class="badge badge-info">TTL: ${data.ttl || 'N/A'}</span></div>
                    </div>
                </div>
            `;

            // Update dashboard stats
            document.getElementById('statLatency').textContent = data.latency ? data.latency.toFixed(0) : '--';
            document.getElementById('statPacketLoss').textContent = data.packet_loss.toFixed(0);
        } else {
            resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${data.error}</span></div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== DNS Lookup ==========
async function runDNS() {
    const domain = document.getElementById('dnsDomain').value;
    const resultDiv = document.getElementById('dnsResult');

    if (!domain) {
        resultDiv.innerHTML = '<div class="loading">Please enter a domain name</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Looking up DNS records...</div>';

    try {
        const data = await apiCall('/api/dns', { domain });

        let html = '<div class="result-container"><div class="result-header"><span>DNS Records for ' + domain + '</span><button class="copy-btn" onclick="copyToClipboard(\'' + JSON.stringify(data) + '\')">Copy</button></div>';

        if (data.a_records && data.a_records.length) {
            html += `<div style="margin-top: 12px;"><strong>A Records:</strong><br>${data.a_records.map(ip => `&nbsp;&nbsp;• ${ip}`).join('<br>')}</div>`;
        }
        if (data.aaaa_records && data.aaaa_records.length) {
            html += `<div style="margin-top: 12px;"><strong>AAAA Records:</strong><br>${data.aaaa_records.map(ip => `&nbsp;&nbsp;• ${ip}`).join('<br>')}</div>`;
        }
        if (data.cname) {
            html += `<div style="margin-top: 12px;"><strong>CNAME:</strong><br>&nbsp;&nbsp;• ${data.cname}</div>`;
        }
        if (data.mx_records && data.mx_records.length) {
            html += `<div style="margin-top: 12px;"><strong>MX Records:</strong><br>${data.mx_records.map(mx => `&nbsp;&nbsp;• ${mx}`).join('<br>')}</div>`;
        }
        if (data.ns_records && data.ns_records.length) {
            html += `<div style="margin-top: 12px;"><strong>NS Records:</strong><br>${data.ns_records.map(ns => `&nbsp;&nbsp;• ${ns}`).join('<br>')}</div>`;
        }

        html += '</div>';
        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== Traceroute ==========
async function runTraceroute() {
    const host = document.getElementById('traceHost').value;
    const maxHops = parseInt(document.getElementById('maxHops').value) || 30;
    const resultDiv = document.getElementById('traceResult');

    if (!host) {
        resultDiv.innerHTML = '<div class="loading">Please enter a destination host</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Tracing route... (this may take a moment)</div>';

    try {
        const response = await fetch('/api/traceroute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, max_hops: maxHops })
        });
        const hops = await response.json();

        if (hops && hops.length) {
            let html = `<div class="result-container"><div class="result-header"><span>Route to ${host}</span><button class="copy-btn" onclick="copyToClipboard(document.getElementById('traceTable').innerText)">Copy</button></div>`;
            html += '<table class="data-table" id="traceTable"><thead><tr><th>Hop</th><th>Address</th><th>RTT1</th><th>RTT2</th><th>RTT3</th></tr></thead><tbody>';

            for (const hop of hops) {
                html += `<tr>
                    <td>${hop.hop}</td>
                    <td>${hop.address || '*'}</td>
                    <td>${hop.rtt1 ? hop.rtt1.toFixed(2) + 'ms' : '*'}</td>
                    <td>${hop.rtt2 ? hop.rtt2.toFixed(2) + 'ms' : '*'}</td>
                    <td>${hop.rtt3 ? hop.rtt3.toFixed(2) + 'ms' : '*'}</td>
                </tr>`;
            }
            html += '</tbody></table></div>';
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = '<div class="result-container">No traceroute data available</div>';
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== SSL Analyzer ==========
async function runSSL() {
    const host = document.getElementById('sslHost').value;
    const port = parseInt(document.getElementById('sslPort').value) || 443;
    const resultDiv = document.getElementById('sslResult');

    if (!host) {
        resultDiv.innerHTML = '<div class="loading">Please enter a hostname</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Fetching SSL certificate...</div>';

    try {
        const response = await fetch('/api/ssl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host, port })
        });
        const data = await response.json();

        if (data.success && data.cert) {
            const cert = data.cert;
            const expiryDate = new Date(cert.not_after);
            const now = new Date();
            const daysLeft = Math.floor((expiryDate - now) / 86400000);

            let expiryClass = 'valid';
            let expiryText = `${daysLeft} days remaining`;
            if (daysLeft < 0) {
                expiryClass = 'expired';
                expiryText = 'EXPIRED';
            } else if (daysLeft < 30) {
                expiryClass = 'expiring';
                expiryText = `${daysLeft} days remaining (expiring soon)`;
            }

            let html = `<div class="result-container"><div class="result-header"><span>SSL Certificate for ${host}:${port}</span><button class="copy-btn" onclick="copyToClipboard(document.getElementById('sslDetails').innerText)">Copy</button></div>`;
            html += '<div class="cert-details" id="sslDetails">';
            html += `<div class="cert-row"><div class="cert-label">Common Name</div><div class="cert-value">${cert.subject_cn || 'N/A'}</div></div>`;
            html += `<div class="cert-row"><div class="cert-label">Issuer</div><div class="cert-value">${cert.issuer_o || 'N/A'} (${cert.issuer_cn || 'N/A'})</div></div>`;
            html += `<div class="cert-row"><div class="cert-label">Valid From</div><div class="cert-value">${cert.not_before || 'N/A'}</div></div>`;
            html += `<div class="cert-row"><div class="cert-label">Valid Until</div><div class="cert-value ${expiryClass}">${cert.not_after || 'N/A'} (${expiryText})</div></div>`;
            html += `<div class="cert-row"><div class="cert-label">Protocol</div><div class="cert-value">${data.protocol || 'N/A'}</div></div>`;
            html += `<div class="cert-row"><div class="cert-label">Cipher</div><div class="cert-value">${data.cipher || 'N/A'}</div></div>`;
            html += `<div class="cert-row"><div class="cert-label">Signature Algorithm</div><div class="cert-value">${cert.signature_algorithm || 'N/A'}</div></div>`;
            html += `<div class="cert-row"><div class="cert-label">Key Size</div><div class="cert-value">${cert.key_size || 'N/A'}</div></div>`;
            if (cert.san && cert.san.length) {
                html += `<div class="cert-row"><div class="cert-label">SAN</div><div class="cert-value">${cert.san.slice(0, 5).join(', ')}${cert.san.length > 5 ? '...' : ''}</div></div>`;
            }
            html += '</div></div>';
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">${data.error || 'Failed to retrieve certificate'}</span></div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== Port Scan ==========
async function runPortScan() {
    const host = document.getElementById('scanHost').value;
    const portsStr = document.getElementById('scanPorts').value;
    const timeout = parseInt(document.getElementById('scanTimeout').value) || 1;
    const resultDiv = document.getElementById('portResult');

    if (!host) {
        resultDiv.innerHTML = '<div class="loading">Please enter a target host</div>';
        return;
    }

    let ports = [];
    if (portsStr) {
        ports = portsStr.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Scanning ports...</div>';

    try {
        const data = await apiCall('/api/port-scan', { host, ports, timeout });

        if (data.open_ports.length > 0) {
            let html = `<div class="result-container"><div class="result-header"><span>Open Ports on ${host}</span><button class="copy-btn" onclick="copyToClipboard('${JSON.stringify(data.open_ports)}')">Copy</button></div>`;
            html += '<table class="data-table"><thead><tr><th>Port</th><th>Service</th></tr></thead><tbody>';
            for (const port of data.open_ports) {
                html += `<tr><td>${port.port}</td><td>${port.service}</td></tr>`;
            }
            html += '</tbody></table>';
            html += `<div style="margin-top: 12px;"><span class="badge badge-info">Scan completed in ${data.scan_time}ms</span></div>`;
            html += '</div>';
            resultDiv.innerHTML = html;
            document.getElementById('statOpenPorts').textContent = data.open_ports.length;
        } else {
            resultDiv.innerHTML = `<div class="result-container">No open ports found on ${host}</div>`;
            document.getElementById('statOpenPorts').textContent = '0';
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== Network Scan ==========
async function runNetworkScan() {
    const subnet = document.getElementById('subnet').value;
    const resultDiv = document.getElementById('networkResult');

    if (!subnet) {
        resultDiv.innerHTML = '<div class="loading">Please enter a subnet (e.g., 192.168.1.0/24)</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Scanning network... (this may take a moment)</div>';

    try {
        const data = await apiCall('/api/network-scan', { subnet, timeout: 1 });

        if (data.hosts && data.hosts.length > 0) {
            let html = `<div class="result-container"><div class="result-header"><span>Live Hosts on ${subnet}</span><button class="copy-btn" onclick="copyToClipboard('${JSON.stringify(data.hosts)}')">Copy</button></div>`;
            html += '<table class="data-table"><thead><tr><th>IP Address</th><th>Hostname</th><th>Response Time</th></tr></thead><tbody>';
            for (const host of data.hosts) {
                html += `<tr>
                    <td>${host.ip}</td>
                    <td>${host.hostname || '-'}</td>
                    <td>${host.response_time.toFixed(2)}ms</td>
                </tr>`;
            }
            html += '</tbody></table>';
            html += `<div style="margin-top: 12px;"><span class="badge badge-info">Found ${data.total} live hosts in ${data.scan_time}ms</span></div>`;
            html += '</div>';
            resultDiv.innerHTML = html;
            document.getElementById('statLiveHosts').textContent = data.total;
        } else {
            resultDiv.innerHTML = `<div class="result-container">No live hosts found on ${subnet}</div>`;
            document.getElementById('statLiveHosts').textContent = '0';
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== Interfaces ==========
async function loadInterfaces() {
    const resultDiv = document.getElementById('interfacesResult');
    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Loading interfaces...</div>';

    try {
        const response = await fetch('/api/interfaces');
        const interfaces = await response.json();

        let html = '<div class="result-container">';
        for (const iface of interfaces) {
            if (iface.ipv4.length > 0 || iface.ipv6.length > 0) {
                html += `
                    <div class="cert-details" style="margin-bottom: 16px;">
                        <div class="cert-row">
                            <div class="cert-label">Interface</div>
                            <div class="cert-value"><strong>${iface.name}</strong> ${iface.is_up ? '<span class="badge badge-success">UP</span>' : '<span class="badge badge-error">DOWN</span>'}</div>
                        </div>
                        <div class="cert-row">
                            <div class="cert-label">MAC Address</div>
                            <div class="cert-value">${iface.mac || 'N/A'}</div>
                        </div>
                        <div class="cert-row">
                            <div class="cert-label">MTU</div>
                            <div class="cert-value">${iface.mtu}</div>
                        </div>
                        <div class="cert-row">
                            <div class="cert-label">IPv4 Addresses</div>
                            <div class="cert-value">${iface.ipv4.join(', ') || 'None'}</div>
                        </div>
                        <div class="cert-row">
                            <div class="cert-label">IPv6 Addresses</div>
                            <div class="cert-value">${iface.ipv6.join(', ') || 'None'}</div>
                        </div>
                    </div>
                `;
            }
        }
        html += '</div>';
        resultDiv.innerHTML = html || '<div class="result-container">No active interfaces found</div>';
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== Diagnostic ==========
async function runFullDiagnostic() {
    const resultDiv = document.getElementById('diagnosticResult');
    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Running diagnostic...</div>';

    try {
        const response = await fetch('/api/diagnostic');
        const data = await response.json();

        let html = '<div>';
        html += `<div class="cert-details" style="margin-bottom: 16px;">
            <div class="cert-row">
                <div class="cert-label">Connectivity</div>
                <div class="cert-value"><span class="badge ${data.connectivity === 'Internet Connected' ? 'badge-success' : 'badge-warning'}">${data.connectivity}</span></div>
            </div>
        </div>`;

        if (data.issues && data.issues.length) {
            html += `<div class="cert-details" style="margin-bottom: 16px;">
                <div class="cert-row"><div class="cert-label">Issues Found</div><div class="cert-value"></div></div>`;
            for (const issue of data.issues) {
                html += `<div class="cert-row"><div class="cert-label"></div><div class="cert-value"><span class="badge badge-error">⚠️ ${issue}</span></div></div>`;
            }
            html += `</div>`;
        }

        if (data.suggestions && data.suggestions.length) {
            html += `<div class="cert-details">
                <div class="cert-row"><div class="cert-label">Recommendations</div><div class="cert-value"></div></div>`;
            for (const suggestion of data.suggestions) {
                html += `<div class="cert-row"><div class="cert-label"></div><div class="cert-value"><span class="badge badge-info">💡 ${suggestion}</span></div></div>`;
            }
            html += `</div>`;
        }

        html += '</div>';
        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== Quick Actions ==========
function quickPing() {
    document.querySelector('[data-tab="connectivity"]').click();
    setTimeout(() => runPing(), 100);
}

function quickDNS() {
    document.querySelector('[data-tab="connectivity"]').click();
    setTimeout(() => runDNS(), 100);
}

function quickTraceroute() {
    document.querySelector('[data-tab="traceroute"]').click();
    setTimeout(() => runTraceroute(), 100);
}

function quickSSL() {
    document.querySelector('[data-tab="ssl"]').click();
    setTimeout(() => runSSL(), 100);
}

function quickPortScan() {
    document.querySelector('[data-tab="portscan"]').click();
    document.getElementById('scanHost').value = 'localhost';
    document.getElementById('scanPorts').value = '22,80,443,3306,5432,8080';
    setTimeout(() => runPortScan(), 100);
}

// ========== Bulk Ping ==========
async function runBulkPing() {
    let hostsText = document.getElementById('bulkHosts').value;
    const count = parseInt(document.getElementById('bulkPingCount').value) || 2;
    const resultDiv = document.getElementById('bulkPingResult');

    if (!hostsText.trim()) {
        hostsText = "google.com\ngithub.com\ncloudflare.com\n8.8.8.8\n1.1.1.1";
        document.getElementById('bulkHosts').value = hostsText;
    }

    // Parse hosts (support comma or line-separated)
    let hosts = [];
    if (hostsText.includes(',')) {
        hosts = hostsText.split(',').map(h => h.trim()).filter(h => h);
    } else {
        hosts = hostsText.split('\n').map(h => h.trim()).filter(h => h);
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Pinging ' + hosts.length + ' hosts...</div>';

    try {
        const response = await fetch('/api/bulk-ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hosts, count, timeout: 2 })
        });
        const results = await response.json();

        let html = `<div class="result-container">
            <div class="result-header">
                <span>Bulk Ping Results (${results.length} hosts)</span>
                <button class="copy-btn" onclick="copyToClipboard(JSON.stringify(${JSON.stringify(results)}, null, 2))">Copy All</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Host</th>
                        <th>Status</th>
                        <th>Latency</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>`;

        for (const result of results) {
            const statusClass = result.success ? 'badge-success' : 'badge-error';
            const statusText = result.success ? '✓ Online' : '✗ Offline';
            const latency = result.latency_ms ? result.latency_ms.toFixed(2) + 'ms' : 'N/A';

            html += `<tr>
                <td><strong>${result.host}</strong></td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${latency}</td>
                <td><span class="badge badge-info" style="cursor:pointer" onclick="showDetails('${result.host}', \`${escapeHtml(result.output || result.error || 'No output')}\`)">View</span></td>
            </tr>`;
        }

        html += `</tbody>
            </table>
        </div>`;

        resultDiv.innerHTML = html;

        // Update stats
        const onlineCount = results.filter(r => r.success).length;
        document.getElementById('statLatency').textContent = results.filter(r => r.latency_ms).length ?
            (results.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / results.filter(r => r.latency_ms).length).toFixed(0) : '--';
        document.getElementById('statPacketLoss').textContent = ((results.length - onlineCount) / results.length * 100).toFixed(0);

    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// ========== Bulk DNS ==========
async function runBulkDNS() {
    let domainsText = document.getElementById('bulkDomains').value;
    let serversText = document.getElementById('bulkDNSServers').value;
    const resultDiv = document.getElementById('bulkDNSResult');

    if (!domainsText.trim()) {
        domainsText = "google.com\ngithub.com\ncloudflare.com\namazon.com\nmicrosoft.com";
        document.getElementById('bulkDomains').value = domainsText;
    }

    // Parse domains
    let domains = [];
    if (domainsText.includes(',')) {
        domains = domainsText.split(',').map(d => d.trim()).filter(d => d);
    } else {
        domains = domainsText.split('\n').map(d => d.trim()).filter(d => d);
    }

    // Parse DNS servers
    let servers = [];
    if (serversText.trim()) {
        if (serversText.includes(',')) {
            servers = serversText.split(',').map(s => s.trim()).filter(s => s);
        } else {
            servers = serversText.split('\n').map(s => s.trim()).filter(s => s);
        }
    }

    resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div> Resolving ' + domains.length + ' domains across ' + (servers.length || 'predefined') + ' DNS servers...</div>';

    try {
        const response = await fetch('/api/bulk-dns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains, servers })
        });
        const results = await response.json();

        // Group results by domain
        const grouped = {};
        for (const result of results) {
            if (!grouped[result.domain]) grouped[result.domain] = [];
            grouped[result.domain].push(result);
        }

        let html = `<div class="result-container">
            <div class="result-header">
                <span>Bulk DNS Results (${domains.length} domains)</span>
                <button class="copy-btn" onclick="copyToClipboard(JSON.stringify(${JSON.stringify(results)}, null, 2))">Copy All</button>
            </div>`;

        for (const [domain, domainResults] of Object.entries(grouped)) {
            const allSuccess = domainResults.every(r => r.success);
            html += `<div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: var(--accent-primary);">${domain}</strong>
                    <span class="badge ${allSuccess ? 'badge-success' : 'badge-warning'}">${domainResults.filter(r => r.success).length}/${domainResults.length} resolved</span>
                </div>`;

            for (const result of domainResults) {
                const serverName = result.server.split('(')[0].trim();
                if (result.success) {
                    html += `<div style="margin-left: 16px; margin-top: 4px; font-size: 0.75rem;">
                        <span class="badge badge-info" style="font-size: 0.65rem;">${serverName}</span>
                        <span style="color: var(--success);"> → ${result.ip_addresses.join(', ')}</span>
                    </div>`;
                } else {
                    html += `<div style="margin-left: 16px; margin-top: 4px; font-size: 0.75rem;">
                        <span class="badge badge-info" style="font-size: 0.65rem;">${serverName}</span>
                        <span style="color: var(--error);"> → Failed: ${result.error}</span>
                    </div>`;
                }
            }
            html += `</div>`;
        }

        html += `</div>`;
        resultDiv.innerHTML = html;

    } catch (error) {
        resultDiv.innerHTML = `<div class="result-container"><span class="badge badge-error">Error: ${error.message}</span></div>`;
    }
}

// Helper function to show detailed output
function showDetails(title, content) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        animation: fadeIn 0.2s ease;
    `;

    modal.innerHTML = `
        <div style="background: var(--bg-card); border-radius: 16px; max-width: 600px; width: 90%; max-height: 80%; overflow: hidden; border: 1px solid var(--border);">
            <div style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: var(--accent-primary);">${title}</strong>
                <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer;">&times;</button>
            </div>
            <div style="padding: 16px; overflow-y: auto; max-height: 70vh; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; white-space: pre-wrap;">
                ${escapeHtml(content)}
            </div>
            <div style="padding: 16px; border-top: 1px solid var(--border);">
                <button class="btn-secondary" onclick="copyToClipboard('${escapeHtml(content)}'); this.closest('div').parentElement.remove()">Copy to Clipboard</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// ========== Initial Load ==========
runFullDiagnostic();
loadInterfaces();