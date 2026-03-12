// ─── Revenue Physics Engine — Actuals Store + Comparator ───
// Stores observed data alongside plan projections.
// Provides plan-vs-actual comparison for governance verdicts.
//
// Usage:
//   import { actualsStore, comparePlanToActuals } from './actuals';
//   actualsStore.save(snapshot);
//   const comparison = comparePlanToActuals(model, actualsStore.getAll());

const STORAGE_KEY = 'rpe_actuals';
const CONFIG_KEY = 'rpe_adapter_config';

// ════════════════════════════════════════════════════════════
// ACTUALS STORE (localStorage-backed, Phase 1)
// ════════════════════════════════════════════════════════════

export const actualsStore = {
  // Get all snapshots, sorted by period
  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return data.sort((a, b) => {
        const ka = a.period.year * 100 + a.period.month;
        const kb = b.period.year * 100 + b.period.month;
        return ka - kb;
      });
    } catch { return []; }
  },

  // Get snapshot for a specific period
  get(year, month) {
    return this.getAll().find(s =>
      s.period.year === year && s.period.month === month
    ) || null;
  },

  // Get snapshots for a year
  getYear(year) {
    return this.getAll().filter(s => s.period.year === year);
  },

  // Get snapshots for a quarter
  getQuarter(year, quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    return this.getAll().filter(s =>
      s.period.year === year &&
      s.period.month >= startMonth &&
      s.period.month < startMonth + 3
    );
  },

  // Save one or more snapshots (upserts by period)
  save(snapshots) {
    const arr = Array.isArray(snapshots) ? snapshots : [snapshots];
    const existing = this.getAll();

    arr.forEach(snap => {
      if (!snap.period) return;
      const idx = existing.findIndex(e =>
        e.period.year === snap.period.year && e.period.month === snap.period.month
      );
      if (idx >= 0) {
        // Merge: new data overwrites, but preserve existing non-null fields
        existing[idx] = mergeSnapshots(existing[idx], snap);
      } else {
        existing.push(snap);
      }
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save actuals:', e);
    }
    return existing;
  },

  // Delete a specific period
  delete(year, month) {
    const existing = this.getAll().filter(s =>
      !(s.period.year === year && s.period.month === month)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return existing;
  },

  // Clear all actuals
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Export as JSON (for backup)
  export() {
    return JSON.stringify(this.getAll(), null, 2);
  },

  // Import from JSON
  import(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (!Array.isArray(data)) throw new Error('Expected array');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return { ok: true, count: data.length };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // Summary stats
  summary() {
    const all = this.getAll();
    if (all.length === 0) return { count: 0, range: null, sources: [] };
    const sources = [...new Set(all.map(s => s.source))];
    const first = all[0].period;
    const last = all[all.length - 1].period;
    return {
      count: all.length,
      range: { from: first, to: last },
      sources,
    };
  },
};

// Merge two snapshots: new values overwrite, null values preserve existing
function mergeSnapshots(existing, incoming) {
  const merged = JSON.parse(JSON.stringify(existing));
  merged.timestamp = incoming.timestamp;
  merged.source = incoming.source;

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] === null || source[key] === undefined) continue;
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  deepMerge(merged, incoming);
  return merged;
}

// ════════════════════════════════════════════════════════════
// ADAPTER CONFIG STORE
// ════════════════════════════════════════════════════════════

export const adapterConfigStore = {
  get(adapterId) {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      const configs = raw ? JSON.parse(raw) : {};
      return configs[adapterId] || null;
    } catch { return null; }
  },

  save(adapterId, config) {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      const configs = raw ? JSON.parse(raw) : {};
      configs[adapterId] = { ...config, updatedAt: new Date().toISOString() };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save adapter config:', e);
    }
  },

  getAll() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },
};

