// Where each figure comes from and how to find it on the page.
// Figures are for a car / jeep / van (NPCI vehicle class 4). Labels are tried in order.

const CLASS4 = /class\s*(?:-|:)?\s*4\b|vc\s*-?\s*4\b|car\s*\/\s*jeep\s*\/\s*van/i

const issuance = [/issuance\s*fee/i, /joining\s*fee/i, /tag\s*(?:cost|price)/i, /one[\s-]*time\s*fee/i]
const deposit = [/refundable\s*security\s*deposit/i, /security\s*deposit/i]
const minBal = [/minimum\s*balance/i, /threshold\s*(?:amount|balance)?/i, /minimum\s*recharge/i, /initial\s*(?:wallet\s*)?(?:top[\s-]*up|recharge)/i]

export const sources = {
  providers: {
    hdfc: {
      url: 'https://v.hdfc.bank.in/htdocs/common/fastag/feescharges.html',
      anchor: CLASS4,
      fields: { issuanceFee: { labels: issuance }, securityDeposit: { labels: deposit }, minBalance: { labels: minBal, allowNil: true } },
    },
    icici: {
      url: 'https://www.icici.bank.in/personal-banking/payments/fastag/fees-and-charges',
      anchor: CLASS4,
      fields: { issuanceFee: { labels: issuance }, securityDeposit: { labels: deposit }, minBalance: { labels: minBal, allowNil: true } },
    },
    axis: {
      url: 'https://application.axis.bank.in/webforms/axis-support/sub-issues/Cards-fastag-applyforfastag-7.aspx',
      fields: { issuanceFee: { labels: issuance }, securityDeposit: { labels: deposit }, minBalance: { labels: minBal, allowNil: true } },
    },
    sbi: {
      url: 'https://sbi.bank.in/web/personal-banking/digital/sbi-fastag',
      anchor: CLASS4,
      fields: { issuanceFee: { labels: issuance }, securityDeposit: { labels: deposit }, minBalance: { labels: minBal, allowNil: true } },
    },
    idfc: {
      url: 'https://www.idfcfirst.bank.in/personal-banking/fastag/fees-and-charges',
      anchor: CLASS4,
      fields: { issuanceFee: { labels: issuance }, securityDeposit: { labels: deposit }, minBalance: { labels: minBal, allowNil: true } },
    },
    airtel: {
      url: 'https://www.airtel.in/fastag-faq/',
      fields: { issuanceFee: { labels: issuance }, securityDeposit: { labels: deposit }, minBalance: { labels: minBal, allowNil: true } },
    },
  },
  passes: {
    url: 'https://rajmargyatra.nhai.gov.in/buy-fastag-local-pass',
    fields: {
      annual: { labels: [/annual\s*pass/i] },
      localOutside: { labels: [/outside\s*(?:the\s*)?(?:municipal|town|local)/i] },
      localInside: { labels: [/(?:inside|within)\s*(?:the\s*)?(?:municipal|town|local)/i] },
    },
  },
}
