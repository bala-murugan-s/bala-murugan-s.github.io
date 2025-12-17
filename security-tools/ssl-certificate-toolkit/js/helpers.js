// Helper function to format dates for certificates
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return ${ year }${ month }${ day }${ hours }${ minutes }${ seconds } Z;
}
// Download file using Blob
function downloadFile(filename, content, format) {
    let blob;
    if (format === 'PEM' || typeof content === 'string') {
        blob = new Blob([content], { type: 'text/plain' });
    } else {
        const binary = atob(content);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'application/octet-stream' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
// Calculate days until expiry
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
// Copy text to clipboard
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        setTimeout(() => button.textContent = originalText, 2000);
    });
}
function downloadBinary(filename, base64Content) {
    const binary = atob(base64Content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], {type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Fixed download function that handles template literals properly
function downloadFileFixed(filename, content) {
    try {
        const blob = new Blob([content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert(`${filename} downloaded successfully`, 'success');
    } catch (error) {
        showAlert('Download failed: ' + error.message, 'danger');
        console.error('Download error:', error);
    }
}