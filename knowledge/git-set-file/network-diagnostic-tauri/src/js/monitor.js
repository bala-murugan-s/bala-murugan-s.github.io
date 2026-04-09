/* ════════════════════════════════════════
   NetDiag — monitor.js (Live Monitor)
   Polls get_monitor_results every 800ms
   ════════════════════════════════════════ */

'use strict';

const monitorModule = (() => {
  let _polling = null;
  let _running = false;
  let _startTime = null;
  let _uptimeTimer = null;
  let _lastRows = {};

  // Demo state for browser testing
  const _demoHosts = [];
  const _demoRows = {};
  let _demoRunning = false;
  let _demoInterval = null;

  async function start() {
    const raw = document.getElementById('monitorHosts').value;
    const hosts = parseHostList(raw);
    const intervalMs = parseInt(document.getElementById('monitorInterval').value) || 2000;

    if (hosts.length === 0) {
      showToast('Please enter at least one host', 'error');
      return;
    }

    // Initialize demo rows
    if (!isTauri) {
      _demoHosts.length = 0;
      hosts.forEach(h => {
        _demoHosts.push(h);
        _demoRows[h] = {
          host: h,
          history: [],
          avg_last_10: null,
          overall_avg: null,
          total_pings: 0,
          total_success: 0,
          last_status: 'PENDING',
        };
      });
      _demoRunning = true;
      _demoInterval = setInterval(() => _demoTick(hosts), intervalMs);

      // Seed with first tick immediately
      _demoTick(hosts);
    }

    try {
      await invoke('start_parallel_monitor', {
        hosts,
        interval_ms: intervalMs,
      });
    } catch (err) {
      // In demo mode this is fine
      if (isTauri) {
        showToast(`Failed to start monitor: ${err}`, 'error');
        return;
      }
    }

    _running = true;
    _startTime = Date.now();

    // Show UI
    document.getElementById('monitorConfig').style.display = 'none';
    document.getElementById('monitorStartBtn').style.display = 'none';
    document.getElementById('monitorStopBtn').style.display = 'flex';
    document.getElementById('monitorStats').style.display = 'flex';
    document.getElementById('monitorTableWrap').style.display = 'block';
    document.getElementById('monitor-badge').style.display = 'inline';

    // Initialize table rows
    initTable(hosts);

    setSidebarStatus('Monitoring…');

    // Start polling
    _polling = setInterval(poll, 800);

    // Uptime counter
    _uptimeTimer = setInterval(updateUptime, 1000);
  }

  function _demoTick(hosts) {
    if (!_demoRunning) return;
    hosts.forEach(host => {
      const row = _demoRows[host];
      if (!row) return;
      const success = Math.random() > 0.15;
      const latency = success ? 5 + Math.random() * 80 : null;
      const entry = { latency_ms: latency, success, timestamp: Date.now() };
      row.history.push(entry);
      if (row.history.length > 10) row.history.shift();
      row.total_pings++;
      if (success) row.total_success++;
      const valid = row.history.filter(e => e.latency_ms !== null).map(e => e.latency_ms);
      row.avg_last_10 = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      row.overall_avg = row.avg_last_10;
      row.last_status = success ? `OK (${latency.toFixed(1)}ms)` : 'FAIL';
    });
  }

  async function poll() {
    try {
      let state;
      if (!isTauri) {
        state = {
          rows: _demoHosts.map(h => _demoRows[h]),
          running: _demoRunning,
          started_at: _startTime,
        };
      } else {
        state = await invoke('get_monitor_results', {});
      }
      updateTable(state.rows);
      updateStats(state.rows);
    } catch (err) {
      // Ignore poll errors silently
    }
  }

  async function stop() {
    _running = false;
    clearInterval(_polling);
    clearInterval(_uptimeTimer);
    _polling = null;

    if (!isTauri) {
      _demoRunning = false;
      clearInterval(_demoInterval);
    }

    try {
      await invoke('stop_parallel_monitor', {});
    } catch (e) {}

    document.getElementById('monitorConfig').style.display = 'block';
    document.getElementById('monitorStartBtn').style.display = 'flex';
    document.getElementById('monitorStopBtn').style.display = 'none';
    document.getElementById('monitor-badge').style.display = 'none';

    setSidebarStatus('Ready');
    showToast('Monitor stopped', '');
  }

  function initTable(hosts) {
    const tbody = document.getElementById('monitorTableBody');
    tbody.innerHTML = '';
    _lastRows = {};

    hosts.forEach(host => {
      const tr = document.createElement('tr');
      tr.id = `mrow-${sanitizeId(host)}`;

      const cells = [];
      for (let i = 0; i < 10; i++) {
        cells.push(`<td class="ping-cell"><div class="ping-dot empty" id="pd-${sanitizeId(host)}-${i}">—</div></td>`);
      }

      tr.innerHTML = `
        <td style="font-weight:600">${escapeHtml(host)}</td>
        ${cells.join('')}
        <td class="td-avg" id="pavg10-${sanitizeId(host)}">—</td>
        <td class="td-avg" id="pavgAll-${sanitizeId(host)}">—</td>
        <td id="pstatus-${sanitizeId(host)}"><span class="status-badge warn">● PENDING</span></td>
      `;
      tbody.appendChild(tr);
      _lastRows[host] = { history: [] };
    });
  }

  function updateTable(rows) {
    if (!rows) return;
    rows.forEach(row => {
      const sid = sanitizeId(row.host);
      const prev = _lastRows[row.host] || { history: [] };
      const prevLen = prev.history.length;
      const currLen = row.history.length;

      // Update ping dots
      for (let i = 0; i < 10; i++) {
        const cell = document.getElementById(`pd-${sid}-${i}`);
        if (!cell) continue;
        const entry = row.history[i];
        if (!entry) {
          cell.className = 'ping-dot empty';
          cell.textContent = '—';
        } else {
          const isNew = i >= prevLen && i < currLen;
          let cls = 'ping-dot';
          let label = '—';

          if (entry.latency_ms === null || entry.latency_ms === undefined) {
            // timeout / fail
            if (!entry.success) {
              cls += ' danger';
              label = '✕';
            } else {
              cls += ' warn';
              label = '?';
            }
          } else {
            cls += ' success';
            const ms = entry.latency_ms;
            label = ms < 10 ? `${ms.toFixed(0)}` : ms < 100 ? `${ms.toFixed(0)}` : '99+';
          }

          if (isNew) cls += ' new';
          cell.className = cls;
          cell.textContent = label;
          cell.title = entry.latency_ms !== null ? `${entry.latency_ms.toFixed(2)}ms` : 'No response';
        }
      }

      // Update averages
      const avg10El = document.getElementById(`pavg10-${sid}`);
      const avgAllEl = document.getElementById(`pavgAll-${sid}`);
      if (avg10El) avg10El.textContent = row.avg_last_10 !== null ? fmtMs(row.avg_last_10) : '—';
      if (avgAllEl) avgAllEl.textContent = row.overall_avg !== null ? fmtMs(row.overall_avg) : '—';

      // Status
      const statusEl = document.getElementById(`pstatus-${sid}`);
      if (statusEl) {
        const lastEntry = row.history[row.history.length - 1];
        if (!lastEntry) {
          statusEl.innerHTML = '<span class="status-badge warn">● PENDING</span>';
        } else if (lastEntry.success) {
          statusEl.innerHTML = `<span class="status-badge success">● ${escapeHtml(row.last_status)}</span>`;
        } else {
          statusEl.innerHTML = '<span class="status-badge danger">● FAIL</span>';
        }
      }

      _lastRows[row.host] = row;
    });
  }

  function updateStats(rows) {
    if (!rows || rows.length === 0) return;
    const online = rows.filter(r => {
      const last = r.history[r.history.length - 1];
      return last && last.success;
    }).length;

    const allLatencies = rows.flatMap(r =>
      r.history.filter(e => e.latency_ms !== null).map(e => e.latency_ms)
    );
    const avgRtt = allLatencies.length
      ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length
      : null;

    document.getElementById('statHosts').textContent = rows.length;
    document.getElementById('statOnline').textContent = online;
    document.getElementById('statOffline').textContent = rows.length - online;
    document.getElementById('statAvgRtt').textContent = avgRtt !== null ? fmtMs(avgRtt) : '—';
  }

  function updateUptime() {
    if (!_startTime) return;
    const sec = Math.floor((Date.now() - _startTime) / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const el = document.getElementById('statUptime');
    if (el) {
      el.textContent = h > 0
        ? `${h}h ${m}m ${s}s`
        : m > 0
        ? `${m}m ${s}s`
        : `${s}s`;
    }
  }

  function loadSample() {
    document.getElementById('monitorHosts').value = [
      '8.8.8.8',
      '1.1.1.1',
      '9.9.9.9',
      '208.67.222.222',
      'localhost',
      '192.168.1.1',
    ].join('\n');
  }

  function exportCSV() {
    if (!_lastRows || Object.keys(_lastRows).length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    const lines = ['Host,Total Pings,Success,Avg RTT (ms),Last Status'];
    Object.values(_lastRows).forEach(row => {
      lines.push([
        row.host,
        row.total_pings || 0,
        row.total_success || 0,
        row.overall_avg !== null ? row.overall_avg.toFixed(2) : '',
        row.last_status || '',
      ].join(','));
    });
    downloadCSV(lines.join('\n'), 'monitor-results.csv');
    showToast('CSV exported', 'success');
  }

  function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
  }

  return { start, stop, loadSample, exportCSV };
})();
