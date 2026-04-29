import { useState, useCallback, useRef, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter
} from "recharts";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */
const T = {
  bg0: '#05080f',
  bg1: '#090d18',
  bg2: '#0d1424',
  bg3: '#111b30',
  border: '#1a2844',
  borderHi: '#00cfff',
  cyan: '#00cfff',
  cyanDim: '#00cfff33',
  purple: '#8b5cf6',
  purpleDim: '#8b5cf622',
  green: '#00e676',
  greenDim: '#00e67622',
  amber: '#ffab00',
  amberDim: '#ffab0022',
  red: '#ff3d57',
  redDim: '#ff3d5722',
  text: '#c8d8ea',
  textMid: '#6a8aaa',
  textDim: '#2a4060',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg0}; font-family: 'Rajdhani', sans-serif; color: ${T.text}; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${T.bg1}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.cyan}; }
  .glow-cyan { box-shadow: 0 0 20px ${T.cyanDim}, 0 0 40px ${T.cyanDim}; }
  .glow-text { text-shadow: 0 0 20px ${T.cyan}88; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .fade-in { animation: fadeIn 0.3s ease forwards; }
`;

/* ─────────────────────────────────────────────────────────────
   MOCK SAP DATA
───────────────────────────────────────────────────────────── */
const genSeries = (base, variance, n = 12) =>
  Array.from({ length: n }, (_, i) => ({
    x: i,
    v: +(base + (Math.random() - 0.5) * variance * 2).toFixed(2),
  }));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mk = (base, variance) =>
  MONTHS.map((m, i) => ({
    month: m,
    actual: +(base + (Math.sin(i * 0.5) * variance + (Math.random() - 0.5) * variance)).toFixed(1),
    target: +base.toFixed(1),
    prev: +(base * 1.1 + (Math.random() - 0.5) * variance).toFixed(1),
  }));

const DASHBOARDS = [
  { id: 1,  title: 'Order-to-Cash Cycle',        unit: 'days',  kpi: '7.4',  target: '7.0',  trend: -8.2,  status: 'warning',  cat: 'Sales',       data: mk(7.4, 1.2),   type: 'line',  desc: 'Avg cycle time: sales order → payment receipt' },
  { id: 2,  title: 'Purchase-to-Pay Cycle',       unit: 'days',  kpi: '22.1', target: '21.0', trend: +4.3,  status: 'critical', cat: 'Procurement', data: mk(22, 2.5),    type: 'line',  desc: 'Avg cycle time: purchase req → vendor payment' },
  { id: 3,  title: 'Inventory Turnover',          unit: 'x',     kpi: '6.8',  target: '7.5',  trend: -9.3,  status: 'critical', cat: 'Logistics',   data: mk(6.8, 0.8),   type: 'bar',   desc: 'Ratio of COGS to avg inventory value' },
  { id: 4,  title: 'Days Sales Outstanding',      unit: 'days',  kpi: '38.2', target: '35.0', trend: +9.1,  status: 'warning',  cat: 'Finance',     data: mk(38, 3),      type: 'area',  desc: 'Avg collection period for receivables' },
  { id: 5,  title: 'Days Payable Outstanding',    unit: 'days',  kpi: '42.7', target: '45.0', trend: -5.1,  status: 'good',     cat: 'Finance',     data: mk(42, 2.5),    type: 'line',  desc: 'Avg time to pay supplier invoices' },
  { id: 6,  title: 'Days Inventory Outstanding',  unit: 'days',  kpi: '54.1', target: '50.0', trend: +8.2,  status: 'warning',  cat: 'Logistics',   data: mk(54, 4),      type: 'bar',   desc: 'Avg days inventory held before sale' },
  { id: 7,  title: 'Cash Conversion Cycle',       unit: 'days',  kpi: '49.6', target: '40.0', trend: +24.0, status: 'critical', cat: 'Finance',     data: mk(49, 5),      type: 'area',  desc: 'DSO + DIO - DPO (working capital efficiency)' },
  { id: 8,  title: 'OTIF Delivery Rate',          unit: '%',     kpi: '87.3', target: '95.0', trend: -8.1,  status: 'critical', cat: 'Logistics',   data: mk(87, 4),      type: 'line',  desc: 'Orders delivered On-Time In-Full' },
  { id: 9,  title: 'Revenue vs Budget',           unit: 'M€',    kpi: '142.8',target: '150.0',trend: -4.8,  status: 'warning',  cat: 'Finance',     data: mk(142, 8),     type: 'bar',   desc: 'Actual revenue vs planned budget' },
  { id: 10, title: 'Cost Center Variance',        unit: '%',     kpi: '3.2',  target: '2.0',  trend: +60.0, status: 'critical', cat: 'Finance',     data: mk(3.2, 0.8),   type: 'line',  desc: 'Budget variance across all cost centers' },
  { id: 11, title: 'Vendor On-Time Delivery',     unit: '%',     kpi: '91.4', target: '95.0', trend: -3.8,  status: 'warning',  cat: 'Procurement', data: mk(91, 3),      type: 'bar',   desc: 'Supplier deliveries meeting confirmed date' },
  { id: 12, title: 'Customer Backorder Rate',     unit: '%',     kpi: '4.2',  target: '2.0',  trend: +110,  status: 'critical', cat: 'Sales',       data: mk(4.2, 1),     type: 'area',  desc: 'Orders unfulfilled due to stock shortage' },
  { id: 13, title: 'Plant Capacity Utilization',  unit: '%',     kpi: '78.4', target: '85.0', trend: -7.8,  status: 'warning',  cat: 'Production',  data: mk(78, 5),      type: 'line',  desc: 'Actual vs theoretical plant capacity used' },
  { id: 14, title: 'First Pass Quality Rate',     unit: '%',     kpi: '96.2', target: '98.5', trend: -2.3,  status: 'warning',  cat: 'Quality',     data: mk(96, 1.5),    type: 'line',  desc: 'Products passing QC without rework' },
  { id: 15, title: 'GR-to-Invoice Match Rate',    unit: '%',     kpi: '82.1', target: '95.0', trend: -13.6, status: 'critical', cat: 'Procurement', data: mk(82, 4),      type: 'bar',   desc: 'Goods receipts automatically matched to invoice' },
  { id: 16, title: 'Material Consumption vs Plan',unit: '%',     kpi: '108.2',target: '100.0',trend: +8.2,  status: 'warning',  cat: 'Production',  data: mk(108, 5),     type: 'area',  desc: 'Actual material usage vs production plan' },
  { id: 17, title: 'AR Aging (>60 days)',         unit: 'M€',    kpi: '18.4', target: '10.0', trend: +84.0, status: 'critical', cat: 'Finance',     data: mk(18, 3),      type: 'bar',   desc: 'Accounts receivable overdue beyond 60 days' },
  { id: 18, title: 'AP Aging (>30 days)',         unit: 'M€',    kpi: '12.1', target: '8.0',  trend: +51.3, status: 'warning',  cat: 'Finance',     data: mk(12, 2),      type: 'line',  desc: 'Accounts payable aging beyond 30 days' },
  { id: 19, title: 'Working Capital Ratio',       unit: 'x',     kpi: '1.42', target: '1.80', trend: -21.1, status: 'critical', cat: 'Finance',     data: mk(1.42, 0.15), type: 'area',  desc: 'Current assets / current liabilities ratio' },
];

/* Process mining mock data */
const PM_NODES = {
  p2p: [
    { id: 'start', label: 'Start', x: 60, y: 200, type: 'event', count: 1820 },
    { id: 'pr', label: 'Create PR', x: 200, y: 200, type: 'activity', count: 1820, time: '0.5d' },
    { id: 'po', label: 'Create PO', x: 360, y: 200, type: 'activity', count: 1720, time: '2.1d' },
    { id: 'gr', label: 'Goods Receipt', x: 520, y: 130, type: 'activity', count: 1680, time: '8.4d' },
    { id: 'inv', label: 'Invoice Receipt', x: 520, y: 270, type: 'activity', count: 1650, time: '12.1d' },
    { id: 'match', label: '3-Way Match', x: 680, y: 200, type: 'activity', count: 1520, time: '14.2d' },
    { id: 'pay', label: 'Payment', x: 840, y: 200, type: 'activity', count: 1490, time: '22.1d' },
    { id: 'end', label: 'End', x: 960, y: 200, type: 'event', count: 1490 },
  ],
  edges: [
    { from: 'start', to: 'pr',    freq: 1820, label: '1820' },
    { from: 'pr',    to: 'po',    freq: 1720, label: '1720' },
    { from: 'po',    to: 'gr',    freq: 1680, label: '1680' },
    { from: 'po',    to: 'inv',   freq: 1650, label: '1650' },
    { from: 'gr',    to: 'match', freq: 1520, label: '1520' },
    { from: 'inv',   to: 'match', freq: 1520, label: '1520' },
    { from: 'match', to: 'pay',   freq: 1490, label: '1490' },
    { from: 'pay',   to: 'end',   freq: 1490, label: '1490' },
    { from: 'po',    to: 'pr',    freq: 120,  label: '120 ↩', dashed: true },
    { from: 'inv',   to: 'gr',    freq: 80,   label: '80 ↩', dashed: true },
  ],
};

/* ─────────────────────────────────────────────────────────────
   UTILITY COMPONENTS
───────────────────────────────────────────────────────────── */
const StatusDot = ({ status }) => {
  const colors = { good: T.green, warning: T.amber, critical: T.red };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: colors[status], boxShadow: `0 0 6px ${colors[status]}`,
      animation: status === 'critical' ? 'pulse 1.5s ease infinite' : 'none',
    }} />
  );
};

const Badge = ({ color = T.cyan, children }) => (
  <span style={{
    padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600,
    background: color + '22', color, border: `1px solid ${color}44`,
    fontFamily: 'JetBrains Mono', letterSpacing: '0.05em',
  }}>{children}</span>
);

const Chip = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '4px 12px', borderRadius: 3, fontSize: 12, fontWeight: 500,
    background: active ? T.cyan + '22' : 'transparent',
    color: active ? T.cyan : T.textMid,
    border: `1px solid ${active ? T.cyan + '66' : T.border}`,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'Rajdhani',
  }}>{children}</button>
);

const Spinner = () => (
  <div style={{
    width: 20, height: 20, border: `2px solid ${T.border}`,
    borderTopColor: T.cyan, borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', display: 'inline-block',
  }} />
);

const SectionHeader = ({ title, subtitle, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
    <div>
      <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: '0.05em' }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 13, color: T.textMid, marginTop: 4 }}>{subtitle}</div>}
    </div>
    {right}
  </div>
);

const Card = ({ children, style = {}, glow = false }) => (
  <div style={{
    background: T.bg2, border: `1px solid ${glow ? T.borderHi : T.border}`,
    borderRadius: 6, padding: 20,
    boxShadow: glow ? `0 0 20px ${T.cyanDim}, inset 0 1px 0 ${T.cyan}22` : 'none',
    transition: 'all 0.2s', ...style,
  }}>
    {children}
  </div>
);

/* Custom tooltip */
const CustomTT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, padding: '8px 12px' }}>
      <div style={{ color: T.textMid, fontSize: 11, fontFamily: 'JetBrains Mono', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 12, fontFamily: 'JetBrains Mono' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* Mini sparkline */
const Sparkline = ({ data, color = T.cyan, type = 'line' }) => (
  <ResponsiveContainer width="100%" height={50}>
    {type === 'bar'
      ? <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Bar dataKey="actual" fill={color} opacity={0.8} />
        </BarChart>
      : <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`g-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="actual" stroke={color} strokeWidth={1.5}
            fill={`url(#g-${color.replace('#', '')})`} dot={false} />
        </AreaChart>
    }
  </ResponsiveContainer>
);

