/* ════════════════════════════════════════════════
   NetDiag — app.js
   Core: Tauri bridge, tab routing, utilities
   ════════════════════════════════════════════════ */

'use strict';

// ── Tauri Bridge ──────────────────────────────────
// Wraps __TAURI__.invoke with a demo fallback for
// testing in browser without Tauri runtime.
const isTauri = typeof window.__TAURI__ !== 'undefined';

async function invoke(command, args = {}) {
  if (isTauri) {
    return window.__TAURI__.invoke(command, args);
  }
  // Demo mode fallback
  return demoBackend(command, args);
}

// ── Demo Backend (browser testing) ───────────────
async function demoBackend(command, args) {
  await sleep(400 + Math.random() * 800);

  switch (command) {
    case 'ping_host': {
      const success = Math.random() > 0.15;
      return {
        host: args.host,
        success,
        latency_ms: success ? 5 + Math.random() * 80 : null,
        packet_loss: success ? Math.random() * 5 : 100,
        status: success ? `OK (${(5 + Math.random() * 80).toFixed(1)}ms)` : 'UNREACHABLE',
        error: null,
        timestamp: Date.now(),
      };
    }
    case 'bulk_ping': {
      return args.hosts.map(host => {
        const success = Math.random() > 0.2;
        return {
          host,
          success,
          latency_ms: success ? 5 + Math.random() * 100 : null,
          packet_loss: success ? Math.random() * 8 : 100,
          status: success ? `OK` : 'UNREACHABLE',
          error: null,
          timestamp: Date.now(),
        };
      });
    }
    case 'traceroute_host': {
      const hops = [];
      for (let i = 1; i <= 8; i++) {
        const timeout = Math.random() < 0.1;
        hops.push({
          hop: i,
          host: timeout ? '*' : `router-${i}.isp.net`,
          ip: timeout ? null : `10.${i}.${i}.1`,
          latencies_ms: timeout ? [null, null, null] : [
            5 * i + Math.random() * 10,
            5 * i + Math.random() * 10,
            5 * i + Math.random() * 10,
          ],
          avg_latency_ms: timeout ? null : 5 * i + 5,
          status: timeout ? 'TIMEOUT' : 'OK',
        });
      }
      return { target: args.host, hops, success: true, error: null };
    }
    case 'start_parallel_monitor':
      return 'Monitor started';
    case 'stop_parallel_monitor':
      return 'Monitor stopped';
    case 'get_monitor_results':
      return _demoMonitorState;
    case 'resolve_dns': {
      const ips = ['142.250.80.46', '142.250.80.78'];
      return {
        hostname: args.hostname,
        dns_server: args.dns_server || 'system',
        resolved_ips: ips,
        success: true,
        error: null,
        query_time_ms: 20 + Math.random() * 80,
      };
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Demo monitor state (evolves over time)
const _demoMonitorState = {
  rows: [],
  running: false,
  started_at: Date.now(),
};

// ── Tab Navigation ────────────────────────────────
function initTabs() {
  const items = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      items.forEach(i => i.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}

// ── Theme Toggle ──────────────────────────────────
function initTheme() {
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('netdiag-theme') || 'dark';
  if (saved === 'light') document.body.classList.add('light');

  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const theme = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('netdiag-theme', theme);
  });
}

// ── Enter key → button click ──────────────────────
function bindEnterKey(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (input && btn) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') btn.click();
    });
  }
}

// ── Utilities ─────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function showLoading(text = 'Running...') {
  document.getElementById('loadingOverlay').style.display = 'flex';
  document.getElementById('loadingText').textContent = text;
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 'success'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied to clipboard', 'success');
  }
}

function setBtn(id, disabled, text) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = disabled;
  if (text !== undefined) btn.childNodes[btn.childNodes.length - 1].textContent = ` ${text}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtMs(val) {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(1)}ms`;
}

function fmtLoss(val) {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(0)}%`;
}

function statusBadge(success, text) {
  const cls = success ? 'success' : 'danger';
  const icon = success ? '●' : '●';
  return `<span class="status-badge ${cls}">${icon} ${escapeHtml(text)}</span>`;
}

function parseHostList(text) {
  return text
    .split(/[\n,;]+/)
    .map(h => h.trim())
    .filter(h => h.length > 0 && h.length <= 253);
}

// ── Sidebar Status ────────────────────────────────
function setSidebarStatus(text) {
  const el = document.getElementById('sidebarStatus');
  if (el) el.textContent = text;
}

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTheme();
  bindEnterKey('pingHost', 'pingBtn');
  bindEnterKey('dnsHost', 'dnsBtn');
  bindEnterKey('traceHost', 'traceBtn');

  if (!isTauri) {
    setSidebarStatus('Demo mode');
    showToast('Running in demo mode (no Tauri runtime)', 'warn');
  } else {
    setSidebarStatus('Connected');
  }
});
