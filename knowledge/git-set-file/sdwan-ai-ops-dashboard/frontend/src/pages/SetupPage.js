import React, { useState } from 'react';
import { api } from '../utils/api';
import './SetupPage.css';

export default function SetupPage({ onSetupComplete }) {
  const [form, setForm] = useState({ device_url: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = form, 2 = fetching

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.setup(form);
      setStep(2);
      const fetchResult = await api.fetchData();
      onSetupComplete({ mode: 'live', ...fetchResult });
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await api.demo();
      onSetupComplete({ mode: 'demo' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-grid-bg" />

      <div className="setup-container animate-fade-in">
        <div className="setup-header">
          <div className="setup-logo">
            <span className="logo-icon">◈</span>
            <div>
              <h1>SD-WAN AI OPS</h1>
              <p className="logo-sub">OPERATIONS DASHBOARD v1.0</p>
            </div>
          </div>
          <div className="setup-status-bar">
            <span className="status-dot status-dot--blink" />
            <span>SYSTEM READY</span>
          </div>
        </div>

        <div className="setup-card">
          <div className="setup-card-header">
            <span className="step-badge">STEP 01</span>
            <h2>Controller Configuration</h2>
            <p className="setup-desc">
              Connect to your SD-WAN controller (Cisco vManage, VeloCloud, etc.)
              or load the built-in demo dataset to explore the dashboard.
            </p>
          </div>

          {step === 1 && (
            <form className="setup-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-prefix">01</span> Controller URL
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="device_url"
                  value={form.device_url}
                  onChange={handleChange}
                  placeholder="https://vmanage.corp.local:8443"
                  required
                />
                <span className="form-hint">vManage hostname or IP with port</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-prefix">02</span> Username
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-prefix">03</span> Password
                  </label>
                  <input
                    className="form-input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="setup-error">
                  <span className="error-icon">⚠</span> {error}
                </div>
              )}

              <div className="setup-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Connecting...' : 'Connect & Fetch Data →'}
                </button>
                <div className="setup-divider"><span>or</span></div>
                <button
                  type="button"
                  className="btn btn-demo"
                  onClick={handleDemo}
                  disabled={loading}
                >
                  ◈ Load Demo Dataset
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="setup-fetching">
              <div className="fetch-animation">
                <div className="fetch-ring" />
                <div className="fetch-ring fetch-ring--2" />
                <div className="fetch-ring fetch-ring--3" />
                <span className="fetch-icon">◈</span>
              </div>
              <p className="fetch-label">Authenticating and retrieving SD-WAN telemetry...</p>
              <div className="fetch-steps">
                <div className="fetch-step fetch-step--done">✓ Configuration saved</div>
                <div className="fetch-step fetch-step--active">⟳ Fetching device inventory...</div>
                <div className="fetch-step fetch-step--pending">◯ Processing telemetry</div>
                <div className="fetch-step fetch-step--pending">◯ Running AI analysis</div>
              </div>
            </div>
          )}
        </div>

        <div className="setup-features">
          {[
            { icon: '⬡', label: 'Device Health', desc: 'Real-time status & telemetry' },
            { icon: '⟆', label: 'WAN Analytics', desc: 'Link quality & tunnel health' },
            { icon: '◎', label: 'AI Insights', desc: 'Automated anomaly detection' },
            { icon: '▣', label: 'Policy Audit', desc: 'Unused & misconfigured rules' },
          ].map((f) => (
            <div key={f.label} className="feature-chip">
              <span className="feature-chip-icon">{f.icon}</span>
              <div>
                <div className="feature-chip-label">{f.label}</div>
                <div className="feature-chip-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
