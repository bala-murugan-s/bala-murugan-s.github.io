// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// Tab Switching
function switchTab(index) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    tabs[index].classList.add('active');
    contents[index].classList.add('active');
}

// Clear Session
function clearSession() {
    if (confirm('Clear all generated data and reset the tool?')) {
        sessionData = { files: [] };
        document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => el.value = '');
        document.querySelectorAll('input[type="file"]').forEach(el => el.value = '');
        document.querySelectorAll('.output-section').forEach(el => el.remove());
        showAlert('Session cleared successfully', 'success');
    }
}

// Show Alert Notification
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.minWidth = '250px';
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
}