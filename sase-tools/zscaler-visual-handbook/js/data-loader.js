/*
 * data-loader.js
 * Utilities for loading and parsing JSON content
 */

(function() {
    'use strict';

    const DataLoader = {
        cache: {},

        async loadJSON(path) {
            // Return cached data if available
            if (this.cache[path]) {
                return this.cache[path];
            }

            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                this.cache[path] = data;
                return data;
            } catch (error) {
                console.error(`Failed to load ${path}:`, error);
                throw error;
            }
        },

        async loadMultipleJSON(paths) {
            return Promise.all(paths.map(path => this.loadJSON(path)));
        },

        clearCache() {
            this.cache = {};
        },

        async renderTopicContent(containerId, dataPath) {
            const container = document.getElementById(containerId);
            if (!container) return;

            try {
                const data = await this.loadJSON(dataPath);
                container.innerHTML = this.generateHTMLFromData(data);
            } catch (error) {
                container.innerHTML = `<p class="text-error">Failed to load content: ${error.message}</p>`;
            }
        },

        generateHTMLFromData(data) {
            let html = `<h1>${data.title}</h1>`;
            
            if (data.lastUpdated) {
                html += `<p class="text-muted">Last updated: ${window.ZscalerApp.formatDate(data.lastUpdated)}</p>`;
            }

            data.sections.forEach(section => {
                html += `<section id="${section.id}">`;
                html += `<h2>${section.title}</h2>`;
                
                switch(section.type) {
                    case 'text':
                        html += `<p>${section.content}</p>`;
                        break;
                    case 'diagram':
                        html += `<div class="diagram"><pre>${section.content}</pre></div>`;
                        break;
                    case 'cli':
                        html += this.renderCLISection(section);
                        break;
                    case 'troubleshooting':
                        html += this.renderTroubleshootingSection(section);
                        break;
                }
                
                html += `</section>`;
            });

            return html;
        },

        renderCLISection(section) {
            let html = '<div class="cli-examples">';
            section.commands.forEach(cmd => {
                html += `
                    <div class="cli-example">
                        <p><strong>${cmd.description}</strong></p>
                        <pre><code>$ ${cmd.command}</code></pre>
                        <pre class="cli-output">${cmd.output}</pre>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        },

        renderTroubleshootingSection(section) {
            let html = '<div class="troubleshooting-scenarios">';
            section.scenarios.forEach(scenario => {
                html += `
                    <div class="troubleshoot-box">
                        <h4>Symptom: ${scenario.symptom}</h4>
                        <p><strong>Possible Causes:</strong></p>
                        <ul>
                            ${scenario.possibleCauses.map(cause => `<li>${cause}</li>`).join('')}
                        </ul>
                        <p><strong>Diagnostic Steps:</strong></p>
                        <ol>
                            ${scenario.diagnosticSteps.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                        <p><strong>Resolution:</strong> ${scenario.resolution}</p>
                    </div>
                `;
            });
            html += '</div>';
            return html;
        }
    };

    window.ZscalerDataLoader = DataLoader;

})();