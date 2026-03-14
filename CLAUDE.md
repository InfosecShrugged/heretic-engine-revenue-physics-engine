# OpptyCon — Project Instructions for Claude Code

## What This Repo Is

**OpptyCon** is a revenue physics engine — an interactive GTM planning tool that models pipeline generation, cost structures, funnel physics, and coverage math across multi-year horizons. React + Vite + Tailwind CSS.

- **GitHub:** `netherops/opptycon` *(rename from heretic-engine-revenue-physics-engine pending)*
- **Live:** Netlify — `npm run build` → auto-deploy from `main`
- **Stack:** React 18 + Vite 5 + Tailwind CSS 3
- **Charts:** Recharts
- **Animations:** Framer Motion

### Related repos (DO NOT CONFUSE)

| Repo | What it is | Design system |
|------|-----------|---------------|
| `netherops/opptycon` | This repo — the app | OpptyCon DS (light + dark) |
| `netherops/netherops-site` | Marketing site (static HTML) | NetherOps DS (light-only) |
| `heretics-ops/BigFilter-GTM` | Separate project — NOT this. Do not reference. | BigFilter DS (separate) |

---

## Design System — OpptyCon (Dual-Mode Profile)

> **CRITICAL: This app uses the OpptyCon design system, which is derived from the NetherOps design language. NOT BigFilter. NOT Syne/DM Sans/IBM Plex Mono. NOT orange #E85D2A or #ff6e3e. If you see these anywhere, they are WRONG.**

### The Three-Mode Dual Accent Rule

```
MEMORIZE THIS:

Light surfaces → Rose #D64074 for TEXT accents, links, borders
Light surfaces → Lime #C8FF6E for FILLS, badges, dots, buttons, highlights
Dark surfaces  → Lime #C8FF6E for EVERYTHING (text, links, fills, badges, buttons)
Dark surfaces  → Rose #D64074 for GOVERNANCE ALERTS ONLY (CAC breach, coverage violation, margin warning)

Lime NEVER appears as text on light backgrounds (1.5:1 contrast — fails WCAG)
```

The accent logic INVERTS between modes. On light, rose is the text accent and lime is the fill accent. On dark, lime takes over everything and rose narrows to governance constraint violations only.

### Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / Headings | **TWK Everett** | 400 | Negative letter-spacing |
| Metric values | **TWK Everett** | 300 (Light) | Thin = precision |
| Body text | **TWK Everett** | 400 | |
| Module labels | **Chivo Mono** | 500 | Uppercase, 0.08–0.12em tracking |
| Data / numbers | **Chivo Mono** | 400 | Tabular figures |
| Small labels | **Chivo Mono** | 500 | 9–10px, uppercase |

Font files at `/public/fonts/`. Chivo Mono via Google Fonts CDN.

**DO NOT USE:** Syne, DM Sans, IBM Plex Mono, Oxanium, Space Mono

### Token System (`src/tokens.js`)

The app exports `lightTheme` and `darkTheme` objects. Import and select based on mode:

```js
import { lightTheme, darkTheme, fonts } from './tokens';

const C = mode === 'dark' ? darkTheme : lightTheme;
```

#### Light Theme Tokens

```
Surfaces:     bg #EBEBEB · bgAlt #F4F4F2 · surface #FFFFFF · surfaceHover #F8F8F6
Borders:      rgba(0,0,0,0.07) / 0.13 / 0.22
Text:         text #111111 · muted #555555 · dim #909090 · ghost #C4C4C4
Accent:       accent #D64074 (rose) · accentHover #C23668
Lime:         lime #C8FF6E · limeDark #9BE040
Semantic:     green #1A8A4A · amber #C07800 · red #CC3340 · blue #2563EB · violet #7C4DDB
Chart order:  ['#D64074','#2563EB','#1A8A4A','#7C4DDB','#C07800','#0891B2']  ← rose-led
```

#### Dark Theme Tokens

