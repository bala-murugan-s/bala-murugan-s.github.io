// Hash Calculator
function calculateHashes() {
    const file = document.getElementById('hashFile').files[0];
    if (!file) {
        showAlert('Please upload a certificate first', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const b64 = content.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
            const der = atob(b64);

            const hex = Array.from(der).map(c =>
                ('0' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('');

            const md5 = KJUR.crypto.Util.hashHex(hex, 'md5');
            const sha1 = KJUR.crypto.Util.hashHex(hex, 'sha1');
            const sha256 = KJUR.crypto.Util.hashHex(hex, 'sha256');

            const formatFingerprint = (hash) => {
                return hash.match(/.{2}/g).join(':').toUpperCase();
            };
            const output = document.getElementById('hashOutput');
            output.innerHTML = `
            <div class="output-section">
                <h3>🔐 Certificate Fingerprints</h3>
                
                <div class="info-card">
                    <h4>MD5 Fingerprint</h4>
                    <p style="font-family: 'Courier New', monospace; word-break: break-all;">${formatFingerprint(md5)}</p>
                    <button class="btn" onclick="copyToClipboard('${formatFingerprint(md5)}', this)">📋 Copy</button>
                </div>

                <div class="info-card">
                    <h4>SHA-1 Fingerprint</h4>
                    <p style="font-family: 'Courier New', monospace; word-break: break-all;">${formatFingerprint(sha1)}</p>
                    <button class="btn" onclick="copyToClipboard('${formatFingerprint(sha1)}', this)">📋 Copy</button>
                </div>

                <div class="info-card">
                    <h4>SHA-256 Fingerprint (Recommended)</h4>
                    <p style="font-family: 'Courier New', monospace; word-break: break-all;">${formatFingerprint(sha256)}</p>
                    <button class="btn" onclick="copyToClipboard('${formatFingerprint(sha256)}', this)">📋 Copy</button>
                </div>
            </div>
        `;
            showAlert('Hashes calculated successfully', 'success');
        } catch (error) {
            showAlert('Error calculating hashes: ' + error.message, 'danger');
        }
    };
    reader.readAsText(file);
}