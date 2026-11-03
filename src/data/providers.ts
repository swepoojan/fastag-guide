// Central provider data. Descriptions and links live here; fees and verification dates live in
// rates.json, which the automatic checker (scripts/rates) keeps up to date from official pages.
// Figures are for a car / jeep / van (NPCI vehicle class 4).

import rates from './rates.json'
import type { VerifyStatus } from '../lib/calc'

export type ProviderId = 'hdfc' | 'icici' | 'axis' | 'sbi' | 'idfc' | 'airtel'

export interface Provider {
  id: ProviderId
  name: string
  short: string // logo monogram
  color: string // monogram background
  issuanceFee: number // ₹, one-time
  issuanceNote?: { en: string; hi: string }
  securityDeposit: number // ₹, refundable on closure
  minBalance: number | null // ₹ kept in wallet / first recharge; null = not stated
  minBalanceNote: { en: string; hi: string }
  recharge: { en: string; hi: string }
  apply: { en: string; hi: string }
  support: string | null // customer care number as published
  features: { en: string[]; hi: string[] }
  pros: { en: string[]; hi: string[] }
  cons: { en: string[]; hi: string[] }
  tags: Array<'online' | 'app' | 'freeUpi' | 'lowUpfront' | 'extras'>
  officialUrl: string // verified official page
  affiliateUrl: string | null // set only when an approved affiliate/referral link exists
  sourceUrl: string // page the figures were taken from
  verifiedOn: string // ISO date of the last successful automatic check
  status: VerifyStatus
  pendingSince: string | null // a possible change is being confirmed
}

type ProviderText = Omit<Provider, 'issuanceFee' | 'securityDeposit' | 'minBalance' | 'verifiedOn' | 'status' | 'pendingSince'>

