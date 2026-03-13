// ─── NetherOps OpptyCon — Data Ingestion Page ───
// CSV upload, Google Sheets connection, manual entry, actuals history.
// Built against adapters.js + actuals.js interfaces.

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Link2, Edit3, Trash2, Download, ChevronRight, Check, AlertTriangle, X, Database, Zap } from 'lucide-react';
import { parseCSV, guessColumnMapping, csvAdapter, sheetsAdapter, manualAdapter, MANUAL_FIELDS } from './adapters';
import { actualsStore, adapterConfigStore } from './actuals';

// ─── TOKENS (match App.jsx) ───
const C = {
  bg:"#EBEBEB", bgAlt:"#F4F4F2", card:"#FFFFFF",
  border:"rgba(0,0,0,0.13)", borderL:"rgba(0,0,0,0.07)",
  accent:"#111111", accentD:"rgba(0,0,0,0.06)",
  lime:"#C8FF6E", limeD:"rgba(200,255,110,0.15)",
  green:"#2E7D32", greenD:"rgba(46,125,50,0.10)",
  amber:"#E89F0C", amberD:"rgba(232,159,12,0.10)",
  rose:"#D44C38", roseD:"rgba(212,76,56,0.10)",
  violet:"#6D28D9", violetD:"rgba(109,40,217,0.10)",
  blue:"#2563EB", blueD:"rgba(37,99,235,0.10)",
  text:"#111111", muted:"#555555", dim:"#909090",
  inv:"#F5F5F3", invMid:"#AAAAAA", code:"#C8FF6E",
  ch:["#111111","#2E7D32","#2563EB","#6D28D9","#E89F0C","#D44C38","#C8FF6E","#0891B2"],
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt = (n) => {
  if (n == null || isNaN(n)) return '—';
  const a = Math.abs(n); const s = n < 0 ? '-' : '';
  if (a >= 1e6) return `${s}$${(a/1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${s}$${(a/1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
};

const fN = (n) => n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString();

// All available target fields for column mapping
const ALL_FIELDS = [
  { value: '', label: '— Skip —' },
  { value: 'period.month', label: 'Period: Month' },
  { value: 'period.year', label: 'Period: Year' },
  { value: 'funnel.inquiries', label: 'Funnel: Inquiries' },
  { value: 'funnel.mqls', label: 'Funnel: MQLs' },
  { value: 'funnel.sqls', label: 'Funnel: SQLs' },
  { value: 'funnel.meetingsHeld', label: 'Funnel: Meetings Held' },
  { value: 'funnel.sqosCreated', label: 'Funnel: SQOs Created' },
  { value: 'funnel.dealsWon', label: 'Funnel: Deals Won' },
  { value: 'funnel.dealsLost', label: 'Funnel: Deals Lost' },
  { value: 'pipeline.total.value', label: 'Pipeline: Total ($)' },
  { value: 'pipeline.total.count', label: 'Pipeline: Total (count)' },
  { value: 'pipeline.stage1.value', label: 'Pipeline: Stage 1 ($)' },
  { value: 'pipeline.stage2.value', label: 'Pipeline: Stage 2 ($)' },
  { value: 'revenue.newLogoARR', label: 'Revenue: New Logo ARR' },
  { value: 'revenue.expansionARR', label: 'Revenue: Expansion ARR' },
  { value: 'revenue.churnedARR', label: 'Revenue: Churned ARR' },
  { value: 'revenue.currentARR', label: 'Revenue: Current ARR' },
  { value: 'capacity.activeAEs', label: 'Capacity: Active AEs' },
  { value: 'capacity.avgDealSize', label: 'Capacity: Avg Deal Size' },
  { value: 'capacity.avgCycleDays', label: 'Capacity: Avg Cycle Days' },
  { value: 'capacity.winRate', label: 'Capacity: Win Rate' },
  { value: 'spend.totalMarketing', label: 'Spend: Marketing Total' },
  { value: 'spend.totalSales', label: 'Spend: Sales Total' },
  { value: 'spend.totalSAndM', label: 'Spend: S&M Total' },
];

// ─── COMPONENTS ───

function SectionHeader({ icon: Icon, label, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {Icon && <Icon size={14} style={{ color: C.accent }} />}
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'TWK Everett',sans-serif" }}>{label}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function TabButton({ active, label, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
      border: `1px solid ${active ? C.accent : C.border}`,
      background: active ? C.accentD : C.card, borderRadius: 0, cursor: 'pointer',
      color: active ? C.accent : C.muted, fontSize: 11, fontWeight: 600,
      fontFamily: "'TWK Everett',sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase',
      transition: 'all 150ms ease',
    }}>
      {Icon && <Icon size={13} />}{label}
    </button>
  );
}

function StatusBadge({ type, label }) {
  const colors = {
    success: { bg: C.greenD, color: C.green, border: `1px solid ${C.green}30` },
    warning: { bg: C.amberD, color: C.amber, border: `1px solid ${C.amber}30` },
    error: { bg: C.roseD, color: C.rose, border: `1px solid ${C.rose}30` },
    info: { bg: C.blueD, color: C.blue, border: `1px solid ${C.blue}30` },
  };
  const s = colors[type] || colors.info;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '3px 8px', borderRadius: 3, background: s.bg, color: s.color, border: s.border,
      fontFamily: "'TWK Everett',sans-serif" }}>
      {label}
    </span>
  );
}

// ─── CSV UPLOAD TAB ───

function CSVUploadTab({ onImport }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({});
  const [unmapped, setUnmapped] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [period, setPeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [status, setStatus] = useState(null); // {type, message}
  const [step, setStep] = useState('upload'); // upload | map | preview

  const handleFile = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = parseCSV(ev.target.result);
        setParsed(result);
        const guess = guessColumnMapping(result.headers);
        setMapping(guess.mapping);
        setUnmapped(guess.unmapped);
        setConfidence(guess.confidence);
        setStep('map');
        setStatus(null);
      } catch (err) {
        setStatus({ type: 'error', message: `Parse error: ${err.message}` });
      }
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      const input = document.createElement('input');
      input.type = 'file';
      const dt = new DataTransfer();
      dt.items.add(f);
      input.files = dt.files;
      handleFile({ target: input });
    }
  }, [handleFile]);

  const updateMapping = (header, field) => {
    const newMapping = { ...mapping };
    if (field) { newMapping[header] = field; }
    else { delete newMapping[header]; }
    setMapping(newMapping);
  };

  const hasPeriodMapping = Object.values(mapping).some(v => v.startsWith('period.'));
  const mappedCount = Object.keys(mapping).filter(k => !mapping[k].startsWith('period.')).length;

  const doImport = () => {
    try {
      const snapshots = csvAdapter.normalize(parsed.rows, mapping, hasPeriodMapping ? null : period);
      actualsStore.save(snapshots);
      setStatus({ type: 'success', message: `Imported ${snapshots.length} period(s) from ${file.name}` });
      setStep('upload');
      setFile(null);
      setParsed(null);
      if (onImport) onImport(snapshots.length);
    } catch (err) {
      setStatus({ type: 'error', message: `Import failed: ${err.message}` });
    }
  };

  return (
    <div>
      <SectionHeader icon={Upload} label="CSV Upload"
        sub="Export from your CRM, MAP, or finance system. Column mapping is auto-detected." />

      {status && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 0,
          background: status.type === 'success' ? C.greenD : status.type === 'error' ? C.roseD : C.amberD,
          border: `1px solid ${status.type === 'success' ? C.green : status.type === 'error' ? C.rose : C.amber}30`,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          {status.type === 'success' ? <Check size={13} style={{ color: C.green }} /> : <AlertTriangle size={13} style={{ color: C.rose }} />}
          <span style={{ fontSize: 11, color: status.type === 'success' ? C.green : C.rose }}>{status.message}</span>
        </div>
      )}

      {step === 'upload' && (
        <div
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
          style={{ border: `2px dashed ${C.border}`, borderRadius: 0, padding: '48px 24px',
            textAlign: 'center', cursor: 'pointer', background: C.bgAlt, transition: 'border-color 150ms' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          onClick={() => document.getElementById('csv-input').click()}>
          <Upload size={24} style={{ color: C.dim, marginBottom: 12 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>Drop CSV file here or click to browse</div>
          <div style={{ fontSize: 11, color: C.muted }}>Supports .csv and .tsv exports from HubSpot, Salesforce, Google Sheets, Excel</div>
          <input id="csv-input" type="file" accept=".csv,.tsv,.txt" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      )}

      {step === 'map' && parsed && (
        <div>
          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
            background: C.bgAlt, border: `1px solid ${C.border}`, marginBottom: 16, borderRadius: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={14} style={{ color: C.accent }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{file.name}</span>
              <span style={{ fontSize: 10, color: C.muted }}>{parsed.rows.length} rows · {parsed.headers.length} columns</span>
            </div>
            <StatusBadge type={confidence > 0.5 ? 'success' : confidence > 0.2 ? 'warning' : 'info'}
              label={`${Math.round(confidence * 100)}% auto-mapped`} />
          </div>

          {/* Period override (if no period columns mapped) */}
          {!hasPeriodMapping && (
            <div style={{ padding: '12px 14px', background: C.amberD, border: `1px solid ${C.amber}25`, borderRadius: 0, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, textTransform: 'uppercase', marginBottom: 8 }}>
                No period columns detected — set month manually
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={period.month} onChange={e => setPeriod(p => ({ ...p, month: parseInt(e.target.value) }))}
                  style={{ padding: '5px 8px', fontSize: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 0, color: C.text, fontFamily: "'Chivo Mono',monospace" }}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" value={period.year} onChange={e => setPeriod(p => ({ ...p, year: parseInt(e.target.value) }))}
                  style={{ width: 70, padding: '5px 8px', fontSize: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 0, color: C.text, fontFamily: "'Chivo Mono',monospace" }} />
              </div>
            </div>
          )}

          {/* Column mapping table */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', padding: '8px 14px',
              background: C.bgAlt, borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700,
              color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span>CSV Column</span><span>Maps To</span><span>Sample</span>
            </div>
            {parsed.headers.map((header, i) => (
              <div key={header} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', padding: '6px 14px',
                borderBottom: i < parsed.headers.length - 1 ? `1px solid ${C.border}` : 'none',
                alignItems: 'center', background: mapping[header] ? `${C.green}05` : 'transparent' }}>
                <span style={{ fontSize: 12, color: C.text, fontFamily: "'Chivo Mono',monospace", fontWeight: 500 }}>{header}</span>
                <select value={mapping[header] || ''} onChange={e => updateMapping(header, e.target.value)}
                  style={{ padding: '4px 6px', fontSize: 11, background: C.card, border: `1px solid ${mapping[header] ? C.green + '40' : C.border}`,
                    borderRadius: 0, color: mapping[header] ? C.green : C.muted, fontFamily: "'TWK Everett',sans-serif" }}>
                  {ALL_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <span style={{ fontSize: 11, color: C.dim, fontFamily: "'Chivo Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {parsed.rows[0]?.[header] || '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setStep('upload'); setFile(null); setParsed(null); setStatus(null); }}
              style={{ padding: '8px 16px', fontSize: 11, fontWeight: 600, background: 'transparent', border: `1px solid ${C.border}`,
                borderRadius: 0, color: C.muted, cursor: 'pointer', fontFamily: "'TWK Everett',sans-serif" }}>
              Cancel
            </button>
            <button onClick={doImport} disabled={mappedCount === 0}
              style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, background: mappedCount > 0 ? C.accent : C.dim,
                border: 'none', borderRadius: 0, color: '#fff', cursor: mappedCount > 0 ? 'pointer' : 'not-allowed',
                fontFamily: "'TWK Everett',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Import {mappedCount} field{mappedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GOOGLE SHEETS TAB ───

function SheetsTab({ onImport }) {
  const [url, setUrl] = useState(() => adapterConfigStore.get('sheets')?.url || '');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [mapping, setMapping] = useState({});

  const handleConnect = async () => {
    if (!url.includes('docs.google.com/spreadsheets')) {
      setStatus({ type: 'error', message: 'Enter a Google Sheets URL' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await sheetsAdapter.fetch(url);
      setParsed(result);
      const guess = guessColumnMapping(result.headers);
      setMapping(guess.mapping);
      adapterConfigStore.save('sheets', { url });
      setStatus({ type: 'success', message: `Connected — ${result.rows.length} rows, ${result.headers.length} columns. ${Math.round(guess.confidence * 100)}% auto-mapped.` });
    } catch (err) {
      setStatus({ type: 'error', message: err.message.includes('published') ? 'Sheet must be published to web: File → Share → Publish to web' : err.message });
    } finally {
      setLoading(false);
    }
  };

  const doImport = () => {
    if (!parsed) return;
    try {
      const snapshots = sheetsAdapter.normalize(parsed.rows, mapping);
      actualsStore.save(snapshots);
      setStatus({ type: 'success', message: `Imported ${snapshots.length} period(s) from Google Sheets` });
      setParsed(null);
      if (onImport) onImport(snapshots.length);
    } catch (err) {
      setStatus({ type: 'error', message: `Import failed: ${err.message}` });
    }
  };

  return (
    <div>
      <SectionHeader icon={Link2} label="Google Sheets"
        sub="Connect a published Google Sheet. The engine fetches fresh CSV data from the sheet URL." />

      {status && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 0,
          background: status.type === 'success' ? C.greenD : C.roseD,
          border: `1px solid ${status.type === 'success' ? C.green : C.rose}30`,
          fontSize: 11, color: status.type === 'success' ? C.green : C.rose }}>
          {status.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input type="text" placeholder="https://docs.google.com/spreadsheets/d/..." value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ flex: 1, padding: '9px 12px', fontSize: 12, background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 0, color: C.text, fontFamily: "'Chivo Mono',monospace", outline: 'none' }} />
        <button onClick={handleConnect} disabled={loading}
          style={{ padding: '9px 20px', fontSize: 11, fontWeight: 700, background: C.accent, border: 'none',
            borderRadius: 0, color: '#fff', cursor: 'pointer', fontFamily: "'TWK Everett',sans-serif",
            textTransform: 'uppercase', letterSpacing: '0.06em', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Fetching…' : 'Connect'}
        </button>
      </div>

      {parsed && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Column Preview ({parsed.headers.length} columns)
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {parsed.headers.map(h => (
              <span key={h} style={{ fontSize: 10, padding: '3px 8px', background: mapping[h] ? C.greenD : C.bgAlt,
                border: `1px solid ${mapping[h] ? C.green + '30' : C.border}`, borderRadius: 3,
                color: mapping[h] ? C.green : C.muted, fontFamily: "'Chivo Mono',monospace" }}>
                {h}{mapping[h] ? ` → ${mapping[h].split('.').pop()}` : ''}
              </span>
            ))}
          </div>
          <button onClick={doImport}
            style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, background: C.accent, border: 'none',
              borderRadius: 0, color: '#fff', cursor: 'pointer', fontFamily: "'TWK Everett',sans-serif",
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Import Data
          </button>
        </div>
      )}

      <div style={{ marginTop: 24, padding: '12px 14px', background: C.bgAlt, borderRadius: 0, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', marginBottom: 6 }}>Setup</div>
        <ol style={{ fontSize: 11, color: C.muted, lineHeight: 1.8, paddingLeft: 18 }}>
          <li>Open your actuals spreadsheet in Google Sheets</li>
          <li>File → Share → Publish to web → select Sheet tab → CSV → Publish</li>
          <li>Paste the sheet URL above (the edit URL works — we extract the ID)</li>
        </ol>
      </div>
    </div>
  );
}

// ─── MANUAL ENTRY TAB ───

function ManualEntryTab({ onImport }) {
  const [period, setPeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [form, setForm] = useState({});
  const [status, setStatus] = useState(null);

  const updateField = (key, raw) => {
    const val = raw === '' ? undefined : parseFloat(raw);
    setForm(prev => {
      const next = { ...prev };
      if (val === undefined || isNaN(val)) delete next[key];
      else next[key] = val;
      return next;
    });
  };

  const filledCount = Object.keys(form).length;

  const doSave = () => {
    if (filledCount === 0) return;
    try {
      const snapshots = manualAdapter.normalize(form, period);
      actualsStore.save(snapshots);
      setStatus({ type: 'success', message: `Saved ${MONTHS[period.month - 1]} ${period.year} — ${filledCount} field(s)` });
      setForm({});
      if (onImport) onImport(1);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
  };

  // Pre-fill from existing data
  const loadExisting = () => {
    const existing = actualsStore.get(period.year, period.month);
    if (!existing) { setStatus({ type: 'info', message: 'No existing data for this period' }); return; }
    const filled = {};
    MANUAL_FIELDS.forEach(section => {
      section.fields.forEach(f => {
        // Map manual field keys to snapshot paths
        const val = getSnapshotValue(existing, f.key);
        if (val != null) filled[f.key] = val;
      });
    });
    setForm(filled);
    setStatus({ type: 'success', message: `Loaded ${Object.keys(filled).length} fields from existing data` });
  };

  return (
    <div>
      <SectionHeader icon={Edit3} label="Manual Entry"
        sub="Enter actuals directly. Fill in what you have — partial data is fine." />

      {status && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 0,
          background: status.type === 'success' ? C.greenD : status.type === 'error' ? C.roseD : C.blueD,
          border: `1px solid ${status.type === 'success' ? C.green : status.type === 'error' ? C.rose : C.blue}30`,
          fontSize: 11, color: status.type === 'success' ? C.green : status.type === 'error' ? C.rose : C.blue }}>
          {status.message}
        </div>
      )}

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Period:</span>
        <select value={period.month} onChange={e => setPeriod(p => ({ ...p, month: parseInt(e.target.value) }))}
          style={{ padding: '6px 10px', fontSize: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 0, color: C.text, fontFamily: "'Chivo Mono',monospace" }}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={period.year} onChange={e => setPeriod(p => ({ ...p, year: parseInt(e.target.value) }))}
          style={{ width: 70, padding: '6px 10px', fontSize: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 0, color: C.text, fontFamily: "'Chivo Mono',monospace" }} />
        <button onClick={loadExisting}
          style={{ marginLeft: 8, padding: '6px 12px', fontSize: 10, fontWeight: 600, background: 'transparent',
            border: `1px solid ${C.border}`, borderRadius: 0, color: C.muted, cursor: 'pointer', fontFamily: "'TWK Everett',sans-serif" }}>
          Load Existing
        </button>
      </div>

      {/* Field sections */}
      {MANUAL_FIELDS.map(section => (
        <div key={section.section} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
            {section.section}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {section.fields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
                  {f.label}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 0, padding: '5px 9px', gap: 4 }}>
                  {f.type === 'currency' && <span style={{ color: C.dim, fontSize: 12 }}>$</span>}
                  <input type="number" value={form[f.key] ?? ''} placeholder={f.hint}
                    onChange={e => updateField(f.key, e.target.value)}
                    step={f.type === 'currency' ? 1000 : f.type === 'percent' ? 0.5 : 1}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text,
                      fontSize: 13, fontFamily: "'Chivo Mono',monospace", width: '100%' }} />
                  {f.type === 'percent' && <span style={{ color: C.dim, fontSize: 11 }}>%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => { setForm({}); setStatus(null); }}
          style={{ padding: '8px 16px', fontSize: 11, fontWeight: 600, background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 0, color: C.muted, cursor: 'pointer', fontFamily: "'TWK Everett',sans-serif" }}>
          Clear
        </button>
        <button onClick={doSave} disabled={filledCount === 0}
          style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, background: filledCount > 0 ? C.accent : C.dim,
            border: 'none', borderRadius: 0, color: '#fff', cursor: filledCount > 0 ? 'pointer' : 'not-allowed',
            fontFamily: "'TWK Everett',sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Save {filledCount} Field{filledCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}

// Helper to extract snapshot value for manual form pre-fill
function getSnapshotValue(snap, key) {
  const MAP = {
    inquiries: snap.funnel?.inquiries,
    mqls: snap.funnel?.mqls,
    sqls: snap.funnel?.sqls,
    meetingsHeld: snap.funnel?.meetingsHeld,
    sqos: snap.funnel?.sqosCreated,
    dealsWon: snap.funnel?.dealsWon,
    dealsLost: snap.funnel?.dealsLost,
    stage2Pipeline: snap.pipeline?.stage2?.value,
    pipelineTotal: snap.pipeline?.total?.value,
    newARR: snap.revenue?.newLogoARR,
    currentARR: snap.revenue?.currentARR,
    churnedARR: snap.revenue?.churnedARR,
    activeAEs: snap.capacity?.activeAEs,
    avgDealSize: snap.capacity?.avgDealSize,
    winRate: snap.capacity?.winRate,
    mktgSpend: snap.spend?.totalMarketing,
    salesSpend: snap.spend?.totalSales,
  };
  return MAP[key] ?? null;
}

// ─── HISTORY TAB ───

function HistoryTab({ actuals, onClear, onDelete, onExport }) {
  if (actuals.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <Database size={24} style={{ color: C.dim, marginBottom: 12 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 4 }}>No actuals data yet</div>
        <div style={{ fontSize: 11, color: C.dim }}>Upload a CSV, connect a sheet, or enter data manually</div>
      </div>
    );
  }

  const summary = actualsStore.summary();

  return (
    <div>
      <SectionHeader icon={Database} label="Actuals History"
        sub={`${summary.count} period(s) · Sources: ${summary.sources.join(', ')}`} />

      {/* Period cards */}
      <div style={{ display: 'grid', gap: 1, border: `1px solid ${C.border}`, borderRadius: 0, overflow: 'hidden', marginBottom: 16 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr) 40px', padding: '8px 14px',
          background: C.bgAlt, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <span>Period</span><span>Deals Won</span><span>New ARR</span><span>Pipeline</span><span>MQLs</span><span>Source</span><span></span>
        </div>
        {actuals.map(snap => {
          const key = `${snap.period.year}-${snap.period.month}`;
          return (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr) 40px', padding: '8px 14px',
              background: C.card, borderTop: `1px solid ${C.border}`, alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: "'Chivo Mono',monospace" }}>
                {MONTHS[snap.period.month - 1]} {String(snap.period.year).slice(2)}
              </span>
              <span style={{ fontSize: 12, color: C.text, fontFamily: "'Chivo Mono',monospace" }}>{fN(snap.funnel?.dealsWon)}</span>
              <span style={{ fontSize: 12, color: C.text, fontFamily: "'Chivo Mono',monospace" }}>{fmt(snap.revenue?.newLogoARR)}</span>
              <span style={{ fontSize: 12, color: C.text, fontFamily: "'Chivo Mono',monospace" }}>{fmt(snap.pipeline?.total?.value)}</span>
              <span style={{ fontSize: 12, color: C.text, fontFamily: "'Chivo Mono',monospace" }}>{fN(snap.funnel?.mqls)}</span>
              <span style={{ fontSize: 10, color: C.dim }}>{snap.source}</span>
              <button onClick={() => onDelete(snap.period.year, snap.period.month)}
                style={{ background: 'transparent', border: 'none', color: C.dim, cursor: 'pointer', padding: 2 }}
                title="Delete period">
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onExport}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 10, fontWeight: 600,
            background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 0, color: C.muted, cursor: 'pointer',
            fontFamily: "'TWK Everett',sans-serif" }}>
          <Download size={12} /> Export JSON
        </button>
        <button onClick={onClear}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 10, fontWeight: 600,
            background: 'transparent', border: `1px solid ${C.rose}40`, borderRadius: 0, color: C.rose, cursor: 'pointer',
            fontFamily: "'TWK Everett',sans-serif" }}>
          <Trash2 size={12} /> Clear All
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───

export default function DataIngestionPage({ onDataImported, mobile }) {
  const [tab, setTab] = useState('csv');
  const [actuals, setActuals] = useState(() => actualsStore.getAll());

  const refresh = useCallback((count) => {
    setActuals(actualsStore.getAll());
    if (onDataImported) onDataImported();
  }, [onDataImported]);

  const handleDelete = (year, month) => {
    actualsStore.delete(year, month);
    refresh();
  };

  const handleClear = () => {
    if (confirm('Clear all actuals data? This cannot be undone.')) {
      actualsStore.clear();
      refresh();
    }
  };

  const handleExport = () => {
    const json = actualsStore.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opptycon-actuals-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = actualsStore.summary();

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Zap size={16} style={{ color: C.accent }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0, fontFamily: "'TWK Everett',sans-serif" }}>
            Data Sources
          </h2>
          {summary.count > 0 && <StatusBadge type="success" label={`${summary.count} periods loaded`} />}
        </div>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, margin: 0 }}>
          Feed real operating data into the engine. Actuals enable plan-vs-actual governance verdicts, drift detection, and recalibration suggestions on the Spine.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        <TabButton active={tab === 'csv'} label="CSV Upload" icon={Upload} onClick={() => setTab('csv')} />
        <TabButton active={tab === 'sheets'} label="Google Sheets" icon={Link2} onClick={() => setTab('sheets')} />
        <TabButton active={tab === 'manual'} label="Manual Entry" icon={Edit3} onClick={() => setTab('manual')} />
        <TabButton active={tab === 'history'} label={`History${summary.count > 0 ? ` (${summary.count})` : ''}`} icon={Database} onClick={() => setTab('history')} />
      </div>

      {/* Tab content */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 0, padding: mobile ? 16 : 24 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === 'csv' && <CSVUploadTab onImport={refresh} />}
            {tab === 'sheets' && <SheetsTab onImport={refresh} />}
            {tab === 'manual' && <ManualEntryTab onImport={refresh} />}
            {tab === 'history' && <HistoryTab actuals={actuals} onClear={handleClear} onDelete={handleDelete} onExport={handleExport} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
