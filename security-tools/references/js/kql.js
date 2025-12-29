// js/kql.js
import { dom } from './dom.js';
import { escapeHtml, copyText, formatTable } from './utils.js';
import { kqlQueries } from '../data/kqlqueries.js';

export function renderKql() {
  renderQueries(kqlQueries, 'KQL');
}

function renderQueries(queries, label) {
  dom.cardsGrid.innerHTML = '';

  queries.forEach(q => {
    const card = document.createElement('div');
    card.className = 'query-card';
    card.dataset.id = q.id;

    card.innerHTML = `
      <div class="card-header">
        <h2 class="card-title">${escapeHtml(q.title)}</h2>
        <span class="category-badge category-${q.category.toLowerCase()}">
          ${escapeHtml(q.category)}
        </span>
      </div>

      <div class="code-block">
        <div class="code-header">
          <span>${label} Query</span>
          <button class="copy-btn">Copy</button>
        </div>
        <div class="code-content">
          <pre><code>${escapeHtml(q.query)}</code></pre>
        </div>
      </div>

      <details class="expandable-section">
        <summary class="expand-toggle">Explanation</summary>
        <p class="explanation-text">${escapeHtml(q.explanation)}</p>
      </details>

      <details class="expandable-section">
        <summary class="expand-toggle">Sample Output</summary>
        <pre class="sample-table">${formatTable(q.sampleOutput)}</pre>
      </details>
    `;

    card
      .querySelector('.copy-btn')
      .addEventListener('click', e => copyText(q.query, e.target));

    dom.cardsGrid.appendChild(card);
  });

  dom.totalCount.textContent = queries.length;
  dom.visibleCount.textContent = queries.length;
}
