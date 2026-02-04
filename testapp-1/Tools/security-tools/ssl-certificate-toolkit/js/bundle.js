// Certificate Bundle Creator
function createBundle() {
    const files = document.getElementById('bundleFiles').files;
    if (files.length === 0) {
        showAlert('Please upload certificates first', 'danger');
        return;
    }

    let processedCount = 0;
    const certs = [];

    Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            certs.push(e.target.result);
            processedCount++;
            if (processedCount === files.length) {
                const bundle = certs.join('\n');
                document.getElementById('bundleOutput').innerHTML = `
                    <div class="output-section">
                        <h3>📦 Bundle Created</h3>
                        <p>${certs.length} certificate(s) bundled</p>
                        <textarea readonly style="height: 300px;">${bundle}</textarea>
                        <button class="btn" onclick="downloadFile('certificate-bundle.pem', \`${bundle}\`, 'PEM')">📥 Download Bundle</button>
                    </div>
                `;
                showAlert('Bundle created successfully', 'success');
            }
        };
        reader.readAsText(file);
    });
}