// ─── NetherOps OpptyCon Design System Tokens — BigFilter Signal Architecture ───
// Shared design language across all NetherOps properties

export const colors = {
  // Backgrounds
  bg:        '#EBEBEB',
  bgAlt:     '#F4F4F2',
  surface:   '#FFFFFF',
  surfaceHover: '#F4F4F2',

  // Borders
  border:    'rgba(0, 0, 0, 0.13)',
  borderL:   'rgba(0, 0, 0, 0.07)',

  // Brand accent
  accent:    '#111111',
  accentDim: 'rgba(0, 0, 0, 0.06)',
  accentGlow: 'rgba(0, 0, 0, 0.12)',

  // Lime (attention color)
  lime:      '#C8FF6E',
  limeDim:   'rgba(200, 255, 110, 0.15)',

  // Semantic
  green:     '#2E7D32',
  greenDim:  'rgba(46, 125, 50, 0.10)',
  amber:     '#E89F0C',
  amberDim:  'rgba(232, 159, 12, 0.10)',
  rose:      '#D44C38',
  roseDim:   'rgba(212, 76, 56, 0.10)',
  violet:    '#6D28D9',
  violetDim: 'rgba(109, 40, 217, 0.10)',
  blue:      '#2563EB',
  blueDim:   'rgba(37, 99, 235, 0.10)',

  // Typography
  text:      '#111111',
  muted:     '#555555',
  dim:       '#909090',

  // Inverse
  inv:       '#F5F5F3',
  invMid:    '#AAAAAA',

  // Chart palette
  chart: ['#111111', '#2E7D32', '#2563EB', '#6D28D9', '#E89F0C', '#D44C38', '#C8FF6E', '#0891B2'],
};

export const fonts = {
  display: "'TWK Everett', 'Helvetica Neue', sans-serif",
  body:    "'TWK Everett', 'Helvetica Neue', sans-serif",
  mono:    "'Chivo Mono', 'Space Mono', monospace",
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

export const shadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  elevated: '0 4px 16px rgba(0, 0, 0, 0.08)',
  glow: '0 0 40px rgba(200, 255, 110, 0.15)',
  glowStrong: '0 0 80px rgba(200, 255, 110, 0.25)',
};

export const LOGO_URL = "/netherops-logo.svg";
