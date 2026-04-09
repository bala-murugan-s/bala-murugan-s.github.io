import React from 'react';
import './PolicyTable.css';

const TYPE_COLORS = {
  'QoS':       'cyan',
  'Security':  'green',
  'Routing':   'amber',
  'App-Aware': 'purple',
};

export default function PolicyTable({ policies, compact = false }) {
  const sorted = [...policies].sort((a, b) => {
    // unused first, then by applied_devices desc
    if (a.applied_devices === 0 && b.applied_devices > 0) return -1;
    if (b.applied_devices === 0 && a.applied_devices > 0) return 1;
    return b.applied_devices - a.applied_devices;
  });

  if (compact) {
    return (
      <div className="policy-table-wrap">
        <div className="table-toolbar">
          <h3 className="table-title">Policies</h3>
          <span className="toolbar-badge">{policies.length} total</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Devices</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id} className={p.applied_devices === 0 ? 'row--unused' : ''}>
                  <td>
                    <span className="policy-name">{p.name}</span>
                    {p.applied_devices === 0 && (
                      <span className="unused-tag">UNUSED</span>
                    )}
                  </td>
                  <td>
                    <span className={`type-badge type-badge--${TYPE_COLORS[p.type] || 'dim'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td>
                    <span className={p.applied_devices === 0 ? 'text-red' : 'text-primary'}>
                      {p.applied_devices}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${p.active ? 'status--up' : 'status--down'}`}>
                      {p.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="policy-table-wrap">
      <div className="table-toolbar">
        <h3 className="table-title">Policy Management</h3>
        <div className="toolbar-right">
          <span className="toolbar-badge">
            {policies.filter(p => p.applied_devices === 0).length} unused
          </span>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Type</th>
              <th>Applied Devices</th>
              <th>Last Used</th>
              <th>Status</th>
              <th>Flag</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const isUnused = p.applied_devices === 0;
              const lastUsed = new Date(p.last_used);
              const daysAgo = Math.floor((Date.now() - lastUsed) / 86400000);
              return (
                <tr key={p.id} className={isUnused ? 'row--unused' : ''}>
                  <td>
                    <span className="policy-name">{p.name}</span>
                  </td>
                  <td>
                    <span className={`type-badge type-badge--${TYPE_COLORS[p.type] || 'dim'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td>
                    <span className={isUnused ? 'text-red font-bold' : 'text-primary'}>
                      {p.applied_devices}
                    </span>
                  </td>
                  <td>
                    <span className="date-cell" title={lastUsed.toLocaleString()}>
                      {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${p.active ? 'status--up' : 'status--down'}`}>
                      {p.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    {isUnused
                      ? <span className="flag-badge flag-badge--warn">⚑ UNUSED</span>
                      : <span className="flag-badge flag-badge--ok">✓ OK</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