/* ─────────────────────────────────────────────────────────────
   NL QUERY TAB
───────────────────────────────────────────────────────────── */
const EXAMPLE_QUERIES = [
  "Show revenue by top 10 customers for Q1 2025 in SAP S/4HANA",
  "What is the P2P cycle time variance across plants DE01, US02, IN03?",
  "Compare OTIF performance by vendor for last 6 months",
  "Identify overdue AR invoices > 90 days and aging breakdown",
  "Root cause analysis for OTC cycle time increase in March 2025",
];

const CHART_COLORS = [T.cyan, T.purple, T.green, T.amber, T.red, '#00bcd4', '#e040fb'];

function NLQueryTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedSource, setSelectedSource] = useState('SAP S/4HANA');
  const textRef = useRef();

  const runQuery = useCallback(async (q) => {
    const qText = q || query;
    if (!qText.trim()) return;
    setLoading(true);
    setResult(null);

    const systemPrompt = `You are an expert SAP data analyst for the PrimeConSemLayer platform. 
You interface with SAP ECC and SAP S/4HANA systems.
When given a natural language query, respond with a JSON object (no markdown fences) with these fields:
{
  "summary": "2-3 sentence natural language answer",
  "insight": "One key business insight",
  "recommendation": "One actionable recommendation",
  "chartType": "bar|line|area|pie|scatter",
  "chartTitle": "Chart title",
  "chartData": [{"name":"label","value":number,"secondary":number},...], (6-10 points)
  "metrics": [{"label":"KPI name","value":"formatted value","trend":"+/-X%","status":"good|warning|critical"},...] (3-5 KPIs)
}
Always return valid JSON only. Generate realistic SAP ERP data that matches the query context.`;

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `SAP Data Source: ${selectedSource}\nQuery: ${qText}` }],
        }),
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || '{}';
      let parsed;
      try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); }
      catch { parsed = { summary: text, chartData: [], metrics: [] }; }
      setResult(parsed);
      setHistory(h => [{ query: qText, ts: new Date().toLocaleTimeString(), result: parsed }, ...h.slice(0, 4)]);
    } catch (e) {
      setResult({ summary: 'Error connecting to SAP data layer. Please retry.', chartData: [], metrics: [] });
    }
    setLoading(false);
    setQuery('');
  }, [query, selectedSource]);

  const statusColor = { good: T.green, warning: T.amber, critical: T.red };

  const renderChart = (r) => {
    const data = r.chartData || [];
    const common = { data, margin: { top: 10, right: 20, bottom: 20, left: 0 } };
    if (r.chartType === 'pie') return (
      <PieChart><Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
        {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
      </Pie><Tooltip /></PieChart>
    );
    if (r.chartType === 'bar') return (
      <BarChart {...common}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
        <XAxis dataKey="name" tick={{ fill: T.textMid, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
        <YAxis tick={{ fill: T.textMid, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
        <Tooltip content={<CustomTT />} />
        <Bar dataKey="value" fill={T.cyan} opacity={0.85} radius={[2,2,0,0]} />
        {data[0]?.secondary !== undefined && <Bar dataKey="secondary" fill={T.purple} opacity={0.85} radius={[2,2,0,0]} />}
      </BarChart>
    );
    if (r.chartType === 'area') return (
      <AreaChart {...common}><defs>
        <linearGradient id="ga1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={T.cyan} stopOpacity={0.3}/><stop offset="95%" stopColor={T.cyan} stopOpacity={0}/>
        </linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
        <XAxis dataKey="name" tick={{ fill: T.textMid, fontSize: 11 }} />
        <YAxis tick={{ fill: T.textMid, fontSize: 11 }} />
        <Tooltip content={<CustomTT />} />
        <Area type="monotone" dataKey="value" stroke={T.cyan} fill="url(#ga1)" strokeWidth={2} dot={{ fill: T.cyan, r: 3 }} />
      </AreaChart>
    );
    return (
      <LineChart {...common}><CartesianGrid strokeDasharray="3 3" stroke={T.border} />
        <XAxis dataKey="name" tick={{ fill: T.textMid, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
        <YAxis tick={{ fill: T.textMid, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
        <Tooltip content={<CustomTT />} />
        <Line type="monotone" dataKey="value" stroke={T.cyan} strokeWidth={2} dot={{ fill: T.cyan, r: 3 }} />
        {data[0]?.secondary !== undefined && <Line type="monotone" dataKey="secondary" stroke={T.purple} strokeWidth={2} dot={{ fill: T.purple, r: 3 }} />}
      </LineChart>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionHeader title="NATURAL LANGUAGE QUERY" subtitle="Query SAP ECC / S/4HANA in plain English" />

        {/* Source selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['SAP S/4HANA', 'SAP ECC', 'Both'].map(s => (
            <Chip key={s} active={selectedSource === s} onClick={() => setSelectedSource(s)}>{s}</Chip>
          ))}
        </div>

        {/* Query input */}
        <Card glow={loading}>
          <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 8 }}>
            QUERY INPUT / {selectedSource.toUpperCase()}
          </div>
          <textarea
            ref={textRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) runQuery(); }}
            placeholder="Ask anything about your SAP data..."
            style={{
              width: '100%', minHeight: 80, background: T.bg1, border: `1px solid ${T.border}`,
              color: T.text, padding: '10px 14px', borderRadius: 4, resize: 'vertical',
              fontFamily: 'Rajdhani', fontSize: 15, outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = T.cyan}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'JetBrains Mono' }}>Ctrl+Enter to run</span>
            <button
              onClick={() => runQuery()}
              disabled={loading || !query.trim()}
              style={{
                padding: '8px 24px', background: loading ? T.bg3 : T.cyan + '22',
                color: T.cyan, border: `1px solid ${T.cyan}66`, borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Orbitron',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
              }}
            >
              {loading ? <><Spinner /> PROCESSING...</> : '▶ RUN QUERY'}
            </button>
          </div>
        </Card>

        {/* Example queries */}
        <div>
          <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 8 }}>
            EXAMPLE QUERIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {EXAMPLE_QUERIES.map((q, i) => (
              <button key={i} onClick={() => { setQuery(q); runQuery(q); }}
                style={{
                  textAlign: 'left', padding: '8px 12px', background: 'transparent',
                  border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMid,
                  cursor: 'pointer', fontSize: 13, fontFamily: 'Rajdhani',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.borderColor = T.cyan + '66'; e.target.style.color = T.text; }}
                onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.textMid; }}
              >
                <span style={{ color: T.cyan, fontFamily: 'JetBrains Mono', marginRight: 8 }}>›</span>{q}
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 8 }}>QUERY HISTORY</div>
            {history.map((h, i) => (
              <div key={i} onClick={() => setResult(h.result)}
                style={{ padding: '6px 10px', borderLeft: `2px solid ${T.border}`, marginBottom: 4,
                  cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderLeftColor = T.cyan}
                onMouseLeave={e => e.currentTarget.style.borderLeftColor = T.border}
              >
                <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'JetBrains Mono' }}>{h.ts}</span>
                <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{h.query.slice(0, 60)}...</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel - results */}
      <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!result && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: T.textDim, gap: 16 }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>⬡</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 13, letterSpacing: '0.2em' }}>AWAITING QUERY</div>
            <div style={{ fontSize: 12, color: T.textDim }}>Enter a natural language question about your SAP data</div>
          </div>
        )}

        {loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <Spinner />
            <div style={{ fontFamily: 'Orbitron', fontSize: 12, color: T.cyan, letterSpacing: '0.2em', animation: 'pulse 1.5s ease infinite' }}>
              QUERYING SAP DATA LAYER...
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPI metrics row */}
            {result.metrics?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(result.metrics.length, 4)}, 1fr)`, gap: 10 }}>
                {result.metrics.map((m, i) => (
                  <Card key={i} style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontFamily: 'Orbitron', fontWeight: 700, color: statusColor[m.status] || T.cyan }}>
                      {m.value}
                    </div>
                    <div style={{ fontSize: 12, color: m.trend?.startsWith('+') ? T.red : T.green, marginTop: 2 }}>{m.trend}</div>
                  </Card>
                ))}
              </div>
            )}

            {/* Chart */}
            {result.chartData?.length > 0 && (
              <Card>
                <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 12 }}>
                  {result.chartTitle?.toUpperCase() || 'QUERY RESULT'}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  {renderChart(result)}
                </ResponsiveContainer>
              </Card>
            )}

            {/* Text response */}
            <Card>
              <div style={{ fontSize: 11, color: T.cyan, fontFamily: 'JetBrains Mono', marginBottom: 10 }}>AI ANALYSIS</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: T.text }}>{result.summary}</p>
              {result.insight && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: T.cyanDim, borderLeft: `3px solid ${T.cyan}`, borderRadius: '0 4px 4px 0' }}>
                  <div style={{ fontSize: 10, color: T.cyan, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>KEY INSIGHT</div>
                  <div style={{ fontSize: 13, color: T.text }}>{result.insight}</div>
                </div>
              )}
              {result.recommendation && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: T.greenDim, borderLeft: `3px solid ${T.green}`, borderRadius: '0 4px 4px 0' }}>
                  <div style={{ fontSize: 10, color: T.green, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>RECOMMENDATION</div>
                  <div style={{ fontSize: 13, color: T.text }}>{result.recommendation}</div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PROCESS MINING TAB
───────────────────────────────────────────────────────────── */
function ProcessMiningTab() {
  const [selectedProcess, setSelectedProcess] = useState('p2p');
  const [selectedNode, setSelectedNode] = useState(null);
  const [filter, setFilter] = useState('all');
  const svgRef = useRef();

  const nodes = PM_NODES.p2p;
  const edges = PM_NODES.edges;

  // Compute path between two nodes
  const getEdgePath = (fromNode, toNode, dashed) => {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const curved = Math.abs(dy) > 20;
    if (curved) {
      const mx = (fromNode.x + toNode.x) / 2;
      return `M${fromNode.x + 64},${fromNode.y} C${mx},${fromNode.y} ${mx},${toNode.y} ${toNode.x - 10},${toNode.y}`;
    }
    return `M${fromNode.x + 64},${fromNode.y} L${toNode.x - 10},${toNode.y}`;
  };

  const getNode = id => nodes.find(n => n.id === id);

  const maxFreq = Math.max(...edges.map(e => e.freq));
  const edgeColor = freq => {
    const t = freq / maxFreq;
    if (t > 0.8) return T.cyan;
    if (t > 0.5) return T.purple;
    return T.textMid;
  };

  const pmStats = [
    { label: 'Total Cases', value: '1,820', sub: 'Process instances' },
    { label: 'Completed', value: '1,490', sub: '81.9% completion rate' },
    { label: 'Avg Duration', value: '22.1d', sub: 'Median: 18.4 days' },
    { label: 'Variants', value: '47', sub: '3 cover 82% of cases' },
    { label: 'Conformance', value: '73.2%', sub: '26.8% deviant cases' },
    { label: 'Bottleneck', value: '3-Way Match', sub: 'Avg wait: 4.2 days' },
  ];

  const variants = [
    { id: 1, label: 'PR → PO → GR → INV → MATCH → PAY', freq: 892, pct: 49, status: 'good' },
    { id: 2, label: 'PR → PO → INV → GR → MATCH → PAY', freq: 401, pct: 22, status: 'warning' },
    { id: 3, label: 'PR → PO → GR → MATCH → PAY (no invoice)', freq: 204, pct: 11, status: 'critical' },
    { id: 4, label: 'PR → PO → PR → PO → GR → ... (rework)', freq: 120, pct: 7, status: 'critical' },
    { id: 5, label: 'Other variants (43 variants)', freq: 203, pct: 11, status: 'warning' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        title="PROCESS MINING"
        subtitle="Discover, monitor and improve SAP business processes"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip active={selectedProcess === 'p2p'} onClick={() => setSelectedProcess('p2p')}>Purchase-to-Pay</Chip>
            <Chip active={selectedProcess === 'otc'} onClick={() => setSelectedProcess('otc')}>Order-to-Cash</Chip>
          </div>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {pmStats.map((s, i) => (
          <Card key={i} style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 18, fontFamily: 'Orbitron', fontWeight: 700, color: T.cyan }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.text, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Process Graph */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono' }}>
            DIRECTLY-FOLLOWS GRAPH (DFG) / PURCHASE-TO-PAY
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono' }}>
            <span style={{ color: T.cyan }}>━</span> High frequency
            <span style={{ color: T.purple }}>━</span> Medium
            <span style={{ color: T.textMid }}>━</span> Low
            <span style={{ color: T.red }}>- -</span> Rework
          </div>
        </div>
        <div style={{ overflowX: 'auto', padding: '20px 10px' }}>
          <svg width="1050" height="400" viewBox="0 0 1050 400" style={{ display: 'block' }}>
            <defs>
              <marker id="arrow-cyan" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0,8 3,0 6" fill={T.cyan} />
              </marker>
              <marker id="arrow-purple" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0,8 3,0 6" fill={T.purple} />
              </marker>
              <marker id="arrow-mid" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0,8 3,0 6" fill={T.textMid} />
              </marker>
              <marker id="arrow-red" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0,8 3,0 6" fill={T.red} />
              </marker>
              <filter id="nodeGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>

            {/* Edges */}
            {edges.map((e, i) => {
              const from = getNode(e.from), to = getNode(e.to);
              if (!from || !to) return null;
              const path = getEdgePath(from, to, e.dashed);
              const t = e.freq / maxFreq;
              const color = e.dashed ? T.red : t > 0.8 ? T.cyan : t > 0.5 ? T.purple : T.textMid;
              const markerId = e.dashed ? 'arrow-red' : t > 0.8 ? 'arrow-cyan' : t > 0.5 ? 'arrow-purple' : 'arrow-mid';
              const midX = (from.x + to.x) / 2 + 32;
              const midY = (from.y + to.y) / 2;
              return (
                <g key={i}>
                  <path d={path} stroke={color} strokeWidth={e.dashed ? 1.5 : Math.max(1.5, t * 3)}
                    fill="none" strokeDasharray={e.dashed ? '6 3' : 'none'}
                    markerEnd={`url(#${markerId})`} opacity={0.8} />
                  <text x={midX} y={midY - 6} fill={color} fontSize={9} textAnchor="middle"
                    fontFamily="JetBrains Mono" opacity={0.7}>{e.label}</text>
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const isEvent = n.type === 'event';
              const isSelected = selectedNode === n.id;
              const w = isEvent ? 30 : 120;
              const h = isEvent ? 30 : 52;
              const nx = n.x - (isEvent ? 15 : 60);
              const ny = n.y - h / 2;
              return (
                <g key={n.id} onClick={() => setSelectedNode(isSelected ? null : n.id)}
                  style={{ cursor: 'pointer' }} filter={isSelected ? 'url(#nodeGlow)' : ''}>
                  {isEvent
                    ? <circle cx={n.x} cy={n.y} r={15}
                        fill={T.bg3} stroke={T.cyan} strokeWidth={2} />
                    : <rect x={nx} y={ny} width={w} height={h} rx={4}
                        fill={isSelected ? T.cyanDim : T.bg3}
                        stroke={isSelected ? T.cyan : T.border} strokeWidth={isSelected ? 2 : 1} />
                  }
                  <text x={n.x} y={n.y + (isEvent ? 5 : -6)} textAnchor="middle"
                    fill={T.text} fontSize={isEvent ? 9 : 11} fontFamily="Rajdhani" fontWeight={600}>
                    {isEvent ? (n.id === 'start' ? '▶' : '■') : n.label}
                  </text>
                  {!isEvent && (
                    <text x={n.x} y={n.y + 10} textAnchor="middle" fill={T.textMid} fontSize={10} fontFamily="JetBrains Mono">
                      ⏱ {n.time}
                    </text>
                  )}
                  {!isEvent && (
                    <text x={n.x} y={n.y + 23} textAnchor="middle" fill={T.cyan} fontSize={9} fontFamily="JetBrains Mono">
                      {n.count.toLocaleString()}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* Bottom panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Process variants */}
        <Card>
          <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 14 }}>
            TOP PROCESS VARIANTS
          </div>
          {variants.map((v, i) => {
            const colors = { good: T.green, warning: T.amber, critical: T.red };
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, color: T.text, flex: 1, marginRight: 10 }}>
                    <StatusDot status={v.status} />
                    <span style={{ marginLeft: 6, fontFamily: 'JetBrains Mono', fontSize: 10 }}>V{v.id}</span>
                    <span style={{ marginLeft: 6 }}>{v.label}</span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: T.textMid, flexShrink: 0 }}>
                    {v.freq} ({v.pct}%)
                  </div>
                </div>
                <div style={{ height: 3, background: T.bg1, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${v.pct}%`, background: colors[v.status], borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* Conformance + bottleneck */}
        <Card>
          <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 14 }}>
            CONFORMANCE CHECKING & BOTTLENECKS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Fitness', value: 73.2, good: '>85' },
              { label: 'Precision', value: 68.4, good: '>80' },
              { label: 'Generalization', value: 81.6, good: '>75' },
              { label: 'Simplicity', value: 77.3, good: '>70' },
            ].map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: T.text }}>{m.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', color: m.value > 75 ? T.green : T.amber }}>
                    {m.value}% <span style={{ color: T.textDim, fontSize: 10 }}>(target: {m.good}%)</span>
                  </span>
                </div>
                <div style={{ height: 4, background: T.bg1, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${m.value}%`,
                    background: m.value > 75 ? T.green : T.amber, borderRadius: 2,
                    transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '10px', background: T.amberDim, border: `1px solid ${T.amber}44`, borderRadius: 4 }}>
              <div style={{ fontSize: 10, color: T.amber, fontFamily: 'JetBrains Mono', marginBottom: 4 }}>⚠ BOTTLENECK DETECTED</div>
              <div style={{ fontSize: 13 }}>3-Way Match activity shows avg wait time of <strong style={{ color: T.amber }}>4.2 days</strong> — accounting for 19% of total cycle time. 330 cases currently pending.</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   19 DASHBOARDS TAB
