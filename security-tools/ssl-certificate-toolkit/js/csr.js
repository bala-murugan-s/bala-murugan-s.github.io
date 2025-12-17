// CSR Generation
function generateCSR() {
    const cn = document.getElementById('csrCN').value.trim();
    if (!cn) {
        showAlert('Common Name (CN) is required', 'danger');
        return;
    }

    const keyType = document.getElementById('csrKeyType').value;
    const keySize = parseInt(document.getElementById('csrKeySize').value);
    const o = document.getElementById('csrO').value.trim();
    const ou = document.getElementById('csrOU').value.trim();
    const l = document.getElementById('csrL').value.trim();
    const st = document.getElementById('csrST').value.trim();
    const c = document.getElementById('csrC').value.trim().toUpperCase();
    const sanInput = document.getElementById('csrSAN').value.trim();
    const format = document.getElementById('csrFormat').value;

    try {
        let keypair;
        if (keyType === 'RSA') {
            keypair = KEYUTIL.generateKeypair('RSA', keySize);
        } else {
            keypair = KEYUTIL.generateKeypair('EC', 'secp256r1');
        }

        let subject = `/CN=${cn}`;
        if (o) subject += `/O=${o}`;
        if (ou) subject += `/OU=${ou}`;
        if (l) subject += `/L=${l}`;
        if (st) subject += `/ST=${st}`;
        if (c) subject += `/C=${c}`;

        const csr = new KJUR.asn1.csr.CertificationRequest({
            subject: { str: subject },
            sbjpubkey: keypair.pubKeyObj,
            sbjprvkey: keypair.prvKeyObj,   // ✅ REQUIRED
            sigalg: keyType === 'RSA'
                ? 'SHA256withRSA'
                : 'SHA256withECDSA'
        });
                if (sanInput) {
            const sans = sanInput.split(',').map(s => s.trim()).filter(s => s);
            const sanArray = sans.map(san => {
                if (san.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                    return { ip: san };
                }
                return { dns: san };
            });
            csr.params.extreq = [{
                extname: "subjectAltName",
                array: sanArray
            }];
        }

        const csrPEM = csr.getPEM();
        const privateKeyPEM = KEYUTIL.getPEM(keypair.prvKeyObj, 'PKCS8PRV');

        displayCSRResults(csrPEM, privateKeyPEM, format, keyType, keySize, subject, sanInput);
        showAlert('CSR and Private Key generated successfully!', 'success');
    } catch (error) {
        showAlert('Error generating CSR: ' + error.message, 'danger');
        console.error(error);
    }
}

