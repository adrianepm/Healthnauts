/** @type {import('tailwindcss').Config} */
// Cores vêm dos tokens de src/index.css. A escala "slate" é remapeada para os dois tons de texto do tema,
// para todo texto ter contraste de pelo menos 4,5:1 sobre o fundo e o card (WCAG AA).
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: { bg: token('bg'), deep: token('bg'), card: token('card'), card2: token('card-2'), line: token('border'), strong: token('border-strong') },
        brand: { DEFAULT: token('brand'), soft: token('brand-soft') },
        slate: {
          50: token('text'), 100: token('text'), 200: token('text'),
          300: token('text-2'), 400: token('text-2'), 500: token('text-2'), 600: token('text-2'),
          700: token('border'), 800: token('card'), 900: token('bg'), 950: token('bg'),
        },
      },
      // Fonte base 16 px; o menor texto da tela fica em 14 px.
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }],
        sm: ['1rem', { lineHeight: '1.5rem' }],
        base: ['1.0625rem', { lineHeight: '1.6rem' }],
      },
      // Instrument Sans (interface) e JetBrains Mono (todos os números), instaladas por @fontsource-variable (sem CDN).
      fontFamily: {
        sans: ['"Instrument Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
