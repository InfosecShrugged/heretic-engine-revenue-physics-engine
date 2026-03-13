# NetherOps Design System

## Source: BigFilter · Signal Architecture (scorecard.io lineage)

Two fonts. One warm gray ground. Near-black ink. Monospace labels for everything functional. Light-weight display for everything human.

---

## Font Stack

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / Headlines | **TWK Everett** | 300 (Light) | Hero text, H1, H2, section titles, stat values |
| Display / Body | **TWK Everett** | 400 (Regular) | H3, body paragraphs, feature card titles |
| Display / Emphasis | **TWK Everett** | 700 (Bold) | Strong emphasis (rare) |
| Functional / Labels | **Chivo Mono** | 500 | Eyebrows, nav tabs, labels, captions |
| Functional / CTAs | **Chivo Mono** | 600 | Buttons, tags, links, nav CTA |
| Functional / Body | **Chivo Mono** | 400 | Descriptions, sub-copy, code |

### Self-hosting TWK Everett

TWK Everett is licensed (not on Google Fonts). Host the `.otf` files:

```css
@font-face {
  font-family: 'TWK Everett';
  src: url('/fonts/TWKEverett-Light.otf') format('opentype');
  font-weight: 300; font-display: swap;
}
@font-face {
  font-family: 'TWK Everett';
  src: url('/fonts/TWKEverett-Regular.otf') format('opentype');
  font-weight: 400; font-display: swap;
}
@font-face {
  font-family: 'TWK Everett';
  src: url('/fonts/TWKEverett-Bold.otf') format('opentype');
  font-weight: 700; font-display: swap;
}
```

### Chivo Mono (Google Fonts)

```html
<link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
```

### CSS variables

```css
--font-display: 'TWK Everett', 'Helvetica Neue', Helvetica, Arial, sans-serif;
--font-mono:    'Chivo Mono', 'Space Mono', 'Courier New', monospace;
```

---

## Color Tokens

```css
:root {
  /* ── GROUNDS ── */
  --bg-base:      #EBEBEB;   /* main page background — warm light gray */
  --bg-surface:   #F4F4F2;   /* card surface — slightly lighter */
  --bg-white:     #FFFFFF;   /* inset cards, inputs, elevated */
  --bg-inverse:   #0F0F0F;   /* dark sections, footer */
  --bg-code:      #1C1C1C;   /* code blocks, terminal */
  --bg-raised:    #E2E2DF;   /* hover state on base */

  /* ── INK ── */
  --ink:          #111111;   /* primary — headlines, body */
  --ink-mid:      #555555;   /* secondary — descriptions */
  --ink-muted:    #909090;   /* tertiary — placeholders, labels */
  --ink-inv:      #F5F5F3;   /* on dark backgrounds */
  --ink-inv-mid:  #AAAAAA;   /* secondary on dark */
  --ink-code:     #C8FF6E;   /* lime — code on dark, use sparingly */

  /* ── BORDERS ── */
  --border-subtle: rgba(0,0,0,0.07);
  --border-mid:    rgba(0,0,0,0.13);
  --border-strong: rgba(0,0,0,0.28);
  --border-inv:    rgba(255,255,255,0.12);

  /* ── ACCENT ── */
  --accent:        #111111;   /* primary CTA — black filled */
  --accent-text:   #F5F5F3;
  --accent-lime:   #C8FF6E;   /* attention — max 1 per screen */
  --accent-lime-dark: #9BE040;

  /* ── SEMANTIC ── */
  /* error: #D44C38  ·  success: #2E7D32 */

  /* ── TYPE SCALE ── */
  --text-xs: 11px;  --text-sm: 13px;  --text-base: 15px;
  --text-md: 18px;  --text-lg: 24px;  --text-xl: 32px;
  --text-2xl: 44px; --text-3xl: 60px; --text-4xl: 80px;

  /* ── SPACING ── */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px;
  --sp-6:32px; --sp-7:48px; --sp-8:64px; --sp-9:96px; --sp-10:128px;

  /* ── RADIUS ── */
  --r-sm:4px; --r-md:8px; --r-lg:12px; --r-xl:16px; --r-pill:100px;

  /* ── SHADOWS ── */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04);
  --shadow-lg: 0 16px 48px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05);

  /* ── MOTION ── */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --duration: 180ms;
}
```

---

## Display Type Rules (TWK Everett)

| Level | Size | Weight | Letter-spacing | Line-height |
|-------|------|--------|---------------|-------------|
| Hero | 80px (clamp 40–72) | 300 | −0.03em | 1.05 |
| H1 | 44px | 300 | −0.025em | 1.1 |
| H2 | 32px | 300 | −0.02em | 1.2 |
| H3 | 24px | 400 | −0.015em | 1.3 |
| Body | 18px | 400 | 0 | 1.5 |

## Functional Type Rules (Chivo Mono)

| Level | Size | Weight | Letter-spacing | Transform |
|-------|------|--------|---------------|-----------|
| Eyebrow | 11px | 500 | 0.14em | uppercase |
| CTA / Button | 12px | 600 | 0.08em | uppercase |
| Body mono | 13px | 400 | 0.04em | uppercase |
| Caption | 11px | 400 | 0.06em | — |
| Code | 12px | 400 | 0.04em | — |

---

## Design Principles

1. **Everett is always light (300)** for headlines — the thin/mono contrast IS the system
2. **Chivo Mono does all functional work** — always uppercase for labels/CTAs
3. **Black is the accent** — primary CTA is `#111` filled. Lime `#C8FF6E` for attention, max once per screen
4. **Warm gray ground** — `#EBEBEB` base, not white. White only for inset/elevated cards
5. **rgba borders** — transparency-based, not hex
6. **Decorative dot glyph** — CTA buttons carry a `⠿` suffix (scorecard pattern)
7. **Status dots on tags** — pill-shaped, 5px dot before label by default

---

## OpptyCon Engine Token Object

```javascript
// ─── TOKENS — NetherOps · BigFilter Signal Architecture ───
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

### Font migration map

| Old reference | New reference |
|--------------|--------------|
| `'Oxanium'` | `'TWK Everett'` |
| `'Space Mono'` | `'Chivo Mono'` |
| `'DM Mono'` | `'Chivo Mono'` |
| `'DM Sans'` | `'TWK Everett'` |
| `'Space Grotesk'` | `'TWK Everett'` |

### Color migration map

| Old (scorecard/heretics) | New (BigFilter) | Notes |
|-------------------------|-----------------|-------|
| `#f0f0f0` / `#F8F9FB` | `#EBEBEB` | Warmer gray |
| `#f8f8f8` / `#F2F4F7` | `#F4F4F2` | Warm surface |
| `#ffffff` | `#FFFFFF` | Same |
| `#d9d9d9` | `rgba(0,0,0,0.13)` | rgba borders |
| `#ff6e3e` / `#E85D2A` | `#111111` (CTA) / `#C8FF6E` (attention) | No orange |
| `#1a1918` / `#0F1117` | `#111111` | Neutral black |
| `#747474` / `#4B5568` | `#555555` | Warmer mid |
| `#a3a3a3` / `#8892A4` | `#909090` | Warmer muted |
