// Update Converter UI based on selection
function updateConverterUI() {
    const convType = document.getElementById('conversionType').value;
    const pfxInputSection = document.getElementById('pfxInputSection');
    const pfxExtractSection = document.getElementById('pfxExtractSection');
    
    // Hide all special sections
    pfxInputSection.style.display = 'none';
    pfxExtractSection.style.display = 'none';
    
    // Show relevant sections
    if (convType === 'pem2pfx') {
        pfxInputSection.style.display = 'block';
    } else if (convType === 'pfx2pem') {
        pfxExtractSection.style.display = 'block';
    }
}

// Converter Functions
function performConversion() {
    const convType = document.getElementById('conversionType').value;
    
    if (convType === 'pem2pfx') {
        convertPEMtoPFX();
    } else if (convType === 'pfx2pem') {
        convertPFXtoPEM();
    } else {
        performBulkConversion();
    }
}

function performBulkConversion() {
    const files = document.getElementById('converterFile').files;
    const convType = document.getElementById('conversionType').value;

    if (files.length === 0) {
        showAlert('Please upload files first', 'danger');
        return;
    }

    const outputDiv = document.getElementById('converterOutput');
    outputDiv.innerHTML = '<div class="output-section"><h3>🔄 Conversion Results</h3></div>';

    Array.from(files).forEach((file, index) => {
        processFileConversion(file, convType, outputDiv);
    });
}

function processFileConversion(file, convType, outputDiv) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let result, newFilename, displayContent;

            if (convType === 'pem2der') {
                const b64 = content.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
                result = atob(b64);
                newFilename = file.name.replace(/\.(pem|crt|cer|key|csr)$/, '.der');
                
                outputDiv.innerHTML += `
                    <div class="info-card">
                        <p><strong>${file.name}</strong> → <strong>${newFilename}</strong></p>
                        <p>Format: PEM to DER (Binary)</p>
                        <button class="btn" onclick="downloadBinary('${newFilename}', '${btoa(result)}')">📥 Download DER</button>
                    </div>
                `;
            } else if (convType === 'der2pem') {
                // Handle binary DER files
                handleDERtoPEM(file, outputDiv);
                return;
            } else if (convType === 'pem2pkcs7') {
                const b64 = content.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
                const pkcs7 = createPKCS7(b64);
                newFilename = file.name.replace(/\.(pem|crt|cer)$/, '.p7b');
                displayContent = pkcs7;
                
                outputDiv.innerHTML += `
                    <div class="info-card">
                        <p><strong>${file.name}</strong> → <strong>${newFilename}</strong></p>
                        <p>Format: PEM to PKCS#7</p>
                        <textarea readonly style="height: 150px;">${pkcs7}</textarea>
                        <button class="btn" onclick="downloadFile('${newFilename}', \`${pkcs7}\`, 'PEM')">📥 Download PKCS#7</button>
                    </div>
                `;
            } else if (convType === 'pkcs72pem') {
                const extracted = extractFromPKCS7(content);
                newFilename = file.name.replace(/\.p7b$/, '.pem');
                
                outputDiv.innerHTML += `
                    <div class="info-card">
                        <p><strong>${file.name}</strong> → <strong>${newFilename}</strong></p>
                        <p>Format: PKCS#7 to PEM</p>
                        <textarea readonly style="height: 150px;">${extracted}</textarea>
                        <button class="btn" onclick="downloadFile('${newFilename}', \`${extracted}\`, 'PEM')">📥 Download PEM</button>
                    </div>
                `;
            } else if (convType === 'csr2pem' || convType === 'csr2der') {
                convertCSRFormat(content, file.name, convType, outputDiv);
            }

            showAlert(`Converted ${file.name}`, 'success');
        } catch (error) {
            showAlert(`Error converting ${file.name}: ${error.message}`, 'danger');
        }
    };

    if (convType === 'der2pem') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

function handleDERtoPEM(file, outputDiv) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const bytes = new Uint8Array(e.target.result);
            const binary = String.fromCharCode(...bytes);
            const b64 = btoa(binary);
            const lines = b64.match(/.{1,64}/g) || [];
            
            // Detect type based on ASN.1 structure
            let type = 'CERTIFICATE';
            if (file.name.includes('key')) type = 'PRIVATE KEY';
            if (file.name.includes('csr')) type = 'CERTIFICATE REQUEST';
            
            const pem = `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----\n`;
            const newFilename = file.name.replace(/\.der$/, '.pem');

            outputDiv.innerHTML += `
                <div class="info-card">
                    <p><strong>${file.name}</strong> → <strong>${newFilename}</strong></p>
                    <p>Format: DER to PEM</p>
                    <textarea readonly style="height: 150px;">${pem}</textarea>
                    <button class="btn" onclick="downloadFile('${newFilename}', \`${pem}\`, 'PEM')">📥 Download PEM</button>
                </div>
            `;
            showAlert(`Converted ${file.name}`, 'success');
        } catch (error) {
            showAlert(`Error converting ${file.name}: ${error.message}`, 'danger');
        }
    };
    reader.readAsArrayBuffer(file);
}

