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

## Design System: BigFilter · Signal Architecture

Source: `bigfilter-design-system.html`. Derived from scorecard.io.

### Fonts

- **Display**: TWK Everett Light (300) — self-hosted `.otf` via `@font-face`
- **Functional**: Chivo Mono — Google Fonts. All labels, CTAs, tags, nav, code
- CSS: `--font-display: 'TWK Everett', 'Helvetica Neue', sans-serif;`
- CSS: `--font-mono: 'Chivo Mono', 'Space Mono', monospace;`

### Colors

- **Ground**: `#EBEBEB` (warm light gray — NOT white, NOT cool gray)
- **Surface**: `#F4F4F2` · Cards/white: `#FFFFFF` · Raised/hover: `#E2E2DF`
- **Ink**: `#111111` primary · `#555555` mid · `#909090` muted
- **Inverse**: `#0F0F0F` bg · `#F5F5F3` text · `#AAAAAA` mid
- **Accent**: `#111111` (black CTA) · `#C8FF6E` (lime — max 1 per screen)
- **Borders**: `rgba(0,0,0,0.07)` subtle · `rgba(0,0,0,0.13)` mid · `rgba(0,0,0,0.28)` strong
- **Semantic**: `#D44C38` error · `#2E7D32` success

### Rules

1. TWK Everett is always weight 300 for headlines
2. Chivo Mono does ALL functional text — always uppercase for labels/CTAs
3. Black is the primary accent. Lime is the attention color (1 per screen max)
4. Ground is warm gray `#EBEBEB`, never pure white
5. Borders use rgba, not hex
6. CTA buttons carry a `⠿` dot suffix
7. Tags are pill-shaped with optional 5px status dots

### Engine Token Object (App.jsx)

```javascript
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
```

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
