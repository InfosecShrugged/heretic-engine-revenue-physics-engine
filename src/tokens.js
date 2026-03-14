// ─── NetherOps OpptyCon Design System — Three-Mode Dual Accent ───
// Rose #D64074 = text/links/borders on light
// Lime #C8FF6E = fills/badges/dots/buttons on light + everything on dark
// Lime NEVER as text on light surfaces

export const lightTheme = {
  // Backgrounds
  bg:           '#EBEBEB',
  bgAlt:        '#F4F4F2',
  surface:      '#FFFFFF',
  surfaceHover: '#F8F8F6',

  // Borders
  border:       'rgba(0,0,0,0.07)',
  borderMid:    'rgba(0,0,0,0.13)',
  borderStrong: 'rgba(0,0,0,0.22)',

  // Text
  text:         '#111111',
  muted:        '#555555',
  dim:          '#909090',
  ghost:        '#C4C4C4',

  // Primary accent — ROSE (text, links, borders on light)
  accent:       '#D64074',
  accentHover:  '#C23668',
  accentDim:    'rgba(214,64,116,0.08)',
  accentGlow:   'rgba(214,64,116,0.15)',

  // Secondary accent — LIME (fills, badges, dots, buttons on light)
  lime:         '#C8FF6E',
  limeDark:     '#9BE040',
  limeDim:      'rgba(200,255,110,0.12)',
  limeHighlight:'rgba(200,255,110,0.30)',

  // Semantic
  green:        '#1A8A4A',
  greenDim:     'rgba(26,138,74,0.08)',
  amber:        '#C07800',
  amberDim:     'rgba(192,120,0,0.08)',
  red:          '#CC3340',
  redDim:       'rgba(204,51,64,0.08)',
  blue:         '#2563EB',
  blueDim:      'rgba(37,99,235,0.08)',
  violet:       '#7C4DDB',
  violetDim:    'rgba(124,77,219,0.08)',

  // Chart palette (rose leads on light)
  chart: ['#D64074','#2563EB','#1A8A4A','#7C4DDB','#C07800','#0891B2'],

  // Inverse (for dark inset panels on light pages)
  inv:          '#F5F5F3',
  invMid:       '#AAAAAA',
};

export const darkTheme = {
  // Backgrounds
  bg:           '#0F0F0F',
  bgAlt:        '#171717',
  surface:      '#1C1C1C',
  surfaceHover: '#252525',

  // Borders
  border:       'rgba(255,255,255,0.06)',
  borderMid:    'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  // Text
  text:         '#F5F5F3',
  muted:        '#AAAAAA',
  dim:          '#666666',
  ghost:        '#444444',

  // Primary accent — LIME (everything on dark)
  accent:       '#C8FF6E',
  accentHover:  '#9BE040',
  accentDim:    'rgba(200,255,110,0.08)',
  accentGlow:   'rgba(200,255,110,0.15)',

  // Rose — governance constraints / alerts only on dark
  rose:         '#D64074',
  roseDim:      'rgba(214,64,116,0.10)',

  // Lime fills (same values, just explicit)
  lime:         '#C8FF6E',
  limeDark:     '#9BE040',
  limeDim:      'rgba(200,255,110,0.12)',
  limeHighlight:'rgba(200,255,110,0.30)',

  // Semantic (brighter for dark backgrounds)
  green:        '#2ECC71',
  greenDim:     'rgba(46,204,113,0.10)',
  amber:        '#F0A030',
  amberDim:     'rgba(240,160,48,0.10)',
  red:          '#E74C3C',
  redDim:       'rgba(231,76,60,0.10)',
  blue:         '#4A90D9',
  blueDim:      'rgba(74,144,217,0.10)',
  violet:       '#8B5CF6',
  violetDim:    'rgba(139,92,246,0.10)',

  // Chart palette (lime leads on dark)
  chart: ['#C8FF6E','#4A90D9','#2ECC71','#8B5CF6','#F0A030','#D64074'],

  // Inverse
  inv:          '#111111',
  invMid:       '#555555',
};

// Active theme — toggle with setTheme()
let activeTheme = 'dark';

export function getTheme() {
  return activeTheme === 'dark' ? darkTheme : lightTheme;
}

export function setTheme(mode) {
  activeTheme = mode;
}

export function getThemeName() {
  return activeTheme;
}

// Convenience: get the current color set as `C`
export function C() {
  return getTheme();
}

export const fonts = {
  display: "'TWK Everett', 'Helvetica Neue', sans-serif",
  body:    "'TWK Everett', 'Helvetica Neue', sans-serif",
  mono:    "'Chivo Mono', 'Space Mono', monospace",
};

export const radii = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 };

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64, '4xl': 96,
};

export const shadows = {
  light: {
    card:     '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    elevated: '0 4px 16px rgba(0,0,0,0.08)',
  },
  dark: {
    card:     '0 1px 3px rgba(0,0,0,0.20), 0 1px 2px rgba(0,0,0,0.12)',
    elevated: '0 4px 16px rgba(0,0,0,0.30)',
    glow:     '0 0 40px rgba(200,255,110,0.10)',
  },
};

export const LOGO_URL = "/netherops-logo.svg";
