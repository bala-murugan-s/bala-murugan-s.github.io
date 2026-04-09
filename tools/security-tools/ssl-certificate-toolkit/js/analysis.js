// Analysis Functions
// Helper function for calculating days (local to analysis.js)
function calculateDaysUntil(dateString) {
    try {
        const expiry = new Date(dateString);
        const now = new Date();
        const diff = expiry - now;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    } catch (error) {
        console.error('Error calculating days:', error);
        return 'N/A';
    }
}

function performAnalysis() {
    const files = document.getElementById('analysisFile').files;
    const analysisType = document.getElementById('analysisType').value;

    if (files.length === 0) {
        showAlert('Please upload files first', 'danger');
        return;
    }

    if (analysisType === 'decode-cert') {
        decodeCertificate(files[0]);
    } else if (analysisType === 'lint') {
        lintCertificate(files[0]);
    } else if (analysisType === 'expiry') {
        calculateExpiry(files[0]);
    } else if (analysisType === 'extract-all') {
        extractAllFromFile();  // New function
    } else {
        showAlert('Analysis type: ' + analysisType, 'warning');
    }
}
function decodeCertificate(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const cert = new X509();
            cert.readCertPEM(content);

            const issuer = cert.getIssuerString();
            const subject = cert.getSubjectString();
            const notBefore = cert.getNotBefore();
            const notAfter = cert.getNotAfter();
            const serial = cert.getSerialNumberHex();
            const sigAlg = cert.getSignatureAlgorithmName();

            let san = 'None';
            try {
                const sanExt = cert.getExtSubjectAltName();
                if (sanExt && sanExt.array) {
                    san = sanExt.array.map(item => {
                        if (item.dns) return 'DNS:' + item.dns;
                        if (item.ip) return 'IP:' + item.ip;
                        return JSON.stringify(item);
                    }).join(', ');
                }
            } catch (e) { }

            let keyInfo = 'Unknown';
            try {
                const pubKey = cert.getPublicKey();
                if (pubKey.type === 'RSA') {
                    keyInfo = `RSA ${pubKey.n.bitLength()} bits`;
                } else if (pubKey.type === 'EC') {
                    keyInfo = `ECDSA (curve: ${pubKey.curveName || 'unknown'})`;
                }
            } catch (e) { }

            const outputDiv = document.getElementById('analysisOutput');
            outputDiv.innerHTML = `
                <div class="output-section">
                    <h3>📋 Certificate Details</h3>
                    <div class="info-card">
                        <h4>Subject Information</h4>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Issuer:</strong> ${issuer}</p>
                        <p><strong>Serial Number:</strong> ${serial}</p>
                    </div>
                    <div class="info-card">
                        <h4>Validity Period</h4>
                        <p><strong>Not Before:</strong> ${notBefore}</p>
                        <p><strong>Not After:</strong> ${notAfter}</p>
                        <p><strong>Days Until Expiry:</strong> ${calculateDaysUntil(notAfter)}</p>
                    </div>
                    <div class="info-card">
                        <h4>Technical Details</h4>
                        <p><strong>Public Key:</strong> ${keyInfo}</p>
                        <p><strong>Signature Algorithm:</strong> ${sigAlg}</p>
                        <p><strong>Subject Alternative Names:</strong> ${san}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            showAlert('Error decoding certificate: ' + error.message, 'danger');
        }
    };
    reader.readAsText(file);
}

function lintCertificate(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const cert = new X509();
            cert.readCertPEM(content);

            const issues = [];
            const warnings = [];
            const passed = [];

            const notAfter = cert.getNotAfter();
            const daysUntilExpiry = calculateDaysUntil(notAfter);
            if (daysUntilExpiry < 0) {
                issues.push('❌ Certificate has EXPIRED');
            } else if (daysUntilExpiry < 30) {
                warnings.push(`⚠️ Certificate expires soon (${daysUntilExpiry} days)`);
            } else {
                passed.push(`✅ Valid for ${daysUntilExpiry} days`);
            }

            const sigAlg = cert.getSignatureAlgorithmName().toLowerCase();
            if (sigAlg.includes('md5') || sigAlg.includes('sha1')) {
                issues.push('❌ Weak signature algorithm: ' + sigAlg);
            } else {
                passed.push('✅ Strong signature algorithm: ' + sigAlg);
            }

            try {
                const pubKey = cert.getPublicKey();
                if (pubKey.type === 'RSA') {
                    const keySize = pubKey.n.bitLength();
                    if (keySize < 2048) {
                        issues.push(`❌ Weak RSA key size: ${keySize} bits`);
                    } else {
                        passed.push(`✅ Strong RSA key: ${keySize} bits`);
                    }
                }
            } catch (e) {
                warnings.push('⚠️ Could not verify key strength');
            }

            const outputDiv = document.getElementById('analysisOutput');
            outputDiv.innerHTML = `
                <div class="output-section">
                    <h3>🔍 Certificate Linter Results</h3>
                    ${issues.length > 0 ? `
                        <div class="alert alert-danger">
                            <h4>Critical Issues</h4>
                            ${issues.map(i => `<p>${i}</p>`).join('')}
                        </div>
                    ` : ''}
                    ${warnings.length > 0 ? `
                        <div class="alert alert-warning">
                            <h4>Warnings</h4>
                            ${warnings.map(w => `<p>${w}</p>`).join('')}
                        </div>
                    ` : ''}
                    ${passed.length > 0 ? `
                        <div class="alert alert-success">
                            <h4>Passed Checks</h4>
                            ${passed.map(p => `<p>${p}</p>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } catch (error) {
            showAlert('Error linting certificate: ' + error.message, 'danger');
        }
    };
    reader.readAsText(file);
}