```
Surfaces:     bg #0F0F0F · bgAlt #171717 · surface #1C1C1C · surfaceHover #252525
Borders:      rgba(255,255,255,0.06) / 0.10 / 0.18
Text:         text #F5F5F3 · muted #AAAAAA · dim #666666 · ghost #444444
Accent:       accent #C8FF6E (lime!) · accentHover #9BE040
Rose:         rose #D64074 (governance alerts ONLY)
Semantic:     green #2ECC71 · amber #F0A030 · red #E74C3C · blue #4A90D9 · violet #8B5CF6
Chart order:  ['#C8FF6E','#4A90D9','#2ECC71','#8B5CF6','#F0A030','#D64074']  ← lime-led
```

**Key difference:** `C.accent` is ROSE on light, LIME on dark. Code that uses `C.accent` automatically gets the right color per mode.

#### Shadows

```
Light:  card    → 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
        elevated → 0 4px 16px rgba(0,0,0,0.08)

Dark:   card     → 0 1px 3px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.12)
        elevated → 0 4px 16px rgba(0,0,0,0.30)
        glow     → 0 0 40px rgba(200,255,110,0.10)
```

### Semantic Color Usage

```jsx
// Positive metrics (coverage passing, growth)
style={{ color: C.green }}
style={{ background: C.greenDim, color: C.green }}

// Warning (at ceiling, approaching threshold)
style={{ color: C.amber }}
style={{ background: C.amberDim, color: C.amber }}

// Negative (breach, decline, over budget)
style={{ color: C.red }}
style={{ background: C.redDim, color: C.red }}

// Informational
style={{ color: C.blue }}

// Special category (drivers panel)
style={{ color: C.violet }}
```

### Chart Colors

Always use `C.chart` for Recharts series. The array reorders per mode:
- Light: rose-led `['#D64074','#2563EB','#1A8A4A','#7C4DDB','#C07800','#0891B2']`
- Dark: lime-led `['#C8FF6E','#4A90D9','#2ECC71','#8B5CF6','#F0A030','#D64074']`

**NEVER use these in charts:** `#111111` (black — invisible on dark), olive/brown/muddy tones, low-opacity `rgba()` for bar fills.

### Logo

```jsx
<img
  src={mode === 'dark' ? '/netherops-logo-inv.svg' : '/netherops-logo-black.svg'}
  alt="NetherOps"
  style={{ height: 24 }}
/>
```

### Border Radii

| Token | Value |
|-------|-------|
| sm | 6px |
| md | 10px |
| lg | 14px |
| xl | 20px |
| full | 9999px |

### Spacing Scale

xs: 4 · sm: 8 · md: 16 · lg: 24 · xl: 32 · 2xl: 48 · 3xl: 64 · 4xl: 96

---

## Accent Usage Cheat Sheet

### Rose on light (text/links/borders):
```jsx
style={{ color: C.accent }}              // Section labels, active nav
style={{ borderColor: C.accent }}        // Card hover border
```

### Lime on light (fills only — NEVER as text):
```jsx
style={{ background: C.lime, color: '#111' }}           // Badge/pill
style={{ background: C.lime, color: '#111' }}           // Button
style={{ background: C.limeDim }}                       // Highlight tint
style={{ borderTop: `2px solid ${C.lime}` }}            // Card accent
style={{ width: 6, height: 6, borderRadius: '50%', background: C.lime }}  // Status dot
```

### Lime on dark (everything):
```jsx
style={{ color: C.accent }}              // C.accent IS lime in dark mode
style={{ background: C.accent, color: '#111' }}  // Button
style={{ color: C.accent, border: `1px solid ${C.accentDim}` }}  // Tag
```

### Rose on dark (governance constraints ONLY):
```jsx
style={{ color: C.rose }}                // CAC breach
style={{ background: C.roseDim, color: C.rose }}  // Constraint badge
```

---

## App Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/tokens.js` | Design system constants — lightTheme, darkTheme, fonts, radii, spacing, shadows |
| `src/engine.js` | Revenue computation model — `computeModel()` |
| `src/App.jsx` | Main UI (~5000+ lines with inline styles) |
| `tailwind.config.js` | Tailwind theme extensions |
| `vite.config.js` | Vite config — `base` path matters for subdirectory serving |

