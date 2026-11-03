# FASTAG GUIDE

Find the right FASTag and the cheapest toll pass for your trips. Live at **https://fastag-guide.vercel.app**

A single-page site for Indian vehicle owners that:

- **Picks your cheapest toll option.** A short assistant compares the new FASTag Local Pass (₹1,500 / ₹3,000 a year, from 1 Nov 2026), the Annual Pass (₹3,075 for 2026-27, 200 crossings), the plaza's monthly pass, and paying per trip.
- **Compares FASTag providers.** Issuance fee, security deposit, minimum balance, recharge fees and how to apply for HDFC Bank, ICICI Bank, Axis Bank, SBI, IDFC FIRST Bank and Airtel Payments Bank, taken from each provider's official page.
- Works in **English and Hindi**, asks for no personal data, and runs entirely in the browser.

## Stack

React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide icons, Vite. Tests with Vitest.

## Develop

```bash
npm install
npm run dev     # local dev server
npm test        # cost and recommendation logic tests
npm run build   # builds the share image, type-checks and bundles to dist/
```

## Where to change things

| What | File |
| --- | --- |
| Provider fees, links, verification dates, affiliate links | `src/data/providers.ts` |
| Toll pass prices | `src/lib/calc.ts` (`PASS`) |
| Cost comparison logic | `src/lib/calc.ts` |
| Provider picks | `src/lib/recommend.ts` |
| All text, FAQs and legal copy (English + Hindi) | `src/i18n.tsx` |
| Brand name, contact email, official links | `src/config.ts` |
| Analytics events and sinks | `src/lib/analytics.ts` |

Set a provider's `affiliateUrl` only once you have an approved affiliate or referral link; until then the "View provider" button uses the verified official page. Picks never depend on commission.

## Disclaimer

FASTAG GUIDE is an independent informational and comparison platform. It is not NHAI, IHMCL or a FASTag issuing bank. Charges and eligibility change; verify with the provider before applying.
