let currentVendor = null;
let mode = 'demo';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMode();
    setupEventListeners();
});

async function loadMode() {
    try {
        const response = await fetch('/api/mode');
        const data = await response.json();
        mode = data.mode;
        updateModeUI();
    } catch (error) {
        console.error('Failed to load mode:', error);
    }
}

function updateModeUI() {
    const modeSpan = document.getElementById('modeValue');
    modeSpan.textContent = mode === 'live' ? 'Live' : 'Demo';
    modeSpan.className = `badge ${mode === 'live' ? 'live' : 'demo'}`;
}

function setupEventListeners() {
    // Vendor selection
    document.querySelectorAll('.vendor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentVendor = btn.dataset.vendor;
            showWizard(currentVendor);
        });
    });

    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showVendorSelection();
        });
    });

    // Disconnect button
    document.getElementById('disconnectBtn')?.addEventListener('click', () => {
        showVendorSelection();
    });

    // Switch mode button
    document.getElementById('switchModeBtn')?.addEventListener('click', async () => {
        const newMode = mode === 'live' ? 'demo' : 'live';
        try {
            const response = await fetch('/api/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: newMode })
            });
            if (response.ok) {
                mode = newMode;
                updateModeUI();
                alert(`Switched to ${newMode} mode`);
            }
        } catch (error) {
            console.error('Failed to switch mode:', error);
        }
    });

    // Palo Alto form submission
    document.getElementById('paloaltoForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await testPaloAltoConnection();
    });

    // Fortinet form submission
    document.getElementById('fortinetForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await testFortinetConnection();
    });

    // Authentication method change
    document.getElementById('paAuthMethod')?.addEventListener('change', (e) => {
        const isApiKey = e.target.value === 'apiKey';
        document.getElementById('paApiKeyGroup').style.display = isApiKey ? 'block' : 'none';
        document.getElementById('paUserPassGroup').style.display = isApiKey ? 'none' : 'block';
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

function showVendorSelection() {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('vendorSelection').classList.add('active');
    currentVendor = null;
}

function showWizard(vendor) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    if (vendor === 'paloalto') {
        document.getElementById('paloaltoWizard').classList.add('active');
    } else {
        document.getElementById('fortinetWizard').classList.add('active');
    }
}

async function testPaloAltoConnection() {
    const ip = document.getElementById('paIp').value;
    const authMethod = document.getElementById('paAuthMethod').value;
    let apiKey = null;
    let username = null;
    let password = null;

    if (authMethod === 'apiKey') {
        apiKey = document.getElementById('paApiKey').value;
    } else {
        username = document.getElementById('paUsername').value;
        password = document.getElementById('paPassword').value;
    }

    const resultDiv = document.getElementById('paTestResult');
    resultDiv.innerHTML = 'Testing connection...';
    resultDiv.className = 'test-result';

    try {
        const response = await fetch('/api/paloalto/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, apiKey, username, password })
        });

        if (response.ok) {
            resultDiv.innerHTML = '✓ Connection successful! Loading dashboard...';
            resultDiv.className = 'test-result success';
            setTimeout(() => loadDashboard('paloalto'), 1000);
        } else {
            const error = await response.text();
            resultDiv.innerHTML = `✗ Connection failed: ${error}`;
            resultDiv.className = 'test-result error';
        }
    } catch (error) {
        resultDiv.innerHTML = `✗ Connection error: ${error.message}`;
        resultDiv.className = 'test-result error';
    }
}

async function testFortinetConnection() {
    const ip = document.getElementById('ftIp').value;
    const token = document.getElementById('ftToken').value;
    const port = parseInt(document.getElementById('ftPort').value);

    const resultDiv = document.getElementById('ftTestResult');
    resultDiv.innerHTML = 'Testing connection...';
    resultDiv.className = 'test-result';

    try {
        const response = await fetch('/api/fortinet/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip, token, port })
        });

        if (response.ok) {
            resultDiv.innerHTML = '✓ Connection successful! Loading dashboard...';
            resultDiv.className = 'test-result success';
            setTimeout(() => loadDashboard('fortinet'), 1000);
        } else {
            const error = await response.text();
            resultDiv.innerHTML = `✗ Connection failed: ${error}`;
            resultDiv.className = 'test-result error';
        }
    } catch (error) {
        resultDiv.innerHTML = `✗ Connection error: ${error.message}`;
        resultDiv.className = 'test-result error';
    }
}

function loadDashboard(vendor) {
    currentVendor = vendor;
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    document.getElementById('dashboardTitle').textContent =
        `${vendor === 'paloalto' ? 'Palo Alto' : 'Fortinet'} Firewall Dashboard`;

    refreshDashboard();
    refreshInventory();
    refreshLicenses();
    refreshLogs();
}

