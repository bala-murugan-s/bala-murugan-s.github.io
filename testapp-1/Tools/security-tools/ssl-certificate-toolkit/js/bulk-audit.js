// Bulk Certificate Audit
function performBulkAudit() {
    const files = document.getElementById('bulkAuditFiles').files;
    if (files.length === 0) {
        showAlert('Please upload certificates first', 'danger');
        return;
    }

    let processedCount = 0;
    const auditData = [];

    Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const cert = new X509();
                cert.readCertPEM(e.target.result);

                const daysUntilExpiry = calculateDaysUntil(cert.getNotAfter());
                const sigAlg = cert.getSignatureAlgorithmName().toLowerCase();

                let keySize = 'Unknown';
                try {
                    const pubKey = cert.getPublicKey();
                    if (pubKey.type === 'RSA') {
                        keySize = pubKey.n.bitLength();
                    }
                } catch (e) { }

                auditData.push({
                    filename: file.name,
                    subject: cert.getSubjectString(),
                    notAfter: cert.getNotAfter(),
                    daysUntilExpiry: daysUntilExpiry,
                    sigAlg: sigAlg,
                    keySize: keySize,
                    weakAlg: sigAlg.includes('md5') || sigAlg.includes('sha1'),
                    weakKey: keySize !== 'Unknown' && keySize < 2048,
                    expired: daysUntilExpiry < 0,
                    expiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry < 30
                });

                processedCount++;
                if (processedCount === files.length) {
                    displayBulkAudit(auditData);
                }
            } catch (error) {
                processedCount++;
                if (processedCount === files.length) {
                    displayBulkAudit(auditData);
                }
            }
        };
        reader.readAsText(file);
    });
}

function displayBulkAudit(data) {
    const total = data.length;
    const expired = data.filter(d => d.expired).length;
    const expiringSoon = data.filter(d => d.expiringSoon).length;
    const weakAlg = data.filter(d => d.weakAlg).length;
    const weakKey = data.filter(d => d.weakKey).length;

    const keySizes = {};
    data.forEach(d => {
        keySizes[d.keySize] = (keySizes[d.keySize] || 0) + 1;
    });

    let html = `
        <div class="output-section">
            <h3>📊 Audit Summary</h3>
            <div class="grid-2">
                <div class="info-card">
                    <h4>Statistics</h4>
                    <p><strong>Total:</strong> ${total}</p>
                    <p><strong>Expired:</strong> <span style="color: ${expired > 0 ? 'var(--danger)' : 'var(--success)'};">${expired}</span></p>
                    <p><strong>Expiring Soon:</strong> <span style="color: ${expiringSoon > 0 ? 'var(--warning)' : 'var(--success)'};">${expiringSoon}</span></p>
                </div>
                <div class="info-card">
                    <h4>Security Issues</h4>
                    <p><strong>Weak Algorithms:</strong> <span style="color: ${weakAlg > 0 ? 'var(--danger)' : 'var(--success)'};">${weakAlg}</span></p>
                    <p><strong>Weak Keys:</strong> <span style="color: ${weakKey > 0 ? 'var(--danger)' : 'var(--success)'};">${weakKey}</span></p>
                </div>
            </div>

            <h4>Key Size Distribution</h4>
            ${Object.entries(keySizes).map(([size, count]) => {
        const percent = (count / total * 100).toFixed(1);
        return `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%; background: var(--accent);">
                            ${size}: ${count} (${percent}%)
                        </div>
                    </div>
                `;
    }).join('')}

            <h4>Certificate Details</h4>
    `;

    data.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    data.forEach(cert => {
        const cardClass = cert.expired ? 'expired' : (cert.expiringSoon ? 'expiring-soon' : '');
        const issues = [];
        if (cert.expired) issues.push('❌ EXPIRED');
        if (cert.expiringSoon) issues.push('⚠️ Expiring soon');
        if (cert.weakAlg) issues.push('❌ Weak algorithm');
        if (cert.weakKey) issues.push('❌ Weak key');

        html += `
            <div class="cert-card ${cardClass}">
                <h5>${cert.filename}</h5>
                <p><strong>Subject:</strong> ${cert.subject}</p>
                <p><strong>Expires:</strong> ${cert.notAfter} (${cert.daysUntilExpiry} days)</p>
                ${issues.length > 0 ? `<p><strong>Issues:</strong> ${issues.join(', ')}</p>` : '<p style="color: var(--success);">✅ No issues</p>'}
            </div>
        `;
    });

    html += '</div>';
    document.getElementById('bulkAuditOutput').innerHTML = html;
    showAlert('Audit complete', 'success');
}