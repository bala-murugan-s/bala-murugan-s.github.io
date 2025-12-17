// Certificate Comparison
function compareCertificates() {
    const file1 = document.getElementById('compareCert1').files[0];
    const file2 = document.getElementById('compareCert2').files[0];

    if (!file1 || !file2) {
        showAlert('Please upload both certificates', 'danger');
        return;
    }

    const reader1 = new FileReader();
    reader1.onload = function (e1) {
        const reader2 = new FileReader();
        reader2.onload = function (e2) {
            try {
                const cert1 = new X509();
                cert1.readCertPEM(e1.target.result);

                const cert2 = new X509();
                cert2.readCertPEM(e2.target.result);

                const rows = [
                    ['Property', 'Certificate 1', 'Certificate 2', 'Status'],
                    ['Subject', cert1.getSubjectString(), cert2.getSubjectString(), cert1.getSubjectString() === cert2.getSubjectString() ? '✅ Match' : '⚠️ Different'],
                    ['Issuer', cert1.getIssuerString(), cert2.getIssuerString(), cert1.getIssuerString() === cert2.getIssuerString() ? '✅ Match' : '⚠️ Different'],
                    ['Serial', cert1.getSerialNumberHex(), cert2.getSerialNumberHex(), cert1.getSerialNumberHex() === cert2.getSerialNumberHex() ? '✅ Match' : '⚠️ Different'],
                    ['Valid From', cert1.getNotBefore(), cert2.getNotBefore(), cert1.getNotBefore() === cert2.getNotBefore() ? '✅ Match' : '⚠️ Different'],
                    ['Valid Until', cert1.getNotAfter(), cert2.getNotAfter(), cert1.getNotAfter() === cert2.getNotAfter() ? '✅ Match' : '⚠️ Different'],
                    ['Signature Alg', cert1.getSignatureAlgorithmName(), cert2.getSignatureAlgorithmName(), cert1.getSignatureAlgorithmName() === cert2.getSignatureAlgorithmName() ? '✅ Match' : '⚠️ Different']
                ];

                let tableHTML = '<div class="output-section"><h3>📊 Comparison Results</h3><table class="comparison-table">';
                rows.forEach((row, idx) => {
                    const tag = idx === 0 ? 'th' : 'td';
                    const statusClass = idx > 0 && row[3].includes('Different') ? 'diff-changed' : '';
                    tableHTML += `<tr>
                        <${tag}>${row[0]}</${tag}>
                        <${tag}>${row[1]}</${tag}>
                        <${tag}>${row[2]}</${tag}>
                        <${tag} class="${statusClass}">${row[3]}</${tag}>
                    </tr>`;
                });
                tableHTML += '</table></div>';

                document.getElementById('compareOutput').innerHTML = tableHTML;
                showAlert('Comparison complete', 'success');
            } catch (error) {
                showAlert('Error comparing certificates: ' + error.message, 'danger');
            }
        };
        reader2.readAsText(file2);
    };
    reader1.readAsText(file1);
}