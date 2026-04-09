import React, { useState } from 'react';
import './InsightsPanel.css';

const SEVERITY_CONFIG = {
  critical: { color: 'red', icon: '⚑', label: 'CRITICAL' },
  high:     { color: 'amber', icon: '⚠', label: 'HIGH' },
  medium:   { color: 'cyan', icon: '◈', label: 'MEDIUM' },
  low:      { color: 'dim', icon: '◎', label: 'LOW' },
  info:     { color: 'dim', icon: '○', label: 'INFO' },
};

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;

  return (
    <div className={`insight-card insight-card--${cfg.color} ${expanded ? 'insight-card--expanded' : ''}`}>
      <div className="insight-header" onClick={() => setExpanded(e => !e)}>
        <div className="insight-left">
          <span className={`insight-sev-badge insight-sev--${cfg.color}`}>
            <span>{cfg.icon}</span>
            {cfg.label}
          </span>
          <span className="insight-category">{insight.category}</span>
        </div>
        <span className="insight-expand">{expanded ? '▴' : '▾'}</span>
      </div>
      <div className="insight-title">{insight.title}</div>

      {expanded && (
        <div className="insight-body">
          <p className="insight-desc">{insight.description}</p>
          {insight.affected && insight.affected.length > 0 && (
            <div className="insight-affected">
              <span className="insight-section-label">AFFECTED</span>
              <div className="insight-chips">
                {insight.affected.map(a => (
                  <span key={a} className="insight-chip">{a}</span>
                ))}
              </div>
            </div>
          )}
          <div className="insight-recommendation">
            <span className="insight-section-label">RECOMMENDATION</span>
            <p>{insight.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InsightsPanel({ insights }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? insights
    : insights.filter(i => i.severity === filter);

  const counts = {
    critical: insights.filter(i => i.severity === 'critical').length,
    high: insights.filter(i => i.severity === 'high').length,
    medium: insights.filter(i => i.severity === 'medium').length,
    low: insights.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <div className="insights-title-row">
          <h3 className="insights-title">
            <span className="insights-icon">◎</span>
            AI Insights
          </h3>
          <span className="insights-count">{insights.length} findings</span>
        </div>
        <div className="insights-filters">
          {[
            { key: 'all', label: 'All', count: insights.length },
            { key: 'critical', label: 'Critical', count: counts.critical },
            { key: 'high', label: 'High', count: counts.high },
            { key: 'medium', label: 'Medium', count: counts.medium },
            { key: 'low', label: 'Low', count: counts.low },
          ].map(f => (
            <button
              key={f.key}
              className={`insights-filter-btn ${filter === f.key ? 'insights-filter-btn--active' : ''} ${f.key !== 'all' ? `insights-filter-btn--${f.key}` : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.count > 0 && <span className="filter-count">{f.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="insights-list">
        {filtered.length === 0 ? (
          <div className="insights-empty">
            <span>◎</span>
            <p>No {filter !== 'all' ? filter : ''} findings</p>
          </div>
        ) : (
          filtered.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}
