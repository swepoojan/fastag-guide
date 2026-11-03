# FASTAG GUIDE

Find the right FASTag and the cheapest toll pass for your trips. A free tool by Technokari, live at **https://fastag.tools.technokari.com**

A single-page site for Indian vehicle owners that:

- **Picks your cheapest toll option.** A short assistant compares the new FASTag Local Pass (₹1,500 / ₹3,000 a year, from 1 Nov 2026), the Annual Pass (₹3,075 for 2026-27, 200 crossings), the plaza's monthly pass, and paying per trip.
- **Compares FASTag providers.** Issuance fee, security deposit, minimum balance, recharge fees and how to apply for HDFC Bank, ICICI Bank, Axis Bank, SBI, IDFC FIRST Bank and Airtel Payments Bank, taken from each provider's official page.
- Works in **English and Hindi**, asks for no personal data, and runs entirely in the browser.

## Stack

React 18, TypeScript, Tailwind CSS, Lucide icons, Vite. Tests with Vitest. The page is prerendered to static HTML at build time (so search engines and AI crawlers see the full content) and hydrated in the browser.

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # cost and recommendation logic tests
npm run build   # share image, type-check, bundle, prerender to HTML, robots/sitemap/llms.txt → dist/
```

## Site address (one place)

The public address is set once, in `.env`:

```
VITE_SITE_URL=https://fastag.tools.technokari.com
```

Canonical link, Open Graph and Twitter tags, structured data, `robots.txt`, `sitemap.xml` and `llms.txt` all read it at build time. To move the site, change this line (or set `VITE_SITE_URL` in Vercel → Project → Settings → Environment Variables, which overrides `.env`), add the new domain in Vercel, and redeploy.

## Where to change things

| What | File |
| --- | --- |
| Provider descriptions, links, affiliate links | `src/data/providers.ts` |
| Fees, pass prices, verification dates, change history (updated automatically) | `src/data/rates.json` |
| Where the checker reads each figure | `scripts/rates/sources.mjs` |
| Cost comparison logic | `src/lib/calc.ts` |
| Provider picks | `src/lib/recommend.ts` |
| All text, FAQs and legal copy (English + Hindi) | `src/i18n.tsx` |
| Brand name, publisher, contact email, official links | `src/config.ts` |
| Security headers and caching | `vercel.json` |
| Analytics events and sinks | `src/lib/analytics.ts` |

Set a provider's `affiliateUrl` only once you have an approved affiliate or referral link; until then the "View provider" button uses the verified official page. Picks never depend on commission.

## Automatic rate updates

A GitHub Actions job (`.github/workflows/check-rates.yml`) runs daily, plus every 5 minutes during a 24-hour test window. It reads each official page twice and updates `src/data/rates.json` on its own, with these safeguards:

- A value must be in a plausible range and must not jump by more than ₹150 or 100% at once.
- A new value must be seen on **two checks in a row** before it is published, so a one-off glitch is ignored.
- If a page can't be read twice in a row, the old figure stays and the site shows "Couldn't verify since …" instead of a fresh date.
- It commits only when something changed; Vercel then redeploys. `scripts/rates/report.json` records what was found on each page.

See it work without touching live data:

```bash
npm test                                         # includes the fee-change simulation
node scripts/rates/simulate.mjs /tmp/demo.json   # step-by-step log of a ₹100 → ₹120 change
node scripts/rates/run.mjs --dry-run             # check the live sources, write nothing
```

## Disclaimer

FASTAG GUIDE is an independent informational and comparison platform. It is not NHAI, IHMCL or a FASTag issuing bank. Charges and eligibility change; verify with the provider before applying.
