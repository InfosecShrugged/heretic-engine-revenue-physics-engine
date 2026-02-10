/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        engine: {
          bg: '#0A0E17',
          card: '#111827',
          cardHover: '#1a2235',
          border: '#1e293b',
          borderLight: '#334155',
          accent: '#22d3ee',
          green: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
          blue: '#3b82f6',
        }
      }
    }
  },
  plugins: [],
}
