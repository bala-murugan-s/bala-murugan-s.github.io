/* NetDiag Tool — Alpine.js Application */

function netdiagApp() {
  return {
    // UI
    activeView: 'dashboard',
    sidebarCollapsed: false,

    // Ping state
    pingInput: '8.8.8.8\n1.1.1.1\n9.9.9.9\n208.67.222.222',
    pingInterval: 2000,
    intervalOptions: [
      { val: 500,   label: '0.5s' },
      { val: 1000,  label: '1s'   },
      { val: 2000,  label: '2s'   },
      { val: 5000,  label: '5s'   },
      { val: 10000, label: '10s'  },
    ],
    ipList: [],       // array of IPSnapshot — Alpine watches this
    _ipIdx: {},       // ip -> index in ipList
    singleResults: [],
    activityFeed: [],
    continuousRunning: false,  // tracks if any continuous session active

    // DNS state
    dnsInput: 'google.com',
    dnsTypes: ['A','AAAA','MX','NS','TXT'],
    dnsTypeOptions: ['A','AAAA','CNAME','MX','NS','TXT','PTR'],
    dnsResults: [],
    dnsLoading: false,
    dnsError: '',

    // SSL state
    sslInput: 'google.com',
    sslPort: '443',
    sslResults: [],
    sslLoading: false,
    sslError: '',

    // SSE
    _es: null,
    _esReconnecting: false,
    _esReconnectTimer: null,
    sseConnected: false,

    // ── Computed ───────────────────────────────────────────
    get activeIPCount()  { return this.ipList.filter(s => s.active).length; },
    get failedIPCount()  { return this.ipList.filter(s => this._lastStatus(s) === 'failed').length; },
    get warningIPCount() { return this.ipList.filter(s => this._lastStatus(s) === 'timeout').length; },
    get globalAvgLatency() {
      const a = this.ipList.filter(s => s.avg_latency > 0);
      return a.length ? a.reduce((s, x) => s + x.avg_latency, 0) / a.length : 0;
    },

    // ── Init ───────────────────────────────────────────────
    init() {
      this._connectSSE();
      setInterval(() => this._pollStatus(), 5000);
    },

    // ── SSE ────────────────────────────────────────────────
    _connectSSE() {
      if (this._es) { this._es.close(); this._es = null; }

      const es = new EventSource('/api/ping/stream');
      this._es = es;
      this._esReconnecting = false;

      es.onopen = () => {
        this.sseConnected = true;
        this._esReconnecting = false;
        if (this._esReconnectTimer) { clearTimeout(this._esReconnectTimer); this._esReconnectTimer = null; }
      };

      es.onmessage = (e) => {
        try { this._handleSSE(JSON.parse(e.data)); }
        catch(err) { console.warn('SSE parse error', err); }
      };

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED && !this._esReconnecting) {
          this.sseConnected = false;
          this._esReconnecting = true;
          this._esReconnectTimer = setTimeout(() => this._connectSSE(), 3000);
        }
      };
    },

    _handleSSE(payload) {
      if (payload.type === 'init') {
        const list = payload.data || [];
        this.ipList = list.map(s => ({...s}));
        this._ipIdx = {};
        this.ipList.forEach((s, i) => { this._ipIdx[s.ip] = i; });
        this.continuousRunning = this.ipList.some(s => s.active);
        return;
      }
      const { type, ip, result, state } = payload;
      if (state) {
        this._upsert(state);
        this.continuousRunning = this.ipList.some(s => s.active);
      }
      if (type === 'result' && result)  this._logActivity(ip, result);
      else if (type === 'started')      this._logMsg(ip, '▶ monitoring started', 'started');
      else if (type === 'stopped')      this._logMsg(ip, '■ stopped', 'stopped');
    },

    _upsert(snap) {
      const idx = this._ipIdx[snap.ip];
      if (idx !== undefined) {
        this.ipList.splice(idx, 1, {...snap});
      } else {
        this._ipIdx[snap.ip] = this.ipList.length;
        this.ipList.push({...snap});
      }
    },

    async _pollStatus() {
      try {
        const r = await fetch('/api/ping/status');
        const j = await r.json();
        if (j.success && j.data) {
          j.data.forEach(s => this._upsert(s));
          this.continuousRunning = this.ipList.some(s => s.active);
        }
      } catch(_) {}
    },

    // ── Ping actions ───────────────────────────────────────
    _parseLines(text) {
      return text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    },

    async startSinglePing() {
      const ips = this._parseLines(this.pingInput);
      if (!ips.length) return;
      this.singleResults = [];
      try {
        const r = await fetch('/api/ping/multiple', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ ips, timeout_ms: 3000 })
        });
        const j = await r.json();
        if (j.success && j.data) {
          this.singleResults = Object.entries(j.data).map(([ip, res]) => ({
            ip, status: res.status, latency: res.latency_ms
          }));
        }
      } catch(e) { console.error('Single ping error', e); }
    },

    async startContinuousPing() {
      const ips = this._parseLines(this.pingInput);
      if (!ips.length) return;
      try {
        const r = await fetch('/api/ping/continuous/start', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ ips, interval_ms: this.pingInterval })
        });
        const j = await r.json();
        if (j.success) {
          this.continuousRunning = true;
          this.activeView = 'ping';
        } else {
          console.error('Continuous start failed:', j.error);
        }
      } catch(e) { console.error('Continuous ping error', e); }
    },

    async stopAll() {
      try {
        await fetch('/api/ping/continuous/stopall', { method: 'POST', headers: {'Content-Type':'application/json'} });
        this.continuousRunning = false;
      } catch(e) { console.error('Stop all error', e); }
    },

    async stopIP(ip) {
      try {
        await fetch('/api/ping/continuous/stop', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ ip })
        });
      } catch(e) { console.error('Stop IP error', e); }
    },

    async resumeIP(ip) {
      try {
        await fetch('/api/ping/continuous/start', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ ips: [ip], interval_ms: this.pingInterval })
        });
      } catch(e) { console.error('Resume IP error', e); }
    },

    // ── DNS actions ────────────────────────────────────────
    async runDNS() {
      const domains = this._parseLines(this.dnsInput);
      if (!domains.length) return;
      this.dnsLoading = true;
      this.dnsError = '';
      this.dnsResults = [];
      try {
        const endpoint = domains.length === 1 ? '/api/dns/resolve' : '/api/dns/bulk';
        const body = domains.length === 1
          ? { domain: domains[0], types: this.dnsTypes }
          : { domains, types: this.dnsTypes };
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body)
        });
        const j = await r.json();
        if (j.success) {
          this.dnsResults = Array.isArray(j.data) ? j.data : [j.data];
        } else {
          this.dnsError = j.error || 'DNS lookup failed';
        }
      } catch(e) {
        this.dnsError = 'Request failed: ' + e.message;
      } finally {
        this.dnsLoading = false;
      }
    },

    toggleDNSType(t) {
      const idx = this.dnsTypes.indexOf(t);
      if (idx >= 0) this.dnsTypes.splice(idx, 1);
      else this.dnsTypes.push(t);
    },

    dnsTypeActive(t) { return this.dnsTypes.includes(t); },

    dnsRecordClass(type) {
      const map = { A:'badge--blue', AAAA:'badge--blue', CNAME:'badge--amber',
                    MX:'badge--green', NS:'badge--purple', TXT:'badge--dim', PTR:'badge--dim' };
      return map[type] || 'badge--dim';
    },

    // ── SSL actions ────────────────────────────────────────
    async runSSL() {
      const hosts = this._parseLines(this.sslInput);
      if (!hosts.length) return;
      this.sslLoading = true;
      this.sslError = '';
      this.sslResults = [];
      try {
        const endpoint = hosts.length === 1 ? '/api/ssl/analyze' : '/api/ssl/bulk';
        const body = hosts.length === 1
          ? { host: hosts[0], port: this.sslPort, timeout_ms: 10000 }
          : { hosts, port: this.sslPort, timeout_ms: 10000 };
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body)
        });
        const j = await r.json();
        if (j.success) {
          this.sslResults = Array.isArray(j.data) ? j.data : [j.data];
        } else {
          this.sslError = j.error || 'SSL analysis failed';
        }
      } catch(e) {
        this.sslError = 'Request failed: ' + e.message;
      } finally {
        this.sslLoading = false;
      }
    },

    sslGradeClass(grade) {
      return { A:'badge--green', B:'badge--blue', C:'badge--amber', F:'badge--red' }[grade] || 'badge--dim';
    },

    sslExpiryClass(days) {
      if (days < 0) return 'text-red';
      if (days < 14) return 'text-red';
      if (days < 30) return 'text-amber';
      return 'text-green';
    },

    // ── Activity feed ──────────────────────────────────────
    _logActivity(ip, result) {
      const msg = result.status === 'success'
        ? result.latency_ms.toFixed(1) + 'ms'
        : result.status === 'timeout' ? 'Timeout' : 'Unreachable';
      this._logMsg(ip, msg, result.status);
    },

    _logMsg(ip, msg, type) {
      this.activityFeed.unshift({
        ip, msg, type,
        time: new Date().toLocaleTimeString('en-US', {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})
      });
      if (this.activityFeed.length > 200) this.activityFeed.length = 200;
    },

    // ── Ping table helpers ─────────────────────────────────
    _lastStatus(snap) {
      const r = snap.rolling;
      return r && r.length ? r[r.length-1].status : null;
    },

    getPaddedRolling(snap) {
      const r = snap.rolling || [];
      const out = new Array(10).fill(null);
      r.forEach((x, i) => { out[10 - r.length + i] = x; });
      return out;
    },

    pingBadgeClass(cell) {
      if (!cell) return 'ping-badge--empty';
      return 'ping-badge--' + cell.status;
    },

    pingBadgeText(cell) {
      if (!cell) return '—';
      if (cell.status === 'success') return cell.latency_ms.toFixed(0) + 'ms';
      return cell.status === 'timeout' ? 'TMO' : 'ERR';
    },

    avgClass(avg) {
      if (!avg || avg <= 0) return '';
      if (avg < 20)  return 'avg-val--good';
      if (avg < 80)  return 'avg-val--ok';
      if (avg < 200) return 'avg-val--warn';
      return 'avg-val--bad';
    },

    getUptime(snap) {
      return snap.total_pings ? Math.round(snap.total_ok / snap.total_pings * 100) : 0;
    },

    uptimeBarClass(snap) {
      const p = this.getUptime(snap);
      return p >= 95 ? 'uptime-bar__fill--green' : p >= 80 ? 'uptime-bar__fill--amber' : 'uptime-bar__fill--red';
    },

    ipCardClass(snap) {
      const s = this._lastStatus(snap);
      if (!s || s === 'success') return 'ip-card--ok';
      return s === 'timeout' ? 'ip-card--warning' : 'ip-card--down';
    },

    statusDotClass(snap) {
      if (!snap.active) return 'status-dot--muted';
      const s = this._lastStatus(snap);
      if (!s || s === 'success') return 'status-dot--green';
      return s === 'timeout' ? 'status-dot--amber' : 'status-dot--red';
    },

    sparkClass(r) {
      if (!r) return 'spark-bar--empty';
      return r.status === 'success' ? 'spark-bar--green' : r.status === 'timeout' ? 'spark-bar--amber' : 'spark-bar--red';
    },

    sparkHeight(r) {
      if (!r || r.status !== 'success') return 'height:3px';
      const h = Math.max(4, Math.round(4 + Math.min(r.latency_ms / 150, 1) * 20));
      return 'height:' + h + 'px';
    },
  };
}
