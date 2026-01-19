/*
 * app.js
 * Main application initialization and global functionality
 * Zscaler Visual Handbook
 */

(function() {
    'use strict';

    // Application state
    const App = {
        currentTheme: 'dark',
        initialized: false,

        // Initialize the application
        init() {
            if (this.initialized) return;
            
            console.log('🚀 Zscaler Visual Handbook - Initializing...');
            
            this.loadTheme();
            this.setupThemeToggle();
            this.setupMobileMenu();
            
            this.initialized = true;
            console.log('✅ Application initialized');
        },

        // Load saved theme preference or default to dark
        loadTheme() {
            const savedTheme = localStorage.getItem('zscaler-handbook-theme') || 'dark';
            this.setTheme(savedTheme);
        },

        // Set theme and update UI
        setTheme(theme) {
            this.currentTheme = theme;
            const themeStylesheet = document.getElementById('theme-stylesheet');
            
            if (themeStylesheet) {
                themeStylesheet.href = `css/theme-${theme}.css`;
            }
            
            // Update body attribute for CSS targeting
            document.body.setAttribute('data-theme', theme);
            
            // Update theme toggle button icon
            const themeIcon = document.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
            
            // Save preference
            localStorage.setItem('zscaler-handbook-theme', theme);
            
            console.log(`🎨 Theme set to: ${theme}`);
        },

        // Setup theme toggle functionality
        setupThemeToggle() {
            const toggleButton = document.getElementById('theme-toggle');
            if (!toggleButton) return;
            
            toggleButton.addEventListener('click', () => {
                const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(newTheme);
            });
        },

        // Setup mobile menu toggle (for responsive design)
        setupMobileMenu() {
            // Create mobile menu button if not exists
            const header = document.querySelector('.header-content');
            if (!header || window.innerWidth > 768) return;
            
            const menuButton = document.createElement('button');
            menuButton.id = 'mobile-menu-toggle';
            menuButton.className = 'icon-button';
            menuButton.setAttribute('aria-label', 'Toggle menu');
            menuButton.innerHTML = '<span>☰</span>';
            
            header.insertBefore(menuButton, header.querySelector('.header-nav'));
            
            menuButton.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.toggle('mobile-visible');
                }
            });
        },

        // Utility: Format date
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        // Utility: Sanitize HTML to prevent XSS
        sanitizeHTML(html) {
            const temp = document.createElement('div');
            temp.textContent = html;
            return temp.innerHTML;
        },

        // Utility: Debounce function for search
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // Expose App globally for other modules
    window.ZscalerApp = App;

})();