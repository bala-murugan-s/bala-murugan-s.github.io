import React from 'react';
import './SummaryCards.css';

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function SummaryCards({ summary }) {
  const { devices, wan, policies } = summary;

  return (
    <div className="summary-cards">
      <StatCard
        label="Total Devices"
        value={devices.total}
        sub={`${devices.availability_pct}% availability`}
        accent="neutral"
        icon="⬡"
      />
      <StatCard
        label="Online"
        value={devices.up}
        sub={`${devices.warning} warning`}
        accent="green"
        icon="◉"
      />
      <StatCard
        label="Offline"
        value={devices.down}
        sub={devices.down > 0 ? 'Requires attention' : 'All systems nominal'}
        accent={devices.down > 0 ? 'red' : 'neutral'}
        icon="◎"
      />
      <StatCard
        label="Active Tunnels"
        value={wan.total_tunnels}
        sub={`${wan.degraded_links} degraded link${wan.degraded_links !== 1 ? 's' : ''}`}
        accent={wan.degraded_links > 0 ? 'amber' : 'neutral'}
        icon="⟆"
      />
      <StatCard
        label="Active Policies"
        value={policies.active}
        sub={`${policies.unused} unused`}
        accent="neutral"
        icon="▣"
      />
      <StatCard
        label="WAN Links"
        value={wan.total_links}
        sub={`${wan.total_links - wan.degraded_links} healthy`}
        accent={wan.degraded_links > 0 ? 'amber' : 'green'}
        icon="⟵"
      />
    </div>
  );
}
