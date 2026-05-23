# Field Audit — Source Data

Source: User-provided SFDC/MAP field best-practices spreadsheet ([Google Sheets, 2026-05-23](https://docs.google.com/spreadsheets/d/1NWpZrG7x6mh8tT50fFqnRQfzyjbY29ITk4NzDyZMYvo)).

This file captures the field inventory that will drive the **Field Audit** module (see [ROADMAP.md §6](./ROADMAP.md#6-field-audit-module--queued-2026-05-23)). When building the module, source field definitions, examples, and notes from here so they stay consistent with the original audit framework.

---

## Contact Object (~30 fields)

All "First Touch" fields should be **locked** and not overridden.
All "Conversion" fields should be **locked** and not overridden.
"Last Touch" fields are **constantly changing** by design.

### First Touch (locked)
- **First Touch Date** — Date stamp of the first touch
- **First Touch Campaign** — First offer/promo (e.g., Webinar, contact sales)
- **First Touch Source** — Marketing channel (Organic, paid search, direct, referral, paid social, organic social, etc.)
- **First Touch Source Detail** — Detail (Google, LinkedIn, Bing, G2, Capterra, Facebook)
- **First Touch Source Detail 2** *(optional, UTM-dependent)* — Keyword/campaign detail
- **First Touch: UTM Campaign**
- **First Touch: UTM Medium**
- **First Touch: UTM Source**
- **First Touch: UTM Content**

### Conversion (locked)
- **Conversion Date** — When the point of conversion (high-intent action like "schedule a demo") occurred
- **Conversion Campaign** — Promo/offer that drove the qualified prospect
- **Conversion Source** — Marketing channel at conversion
- **Conversion Source Detail** — Detail at conversion
- **Conversion Touch: UTM Campaign / Medium / Source / Content**

### Last Touch (continuously updating)
- **Last Touch Date**
- **Last Touch Campaign**
- **Last Touch Source**
- **Last Touch Source Detail**
- **Last Touch Source Detail 2** *(optional)*
- **Last Touch: UTM Campaign / Medium / Source / Content**

### Self-reported attribution & meeting/qual
- **How did you hear about us?** — Required free-text form field
- **Self-Reported Attribution Source** — Grouped/categorized custom field for SRA analysis
- **Meeting booked date** — Mapped from Deal/Opportunity object
- **Unqualified Reason** — Mapped from Deal/Opportunity object (same as closed/lost reason)

---

## Lead Object (SFDC) — note

If using SFDC Lead object:
1. Recommend that all Contact Object fields above be **first** created on the Lead Object.
2. Map them all to the Contact object **upon contact creation** to transfer the data.

(If everything gets converted to Contacts immediately, this becomes a non-issue — but watch for orphan leads.)

---

## Deal / Opportunity Object (~17 fields)

- **Date stamp: Deal Stages** — One date field per stage. Workflow stamps skipped stages with the date of change so no stages are blank.
- **How did you hear about us?** — Copied from Contact
- **Self-Reported Attribution Source** — Copied from Contact
- **Conversion Date** — Mapped from Contact
- **Conversion Campaign** — Map from Contact's most-recent campaign at opp creation
- **Conversion Source** — Same
- **Conversion Source Detail** — Same
- **HIRO Date** — Stage that converts at ≥25%. Date-stamp when deal enters that stage. ([HIRO definition](https://example.com/hiro-definition))
- **UTM fields** *(advanced)* — Map First Touch, Conversion Touch, Last Touch UTM data to the deal object
- **Amount / ARR** — Total deal in annual recurring revenue (note if you track MRR primarily first)
- **Meeting: Booked** — Date when discovery meeting was booked (not the meeting date)
- **Meeting: Attended** — Date meeting was attended (blank if no-show)
- **Meeting: No Show** — Boolean
- **Meeting: Cancelled** — Boolean if cancelled and not rescheduled
- **Working Status** — Has SDR reached out?
- **Working Status: Date** — When SDR reached out
- **Closed Won Reason** — Summarized categorized buckets
- **Closed Won Reason Detail** — Open text
- **Closed Lost Reason** — Summarized categorized buckets
- **Closed Lost Reason Detail** — Open text
- **Require contact role on opp before save** — Associates a person to the opp and maps details across lead → contact → account → opportunity

---

## Campaign Code Taxonomy (example mapping)

Two-part code: `{TYPE}-{SOURCE/PROGRAM}-{DETAIL}` → human-readable Salesforce campaign name.

| Code | Type | Salesforce Name |
|---|---|---|
| `AS-GM-QN` | Appointment Setting | Growth — Quartz Network |
| `LE-CM-A` | In Person Event | Event — CM — Alliance |
| `LE-CM-R` | In Person Event | Event — CM — Regional |
| `LE-FM-BDL` | In Person Event | Event — FM — BD Led |
| `LE-FM-3` | In Person Event | Event — FM — 3rd Party |
| `LE-FM-T` | In Person Event | Event — FM — Tradeshow |
| `AS-OB-BDR` | Appointment Setting | BDR Outbound |
| `PAC-CM-PE` | Partner Training/Relationship | Event — CM — Partner Enablement |
| `MD-GM-UG` | Meeting Driver | Growth — User Gems |
| `VE-BD-C` | Virtual Event | Corporate — Webinar |
| `VE-CM-R` | Virtual Event | Event — CM — Regional |
| `VE-BDL` | Virtual Event | Event — FM — BD Led |
| `VE-FM-3` | Virtual Event | Event — FM — 3rd Party |
| `VE-FM-BDR` | Virtual Event | Event — FM — BDR Meeting Setting |
| `VE-FM-T` | Virtual Event | Event — FM — Tradeshow |
| `VE-GM-W` | Virtual Event | Growth — Webinar |
| `WI-GM-F` | Web Intent | Growth — Form Conversion — Inbound Intent |
| `PS-GM-LIC` | Paid Social | Growth — Conversion — LinkedIn |
| `SEM-GM-GAC` | SEM PPC | Growth — Form Conversion — PPC |
| `WC-GM-F` | Web Content | Growth — Form Conversion — Inbound |
| `PI-GM-ABX` | Programmatic Intent | Growth — ABX Conversion — Intent |

Content categories: `In Person Event`, `Digital`, `Meeting Driver`, `Partner Training/Relationship`, `Social`, `Virtual Event`, `Webform`, `Webinar`.

---

## Software Attribution — MAP → SFDC flow

| Field | Triggered By | Example | Populated via Workflow | Field Type |
|---|---|---|---|---|
| Lead Source | Upon Record Creation | Paid Social | Original Source if mapped; workflow for other values (Events) | Standard |
| Lead Source Detail | Upon Record Creation | LinkedIn | Original Source Drill Down 1 | Custom |
| Most Recent Lead Source | Most Recent Engagement | Direct Traffic | Latest Source if mapped | Custom |
| Most Recent Lead Source Detail | Most Recent Engagement | amplience.com | Latest Source Drill Down 1 | Custom |
| MQL Source | Lead Score = 100 | Direct Traffic | `{{lead.Most Recent Lead Source}}` | Custom |
| MQL Source Detail | Lead Score = 100 | amplience.com | `{{lead.Most Recent Source Detail}}` | Custom |

---

## Source / Drill-down hierarchy

| Original or Latest source | Drill-down 1 | Drill-down 2 |
|---|---|---|
| Organic search | Search term (if available) | Search engine site |
| Referrals | Referring website domain | Referring website URL |
| Organic social | Social media site | Campaign name |
| Email marketing | Campaign name | HubSpot email name |
| Paid search | Campaign name | Search term (if available) |
| Paid social | Social media site | Campaign name |
| Direct traffic | Entrance URL | N/A |
| Other campaigns | Campaign name | Source / Medium |
| Offline sources | Offline channel/tool (IMPORT, SALES, API, BATCH_UPDATE, CONTACTS_WEB, MOBILE_IOS, SALESFORCE, BOT, MEETING, EXTENSION, PRESENTATIONS) | Specific medium (BCC_TO_CRM, business-card-scanner, CRM_UI, salesforce-createdby, addMessageUser, addViewer) |

---

## HubSpot Automation — Original vs Latest

| Field | Behavior | Editability |
|---|---|---|
| Original Source | HubSpot tracks visitor before they're a contact. Set on the *first* known source. | **Not editable** — set once |
| Original Source Drill Down 1 | Context for the source (Twitter, Facebook, "Import", marketing campaign name) | **Not editable** — set once |
| Original Source Drill Down 2 | Most specific context (URL, import filename, email name) | **Not editable** — set once |
| Latest Source | Updates each time | Updates every time |
| Latest Source Drill Down 1 | Updates each time | Updates every time |
| Latest Source Drill Down 2 | Updates each time | Updates every time |

The "set once" vs "updates every time" distinction is critical — most teams conflate these and end up with attribution noise.