function calculateExpiry(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const cert = new X509();
            cert.readCertPEM(content);

            const notBefore = new Date(cert.getNotBefore());
            const notAfter = new Date(cert.getNotAfter());
            const now = new Date();

            const daysUntilExpiry = calculateDaysUntil(cert.getNotAfter());
            const totalValidity = Math.floor((notAfter - notBefore) / (1000 * 60 * 60 * 24));
            const daysUsed = Math.floor((now - notBefore) / (1000 * 60 * 60 * 24));
            const percentUsed = Math.round((daysUsed / totalValidity) * 100);

            const renewalDate = new Date(notAfter);
            renewalDate.setDate(renewalDate.getDate() - 30);

            const outputDiv = document.getElementById('analysisOutput');
            outputDiv.innerHTML = `
                <div class="output-section">
                    <h3>📅 Certificate Expiry Analysis</h3>
                    <div class="info-card">
                        <h4>Validity Period</h4>
                        <p><strong>Issued:</strong> ${notBefore.toLocaleDateString()}</p>
                        <p><strong>Expires:</strong> ${notAfter.toLocaleDateString()}</p>
                        <p><strong>Total Validity:</strong> ${totalValidity} days</p>
                    </div>
                    <div class="info-card">
                        <h4>Current Status</h4>
                        <p><strong>Days Remaining:</strong> <span style="color: ${daysUntilExpiry < 30 ? 'var(--danger)' : 'var(--success)'}; font-size: 1.5rem;">${daysUntilExpiry}</span></p>
                        <p><strong>Lifecycle Used:</strong> ${percentUsed}%</p>
                        <div style="background: var(--bg-primary); height: 30px; border-radius: 15px; overflow: hidden; margin-top: 10px;">
                            <div style="background: ${percentUsed > 80 ? 'var(--danger)' : 'var(--success)'}; height: 100%; width: ${percentUsed}%;"></div>
                        </div>
                    </div>
                    <div class="info-card">
                        <h4>Renewal Recommendation</h4>
                        <p><strong>Recommended Renewal Date:</strong> ${renewalDate.toLocaleDateString()}</p>
                        ${daysUntilExpiry < 30 ? '<p class="alert alert-danger">⚠️ Certificate should be renewed urgently!</p>' : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            showAlert('Error calculating expiry: ' + error.message, 'danger');
        }
    };
    reader.readAsText(file);
}

// Analyze from pasted text
function analyzeFromText() {
    const textInput = document.getElementById('certTextInput').value.trim();
    
    if (!textInput) {
        showAlert('Please paste certificate/CSR/key content', 'danger');
        return;
    }

    try {
        // Detect content type
        if (textInput.includes('BEGIN CERTIFICATE')) {
            analyzeCertificateText(textInput);
        } else if (textInput.includes('BEGIN CERTIFICATE REQUEST') || textInput.includes('BEGIN NEW CERTIFICATE REQUEST')) {
            analyzeCSRText(textInput);
        } else if (textInput.includes('BEGIN') && textInput.includes('KEY')) {
            analyzeKeyText(textInput);
        } else {
            showAlert('Unrecognized format. Please paste PEM formatted content.', 'danger');
        }
    } catch (error) {
        showAlert('Error analyzing text: ' + error.message, 'danger');
    }
}

function analyzeCertificateText(pemContent) {
    try {
        const cert = new X509();
        cert.readCertPEM(pemContent);

        const issuer = cert.getIssuerString();
        const subject = cert.getSubjectString();
        
        // FIX: Proper date parsing from jsrsasign format
        const notBefore = cert.getNotBefore();
        const notAfter = cert.getNotAfter();
        const serial = cert.getSerialNumberHex();
        const sigAlg = cert.getSignatureAlgorithmName();
        const version = cert.version || 3;

        // Convert jsrsasign date format to proper Date object
        const parseJsrsasignDate = (dateStr) => {
            try {
                // jsrsasign returns dates in format: YYYYMMDDHHmmssZ or similar
                if (!dateStr || dateStr === 'Invalid Date') {
                    return null;
                }
                
                // Try direct parsing first
                let date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    return date;
                }
                
                // If that fails, try parsing the format YYYYMMDDHHmmssZ
                const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z?$/);
                if (match) {
                    const [, year, month, day, hour, minute, second] = match;
                    date = new Date(Date.UTC(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                        parseInt(hour),
                        parseInt(minute),
                        parseInt(second)
                    ));
                    return date;
                }
                
                return null;
            } catch (e) {
                console.error('Date parsing error:', e);
                return null;
            }
        };

        const notBeforeDate = parseJsrsasignDate(notBefore);
        const notAfterDate = parseJsrsasignDate(notAfter);

        // Calculate expiry status
        let daysUntilExpiry = 'N/A';
        let expiryStatus = '';
        let expiryClass = '';
        
        if (notAfterDate) {
            const now = new Date();
            const diff = notAfterDate - now;
            daysUntilExpiry = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry < 0) {
                expiryStatus = '❌ EXPIRED';
                expiryClass = 'alert-danger';
            } else if (daysUntilExpiry < 30) {
                expiryStatus = '⚠️ Expiring Soon';
                expiryClass = 'alert-warning';
            } else {
                expiryStatus = '✅ Valid';
                expiryClass = 'alert-success';
            }
        } else {
            expiryStatus = '⚠️ Unknown';
            expiryClass = 'alert-warning';
        }

        // Calculate fingerprints
        const b64 = pemContent.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
        const der = atob(b64);
        const hex = Array.from(der).map(c => 
            ('0' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('');

        const md5 = KJUR.crypto.Util.hashHex(hex, 'md5');
        const sha1 = KJUR.crypto.Util.hashHex(hex, 'sha1');
        const sha256 = KJUR.crypto.Util.hashHex(hex, 'sha256');
        const sha512 = KJUR.crypto.Util.hashHex(hex, 'sha512');

        const formatFingerprint = (hash) => {
            return hash.match(/.{2}/g).join(':').toUpperCase();
        };

        // Extract SAN
        let san = 'None';
        let sanArray = [];
        let sanCount = 0;
        try {
            const sanExt = cert.getExtSubjectAltName();
            if (sanExt && sanExt.array) {
                sanArray = sanExt.array.map(item => {
                    if (item.dns) return 'DNS:' + item.dns;
                    if (item.ip) return 'IP:' + item.ip;
                    return JSON.stringify(item);
                });
                sanCount = sanArray.length;
                san = sanArray.join('<br>');
            }
        } catch (e) {}

        // Extract key info
        let keyInfo = 'Unknown';
        let keyBits = 'N/A';
        let keyColor = 'var(--text-secondary)';
        let keyAlgorithm = 'Unknown';
        try {
            const pubKey = cert.getPublicKey();
            if (pubKey.type === 'RSA') {
                const bits = pubKey.n.bitLength();
                keyBits = bits;
                keyInfo = `RSA ${bits} bits`;
                keyAlgorithm = 'rsaEncryption';
                keyColor = bits >= 2048 ? 'var(--success)' : 'var(--danger)';
            } else if (pubKey.type === 'EC') {
                keyAlgorithm = 'id-ecPublicKey';
                keyInfo = `ECDSA (${pubKey.curveName || 'unknown'})`;
                keyBits = pubKey.curveName === 'secp256r1' ? '256' : 'N/A';
                keyColor = 'var(--success)';
            }
        } catch (e) {}

        // Check for weak key
        let weakKeyWarning = '';
        if (keyBits !== 'N/A' && keyBits < 2048 && keyAlgorithm.includes('rsa')) {
            weakKeyWarning = `
                <tr>
                    <td colspan="2" style="padding: 10px;">
                        <div class="alert alert-warning" style="margin: 0;">
                            ⚠️ <strong>Debian Weak Key:</strong> Key algorithm is vulnerable to the Debian bug
                        </div>
                    </td>
                </tr>
            `;
        }

        // Extract extensions
        let extensions = [];
        try {
            // Basic Constraints
            const basicConstraints = cert.getExtBasicConstraints();
            if (basicConstraints) {
                extensions.push({
                    name: 'Basic Constraints',
                    value: basicConstraints.cA ? 'CA:TRUE' : 'CA:FALSE'
                });
            }

            // Key Usage
            const keyUsage = cert.getExtKeyUsage();
            if (keyUsage) {
                extensions.push({
                    name: 'Key Usage',
                    value: keyUsage.names ? keyUsage.names.join(', ') : 'N/A'
                });
            }

            // Extended Key Usage
            const extKeyUsage = cert.getExtExtKeyUsage();
            if (extKeyUsage && extKeyUsage.array) {
                extensions.push({
                    name: 'Extended Key Usage',
                    value: extKeyUsage.array.join(', ')
                });
            }

            // Subject Key Identifier
            const subjectKeyId = cert.getExtSubjectKeyIdentifier();
            if (subjectKeyId) {
                extensions.push({
                    name: 'Subject Key Identifier',
                    value: subjectKeyId.kid
                });
            }

            // Authority Key Identifier
            const authorityKeyId = cert.getExtAuthorityKeyIdentifier();
            if (authorityKeyId && authorityKeyId.kid) {
                extensions.push({
                    name: 'Authority Key Identifier',
                    value: authorityKeyId.kid
                });
            }
        } catch (e) {
            console.log('Extension extraction error:', e);
        }

        // Format dates nicely for display
        const formatDateForDisplay = (date) => {
            if (!date) return 'Invalid Date';
            try {
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                });
            } catch (e) {
                return 'Invalid Date';
            }
        };

        // Format dates for OpenSSL output (original format)
        const formatDateForOpenSSL = (dateStr) => {
            const date = parseJsrsasignDate(dateStr);
            if (!date) return dateStr;
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = months[date.getUTCMonth()];
            const day = date.getUTCDate();
            const time = date.toUTCString().split(' ')[4]; // Gets HH:MM:SS
            const year = date.getUTCFullYear();
            
            return `${month} ${day} ${time} ${year} GMT`;
        };

        // Parse subject and issuer for better display
        const parseDistinguishedName = (dn) => {
            const parts = {};
            dn.split('/').forEach(part => {
                if (part.includes('=')) {
                    const [key, value] = part.split('=');
                    if (key && value) parts[key.trim()] = value.trim();
                }
            });
            return parts;
        };

        const subjectParts = parseDistinguishedName(subject);
        const issuerParts = parseDistinguishedName(issuer);

        // Check if self-signed
        const isSelfSigned = subject === issuer;

        // Get raw certificate text (simulated OpenSSL output)
        const getRawCertData = () => {
            return `Certificate:
    Data:
        Version: ${version} (0x${(version - 1).toString(16)})
        Serial Number: ${serial} (0x${serial})
    Signature Algorithm: ${sigAlg}
        Issuer: ${issuer}
        Validity
            Not Before: ${formatDateForOpenSSL(notBefore)}
            Not After : ${formatDateForOpenSSL(notAfter)}
        Subject: ${subject}
        Subject Public Key Info:
            Public Key Algorithm: ${keyAlgorithm}
                Public-Key: (${keyBits} bit)
        X509v3 Extensions:
            ${extensions.map(ext => `${ext.name}: ${ext.value}`).join('\n            ')}
    Signature Algorithm: ${sigAlg}`;
        };

        const outputDiv = document.getElementById('analysisOutput');
        outputDiv.innerHTML = `
            <div class="output-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                    <h3>📋 Certificate Analysis</h3>
                    <div class="alert ${expiryClass}" style="display: inline-block; padding: 8px 16px; margin: 0;">
                        ${expiryStatus}
                    </div>
                </div>

                <!-- General Information -->
                <div class="info-card">
                    <h4>📊 General Information</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600; width: 200px;">Common Name</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace;">${subjectParts.CN || 'N/A'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">SANs</td>
                            <td style="padding: 10px;">
                                ${sanArray.length > 0 ? 
                                    `${sanArray.map(s => `<div style="padding: 2px 0; font-family: 'Courier New', monospace; font-size: 0.9rem;">${s}</div>`).join('')}
                                    <div style="margin-top: 5px; color: var(--text-secondary); font-size: 0.85rem;">Total number of SANs: ${sanCount}</div>` 
                                    : '<span style="color: var(--text-secondary);">None</span>'}
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Revocation Status</td>
                            <td style="padding: 10px; color: var(--text-secondary);">Certificate does not supply CRL issuer information</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Expired</td>
                            <td style="padding: 10px; color: ${daysUntilExpiry !== 'N/A' && daysUntilExpiry < 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 600;">
                                ${daysUntilExpiry !== 'N/A' ? 
                                    (daysUntilExpiry < 0 ? 'Yes (Certificate has expired)' : `No (${daysUntilExpiry} days till expiration)`) 
                                    : 'Unknown'}
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Not Before</td>
                            <td style="padding: 10px;">${notBeforeDate ? formatDateForDisplay(notBeforeDate) : notBefore}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Not After</td>
                            <td style="padding: 10px;">${notAfterDate ? formatDateForDisplay(notAfterDate) : notAfter}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Key Type</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace;">${keyAlgorithm}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Key Size</td>
                            <td style="padding: 10px; color: ${keyColor}; font-weight: 600;">${keyBits} bits</td>
                        </tr>
                        ${weakKeyWarning}
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Signature Algorithm</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace;">${sigAlg}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Serial Number</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; color: var(--accent);">${serial}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">SHA-256 SPN Hash</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.85rem; word-break: break-all;">${formatFingerprint(sha256)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">SHA1 Modulus Hash</td>
                            <td style="padding: 10px; color: var(--text-secondary);">Key algorithm doesn't imply modulus</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">SHA1 Fingerprint</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.85rem; word-break: break-all;">${formatFingerprint(sha1)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">MD5 Fingerprint</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.85rem; word-break: break-all;">${formatFingerprint(md5)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Trusted?</td>
                            <td style="padding: 10px;">
                                <span style="color: var(--warning);">⚠️</span> No, we were unable to find the issuer
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: 600;">Signature Verification</td>
                            <td style="padding: 10px; color: var(--text-secondary);">
                                ${isSelfSigned ? 'Self-signed certificate - verification not applicable' : 'This check is not applicable for untrusted certificates'}
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Subject Information -->
                <div class="info-card">
                    <h4>👤 Subject Information</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600; width: 200px;">Common Name</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace;">${subjectParts.CN || 'N/A'}</td>
                        </tr>
                        ${subjectParts.O ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Organization</td>
                            <td style="padding: 10px;">${subjectParts.O}</td>
                        </tr>` : ''}
                        ${subjectParts.OU ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Organizational Unit</td>
                            <td style="padding: 10px;">${subjectParts.OU}</td>
                        </tr>` : ''}
                        ${subjectParts.L ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Locality</td>
                            <td style="padding: 10px;">${subjectParts.L}</td>
                        </tr>` : ''}
                        ${subjectParts.ST ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">State/Province</td>
                            <td style="padding: 10px;">${subjectParts.ST}</td>
                        </tr>` : ''}
                        ${subjectParts.C ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Country</td>
                            <td style="padding: 10px;">${subjectParts.C}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <!-- Issuer Information -->
                <div class="info-card">
                    <h4>🏢 Issuer Information</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600; width: 200px;">Common Name</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace;">${issuerParts.CN || 'N/A'}</td>
                        </tr>
                        ${issuerParts.O ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Organization</td>
                            <td style="padding: 10px;">${issuerParts.O}</td>
                        </tr>` : ''}
                        ${issuerParts.C ? `
                        <tr>
                            <td style="padding: 10px; font-weight: 600;">Country</td>
                            <td style="padding: 10px;">${issuerParts.C}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <!-- x509v3 Extensions -->
                ${extensions.length > 0 ? `
                <div class="info-card">
                    <h4>🔧 x509v3 Extensions</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${extensions.map((ext, idx) => `
                        <tr${idx < extensions.length - 1 ? ' style="border-bottom: 1px solid var(--border);"' : ''}>
                            <td style="padding: 10px; font-weight: 600; width: 200px;">${ext.name}</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.9rem;">${ext.value}</td>
                        </tr>
                        `).join('')}
                    </table>
                </div>
                ` : ''}

                <!-- Raw OpenSSL Data -->
                <div class="info-card">
                    <h4>📄 Raw OpenSSL Data</h4>
                    <pre style="background: var(--bg-primary); padding: 15px; border-radius: 8px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 0.85rem; line-height: 1.4;">${getRawCertData()}</pre>
                </div>

                <!-- OpenSSL ASN1parse -->
                <div class="info-card">
                    <h4>🔍 OpenSSL ASN1parse</h4>
                    <div class="alert alert-warning">
                        <strong>Info:</strong> ASN.1 parsing requires OpenSSL command-line tool. Use the command below:
                    </div>
                    <div class="command-box">
                        <button class="copy-btn" onclick="copyToClipboard('openssl asn1parse -in certificate.crt', this)">Copy</button>
                        <code>openssl asn1parse -in certificate.crt</code>
                    </div>
                </div>

                <!-- All Fingerprints -->
                <div class="info-card">
                    <h4>🔐 Certificate Fingerprints</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600; width: 150px;">MD5</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.85rem; word-break: break-all;">${formatFingerprint(md5)}</td>
                            <td style="padding: 10px; width: 100px;">
                                <button class="btn" style="padding: 6px 12px; font-size: 0.85rem;" onclick="copyToClipboard('${formatFingerprint(md5)}', this)">Copy</button>
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">SHA-1</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.85rem; word-break: break-all;">${formatFingerprint(sha1)}</td>
                            <td style="padding: 10px;">
                                <button class="btn" style="padding: 6px 12px; font-size: 0.85rem;" onclick="copyToClipboard('${formatFingerprint(sha1)}', this)">Copy</button>
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">SHA-256</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.85rem; word-break: break-all;">${formatFingerprint(sha256)}</td>
                            <td style="padding: 10px;">
                                <button class="btn" style="padding: 6px 12px; font-size: 0.85rem;" onclick="copyToClipboard('${formatFingerprint(sha256)}', this)">Copy</button>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: 600;">SHA-512</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace; font-size: 0.85rem; word-break: break-all;">${formatFingerprint(sha512)}</td>
                            <td style="padding: 10px;">
                                <button class="btn" style="padding: 6px 12px; font-size: 0.85rem;" onclick="copyToClipboard('${formatFingerprint(sha512)}', this)">Copy</button>
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Actions -->
                <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-success" onclick="downloadFile('certificate.crt', \`${pemContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, 'PEM')">📥 Download Certificate</button>
                    <button class="btn" onclick="copyToClipboard(\`${pemContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, this)">📋 Copy Certificate</button>
                    <button class="btn btn-warning" onclick="document.getElementById('certTextInput').value = ''">🗑️ Clear Input</button>
                </div>
            </div>
        `;
        showAlert('Certificate analyzed successfully', 'success');
    } catch (error) {
        showAlert('Error analyzing certificate: ' + error.message, 'danger');
        console.error(error);
    }
}

function analyzeCSRText(pemContent) {
    try {
        const csr = KJUR.asn1.csr.CSRUtil.getInfo(pemContent);
        
        // Parse subject for better display
        const parseDistinguishedName = (dn) => {
            const parts = {};
            dn.split('/').forEach(part => {
                if (part.includes('=')) {
                    const [key, value] = part.split('=');
                    if (key && value) parts[key.trim()] = value.trim();
                }
            });
            return parts;
        };

        const subjectParts = parseDistinguishedName(csr.subject.str);
        
        const outputDiv = document.getElementById('analysisOutput');
        outputDiv.innerHTML = `
            <div class="output-section">
                <h3>📋 Certificate Request (CSR) Analysis</h3>

                <!-- Subject Information -->
                <div class="info-card">
                    <h4>👤 Subject Information</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600; width: 180px;">Common Name (CN)</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace;">${subjectParts.CN || 'N/A'}</td>
                        </tr>
                        ${subjectParts.O ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Organization (O)</td>
                            <td style="padding: 10px;">${subjectParts.O}</td>
                        </tr>` : ''}
                        ${subjectParts.OU ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Organizational Unit (OU)</td>
                            <td style="padding: 10px;">${subjectParts.OU}</td>
                        </tr>` : ''}
                        ${subjectParts.L ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Locality (L)</td>
                            <td style="padding: 10px;">${subjectParts.L}</td>
                        </tr>` : ''}
                        ${subjectParts.ST ? `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">State (ST)</td>
                            <td style="padding: 10px;">${subjectParts.ST}</td>
                        </tr>` : ''}
                        ${subjectParts.C ? `
                        <tr>
                            <td style="padding: 10px; font-weight: 600;">Country (C)</td>
                            <td style="padding: 10px;">${subjectParts.C}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <!-- Technical Details -->
                <div class="info-card">
                    <h4>🔧 Technical Details</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600; width: 180px;">Signature Algorithm</td>
                            <td style="padding: 10px; font-family: 'Courier New', monospace;">${csr.sigalg}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: 600; vertical-align: top;">Extensions</td>
                            <td style="padding: 10px;">
                                ${csr.extreq ? `<pre style="background: var(--bg-primary); padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(csr.extreq, null, 2)}</pre>` : '<span style="color: var(--text-secondary);">None</span>'}
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- Actions -->
                <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn" onclick="downloadFile('request.csr', \`${pemContent.replace(/`/g, '\\`')}\`, 'PEM')">📥 Download CSR</button>
                    <button class="btn" onclick="copyToClipboard(\`${pemContent.replace(/`/g, '\\`')}\`, this)">📋 Copy CSR</button>
                </div>
            </div>
        `;
        showAlert('CSR analyzed successfully', 'success');
    } catch (error) {
        showAlert('Error analyzing CSR: ' + error.message, 'danger');
        console.error(error);
    }
}

function analyzeKeyText(pemContent) {
    try {
        const key = KEYUTIL.getKey(pemContent);
        let keyInfo = '';
        let keyDetails = '';
        
        if (key.type === 'RSA') {
            const bits = key.n.bitLength();
            keyInfo = `RSA ${bits} bits`;
            keyDetails = `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px; font-weight: 600; width: 180px;">Key Size</td>
                    <td style="padding: 10px; color: ${bits >= 2048 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">${bits} bits</td>
                </tr>
                <tr>
                    <td style="padding: 10px; font-weight: 600;">Security Level</td>
                    <td style="padding: 10px;">${bits >= 4096 ? '🔒 High' : bits >= 2048 ? '✓ Adequate' : '⚠️ Weak'}</td>
                </tr>
            `;
        } else if (key.type === 'EC') {
            keyInfo = `ECDSA`;
            keyDetails = `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 10px; font-weight: 600; width: 180px;">Curve</td>
                    <td style="padding: 10px; font-family: 'Courier New', monospace;">${key.curveName || 'unknown'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; font-weight: 600;">Security Level</td>
                    <td style="padding: 10px; color: var(--success);">🔒 High</td>
                </tr>
            `;
        } else {
            keyInfo = key.type || 'Unknown';
            keyDetails = `
                <tr>
                    <td style="padding: 10px; font-weight: 600; width: 180px;">Type</td>
                    <td style="padding: 10px;">${keyInfo}</td>
                </tr>
            `;
        }
        
        const isPrivate = pemContent.includes('PRIVATE');
        
        const outputDiv = document.getElementById('analysisOutput');
        outputDiv.innerHTML = `
            <div class="output-section">
                <h3>🔑 ${isPrivate ? 'Private' : 'Public'} Key Analysis</h3>

                ${isPrivate ? `
                <div class="alert alert-danger">
                    <strong>⚠️ SECURITY WARNING</strong><br>
                    This is a PRIVATE KEY. Never share it, upload it to untrusted websites, or transmit it over insecure channels!
                </div>
                ` : ''}

                <div class="info-card">
                    <h4>🔧 Key Information</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600; width: 180px;">Key Type</td>
                            <td style="padding: 10px;">
                                <span style="display: inline-block; padding: 4px 12px; background: ${isPrivate ? 'var(--danger)' : 'var(--success)'}; color: white; border-radius: 4px; font-size: 0.85rem;">
                                    ${isPrivate ? '🔐 PRIVATE KEY' : '🔓 PUBLIC KEY'}
                                </span>
                            </td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 10px; font-weight: 600;">Algorithm</td>
                            <td style="padding: 10px; font-weight: 600; color: var(--accent);">${keyInfo}</td>
                        </tr>
                        ${keyDetails}
                    </table>
                </div>

                <!-- Actions -->
                <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn ${isPrivate ? 'btn-warning' : ''}" onclick="downloadFile('key.pem', \`${pemContent.replace(/`/g, '\\`')}\`, 'PEM')">📥 Download Key</button>
                    ${!isPrivate ? `<button class="btn" onclick="copyToClipboard(\`${pemContent.replace(/`/g, '\\`')}\`, this)">📋 Copy Key</button>` : ''}
                </div>
            </div>
        `;
        showAlert('Key analyzed successfully', 'success');
    } catch (error) {
        showAlert('Error analyzing key: ' + error.message, 'danger');
        console.error(error);
    }
}