const base: ProviderText[] = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    short: 'HD',
    color: '#0b3c8c',
    issuanceNote: { en: 'Including taxes', hi: 'टैक्स सहित' },
    minBalanceNote: { en: 'Nil minimum balance', hi: 'कोई न्यूनतम बैलेंस नहीं' },
    recharge: {
      en: 'Debit card: no fee. Net banking 1.7% + tax, credit card 0.9% + tax.',
      hi: 'डेबिट कार्ड: कोई फ़ीस नहीं। नेट बैंकिंग 1.7% + टैक्स, क्रेडिट कार्ड 0.9% + टैक्स।',
    },
    apply: { en: 'See HDFC Bank’s FASTag page for ways to buy', hi: 'खरीदने के तरीके HDFC बैंक के FASTag पेज पर देखें' },
    support: null,
    features: {
      en: ['No fee for debit card recharge', 'Reissue available if the tag is damaged'],
      hi: ['डेबिट कार्ड रिचार्ज पर कोई फ़ीस नहीं', 'टैग ख़राब होने पर दोबारा जारी करने की सुविधा'],
    },
    pros: { en: ['Debit card recharges are free'], hi: ['डेबिट कार्ड से रिचार्ज मुफ़्त'] },
    cons: { en: ['Net banking and credit card recharges carry a fee'], hi: ['नेट बैंकिंग और क्रेडिट कार्ड से रिचार्ज पर फ़ीस'] },
    tags: ['lowUpfront'],
    officialUrl: 'https://v.hdfc.bank.in/htdocs/common/fastag/feescharges.html',
    affiliateUrl: null,
    sourceUrl: 'https://v.hdfc.bank.in/htdocs/common/fastag/feescharges.html',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    short: 'IC',
    color: '#ae282e',
    issuanceNote: { en: 'Including GST', hi: 'GST सहित' },
    minBalanceNote: { en: 'Minimum recharge / threshold', hi: 'न्यूनतम रिचार्ज / थ्रेशोल्ड' },
    recharge: {
      en: 'No fee via ICICI net banking, UPI or cheque. Card and other banks’ net banking: gateway fees.',
      hi: 'ICICI नेट बैंकिंग, UPI या चेक से कोई फ़ीस नहीं। कार्ड और दूसरे बैंक की नेट बैंकिंग: गेटवे फ़ीस।',
    },
    apply: { en: 'Buy online on ICICI Bank’s FASTag page', hi: 'ICICI बैंक के FASTag पेज पर ऑनलाइन खरीदें' },
    support: '1800 2100 104',
    features: {
      en: ['Free recharge through UPI', 'Toll-free customer care'],
      hi: ['UPI से मुफ़्त रिचार्ज', 'टोल-फ़्री कस्टमर केयर'],
    },
    pros: { en: ['No recharge fee on UPI'], hi: ['UPI रिचार्ज पर कोई फ़ीस नहीं'] },
    cons: { en: ['Card recharges carry payment gateway fees'], hi: ['कार्ड रिचार्ज पर पेमेंट गेटवे फ़ीस'] },
    tags: ['online', 'freeUpi'],
    officialUrl: 'https://www.icici.bank.in/personal-banking/payments/fastag/fees-and-charges',
    affiliateUrl: null,
    sourceUrl: 'https://www.icici.bank.in/personal-banking/payments/fastag/fees-and-charges',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    short: 'AX',
    color: '#97144d',
    minBalanceNote: { en: 'Minimum first top-up', hi: 'न्यूनतम पहला टॉप-अप' },
    recharge: { en: 'Recharge charges not listed on the official page', hi: 'आधिकारिक पेज पर रिचार्ज शुल्क नहीं बताया गया' },
    apply: { en: 'Online on Axis Bank’s FASTag page or at a branch', hi: 'Axis बैंक के FASTag पेज पर ऑनलाइन या ब्रांच में' },
    support: '1800 419 8585',
    features: {
      en: ['Re-issuance available', 'Toll-free customer care'],
      hi: ['दोबारा जारी करने की सुविधा', 'टोल-फ़्री कस्टमर केयर'],
    },
    pros: { en: ['Simple, standard charges'], hi: ['सीधे, सामान्य शुल्क'] },
    cons: { en: ['Recharge fees not published on the charges page'], hi: ['शुल्क पेज पर रिचार्ज फ़ीस नहीं बताई गई'] },
    tags: ['online'],
    officialUrl: 'https://www.axis.bank.in/payments/fastag',
    affiliateUrl: null,
    sourceUrl: 'https://application.axis.bank.in/webforms/axis-support/sub-issues/Cards-fastag-applyforfastag-7.aspx',
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    short: 'SBI',
    color: '#22409a',
    minBalanceNote: { en: 'First-time top-up at issuance', hi: 'जारी करते समय पहला टॉप-अप' },
    recharge: { en: 'Recharge in YONO (Bill Payments → FASTag) or at SBI FASTag agents', hi: 'YONO (बिल पेमेंट → FASTag) या SBI FASTag एजेंट से रिचार्ज' },
    apply: { en: 'Online registration or at an SBI FASTag point of sale', hi: 'ऑनलाइन रजिस्ट्रेशन या SBI FASTag पॉइंट ऑफ़ सेल पर' },
    support: '1800 11 0018',
    features: {
      en: ['Online registration with RC upload', 'Large agent network for cash recharge'],
      hi: ['RC अपलोड के साथ ऑनलाइन रजिस्ट्रेशन', 'नकद रिचार्ज के लिए बड़ा एजेंट नेटवर्क'],
    },
    pros: { en: ['Easy if you already bank with SBI'], hi: ['SBI ग्राहकों के लिए आसान'] },
    cons: { en: ['Recharge fees not listed on the page'], hi: ['पेज पर रिचार्ज फ़ीस नहीं बताई गई'] },
    tags: ['online'],
    officialUrl: 'https://sbi.bank.in/web/personal-banking/digital/sbi-fastag',
    affiliateUrl: null,
    sourceUrl: 'https://sbi.bank.in/web/personal-banking/digital/sbi-fastag',
  },
  {
    id: 'idfc',
    name: 'IDFC FIRST Bank',
    short: 'ID',
    color: '#9c1d26',
    issuanceNote: { en: 'Including GST', hi: 'GST सहित' },
    minBalanceNote: { en: 'Minimum balance / initial recharge', hi: 'न्यूनतम बैलेंस / पहला रिचार्ज' },
    recharge: { en: 'Recharge charges not listed on the fees page', hi: 'फ़ीस पेज पर रिचार्ज शुल्क नहीं बताया गया' },
    apply: { en: 'Buy online on IDFC FIRST Bank’s FASTag page', hi: 'IDFC FIRST बैंक के FASTag पेज पर ऑनलाइन खरीदें' },
    support: null,
    features: {
      en: ['Optional yearly “Max” add-on', 'Tag replacement available'],
      hi: ['वैकल्पिक सालाना “Max” ऐड-ऑन', 'टैग बदलने की सुविधा'],
    },
    pros: { en: ['Optional extras through the Max add-on'], hi: ['Max ऐड-ऑन से अतिरिक्त सुविधाएँ'] },
    cons: { en: ['Max add-on is an extra yearly cost'], hi: ['Max ऐड-ऑन का सालाना अतिरिक्त खर्च'] },
    tags: ['online', 'extras'],
    officialUrl: 'https://www.idfcfirst.bank.in/personal-banking/fastag',
    affiliateUrl: null,
    sourceUrl: 'https://www.idfcfirst.bank.in/personal-banking/fastag/fees-and-charges',
  },
  {
    id: 'airtel',
    name: 'Airtel Payments Bank',
    short: 'AP',
    color: '#d71921',
    issuanceNote: { en: 'Including GST', hi: 'GST सहित' },
    minBalanceNote: { en: 'Keep ₹150 to avoid blacklisting', hi: 'ब्लैकलिस्ट से बचने के लिए ₹150 रखें' },
    recharge: { en: 'UPI, cards or net banking in the Airtel Thanks app; convenience fees may apply', hi: 'Airtel Thanks ऐप में UPI, कार्ड या नेट बैंकिंग; सुविधा शुल्क लग सकता है' },
    apply: { en: 'Buy in the Airtel Thanks app; delivery in up to 21 working days', hi: 'Airtel Thanks ऐप में खरीदें; डिलीवरी 21 कार्यदिवस तक' },
    support: '8800688006',
    features: {
      en: ['Buy and manage fully in the Airtel Thanks app', 'Needs an Airtel Payments Bank account or wallet'],
      hi: ['Airtel Thanks ऐप में ही खरीदें और मैनेज करें', 'Airtel Payments Bank खाता या वॉलेट ज़रूरी'],
    },
    pros: { en: ['Everything happens inside one app'], hi: ['सब कुछ एक ही ऐप में'] },
    cons: { en: ['Convenience fees may apply on recharge', 'Home delivery can take up to 21 working days'], hi: ['रिचार्ज पर सुविधा शुल्क लग सकता है', 'होम डिलीवरी में 21 कार्यदिवस तक लग सकते हैं'] },
    tags: ['app'],
    officialUrl: 'https://www.airtel.in/bank/products/fastag',
    affiliateUrl: null,
    sourceUrl: 'https://www.airtel.in/fastag-faq/',
  },
]

