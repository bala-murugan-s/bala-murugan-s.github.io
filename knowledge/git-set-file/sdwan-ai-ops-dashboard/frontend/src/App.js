import React, { useState } from 'react';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [ready, setReady] = useState(false);

  return ready
    ? <DashboardPage onReset={() => setReady(false)} />
    : <SetupPage onSetupComplete={() => setReady(true)} />;
}