// Update existing performAnalysis function to handle extraction
function updateAnalysisUI() {
    const analysisType = document.getElementById('analysisType').value;
    // Existing code remains the same
}

// Add new extraction function
function extractAllFromFile() {
    const files = document.getElementById('analysisFile').files;
    
    if (files.length === 0) {
        showAlert('Please upload a file first', 'danger');
        return;
    }
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            extractComponents(content);
        } catch (error) {
            showAlert('Error extracting components: ' + error.message, 'danger');
        }
    };
    
    reader.readAsText(file);
}

function extractComponents(pemContent) {
    const certificates = [];
    const privateKeys = [];
    const csrs = [];
    
    // Extract all certificates
    const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
    const certMatches = pemContent.match(certRegex);
    if (certMatches) {
        certificates.push(...certMatches);
    }
    
    // Extract private keys
    const keyRegex = /-----BEGIN .*PRIVATE KEY.*-----[\s\S]*?-----END .*PRIVATE KEY.*-----/g;
    const keyMatches = pemContent.match(keyRegex);
    if (keyMatches) {
        privateKeys.push(...keyMatches);
    }
    
    // Extract CSRs
    const csrRegex = /-----BEGIN .*CERTIFICATE REQUEST.*-----[\s\S]*?-----END .*CERTIFICATE REQUEST.*-----/g;
    const csrMatches = pemContent.match(csrRegex);
    if (csrMatches) {
        csrs.push(...csrMatches);
    }
    
    displayExtractedComponents(certificates, privateKeys, csrs);
}