### Theme System

```jsx
const [mode, setMode] = useState(() => {
  const saved = localStorage.getItem('opptycon-theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});
const C = mode === 'dark' ? darkTheme : lightTheme;

function toggleTheme() {
  const next = mode === 'dark' ? 'light' : 'dark';
  setMode(next);
  localStorage.setItem('opptycon-theme', next);
}
```

Default mode is **dark** — it's the primary working mode for the tool.

### OpptyCon Features

- Dual-axis cost model (fixed vs variable S&M)
- Pipeline targets with coverage ratio enforcement
- Phase-shifted funnel (Q4 marketing generates Q1 pipeline)
- Multi-year scope (24+ months for carry-over effects)
- Attrition modeling
- Marketing-sourced vs sales-sourced split
- Monthly weight distributions for demand timing

---

## Development Patterns

- **Iterative edits over wholesale replacements.** Use targeted `str_replace` for App.jsx — it's huge. Never rewrite the whole file.
- **Inline styles with token references.** Most styling is inline using `C.xxx` from tokens.js.
- **Recharts** for all charts. Use `C.chart` array for series colors.
- **Framer Motion** for animations.
- **Tailwind** for utility classes where used, but most component styling is inline.
- **`base` in vite.config.js** must match the subdirectory if the built output is served from a subpath on the marketing site.

### Build & Deploy

```bash
npm run build    # Vite builds to dist/
# Netlify auto-deploys from main
```

For embedding in the marketing site:
```bash
npm run build
cp -r dist/* ../netherops-site/tools/revenue-physics-engine/
```

---

## Tailwind Config

```js
colors: {
  nether: {
    bg: '#EBEBEB',
    surface: '#F4F4F2',
    card: '#FFFFFF',
    border: 'rgba(0,0,0,0.13)',
    borderLight: 'rgba(0,0,0,0.07)',
    rose: '#D64074',
    roseHover: '#C23668',
    roseDim: 'rgba(214,64,116,0.08)',
    lime: '#C8FF6E',
    limeDark: '#9BE040',
    limeDim: 'rgba(200,255,110,0.12)',
    green: '#1A8A4A',
    amber: '#C07800',
    red: '#CC3340',
    violet: '#7C4DDB',
    blue: '#2563EB',
    text: '#111111',
    muted: '#555555',
    dim: '#909090',
  },
},
fontFamily: {
  sans: ['TWK Everett', 'Helvetica Neue', 'system-ui', 'sans-serif'],
  display: ['TWK Everett', 'Helvetica Neue', 'system-ui', 'sans-serif'],
  mono: ['Chivo Mono', 'Space Mono', 'monospace'],
},
```

---

## What NOT To Reference

These are from a DIFFERENT project (BigFilter) or outdated instructions. Do NOT use:

| Wrong | Correct |
|-------|---------|
| BigFilter design system | OpptyCon / NetherOps design system |
| Syne (font) | TWK Everett |
| DM Sans (font) | TWK Everett |
| IBM Plex Mono (font) | Chivo Mono |
| Oxanium (font) | TWK Everett |
| Space Mono (font) | Chivo Mono |
| `#E85D2A` (orange accent) | `#D64074` (rose) + `#C8FF6E` (lime) |
| `#ff6e3e` (old orange) | `#D64074` (rose) + `#C8FF6E` (lime) |
| `#f0f0f0` (old bg) | `#EBEBEB` (light) / `#0F0F0F` (dark) |
| `#f8f8f8` (old surface) | `#F4F4F2` (light) / `#171717` (dark) |
| `#1a1918` (old text) | `#111111` (light) / `#F5F5F3` (dark) |
| `#d9d9d9` (old border) | `rgba(0,0,0,0.13)` (light) / `rgba(255,255,255,0.10)` (dark) |
| `#2d8a56` (old green) | `#1A8A4A` (light) / `#2ECC71` (dark) |
| `#d42e4a` (old rose) | `#CC3340` (semantic red) |
| "heretics" brand references | "NetherOps" / "OpptyCon" |