function createPKCS7(certB64) {
    const lines = certB64.match(/.{1,64}/g) || [];
    return `-----BEGIN PKCS7-----\n${lines.join('\n')}\n-----END PKCS7-----\n`;
}

function extractFromPKCS7(pkcs7Content) {
    const b64 = pkcs7Content.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const lines = b64.match(/.{1,64}/g) || [];
    return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
}

function convertCSRFormat(content, filename, convType, outputDiv) {
    if (convType === 'csr2der') {
        const b64 = content.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
        const result = atob(b64);
        const newFilename = filename.replace(/\.(pem|csr)$/, '.der');
        
        outputDiv.innerHTML += `
            <div class="info-card">
                <p><strong>${filename}</strong> → <strong>${newFilename}</strong></p>
                <p>Format: CSR to DER</p>
                <button class="btn" onclick="downloadBinary('${newFilename}', '${btoa(result)}')">📥 Download DER</button>
            </div>
        `;
    } else if (convType === 'csr2pem') {
        const b64 = content.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
        const lines = b64.match(/.{1,64}/g) || [];
        const pem = `-----BEGIN CERTIFICATE REQUEST-----\n${lines.join('\n')}\n-----END CERTIFICATE REQUEST-----\n`;
        const newFilename = filename.replace(/\.der$/, '.csr');
        
        outputDiv.innerHTML += `
            <div class="info-card">
                <p><strong>${filename}</strong> → <strong>${newFilename}</strong></p>
                <p>Format: CSR to PEM</p>
                <textarea readonly style="height: 150px;">${pem}</textarea>
                <button class="btn" onclick="downloadFile('${newFilename}', \`${pem}\`, 'PEM')">📥 Download PEM</button>
            </div>
        `;
    }
}

function convertPEMtoPFX() {
    const certFile = document.getElementById('pfxCertFile').files[0];
    const keyFile  = document.getElementById('pfxKeyFile').files[0];

    const manualCert  = document.getElementById('manualCert')?.value.trim();
    const manualKey   = document.getElementById('manualKey')?.value.trim();
    const manualChain = document.getElementById('manualChain')?.value.trim();

    const password = document.getElementById('pfxPassword').value;
    const friendlyName = document.getElementById('pfxFriendlyName').value || 'My Certificate';

    if (!password) {
        showAlert('PFX password is required', 'danger');
        return;
    }

    // Case 1: Manual canvas input
    if (manualCert && manualKey) {
        renderPEMtoPFXOutput(manualCert, manualKey, manualChain, friendlyName);
        return;
    }

    // Case 2: File upload input
    if (!certFile || !keyFile) {
        showAlert('Upload certificate + key OR paste them in the input boxes', 'danger');
        return;
    }

    showAlert('PFX creation is simulated. Use OpenSSL command for real PFX.', 'warning');

    const certReader = new FileReader();
    certReader.onload = function (e1) {
        const keyReader = new FileReader();
        keyReader.onload = function (e2) {
            renderPEMtoPFXOutput(
                e1.target.result,
                e2.target.result,
                '',
                friendlyName
            );
        };
        keyReader.readAsText(keyFile);
    };
    certReader.readAsText(certFile);
}


function convertPFXtoPEM() {
    showAlert('PFX extraction requires PKCS#12 library. Use OpenSSL command provided.', 'warning');
    const outputDiv = document.getElementById('converterOutput');
    outputDiv.innerHTML = `
        <div class="output-section">
            <h3>📦 PFX Extraction</h3>
            <div class="alert alert-warning">
                <p><strong>Note:</strong> Use OpenSSL to extract from PFX files:</p>
            </div>
            <div class="command-box">
                <h4>Extract Certificate</h4>
                <button class="copy-btn" onclick="copyToClipboard('openssl pkcs12 -in certificate.pfx -clcerts -nokeys -out certificate.crt', this)">Copy</button>
                <code>openssl pkcs12 -in certificate.pfx -clcerts -nokeys -out certificate.crt</code>
            </div>
            <div class="command-box">
                <h4>Extract Private Key</h4>
                <button class="copy-btn" onclick="copyToClipboard('openssl pkcs12 -in certificate.pfx -nocerts -nodes -out private.key', this)">Copy</button>
                <code>openssl pkcs12 -in certificate.pfx -nocerts -nodes -out private.key</code>
            </div>
            <div class="command-box">
                <h4>Extract CA Chain</h4>
                <button class="copy-btn" onclick="copyToClipboard('openssl pkcs12 -in certificate.pfx -cacerts -nokeys -out ca-chain.crt', this)">Copy</button>
                <code>openssl pkcs12 -in certificate.pfx -cacerts -nokeys -out ca-chain.crt</code>
            </div>
        </div>
    `;
}

