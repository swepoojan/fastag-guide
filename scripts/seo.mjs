// Writes robots.txt, sitemap.xml and llms.txt into dist/, all using the one base URL from .env.
import { readFileSync, writeFileSync } from 'node:fs'
import { SITE_URL } from './site.mjs'

const rates = JSON.parse(readFileSync(new URL('../src/data/rates.json', import.meta.url), 'utf8'))
const dist = (f) => new URL(`../dist/${f}`, import.meta.url)
const lastmod = Object.values(rates.providers).map((p) => p.lastVerified).concat(rates.passes.lastVerified).sort().at(-1)
const inr = (n) => '₹' + n.toLocaleString('en-IN')

writeFileSync(dist('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)

writeFileSync(dist('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
  </url>
</urlset>
`)

const names = { hdfc: 'HDFC Bank', icici: 'ICICI Bank', axis: 'Axis Bank', sbi: 'State Bank of India', idfc: 'IDFC FIRST Bank', airtel: 'Airtel Payments Bank' }
const rows = Object.entries(rates.providers)
  .map(([id, p]) => `- ${names[id]}: issuance fee ${inr(p.values.issuanceFee)}, refundable security deposit ${inr(p.values.securityDeposit)}, minimum balance ${inr(p.values.minBalance)} (last verified ${p.lastVerified})`)
  .join('\n')
const pass = rates.passes.values

writeFileSync(dist('llms.txt'), `# FASTAG GUIDE

> A free tool by Technokari that helps Indian car, jeep and van owners pick the cheapest way to pay national highway toll, and compares FASTag providers' charges. Figures are read from official pages and re-checked automatically every day.

Site: ${SITE_URL}/

## Toll passes (tax year 2026-27, private non-commercial vehicles)

- FASTag Annual Pass: ${inr(pass.annual)}; valid for 200 toll plaza crossings or one year, whichever ends first, at national highway and national expressway fee plazas. A return trip counts as two crossings.
- FASTag Local Pass (from 1 November 2026): ${inr(pass.localOutside)} a year if the plaza is outside municipal or town limits, ${inr(pass.localInside)} if inside. Unlimited crossings at one plaza within 20 km of the owner's registered address. Sold at plazas, and in NHAI's RajmargYatra app from 1 December 2026.
- Both passes work on an existing FASTag from any issuer.

## FASTag charges for a car, jeep or van (NPCI vehicle class 4)

${rows}

## Sources

- NHAI RajmargYatra: https://rajmargyatra.nhai.gov.in/
- Each bank's official FASTag fees page, linked on the site.

FASTAG GUIDE is independent. It is not NHAI, IHMCL or a FASTag issuing bank.
`)
console.log(`wrote robots.txt, sitemap.xml and llms.txt for ${SITE_URL}`)