function displayExtractedComponents(certs, keys, csrs) {
    const outputDiv = document.getElementById('analysisOutput');
    
    let html = '<div class="output-section"><h3>📦 Extracted Components</h3>';
    
    if (certs.length > 0) {
        html += `
            <div class="info-card">
                <h4>🔐 Certificates Found: ${certs.length}</h4>
        `;
        certs.forEach((cert, index) => {
            html += `
                <div style="margin: 10px 0;">
                    <p><strong>Certificate ${index + 1}</strong></p>
                    <textarea readonly style="height: 150px;">${cert}</textarea>
                    <button class="btn" onclick="downloadFile('certificate-${index + 1}.crt', \`${cert}\`, 'PEM')">📥 Download</button>
                </div>
            `;
        });
        html += '</div>';
        
        // Create chain bundle if multiple certificates
        if (certs.length > 1) {
            const chainBundle = certs.join('\n');
            html += `
                <div class="info-card">
                    <h4>🔗 Certificate Chain Bundle</h4>
                    <textarea readonly style="height: 200px;">${chainBundle}</textarea>
                    <button class="btn btn-success" onclick="downloadFile('certificate-chain.pem', \`${chainBundle}\`, 'PEM')">📥 Download Chain Bundle</button>
                </div>
            `;
        }
    }
    
    if (keys.length > 0) {
        html += `
            <div class="info-card">
                <h4>🔑 Private Keys Found: ${keys.length}</h4>
                <div class="alert alert-warning">
                    <strong>⚠️ Security Warning:</strong> Handle private keys with care!
                </div>
        `;
        keys.forEach((key, index) => {
            html += `
                <div style="margin: 10px 0;">
                    <p><strong>Private Key ${index + 1}</strong></p>
                    <textarea readonly style="height: 150px;">${key}</textarea>
                    <button class="btn btn-warning" onclick="downloadFile('private-key-${index + 1}.key', \`${key}\`, 'PEM')">📥 Download</button>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (csrs.length > 0) {
        html += `
            <div class="info-card">
                <h4>📝 Certificate Requests Found: ${csrs.length}</h4>
        `;
        csrs.forEach((csr, index) => {
            html += `
                <div style="margin:10px 0;">
                <p><strong>CSR ${index + 1}</strong></p>
                <textarea readonly style="height: 150px;">${csr}</textarea>
                <button class="btn" onclick="downloadFile('request-${index + 1}.csr', \`${csr}\`, 'PEM')">📥 Download</button>
                </div>
                `;
            });
            html += '</div>';
            }
            if (certs.length === 0 && keys.length === 0 && csrs.length === 0) {
                html += `
                    <div class="alert alert-warning">
                        <p><strong>No Components Found</strong></p>
                        <p>The file does not contain any recognizable certificates, private keys, or CSRs in PEM format.</p>
                    </div>
                `;
            }

            html += '</div>';
            outputDiv.innerHTML = html;
            showAlert('Extraction complete', 'success');
}
// Update the performAnalysis function to include extraction
// Add this case to the existing performAnalysis function:
/*
} else if (analysisType === 'extract-all') {
extractAllFromFile();
*/