// ════════════════════════════════════════════════════════════
// PLAN vs ACTUAL COMPARATOR
// ════════════════════════════════════════════════════════════

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function comparePlanToActuals(model, actuals) {
  if (!actuals || actuals.length === 0) {
    return { hasActuals: false, monthly: [], quarterly: [], drift: {}, variances: [], recalibrations: [] };
  }

  const { monthly, quarterlyTargets, summary } = model;

  // ── Monthly comparison
  const monthlyComparison = monthly.filter(m => m.yearIndex === 0).map((planned, i) => {
    const monthNum = i + 1;
    const year = new Date().getFullYear(); // TODO: make configurable
    const actual = actuals.find(a => a.period.month === monthNum && a.period.year === year);

    if (!actual) return { month: planned.month, monthNum, hasActual: false, planned };

    return {
      month: planned.month, monthNum, hasActual: true,
      planned,
      actual,
      variance: {
        inquiries: computeVariance(planned.monthlyInquiries, actual.funnel?.inquiries),
        mqls: computeVariance(planned.monthlyMQLs, actual.funnel?.mqls),
        sqls: computeVariance(planned.monthlySQLs, actual.funnel?.sqls),
        meetings: computeVariance(planned.monthlyMeetings, actual.funnel?.meetingsHeld),
        sqos: computeVariance(planned.monthlySQOs, actual.funnel?.sqosCreated),
        deals: computeVariance(planned.monthlyDeals, actual.funnel?.dealsWon),
        newARR: computeVariance(planned.monthlyNewARR, actual.revenue?.newLogoARR),
        totalARR: computeVariance(planned.totalARR, actual.revenue?.currentARR),
        pipeline: computeVariance(planned.stage2Pipe, actual.pipeline?.stage2?.value),
      },
    };
  });

  // ── Quarterly aggregation
  const quarterlyComparison = [0,1,2,3].map(qi => {
    const qMonths = monthlyComparison.filter(m => Math.floor((m.monthNum - 1) / 3) === qi);
    const hasAnyActual = qMonths.some(m => m.hasActual);
    if (!hasAnyActual) return { quarter: `Q${qi+1}`, hasActual: false };

    const qPlan = quarterlyTargets[qi];
    const qActualDeals = sumField(qMonths, 'actual.funnel.dealsWon');
    const qActualARR = sumField(qMonths, 'actual.revenue.newLogoARR');
    const qActualSQOs = sumField(qMonths, 'actual.funnel.sqosCreated');
    const qActualInq = sumField(qMonths, 'actual.funnel.inquiries');
    const monthsWithData = qMonths.filter(m => m.hasActual).length;

    return {
      quarter: `Q${qi+1}`, hasActual: true, monthsWithData,
      planned: qPlan,
      actual: { deals: qActualDeals, newARR: qActualARR, sqos: qActualSQOs, inquiries: qActualInq },
      variance: {
        deals: qPlan ? computeVariance(qPlan.dealsTarget, qActualDeals) : null,
        newARR: qPlan ? computeVariance(qPlan.target, qActualARR) : null,
        sqos: qPlan ? computeVariance(qPlan.sqoTarget, qActualSQOs) : null,
      },
      // Run-rate projection
      runRate: monthsWithData > 0 ? {
        projectedDeals: Math.round(qActualDeals / monthsWithData * 3),
        projectedARR: qActualARR / monthsWithData * 3,
        projectedSQOs: Math.round(qActualSQOs / monthsWithData * 3),
      } : null,
    };
  });

  // ── Assumption Drift Detection
  // Compare planned assumptions to observed trailing averages
  const allWithActuals = monthlyComparison.filter(m => m.hasActual);
  const drift = {};

  // Win rate drift
  const totalActualWins = allWithActuals.reduce((s, m) => s + (m.actual.funnel?.dealsWon || 0), 0);
  const totalActualSQOs = allWithActuals.reduce((s, m) => s + (m.actual.funnel?.sqosCreated || 0), 0);
  if (totalActualSQOs > 5) { // need enough data for meaningful rate
    const observedWinRate = totalActualWins / totalActualSQOs * 100;
    drift.winRate = {
      planned: summary.summary ? undefined : model.summary?.sqoToWonRate, // from inputs
      observed: observedWinRate,
      delta: observedWinRate - 30, // TODO: use actual input value
      significant: Math.abs(observedWinRate - 30) > 5,
    };
  }

  // Avg deal size drift
  const allActualARR = allWithActuals.reduce((s, m) => s + (m.actual.revenue?.newLogoARR || 0), 0);
  if (totalActualWins > 3) {
    const observedADS = allActualARR / totalActualWins;
    drift.avgDealSize = {
      observed: observedADS,
      significant: true, // always worth surfacing if data exists
    };
  }

  // Conversion rate drifts
  const totalActualInq = allWithActuals.reduce((s, m) => s + (m.actual.funnel?.inquiries || 0), 0);
  const totalActualMQLs = allWithActuals.reduce((s, m) => s + (m.actual.funnel?.mqls || 0), 0);
  const totalActualSQLs = allWithActuals.reduce((s, m) => s + (m.actual.funnel?.sqls || 0), 0);
  const totalActualMtgs = allWithActuals.reduce((s, m) => s + (m.actual.funnel?.meetingsHeld || 0), 0);

  if (totalActualInq > 50 && totalActualMQLs > 0) {
    drift.inquiryToMql = { observed: totalActualMQLs / totalActualInq * 100, significant: true };
  }
  if (totalActualMQLs > 20 && totalActualSQLs > 0) {
    drift.mqlToSql = { observed: totalActualSQLs / totalActualMQLs * 100, significant: true };
  }
  if (totalActualSQLs > 10 && totalActualMtgs > 0) {
    drift.sqlToMeeting = { observed: totalActualMtgs / totalActualSQLs * 100, significant: true };
  }

  // ── Recalibration Suggestions
  const recalibrations = [];

  if (drift.winRate?.significant) {
    recalibrations.push({
      input: 'sqoToWonRate',
      currentValue: 30, // TODO: from actual inputs
      suggestedValue: Math.round(drift.winRate.observed),
      reason: `Observed trailing win rate: ${drift.winRate.observed.toFixed(1)}%`,
      impact: 'Recalibrating adjusts deal volume and pipeline requirements',
    });
  }

  if (drift.avgDealSize?.significant && drift.avgDealSize.observed) {
    recalibrations.push({
      input: 'avgDealSize',
      suggestedValue: Math.round(drift.avgDealSize.observed / 1000) * 1000,
      reason: `Observed trailing avg deal: $${Math.round(drift.avgDealSize.observed / 1000)}K`,
      impact: 'Recalibrating adjusts deal count required and pipeline targets',
    });
  }

  // ── Variance Verdicts (for governance spine)
  const variances = [];

  // Current quarter assessment
  const currentMonth = new Date().getMonth(); // 0-indexed
  const currentQi = Math.floor(currentMonth / 3);
  const currentQ = quarterlyComparison[currentQi];
  if (currentQ?.hasActual && currentQ.runRate && currentQ.planned) {
    const arrPacing = currentQ.runRate.projectedARR / currentQ.planned.target * 100;
    if (arrPacing < 70) {
      variances.push({
        id: `actuals.q${currentQi+1}_arr_critical`,
        domain: 'forecast', layer: 'agent', severity: 'critical',
        signal: `Q${currentQi+1} ARR pacing at ${arrPacing.toFixed(0)}% of plan — ${currentQ.monthsWithData} of 3 months reported`,
        diagnosis: `Through ${currentQ.monthsWithData} month(s), actual new ARR is $${Math.round(currentQ.actual.newARR/1000)}K against a $${Math.round(currentQ.planned.target/1000)}K quarterly target. Run rate projects $${Math.round(currentQ.runRate.projectedARR/1000)}K — a $${Math.round((currentQ.planned.target - currentQ.runRate.projectedARR)/1000)}K shortfall.`,
        recommendation: `With ${3 - currentQ.monthsWithData} month(s) remaining, closing the gap requires ${((currentQ.planned.target - currentQ.actual.newARR) / (3 - currentQ.monthsWithData) / 1000).toFixed(0)}K/month — ${(((currentQ.planned.target - currentQ.actual.newARR) / (3 - currentQ.monthsWithData)) / (currentQ.actual.newARR / currentQ.monthsWithData) * 100).toFixed(0)}% above current monthly run rate.`,
        affectedModules: ['targets', 'glideslope', 'pipeline'],
        metrics: { current: arrPacing, threshold: 80, target: 100, unit: '% of plan' },
      });
    } else if (arrPacing < 90) {
      variances.push({
        id: `actuals.q${currentQi+1}_arr_warning`,
        domain: 'forecast', layer: 'agent', severity: 'warning',
        signal: `Q${currentQi+1} ARR pacing at ${arrPacing.toFixed(0)}% of plan`,
        diagnosis: `Slightly behind but recoverable. Need to accelerate deal closure in remaining ${3 - currentQ.monthsWithData} month(s).`,
        recommendation: `Focus ACCELERATE motion on late-stage deals. Prioritize deals that can close this quarter.`,
        affectedModules: ['targets', 'pipeline'],
        metrics: { current: arrPacing, threshold: 90, target: 100, unit: '% of plan' },
      });
    }

    // SQO generation pacing
    if (currentQ.variance.sqos) {
      const sqoPacing = currentQ.runRate.projectedSQOs / currentQ.planned.sqoTarget * 100;
      if (sqoPacing < 70) {
        variances.push({
          id: `actuals.q${currentQi+1}_sqo_gap`,
          domain: 'coverage', layer: 'agent', severity: 'warning',
          signal: `Q${currentQi+1} SQO generation at ${sqoPacing.toFixed(0)}% of plan — pipeline for future quarters at risk`,
          diagnosis: `${currentQ.actual.sqos} SQOs created vs ${currentQ.planned.sqoTarget} target. This affects pipeline coverage 2-3 quarters out.`,
          recommendation: `Increase CREATE motion intensity or shift mktg-sourced % higher to compensate.`,
          affectedModules: ['pipeline', 'channels', 'marketing'],
        });
      }
    }
  }

  // Drift verdicts
  if (drift.winRate?.significant && Math.abs(drift.winRate.observed - 30) > 5) {
    const direction = drift.winRate.observed < 30 ? 'below' : 'above';
    variances.push({
      id: 'actuals.drift_winrate',
      domain: 'stage', layer: 'governance', severity: direction === 'below' ? 'warning' : 'info',
      signal: `Observed win rate ${drift.winRate.observed.toFixed(1)}% — ${Math.abs(drift.winRate.observed - 30).toFixed(1)}pp ${direction} plan assumption of 30%`,
      diagnosis: direction === 'below'
        ? `Win rate drift means the plan underestimates deal volume and pipeline required. Every point of win rate decline requires ~${Math.round(100/drift.winRate.observed - 100/30)} more SQOs per 100 deals.`
        : `Win rate is exceeding plan assumptions. The engine is being conservative — actual unit economics are better than projected.`,
      recommendation: `Recalibrate sqoToWonRate to ${Math.round(drift.winRate.observed)}% for realistic projections.`,
      affectedModules: ['funnelHealth', 'pipeline', 'targets'],
    });
  }

  return {
    hasActuals: true,
    monthlyComparison,
    quarterlyComparison,
    drift,
    variances,
    recalibrations,
    periodsWithData: allWithActuals.length,
    latestPeriod: allWithActuals.length > 0 ? allWithActuals[allWithActuals.length - 1].actual.period : null,
  };
}

// ─── HELPERS ───

function computeVariance(planned, actual) {
  if (actual == null || planned == null) return null;
  return {
    planned,
    actual,
    delta: actual - planned,
    pct: planned > 0 ? (actual - planned) / planned * 100 : 0,
    status: Math.abs(actual - planned) / Math.max(1, planned) < 0.1 ? 'on_track'
      : actual >= planned ? 'ahead' : 'behind',
  };
}

function sumField(items, path) {
  return items.reduce((sum, item) => {
    const parts = path.split('.');
    let val = item;
    for (const p of parts) {
      val = val?.[p];
      if (val === undefined || val === null) return sum;
    }
    return sum + (typeof val === 'number' ? val : 0);
  }, 0);
}
