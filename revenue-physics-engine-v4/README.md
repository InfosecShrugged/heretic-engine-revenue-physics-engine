# Revenue Physics Engine

Interactive GTM planning application for marketing leaders. Transforms static spreadsheet revenue models into a real-time, interactive experience with live calculations across Sales, Marketing, Pipeline, P&L, and more.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Opens at `http://localhost:3000`

## Deploy to Vercel (recommended — free)

### Option A: One-click deploy
1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → "New Project"
3. Import your repo → Deploy

### Option B: CLI deploy
```bash
npm install -g vercel
vercel
```

That's it. You'll get a live URL like `revenue-engine.vercel.app`.

## Deploy to Netlify

```bash
npm run build
# Upload the `dist` folder to netlify.com/drop
```

Or connect your GitHub repo at netlify.com for auto-deploys.

## What's Inside

| Page | Sheet Equivalent | What It Does |
|------|-----------------|--------------|
| Command Center | README/Overview | Executive dashboard with all KPIs |
| Sales Model | Sales Model | AE capacity, quota, ramp-adjusted projections |
| Marketing Funnel | Marketing Funnel | Inverse model: target → deals → SQLs → MQAs → leads |
| Channel Mix | Marketing Channels | Budget allocation, CPL, channel ROI |
| Pipeline | Pipeline Progression | Stage-by-stage conversion waterfall |
| Seller Ramp | Seller Ramp | Productivity curve, ramp capacity loss |
| P&L | steady-state / ss with actuals | Full income statement, Rule of 40, burn multiple |
| Glideslope | Glideslope Planning | Projected vs target ARR with gap analysis |
| QBR Metrics | QBR Metrics | Quarterly scorecards |
| Weekly Tracker | Weekly Sheet | Weekly activity targets and cumulative tracking |

## How the Model Works

Everything is **inverse-driven**: you set your ARR target and the engine calculates backwards through conversion rates to tell you exactly how many leads, MQAs, SQLs, and deals you need.

Change any input → every chart, table, and metric recalculates instantly.

### Key Metrics
- **LTV:CAC** — Customer lifetime value vs acquisition cost
- **CAC Payback** — Months to recover acquisition cost
- **Magic Number** — Net new ARR / S&M spend (efficiency)
- **Rule of 40** — Growth rate + profit margin (SaaS health)
- **Burn Multiple** — Cash burn / net new ARR

## Tech Stack
- React 18 + Vite
- Recharts (data visualization)
- Framer Motion (animations)
- Tailwind CSS
- Lucide Icons
