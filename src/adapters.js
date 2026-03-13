// ─── NetherOps OpptyCon — Data Adapters ───
// Normalize external data sources → standard ActualsSnapshot schema.
//
// Usage:
//   import { csvAdapter, sheetsAdapter, manualAdapter, parseCSV, guessColumnMapping } from './adapters';
//   const snapshot = csvAdapter.normalize(parsedRows, columnMapping, period);

// ════════════════════════════════════════════════════════════
// ACTUALS SNAPSHOT SCHEMA (canonical output of every adapter)
// ════════════════════════════════════════════════════════════

export function emptySnapshot(source, period) {
  return {
    source,
    timestamp: new Date().toISOString(),
    period: period || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
    funnel: { inquiries: null, mqls: null, sqls: null, meetingsHeld: null, sqosCreated: null, dealsWon: null, dealsLost: null },
    pipeline: {
      stage1: { count: null, value: null }, stage2: { count: null, value: null },
      stage3: { count: null, value: null }, stage4: { count: null, value: null },
      stage5: { count: null, value: null }, total: { count: null, value: null },
    },
    revenue: { newLogoARR: null, expansionARR: null, churnedARR: null, currentARR: null },
    capacity: { activeAEs: null, activeSdrs: null, avgDealSize: null, avgCycleDays: null, winRate: null },
    spend: { totalMarketing: null, byChannel: {}, totalSales: null, totalSAndM: null },
    signals: {},
  };
}

// ════════════════════════════════════════════════════════════
// CSV PARSER (generic, handles most CRM/finance exports)
// ════════════════════════════════════════════════════════════

export function parseCSV(text, delimiter = null) {
  // Auto-detect delimiter
  if (!delimiter) {
    const firstLine = text.split('\n')[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    delimiter = tabCount > commaCount ? '\t' : ',';
  }

  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header
  const headers = parseLine(lines[0], delimiter);

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line, delimiter);
    const row = {};
    headers.forEach((h, j) => { row[h] = values[j] || ''; });
    rows.push(row);
  }

  return { headers, rows, delimiter };
}

function parseLine(line, delimiter) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// ════════════════════════════════════════════════════════════
// COLUMN MAPPING (auto-guess + manual override)
// ════════════════════════════════════════════════════════════

// Known column name patterns for each actuals field
const COLUMN_PATTERNS = {
  // Period
  'period.month': [/^month$/i, /^period$/i, /^date$/i, /^month.?name$/i],
  'period.year': [/^year$/i, /^fiscal.?year$/i, /^fy$/i],

  // Funnel
  'funnel.inquiries': [/inquir/i, /^leads$/i, /^new.?leads$/i, /^raw.?leads$/i, /^net.?new$/i],
  'funnel.mqls': [/^mqls?$/i, /marketing.?qual/i, /^mql.?count$/i],
  'funnel.sqls': [/^sqls?$/i, /sales.?qual/i, /^sql.?count$/i, /^accepted$/i],
  'funnel.meetingsHeld': [/meeting/i, /^disco/i, /^held$/i, /^first.?meeting/i],
  'funnel.sqosCreated': [/^sqos?$/i, /^opp/i, /qualified.?opp/i, /^stage.?2$/i, /^new.?opp/i],
  'funnel.dealsWon': [/won$/i, /^closed.?won$/i, /^deals$/i, /^wins$/i, /^bookings$/i],
  'funnel.dealsLost': [/lost$/i, /^closed.?lost$/i, /^losses$/i],

  // Pipeline
  'pipeline.total.value': [/^total.?pipe/i, /^pipeline$/i, /^pipe.?value$/i, /^pipeline.?\$$/i],
  'pipeline.total.count': [/^pipe.?count$/i, /^opp.?count$/i, /^active.?opps$/i],
  'pipeline.stage1.value': [/stage.?1.?(val|\$|pipe)/i, /^s1.?pipe/i],
  'pipeline.stage2.value': [/stage.?2.?(val|\$|pipe)/i, /^s2.?pipe/i, /^sqo.?pipe/i],

  // Revenue
  'revenue.newLogoARR': [/^new.?logo/i, /^new.?arr$/i, /^new.?business$/i, /^net.?new.?arr$/i],
  'revenue.expansionARR': [/expan/i, /^upsell$/i, /^cross.?sell$/i, /^expansion$/i],
  'revenue.churnedARR': [/churn/i, /^lost.?arr$/i, /^downsell$/i],
  'revenue.currentARR': [/^arr$/i, /^current.?arr$/i, /^total.?arr$/i, /^ending.?arr$/i],

  // Capacity
  'capacity.activeAEs': [/^ae/i, /^reps?$/i, /^active.?ae/i, /^headcount$/i],
  'capacity.avgDealSize': [/avg.?deal/i, /^ads$/i, /^asp$/i, /average.?deal/i, /deal.?size$/i],
  'capacity.avgCycleDays': [/cycle/i, /^days$/i, /^avg.?days$/i, /sales.?cycle/i],
  'capacity.winRate': [/win.?rate/i, /^close.?rate$/i, /^conversion$/i],

  // Spend
  'spend.totalMarketing': [/mktg.?spend/i, /marketing.?spend/i, /^mktg.?\$$/i, /total.?marketing$/i],
  'spend.totalSales': [/sales.?spend/i, /^sales.?\$$/i, /total.?sales.?spend$/i],
  'spend.totalSAndM': [/^s.?&.?m$/i, /^s.?m.?spend$/i, /total.?s.?m$/i],
};