type RateEntry = { values: { issuanceFee: number; securityDeposit: number; minBalance: number }; status: string; lastVerified: string; pending: { firstSeen: string } | null }
const providerRates = rates.providers as Record<ProviderId, RateEntry>

export const providers: Provider[] = base.map((p) => {
  const r = providerRates[p.id]
  return {
    ...p,
    issuanceFee: r.values.issuanceFee,
    securityDeposit: r.values.securityDeposit,
    minBalance: r.values.minBalance,
    verifiedOn: r.lastVerified,
    status: r.status as VerifyStatus,
    pendingSince: r.pending?.firstSeen ?? null,
  }
})

/** The oldest successful check across all providers: the honest "last updated" date for the comparison. */
export const VERIFIED_ON = providers.map((p) => p.verifiedOn).sort()[0]

export interface RateChange { date: string; id: string; field: string; from: number; to: number }

/** Fee changes the checker published in the last 60 days, newest first. */
export function recentChanges(id: string, days = 60): RateChange[] {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  return (rates.history as RateChange[]).filter((e) => e.id === id && e.date >= cutoff).reverse()
}

/** Lowest and highest value of a fee across providers, for FAQ text. */
export function feeRange(field: 'issuanceFee' | 'securityDeposit' | 'minBalance') {
  const v = providers.map((p) => p[field] ?? 0)
  return [Math.min(...v), Math.max(...v)] as const
}

export const upfront = (p: Provider) => p.issuanceFee + p.securityDeposit + (p.minBalance ?? 0)

/** Link shown on "View provider": approved affiliate link if set, otherwise the verified official page. */
export const providerLink = (p: Provider) => p.affiliateUrl ?? p.officialUrl
export const isAffiliate = (p: Provider) => Boolean(p.affiliateUrl)
