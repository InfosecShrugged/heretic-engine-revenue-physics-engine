# CLAUDE.md — Revenue Physics Engine

## Project Overview

Revenue Physics Engine is an interactive GTM (Go-To-Market) planning application for SaaS marketing and revenue leaders. It transforms static spreadsheet revenue models into a real-time, interactive experience with live calculations across Sales, Marketing, Pipeline, P&L, and more.

The core concept is **inverse-driven modeling**: the user sets an ARR target and the engine calculates backward through conversion rates to determine exactly how many leads, MQAs, SQLs, and deals are needed.

**Product**: Heretic Engine — built by Heretic Engine (company)
**Domain**: B2B SaaS revenue operations and GTM planning
**Deployment**: Netlify (primary), Vercel (alternative)

## Tech Stack

- **Framework**: React 18 (JSX, no TypeScript)
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4 + inline styles (majority of styling is inline)
- **Charts**: Recharts 2.12
- **Animations**: Framer Motion 11
- **Icons**: Lucide React
- **Fonts**: DM Sans (body), DM Mono (numbers), Space Grotesk (loaded but sparingly used)
- **CSS Processing**: PostCSS + Autoprefixer

## Quick Reference

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
```

## Repository Structure

```
.
├── CLAUDE.md                 # This file
├── README.md                 # User-facing project documentation
├── index.html                # HTML entry point (loads /src/main.jsx)
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration (port 3000, no sourcemaps in prod)
├── tailwind.config.js        # Tailwind config with custom "engine" color palette
├── postcss.config.js         # PostCSS with Tailwind + Autoprefixer
├── .gitignore                # Only ignores .netlify/
├── .netlify/
│   └── netlify.toml          # Netlify build config
├── src/
│   ├── main.jsx              # React entry point (StrictMode, renders <App />)
│   ├── App.jsx               # All UI components (~2800 lines, single-file architecture)
│   ├── engine.js             # Pure calculation engine (~1000 lines, no React dependency)
│   └── index.css             # Global styles, Tailwind directives, scrollbar/input theming
├── dist/                     # Built production assets (committed)
├── docs-updater/             # Previous version snapshots (App.jsx + engine.js)
├── __MACOSX/                 # macOS archive artifact (can be ignored)
└── node_modules/             # Installed dependencies (committed)
```

## Architecture

### Single-File UI Pattern

All React UI lives in `src/App.jsx` (~2800 lines). This is intentional — the application is a monolithic interactive tool, not a multi-route app. There is no router; navigation is state-driven via `page` state.

### Two-File Core Architecture

| File | Responsibility | Lines |
|------|---------------|-------|
| `src/engine.js` | Pure calculation model. Exports `DEFAULT_INPUTS`, `computeModel()`, `MONTHS`, `QUARTERS`. Zero React dependency. | ~1000 |
| `src/App.jsx` | All UI: components, pages, navigation, theming, onboarding wizard, documentation panels. | ~2800 |

### Data Flow

1. **Inputs** (`DEFAULT_INPUTS` in `engine.js`): ~80+ parameters covering ARR targets, funnel rates, cost structures, channel mixes, seasonality, and more.
2. **State**: `App` holds `inputs` in `useState(DEFAULT_INPUTS)`. User changes flow through `setInputs`.
3. **Computation**: `useMemo(() => computeModel(inputs), [inputs])` — the entire model recomputes on any input change.
4. **Output**: `computeModel()` returns a deeply nested object with `summary`, `monthly`, `channels`, `sellerRamp`, `stages`, `yearTargets`, `motions`, `pnl`, `glideslope`, `qbrData`, `weeklySimplified`, `velocityStages`, `quarterlyTargets`, `funnelHealth`, `cacBreakdown`, `monthWeights`, `phaseShiftedFunnel`.
5. **Rendering**: Page components receive `{model, inputs, setInputs, onInfoClick, mobile, tablet}` as props.

### Navigation

Pages are registered in `NAV_SECTIONS` (line ~361) and rendered via a `pages` object mapping page IDs to components. Navigation is organized into sections:

- **Top-level**: Command Center (dashboard)
- **Revenue**: Target Tracker, Glideslope, QBR Metrics, Weekly Tracker
- **Pipeline**: Funnel Health, Pipeline, Marketing Funnel, Velocity
- **GTM Economics**: S&M Budget, Mktg Budget, Revenue Motions, CAC Breakdown, Sales Model, Seller Ramp
- **Finance**: P&L

### Onboarding Wizard

The app starts with an `OnboardingWizard` component that collects key inputs before showing the main UI. On completion, it merges overrides into `DEFAULT_INPUTS`.

## Key Source Files

### `src/engine.js` — Calculation Engine

The engine is a pure function with no side effects. Key concepts:

- **Funnel lifecycle**: Inquiry -> MQL -> SQL -> Meeting Held -> SQO (Stage 2) -> Closed Won
- **Opportunity stages**: Stage 1 (Discovery/Unqualified), Stage 2 (SQO/Qualified, forecastable)
- **Revenue motions**: CREATE (net-new demand), CONVERT (qualification), ACCELERATE (deal velocity)
- **Cost model**: Dual-axis — behavioral (fixed/variable) x functional (G&A, R&D, Sales, Marketing)
- **Marketing budget**: Three-layer fixed model — Layer 1 (structural floors), Layer 2 (scalable infrastructure), Layer 3 (variable/motion-allocated)
- **Multi-year planning**: 1-3 year horizon with year-over-year growth rates and conversion lifts
- **Seasonality**: NORAM B2B SaaS default weights, even distribution, or custom monthly weights
- **Leadership costs**: Step function of funding stage (seed through Series C), not revenue percentage

The `DEFAULT_INPUTS` object contains all tunable parameters with inline comments explaining benchmarks and ranges.

### `src/App.jsx` — UI Components

**Shared components** (defined at top of file):
- `Card` — dark card container
- `Metric` — animated KPI display with color accent bar
- `Input` — labeled number input with prefix/suffix
- `Header` — page title with optional info button
- `TT` — chart tooltip
- `Badge` — status pill (good/warning/bad)
- `SegmentToggle` — tab-like toggle buttons
- `DocPanel` — slide-in documentation panel

**Design tokens** are in the `C` object (line ~15): bg, card, border, accent (cyan), green, amber, rose, violet, blue, text, muted, dim, plus a chart color array `ch`.

**Page components** (each receives `{model, inputs, setInputs, onInfoClick, mobile, tablet}`):
- `DashboardPage` — executive summary with KPIs and charts
- `FunnelHealthPage` — stage conversion rates with benchmarks
- `CACBreakdownPage` — four CAC variants (programmatic through all-in)
- `SandMBudgetPage` — combined Sales & Marketing budget
- `MarketingBudgetPage` — fixed infrastructure + variable demand
- `TargetTrackerPage` — quarterly/monthly ARR targets
- `SalesPage` — AE capacity and quota modeling
- `FunnelPage` — marketing funnel waterfall
- `ChannelsPage` — revenue motions (CREATE/CONVERT/ACCELERATE)
- `PipelinePage` — funnel with cost per stage
- `VelocityPage` — stage-level timing
- `RampPage` — seller ramp curve with attrition
- `PnLPage` — full P&L statement
- `GlideslopePage` — multi-year ARR trajectory
- `QBRPage` — board-ready quarterly metrics
- `WeeklyPage` — weekly operational targets

**Module documentation** is registered in `MODULE_DOCS` (line ~75) — each module has `title`, `tooltip`, `tldr`, `included`, `excluded`, `assumptions`, `whatChanges`, and `relatedModules`.

## Code Conventions

### Styling

- **Primary**: Inline styles using the `C` design token object. Almost all layout and color is inline.
- **Secondary**: Tailwind classes used minimally (mainly in `index.css` for base resets).
- **Responsive**: `useMediaQuery` hook provides `mobile` (<768px) and `tablet` (<1024px) booleans. Grid layouts collapse via inline style changes and CSS `@media` fallbacks in `index.html`.
- **Dark theme only**: The app has a single dark theme. Background is `#0A0E17`, cards are `#111827`.

