import React, { useState } from 'react';
import './DeviceTable.css';

const STATUS_CFG = {
  up:      { label: 'UP',      cls: 'status--up' },
  down:    { label: 'DOWN',    cls: 'status--down' },
  warning: { label: 'WARNING', cls: 'status--warning' },
};

function WanLinkBadge({ link }) {
  const cls = link.status === 'up' ? 'wan--up' : link.status === 'degraded' ? 'wan--degraded' : 'wan--down';
  return (
    <span className={`wan-badge ${cls}`} title={`${link.latency_ms}ms / ${link.loss_percent}% loss`}>
      {link.name}
    </span>
  );
}

function ResourceBar({ value, warn = 75, danger = 90 }) {
  const cls = value >= danger ? 'res-bar--danger' : value >= warn ? 'res-bar--warn' : 'res-bar--ok';
  return (
    <div className="res-bar-wrap">
      <div className="res-bar">
        <div className={`res-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`res-pct ${cls}`}>{value}%</span>
    </div>
  );
}

function DeviceRow({ device }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[device.status] || STATUS_CFG.warning;

  return (
    <>
      <tr
        className={`device-row ${expanded ? 'device-row--expanded' : ''}`}
        onClick={() => setExpanded(e => !e)}
      >
        <td>
          <div className="device-name-cell">
            <span className={`status-dot-sm ${cfg.cls}`} />
            <div>
              <div className="device-hostname">{device.hostname}</div>
              <div className="device-ip">{device.ip}</div>
            </div>
          </div>
        </td>
        <td><span className="device-site">{device.site}</span></td>
        <td><span className={`status-pill ${cfg.cls}`}>{cfg.label}</span></td>
        <td>
          {device.status !== 'down'
            ? <ResourceBar value={device.cpu_percent} />
            : <span className="na-val">—</span>}
        </td>
        <td>
          {device.status !== 'down'
            ? <ResourceBar value={device.memory_percent} />
            : <span className="na-val">—</span>}
        </td>
        <td>
          <span className={`reboot-count ${device.reboot_count_7d >= 4 ? 'reboot-count--high' : device.reboot_count_7d >= 2 ? 'reboot-count--med' : ''}`}>
            {device.reboot_count_7d}
          </span>
        </td>
        <td>
          <span className="tunnel-count">{device.tunnel_count}</span>
        </td>
        <td>
          <div className="wan-links-cell">
            {device.wan_links.map(l => <WanLinkBadge key={l.name} link={l} />)}
          </div>
        </td>
        <td className="expand-col">{expanded ? '▴' : '▾'}</td>
      </tr>

      {expanded && (
        <tr className="device-detail-row">
          <td colSpan={9}>
            <div className="device-detail">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Model</span>
                  <span className="detail-val">{device.model}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Software</span>
                  <span className="detail-val">{device.software_version}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Uptime</span>
                  <span className="detail-val">{device.uptime_hours > 0 ? `${device.uptime_hours}h` : 'Offline'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Reboot</span>
                  <span className="detail-val">{new Date(device.last_reboot).toLocaleString()}</span>
                </div>
              </div>
              <div className="detail-wan">
                <span className="detail-label">WAN Link Details</span>
                <table className="wan-detail-table">
                  <thead>
                    <tr>
                      <th>Link</th><th>Status</th><th>Latency</th><th>Loss %</th><th>Bandwidth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {device.wan_links.map(link => (
                      <tr key={link.name}>
                        <td>{link.name}</td>
                        <td><span className={`status-pill status-pill--sm ${link.status === 'up' ? 'status--up' : link.status === 'degraded' ? 'status--warning' : 'status--down'}`}>{link.status.toUpperCase()}</span></td>
                        <td>{link.latency_ms > 0 ? `${link.latency_ms} ms` : '—'}</td>
                        <td className={link.loss_percent > 2 ? 'text-red' : link.loss_percent > 0.5 ? 'text-amber' : ''}>{link.loss_percent}%</td>
                        <td>{link.bw_mbps} Mbps</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function DeviceTable({ devices }) {
  const [sortBy, setSortBy] = useState('status');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = filterStatus === 'all'
    ? devices
    : devices.filter(d => d.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'status') {
      const order = { down: 0, warning: 1, up: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    }
    if (sortBy === 'cpu') return b.cpu_percent - a.cpu_percent;
    if (sortBy === 'reboots') return b.reboot_count_7d - a.reboot_count_7d;
    return a.hostname.localeCompare(b.hostname);
  });

  return (
    <div className="device-table-wrap">
      <div className="table-toolbar">
        <h3 className="table-title">Edge Devices</h3>
        <div className="toolbar-right">
          <div className="filter-group">
            {['all', 'up', 'warning', 'down'].map(s => (
              <button
                key={s}
                className={`filter-btn ${filterStatus === s ? 'filter-btn--active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="status">Sort: Status</option>
            <option value="hostname">Sort: Hostname</option>
            <option value="cpu">Sort: CPU</option>
            <option value="reboots">Sort: Reboots</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Site</th>
              <th>Status</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Reboots (7d)</th>
              <th>Tunnels</th>
              <th>WAN Links</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => <DeviceRow key={d.id} device={d} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
