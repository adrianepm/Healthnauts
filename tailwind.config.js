/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060A12',
          900: '#0B1120',
          850: '#0F172A',
          800: '#162032',
          750: '#1E293B',
          700: '#26334D',
          600: '#334155',
          500: '#475569',
          400: '#64748B',
          300: '#94A3B8',
          200: '#CBD5E1',
          100: '#E2E8F0',
          50: '#F8FAFC',
        },
        astro: {
          cyan: '#38BDF8',
          blue: '#2563EB',
          green: '#22C55E',
          yellow: '#F59E0B',
          red: '#EF4444',
          gray: '#64748B',
          purple: '#A855F7',
          orange: '#F97316',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(56, 189, 248, 0.25)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.35)',
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.25)',
        'glow-yellow': '0 0 15px rgba(245, 158, 11, 0.25)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