function downloadBinary(filename, base64Content) {
    const binary = atob(base64Content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], {type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize converter UI
if (document.getElementById('conversionType')) {
    updateConverterUI();
}
function pemToPKCS8() {
    const key = document.getElementById('manualKey').value;
    if (!key) {
        showAlert('Paste a private key', 'danger');
        return;
    }

    renderOutput(
        'PEM → PKCS#8 (OpenSSL)',
        'pkcs8.key',
`openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private.key -out pkcs8.key`
    );
}
function encryptDecryptKey(encrypt = true) {
    const cmd = encrypt
        ? 'openssl rsa -aes256 -in private.key -out private-encrypted.key'
        : 'openssl rsa -in private-encrypted.key -out private.key';

    renderOutput(
        encrypt ? 'Encrypt Private Key' : 'Decrypt Private Key',
        'openssl-command.txt',
        cmd
    );
}
function pfxToCRT() {
    renderOutput(
        'PFX → CRT (OpenSSL)',
        'extract-crt.txt',
`openssl pkcs12 -in certificate.pfx -clcerts -nokeys -out certificate.crt`
    );
}
function pfxToJKS() {
    renderOutput(
        'PFX → JKS (keytool)',
        'pfx-to-jks.txt',
`keytool -importkeystore -srckeystore certificate.pfx -srcstoretype PKCS12 -destkeystore keystore.jks -deststoretype JKS`
    );
}
function renderPEMtoPFXOutput(cert, key, chain, friendlyName) {
    const combined = `${cert}\n${key}${chain ? '\n' + chain : ''}`;
    const outputDiv = document.getElementById('converterOutput');

    outputDiv.innerHTML = `
        <div class="output-section">
            <h3>📦 PFX Creation (Client-Side Simulation)</h3>

            <div class="alert alert-warning">
                <strong>Important:</strong> Browsers cannot generate real PFX files.
                Use the OpenSSL command below.
            </div>

            <div class="command-box">
                <button class="copy-btn"
                    onclick="copyToClipboard(
                    \`openssl pkcs12 -export -out certificate.pfx -inkey private.key -in certificate.crt -certfile chain.crt -name '${friendlyName}'\`,
                    this)">
                    📋 Copy
                </button>
                <code>
openssl pkcs12 -export -out certificate.pfx -inkey private.key -in certificate.crt -certfile chain.crt -name "${friendlyName}"
                </code>
            </div>

            <h4>📄 Combined PEM Bundle</h4>
            <textarea readonly style="height:220px">${combined}</textarea>

            <div class="btn-group">
                <button class="btn" onclick="copyToClipboard(\`${combined}\`, this)">📋 Copy PEM</button>
                <button class="btn" onclick="downloadFile('bundle.pem', \`${combined}\`, 'PEM')">📥 Download PEM</button>
            </div>
        </div>
    `;
}
function updateConverterUI() {
    const convType = document.getElementById('conversionType').value;

    const pfxInputSection    = document.getElementById('pfxInputSection');
    const pfxExtractSection  = document.getElementById('pfxExtractSection');
    const manualInputSection = document.getElementById('manualInputSection');

    // Hide everything first
    pfxInputSection.style.display = 'none';
    pfxExtractSection.style.display = 'none';
    manualInputSection.style.display = 'none';

    // Show required sections
    if (
        convType === 'pem2der' ||
        convType === 'pem2pkcs7' ||
        convType === 'pkcs72pem' ||
        convType === 'csr2pem' ||
        convType === 'csr2der'
    ) {
        manualInputSection.style.display = 'block';
    }

    if (convType === 'pem2pfx') {
        pfxInputSection.style.display = 'block';
        manualInputSection.style.display = 'block';
    }

    if (convType === 'pfx2pem') {
        pfxExtractSection.style.display = 'block';
    }
}
