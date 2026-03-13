# Development Guide

## Quick Start

### OpptyCon (the engine)
```bash
git clone git@github.com:InfosecShrugged/opptycon.git
cd opptycon
npm install
npm run dev
# → http://localhost:5173
```

### NetherOps Site
```bash
git clone git@github.com:InfosecShrugged/netherops-site.git
cd netherops-site
# No build step — open any .html file directly, or:
npx serve .
# → http://localhost:3000
```

---

## Deploy Workflow

```
┌─────────────┐     npm run build     ┌──────────────────┐
│   opptycon   │ ──────────────────►   │  opptycon/dist/  │
│   (source)   │                       │  (built assets)  │
└─────────────┘                        └────────┬─────────┘
                                                │ cp -r
                                       ┌────────▼─────────┐
                                       │  netherops-site/  │
                                       │  tools/opptycon/  │
                                       └────────┬─────────┘
                                                │ git push
                                       ┌────────▼─────────┐
                                       │     Netlify       │
                                       │  auto-deploy      │
                                       └──────────────────┘
```

### Full deploy script

```bash
#!/bin/bash
set -e

# Build
cd ~/opptycon
npm run build

# Copy to site
cd ~/netherops-site
rm -rf tools/opptycon
mkdir -p tools/opptycon
cp -r ~/opptycon/dist/* tools/opptycon/

# Commit and deploy
git add -A
git commit -m "Deploy: $(date +%Y-%m-%d) OpptyCon update"
git push origin main

echo "Deployed. Netlify will pick it up in ~30s."
```

Save as `~/deploy-opptycon.sh` and `chmod +x`.

---

## File Ownership

| What to edit | Where |
|-------------|-------|
| Engine UI & logic | `opptycon/src/App.jsx` |
| Engine computation | `opptycon/src/engine.js` |
| Design tokens (engine) | `opptycon/src/tokens.js` + `C` object in `App.jsx` |
| Design tokens (site) | CSS custom properties in each HTML file's `<style>` block |
| Site pages | `netherops-site/*.html` |
| Nav links | Every HTML file (nav is duplicated per page, no shared component) |
| Redirects | `netherops-site/_redirects` |
| Netlify config | `netherops-site/netlify.toml` |

---

## Claude Code Setup

To use Claude Code with this project:

1. Copy `CLAUDE.md` to the root of each repo:
   ```bash
   cp CLAUDE.md ~/opptycon/CLAUDE.md
   cp CLAUDE.md ~/netherops-site/CLAUDE.md
   ```

2. Optionally copy `.claude/settings.json` for IDE integration:
   ```bash
   mkdir -p ~/opptycon/.claude ~/netherops-site/.claude
   cp .claude/settings.json ~/opptycon/.claude/
   cp .claude/settings.json ~/netherops-site/.claude/
   ```

3. Claude Code will read `CLAUDE.md` automatically and understand:
   - The naming conventions (NetherOps, OpptyCon, GRA)
   - The design system tokens and rules
   - The build/deploy workflow
   - The architecture philosophy

---

## Design System Quick Reference

| Token | Value |
|-------|-------|
| `--bg-base` | `#EBEBEB` |
| `--ink` | `#111111` |
| `--accent` | `#111111` (black CTA) |
| `--accent-lime` | `#C8FF6E` (attention) |
| `--border-mid` | `rgba(0,0,0,0.13)` |
| Font: Display | TWK Everett 300 (self-hosted) |
| Font: Functional | Chivo Mono (Google Fonts) |
| Border radius | 4/8/12/16/pill scale |

Full spec → [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
