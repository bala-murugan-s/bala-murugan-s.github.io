/* ════════════════════════════════════════
   NetDiag — dns.js (DNS Resolver)
   ════════════════════════════════════════ */

'use strict';

const dnsModule = (() => {
  function onServerChange() {
    const sel = document.getElementById('dnsServerSelect');
    const customGroup = document.getElementById('customDnsGroup');
    customGroup.style.display = sel.value === 'custom' ? 'flex' : 'none';
  }

  async function run() {
    const hostname = document.getElementById('dnsHost').value.trim();
    const sel = document.getElementById('dnsServerSelect');
    const customIp = document.getElementById('customDnsIp').value.trim();
    const dnsServer = sel.value === 'custom' ? customIp : sel.value || null;

    if (!hostname) {
      showToast('Please enter a hostname', 'error');
      document.getElementById('dnsHost').focus();
      return;
    }
    if (sel.value === 'custom' && !customIp) {
      showToast('Please enter a custom DNS server IP', 'error');
      return;
    }

    setBtn('dnsBtn', true, 'Resolving…');
    showLoading(`Resolving ${hostname}…`);
    setSidebarStatus(`Resolving ${hostname}`);

    try {
      const result = await invoke('resolve_dns', {
        hostname,
        dns_server: dnsServer || undefined,
      });
      renderResult(result);
      setSidebarStatus('Ready');
    } catch (err) {
      showToast(`Error: ${err}`, 'error');
      setSidebarStatus('Error');
    } finally {
      setBtn('dnsBtn', false, 'Resolve');
      hideLoading();
    }
  }

  function renderResult(r) {
    const area = document.getElementById('dnsResult');
    const content = document.getElementById('dnsResultText');
    area.style.display = 'block';

    const ipChips = r.resolved_ips.length
      ? r.resolved_ips.map(ip => `<span class="dns-ip-chip">${escapeHtml(ip)}</span>`).join('')
      : '<span style="color:var(--danger)">No IPs resolved</span>';

    content.innerHTML = `
      <div class="dns-result-grid">
        <div>
          <div class="dns-info-row">
            <span class="dns-info-label">Hostname</span>
            <span class="dns-info-value">${escapeHtml(r.hostname)}</span>
          </div>
          <div class="dns-info-row">
            <span class="dns-info-label">DNS Server</span>
            <span class="dns-info-value">${escapeHtml(r.dns_server)}</span>
          </div>
          <div class="dns-info-row">
            <span class="dns-info-label">Query Time</span>
            <span class="dns-info-value">${r.query_time_ms.toFixed(1)}ms</span>
          </div>
          <div class="dns-info-row">
            <span class="dns-info-label">Status</span>
            <span class="dns-info-value">${statusBadge(r.success, r.success ? 'Resolved' : 'Failed')}</span>
          </div>
        </div>
        <div>
          <div class="dns-info-label" style="margin-bottom:8px">Resolved IPs (${r.resolved_ips.length})</div>
          <div class="dns-ip-list">${ipChips}</div>
        </div>
        ${r.error ? `<div style="color:var(--warn);font-size:11px;margin-top:8px">⚠ ${escapeHtml(r.error)}</div>` : ''}
      </div>
    `;
  }

  return { run, onServerChange };
})();
