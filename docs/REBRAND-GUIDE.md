# NetherOps Rebrand Guide

## From Heretics → NetherOps | Revenue Physics Engine → OpptyCon

This document covers every step needed to rebrand the project from "heretics" to **NetherOps** and rename the revenue physics engine to **OpptyCon**.

---

## Naming Map

| Old | New | Context |
|-----|-----|---------|
| heretics / heretics.io | **NetherOps** | Company name, brand, website |
| Governed Revenue Architecture | **Governed Revenue Architecture** | Unchanged — this is the methodology |
| Revenue Physics Engine | **OpptyCon** | The interactive simulation/control app |
| app.heretics.io | **app.netherops.io** (or netherops.io) | Primary domain |
| heretics-site | **netherops-site** | GitHub repo — marketing/content site |
| heretic-engine-revenue-physics-engine | **opptycon** | GitHub repo — the engine app |
| Heretic Engine Design System | **NetherOps Design System** | Tokens, components, brand system |
| scorecard.io theme | **BigFilter clean-different** | Design system being adopted |

---

## Phase 1: GitHub Repository Renames

### 1a. Rename heretics-site → netherops-site

```bash
# On GitHub: Settings → General → Repository name → "netherops-site"
# GitHub auto-redirects the old URL, but update local remotes:

cd ~/heretics-site
git remote set-url origin git@github.com:InfosecShrugged/netherops-site.git
```

### 1b. Rename heretic-engine-revenue-physics-engine → opptycon

```bash
# On GitHub: Settings → General → Repository name → "opptycon"

cd ~/heretic-engine-revenue-physics-engine
git remote set-url origin git@github.com:InfosecShrugged/opptycon.git
```

### 1c. Update Netlify site settings

- Go to Netlify dashboard → Site settings
- Update: Site name, custom domain (netherops.io or app.netherops.io)
- Update: Build settings if repo name changed (Netlify should auto-follow GitHub renames if linked)

---

## Phase 2: Domain & DNS

### Option A: netherops.io (single domain)
- Register netherops.io
- Point to Netlify
- Set up: `netherops.io` → main site, `netherops.io/tools/opptycon` → engine

### Option B: Subdomain split
- `netherops.io` → main marketing/content site
- `app.netherops.io` → OpptyCon engine (if deploying standalone)

### DNS records
```
netherops.io          A     75.2.60.5        (Netlify)
netherops.io          AAAA  2600:1f16:...    (Netlify)
www.netherops.io      CNAME netherops.io
app.netherops.io      CNAME [netlify-site].netlify.app  (if using subdomain)
```

---

## Phase 3: Content Rebrand — netherops-site

### 3a. Global find-and-replace across all HTML files

These replacements need to be made in every `.html` file in the site:

```bash
cd ~/netherops-site

# Case-sensitive replacements
find . -name "*.html" -exec sed -i \
  -e 's/heretics\.io/netherops.io/g' \
  -e 's/app\.heretics\.io/app.netherops.io/g' \
  -e 's/HERETICS/NETHEROPS/g' \
  -e 's/Heretics/NetherOps/g' \
  -e 's/heretics/netherops/g' \
  -e 's/Revenue Physics Engine/OpptyCon/g' \
  -e 's/revenue-physics-engine/opptycon/g' \
  -e 's/revenue physics engine/OpptyCon/g' \
  {} +
```

### 3b. Update navigation links

In every page's nav section, update:
- Logo text: "HERETICS" → "NETHEROPS"
- Logo link: href to new domain
- Engine link: `tools/revenue-physics-engine` → `tools/opptycon`
- Engine label: "physics engine" → "opptycon"

### 3c. Update page titles and meta tags

```html
<!-- Old -->
<title>Governed Revenue Architecture | Heretics</title>
<meta property="og:site_name" content="Heretics">

<!-- New -->
<title>Governed Revenue Architecture | NetherOps</title>
<meta property="og:site_name" content="NetherOps">
```

### 3d. Update footer

Replace all footer references to heretics with NetherOps branding.

### 3e. Rename the tools directory

```bash
mv tools/revenue-physics-engine tools/opptycon
```

### 3f. Update _redirects / netlify.toml

```
# Add redirect for old paths
/tools/revenue-physics-engine/*  /tools/opptycon/:splat  301
```

---

## Phase 4: Content Rebrand — OpptyCon (engine app)

### 4a. Package.json

```json
{
  "name": "opptycon",
  "description": "OpptyCon — Revenue simulation and governance control surface by NetherOps",
  "version": "2.0.0"
}
```

