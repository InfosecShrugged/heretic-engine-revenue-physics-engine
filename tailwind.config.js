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
          cardHover: '#F4F4F2',
          border: 'rgba(0,0,0,0.13)',
          borderLight: 'rgba(0,0,0,0.07)',
          accent: '#111111',
          accentMuted: 'rgba(0,0,0,0.06)',
          lime: '#C8FF6E',
          green: '#2E7D32',
          amber: '#E89F0C',
          rose: '#D44C38',
          violet: '#6D28D9',
          blue: '#2563EB',
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
