// Certificate Chain Builder
function buildCertificateChain() {
    const files = document.getElementById('chainFiles').files;
    if (files.length === 0) {
        showAlert('Please upload certificates first', 'danger');
        return;
    }

    let processedCount = 0;
    const certs = [];

    Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const cert = new X509();
                cert.readCertPEM(e.target.result);

                const subject = cert.getSubjectString();
                const issuer = cert.getIssuerString();

                certs.push({
                    filename: file.name,
                    pem: e.target.result,
                    subject: subject,
                    issuer: issuer,
                    isSelfSigned: subject === issuer
                });

                processedCount++;
                if (processedCount === files.length) {
                    buildChain(certs);
                }
            } catch (error) {
                showAlert(`Error processing ${file.name}: ${error.message}`, 'danger');
            }
        };
        reader.readAsText(file);
    });
}

function buildChain(certs) {
    const orderedChain = [];
    const remaining = [...certs];

    const rootIndex = remaining.findIndex(c => c.isSelfSigned);
    if (rootIndex >= 0) {
        orderedChain.push(remaining.splice(rootIndex, 1)[0]);
    }

    while (remaining.length > 0 && orderedChain.length < certs.length) {
        const lastCert = orderedChain[orderedChain.length - 1];
        const nextIndex = remaining.findIndex(c => c.issuer === lastCert.subject);

        if (nextIndex >= 0) {
            orderedChain.push(remaining.splice(nextIndex, 1)[0]);
        } else {
            orderedChain.push(...remaining);
            break;
        }
    }

    const bundle = orderedChain.map(c => c.pem).join('\n');

    let html = `
        <div class="output-section">
            <h3>🔗 Certificate Chain</h3>
    `;

    orderedChain.forEach((cert, index) => {
        const level = cert.isSelfSigned ? 'Root CA' : (index === orderedChain.length - 1 ? 'End-Entity' : 'Intermediate CA');
        html += `
            <div class="cert-card">
                <h4>${index + 1}. ${level} - ${cert.filename}</h4>
                <p><strong>Subject:</strong> ${cert.subject}</p>
                <p><strong>Issuer:</strong> ${cert.issuer}</p>
            </div>
        `;
    });

    html += `
            <h4>Combined Bundle</h4>
            <textarea readonly style="height: 200px;">${bundle}</textarea>
            <button class="btn" onclick="downloadFile('certificate-chain.pem', \`${bundle}\`, 'PEM')">📥 Download Chain</button>
        </div>
    `;

    document.getElementById('chainOutput').innerHTML = html;
    showAlert('Chain built successfully', 'success');
}

