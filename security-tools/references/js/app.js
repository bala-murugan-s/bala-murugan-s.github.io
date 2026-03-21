import { dom } from './dom.js';
import { renderKql } from './kql.js';
import { renderSplunk } from './splunk.js';
import { renderPaCommands} from './pacommands.js';


function initTheme() {
  const t = localStorage.getItem('theme') || 'dark';
  document.documentElement.dataset.theme = t;
  updateTheme(t);
}

function updateTheme(t) {
  dom.themeIcon.textContent = t === 'dark' ? '🌙' : '☀️';
  dom.themeText.textContent = t === 'dark' ? 'Dark Mode' : 'Light Mode';
}

dom.themeToggle.addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  localStorage.setItem('theme', t);
  updateTheme(t);
});

document.querySelectorAll('.query-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    if (tab.classList.contains('disabled')) return;

    document.querySelectorAll('.query-tab')
      .forEach(t => t.classList.remove('active'));

    tab.classList.add('active');
    if (tab.dataset.engine === 'kql') {
      renderKql();
    } else if (tab.dataset.engine === 'splunk') {
      renderSplunk();
    } else if (tab.dataset.engine === 'pacommands') {
      renderPaCommands();
    }
  });
});

initTheme();
renderKql();