───────────────────────────────────────────────────────────── */
function DashboardsTab() {
  const [selectedDash, setSelectedDash] = useState(null);
  const [catFilter, setCatFilter] = useState('All');

  const cats = ['All', ...new Set(DASHBOARDS.map(d => d.cat))];
  const filtered = catFilter === 'All' ? DASHBOARDS : DASHBOARDS.filter(d => d.cat === catFilter);
  const statusColor = { good: T.green, warning: T.amber, critical: T.red };

  const dash = selectedDash ? DASHBOARDS.find(d => d.id === selectedDash) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        title="19 KEY SAP DASHBOARDS"
        subtitle="Real-time KPI monitoring across all SAP modules"
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            <Badge color={T.green}>
              {DASHBOARDS.filter(d => d.status === 'good').length} HEALTHY
            </Badge>
            <Badge color={T.amber}>
              {DASHBOARDS.filter(d => d.status === 'warning').length} WARNING
            </Badge>
            <Badge color={T.red}>
              {DASHBOARDS.filter(d => d.status === 'critical').length} CRITICAL
            </Badge>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {cats.map(c => <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>{c}</Chip>)}
      </div>

      {/* Dashboard grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map(d => {
          const col = statusColor[d.status];
          const isSelected = selectedDash === d.id;
          return (
            <div key={d.id} onClick={() => setSelectedDash(isSelected ? null : d.id)}
              style={{
                background: isSelected ? T.bg3 : T.bg2,
                border: `1px solid ${isSelected ? col : T.border}`,
                borderRadius: 6, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: isSelected ? `0 0 16px ${col}33` : 'none',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = T.border + 'aa'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 2 }}>
                    #{String(d.id).padStart(2, '0')} · {d.cat.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{d.title}</div>
                </div>
                <StatusDot status={d.status} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 26, fontFamily: 'Orbitron', fontWeight: 700, color: col, lineHeight: 1 }}>
                    {d.kpi}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMid, fontFamily: 'JetBrains Mono' }}>{d.unit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: d.trend > 0 && d.status !== 'good' ? T.red : T.green }}>
                    {d.trend > 0 ? '▲' : '▼'} {Math.abs(d.trend)}%
                  </div>
                  <div style={{ fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono' }}>vs target {d.target} {d.unit}</div>
                </div>
              </div>

              <Sparkline data={d.data} color={col} type={d.type} />
            </div>
          );
        })}
      </div>

      {/* Expanded dashboard detail */}
      {dash && (
        <Card glow className="fade-in" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 700, color: statusColor[dash.status] }}>
                {dash.title}
              </div>
              <div style={{ fontSize: 13, color: T.textMid, marginTop: 4 }}>{dash.desc}</div>
            </div>
            <button onClick={() => setSelectedDash(null)}
              style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMid, borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>
              ✕ Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={dash.data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textMid, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: T.textMid, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip content={<CustomTT />} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Area type="monotone" dataKey="prev" fill={T.border} stroke={T.textDim} strokeWidth={1} opacity={0.5} name="Prev Year" />
                <Line type="monotone" dataKey="actual" stroke={statusColor[dash.status]} strokeWidth={2.5} dot={{ r: 3, fill: statusColor[dash.status] }} name="Actual" />
                <Line type="monotone" dataKey="target" stroke={T.textMid} strokeDasharray="6 3" strokeWidth={1.5} dot={false} name="Target" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Current', value: `${dash.kpi} ${dash.unit}`, color: statusColor[dash.status] },
                { label: 'Target', value: `${dash.target} ${dash.unit}`, color: T.textMid },
                { label: 'Gap', value: `${Math.abs(+dash.kpi - +dash.target).toFixed(1)} ${dash.unit}`, color: statusColor[dash.status] },
                { label: 'YoY Trend', value: `${dash.trend > 0 ? '+' : ''}${dash.trend}%`, color: dash.trend > 0 ? T.red : T.green },
                { label: 'Status', value: dash.status.toUpperCase(), color: statusColor[dash.status] },
                { label: 'Category', value: dash.cat, color: T.purple },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.textMid }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontFamily: 'Orbitron', fontWeight: 600, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT CAUSE ANALYSIS TAB
───────────────────────────────────────────────────────────── */
function RCATab() {
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rca, setRca] = useState(null);

  const criticalKPIs = DASHBOARDS.filter(d => d.status !== 'good');

  const runRCA = useCallback(async (kpi) => {
    setSelectedKPI(kpi);
    setLoading(true);
    setRca(null);

    const systemPrompt = `You are an expert SAP ERP consultant performing root cause analysis.
Given a KPI that is underperforming, respond ONLY with this JSON structure (no markdown):
{
  "headline": "One sentence root cause summary",
  "primaryCause": "Main root cause",
  "causes": [
    {"level": 1, "id": "C1", "parent": null, "label": "Root Cause 1", "impact": "high|medium|low", "detail": "Explanation"},
    {"level": 2, "id": "C1a", "parent": "C1", "label": "Sub-cause", "impact": "high|medium|low", "detail": "Explanation"},
    {"level": 2, "id": "C1b", "parent": "C1", "label": "Sub-cause 2", "impact": "medium", "detail": "Explanation"},
    {"level": 1, "id": "C2", "parent": null, "label": "Root Cause 2", "impact": "medium", "detail": "Explanation"},
    {"level": 2, "id": "C2a", "parent": "C2", "label": "Sub-cause", "impact": "medium", "detail": "Explanation"},
    {"level": 1, "id": "C3", "parent": null, "label": "Root Cause 3", "impact": "low", "detail": "Explanation"}
  ],
  "actions": [
    {"priority": 1, "action": "Immediate action", "owner": "SAP module", "timeline": "1-2 weeks"},
    {"priority": 2, "action": "Short-term fix", "owner": "Department", "timeline": "1 month"},
    {"priority": 3, "action": "Long-term fix", "owner": "IT/Business", "timeline": "3 months"}
  ],
  "affectedModules": ["MM", "FI", "SD"],
  "estimatedImpact": "Quantified improvement expected"
}`;

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `KPI: ${kpi.title}\nCurrent: ${kpi.kpi} ${kpi.unit}\nTarget: ${kpi.target} ${kpi.unit}\nTrend: ${kpi.trend > 0 ? '+' : ''}${kpi.trend}%\nStatus: ${kpi.status}\nDescription: ${kpi.desc}\nSAP Category: ${kpi.cat}`,
          }],
        }),
      });
      const data = await resp.json();
      const text = data.content?.[0]?.text || '{}';
      let parsed;
      try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); }
      catch { parsed = { headline: text, causes: [], actions: [] }; }
      setRca(parsed);
    } catch (e) {
      setRca({ headline: 'Error performing RCA. Please retry.', causes: [], actions: [] });
    }
    setLoading(false);
  }, []);

  const impactColor = { high: T.red, medium: T.amber, low: T.green };
  const statusColor = { good: T.green, warning: T.amber, critical: T.red };

  const rootCauses = rca?.causes?.filter(c => c.level === 1) || [];
  const subCauses = (parentId) => rca?.causes?.filter(c => c.parent === parentId) || [];

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* KPI selector */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title="ROOT CAUSE ANALYSIS" />
        <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono' }}>
          SELECT UNDERPERFORMING KPI
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          {criticalKPIs.map(k => {
            const col = statusColor[k.status];
            const isActive = selectedKPI?.id === k.id;
            return (
              <button key={k.id} onClick={() => runRCA(k)}
                style={{
                  textAlign: 'left', padding: '10px 12px',
                  background: isActive ? T.bg3 : 'transparent',
                  border: `1px solid ${isActive ? col : T.border}`,
                  borderRadius: 4, cursor: 'pointer',
                  boxShadow: isActive ? `0 0 12px ${col}33` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{k.title}</span>
                  <StatusDot status={k.status} />
                </div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: col }}>
                  {k.kpi} {k.unit} <span style={{ color: T.textDim }}>/ target {k.target}</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMid, marginTop: 2 }}>{k.cat}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RCA Results */}
      <div style={{ flex: 1 }}>
        {!selectedKPI && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: T.textDim, gap: 16 }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>⬡</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 13, letterSpacing: '0.2em' }}>SELECT A KPI</div>
            <div style={{ fontSize: 12 }}>Choose an underperforming KPI to begin root cause analysis</div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16 }}>
            <Spinner />
            <div style={{ fontFamily: 'Orbitron', fontSize: 12, color: T.cyan, letterSpacing: '0.2em', animation: 'pulse 1.5s ease infinite' }}>
              ANALYZING ROOT CAUSES...
            </div>
          </div>
        )}

        {rca && selectedKPI && !loading && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPI summary */}
            <Card style={{ borderColor: statusColor[selectedKPI.status], boxShadow: `0 0 20px ${statusColor[selectedKPI.status]}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 15, fontWeight: 700, color: statusColor[selectedKPI.status] }}>
                    {selectedKPI.title}
                  </div>
                  <div style={{ fontSize: 13, color: T.text, marginTop: 6 }}>{rca.headline}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 700, color: statusColor[selectedKPI.status] }}>
                    {selectedKPI.kpi}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMid, fontFamily: 'JetBrains Mono' }}>{selectedKPI.unit} / target {selectedKPI.target}</div>
                </div>
              </div>
              {rca.affectedModules && (
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: T.textMid }}>Affected modules:</span>
                  {rca.affectedModules.map((m, i) => <Badge key={i} color={T.purple}>{m}</Badge>)}
                </div>
              )}
            </Card>

            {/* Cause tree */}
            <Card>
              <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 16 }}>
                ISHIKAWA ROOT CAUSE TREE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rootCauses.map((cause, i) => (
                  <div key={cause.id}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                      background: T.bg1, borderRadius: 4,
                      borderLeft: `3px solid ${impactColor[cause.impact]}`,
                    }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: impactColor[cause.impact], flexShrink: 0, marginTop: 2 }}>
                        C{i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{cause.label}</div>
                        <div style={{ fontSize: 12, color: T.textMid, marginTop: 3 }}>{cause.detail}</div>
                      </div>
                      <Badge color={impactColor[cause.impact]}>{cause.impact.toUpperCase()} IMPACT</Badge>
                    </div>
                    {/* Sub-causes */}
                    <div style={{ marginLeft: 24, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {subCauses(cause.id).map(sc => (
                        <div key={sc.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px',
                          background: T.bg1, borderRadius: 4, opacity: 0.85,
                          borderLeft: `2px solid ${impactColor[sc.impact]}55`,
                        }}>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim, flexShrink: 0, marginTop: 2 }}>└─</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: T.text }}>{sc.label}</div>
                            <div style={{ fontSize: 11, color: T.textMid }}>{sc.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Action plan */}
            {rca.actions?.length > 0 && (
              <Card>
                <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', marginBottom: 14 }}>
                  RECOMMENDED ACTION PLAN
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rca.actions.map((a, i) => {
                    const colors = [T.red, T.amber, T.cyan];
                    const col = colors[i] || T.cyan;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 14, padding: '12px', background: T.bg1, borderRadius: 4 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: col + '22', border: `2px solid ${col}`, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Orbitron', fontSize: 11, color: col, fontWeight: 700,
                        }}>{a.priority}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{a.action}</div>
                          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: T.textMid }}>Owner: <span style={{ color: T.purple }}>{a.owner}</span></span>
                            <span style={{ fontSize: 11, color: T.textMid }}>Timeline: <span style={{ color: col }}>{a.timeline}</span></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {rca.estimatedImpact && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: T.greenDim, borderLeft: `3px solid ${T.green}`, borderRadius: '0 4px 4px 0' }}>
                    <div style={{ fontSize: 10, color: T.green, fontFamily: 'JetBrains Mono', marginBottom: 3 }}>ESTIMATED IMPACT</div>
                    <div style={{ fontSize: 13, color: T.text }}>{rca.estimatedImpact}</div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'query',     icon: '⬡', label: 'NL Query',        sub: 'AI-powered SAP queries' },
  { id: 'process',   icon: '◈', label: 'Process Mining',   sub: 'pm4py / ProM visualization' },
  { id: 'dashboard', icon: '◉', label: '19 Dashboards',    sub: 'KPI monitoring suite' },
  { id: 'rca',       icon: '◎', label: 'Root Cause AI',    sub: 'Intelligent analysis' },
];

function Sidebar({ active, onNav }) {
  return (
    <div style={{
      width: 220, flexShrink: 0, background: T.bg1,
      borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: T.cyan, letterSpacing: '0.08em', lineHeight: 1.2 }}>
          PRIME<span style={{ color: T.purple }}>CON</span>
        </div>
        <div style={{ fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, color: T.textMid, letterSpacing: '0.15em', marginTop: 2 }}>
          SEMANTIC LAYER
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
          <span style={{ fontSize: 10, color: T.green, fontFamily: 'JetBrains Mono' }}>SAP CONNECTED</span>
        </div>
      </div>

      {/* SAP systems status */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: 'S/4HANA PRD', status: 'green' },
          { label: 'ECC 6.0 EHP8', status: 'green' },
          { label: 'BW/4HANA', status: 'amber' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.status === 'green' ? T.green : T.amber }} />
            <span style={{ fontSize: 10, color: T.textMid, fontFamily: 'JetBrains Mono' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 4,
                background: isActive ? T.cyanDim : 'transparent',
                border: `1px solid ${isActive ? T.cyan + '44' : 'transparent'}`,
                cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.bg3; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: isActive ? T.cyan : T.textMid }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? T.cyan : T.text, fontFamily: 'Rajdhani' }}>
                  {item.label}
                </span>
              </div>
              <div style={{ fontSize: 10, color: T.textDim, marginLeft: 24, fontFamily: 'Rajdhani' }}>{item.sub}</div>
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono' }}>
        <div>v2.4.1 · Claude Sonnet 4</div>
        <div style={{ marginTop: 2 }}>SAP ECC 6.0 + S/4HANA 2023</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HEADER
───────────────────────────────────────────────────────────── */
function Header({ active }) {
  const now = new Date();
  const titles = { query: 'Natural Language SAP Query Engine', process: 'Process Mining & Discovery', dashboard: 'Enterprise KPI Dashboard Suite', rca: 'AI Root Cause Analysis' };
  return (
    <div style={{
      height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', borderBottom: `1px solid ${T.border}`, background: T.bg1, flexShrink: 0,
    }}>
      <div style={{ fontFamily: 'Rajdhani', fontSize: 15, fontWeight: 600, color: T.text }}>{titles[active]}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {[
          { label: 'Model', value: 'Claude Sonnet 4' },
          { label: 'Source', value: 'SAP RFC + OData' },
          { label: 'Refreshed', value: now.toLocaleTimeString() },
        ].map((m, i) => (
          <div key={i} style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: T.textMid }}>
            {m.label}: <span style={{ color: T.cyan }}>{m.value}</span>
          </div>
        ))}
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green, animation: 'pulse 2s ease infinite' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────── */
export default function PrimeConSemLayer() {
  const [activeSection, setActiveSection] = useState('query');

  return (
    <>
      <style>{FONTS}</style>
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg0,
        fontFamily: 'Rajdhani, sans-serif', color: T.text, overflow: 'hidden',
      }}>
        <Header active={activeSection} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Sidebar active={activeSection} onNav={setActiveSection} />
          <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {activeSection === 'query' && <NLQueryTab />}
            {activeSection === 'process' && <ProcessMiningTab />}
            {activeSection === 'dashboard' && <DashboardsTab />}
            {activeSection === 'rca' && <RCATab />}
          </main>
        </div>
      </div>
    </>
  );
}