export function guessColumnMapping(headers) {
  const mapping = {};
  const unmapped = [];

  headers.forEach(header => {
    let matched = false;
    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
      if (patterns.some(p => p.test(header))) {
        mapping[header] = field;
        matched = true;
        break;
      }
    }
    if (!matched) unmapped.push(header);
  });

  return { mapping, unmapped, confidence: Object.keys(mapping).length / headers.length };
}

// ════════════════════════════════════════════════════════════
// CSV ADAPTER
// ════════════════════════════════════════════════════════════

export const csvAdapter = {
  id: 'csv',
  name: 'CSV Upload',
  type: 'csv',
  provides: ['funnel', 'pipeline', 'revenue', 'capacity', 'spend'],

  normalize(rows, columnMapping, periodOverride) {
    // Group rows by period if period columns are mapped
    const hasPeriodCol = Object.values(columnMapping).some(v => v.startsWith('period.'));
    
    if (!hasPeriodCol && periodOverride) {
      // Single-period CSV: aggregate all rows into one snapshot
      return [aggregateRows(rows, columnMapping, 'csv', periodOverride)];
    }

    // Multi-period CSV: group by month/year
    const groups = {};
    rows.forEach(row => {
      const period = extractPeriod(row, columnMapping) || periodOverride;
      if (!period) return;
      const key = `${period.year}-${period.month}`;
      if (!groups[key]) groups[key] = { period, rows: [] };
      groups[key].rows.push(row);
    });

    return Object.values(groups).map(g =>
      aggregateRows(g.rows, columnMapping, 'csv', g.period)
    );
  },
};

function extractPeriod(row, mapping) {
  const monthCol = Object.entries(mapping).find(([_, v]) => v === 'period.month')?.[0];
  const yearCol = Object.entries(mapping).find(([_, v]) => v === 'period.year')?.[0];

  if (!monthCol && !yearCol) return null;

  let month = null, year = null;

  if (monthCol) {
    const mv = row[monthCol];
    // Try numeric month
    const num = parseInt(mv);
    if (num >= 1 && num <= 12) { month = num; }
    else {
      // Try month name
      const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      const idx = MONTHS.findIndex(m => mv.toLowerCase().startsWith(m));
      if (idx >= 0) month = idx + 1;
    }
  }

  if (yearCol) {
    year = parseInt(row[yearCol]);
    if (year < 100) year += 2000;
  }

  // Try parsing date from month column if it contains a full date
  if (!month && monthCol) {
    const d = new Date(row[monthCol]);
    if (!isNaN(d)) { month = d.getMonth() + 1; year = year || d.getFullYear(); }
  }

  return month ? { year: year || new Date().getFullYear(), month } : null;
}

function aggregateRows(rows, mapping, source, period) {
  const snap = emptySnapshot(source, period);

  // For each mapped column, extract and aggregate values
  rows.forEach(row => {
    Object.entries(mapping).forEach(([colName, field]) => {
      if (field.startsWith('period.')) return; // skip period columns
      const raw = row[colName];
      const val = parseNumeric(raw);
      if (val === null) return;
      setNestedValue(snap, field, val, 'sum');
    });
  });

  // Derive computed fields
  if (snap.funnel.dealsWon && snap.funnel.sqosCreated) {
    snap.capacity.winRate = snap.capacity.winRate || (snap.funnel.dealsWon / snap.funnel.sqosCreated * 100);
  }
  if (snap.spend.totalMarketing && snap.spend.totalSales && !snap.spend.totalSAndM) {
    snap.spend.totalSAndM = snap.spend.totalMarketing + snap.spend.totalSales;
  }

  return snap;
}