async function refreshDashboard() {
    const endpoint = `/api/${currentVendor}/dashboard`;
    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        document.getElementById('cpuValue').textContent = data.cpu || 0;
        document.getElementById('memValue').textContent = data.memory || 0;
        document.getElementById('sessionsValue').textContent = data.sessions || 0;
        document.getElementById('statusValue').textContent = data.status || 'Unknown';

        const alertsContainer = document.getElementById('alertsContainer');
        if (data.alerts && data.alerts.length > 0) {
            alertsContainer.innerHTML = '<h3>Alerts</h3><div class="alerts-list">' +
                data.alerts.map(alert => `<div class="alert ${alert.level}">${alert.message}</div>`).join('') +
                '</div>';
        } else {
            alertsContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

async function refreshInventory() {
    const endpoint = `/api/${currentVendor}/inventory`;
    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        const container = document.getElementById('inventoryTable');
        container.innerHTML = `
            <p><strong>Hostname:</strong> ${data.hostname || 'N/A'}</p>
            <p><strong>IP Address:</strong> ${data.ip || 'N/A'}</p>
            <p><strong>Model:</strong> ${data.model || 'N/A'}</p>
            <p><strong>Serial Number:</strong> ${data.serial || 'N/A'}</p>
            <p><strong>OS Version:</strong> ${data.osVersion || 'N/A'}</p>
            <p><strong>Uptime:</strong> ${data.uptime || 'N/A'}</p>
        `;

        const outputDiv = document.getElementById('inventoryTable');
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Inventory';
        copyBtn.className = 'copy-btn';
        copyBtn.onclick = () => copyToClipboardText(container.innerText);
        outputDiv.appendChild(copyBtn);
    } catch (error) {
        console.error('Failed to load inventory:', error);
    }
}

async function refreshLicenses() {
    const endpoint = `/api/${currentVendor}/licenses`;
    try {
        const response = await fetch(endpoint);
        const licenses = await response.json();

        let html = '<table><thead><tr><th>Name</th><th>Status</th><th>Expiration</th><th>Description</th></tr></thead><tbody>';
        licenses.forEach(license => {
            html += `<tr>
                <td>${license.name}</td>
                <td>${license.status}</td>
                <td>${license.expiration || 'N/A'}</td>
                <td>${license.description || ''}</td>
            </tr>`;
        });
        html += '</tbody></table>';

        const container = document.getElementById('licensesTable');
        container.innerHTML = html;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Licenses';
        copyBtn.className = 'copy-btn';
        copyBtn.onclick = () => copyToClipboardText(container.innerText);
        container.appendChild(copyBtn);
    } catch (error) {
        console.error('Failed to load licenses:', error);
    }
}

async function refreshLogs() {
    const logType = document.getElementById('logType').value;
    const limit = document.getElementById('logLimit').value;
    const endpoint = `/api/${currentVendor}/logs?type=${logType}&limit=${limit}`;

    try {
        const response = await fetch(endpoint);
        const logs = await response.json();

        let html = '<table><thead><tr><th>Timestamp</th><th>Source IP</th><th>Dest IP</th><th>Protocol</th><th>Action</th>';
        if (logType === 'threat') html += '<th>Threat</th><th>Severity</th>';
        html += '</tr></thead><tbody>';

        logs.forEach(log => {
            html += `<tr>
                <td>${log.timestamp}</td>
                <td>${log.sourceIP}</td>
                <td>${log.destIP}</td>
                <td>${log.protocol}</td>
                <td>${log.action}</td>`;
            if (logType === 'threat') {
                html += `<td>${log.threatName || ''}</td>
                        <td>${log.severity || ''}</td>`;
            }
            html += `</tr>`;
        });
        html += '</tbody></table>';

        const container = document.getElementById('logsTable');
        container.innerHTML = html;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy Logs';
        copyBtn.className = 'copy-btn';
        copyBtn.onclick = () => copyToClipboardText(container.innerText);
        container.appendChild(copyBtn);
    } catch (error) {
        console.error('Failed to load logs:', error);
    }
}

async function executeCLI() {
    const command = document.getElementById('cliCommand').value;
    if (!command) {
        alert('Please enter a command');
        return;
    }

    const endpoint = `/api/${currentVendor}/cli`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        const data = await response.json();
        document.getElementById('cliOutput').textContent = data.output || 'No output';
    } catch (error) {
        document.getElementById('cliOutput').textContent = `Error: ${error.message}`;
    }
}

async function refreshConfig() {
    const endpoint = `/api/${currentVendor}/config`;
    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        const policiesOutput = document.getElementById('policiesOutput');
        policiesOutput.textContent = JSON.stringify(data.policies, null, 2);
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'config-tab') {
        refreshConfig();
    }
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    copyToClipboardText(element.textContent);
}

function copyToClipboardText(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}