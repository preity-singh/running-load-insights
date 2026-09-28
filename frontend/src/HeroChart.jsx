// Stylized ACWR line for the home page: steady weeks in the optimal band, then a mileage spike
const WEEKS = [0.86, 0.97, 1.06, 0.99, 1.1, 1.16, 1.04, 1.62, 1.14, 1.0];
const SPIKE = 7;

const WIDTH = 520;
const HEIGHT = 360;
const PLOT_LEFT = 12;
const PLOT_RIGHT = 430;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 340;
const MIN_ACWR = 0.6;
const MAX_ACWR = 1.75;

const x = (i) => PLOT_LEFT + (i / (WEEKS.length - 1)) * (PLOT_RIGHT - PLOT_LEFT);
const y = (acwr) => PLOT_TOP + ((MAX_ACWR - acwr) / (MAX_ACWR - MIN_ACWR)) * (PLOT_BOTTOM - PLOT_TOP);

// Smooth curve through the points (Catmull-Rom converted to cubic Bezier)
function smoothPath(points) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const ZONE_LINES = [
  { acwr: 1.5, label: 'High risk', color: '#dc2626' },
  { acwr: 1.3, label: 'Moderate', color: '#d97706' },
  { acwr: 0.8, label: 'Reduced', color: '#6366f1' },
];

function HeroChart() {
  const points = WEEKS.map((acwr, i) => [x(i), y(acwr)]);
  const [spikeX, spikeY] = points[SPIKE];

  return (
    <svg
      className="hero-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Example training load line that stays in the optimal zone for several weeks, then spikes into the high risk zone"
    >
      <rect x={PLOT_LEFT} y={y(1.3)} width={PLOT_RIGHT - PLOT_LEFT} height={y(0.8) - y(1.3)} className="hero-chart-band" />
      <text x={PLOT_RIGHT + 14} y={(y(1.3) + y(0.8)) / 2 + 5} className="hero-chart-label" fill="#16a34a">Optimal</text>

      {ZONE_LINES.map((zone) => (
        <g key={zone.label}>
          <line x1={PLOT_LEFT} x2={PLOT_RIGHT} y1={y(zone.acwr)} y2={y(zone.acwr)} stroke={zone.color} strokeWidth="1.5" strokeDasharray="5 6" />
          <text x={PLOT_RIGHT + 14} y={y(zone.acwr) + 5} className="hero-chart-label" fill={zone.color}>{zone.label}</text>
        </g>
      ))}

      <path d={smoothPath(points)} pathLength="1" className="hero-chart-line" />

      <g className="hero-chart-spike">
        <circle cx={spikeX} cy={spikeY} r="14" fill="#dc2626" opacity="0.15" />
        <circle cx={spikeX} cy={spikeY} r="6.5" fill="#dc2626" />
        <text x={spikeX - 14} y={spikeY - 4} textAnchor="end" className="hero-chart-callout">Mileage spike</text>
      </g>
    </svg>
  );
}

export default HeroChart;