function parseNumeric(val) {
  if (val == null || val === '') return null;
  // Strip currency symbols, commas, whitespace
  const cleaned = String(val).replace(/[$€£,\s]/g, '').replace(/\((.+)\)/, '-$1');
  // Handle percentage
  if (cleaned.endsWith('%')) return parseFloat(cleaned);
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function setNestedValue(obj, path, value, mode = 'set') {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  const key = parts[parts.length - 1];
  if (mode === 'sum' && current[key] != null) {
    current[key] += value;
  } else {
    current[key] = value;
  }
}

// ════════════════════════════════════════════════════════════
// GOOGLE SHEETS ADAPTER (published sheet → CSV fetch)
// ════════════════════════════════════════════════════════════

export const sheetsAdapter = {
  id: 'sheets',
  name: 'Google Sheets',
  type: 'sheets',
  provides: ['funnel', 'pipeline', 'revenue', 'capacity', 'spend'],

  // Convert a Google Sheets URL to its published CSV export URL
  toCSVUrl(sheetUrl) {
    // Handle various Google Sheets URL formats
    // https://docs.google.com/spreadsheets/d/{ID}/edit...
    // https://docs.google.com/spreadsheets/d/{ID}/pub...
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    const id = match[1];
    // gid parameter for specific sheet tab
    const gidMatch = sheetUrl.match(/gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  },

  async fetch(sheetUrl) {
    const csvUrl = this.toCSVUrl(sheetUrl);
    if (!csvUrl) throw new Error('Invalid Google Sheets URL');

    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}. Is the sheet published to web?`);
    const text = await response.text();
    return parseCSV(text);
  },

  normalize(rows, columnMapping, period) {
    // Same normalization as CSV
    return csvAdapter.normalize(rows, columnMapping, period);
  },
};

// ════════════════════════════════════════════════════════════
// MANUAL ENTRY ADAPTER
// ════════════════════════════════════════════════════════════

export const manualAdapter = {
  id: 'manual',
  name: 'Manual Entry',
  type: 'manual',
  provides: ['funnel', 'pipeline', 'revenue', 'capacity', 'spend'],

  normalize(formData, period) {
    const snap = emptySnapshot('manual', period);

    // Direct field mapping from form
    if (formData.inquiries != null) snap.funnel.inquiries = formData.inquiries;
    if (formData.mqls != null) snap.funnel.mqls = formData.mqls;
    if (formData.sqls != null) snap.funnel.sqls = formData.sqls;
    if (formData.meetingsHeld != null) snap.funnel.meetingsHeld = formData.meetingsHeld;
    if (formData.sqos != null) snap.funnel.sqosCreated = formData.sqos;
    if (formData.dealsWon != null) snap.funnel.dealsWon = formData.dealsWon;
    if (formData.dealsLost != null) snap.funnel.dealsLost = formData.dealsLost;

    if (formData.pipelineTotal != null) snap.pipeline.total.value = formData.pipelineTotal;
    if (formData.stage2Pipeline != null) snap.pipeline.stage2.value = formData.stage2Pipeline;

    if (formData.newARR != null) snap.revenue.newLogoARR = formData.newARR;
    if (formData.currentARR != null) snap.revenue.currentARR = formData.currentARR;
    if (formData.churnedARR != null) snap.revenue.churnedARR = formData.churnedARR;

    if (formData.activeAEs != null) snap.capacity.activeAEs = formData.activeAEs;
    if (formData.avgDealSize != null) snap.capacity.avgDealSize = formData.avgDealSize;
    if (formData.winRate != null) snap.capacity.winRate = formData.winRate;

    if (formData.mktgSpend != null) snap.spend.totalMarketing = formData.mktgSpend;
    if (formData.salesSpend != null) snap.spend.totalSales = formData.salesSpend;

    // Derive
    if (snap.spend.totalMarketing && snap.spend.totalSales) {
      snap.spend.totalSAndM = snap.spend.totalMarketing + snap.spend.totalSales;
    }
    if (snap.funnel.dealsWon && snap.funnel.sqosCreated && !snap.capacity.winRate) {
      snap.capacity.winRate = snap.funnel.dealsWon / snap.funnel.sqosCreated * 100;
    }

    return [snap];
  },
};

// ════════════════════════════════════════════════════════════
// API ADAPTER SKELETONS (Phase 2 — Netlify Functions)
// ════════════════════════════════════════════════════════════

export const hubspotAdapter = {
  id: 'hubspot',
  name: 'HubSpot',
  type: 'api',
  status: 'disconnected',
  provides: ['funnel', 'pipeline', 'spend'],

  // In Phase 2, this calls a Netlify Function:
  // POST /.netlify/functions/adapter-hubspot
  async fetch(config, dateRange) {
    const res = await fetch('/.netlify/functions/adapter-hubspot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', dateRange, config }),
    });
    if (!res.ok) throw new Error(`HubSpot sync failed: ${res.status}`);
    return res.json();
  },

  async test(config) {
    try {
      const res = await fetch('/.netlify/functions/adapter-hubspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', config }),
      });
      const data = await res.json();
      return { ok: res.ok, message: data.message || (res.ok ? 'Connected' : 'Failed') };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },
};

export const salesforceAdapter = {
  id: 'salesforce',
  name: 'Salesforce',
  type: 'api',
  status: 'disconnected',
  provides: ['funnel', 'pipeline', 'revenue', 'capacity'],

  async fetch(config, dateRange) {
    const res = await fetch('/.netlify/functions/adapter-salesforce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', dateRange, config }),
    });
    if (!res.ok) throw new Error(`Salesforce sync failed: ${res.status}`);
    return res.json();
  },

  async test(config) {
    try {
      const res = await fetch('/.netlify/functions/adapter-salesforce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', config }),
      });
      const data = await res.json();
      return { ok: res.ok, message: data.message || (res.ok ? 'Connected' : 'Failed') };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },
};

// ════════════════════════════════════════════════════════════
// ADAPTER REGISTRY
// ════════════════════════════════════════════════════════════

export const ADAPTERS = {
  csv: csvAdapter,
  sheets: sheetsAdapter,
  manual: manualAdapter,
  hubspot: hubspotAdapter,
  salesforce: salesforceAdapter,
};

// ════════════════════════════════════════════════════════════
// MANUAL ENTRY FIELD DEFINITIONS (for UI form generation)
// ════════════════════════════════════════════════════════════

export const MANUAL_FIELDS = [
  { section: "Funnel", fields: [
    { key: "inquiries", label: "Inquiries", type: "number", hint: "Net new identifiable prospects" },
    { key: "mqls", label: "MQLs", type: "number", hint: "Marketing qualified leads" },
    { key: "sqls", label: "SQLs", type: "number", hint: "Sales qualified leads" },
    { key: "meetingsHeld", label: "Meetings Held", type: "number", hint: "First live sales conversation (not scheduled)" },
    { key: "sqos", label: "SQOs Created", type: "number", hint: "Stage 2+ qualified opportunities" },
    { key: "dealsWon", label: "Deals Won", type: "number", hint: "Closed-won count" },
    { key: "dealsLost", label: "Deals Lost", type: "number", hint: "Closed-lost count" },
  ]},
  { section: "Pipeline", fields: [
    { key: "stage2Pipeline", label: "Stage 2+ Pipeline ($)", type: "currency", hint: "Total SQO pipeline value" },
    { key: "pipelineTotal", label: "Total Pipeline ($)", type: "currency", hint: "All stages including Stage 1" },
  ]},
  { section: "Revenue", fields: [
    { key: "newARR", label: "New Logo ARR ($)", type: "currency", hint: "Net new closed-won ARR this period" },
    { key: "currentARR", label: "Current ARR ($)", type: "currency", hint: "Total ARR at end of period" },
    { key: "churnedARR", label: "Churned ARR ($)", type: "currency", hint: "ARR lost to churn this period" },
  ]},
  { section: "Capacity", fields: [
    { key: "activeAEs", label: "Active AEs", type: "number", hint: "Quota-carrying reps" },
    { key: "avgDealSize", label: "Avg Deal Size ($)", type: "currency", hint: "Trailing closed-won average" },
    { key: "winRate", label: "Win Rate (%)", type: "percent", hint: "Trailing SQO→Won rate" },
  ]},
  { section: "Spend", fields: [
    { key: "mktgSpend", label: "Marketing Spend ($)", type: "currency", hint: "Total marketing spend" },
    { key: "salesSpend", label: "Sales Spend ($)", type: "currency", hint: "Total sales opex" },
  ]},
];
