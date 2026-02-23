/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        heretic: {
          bg: '#0A0E17',
          surface: '#0d1117',
          card: '#111827',
          cardHover: '#1a2235',
          border: '#1e293b',
          borderLight: '#334155',
          accent: '#22d3ee',
          accentMuted: 'rgba(34, 211, 238, 0.12)',
          green: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
          blue: '#3b82f6',
          text: '#f1f5f9',
          muted: '#94a3b8',
          dim: '#64748b',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.7s ease forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    }
  },
  plugins: [],
}
