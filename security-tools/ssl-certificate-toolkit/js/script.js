// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('SSL Certificate Toolkit Pro loaded successfully');
    
    // Load saved theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light');
    }
    
    // Initialize advanced tools
    if (typeof updateAdvancedToolUI === 'function') {
        updateAdvancedToolUI();
    }
    
    console.log('All operations are performed client-side. No data leaves your browser.');
});
