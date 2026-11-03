// Renders the social share image (public/og.png) at build time.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const rates = JSON.parse(readFileSync(new URL('../src/data/rates.json', import.meta.url), 'utf8'))
const inr = (n) => '₹' + n.toLocaleString('en-IN')

const row = (y, label, value, highlight = false) => `
  <text x="840" y="${y}" font-size="26" fill="#ffffff" font-family="DejaVu Sans, Arial, sans-serif">${label}</text>
  <text x="1140" y="${y}" font-size="26" text-anchor="end" fill="${highlight ? '#f5c430' : '#ffffff'}" font-weight="700" font-family="DejaVu Sans Mono, monospace">${value}</text>
  <line x1="840" y1="${y + 22}" x2="1140" y2="${y + 22}" stroke="#ffffff" stroke-opacity=".2" stroke-dasharray="6 6"/>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="g" cx="100%" cy="0%" r="70%"><stop offset="0" stop-color="#d2f3e4"/><stop offset="1" stop-color="#ffffff"/></radialGradient></defs>
  <rect width="800" height="630" fill="url(#g)"/>
  <rect x="800" width="400" height="630" fill="#0e1b2c"/>
  <g transform="translate(72 96) scale(1.4)">
    <rect width="32" height="32" rx="9" fill="#0e1b2c"/>
    <path d="M9 22 L14 10 h4 l5 12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 13.5 v2.5 M16 18.5 v2.5" stroke="#f5c430" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="24.5" cy="8.5" r="2.5" fill="#10a36b"/>
  </g>
  <text x="134" y="129" font-size="26" font-weight="700" letter-spacing="2" fill="#0e1b2c" font-family="DejaVu Sans, Arial, sans-serif">FASTAG GUIDE</text>
  <text x="72" y="270" font-size="64" font-weight="700" fill="#0e1b2c" font-family="DejaVu Sans, Arial, sans-serif">Find the right FASTag.</text>
  <text x="72" y="348" font-size="64" font-weight="700" fill="#6a778a" font-family="DejaVu Sans, Arial, sans-serif">Without the confusion.</text>
  <text x="72" y="430" font-size="28" fill="#3b4a5e" font-family="DejaVu Sans, Arial, sans-serif">Compare providers and see which toll pass</text>
  <text x="72" y="470" font-size="28" fill="#3b4a5e" font-family="DejaVu Sans, Arial, sans-serif">saves you the most.</text>
  <text x="840" y="200" font-size="17" font-weight="700" letter-spacing="2" fill="#a6e6cb" font-family="DejaVu Sans, Arial, sans-serif">TOLL PASSES · 2026-27</text>
  ${row(270, 'Local pass', inr(rates.passes.values.localOutside), true)}
  ${row(340, 'Annual pass', inr(rates.passes.values.annual))}
  ${row(410, 'Monthly pass', '≈ ₹350')}
  ${row(480, 'Pay per trip', 'Full toll')}
</svg>`

await sharp(Buffer.from(svg)).png({ palette: true, quality: 90 }).toFile('public/og.png')
// Home-screen icon for iOS, from the same mark as the favicon.
const mark = readFileSync(new URL('../public/favicon.svg', import.meta.url))
await sharp(mark, { density: 600 }).resize(180, 180).flatten({ background: '#0e1b2c' }).png().toFile('public/apple-touch-icon.png')
console.log('og.png and apple-touch-icon.png written')
