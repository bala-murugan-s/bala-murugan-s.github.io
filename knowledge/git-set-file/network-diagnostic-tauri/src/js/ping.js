/* ════════════════════════════════════════
   NetDiag — ping.js (Single Ping)
   ════════════════════════════════════════ */

'use strict';

const pingModule = (() => {
  async function run() {
    const host = document.getElementById('pingHost').value.trim();
    const count = parseInt(document.getElementById('pingCount').value) || 4;

    if (!host) {
      showToast('Please enter a hostname or IP', 'error');
      document.getElementById('pingHost').focus();
      return;
    }

    setBtn('pingBtn', true, 'Pinging…');
    showLoading(`Pinging ${host}…`);
    setSidebarStatus(`Pinging ${host}`);

    try {
      const result = await invoke('ping_host', { host, count });
      renderResult(result);
      setSidebarStatus('Ready');
    } catch (err) {
      showToast(`Error: ${err}`, 'error');
      setSidebarStatus('Error');
    } finally {
      setBtn('pingBtn', false, 'Ping');
      hideLoading();
    }
  }

  function renderResult(r) {
    const area = document.getElementById('pingResult');
    const content = document.getElementById('pingResultText');
    area.style.display = 'block';

    const latencyClass = !r.success
      ? 'danger'
      : r.latency_ms < 50
      ? 'success'
      : r.latency_ms < 150
      ? 'warn'
      : 'danger';

    const lossClass = r.packet_loss === 0 ? 'success'
      : r.packet_loss < 50 ? 'warn'
      : 'danger';

    content.innerHTML = `
      <div class="ping-result-grid">
        <div class="ping-metric">
          <div class="ping-metric-label">Host</div>
          <div class="ping-metric-value" style="font-size:16px">${escapeHtml(r.host)}</div>
        </div>
        <div class="ping-metric">
          <div class="ping-metric-label">Status</div>
          <div class="ping-metric-value ${r.success ? 'success' : 'danger'}">
            ${r.success ? '● ONLINE' : '● OFFLINE'}
          </div>
        </div>
        <div class="ping-metric">
          <div class="ping-metric-label">Latency</div>
          <div class="ping-metric-value ${latencyClass}">
            ${r.latency_ms !== null ? fmtMs(r.latency_ms) : '—'}
          </div>
        </div>
        <div class="ping-metric">
          <div class="ping-metric-label">Packet Loss</div>
          <div class="ping-metric-value ${lossClass}">${fmtLoss(r.packet_loss)}</div>
        </div>
      </div>
      ${r.error ? `<div style="margin-top:12px;color:var(--text-muted);font-size:11px">⚠ ${escapeHtml(r.error)}</div>` : ''}
    `;
  }

  return { run };
})();
