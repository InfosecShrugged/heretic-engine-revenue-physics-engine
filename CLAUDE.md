# CLAUDE.md — NetherOps Project Instructions

## Project Overview

**NetherOps** builds tools and frameworks for governed revenue operations. The methodology is the **Governed Revenue Architecture (GRA)**. The primary product is **OpptyCon** — an interactive revenue simulation and governance control surface.

## Naming

- **Company**: NetherOps (cap N, cap O, one word)
- **Product**: OpptyCon (cap O, cap C, one word)
- **Methodology**: Governed Revenue Architecture (GRA)
- **Legacy names (never use)**: heretics, heretics.io, Revenue Physics Engine, Heretic Engine

## Repos

| Repo | Purpose | Stack | Deploy |
|------|---------|-------|--------|
| `netherops-site` | Marketing/content site | Static HTML/CSS/JS | Netlify |
| `opptycon` | Revenue simulation engine | React/Vite/Tailwind | Built → netherops-site/tools/opptycon/ |

## Design System: Three-Mode Dual Accent

Live reference: `app.heretics.io/design-system/opptycon` (light+dark toggle).

### The Accent Rule

```
Light surfaces → Rose #D64074 for TEXT accents, links, borders
Light surfaces → Lime #C8FF6E for FILLS, badges, dots, buttons
Dark surfaces  → Lime #C8FF6E for EVERYTHING
Dark surfaces  → Rose #D64074 for governance alerts / constraint breaches ONLY
Lime NEVER appears as text on light backgrounds (1.5:1 contrast — fails)
```

### Fonts

- **Display**: TWK Everett — self-hosted `.otf` (300/400/700)
- **Functional**: Chivo Mono — Google Fonts. All labels, CTAs, tags, nav
- CSS: `--font-display: 'TWK Everett', 'Helvetica Neue', Helvetica, Arial, sans-serif;`
- CSS: `--font-mono: 'Chivo Mono', 'Space Mono', 'Courier New', monospace;`

### Theme Tokens (src/tokens.js)

OpptyCon supports light and dark themes. The active theme is stored in module-level `let C` and swapped via `setC(mode)`. Import from `./tokens`:

```javascript
import { lightTheme, darkTheme, fonts, shadows } from './tokens';
```

**Light theme** — Rose accent for text, lime for fills:
```javascript
{ bg: '#EBEBEB', bgAlt: '#F4F4F2', surface: '#FFFFFF',
  accent: '#D64074', lime: '#C8FF6E',
  green: '#1A8A4A', amber: '#C07800', red: '#CC3340',
  blue: '#2563EB', violet: '#7C4DDB',
  text: '#111111', muted: '#555555', dim: '#909090',
  border: 'rgba(0,0,0,0.07)', borderMid: 'rgba(0,0,0,0.13)',
  chart: ['#D64074','#2563EB','#1A8A4A','#7C4DDB','#C07800','#0891B2'] }
```

**Dark theme** — Lime accent for everything, rose for governance alerts only:
```javascript
{ bg: '#0F0F0F', bgAlt: '#171717', surface: '#1C1C1C',
  accent: '#C8FF6E', lime: '#C8FF6E', rose: '#D64074',
  green: '#2ECC71', amber: '#F0A030', red: '#E74C3C',
  blue: '#4A90D9', violet: '#8B5CF6',
  text: '#F5F5F3', muted: '#AAAAAA', dim: '#666666',
  border: 'rgba(255,255,255,0.06)', borderMid: 'rgba(255,255,255,0.10)',
  chart: ['#C8FF6E','#4A90D9','#2ECC71','#8B5CF6','#F0A030','#D64074'] }
```

### Rules

1. TWK Everett weight 300 for headlines, 400 for body
2. Chivo Mono does ALL functional text — always uppercase for labels/CTAs
3. Rose is the text accent on light. Lime is the fill accent on light. Lime does everything on dark.
4. Ground is warm gray `#EBEBEB` (light) or `#0F0F0F` (dark), never pure white
5. Borders use rgba, not hex
6. Lime NEVER as text on light backgrounds
7. Tags are pill-shaped with optional 5px status dots
8. Semantic colors are brighter on dark backgrounds (Albers principle)

## Build & Deploy

```bash
# Build OpptyCon
cd opptycon && npm install && npm run build

# Deploy to site
cd ../netherops-site
rm -rf tools/opptycon && mkdir -p tools/opptycon
cp -r ../opptycon/dist/* tools/opptycon/
git add -A && git commit -m "Update OpptyCon" && git push
```

Vite config must set `base: '/tools/opptycon/'`.

## Architecture Philosophy

- Governance over observation — show control mechanisms, not dashboards
- Constraint cascades — P&L → governance → agents → execution
- Closed-loop feedback — every output traceable to an input
- Four-band model: Constraints → Governance → Agents → Execution

## Font References to Replace

| Old | New |
|-----|-----|
| `'Oxanium'` | `'TWK Everett'` |
| `'Space Mono'` | `'Chivo Mono'` |
| `'DM Mono'` | `'Chivo Mono'` |
| `'DM Sans'` | `'TWK Everett'` |
