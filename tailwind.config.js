/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0e1b2c', soft: '#3b4a5e', mute: '#6a778a' },
        paper: '#f7f8f6',
        line: '#e3e7ea',
        brand: { 50: '#ecfaf4', 100: '#d2f3e4', 200: '#a6e6cb', 500: '#10a36b', 600: '#0b8a5a', 700: '#08704a', 900: '#063d2a' },
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
    },
  },
  plugins: [],
}
