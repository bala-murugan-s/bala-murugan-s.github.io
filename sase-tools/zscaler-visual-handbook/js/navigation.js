/*
 * navigation.js
 * Dynamic navigation menu loading and search
 */

(function() {
    'use strict';

    const Navigation = {
        menuData: null,
        searchIndex: [],

        async init() {
            await this.loadNavigationData();
            this.renderMenu();
            this.setupSearch();
            this.highlightActiveLink();
        },

        async loadNavigationData() {
            try {
                const response = await fetch('data/navigation.json');
                this.menuData = await response.json();
                this.buildSearchIndex();
                console.log('📋 Navigation data loaded');
            } catch (error) {
                console.error('Failed to load navigation:', error);
                this.showError();
            }
        },

        buildSearchIndex() {
            this.searchIndex = this.menuData.menuItems.map(item => ({
                ...item,
                searchText: `${item.label} ${item.category} ${item.description || ''}`.toLowerCase()
            }));
        },

        renderMenu() {
            const menuContainer = document.getElementById('nav-menu');
            if (!menuContainer) return;

            const groupedItems = this.groupByCategory(this.menuData.menuItems);
            let html = '';

            for (const [category, items] of Object.entries(groupedItems)) {
                html += `
                    <div class="nav-category">
                        <div class="nav-category-title">${category}</div>
                        ${items.map(item => `
                            <a href="${item.path}" class="nav-item" data-id="${item.id}">
                                ${item.label}
                            </a>
                        `).join('')}
                    </div>
                `;
            }

            menuContainer.innerHTML = html;
        },

        groupByCategory(items) {
            return items.reduce((acc, item) => {
                const cat = item.category || 'Other';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
            }, {});
        },

        setupSearch() {
            const searchInput = document.getElementById('search-topics');
            if (!searchInput) return;

            searchInput.addEventListener('input', window.ZscalerApp.debounce((e) => {
                this.filterMenu(e.target.value);
            }, 300));
        },

        filterMenu(query) {
            const normalizedQuery = query.toLowerCase().trim();
            const menuItems = document.querySelectorAll('.nav-item');
            const categories = document.querySelectorAll('.nav-category');

            if (!normalizedQuery) {
                // Show all
                menuItems.forEach(item => item.style.display = '');
                categories.forEach(cat => cat.style.display = '');
                return;
            }

            categories.forEach(cat => {
                const visibleItems = Array.from(cat.querySelectorAll('.nav-item')).filter(item => {
                    const matches = item.textContent.toLowerCase().includes(normalizedQuery);
                    item.style.display = matches ? '' : 'none';
                    return matches;
                });
                cat.style.display = visibleItems.length > 0 ? '' : 'none';
            });
        },

        highlightActiveLink() {
            const currentPath = window.location.pathname;
            const links = document.querySelectorAll('.nav-item');
            
            links.forEach(link => {
                if (link.getAttribute('href') === currentPath || 
                    currentPath.includes(link.getAttribute('href'))) {
                    link.classList.add('active');
                }
            });
        },

        showError() {
            const menuContainer = document.getElementById('nav-menu');
            if (menuContainer) {
                menuContainer.innerHTML = `
                    <div class="nav-loading" style="color: var(--text-error)">
                        Failed to load menu
                    </div>
                `;
            }
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Navigation.init());
    } else {
        Navigation.init();
    }

    window.ZscalerNavigation = Navigation;

})();