### Formatting Functions

Three utility formatters defined at the top of `App.jsx`:
- `fmt(n, d)` — currency format: `$1.2M`, `$350K`, `$42`
- `fN(n)` — integer with locale separators: `1,234`
- `fP(n)` — percentage from decimal: `45.2%`

### Component Patterns

- No class components — all functional with hooks
- No external state management (Redux, Zustand, etc.) — all state in App via `useState`
- `useMemo` for model computation only
- Props drilling for `model`, `inputs`, `setInputs` — no context providers
- Framer Motion `motion.div` for entry animations with staggered delays
- Recharts for all data visualization (AreaChart, ComposedChart, BarChart, PieChart)

### Naming

- Page components: `*Page` suffix (e.g., `DashboardPage`, `PnLPage`)
- Engine inputs: camelCase, descriptive (e.g., `inquiryToMqlRate`, `aeAttritionRate`)
- Color tokens: short keys in `C` object (e.g., `C.accent`, `C.greenD` for transparent green)
- Chart colors: `C.ch[index]` array for consistent palette

### File Organization

- No component splitting — all components in `App.jsx`
- No separate hooks file — `useMediaQuery` defined inline
- No separate constants file — `C` tokens and `NAV_SECTIONS` in `App.jsx`, `DEFAULT_INPUTS` in `engine.js`
- No tests, no linting config, no TypeScript