function displayCSRResults(csr, key, format, keyType, keySize, subject, san) {
    const outputDiv = document.getElementById('csrOutput');
    
    // Generate different format outputs
    let csrOutputs = {
        PEM: csr,
        DER: null,
        PKCS10: null,
        TEXT: null
    };
    
    // DER format
    if (format === 'DER') {
        const b64 = csr.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
        csrOutputs.DER = atob(b64);
    }
    
    // PKCS#10 Base64
    csrOutputs.PKCS10 = csr.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    
    // Text format (human readable)
    try {
        const csrInfo = KJUR.asn1.csr.CSRUtil.getInfo(csr);
        csrOutputs.TEXT = `Certificate Request:
    Data:
        Subject: ${csrInfo.subject.str}
        Subject Public Key Info:
            Public Key Algorithm: ${keyType}
            ${keyType === 'RSA' ? `RSA Public Key: (${keySize} bit)` : 'EC Public Key'}
        Requested Extensions:
            ${san ? `subjectAltName: ${san}` : 'None'}
    Signature Algorithm: ${csrInfo.sigalg}`;
    } catch (e) {
        csrOutputs.TEXT = 'Unable to parse CSR in text format';
    }
    
    outputDiv.innerHTML = `
        <div class="output-section">
            <h3>✅ Generated Successfully</h3>
            <div class="info-card">
                <p><strong>Key Type:</strong> ${keyType}</p>
                <p><strong>Key Size:</strong> ${keyType === 'RSA' ? keySize + ' bits' : 'P-256'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                ${san ? `<p><strong>SAN:</strong> ${san}</p>` : ''}
                <p><strong>Format:</strong> ${format}</p>
            </div>
            
            <div class="form-group">
                <label>Select Output Format to Download</label>
                <select id="csrDownloadFormat" onchange="updateCSRDownloadPreview()">
                    <option value="PEM">PEM (.csr)</option>
                    <option value="DER">DER (.der)</option>
                    <option value="PKCS10">PKCS#10 Base64 (.txt)</option>
                    <option value="TEXT">Text Format (.txt)</option>
                </select>
            </div>
            
            <h4>Certificate Signing Request (CSR) - ${format} Format</h4>
            <textarea readonly id="csrDisplayArea" style="height: 200px;">${csrOutputs[format] || csrOutputs.PEM}</textarea>
            <button class="btn" onclick="downloadCSRFormat('${format}')">📥 Download CSR (${format})</button>
            <button class="btn" onclick="downloadAllCSRFormats()">📦 Download All Formats</button>
            
            <h4>Private Key</h4>
            <textarea readonly style="height: 200px;">${key}</textarea>
            <button class="btn btn-warning" onclick="downloadFile('private.key', \`${key}\`, 'PEM')">📥 Download Private Key</button>
            
            <div class="alert alert-warning" style="margin-top: 20px;">
                <strong>⚠️ Security Warning:</strong> Keep your private key secure! Never share it or upload it to any server.
            </div>
        </div>
    `;

    // Store CSR outputs globally for download functions
    window.currentCSROutputs = csrOutputs;
    window.currentPrivateKey = key;

    const keyAlg = keyType === 'RSA' ? `genrsa -out private.key ${keySize}` : `ecparam -genkey -name prime256v1 -out private.key`;
    let opensslCmd = `# Generate Private Key\nopenssl ${keyAlg}\n\n# Generate CSR\nopenssl req -new -key private.key -out request.csr`;
    if (san) {
        opensslCmd += ` -addext "subjectAltName=DNS:${san.split(',').map(s => s.trim()).join(',DNS:')}"`;
    }

    outputDiv.innerHTML += `
        <div class="output-section">
            <h3>📋 Equivalent OpenSSL Commands</h3>
            <div class="command-box">
                <button class="copy-btn" onclick="copyToClipboard(\`${opensslCmd}\`, this)">Copy</button>
                <code>${opensslCmd}</code>
            </div>
            
            <h4>Convert CSR to Different Formats</h4>
            <div class="command-box">
                <h5>PEM to DER</h5>
                <button class="copy-btn" onclick="copyToClipboard('openssl req -in request.csr -outform DER -out request.der', this)">Copy</button>
                <code>openssl req -in request.csr -outform DER -out request.der</code>
            </div>
            <div class="command-box">
                <h5>DER to PEM</h5>
                <button class="copy-btn" onclick="copyToClipboard('openssl req -in request.der -inform DER -out request.csr', this)">Copy</button>
                <code>openssl req -in request.der -inform DER -out request.csr</code>
            </div>
            <div class="command-box">
                <h5>View CSR in Text Format</h5>
                <button class="copy-btn" onclick="copyToClipboard('openssl req -in request.csr -text -noout', this)">Copy</button>
                <code>openssl req -in request.csr -text -noout</code>
            </div>
        </div>
    `;
}

function updateCSRDownloadPreview() {
    const format = document.getElementById('csrDownloadFormat').value;
    const displayArea = document.getElementById('csrDisplayArea');
    
    if (window.currentCSROutputs && window.currentCSROutputs[format]) {
        if (format === 'DER') {
            displayArea.value = '[Binary DER data - download to view]';
        } else {
            displayArea.value = window.currentCSROutputs[format];
        }
    }
}

function downloadCSRFormat(format) {
    if (!window.currentCSROutputs) {
        showAlert('No CSR data available', 'danger');
        return;
    }
    
    const data = window.currentCSROutputs[format];
    if (!data) {
        showAlert('Format not available', 'danger');
        return;
    }
    
    let filename, fileType;
    switch(format) {
        case 'PEM':
            filename = 'request.csr';
            fileType = 'PEM';
            downloadFile(filename, data, fileType);
            break;
        case 'DER':
            filename = 'request.der';
            downloadBinary(filename, btoa(data));
            break;
        case 'PKCS10':
            filename = 'request-base64.txt';
            downloadFile(filename, data, 'PEM');
            break;
        case 'TEXT':
            filename = 'request-info.txt';
            downloadFile(filename, data, 'PEM');
            break;
    }
    
    showAlert(`CSR downloaded in ${format} format`, 'success');
}

function downloadAllCSRFormats() {
    if (!window.currentCSROutputs) {
        showAlert('No CSR data available', 'danger');
        return;
    }
    
    // Download PEM
    downloadFile('request.csr', window.currentCSROutputs.PEM, 'PEM');
    
    // Download DER
    if (window.currentCSROutputs.DER) {
        setTimeout(() => downloadBinary('request.der', btoa(window.currentCSROutputs.DER)), 200);
    }
    
    // Download PKCS10
    setTimeout(() => downloadFile('request-base64.txt', window.currentCSROutputs.PKCS10, 'PEM'), 400);
    
    // Download TEXT
    setTimeout(() => downloadFile('request-info.txt', window.currentCSROutputs.TEXT, 'PEM'), 600);
    
    // Download Private Key
    setTimeout(() => downloadFile('private.key', window.currentPrivateKey, 'PEM'), 800);
    
    showAlert('All formats downloaded!', 'success');
}