### 4b. In-app branding (src/App.jsx)

Find and replace in the React source:

```
"Revenue Physics Engine" → "OpptyCon"
"Heretic Engine" → "NetherOps"
"heretics" → "netherops"
"HERETICS" → "NETHEROPS"
```

Update the site nav bar component's logo and links:
- Logo text → "NETHEROPS"
- Home link → netherops.io
- Engine nav item label → "opptycon" (highlighted in accent)

### 4c. tokens.js branding comment

```javascript
// ─── NetherOps Design System Tokens — BigFilter Clean-Different ───
// Shared design language across all NetherOps properties
```

### 4d. HTML entry point (index.html)

```html
<title>OpptyCon | NetherOps</title>
<meta name="description" content="OpptyCon — Revenue simulation and governance control surface">
```

### 4e. Vite config base path

```javascript
export default defineConfig({
  base: '/tools/opptycon/',
  // ...
})
```

---

## Phase 5: Design System Migration — BigFilter Signal Architecture

This is the most significant visual change. Moving from Oxanium/Space Mono + orange accent to the actual BigFilter system: TWK Everett + Chivo Mono, warm gray ground, black CTA, lime attention color.

See **DESIGN-SYSTEM.md** for the full token spec and migration guide.

### Summary of changes

| Property | Old (Scorecard/Heretics) | New (BigFilter) |
|----------|-------------------------|-----------------|
| Background | #f0f0f0 | #EBEBEB (warm light gray) |
| Surface | #f8f8f8 | #F4F4F2 |
| Cards | #ffffff | #FFFFFF (same) |
| Text primary | #1a1918 | #111111 (near-black) |
| Text secondary | #747474 | #555555 |
| Text muted | #a3a3a3 | #909090 |
| Accent (CTA) | #ff6e3e (orange) | #111111 (black filled) |
| Attention color | — | #C8FF6E (lime, max 1/screen) |
| Display font | Oxanium | TWK Everett Light (300) — self-hosted |
| Mono font | Space Mono | Chivo Mono — Google Fonts |
| Borders | hex values | rgba-based transparency |
| Border radius | 6px everywhere | 4/8/12/16/pill scale |
| Shadows | minimal | warm rgba(0,0,0,x) |

### Font files

Copy `fonts/TWKEverett-Light.otf`, `TWKEverett-Regular.otf`, `TWKEverett-Bold.otf` into both repos. Add `@font-face` declarations. See DESIGN-SYSTEM.md for the exact CSS.

---

## Phase 6: Logo & Brand Assets

The geometric "H" mark needs to be replaced with a NetherOps mark.

### Assets to create
- [ ] NetherOps icon mark (favicon, app icon)
- [ ] NetherOps wordmark (nav, hero)
- [ ] NetherOps + tagline variant
- [ ] OpptyCon sub-brand mark (for the engine specifically)
- [ ] Favicon at 16px, 32px, 64px
- [ ] Open Graph image (1200×630)

### Tagline options
- "GTM Engineering for Governed Revenue" (carry forward)
- "Revenue Operations. Governed." (shorter)
- "The Governed Revenue Platform" (product-focused)

---

## Phase 7: Commit & Deploy

### Commit sequence

```bash
# 1. OpptyCon engine repo
cd ~/opptycon
git add -A
git commit -m "Rebrand: Revenue Physics Engine → OpptyCon, heretics → NetherOps, BigFilter design system"
git push origin main

# 2. Build engine
npm install
npm run build

# 3. NetherOps site repo
cd ~/netherops-site
rm -rf tools/revenue-physics-engine
mkdir -p tools/opptycon
cp -r ~/opptycon/dist/* tools/opptycon/
git add -A
git commit -m "Rebrand: heretics → NetherOps, adopt BigFilter design system, integrate OpptyCon"
git push origin main
```

### Verify

- [ ] netherops.io loads with new branding
- [ ] netherops.io/tools/opptycon loads the engine
- [ ] All nav links work across pages
- [ ] Old heretics.io URLs redirect (if keeping old domain)
- [ ] Logo/favicon renders correctly
- [ ] Design system is consistent (fonts, colors, spacing)
- [ ] Mobile nav works
- [ ] Open Graph meta tags are correct

---

## Phase 8: External Updates

- [ ] Update GitHub org/profile description
- [ ] Update Netlify site name
- [ ] Update any external links (LinkedIn, social, docs)
- [ ] Update Google Search Console with new domain
- [ ] Set up 301 redirects from heretics.io → netherops.io (if keeping old domain)
- [ ] Update Claude memory / project context with new naming
