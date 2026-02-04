// Config File Generator
function showConfigGenerator() {
    const outputDiv = document.getElementById('configGeneratorOutput');
    outputDiv.innerHTML = `
        <div class="output-section" style="margin-top: 20px;">
            <h4>Configuration Builder</h4>
            <div class="grid-2">
                <div class="form-group">
                    <label>Common Name (CN)</label>
                    <input type="text" id="configCN" placeholder="example.com">
                </div>
                <div class="form-group">
                    <label>Organization (O)</label>
                    <input type="text" id="configO" placeholder="Example Company Inc">
                </div>
            </div>
            <button class="btn btn-success" onclick="buildConfigFile()">🔨 Build Config File</button>
            <div id="configFileOutput"></div>
        </div>
    `;
}

function buildConfigFile() {
    const cn = document.getElementById('configCN').value || 'example.com';
    const o = document.getElementById('configO').value || 'Example Company Inc';

    const config = `# OpenSSL Configuration File
[ req ]
default_bits        = 2048
prompt              = no
default_md          = sha256
distinguished_name  = req_dn
req_extensions      = req_ext

[ req_dn ]
C                   = US
ST                  = California
L                   = San Francisco
O                   = ${o}
OU                  = IT Department
CN                  = ${cn}

[ req_ext ]
subjectAltName      = @alt_names
keyUsage            = digitalSignature, keyEncipherment
extendedKeyUsage    = serverAuth, clientAuth

[alt_names]
DNS.1 = ${cn}
DNS.2 = www.${cn}

# Usage:
# openssl req -new -key private.key -out request.csr -config openssl.cnf`;

    document.getElementById('configFileOutput').innerHTML = `
        <div class="output-section" style="margin-top: 20px;">
            <h4>Generated Configuration</h4>
            <textarea readonly style="height: 400px;">${config}</textarea>
            <button class="btn" onclick="downloadFile('openssl.cnf', \`${config}\`, 'PEM')">📥 Download Config</button>
        </div>
    `;
}