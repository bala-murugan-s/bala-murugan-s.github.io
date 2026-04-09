/* ════════════════════════════════════════
   NetDiag — bulk.js (Bulk Ping)
   ════════════════════════════════════════ */

'use strict';

const bulkModule = (() => {
  let _lastResults = [];

  async function run() {
    const raw = document.getElementById('bulkHosts').value;
    const count = parseInt(document.getElementById('bulkCount').value) || 2;
    const hosts = parseHostList(raw);

    if (hosts.length === 0) {
      showToast('Please enter at least one host', 'error');
      return;
    }
    if (hosts.length > 100) {
      showToast('Maximum 100 hosts allowed', 'error');
      return;
    }

    setBtn('bulkBtn', true, 'Running…');
    setSidebarStatus(`Bulk pinging ${hosts.length} hosts…`);

    // Show progress
    const progressWrap = document.getElementById('bulkProgress');
    const progressBar = document.getElementById('bulkProgressBar');
    progressWrap.style.display = 'block';
    progressBar.style.width = '0%';

    // Animate progress (indeterminate feel)
    let pct = 0;
    const progressTimer = setInterval(() => {
      pct = Math.min(pct + (100 - pct) * 0.07, 92);
      progressBar.style.width = pct + '%';
    }, 100);

    try {
      const results = await invoke('bulk_ping', { hosts, count });
      _lastResults = results;

      clearInterval(progressTimer);
      progressBar.style.width = '100%';
      setTimeout(() => { progressWrap.style.display = 'none'; }, 600);

      renderResults(results);
      setSidebarStatus('Ready');
    } catch (err) {
      clearInterval(progressTimer);
      progressWrap.style.display = 'none';
      showToast(`Error: ${err}`, 'error');
      setSidebarStatus('Error');
    } finally {
      setBtn('bulkBtn', false, 'Bulk Ping');
    }
  }

  function renderResults(results) {
    const area = document.getElementById('bulkResults');
    const tbody = document.getElementById('bulkTableBody');
    const countEl = document.getElementById('bulkCount2');
    area.style.display = 'block';

    const ok = results.filter(r => r.success).length;
    countEl.textContent = `${ok}/${results.length} online`;

    tbody.innerHTML = '';
    results.forEach(r => {
      const tr = document.createElement('tr');

      const latencyClass = !r.success ? 'danger'
        : r.latency_ms < 50 ? 'success'
        : r.latency_ms < 150 ? 'warn'
        : 'danger';

      tr.innerHTML = `
        <td>${escapeHtml(r.host)}</td>
        <td>${statusBadge(r.success, r.success ? 'Online' : 'Offline')}</td>
        <td class="${latencyClass}">${r.latency_ms !== null ? fmtMs(r.latency_ms) : '—'}</td>
        <td>${fmtLoss(r.packet_loss)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function loadSample() {
    document.getElementById('bulkHosts').value = [
      '8.8.8.8',
      '8.8.4.4',
      '1.1.1.1',
      '1.0.0.1',
      '9.9.9.9',
      '208.67.222.222',
      'localhost',
      '192.168.1.1',
    ].join('\n');
  }

  function exportCSV() {
    if (_lastResults.length === 0) {
      showToast('No results to export', 'error');
      return;
    }
    const lines = ['Host,Success,Latency (ms),Packet Loss (%)'];
    _lastResults.forEach(r => {
      lines.push([
        r.host,
        r.success ? 'true' : 'false',
        r.latency_ms !== null ? r.latency_ms.toFixed(2) : '',
        r.packet_loss.toFixed(1),
      ].join(','));
    });
    downloadCSV(lines.join('\n'), 'bulk-ping-results.csv');
    showToast('CSV exported', 'success');
  }

  return { run, loadSample, exportCSV };
})();

// ── CSV download helper ──
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
