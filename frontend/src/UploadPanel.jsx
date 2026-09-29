import { useRef } from 'react';
import HeroChart from './HeroChart';

function UploadPanel({ onUpload, onDemo, onConnect, hasSaved, onOpenSaved, onClearSaved, error }) {
  const fileInput = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-intro">
          <h1 className="home-title">Running Load Insights</h1>
          <p className="home-subtitle">
            Upload your Strava history to see your injury risk week by week.
          </p>

          {hasSaved && (
            <p className="saved-notice">
              Your last upload is saved in this browser.{' '}
              <button className="link-btn" onClick={onOpenSaved}>Open dashboard</button>
              <span className="footer-sep">&middot;</span>
              <button className="link-btn" onClick={onClearSaved}>Clear saved data</button>
            </p>
          )}

          <div className="home-actions">
            <button className="connect-btn" onClick={() => fileInput.current.click()}>
              Upload activities.csv
            </button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={handleFileChange} hidden />
            <button className="secondary-btn" onClick={onDemo}>
              Try with sample data
            </button>
          </div>

          {error && <p className="home-error" role="alert">{error}</p>}

          {onConnect && (
            <button className="link-btn" onClick={onConnect}>
              Or connect with Strava
            </button>
          )}
        </div>

        <div className="home-visual">
          <HeroChart />
        </div>
      </section>

      <section className="export-steps" aria-labelledby="export-steps-title">
        <h2 id="export-steps-title">Get your activities.csv from Strava</h2>
        <ol>
          <li>
            <span className="step-number">1</span>
            <p>On strava.com, open <strong>Settings → My Account</strong> and click <strong>Request Your Archive</strong>.</p>
          </li>
          <li>
            <span className="step-number">2</span>
            <p>Strava emails you a zip file, usually within a few hours. Unzip it.</p>
          </li>
          <li>
            <span className="step-number">3</span>
            <p>Upload the <strong>activities.csv</strong> file from inside the folder.</p>
          </li>
        </ol>
        <p className="export-note">
          Your Strava language must be set to English when you export. Your file is never stored on a server. Your results are saved only in this browser, and you can clear them any time.
        </p>
      </section>
    </main>
  );
}

export default UploadPanel;
