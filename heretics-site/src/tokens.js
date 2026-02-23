// ─── Heretic Engine Design System Tokens ───
// Shared design language across all Heretic Engine properties

export const colors = {
  // Backgrounds
  bg:        '#0A0E17',
  bgAlt:     '#0d1117',
  surface:   '#111827',
  surfaceHover: '#1a2235',

  // Borders
  border:    '#1e293b',
  borderL:   '#334155',

  // Brand accent
  accent:    '#22d3ee',
  accentDim: 'rgba(34, 211, 238, 0.12)',
  accentGlow: 'rgba(34, 211, 238, 0.25)',

  // Semantic
  green:     '#10b981',
  greenDim:  'rgba(16, 185, 129, 0.12)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245, 158, 11, 0.12)',
  rose:      '#f43f5e',
  roseDim:   'rgba(244, 63, 94, 0.12)',
  violet:    '#8b5cf6',
  violetDim: 'rgba(139, 92, 246, 0.12)',
  blue:      '#3b82f6',
  blueDim:   'rgba(59, 130, 246, 0.12)',

  // Typography
  text:      '#f1f5f9',
  muted:     '#94a3b8',
  dim:       '#64748b',

  // Chart palette
  chart: ['#22d3ee', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'],
};

export const fonts = {
  display: "'Space Grotesk', system-ui, sans-serif",
  body:    "'DM Sans', system-ui, sans-serif",
  mono:    "'DM Mono', monospace",
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
  card: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  elevated: '0 4px 24px rgba(0, 0, 0, 0.4)',
  glow: '0 0 40px rgba(34, 211, 238, 0.15)',
  glowStrong: '0 0 80px rgba(34, 211, 238, 0.25)',
};

export const LOGO_URL = "https://images.squarespace-cdn.com/content/v1/63d155fa93aba8529a061c8c/14b364ab-fc95-4c2d-ba6c-bca81e58a50f/HERETICS-LO.png?format=300w";

// Revenue Physics Engine app link — update when deployed
export const ENGINE_URL = "/";
