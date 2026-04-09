/* ════════════════════════════════════════
   NetDiag — traceroute.js
   ════════════════════════════════════════ */

'use strict';

const traceModule = (() => {
  async function run() {
    const host = document.getElementById('traceHost').value.trim();
    const maxHops = parseInt(document.getElementById('traceMaxHops').value) || 30;

    if (!host) {
      showToast('Please enter a target host', 'error');
      document.getElementById('traceHost').focus();
      return;
    }

    setBtn('traceBtn', true, 'Tracing…');
    showLoading(`Tracing route to ${host}…`);
    setSidebarStatus(`Traceroute → ${host}`);

    try {
      const result = await invoke('traceroute_host', { host, max_hops: maxHops });
      renderResult(result);
      setSidebarStatus('Ready');
    } catch (err) {
      showToast(`Error: ${err}`, 'error');
      setSidebarStatus('Error');
    } finally {
      setBtn('traceBtn', false, 'Trace');
      hideLoading();
    }
  }

  function renderResult(result) {
    const area = document.getElementById('traceResult');
    const tbody = document.getElementById('traceTableBody');
    area.style.display = 'block';

    if (!result.success || result.hops.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);text-align:center;padding:20px">
        ${escapeHtml(result.error || 'No hops returned. Try running as administrator.')}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    result.hops.forEach(hop => {
      const isTimeout = hop.status === 'TIMEOUT';
      const tr = document.createElement('tr');

      const rtts = [0, 1, 2].map(i => {
        const v = hop.latencies_ms[i];
        if (v === null || v === undefined) return '<td style="color:var(--warn)">*</td>';
        return `<td class="hop-rtt">${v.toFixed(1)}ms</td>`;
      });

      tr.innerHTML = `
        <td style="color:var(--text-muted)">${hop.hop}</td>
        <td class="${isTimeout ? 'hop-timeout' : 'hop-ok'}">${escapeHtml(hop.host)}</td>
        <td style="color:var(--text-secondary);font-size:11px">${hop.ip ? escapeHtml(hop.ip) : '—'}</td>
        ${rtts.join('')}
        <td class="td-avg">${hop.avg_latency_ms !== null ? fmtMs(hop.avg_latency_ms) : '—'}</td>
        <td>${isTimeout
          ? '<span class="status-badge warn">● TIMEOUT</span>'
          : '<span class="status-badge success">● OK</span>'
        }</td>
      `;
      tbody.appendChild(tr);
    });
  }

  return { run };
})();
