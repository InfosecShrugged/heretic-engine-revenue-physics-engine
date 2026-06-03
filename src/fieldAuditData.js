// Field Audit — 47-field SFDC/HubSpot attribution + pipeline hygiene checklist.
// Source: docs/FIELD-AUDIT-SOURCE.md (user-supplied Google Sheet, captured 2026-05-23).
// Spec: docs/ROADMAP.md §6.
//
// Weight tiers (load-bearing for downstream OpptyCon math):
//   3 = critical — model gives garbage without this
//   2 = important — significant impact on attribution / pipeline math
//   1 = standard — nice-to-have, doesn't break the engine on its own
//
// Each field has a `consequence` string naming what breaks in OpptyCon when missing.

export const FIELD_AUDIT = {
  contact: {
    label: "Contact Object",
    desc: "Attribution + identity fields on the lead/contact. First-touch and conversion fields should be locked; last-touch fields update continuously.",
    color: "accent",
    fields: [
      // First Touch (locked) — anchors marketing-sourced attribution
      { id: "ft_date",      label: "First Touch Date",                 weight: 3, locked: true,  definition: "Date stamp of the first touch", example: "—", note: "Locked, never override", consequence: "Without first-touch dates, you can't attribute pipeline back to a specific marketing campaign or compute time-to-conversion." },
      { id: "ft_campaign",  label: "First Touch Campaign",             weight: 2, locked: true,  definition: "First offer/promo that brought the contact into the CRM", example: "Webinar, contact sales", note: "Locked, never override", consequence: "Campaign-level ROI math is impossible." },
      { id: "ft_source",    label: "First Touch Source",               weight: 3, locked: true,  definition: "Marketing channel that brought the contact in", example: "Organic, paid search, direct, referral, paid social, organic social", note: "Locked. HubSpot's Original Source is the equivalent OOTB.", consequence: "Cost-per-source math (the entire Marketing Plan inverse waterfall) is unreliable." },
      { id: "ft_source_d1", label: "First Touch Source Detail",        weight: 2, locked: true,  definition: "Detail of the marketing channel", example: "Google, LinkedIn, Bing, G2, Capterra, Facebook", note: "Locked, never override", consequence: "Can't decompose channel performance (e.g., LinkedIn vs Google organic)." },
      { id: "ft_source_d2", label: "First Touch Source Detail 2 (optional)", weight: 1, locked: true,  definition: "Keyword / campaign-specific detail", example: "Paid search keywords, paid social UTM content", note: "Optional, depends on UTM structure", consequence: "Limits keyword-level attribution but not load-bearing for the engine." },
      { id: "ft_utm_campaign", label: "First Touch: UTM Campaign",     weight: 2, locked: true,  definition: "Stored utm_campaign from the first touch link", example: "—", note: "Locked", consequence: "Campaign-level inbound attribution is broken." },
      { id: "ft_utm_medium",   label: "First Touch: UTM Medium",       weight: 2, locked: true,  definition: "Stored utm_medium from the first touch link", example: "—", note: "Locked", consequence: "Medium-level attribution (email vs cpc vs organic) is broken." },
      { id: "ft_utm_source",   label: "First Touch: UTM Source",       weight: 3, locked: true,  definition: "Stored utm_source from the first touch link", example: "—", note: "Locked", consequence: "Source-level attribution — the most important UTM field — is broken." },
      { id: "ft_utm_content",  label: "First Touch: UTM Content",      weight: 1, locked: true,  definition: "Stored utm_content from the first touch link", example: "—", note: "Locked", consequence: "Limits A/B test attribution; not load-bearing." },

      // Conversion (locked) — anchors high-intent conversion attribution
      { id: "cv_date",      label: "Conversion Date",                  weight: 3, locked: true,  definition: "When the high-intent conversion happened (e.g., 'schedule a demo')", example: "—", note: "Identify the conversion per Pipeline Source. Locked.", consequence: "Pipeline source attribution + sales-cycle math is impossible." },
      { id: "cv_campaign",  label: "Conversion Campaign",              weight: 2, locked: true,  definition: "Promo/offer that drove the qualified meeting", example: "Schedule a demo, contact sales", note: "Locked", consequence: "Can't separate 'what got them in' from 'what got them to convert.'" },
      { id: "cv_source",    label: "Conversion Source",                weight: 3, locked: true,  definition: "Marketing channel at point of conversion", example: "Organic, paid search, direct, referral, paid social, organic social", note: "Locked", consequence: "Conversion-source ROI is undecidable." },
      { id: "cv_source_d1", label: "Conversion Source Detail",         weight: 2, locked: true,  definition: "Detail of the conversion channel", example: "Google, LinkedIn, Bing, G2, Capterra, Facebook", note: "Locked", consequence: "Can't decompose conversion channel performance." },
      { id: "cv_utm_campaign", label: "Conversion Touch: UTM Campaign", weight: 2, locked: true, definition: "Stored utm_campaign at conversion", example: "—", note: "Locked", consequence: "Conversion campaign attribution is broken." },
      { id: "cv_utm_medium",   label: "Conversion Touch: UTM Medium",  weight: 2, locked: true, definition: "Stored utm_medium at conversion", example: "—", note: "Locked", consequence: "Conversion medium attribution is broken." },
      { id: "cv_utm_source",   label: "Conversion Touch: UTM Source",  weight: 3, locked: true, definition: "Stored utm_source at conversion", example: "—", note: "Locked", consequence: "Conversion source attribution — load-bearing — is broken." },
      { id: "cv_utm_content",  label: "Conversion Touch: UTM Content", weight: 1, locked: true, definition: "Stored utm_content at conversion", example: "—", note: "Locked", consequence: "Limits conversion A/B tracking; not load-bearing." },

      // Last Touch (updates continuously) — for recent-engagement attribution
      { id: "lt_date",      label: "Last Touch Date",                  weight: 1, locked: false, definition: "Date stamp of the most recent touch", example: "—", note: "Constantly changing by design", consequence: "Engagement recency analysis weakens." },
      { id: "lt_campaign",  label: "Last Touch Campaign",              weight: 1, locked: false, definition: "Last offer/promo the contact engaged with", example: "Webinar, contact sales", note: "Constantly changing", consequence: "Recent-campaign signal is lost." },
      { id: "lt_source",    label: "Last Touch Source",                weight: 2, locked: false, definition: "Channel that drove the contact's last activity", example: "Organic, paid search, direct, referral, paid social, organic social", note: "Constantly changing", consequence: "Re-engagement attribution is broken." },
      { id: "lt_source_d1", label: "Last Touch Source Detail",         weight: 1, locked: false, definition: "Detail of the last-touch channel", example: "—", note: "Constantly changing", consequence: "Limits re-engagement decomposition." },
      { id: "lt_source_d2", label: "Last Touch Source Detail 2 (optional)", weight: 1, locked: false, definition: "Keyword / campaign detail at last touch", example: "—", note: "Optional, UTM-dependent", consequence: "Marginal — not load-bearing." },
      { id: "lt_utm_campaign", label: "Last Touch: UTM Campaign",      weight: 1, locked: false, definition: "Stored utm_campaign at last touch", example: "—", note: "Constantly changing", consequence: "Recent-campaign signal weakened." },
      { id: "lt_utm_medium",   label: "Last Touch: UTM Medium",        weight: 1, locked: false, definition: "Stored utm_medium at last touch", example: "—", note: "Constantly changing", consequence: "Recent-medium signal weakened." },
      { id: "lt_utm_source",   label: "Last Touch: UTM Source",        weight: 2, locked: false, definition: "Stored utm_source at last touch", example: "—", note: "Constantly changing", consequence: "Re-engagement source attribution is broken." },
      { id: "lt_utm_content",  label: "Last Touch: UTM Content",       weight: 1, locked: false, definition: "Stored utm_content at last touch", example: "—", note: "Constantly changing", consequence: "Marginal — not load-bearing." },

      // Self-reported attribution
      { id: "hdyhau",       label: "How did you hear about us?",       weight: 2, locked: true,  definition: "Required free-text form field on inbound forms", example: "—", note: "Locked. Required on inbound forms.", consequence: "Lose the ground-truth signal that catches what UTMs miss (word-of-mouth, podcast, etc.)." },
      { id: "sra_source",   label: "Self-Reported Attribution Source", weight: 2, locked: true,  definition: "Custom field that buckets HDYHAU free-text into analyzable categories", example: "—", note: "Locked. Workflow categorizes HDYHAU free text.", consequence: "HDYHAU stays unanalyzable free text without bucketing." },

      // Cross-object reference fields
      { id: "meeting_booked_date", label: "Meeting booked date",       weight: 2, locked: false, definition: "Date the first meeting was booked. Mapped from Deal/Opportunity object.", example: "—", note: "Cross-object reference", consequence: "Cycle-time math from contact creation to meeting is broken." },
      { id: "unqualified_reason",  label: "Unqualified Reason",        weight: 1, locked: false, definition: "Why the contact was disqualified. Same buckets as closed-lost on opp.", example: "—", note: "Cross-object reference", consequence: "Lose visibility into why contacts don't progress." },
    ],
  },

  deal: {
    label: "Deal / Opportunity Object",
    desc: "Pipeline + outcome fields on the deal. Stage date stamps, meeting tracking, working status, closed-reason fields — load-bearing for velocity and forecast math.",
    color: "violet",
    fields: [
      { id: "stage_dates",     label: "Date stamp: Deal Stages",           weight: 3, locked: false, definition: "Date field per stage. Workflow stamps skipped stages with the date of change so none are blank.", example: "Date Stamp: Stage 1, Date Stamp: Stage 2, ...", note: "Per-stage date fields with skip handling", consequence: "Velocity-by-stage analysis is impossible. The Velocity module's median-days-per-stage math runs on these." },
      { id: "deal_hdyhau",     label: "How did you hear about us? (deal)", weight: 2, locked: false, definition: "Copied from Contact object to the Deal/Opp", example: "—", note: "Cross-object copy", consequence: "Lose attribution context at the deal level." },
      { id: "deal_sra_source", label: "Self-Reported Attribution (deal)",  weight: 2, locked: false, definition: "Copied from Contact object to the Deal/Opp", example: "—", note: "Cross-object copy", consequence: "Lose ground-truth attribution at the deal level." },
      { id: "deal_cv_date",    label: "Conversion Date (deal)",            weight: 3, locked: false, definition: "Mapped from Contact object's conversion date", example: "—", note: "Source-of-truth = contact", consequence: "Sales-cycle math from conversion to close is broken." },
      { id: "deal_cv_campaign", label: "Conversion Campaign (deal)",       weight: 2, locked: false, definition: "Map the contact's conversion campaign to the deal at opp creation", example: "—", note: "At opp-creation time, most recent campaign", consequence: "Deal-level campaign ROI is undecidable." },
      { id: "deal_cv_source",   label: "Conversion Source (deal)",         weight: 3, locked: false, definition: "Map the contact's conversion source to the deal", example: "—", note: "Source-of-truth = contact", consequence: "Deal-level source ROI is undecidable." },
      { id: "deal_cv_source_d1", label: "Conversion Source Detail (deal)", weight: 2, locked: false, definition: "Map the conversion source detail to the deal", example: "—", note: "Source-of-truth = contact", consequence: "Deal-level source decomposition is broken." },
      { id: "intent_stage_date", label: "High-Intent Stage Date",           weight: 3, locked: false, definition: "Date the deal entered the stage that converts at ≥25%. Date-stamped via workflow.", example: "—", note: "Pick the high-intent stage based on actual stage-level conversion rates — the ≥25%-conversion stage is the real-intent signal", consequence: "Without it, you can't compute Stage 1 → Won probability — your Pipeline Coverage is directional only, not a forecast." },
      { id: "deal_utm",        label: "UTM fields on deal (advanced)",     weight: 1, locked: false, definition: "Map First Touch / Conversion / Last Touch UTM data to the deal object too", example: "—", note: "Advanced — not required for v1 attribution", consequence: "Marginal. Easier deal-level UTM reporting but not load-bearing." },
      { id: "amount_arr",      label: "Amount / ARR",                       weight: 3, locked: false, definition: "Total amount of the deal in annual recurring revenue", example: "—", note: "Note if you track MRR primarily first", consequence: "Without ARR, no LTV, no ARR target tracking, no Magic Number. Engine is unusable." },
      { id: "meeting_set_date", label: "Meeting: Booked",                  weight: 2, locked: false, definition: "Date the discovery meeting was BOOKED (not the meeting date itself)", example: "—", note: "Action date, not occurrence date", consequence: "Lose the meeting-booked-to-meeting-held funnel gate." },
      { id: "meeting_held_date", label: "Meeting: Attended",               weight: 2, locked: false, definition: "Date the meeting was ATTENDED (blank if no-show)", example: "—", note: "Action date when attended", consequence: "Show-rate analysis is impossible." },
      { id: "meeting_no_show", label: "Meeting: No Show",                  weight: 1, locked: false, definition: "Boolean — initial meeting was a no-show", example: "—", note: "—", consequence: "Lose no-show tracking — ~20% gap between booked and held is normal." },
      { id: "meeting_cancelled", label: "Meeting: Cancelled",              weight: 1, locked: false, definition: "Boolean — meeting was cancelled and not rescheduled", example: "—", note: "—", consequence: "Lose cancellation tracking." },
      { id: "working_status",  label: "Working Status",                    weight: 1, locked: false, definition: "Has SDR/AE reached out?", example: "—", note: "—", consequence: "SDR follow-up rate is unmeasurable." },
      { id: "working_date",    label: "Working Status: Date",              weight: 1, locked: false, definition: "When the SDR/AE reached out", example: "—", note: "Pairs with Working Status", consequence: "Time-to-first-touch is unmeasurable." },
      { id: "cw_reason",       label: "Closed Won Reason",                 weight: 2, locked: false, definition: "Summarized bucket capturing why the deal closed-won", example: "Price, fit, product gap closure, etc.", note: "Categorical from common keywords", consequence: "Win-pattern analysis is impossible." },
      { id: "cw_reason_detail", label: "Closed Won Reason Detail",         weight: 1, locked: false, definition: "Open text for closed-won detail", example: "—", note: "Pairs with the summary field", consequence: "Lose narrative context behind wins." },
      { id: "cl_reason",       label: "Closed Lost Reason",                weight: 3, locked: false, definition: "Summarized bucket for closed-lost (typically ~6 categories)", example: "Price, no decision, lost to competitor, product gap, etc.", note: "Required on close. Quarterly readout.", consequence: "Lost-pattern analysis is impossible — biggest blind spot for product + GTM iteration." },
      { id: "cl_reason_detail", label: "Closed Lost Reason Detail",        weight: 1, locked: false, definition: "Open text for closed-lost detail", example: "—", note: "Pairs with the summary field", consequence: "Lose narrative context behind losses." },
      { id: "require_contact_role", label: "Require contact role on opp before save", weight: 2, locked: false, definition: "Forces a contact role association on every opp", example: "—", note: "Validation rule in SFDC", consequence: "Contact-to-opp links break; multi-threading analysis is unreliable." },
    ],
  },
};

