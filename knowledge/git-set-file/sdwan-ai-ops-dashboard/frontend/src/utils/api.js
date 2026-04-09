const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  setup: (payload) => request('/setup', { method: 'POST', body: JSON.stringify(payload) }),
  fetchData: () => request('/fetch-data', { method: 'POST' }),
  dashboard: () => request('/dashboard'),
  demo: () => request('/demo', { method: 'POST' }),
  health: () => request('/health'),
};
