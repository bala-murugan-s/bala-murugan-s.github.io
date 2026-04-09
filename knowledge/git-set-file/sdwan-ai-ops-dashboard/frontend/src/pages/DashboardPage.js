import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import SummaryCards from '../components/SummaryCards';
import DeviceTable from '../components/DeviceTable';
import InsightsPanel from '../components/InsightsPanel';
import LogsTable from '../components/LogsTable';
import PolicyTable from '../components/PolicyTable';
import './DashboardPage.css';

const TABS = ['Overview', 'Devices', 'Policies', 'Logs'];

export default function DashboardPage({ onReset }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await api.dashboard();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefetch = async () => {
    setRefreshing(true);
    try {
      await api.fetchData();
      await loadDashboard(true);
    } catch (err) {
      setError(err.message);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-inner">
          <div className="loading-rings">
            <div className="loading-ring" />
            <div className="loading-ring loading-ring--2" />
            <span className="loading-icon">◈</span>
          </div>
          <p>Loading SD-WAN telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error-page">
        <span className="error-icon-large">⚠</span>
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => loadDashboard()}>Retry</button>
      </div>
    );
  }

  const { summary, devices, policies, logs, insights, fetched_at, source_url } = data;
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const highCount = insights.filter(i => i.severity === 'high').length;

  return (
    <div className="dashboard">
      {/* ——— Top Nav Bar ——— */}
      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-logo-icon">◈</span>
          <div>
            <h1 className="dash-title">SD-WAN AI OPS</h1>
            <p className="dash-subtitle">
              {source_url?.startsWith('demo') ? 'DEMO MODE' : source_url}
            </p>
          </div>
        </div>

        <div className="dash-header-center">
          <nav className="dash-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`dash-tab ${activeTab === tab ? 'dash-tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === 'Overview' && criticalCount > 0 && (
                  <span className="tab-badge tab-badge--critical">{criticalCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="dash-header-right">
          {lastRefresh && (
            <span className="last-refresh">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            className="btn-icon btn-refetch"
            onClick={handleRefetch}
            disabled={refreshing}
            title="Re-fetch live data"
          >
            <span className={refreshing ? 'spin-icon' : ''}>⟳</span>
          </button>
          <button className="btn-icon btn-reset" onClick={onReset} title="New connection">
            ⬡
          </button>
        </div>
      </header>

      {/* ——— Alert Banner ——— */}
      {criticalCount > 0 && (
        <div className="alert-banner">
          <span className="alert-pulse" />
          <strong>CRITICAL ALERT:</strong>&nbsp;
          {criticalCount} critical issue{criticalCount > 1 ? 's' : ''} detected
          {highCount > 0 ? ` + ${highCount} high severity` : ''}.
          Immediate attention required.
        </div>
      )}

      {/* ——— Main Content ——— */}
      <main className="dash-main">
        {activeTab === 'Overview' && (
          <div className="dash-overview animate-fade-in">
            <SummaryCards summary={summary} />
            <div className="dash-two-col">
              <InsightsPanel insights={insights} />
              <div className="dash-right-col">
                <PolicyTable policies={policies} compact />
                <div className="license-grid">
                  {summary.licenses.map(lic => {
                    const pct = Math.round((lic.used / lic.total) * 100);
                    return (
                      <div key={lic.type} className="license-card">
                        <div className="license-header">
                          <span className="license-name">{lic.type}</span>
                          <span className="license-count">{lic.used}/{lic.total}</span>
                        </div>
                        <div className="license-bar">
                          <div
                            className={`license-fill ${pct > 90 ? 'license-fill--warn' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="license-meta">
                          {pct}% used · Exp: {lic.expiry}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Devices' && (
          <div className="animate-fade-in">
            <DeviceTable devices={devices} />
          </div>
        )}

        {activeTab === 'Policies' && (
          <div className="animate-fade-in">
            <PolicyTable policies={policies} />
          </div>
        )}

        {activeTab === 'Logs' && (
          <div className="animate-fade-in">
            <LogsTable logs={logs} />
          </div>
        )}
      </main>

      <footer className="dash-footer">
        <span>SD-WAN AI Ops Dashboard</span>
        <span className="footer-sep">·</span>
        <span>Data as of: {fetched_at ? new Date(fetched_at).toLocaleString() : '—'}</span>
        <span className="footer-sep">·</span>
        <span className="footer-insights">
          {insights.length} AI insights generated
        </span>
      </footer>
    </div>
  );
}