// Compute weighted score across all fields in an object.
// Status: 'yes' = 100% credit, 'partial' = 50%, 'no'/'unknown'/undefined = 0%.
export function scoreObject(fields, answers) {
  const total = fields.reduce((s, f) => s + f.weight, 0);
  const earned = fields.reduce((s, f) => {
    const a = answers[f.id];
    if (a === 'yes') return s + f.weight;
    if (a === 'partial') return s + f.weight * 0.5;
    return s;
  }, 0);
  const pct = total > 0 ? (earned / total) * 100 : 0;
  return { earned: Math.round(earned * 10) / 10, total, pct };
}

export function gradeFromPct(pct) {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

// Top-N missing/partial fields sorted by weight (biggest score jumps if fixed)
export function topFixes(answers, n = 8) {
  const all = Object.entries(FIELD_AUDIT).flatMap(([objKey, obj]) =>
    obj.fields.map(f => ({ ...f, objKey, objLabel: obj.label }))
  );
  const fixable = all.filter(f => {
    const a = answers[f.id];
    return a === 'no' || a === 'partial' || a === 'unknown' || !a;
  });
  // Sort: highest weight first, then alphabetical for tie-break
  fixable.sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label));
  return fixable.slice(0, n);
}

// Confidence — how many fields the user has actually answered (non-unknown, non-undefined)
export function answeredCount(answers) {
  const all = Object.values(FIELD_AUDIT).flatMap(o => o.fields);
  return {
    answered: all.filter(f => {
      const a = answers[f.id];
      return a && a !== 'unknown';
    }).length,
    total: all.length,
  };
}
