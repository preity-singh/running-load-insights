import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea } from 'recharts';

function Dashboard({ data, onBack }) {
  const riskColors = {
    high: '#dc2626',
    moderate: '#d97706',
    optimal: '#16a34a',
    reduced_conditioning: '#6366f1',
  };

  const riskLabels = {
    high: 'High Risk',
    moderate: 'Moderate Risk',
    optimal: 'Optimal',
    reduced_conditioning: 'Reduced Conditioning',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-header">{point.week}</div>
        <div className="chart-tooltip-stats">ACWR: {point.acwr} — {point.risk}</div>
        <div className="chart-tooltip-detail">{point.acute_miles}mi this week / {point.chronic_avg_miles}mi avg</div>
        {point.runs && point.runs.length > 0 && (
          <div className="chart-tooltip-runs">
            Runs: {point.runs.map(r => `${r.date} (${r.miles}mi)`).join(', ')}
          </div>
        )}
        {point.note && <div className="chart-tooltip-note">{point.note}</div>}
      </div>
    );
  };

  const [acwrOpen, setAcwrOpen] = useState(false);

  return (
    <div className="dashboard">
      <button className="back-btn" onClick={onBack}>
        &larr; Back
      </button>
      <h1 className="dashboard-headline" style={{ color: riskColors[data.risk_level] }}>
        {riskLabels[data.risk_level] || data.risk_level}
      </h1>

      <div className="acwr-info">
        <button className="acwr-info-toggle" onClick={() => setAcwrOpen(!acwrOpen)}>
          <span className="acwr-info-icon">i</span> What is ACWR?
        </button>
        {acwrOpen && (
          <p className="acwr-info-body">
            ACWR (Acute:Chronic Workload Ratio) compares your current week's mileage to a weighted average of your recent weeks, where newer weeks count more than older ones (a method called EWMA, or Exponentially Weighted Moving Average). This reflects how fitness actually works — it builds up gradually and fades slowly, not all at once. A spike relative to your recent baseline flags injury risk.{' '}
            <a href="https://www.scienceforsport.com/acutechronic-workload-ratio/" target="_blank" rel="noopener noreferrer">Learn more</a>
          </p>
        )}
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-value">{data.high_risk_weeks}</span>
          <span className="stat-label">High risk weeks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{data.moderate_risk_weeks}</span>
          <span className="stat-label">Moderate risk weeks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{data.peak_acwr}</span>
          <span className="stat-label">Peak ACWR ({data.peak_week})</span>
        </div>
      </div>

      <div className="chart-scroll-wrapper">
        <div className="chart-container" style={{ minWidth: data.timeline.length > 20 ? data.timeline.length * 45 : undefined }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <ReferenceArea y1={0.8} y2={1.3} fill="#16a34a" fillOpacity={0.08} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text)' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0.8} stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'Reduced conditioning (0.8)', position: 'insideTopLeft', fill: '#6366f1', fontSize: 10 }} />
              <ReferenceLine y={1.3} stroke="#d97706" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'Moderate risk (1.3)', position: 'insideTopLeft', fill: '#d97706', fontSize: 10 }} />
              <ReferenceLine y={1.5} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: 'High risk (1.5)', position: 'insideTopLeft', fill: '#dc2626', fontSize: 10 }} />
              <Line type="monotone" dataKey="acwr" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--accent)' }} activeDot={{ r: 8, fill: 'var(--accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="coaching-note">
        <h3>Coaching Note</h3>
        <p>{data.coaching_note}</p>
      </div>
    </div>
  );
}

export default Dashboard;
