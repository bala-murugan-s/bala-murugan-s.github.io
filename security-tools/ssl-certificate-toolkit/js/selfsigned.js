function generateSelfSigned() {
    const cn = document.getElementById('selfCN').value.trim();
    if (!cn) {
        showAlert('Common Name (CN) is required', 'danger');
        return;
    }

    const keyType = document.getElementById('selfKeyType').value;
    const keySize = parseInt(document.getElementById('selfKeySize').value);
    const o = document.getElementById('selfO').value.trim();
    const l = document.getElementById('selfL').value.trim();
    const st = document.getElementById('selfST').value.trim();
    const c = document.getElementById('selfC').value.trim().toUpperCase();
    const sanInput = document.getElementById('selfSAN').value.trim();
    const validity = parseInt(document.getElementById('selfValidity').value);

    try {
        let keypair;
        if (keyType === 'RSA') {
            keypair = KEYUTIL.generateKeypair('RSA', keySize);
        } else {
            keypair = KEYUTIL.generateKeypair('EC', 'secp256r1');
        }

        let subject = `/CN=${cn}`;
        if (o) subject += `/O=${o}`;
        if (l) subject += `/L=${l}`;
        if (st) subject += `/ST=${st}`;
        if (c) subject += `/C=${c}`;

        const cert = new KJUR.asn1.x509.Certificate({
            version: 3,
            serial: {int: Math.floor(Math.random() * 1000000000)},
            issuer: {str: subject},
            subject: {str: subject},
            notbefore: {str: formatDate(new Date())},
            notafter: {str: formatDate(new Date(Date.now() + validity * 24 * 60 * 60 * 1000))},
            sbjpubkey: keypair.pubKeyObj,
            ext: [
                {extname: "basicConstraints", cA: false},
                {extname: "keyUsage", names: ["digitalSignature", "keyEncipherment"]}
            ],
            sigalg: keyType === 'RSA' ? 'SHA256withRSA' : 'SHA256withECDSA',
            cakey: keypair.prvKeyObj
        });

        if (sanInput) {
            const sans = sanInput.split(',').map(s => s.trim()).filter(s => s);
            const sanArray = sans.map(san => {
                if (san.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                    return {ip: san};
                }
                return {dns: san};
            });
            cert.params.ext.push({extname: "subjectAltName", array: sanArray});
        }

        const certPEM = cert.getPEM();
        const privateKeyPEM = KEYUTIL.getPEM(keypair.prvKeyObj, 'PKCS8PRV');

        const outputDiv = document.getElementById('selfSignedOutput');
        outputDiv.innerHTML = `
            <div class="output-section">
                <h3>✅ Certificate Generated Successfully</h3>
                <div class="info-card">
                    <p><strong>Key Type:</strong> ${keyType}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Validity:</strong> ${validity} days</p>
                    ${sanInput ? `<p><strong>SAN:</strong> ${sanInput}</p>` : ''}
                </div>
                <h4>Certificate</h4>
                <textarea readonly style="height: 200px;">${certPEM}</textarea>
                <div style="margin-top: 10px;">
                    <button class="btn" onclick='downloadFileFixed("certificate.crt", \`${certPEM.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)'>📥 Download Certificate</button>
                    <button class="btn" onclick='copyToClipboard(\`${certPEM.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, this)'>📋 Copy Certificate</button>
                </div>
                
                <h4>Private Key</h4>
                <textarea readonly style="height: 200px;">${privateKeyPEM}</textarea>
                <div style="margin-top: 10px;">
                    <button class="btn btn-warning" onclick='downloadFileFixed("private.key", \`${privateKeyPEM.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)'>📥 Download Private Key</button>
                    <button class="btn btn-warning" onclick='copyToClipboard(\`${privateKeyPEM.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`, this)'>📋 Copy Private Key</button>
                </div>
                
                <div class="alert alert-warning" style="margin-top: 20px;">
                    <strong>⚠️ Security Warning:</strong> Keep your private key secure! Never share it or upload it to any server.
                </div>
            </div>
        `;

        showAlert('Self-signed certificate generated successfully!', 'success');
    } catch (error) {
        showAlert('Error generating certificate: ' + error.message, 'danger');
        console.error(error);
    }
}