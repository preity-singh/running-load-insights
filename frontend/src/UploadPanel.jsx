import { useRef } from 'react';

function UploadPanel({ onUpload, onDemo, onConnect, error }) {
  const fileInput = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) onUpload(file);
    e.target.value = '';
  }

  return (
    <div className="landing">
      <h1>Training Load Insights</h1>
      <p className="landing-description">
        Upload your Strava activity history to see how your running load has shifted over time, spot risky spikes before they become injuries, and get a personalized coaching note — all from your real data.
      </p>

      <div className="landing-actions">
        <button className="connect-btn" onClick={() => fileInput.current.click()}>
          Upload activities.csv
        </button>
        <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={handleFileChange} hidden />
        <button className="secondary-btn" onClick={onDemo}>
          Try with sample data
        </button>
      </div>

      {error && <p className="landing-error">{error}</p>}

      <details className="export-steps">
        <summary>How do I get my activities.csv?</summary>
        <ol>
          <li>On strava.com, go to <strong>Settings → My Account</strong>.</li>
          <li>Under <strong>Download or Delete Your Account</strong>, click <strong>Get Started</strong>, then <strong>Request Your Archive</strong>.</li>
          <li>Strava emails you a zip file (usually within a few hours).</li>
          <li>Unzip it and upload the <strong>activities.csv</strong> file here.</li>
        </ol>
        <p>Your Strava language must be set to English when you export. Your file is only used to compute your results and is never stored.</p>
      </details>

      {onConnect && (
        <button className="link-btn" onClick={onConnect}>
          Or connect with Strava
        </button>
      )}
    </div>
  );
}

export default UploadPanel;