## Tailwind Configuration

Custom color palette under `engine.*`:
- `engine-bg`: `#0A0E17` (page background)
- `engine-card`: `#111827` (card surfaces)
- `engine-accent`: `#22d3ee` (cyan primary accent)
- `engine-green`, `engine-amber`, `engine-rose`, `engine-violet`, `engine-blue`: semantic colors

Font families:
- `font-sans`: DM Sans
- `font-mono`: DM Mono

## Build & Deployment

- **Build**: `vite build` outputs to `dist/` (sourcemaps disabled)
- **Dev server**: Port 3000, auto-opens browser
- **Netlify**: Configured via `.netlify/netlify.toml` — runs `npm run build`, publishes `dist/`
- **Vercel**: Supported via zero-config (Vite auto-detected)
- **No CI/CD pipelines**: Build is triggered by Netlify/Vercel on push

## Important Notes for AI Assistants

1. **Single-file UI**: Do not split `App.jsx` into separate files unless explicitly asked. The monolithic structure is intentional.

2. **Engine purity**: `engine.js` must remain a pure computation module with no React imports or side effects. It should only export `computeModel`, `DEFAULT_INPUTS`, `MONTHS`, and `QUARTERS`.

3. **No TypeScript**: The project uses plain JavaScript with JSX. Do not introduce TypeScript.

4. **No tests exist**: There is no test infrastructure. If adding tests, note that `engine.js` is highly testable as a pure function.

5. **Inline styles dominate**: Respect the inline-style-first pattern using the `C` token object. Do not refactor to CSS modules or styled-components.

6. **`docs-updater/`**: Contains an older version of `App.jsx` and `engine.js`. These are reference copies, not active code.

7. **`dist/` and `node_modules/` are committed**: This is unusual but intentional for the project's deployment workflow.

8. **All calculations flow from `computeModel(inputs)`**: When adding new metrics or features, extend `DEFAULT_INPUTS` and `computeModel()` in `engine.js`, then consume the new output in the relevant page component in `App.jsx`.

9. **Domain context**: This is a B2B SaaS GTM planning tool. Benchmarks and defaults are calibrated for mid-market cybersecurity companies ($5M-$30M ARR). Terms like AE (Account Executive), SDR (Sales Development Rep), SQO (Sales Qualified Opportunity), MQL (Marketing Qualified Lead), and CAC (Customer Acquisition Cost) are standard SaaS/GTM vocabulary.

10. **No persistent state**: The app does not save data. All inputs reset on page reload. The onboarding wizard collects initial overrides that merge into `DEFAULT_INPUTS`.
