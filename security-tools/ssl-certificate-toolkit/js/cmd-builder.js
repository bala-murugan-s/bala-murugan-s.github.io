// OpenSSL Command Builder Functions
function updateCommandBuilder() {
    const cmdType = document.getElementById('cmdType').value;
    const container = document.getElementById('cmdParameters');
    
    let html = '';
    
    if (cmdType === 'genrsa') {
        html = `
            <div class="form-group">
                <label>Key Size (bits)</label>
                <select id="paramKeySize">
                    <option value="2048">2048</option>
                    <option value="4096">4096</option>
                </select>
            </div>
            <div class="form-group">
                <label>Output File</label>
                <input type="text" id="paramOutput" value="private.key">
            </div>
        `;
    } else if (cmdType === 'ecparam') {
        html = `
            <div class="form-group">
                <label>Curve</label>
                <select id="paramCurve">
                    <option value="prime256v1">prime256v1 (P-256)</option>
                    <option value="secp384r1">secp384r1 (P-384)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Output File</label>
                <input type="text" id="paramOutput" value="private.key">
            </div>
        `;
    } else if (cmdType === 'req-new') {
        html = `
            <div class="form-group">
                <label>Private Key File</label>
                <input type="text" id="paramKeyFile" value="private.key">
            </div>
            <div class="form-group">
                <label>Output CSR File</label>
                <input type="text" id="paramOutput" value="request.csr">
            </div>
        `;
    } else if (cmdType === 'req-x509') {
        html = `
            <div class="form-group">
                <label>Private Key File</label>
                <input type="text" id="paramKeyFile" value="private.key">
            </div>
            <div class="form-group">
                <label>Output Certificate File</label>
                <input type="text" id="paramOutput" value="certificate.crt">
            </div>
            <div class="form-group">
                <label>Validity (days)</label>
                <input type="number" id="paramDays" value="365">
            </div>
        `;
    } else if (cmdType === 'x509-text') {
        html = `
            <div class="form-group">
                <label>Certificate File</label>
                <input type="text" id="paramCertFile" value="certificate.crt">
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function buildCommand() {
    const cmdType = document.getElementById('cmdType').value;
    let command = 'openssl ';
    
    if (cmdType === 'genrsa') {
        const keySize = document.getElementById('paramKeySize').value;
        const output = document.getElementById('paramOutput').value;
        command += `genrsa -out ${output} ${keySize}`;
    } else if (cmdType === 'ecparam') {
        const curve = document.getElementById('paramCurve').value;
        const output = document.getElementById('paramOutput').value;
        command += `ecparam -genkey -name ${curve} -out ${output}`;
    } else if (cmdType === 'req-new') {
        const keyFile = document.getElementById('paramKeyFile').value;
        const output = document.getElementById('paramOutput').value;
        command += `req -new -key ${keyFile} -out ${output}`;
    } else if (cmdType === 'req-x509') {
        const keyFile = document.getElementById('paramKeyFile').value;
        const output = document.getElementById('paramOutput').value;
        const days = document.getElementById('paramDays').value;
        command += `req -x509 -new -nodes -key ${keyFile} -sha256 -days ${days} -out ${output}`;
    } else if (cmdType === 'x509-text') {
        const certFile = document.getElementById('paramCertFile').value;
        command += `x509 -in ${certFile} -text -noout`;
    }

    document.getElementById('cmdOutput').innerHTML = `
        <div class="output-section">
            <h4>Generated Command</h4>
            <div class="command-box">
                <button class="copy-btn" onclick="copyToClipboard(\`${command}\`, this)">Copy</button>
                <code>${command}</code>
            </div>
        </div>
    `;
}