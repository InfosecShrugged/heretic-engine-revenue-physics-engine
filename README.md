# NetherOps

**GTM Engineering for Governed Revenue**

NetherOps builds tools and frameworks that treat B2B SaaS revenue as a governed system — not a dashboard to stare at, but a control surface to operate.

---

## What is Governed Revenue Architecture?

Traditional RevOps observes. NetherOps governs.

The **Governed Revenue Architecture (GRA)** is a systems-thinking framework for B2B go-to-market. It models revenue as a physics problem: inputs have constraints, processes have feedback loops, and outcomes are causally traceable. The architecture has four bands:

1. **Capital & Economic Constraints** — P&L boundaries, budget constraints, unit economics
2. **Governance Authority** — ICP definitions, stage criteria, coverage models, attribution rules
3. **Agents** — Coverage agents, attribution agents, signal processors
4. **Execution Domains** — CRM, orchestration, intent platforms, market interface

---

## OpptyCon

**OpptyCon** is the interactive simulation and control surface for the Governed Revenue Architecture. It lets revenue leaders model scenarios, stress-test assumptions, and see how constraint changes cascade through the full funnel — from CAC targets to closed-won revenue.

### What it does
- Full-funnel revenue simulation from ICP → pipeline → close → revenue
- Constraint-based modeling (change a CAC target, see what breaks downstream)
- Multi-channel attribution and coverage modeling
- Governance visualization (who controls what, and how changes propagate)

### Stack
- React + Vite
- Tailwind CSS
- Chart.js for data visualization
- Pure computation engine (`engine.js`) — no external data dependencies

---

## Repository Structure

```
netherops-site/          Marketing site, GRA methodology content
├── index.html           Home page
├── spine.html           The GRA Spine
├── sovereignty.html     Data sovereignty
├── tools/
│   └── opptycon/        Built engine (from opptycon repo)
└── ...

opptycon/                Revenue simulation engine
├── src/
│   ├── App.jsx          Main application (UI + state)
│   ├── engine.js        Pure computation engine
│   ├── tokens.js        Design system tokens
│   └── index.css        Base styles
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Design System

NetherOps uses the **BigFilter Signal Architecture** design system — derived from scorecard.io.

- **Display**: TWK Everett Light (300) — self-hosted
- **Functional**: Chivo Mono — Google Fonts
- **Ground**: Warm light gray `#EBEBEB`
- **Ink**: Near-black `#111111`
- **Accent**: Black CTA `#111111` + Lime attention `#C8FF6E`

See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for the full token spec.

---

## Development

### Prerequisites
- Node.js 18+
- npm

### OpptyCon (local development)
```bash
cd opptycon
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build → dist/
```

### Deploy
```bash
# Build OpptyCon → copy to site → push
cd opptycon && npm run build
cd ../netherops-site
rm -rf tools/opptycon && mkdir -p tools/opptycon
cp -r ../opptycon/dist/* tools/opptycon/
git add -A && git commit -m "Deploy OpptyCon update" && git push
```

Netlify auto-deploys from `main`.

---

## Links

- **Site**: [netherops.io](https://netherops.io)
- **OpptyCon**: [netherops.io/tools/opptycon](https://netherops.io/tools/opptycon)

---

*Revenue isn't a metric. It's a system. Govern it.*
