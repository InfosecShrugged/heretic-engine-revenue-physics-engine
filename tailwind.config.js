/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Oxanium', 'system-ui', 'sans-serif'],
        display: ['Oxanium', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        heretic: {
          bg: '#f0f0f0',
          surface: '#f8f8f8',
          card: '#ffffff',
          cardHover: '#f8f8f8',
          border: '#d9d9d9',
          borderLight: '#ccc',
          accent: '#ff6e3e',
          accentMuted: 'rgba(255, 110, 62, 0.10)',
          green: '#2d8a56',
          amber: '#c07800',
          rose: '#d42e4a',
          violet: '#7c4ddb',
          blue: '#2563eb',
          text: '#1a1918',
          muted: '#747474',
          dim: '#a3a3a3',
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
