import React, { useState } from 'react';
import './LogsTable.css';

const SEV_CFG = {
  critical: { cls: 'sev--critical', icon: '⚑' },
  high:     { cls: 'sev--high',     icon: '⚠' },
  medium:   { cls: 'sev--medium',   icon: '◈' },
  low:      { cls: 'sev--low',      icon: '○' },
};

const EVENT_ICONS = {
  device_down:   '✕',
  reboot:        '⟳',
  config_change: '✎',
  template_push: '⬆',
  high_cpu:      '▲',
};

export default function LogsTable({ logs }) {
  const [filterSev, setFilterSev] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const eventTypes = [...new Set(logs.map(l => l.event_type))];

  const filtered = logs.filter(l => {
    const sevOk = filterSev === 'all' || l.severity === filterSev;
    const typeOk = filterType === 'all' || l.event_type === filterType;
    return sevOk && typeOk;
  });

  return (
    <div className="logs-table-wrap">
      <div className="table-toolbar">
        <h3 className="table-title">Event Log</h3>
        <div className="toolbar-right">
          <div className="filter-group">
            {['all', 'critical', 'high', 'medium', 'low'].map(s => (
              <button
                key={s}
                className={`filter-btn ${filterSev === s ? 'filter-btn--active' : ''}`}
                onClick={() => setFilterSev(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="all">All Events</option>
            {eventTypes.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Severity</th>
              <th>Event Type</th>
              <th>Device</th>
              <th>Message</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => {
              const cfg = SEV_CFG[log.severity] || SEV_CFG.low;
              const icon = EVENT_ICONS[log.event_type] || '·';
              return (
                <tr key={log.id} className={`log-row log-row--${log.severity}`}>
                  <td>
                    <span className="log-ts">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={`sev-badge ${cfg.cls}`}>
                      {cfg.icon} {log.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="event-type-cell">
                      <span className="event-icon">{icon}</span>
                      {log.event_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="log-host">{log.hostname}</span>
                  </td>
                  <td>
                    <span className="log-msg">{log.message}</span>
                  </td>
                  <td>
                    <span className="log-user">{log.user}</span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">No matching log entries</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
