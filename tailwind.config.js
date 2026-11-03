/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0e1b2c', soft: '#3b4a5e', mute: '#5f6b7e' }, // mute ≥ 4.5:1 on white and paper
        paper: '#f7f8f6',
        line: '#e3e7ea',
        brand: { 50: '#ecfaf4', 100: '#d2f3e4', 200: '#a6e6cb', 500: '#10a36b', 600: '#08805a', 700: '#08704a', 900: '#063d2a' }, // 600 carries white text at ≥ 4.5:1
        amber: { 400: '#f5c430', 500: '#e8ad00' },
      },
      fontFamily: {
        sans: ['Geist', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(14,27,44,.04), 0 8px 24px -8px rgba(14,27,44,.10)',
        lift: '0 2px 4px rgba(14,27,44,.05), 0 24px 48px -16px rgba(14,27,44,.18)',
      },
      maxWidth: { page: '1140px' },
      keyframes: { fadeUp: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } } },
      animation: { 'fade-up': 'fadeUp .22s ease-out both' },
    },
  },
  plugins: [],
}
