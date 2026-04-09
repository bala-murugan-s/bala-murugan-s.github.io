// Certificate Visualization
function visualizeCertificates() {
    const files = document.getElementById('visualizeFiles').files;
    const vizType = document.getElementById('vizType').value;

    if (files.length === 0) {
        showAlert('Please upload certificates first', 'danger');
        return;
    }

    let processedCount = 0;
    const certs = [];

    Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const cert = new X509();
                cert.readCertPEM(e.target.result);

                const notBefore = new Date(cert.getNotBefore());
                const notAfter = new Date(cert.getNotAfter());

                let keySize = 'Unknown';
                try {
                    const pubKey = cert.getPublicKey();
                    if (pubKey.type === 'RSA') {
                        keySize = pubKey.n.bitLength();
                    }
                } catch (e) {}

                certs.push({
                    filename: file.name,
                    notBefore: notBefore,
                    notAfter: notAfter,
                    keySize: keySize,
                    sigAlg: cert.getSignatureAlgorithmName()
                });

                processedCount++;
                if (processedCount === files.length) {
                    if (vizType === 'timeline') {
                        visualizeTimeline(certs);
                    } else if (vizType === 'properties') {
                        visualizeProperties(certs);
                    }
                }
            } catch (error) {
                showAlert(`Error processing ${file.name}: ${error.message}`, 'danger');
            }
        };
        reader.readAsText(file);
    });
}

function visualizeTimeline(certs) {
    const allDates = certs.flatMap(c => [c.notBefore.getTime(), c.notAfter.getTime()]);
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const range = maxDate - minDate;

    let html = `<div class="output-section"><h3>📅 Certificate Timeline</h3>`;

    certs.forEach((cert) => {
        const startPercent = ((cert.notBefore - minDate) / range) * 100;
        const widthPercent = ((cert.notAfter - cert.notBefore) / range) * 100;
        const now = new Date();
        const isActive = now >= cert.notBefore && now <= cert.notAfter;
        const isExpired = now > cert.notAfter;

        const color = isExpired ? 'var(--danger)' : (isActive ? 'var(--success)' : 'var(--warning)');

        html += `
            <div style="margin: 20px 0;">
                <h5>${cert.filename}</h5>
                <p style="font-size: 0.9rem;">
                    ${cert.notBefore.toLocaleDateString()} - ${cert.notAfter.toLocaleDateString()}
                </p>
                <div style="position: relative; height: 30px; background: var(--bg-primary); border-radius: 15px;">
                    <div style="position: absolute; left: ${startPercent}%; width: ${widthPercent}%; height: 100%; background: ${color}; border-radius: 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem;">
                        ${isExpired ? 'EXPIRED' : (isActive ? 'ACTIVE' : 'FUTURE')}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    document.getElementById('visualizeOutput').innerHTML = html;
}

function visualizeProperties(certs) {
    const keySizes = {};
    const algorithms = {};
    
    certs.forEach(cert => {
        keySizes[cert.keySize] = (keySizes[cert.keySize] || 0) + 1;
        algorithms[cert.sigAlg] = (algorithms[cert.sigAlg] || 0) + 1;
    });

    let html = `
        <div class="output-section">
            <h3>📊 Property Breakdown</h3>
            
            <h4>Key Size Distribution</h4>
            ${Object.entries(keySizes).map(([size, count]) => {
                const percent = (count / certs.length * 100).toFixed(1);
                return `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%; background: var(--accent);">
                            ${size}: ${count} (${percent}%)
                        </div>
                    </div>
                `;
            }).join('')}
            
            <h4>Signature Algorithm Distribution</h4>
            ${Object.entries(algorithms).map(([alg, count]) => {
                const percent = (count / certs.length * 100).toFixed(1);
                return `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%; background: var(--success);">
                            ${alg}: ${count} (${percent}%)
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    document.getElementById('visualizeOutput').innerHTML = html;
}