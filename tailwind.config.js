/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['TWK Everett', 'Helvetica Neue', 'system-ui', 'sans-serif'],
        display: ['TWK Everett', 'Helvetica Neue', 'system-ui', 'sans-serif'],
        mono: ['Chivo Mono', 'Space Mono', 'monospace'],
      },
      colors: {
        nether: {
          bg: '#EBEBEB',
          surface: '#F4F4F2',
          card: '#FFFFFF',
          border: 'rgba(0,0,0,0.13)',
          borderLight: 'rgba(0,0,0,0.07)',
          // Rose — text accent on light
          rose: '#D64074',
          roseHover: '#C23668',
          roseDim: 'rgba(214,64,116,0.08)',
          // Lime — fill accent on light + everything on dark
          lime: '#C8FF6E',
          limeDark: '#9BE040',
          limeDim: 'rgba(200,255,110,0.12)',
          // Semantic
          green: '#1A8A4A',
          amber: '#C07800',
          red: '#CC3340',
          violet: '#7C4DDB',
          blue: '#2563EB',
          // Text
          text: '#111111',
          muted: '#555555',
          dim: '#909090',
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'elevated': '0 4px 16px rgba(0,0,0,0.08)',
      },
    }
  },
  plugins: [],
}
