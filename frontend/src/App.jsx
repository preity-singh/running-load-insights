import { useState, useEffect, useRef } from 'react';
import UploadPanel from './UploadPanel';
import Dashboard from './Dashboard';
import './App.css';

// On Vercel the backend is served from the same domain under /api; locally, Vite proxies /api to uvicorn
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';
// Strava API access now requires a paid subscription; set VITE_STRAVA_ENABLED=true to bring back "Connect with Strava"
const STRAVA_ENABLED = import.meta.env.VITE_STRAVA_ENABLED === 'true';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasProcessed = useRef(false);

  async function loadDashboard(request) {
    setLoading(true);
    setError(null);
    try {
      const response = await request;
      if (response.status === 413) {
        throw new Error('That file is too large. Make sure you uploaded activities.csv, not the whole export zip.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof SyntaxError ? 'Something went wrong. Please try again.' : err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (STRAVA_ENABLED && code && !hasProcessed.current) {
      hasProcessed.current = true;
      window.history.replaceState({}, '', '/');
      loadDashboard(fetch(`${BACKEND_URL}/process?code=${code}`));
    }
  }, []);

  function handleUpload(file) {
    loadDashboard(fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: file,
    }));
  }

  function handleDemo() {
    loadDashboard(fetch(`${BACKEND_URL}/demo`));
  }

  async function handleConnect() {
    const response = await fetch(`${BACKEND_URL}/login`);
    const data = await response.json();
    window.location.href = data.auth_url;
  }

  return (
    <div>
      {dashboardData === null && !loading && (
        <UploadPanel
          onUpload={handleUpload}
          onDemo={handleDemo}
          onConnect={STRAVA_ENABLED ? handleConnect : null}
          error={error}
        />
      )}
      {loading && <div className="loading"><p>Loading your dashboard...</p></div>}
      {dashboardData && <Dashboard data={dashboardData} />}
      <footer className="site-footer">
        Built by <a href="https://www.linkedin.com/in/preity-singh/" target="_blank" rel="noopener noreferrer">Preity Singh</a>
        <span className="footer-sep">&middot;</span>
        <a href="https://github.com/preity-singh" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span className="footer-sep">&middot;</span>
        React + FastAPI + Groq
      </footer>
    </div>
  );
}

export default App;
