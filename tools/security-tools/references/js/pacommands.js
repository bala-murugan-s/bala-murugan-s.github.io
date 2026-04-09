// js/pacommands.js
import { dom } from './dom.js';
import { escapeHtml, copyText, formatTable } from './utils.js';
import { paloAltoCliCommands } from '../data/paloaltocommands.js';

export function renderPaCommands() {
  renderCommands(paloAltoCliCommands, 'Palo Alto CLI');
}

function renderCommands(commands, label) {
  dom.cardsGrid.innerHTML = '';

  commands.forEach(cmd => {
    const card = document.createElement('div');
    card.className = 'query-card';
    card.dataset.id = cmd.id;

    const categoryClass = cmd.category
      .toLowerCase()
      .replace(/\s+/g, '-');

    card.innerHTML = `
      <div class="card-header">
        <h2 class="card-title">${escapeHtml(cmd.title)}</h2>
        <span class="category-badge category-${categoryClass}">
          ${escapeHtml(cmd.category)}
        </span>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span>${label} Command</span>
          <button class="copy-btn">Copy</button>
        </div>
        <div class="code-content">
          <pre><code>${escapeHtml(cmd.query)}</code></pre>
        </div>
      </div>

      <details class="expandable-section">
        <summary class="expand-toggle">Explanation</summary>
        <p class="explanation-text">
          ${escapeHtml(cmd.explanation)}
        </p>
      </details>

      <details class="expandable-section">
        <summary class="expand-toggle">Sample Output</summary>
        <pre class="sample-table">
${formatTable(cmd.sampleOutput || [])}
        </pre>
      </details>
    `;

    card
      .querySelector('.copy-btn')
      .addEventListener('click', e =>
        copyText(cmd.query, e.target)
      );

    dom.cardsGrid.appendChild(card);
  });

  dom.totalCount.textContent = commands.length;
  dom.visibleCount.textContent = commands.length;
}
